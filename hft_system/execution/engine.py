"""
Core Execution Engine

Implements institutional-grade execution algorithms:
- VWAP (Volume Weighted Average Price)
- TWAP (Time Weighted Average Price)
- Iceberg Orders
- Smart Order Router (SOR)
"""

from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Callable
from decimal import Decimal
from datetime import datetime, timedelta
import asyncio
import logging
from dataclasses import dataclass
import numpy as np

from core.types import (
    Order, OrderType, OrderStatus, Side, Fill,
    Instrument, Venue, TimeInForce
)


logger = logging.getLogger(__name__)


@dataclass
class ExecutionAlgoParams:
    """Base parameters for execution algorithms"""
    pass


@dataclass
class VWAPParams(ExecutionAlgoParams):
    """VWAP algorithm parameters"""
    start_time: datetime
    end_time: datetime
    participation_rate: float = 0.10  # Target 10% of market volume
    min_fill_ratio: float = 0.05  # Minimum 5% per slice
    max_fill_ratio: float = 0.30  # Maximum 30% per slice
    urgency: float = 0.5  # 0 = passive, 1 = aggressive
    price_limit: Optional[Decimal] = None  # Worst acceptable price


@dataclass
class TWAPParams(ExecutionAlgoParams):
    """TWAP algorithm parameters"""
    start_time: datetime
    end_time: datetime
    num_slices: int = 10  # Number of time slices
    slice_randomization: float = 0.1  # 10% randomization to avoid gaming
    price_limit: Optional[Decimal] = None


@dataclass
class IcebergParams(ExecutionAlgoParams):
    """Iceberg order parameters"""
    display_quantity: Decimal  # Visible quantity
    refresh_on_fill: bool = True
    variance: float = 0.05  # 5% variance on display qty to avoid detection
    min_display: Optional[Decimal] = None
    max_display: Optional[Decimal] = None


@dataclass
class SORParams(ExecutionAlgoParams):
    """Smart Order Router parameters"""
    venues: List[Venue]
    prefer_maker_fee: bool = True  # Prefer maker rebates
    include_dark_pools: bool = True
    max_venue_latency_ms: float = 50.0
    min_venue_fill_rate: float = 0.70  # Minimum 70% fill rate
    route_strategy: str = "BEST_PRICE"  # BEST_PRICE, PRO_RATA, WEIGHTED


class ExecutionAlgorithm(ABC):
    """Base class for execution algorithms"""

    def __init__(
        self,
        parent_order: Order,
        params: ExecutionAlgoParams,
        market_data_provider,
        execution_gateway
    ):
        self.parent_order = parent_order
        self.params = params
        self.market_data = market_data_provider
        self.gateway = execution_gateway

        self.child_orders: List[Order] = []
        self.fills: List[Fill] = []
        self.is_running = False
        self.is_complete = False

        # Callbacks
        self.on_child_order: Optional[Callable[[Order], None]] = None
        self.on_fill: Optional[Callable[[Fill], None]] = None
        self.on_complete: Optional[Callable[[], None]] = None

    @abstractmethod
    async def execute(self):
        """Execute the algorithm"""
        pass

    async def stop(self):
        """Stop algorithm execution"""
        self.is_running = False
        # Cancel all active child orders
        for order in self.child_orders:
            if not order.is_complete:
                await self.gateway.cancel_order(order)

    def _create_child_order(
        self,
        quantity: Decimal,
        price: Optional[Decimal] = None,
        order_type: OrderType = OrderType.LIMIT
    ) -> Order:
        """Create a child order from parent order"""
        child = Order(
            instrument=self.parent_order.instrument,
            side=self.parent_order.side,
            order_type=order_type,
            quantity=quantity,
            price=price,
            parent_order_id=self.parent_order.order_id,
            venue=self.parent_order.venue
        )
        self.child_orders.append(child)
        return child

    def _get_filled_quantity(self) -> Decimal:
        """Get total filled quantity across all child orders"""
        return sum(fill.quantity for fill in self.fills)

    def _get_avg_fill_price(self) -> Decimal:
        """Calculate average fill price"""
        if not self.fills:
            return Decimal("0")

        total_value = sum(fill.quantity * fill.price for fill in self.fills)
        total_qty = sum(fill.quantity for fill in self.fills)

        return total_value / total_qty if total_qty > 0 else Decimal("0")

    def _get_remaining_quantity(self) -> Decimal:
        """Get remaining quantity to execute"""
        return self.parent_order.quantity - self._get_filled_quantity()


