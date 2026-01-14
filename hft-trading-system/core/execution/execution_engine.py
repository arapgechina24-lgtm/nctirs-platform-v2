"""
Execution Engine with advanced order types:
- VWAP (Volume Weighted Average Price)
- Iceberg Orders
- Smart Order Routing (SOR)
"""
import asyncio
import logging
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from collections import defaultdict
import numpy as np

from core.data_structures.order import (
    Order, IcebergOrder, VWAPOrder, Fill,
    OrderStatus, OrderSide, OrderType
)
from core.data_structures.market_data import OrderBook
from core.market_data.fix_gateway import FIXGateway


class ExecutionEngine:
    """
    Core execution engine supporting institutional-grade order types
    """

    def __init__(self, venues: Dict[str, FIXGateway], config: Dict):
        self.venues = venues  # Multiple liquidity pools
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)

        # Order tracking
        self.active_orders: Dict[str, Order] = {}
        self.parent_orders: Dict[str, Order] = {}  # Track parent orders for iceberg/VWAP
        self.child_orders: Dict[str, List[str]] = defaultdict(list)
        self.fills: List[Fill] = []

        # Market data cache
        self.order_books: Dict[str, Dict[str, OrderBook]] = defaultdict(dict)  # {venue: {symbol: OrderBook}}
        self.volume_profiles: Dict[str, List[float]] = defaultdict(list)  # Historical volume

        # Execution callbacks
        self.on_fill_callback: Optional[Callable] = None
        self.on_order_update_callback: Optional[Callable] = None

        # Register market data handlers
        for venue_name, gateway in self.venues.items():
            gateway.register_order_book_handler(
                lambda symbol, ob, v=venue_name: self._on_order_book_update(v, symbol, ob)
            )
            gateway.register_execution_handler(self._on_execution_report)

    async def submit_order(self, order: Order, risk_check_callback: Optional[Callable] = None) -> bool:
        """
        Submit order with optional pre-trade risk check
        """
        # Pre-trade risk check
        if risk_check_callback:
            risk_approved, reason = await risk_check_callback(order)
            if not risk_approved:
                self.logger.warning(f"Order rejected by risk: {reason}")
                order.status = OrderStatus.REJECTED
                return False

        # Route based on order type
        if order.order_type == OrderType.ICEBERG:
            return await self._execute_iceberg(order)
        elif order.order_type == OrderType.VWAP:
            return await self._execute_vwap(order)
        elif order.order_type in [OrderType.LIMIT, OrderType.MARKET]:
            return await self._execute_standard(order)
        else:
            self.logger.error(f"Unsupported order type: {order.order_type}")
            return False

    async def _execute_standard(self, order: Order) -> bool:
        """Execute standard limit/market order with SOR"""
        # Smart Order Routing: find best venue
        best_venue = await self._smart_order_routing(order)

        if not best_venue:
            self.logger.error(f"No venue available for {order.symbol}")
            return False

        order.venue = best_venue
        self.active_orders[order.order_id] = order

        # Send to venue
        gateway = self.venues[best_venue]
        success = await gateway.send_order(order)

        if success:
            self.logger.info(f"Order {order.order_id} routed to {best_venue}")
        else:
            del self.active_orders[order.order_id]

        return success

    async def _execute_iceberg(self, iceberg_order: IcebergOrder) -> bool:
        """
        Execute iceberg order by splitting into child orders
        Only displays small portion of total size
        """
        self.parent_orders[iceberg_order.order_id] = iceberg_order
        self.logger.info(
            f"Starting iceberg execution: {iceberg_order.order_id}, "
            f"total={iceberg_order.quantity}, display={iceberg_order.display_quantity}"
        )

        # Create first child order
        return await self._spawn_iceberg_child(iceberg_order)

    async def _spawn_iceberg_child(self, parent: IcebergOrder) -> bool:
        """Spawn next child order for iceberg"""
        remaining = parent.remaining_quantity

        if remaining <= 0:
            parent.status = OrderStatus.FILLED
            self.logger.info(f"Iceberg order {parent.order_id} completed")
            return True

        # Create child order
        child_qty = min(parent.display_quantity, remaining)
        child_order = Order(
            symbol=parent.symbol,
            side=parent.side,
            order_type=OrderType.LIMIT,
            quantity=child_qty,
            price=parent.price,
            parent_order_id=parent.order_id,
            strategy_id=parent.strategy_id
        )

        self.child_orders[parent.order_id].append(child_order.order_id)
        self.active_orders[child_order.order_id] = child_order

        # Route to best venue
        best_venue = await self._smart_order_routing(child_order)
        child_order.venue = best_venue

        gateway = self.venues[best_venue]
        success = await gateway.send_order(child_order)

        self.logger.info(
            f"Spawned iceberg child {child_order.order_id} "
            f"(qty={child_qty}, remaining={remaining})"
        )

        return success

    async def _execute_vwap(self, vwap_order: VWAPOrder) -> bool:
        """
        Execute VWAP order by splitting across time slices
        Aims to match volume-weighted average price
        """
        self.parent_orders[vwap_order.order_id] = vwap_order
        self.logger.info(
            f"Starting VWAP execution: {vwap_order.order_id}, "
            f"qty={vwap_order.quantity}, slices={vwap_order.num_slices}"
        )

        # Schedule VWAP slices
        asyncio.create_task(self._run_vwap_schedule(vwap_order))
        return True

    async def _run_vwap_schedule(self, vwap_order: VWAPOrder):
        """Execute VWAP schedule across time slices"""
        if not vwap_order.end_time:
            # Default to 1 hour execution window
            vwap_order.end_time = datetime.utcnow() + timedelta(hours=1)

        total_duration = (vwap_order.end_time - vwap_order.start_time).total_seconds()
        slice_duration = total_duration / vwap_order.num_slices

        # Historical volume profile (simplified - in production use actual data)
        volume_profile = self._get_volume_profile(vwap_order.symbol)
        if not volume_profile:
            # Uniform distribution as fallback
            volume_profile = [1.0 / vwap_order.num_slices] * vwap_order.num_slices

        for slice_idx in range(vwap_order.num_slices):
            if vwap_order.remaining_quantity <= 0:
                break

            # Calculate slice quantity based on volume profile
            slice_qty = vwap_order.quantity * volume_profile[slice_idx]
            slice_qty = min(slice_qty, vwap_order.remaining_quantity)

            # Get current market data
            best_venue = await self._smart_order_routing(vwap_order)
            order_book = self.order_books[best_venue].get(vwap_order.symbol)

            if order_book:
                # Participate at specified rate of current volume
                # In production, would track real-time volume
                participation_qty = slice_qty * vwap_order.participation_rate

                # Create child order
                child_order = Order(
                    symbol=vwap_order.symbol,
                    side=vwap_order.side,
                    order_type=OrderType.LIMIT,
                    quantity=participation_qty,
                    price=order_book.mid_price,  # Start at mid, adjust as needed
                    parent_order_id=vwap_order.order_id
                )

                self.child_orders[vwap_order.order_id].append(child_order.order_id)
                self.active_orders[child_order.order_id] = child_order

                gateway = self.venues[best_venue]
                await gateway.send_order(child_order)

                self.logger.info(
                    f"VWAP slice {slice_idx + 1}/{vwap_order.num_slices}: "
                    f"qty={participation_qty:.2f}, price={order_book.mid_price}"
                )

            # Wait for next slice
            await asyncio.sleep(slice_duration)

        self.logger.info(f"VWAP execution completed: {vwap_order.order_id}")

    async def _smart_order_routing(self, order: Order) -> Optional[str]:
        """
        Smart Order Routing: Select best venue based on:
        - Liquidity
        - Spread
        - Fees
        - Historical fill rates
        """
        best_venue = None
        best_score = float('-inf')

        for venue_name, gateway in self.venues.items():
            if order.symbol not in self.order_books[venue_name]:
                continue

            order_book = self.order_books[venue_name][order.symbol]

            # Score based on multiple factors
            score = self._calculate_venue_score(order, order_book, venue_name)

            if score > best_score:
                best_score = score
                best_venue = venue_name

        return best_venue

    def _calculate_venue_score(self, order: Order, order_book: OrderBook, venue: str) -> float:
        """Calculate venue quality score"""
        score = 0.0

        # Factor 1: Liquidity depth
        side = "BUY" if order.side == OrderSide.BUY else "SELL"
        available_liquidity = sum(
            level.quantity for level in
            (order_book.asks[:5] if side == "BUY" else order_book.bids[:5])
        )
        if available_liquidity >= order.quantity:
            score += 100
        else:
            score += (available_liquidity / order.quantity) * 100

        # Factor 2: Spread tightness
        if order_book.spread > 0:
            spread_bps = (order_book.spread / order_book.mid_price) * 10000
            score += max(0, 50 - spread_bps)  # Prefer tighter spreads

        # Factor 3: Fees (from config)
        fee_bps = self.config.get('venue_fees', {}).get(venue, 10)
        score -= fee_bps

        return score

    def _get_volume_profile(self, symbol: str) -> List[float]:
        """Get historical volume profile for symbol"""
        # Simplified - in production, query from database
        if symbol in self.volume_profiles:
            return self.volume_profiles[symbol]

        # Default U-shaped intraday pattern
        return [0.08, 0.06, 0.05, 0.05, 0.06, 0.07, 0.09, 0.11, 0.13, 0.10, 0.08, 0.07, 0.05]

    async def _on_order_book_update(self, venue: str, symbol: str, order_book: OrderBook):
        """Handle order book updates from venue"""
        self.order_books[venue][symbol] = order_book

    async def _on_execution_report(self, order: Order):
        """Handle execution reports from venue"""
        if order.order_id not in self.active_orders:
            return

        self.active_orders[order.order_id] = order

        # Handle fills
        if order.status == OrderStatus.FILLED or order.status == OrderStatus.PARTIAL_FILL:
            fill = Fill(
                order_id=order.order_id,
                symbol=order.symbol,
                side=order.side,
                quantity=order.filled_quantity,
                price=order.average_fill_price,
                venue=order.venue
            )
            self.fills.append(fill)

            # Update parent order if this is a child
            if order.parent_order_id:
                await self._update_parent_order(order)

            if self.on_fill_callback:
                await self.on_fill_callback(fill)

        # Callback
        if self.on_order_update_callback:
            await self.on_order_update_callback(order)

    async def _update_parent_order(self, child_order: Order):
        """Update parent order based on child fill"""
        parent_id = child_order.parent_order_id
        if parent_id not in self.parent_orders:
            return

        parent = self.parent_orders[parent_id]
        parent.filled_quantity += child_order.filled_quantity

        # Recalculate average fill price
        total_notional = parent.average_fill_price * (parent.filled_quantity - child_order.filled_quantity)
        total_notional += child_order.average_fill_price * child_order.filled_quantity
        parent.average_fill_price = total_notional / parent.filled_quantity

        # Spawn next child for iceberg orders
        if isinstance(parent, IcebergOrder) and child_order.status == OrderStatus.FILLED:
            await self._spawn_iceberg_child(parent)

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel active order"""
        if order_id not in self.active_orders:
            self.logger.warning(f"Order {order_id} not found")
            return False

        order = self.active_orders[order_id]
        gateway = self.venues.get(order.venue)

        if gateway:
            success = await gateway.cancel_order(order_id)
            if success:
                order.status = OrderStatus.CANCELLED
                del self.active_orders[order_id]
            return success

        return False

    def get_order_status(self, order_id: str) -> Optional[Order]:
        """Get current order status"""
        return self.active_orders.get(order_id) or self.parent_orders.get(order_id)

    def get_fills(self, symbol: Optional[str] = None) -> List[Fill]:
        """Get all fills, optionally filtered by symbol"""
        if symbol:
            return [f for f in self.fills if f.symbol == symbol]
        return self.fills
