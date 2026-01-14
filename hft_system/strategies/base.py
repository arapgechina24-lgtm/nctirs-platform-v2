"""
Strategy Base Class and Sample Strategies

This module provides the base strategy interface and sample implementations.
Strategies focus on market microstructure, order flow, and statistical arbitrage
rather than retail indicators.
"""

from abc import ABC, abstractmethod
from typing import Dict, Optional, List
from decimal import Decimal
from datetime import datetime
import asyncio
import logging

from core.types import Order, Instrument, Side, OrderType
from core.orderbook import OrderBook, MicrostructureMetrics


logger = logging.getLogger(__name__)


class Strategy(ABC):
    """
    Base strategy class.

    All strategies should inherit from this and implement the abstract methods.
    """

    def __init__(
        self,
        name: str,
        instruments: List[Instrument],
        execution_engine,
        risk_manager
    ):
        self.name = name
        self.instruments = instruments
        self.execution_engine = execution_engine
        self.risk_manager = risk_manager
        self.is_running = False

        # Strategy state
        self.positions: Dict[str, Decimal] = {}
        self.pending_orders: List[Order] = []

    @abstractmethod
    async def on_orderbook_update(self, order_book: OrderBook):
        """Called when order book is updated"""
        pass

    @abstractmethod
    async def on_trade(self, trade):
        """Called when a trade occurs"""
        pass

    @abstractmethod
    async def on_quote(self, quote):
        """Called when quote is updated"""
        pass

    async def start(self):
        """Start strategy"""
        self.is_running = True
        logger.info(f"Strategy '{self.name}' started")

    async def stop(self):
        """Stop strategy"""
        self.is_running = False
        # Cancel all pending orders
        for order in self.pending_orders:
            await self.execution_engine.cancel_order(order.order_id)
        logger.info(f"Strategy '{self.name}' stopped")

    async def submit_order(self, order: Order) -> bool:
        """
        Submit order through execution engine with risk checks.

        Returns:
            True if order was submitted successfully
        """
        # Pre-trade risk check
        current_price = order.price or Decimal("100.0")
        is_valid, violation = self.risk_manager.check_order(order, current_price)

        if not is_valid:
            logger.warning(f"Order rejected by risk manager: {violation.description}")
            return False

        # Submit order
        order_id = await self.execution_engine.submit_order(order)
        self.pending_orders.append(order)

        logger.info(f"Strategy '{self.name}' submitted order {order_id}")
        return True


class OrderFlowImbalanceStrategy(Strategy):
    """
    Order Flow Imbalance Strategy

    Trades based on short-term order flow imbalance.
    When buy orders significantly exceed sell orders, expect upward pressure.

    This is a simple market-making / mean-reversion strategy that profits
    from temporary order flow imbalances.
    """

    def __init__(
        self,
        name: str,
        instruments: List[Instrument],
        execution_engine,
        risk_manager,
        imbalance_threshold: float = 0.3,
        position_limit: Decimal = Decimal("100")
    ):
        super().__init__(name, instruments, execution_engine, risk_manager)
        self.imbalance_threshold = imbalance_threshold
        self.position_limit = position_limit
        self.analyzer = None  # Set externally

    async def on_orderbook_update(self, order_book: OrderBook):
        """React to order book updates"""
        if not self.is_running or not self.analyzer:
            return

        metrics = self.analyzer.get_metrics(
            order_book.instrument,
            order_book.venue
        )

        if not metrics:
            return

        symbol = order_book.instrument.symbol
        current_position = self.positions.get(symbol, Decimal("0"))

        # Check order flow imbalance
        imbalance = metrics.order_flow_imbalance

        # Strong buy pressure -> buy
        if imbalance > self.imbalance_threshold and current_position < self.position_limit:
            await self._place_order(
                order_book.instrument,
                Side.BUY,
                Decimal("10"),
                metrics.microprice
            )

        # Strong sell pressure -> sell
        elif imbalance < -self.imbalance_threshold and current_position > -self.position_limit:
            await self._place_order(
                order_book.instrument,
                Side.SELL,
                Decimal("10"),
                metrics.microprice
            )

    async def on_trade(self, trade):
        """Process trade (for order flow analysis)"""
        pass

    async def on_quote(self, quote):
        """Process quote update"""
        pass

    async def _place_order(
        self,
        instrument: Instrument,
        side: Side,
        quantity: Decimal,
        price: Decimal
    ):
        """Place limit order"""
        order = Order(
            instrument=instrument,
            side=side,
            order_type=OrderType.LIMIT,
            quantity=quantity,
            price=price
        )

        await self.submit_order(order)