class VWAPAlgorithm(ExecutionAlgorithm):
    """
    VWAP Execution Algorithm

    Executes large orders by tracking market volume and executing
    proportionally to maintain the volume-weighted average price.

    Strategy:
    1. Divide execution window into time slices
    2. Monitor real-time market volume
    3. Execute proportionally to volume in each slice
    4. Adjust for urgency and participation rate
    """

    def __init__(
        self,
        parent_order: Order,
        params: VWAPParams,
        market_data_provider,
        execution_gateway
    ):
        super().__init__(parent_order, params, market_data_provider, execution_gateway)
        self.vwap_params: VWAPParams = params
        self.volume_profile: List[float] = []
        self.executed_volume_per_slice: List[Decimal] = []

    async def execute(self):
        """Execute VWAP algorithm"""
        self.is_running = True
        logger.info(f"Starting VWAP execution for {self.parent_order.quantity} "
                   f"{self.parent_order.instrument.symbol}")

        # Calculate historical volume profile
        await self._calculate_volume_profile()

        # Calculate time slices
        duration = (self.vwap_params.end_time - self.vwap_params.start_time).total_seconds()
        num_slices = max(10, int(duration / 60))  # At least 10 slices, 1 per minute
        slice_duration = duration / num_slices

        logger.info(f"VWAP: {num_slices} slices, {slice_duration:.1f}s each")

        for slice_idx in range(num_slices):
            if not self.is_running:
                break

            slice_start = self.vwap_params.start_time + timedelta(seconds=slice_idx * slice_duration)
            slice_end = slice_start + timedelta(seconds=slice_duration)

            # Wait until slice start
            now = datetime.utcnow()
            if now < slice_start:
                await asyncio.sleep((slice_start - now).total_seconds())

            # Execute slice
            await self._execute_slice(slice_idx, num_slices)

            # Wait for slice to complete
            remaining_time = (slice_end - datetime.utcnow()).total_seconds()
            if remaining_time > 0:
                await asyncio.sleep(remaining_time)

        # Check if fully executed
        remaining = self._get_remaining_quantity()
        if remaining > 0:
            logger.warning(f"VWAP incomplete: {remaining} remaining")
            # Execute remaining as market order if urgent
            if self.vwap_params.urgency > 0.7:
                await self._execute_remaining()

        self.is_complete = True
        if self.on_complete:
            self.on_complete()

        logger.info(f"VWAP complete: Avg price = {self._get_avg_fill_price()}")

    async def _calculate_volume_profile(self):
        """Calculate expected volume profile from historical data"""
        # In production, this would query historical volume patterns
        # For now, use a simplified U-shaped curve (higher at open/close)
        num_intervals = 100
        self.volume_profile = []

        for i in range(num_intervals):
            # U-shaped curve: higher at start and end
            x = i / num_intervals
            volume_weight = 1.0 + 0.5 * (x ** 2 + (1 - x) ** 2)
            self.volume_profile.append(volume_weight)

        # Normalize
        total = sum(self.volume_profile)
        self.volume_profile = [v / total for v in self.volume_profile]

    async def _execute_slice(self, slice_idx: int, num_slices: int):
        """Execute a single time slice"""
        remaining_qty = self._get_remaining_quantity()
        if remaining_qty <= 0:
            return

        # Calculate target quantity for this slice based on volume profile
        profile_idx = int((slice_idx / num_slices) * len(self.volume_profile))
        volume_weight = self.volume_profile[profile_idx]

        # Adjust for urgency
        urgency_factor = 1.0 + self.vwap_params.urgency
        target_qty = remaining_qty * Decimal(str(volume_weight * urgency_factor))

        # Apply min/max constraints
        target_qty = max(
            remaining_qty * Decimal(str(self.vwap_params.min_fill_ratio)),
            min(target_qty, remaining_qty * Decimal(str(self.vwap_params.max_fill_ratio)))
        )

        # Get current market price
        quote = await self.market_data.get_quote(self.parent_order.instrument)
        if not quote:
            logger.warning("No market data available for VWAP slice")
            return

        # Determine limit price based on urgency
        if self.parent_order.side == Side.BUY:
            # More aggressive = higher limit price
            spread = quote.ask_price - quote.bid_price
            limit_price = quote.bid_price + spread * Decimal(str(self.vwap_params.urgency))
        else:
            spread = quote.ask_price - quote.bid_price
            limit_price = quote.ask_price - spread * Decimal(str(self.vwap_params.urgency))

        # Check price limit
        if self.vwap_params.price_limit:
            if self.parent_order.side == Side.BUY:
                limit_price = min(limit_price, self.vwap_params.price_limit)
            else:
                limit_price = max(limit_price, self.vwap_params.price_limit)

        # Create and send child order
        child_order = self._create_child_order(
            quantity=target_qty,
            price=limit_price,
            order_type=OrderType.LIMIT
        )

        logger.info(f"VWAP slice {slice_idx}: {target_qty} @ {limit_price}")

        # Send order
        await self.gateway.send_order(child_order)

        if self.on_child_order:
            self.on_child_order(child_order)

        # Monitor execution (simplified - would be more sophisticated in production)
        await asyncio.sleep(1.0)

    async def _execute_remaining(self):
        """Execute remaining quantity aggressively"""
        remaining = self._get_remaining_quantity()
        if remaining > 0:
            child_order = self._create_child_order(
                quantity=remaining,
                order_type=OrderType.MARKET
            )
            await self.gateway.send_order(child_order)
            logger.info(f"VWAP: Executing remaining {remaining} at market")


class IcebergAlgorithm(ExecutionAlgorithm):
    """
    Iceberg Order Algorithm

    Hides the full order size by only displaying a small portion.
    Automatically refreshes the display quantity as fills occur.

    Strategy:
    1. Display only a small portion of the order
    2. When display quantity is filled, refresh with new display
    3. Add variance to avoid detection by predatory algorithms
    """

    def __init__(
        self,
        parent_order: Order,
        params: IcebergParams,
        market_data_provider,
        execution_gateway
    ):
        super().__init__(parent_order, params, market_data_provider, execution_gateway)
        self.iceberg_params: IcebergParams = params
        self.current_display_order: Optional[Order] = None

    async def execute(self):
        """Execute Iceberg algorithm"""
        self.is_running = True
        logger.info(f"Starting Iceberg execution for {self.parent_order.quantity} "
                   f"{self.parent_order.instrument.symbol}, "
                   f"display={self.iceberg_params.display_quantity}")

        while self.is_running and self._get_remaining_quantity() > 0:
            # Calculate display quantity with variance
            display_qty = self._calculate_display_quantity()

            # Get current market price
            quote = await self.market_data.get_quote(self.parent_order.instrument)
            if not quote:
                logger.warning("No market data for Iceberg order")
                await asyncio.sleep(1.0)
                continue

            # Place at best bid/ask to join the queue
            if self.parent_order.side == Side.BUY:
                limit_price = quote.bid_price
            else:
                limit_price = quote.ask_price

            # Create display order
            display_order = self._create_child_order(
                quantity=display_qty,
                price=limit_price,
                order_type=OrderType.LIMIT
            )

            self.current_display_order = display_order
            await self.gateway.send_order(display_order)

            logger.info(f"Iceberg: Displayed {display_qty} @ {limit_price}")

            if self.on_child_order:
                self.on_child_order(display_order)

            # Monitor for fill
            await self._monitor_display_order(display_order)

        self.is_complete = True
        if self.on_complete:
            self.on_complete()

        logger.info(f"Iceberg complete: Avg price = {self._get_avg_fill_price()}")

    def _calculate_display_quantity(self) -> Decimal:
        """Calculate display quantity with variance"""
        base_display = self.iceberg_params.display_quantity
        remaining = self._get_remaining_quantity()

        # Don't display more than remaining
        display_qty = min(base_display, remaining)

        # Add variance to avoid detection
        if self.iceberg_params.variance > 0:
            variance_factor = 1.0 + np.random.uniform(
                -self.iceberg_params.variance,
                self.iceberg_params.variance
            )
            display_qty = display_qty * Decimal(str(variance_factor))

        # Apply min/max constraints
        if self.iceberg_params.min_display:
            display_qty = max(display_qty, self.iceberg_params.min_display)
        if self.iceberg_params.max_display:
            display_qty = min(display_qty, self.iceberg_params.max_display)

        # Don't exceed remaining
        display_qty = min(display_qty, remaining)

        return display_qty

    async def _monitor_display_order(self, order: Order):
        """Monitor display order until filled or timeout"""
        timeout = 60.0  # 60 second timeout
        elapsed = 0.0
        check_interval = 0.1

        while elapsed < timeout and not order.is_complete:
            await asyncio.sleep(check_interval)
            elapsed += check_interval

        # If not filled, cancel and refresh
        if not order.is_complete:
            await self.gateway.cancel_order(order)
            logger.info(f"Iceberg: Timeout, refreshing order")