class SpreadCaptureStrategy(Strategy):
    """
    Spread Capture / Market Making Strategy

    Posts limit orders on both sides to capture the bid-ask spread.
    Adjusts quotes based on inventory and market conditions.
    """

    def __init__(
        self,
        name: str,
        instruments: List[Instrument],
        execution_engine,
        risk_manager,
        quote_size: Decimal = Decimal("10"),
        max_inventory: Decimal = Decimal("100"),
        spread_multiplier: float = 1.5
    ):
        super().__init__(name, instruments, execution_engine, risk_manager)
        self.quote_size = quote_size
        self.max_inventory = max_inventory
        self.spread_multiplier = spread_multiplier
        self.active_quotes: Dict[str, tuple[Order, Order]] = {}  # symbol -> (bid, ask)

    async def on_orderbook_update(self, order_book: OrderBook):
        """Update quotes based on order book"""
        if not self.is_running:
            return

        symbol = order_book.instrument.symbol
        current_position = self.positions.get(symbol, Decimal("0"))

        # Get market prices
        mid_price = order_book.get_mid_price()
        spread = order_book.get_spread()

        if not mid_price or not spread:
            return

        # Cancel existing quotes
        await self._cancel_quotes(symbol)

        # Adjust quotes based on inventory
        inventory_skew = float(current_position / self.max_inventory)

        # Calculate quote prices
        half_spread = spread * Decimal(str(self.spread_multiplier)) / 2

        bid_price = mid_price - half_spread * Decimal(str(1 + inventory_skew * 0.5))
        ask_price = mid_price + half_spread * Decimal(str(1 - inventory_skew * 0.5))

        # Don't quote if inventory too large
        if abs(current_position) >= self.max_inventory:
            return

        # Place new quotes
        bid_order = Order(
            instrument=order_book.instrument,
            side=Side.BUY,
            order_type=OrderType.LIMIT,
            quantity=self.quote_size,
            price=bid_price
        )

        ask_order = Order(
            instrument=order_book.instrument,
            side=Side.SELL,
            order_type=OrderType.LIMIT,
            quantity=self.quote_size,
            price=ask_price
        )

        await self.submit_order(bid_order)
        await self.submit_order(ask_order)

        self.active_quotes[symbol] = (bid_order, ask_order)

    async def _cancel_quotes(self, symbol: str):
        """Cancel active quotes for symbol"""
        if symbol in self.active_quotes:
            bid_order, ask_order = self.active_quotes[symbol]
            await self.execution_engine.cancel_order(bid_order.order_id)
            await self.execution_engine.cancel_order(ask_order.order_id)
            del self.active_quotes[symbol]

    async def on_trade(self, trade):
        """Process trade"""
        pass

    async def on_quote(self, quote):
        """Process quote"""
        pass


class StatisticalArbitrageStrategy(Strategy):
    """
    Statistical Arbitrage Strategy

    Identifies mean-reverting price relationships between correlated instruments.
    Trades when the spread deviates from historical mean.

    This is a simplified pairs trading strategy.
    """

    def __init__(
        self,
        name: str,
        instruments: List[Instrument],
        execution_engine,
        risk_manager,
        lookback_periods: int = 100,
        entry_threshold: float = 2.0,  # Z-score threshold
        exit_threshold: float = 0.5
    ):
        super().__init__(name, instruments, execution_engine, risk_manager)
        self.lookback_periods = lookback_periods
        self.entry_threshold = entry_threshold
        self.exit_threshold = exit_threshold

        # Price history for spread calculation
        self.price_history: Dict[str, List[Decimal]] = {}

    async def on_orderbook_update(self, order_book: OrderBook):
        """Update strategy on order book changes"""
        if not self.is_running:
            return

        # Store mid price
        mid_price = order_book.get_mid_price()
        if not mid_price:
            return

        symbol = order_book.instrument.symbol
        if symbol not in self.price_history:
            self.price_history[symbol] = []

        self.price_history[symbol].append(mid_price)

        # Keep only recent history
        if len(self.price_history[symbol]) > self.lookback_periods:
            self.price_history[symbol] = self.price_history[symbol][-self.lookback_periods:]

        # Need at least 2 instruments for pairs trading
        if len(self.instruments) < 2:
            return

        # Calculate spread and z-score
        # (Simplified - in reality would use cointegration)
        await self._check_for_signals()

    async def _check_for_signals(self):
        """Check for trading signals based on spread"""
        # This is a placeholder for actual statistical arbitrage logic
        # In production, you would:
        # 1. Calculate spread between correlated pairs
        # 2. Compute z-score of current spread
        # 3. Enter positions when z-score exceeds threshold
        # 4. Exit when z-score returns to mean
        pass

    async def on_trade(self, trade):
        """Process trade"""
        pass

    async def on_quote(self, quote):
        """Process quote"""
        pass