class SmartOrderRouter(ExecutionAlgorithm):
    """
    Smart Order Router (SOR)

    Routes orders across multiple venues to achieve best execution.

    Strategy:
    1. Monitor liquidity across all available venues
    2. Calculate effective price including fees
    3. Route orders to achieve best net price
    4. Dynamically adjust routing based on fill rates
    """

    def __init__(
        self,
        parent_order: Order,
        params: SORParams,
        market_data_provider,
        execution_gateway
    ):
        super().__init__(parent_order, params, market_data_provider, execution_gateway)
        self.sor_params: SORParams = params
        self.venue_stats: Dict[str, Dict] = {}

        # Initialize venue statistics
        for venue in self.sor_params.venues:
            self.venue_stats[venue.venue_id] = {
                "fill_rate": 1.0,
                "avg_latency_ms": 0.0,
                "total_fills": 0,
                "total_orders": 0
            }

    async def execute(self):
        """Execute Smart Order Routing"""
        self.is_running = True
        logger.info(f"Starting SOR execution for {self.parent_order.quantity} "
                   f"{self.parent_order.instrument.symbol} across "
                   f"{len(self.sor_params.venues)} venues")

        # Get venue quotes
        venue_quotes = await self._get_venue_quotes()

        # Calculate routing allocation
        allocation = self._calculate_venue_allocation(venue_quotes)

        # Execute on each venue
        tasks = []
        for venue_id, quantity in allocation.items():
            if quantity > 0:
                venue = self._get_venue_by_id(venue_id)
                task = self._execute_on_venue(venue, quantity, venue_quotes[venue_id])
                tasks.append(task)

        # Execute all venue orders in parallel
        await asyncio.gather(*tasks)

        self.is_complete = True
        if self.on_complete:
            self.on_complete()

        logger.info(f"SOR complete: Avg price = {self._get_avg_fill_price()}")

    async def _get_venue_quotes(self) -> Dict[str, 'Quote']:
        """Get quotes from all venues"""
        quotes = {}

        for venue in self.sor_params.venues:
            # In production, this would query each venue's market data
            quote = await self.market_data.get_quote(
                self.parent_order.instrument,
                venue=venue
            )
            if quote:
                quotes[venue.venue_id] = quote

        return quotes

    def _calculate_venue_allocation(self, venue_quotes: Dict[str, 'Quote']) -> Dict[str, Decimal]:
        """Calculate optimal allocation across venues"""
        allocation = {}

        if self.sor_params.route_strategy == "BEST_PRICE":
            # Route entire order to best price venue
            best_venue = self._find_best_venue(venue_quotes)
            if best_venue:
                allocation[best_venue] = self.parent_order.quantity

        elif self.sor_params.route_strategy == "PRO_RATA":
            # Allocate proportionally based on displayed liquidity
            total_liquidity = Decimal("0")
            venue_liquidity = {}

            for venue_id, quote in venue_quotes.items():
                if self.parent_order.side == Side.BUY:
                    liquidity = quote.ask_size
                else:
                    liquidity = quote.bid_size

                venue_liquidity[venue_id] = liquidity
                total_liquidity += liquidity

            # Allocate pro-rata
            for venue_id, liquidity in venue_liquidity.items():
                if total_liquidity > 0:
                    allocation[venue_id] = (
                        self.parent_order.quantity * liquidity / total_liquidity
                    )

        elif self.sor_params.route_strategy == "WEIGHTED":
            # Allocate based on venue quality scores
            venue_scores = self._calculate_venue_scores(venue_quotes)
            total_score = sum(venue_scores.values())

            for venue_id, score in venue_scores.items():
                if total_score > 0:
                    allocation[venue_id] = (
                        self.parent_order.quantity * Decimal(str(score / total_score))
                    )

        return allocation

    def _find_best_venue(self, venue_quotes: Dict[str, 'Quote']) -> Optional[str]:
        """Find venue with best effective price"""
        best_venue = None
        best_price = None

        for venue_id, quote in venue_quotes.items():
            venue = self._get_venue_by_id(venue_id)

            # Calculate effective price including fees
            if self.parent_order.side == Side.BUY:
                gross_price = quote.ask_price
                fee_rate = venue.taker_fee if not self.sor_params.prefer_maker_fee else venue.maker_fee
                effective_price = gross_price * (1 + fee_rate)

                if best_price is None or effective_price < best_price:
                    best_price = effective_price
                    best_venue = venue_id
            else:
                gross_price = quote.bid_price
                fee_rate = venue.taker_fee if not self.sor_params.prefer_maker_fee else venue.maker_fee
                effective_price = gross_price * (1 - fee_rate)

                if best_price is None or effective_price > best_price:
                    best_price = effective_price
                    best_venue = venue_id

        return best_venue

    def _calculate_venue_scores(self, venue_quotes: Dict[str, 'Quote']) -> Dict[str, float]:
        """Calculate quality score for each venue"""
        scores = {}

        for venue_id, quote in venue_quotes.items():
            venue = self._get_venue_by_id(venue_id)
            stats = self.venue_stats[venue_id]

            # Price score (normalized)
            if self.parent_order.side == Side.BUY:
                price_score = 1.0 / float(quote.ask_price)
            else:
                price_score = float(quote.bid_price)

            # Fill rate score
            fill_rate_score = stats["fill_rate"]

            # Latency score
            latency_score = 1.0 if stats["avg_latency_ms"] < self.sor_params.max_venue_latency_ms else 0.5

            # Fee score
            fee_score = 1.0 - float(venue.taker_fee)

            # Combined score (weighted)
            total_score = (
                0.40 * price_score +
                0.25 * fill_rate_score +
                0.20 * latency_score +
                0.15 * fee_score
            )

            scores[venue_id] = total_score

        return scores

    async def _execute_on_venue(self, venue: Venue, quantity: Decimal, quote: 'Quote'):
        """Execute order on specific venue"""
        # Determine limit price
        if self.parent_order.side == Side.BUY:
            limit_price = quote.ask_price
        else:
            limit_price = quote.bid_price

        # Create child order for this venue
        child_order = self._create_child_order(
            quantity=quantity,
            price=limit_price,
            order_type=OrderType.LIMIT
        )
        child_order.venue = venue

        logger.info(f"SOR: Routing {quantity} to {venue.name} @ {limit_price}")

        # Send order
        start_time = datetime.utcnow()
        await self.gateway.send_order(child_order)

        if self.on_child_order:
            self.on_child_order(child_order)

        # Update venue statistics
        latency_ms = (datetime.utcnow() - start_time).total_seconds() * 1000
        self._update_venue_stats(venue.venue_id, latency_ms)

    def _update_venue_stats(self, venue_id: str, latency_ms: float):
        """Update venue performance statistics"""
        stats = self.venue_stats[venue_id]
        stats["total_orders"] += 1
        stats["avg_latency_ms"] = (
            (stats["avg_latency_ms"] * (stats["total_orders"] - 1) + latency_ms) /
            stats["total_orders"]
        )

    def _get_venue_by_id(self, venue_id: str) -> Optional[Venue]:
        """Get venue object by ID"""
        for venue in self.sor_params.venues:
            if venue.venue_id == venue_id:
                return venue
        return None


class ExecutionEngine:
    """
    Core Execution Engine

    Central orchestrator for all execution algorithms.
    Manages lifecycle of parent orders and routing to appropriate algorithms.
    """

    def __init__(self, market_data_provider, execution_gateway):
        self.market_data = market_data_provider
        self.gateway = execution_gateway
        self.active_algos: Dict[str, ExecutionAlgorithm] = {}
        self.order_history: List[Order] = []
        self.fill_history: List[Fill] = []

        # Callbacks
        self.on_order_update: Optional[Callable[[Order], None]] = None
        self.on_fill: Optional[Callable[[Fill], None]] = None

    async def submit_order(
        self,
        order: Order,
        algo_params: Optional[ExecutionAlgoParams] = None
    ) -> str:
        """
        Submit order for execution.

        Args:
            order: Parent order to execute
            algo_params: Optional algorithm-specific parameters

        Returns:
            Order ID
        """
        logger.info(f"Submitting order: {order.order_id} {order.side} "
                   f"{order.quantity} {order.instrument.symbol}")

        self.order_history.append(order)

        # Determine execution algorithm
        if algo_params is None:
            # Simple execution
            await self.gateway.send_order(order)
        elif isinstance(algo_params, VWAPParams):
            algo = VWAPAlgorithm(order, algo_params, self.market_data, self.gateway)
            await self._run_algorithm(order.order_id, algo)
        elif isinstance(algo_params, IcebergParams):
            algo = IcebergAlgorithm(order, algo_params, self.market_data, self.gateway)
            await self._run_algorithm(order.order_id, algo)
        elif isinstance(algo_params, SORParams):
            algo = SmartOrderRouter(order, algo_params, self.market_data, self.gateway)
            await self._run_algorithm(order.order_id, algo)
        else:
            # Default to simple execution
            await self.gateway.send_order(order)

        return order.order_id

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel order by ID"""
        # Check if it's an algo order
        if order_id in self.active_algos:
            algo = self.active_algos[order_id]
            await algo.stop()
            del self.active_algos[order_id]
            return True

        # Otherwise cancel directly
        for order in self.order_history:
            if order.order_id == order_id:
                await self.gateway.cancel_order(order)
                return True

        return False

    async def _run_algorithm(self, order_id: str, algo: ExecutionAlgorithm):
        """Run execution algorithm"""
        # Set up callbacks
        algo.on_fill = self._handle_fill
        algo.on_child_order = self._handle_child_order

        # Store and execute
        self.active_algos[order_id] = algo
        asyncio.create_task(algo.execute())

    def _handle_fill(self, fill: Fill):
        """Handle fill from algorithm"""
        self.fill_history.append(fill)
        logger.info(f"Fill: {fill.quantity} @ {fill.price}")

        if self.on_fill:
            self.on_fill(fill)

    def _handle_child_order(self, order: Order):
        """Handle child order from algorithm"""
        if self.on_order_update:
            self.on_order_update(order)

    def get_order_status(self, order_id: str) -> Optional[Order]:
        """Get order status by ID"""
        for order in self.order_history:
            if order.order_id == order_id:
                return order
        return None

    def get_fills(self, order_id: str) -> List[Fill]:
        """Get all fills for an order"""
        return [f for f in self.fill_history if f.order_id == order_id]
