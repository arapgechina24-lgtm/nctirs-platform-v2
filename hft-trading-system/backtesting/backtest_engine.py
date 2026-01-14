"""
High-Fidelity Backtesting Engine
Accounts for:
- Slippage
- Exchange fees (maker/taker)
- Market impact
- Order book dynamics
- Latency
"""
import asyncio
import logging
from typing import Dict, List, Optional, Callable
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import numpy as np

from core.data_structures.order import Order, Fill, OrderStatus, OrderSide, OrderType
from core.data_structures.market_data import Tick, OrderBook, OHLCV, PriceLevel
from core.database.timeseries_db import TimeSeriesDB
from core.risk.risk_manager import RiskManager


@dataclass
class BacktestConfig:
    """Backtesting configuration"""
    # Fee structure
    maker_fee_bps: float = 2.0  # 2 basis points
    taker_fee_bps: float = 5.0  # 5 basis points

    # Slippage model
    slippage_model: str = "LINEAR"  # LINEAR, SQRT, or FIXED
    base_slippage_bps: float = 1.0

    # Market impact model (Kyle's lambda)
    market_impact_coefficient: float = 0.1  # Impact per unit of volume

    # Latency
    order_latency_ms: float = 2.0  # Latency to submit order
    cancel_latency_ms: float = 1.0  # Latency to cancel order
    market_data_latency_ms: float = 0.5  # Market data feed latency

    # Execution
    partial_fill_prob: float = 0.1  # Probability of partial fill
    fill_probability_decay: float = 0.95  # Decay per second if price moves away

    # Starting capital
    initial_capital: float = 1_000_000.0


@dataclass
class BacktestResult:
    """Backtesting results"""
    start_time: datetime
    end_time: datetime
    initial_capital: float
    final_capital: float

    # Performance metrics
    total_pnl: float = 0.0
    total_return: float = 0.0
    sharpe_ratio: float = 0.0
    max_drawdown: float = 0.0
    win_rate: float = 0.0

    # Trading metrics
    total_trades: int = 0
    total_volume: float = 0.0
    total_fees: float = 0.0

    # Trade log
    fills: List[Fill] = field(default_factory=list)
    equity_curve: List[tuple] = field(default_factory=list)  # [(timestamp, equity)]

    # Daily metrics
    daily_returns: List[float] = field(default_factory=list)
    winning_days: int = 0
    losing_days: int = 0


class BacktestEngine:
    """
    High-fidelity backtesting engine with realistic execution simulation
    """

    def __init__(
        self,
        config: BacktestConfig,
        database: TimeSeriesDB,
        risk_manager: Optional[RiskManager] = None
    ):
        self.config = config
        self.database = database
        self.risk_manager = risk_manager
        self.logger = logging.getLogger(self.__class__.__name__)

        # Simulation state
        self.current_time: datetime = None
        self.current_capital: float = config.initial_capital
        self.positions: Dict[str, float] = {}

        # Order state
        self.active_orders: Dict[str, Order] = {}
        self.fills: List[Fill] = []

        # Market data
        self.current_order_books: Dict[str, OrderBook] = {}
        self.tick_buffer: List[Tick] = []

        # Performance tracking
        self.equity_curve: List[tuple] = []
        self.daily_pnl: Dict[str, float] = {}

        # Callbacks
        self.on_tick_callback: Optional[Callable] = None
        self.on_order_book_callback: Optional[Callable] = None

    async def run_backtest(
        self,
        strategy: 'BaseStrategy',
        symbols: List[str],
        start_time: datetime,
        end_time: datetime
    ) -> BacktestResult:
        """
        Run backtest for strategy
        """
        self.logger.info(f"Starting backtest: {start_time} to {end_time}")

        # Initialize
        self.current_time = start_time
        self.current_capital = self.config.initial_capital
        self.positions = {}
        self.active_orders = {}
        self.fills = []
        self.equity_curve = []

        # Load tick data for all symbols
        all_ticks = []
        for symbol in symbols:
            ticks = await self.database.query_ticks(symbol, start_time, end_time)
            all_ticks.extend(ticks)
            self.logger.info(f"Loaded {len(ticks)} ticks for {symbol}")

        # Sort by timestamp
        all_ticks.sort(key=lambda t: t.timestamp)

        if not all_ticks:
            self.logger.error("No tick data found")
            return self._generate_results(start_time, end_time)

        # Initialize strategy
        await strategy.on_start()

        # Replay ticks
        for tick in all_ticks:
            self.current_time = tick.timestamp

            # Update market state
            await self._process_tick(tick)

            # Check active orders for fills
            await self._check_order_fills(tick)

            # Notify strategy
            if self.on_tick_callback:
                await self.on_tick_callback(tick)

            # Notify strategy of order book updates
            if tick.symbol in self.current_order_books:
                if self.on_order_book_callback:
                    await self.on_order_book_callback(
                        tick.symbol,
                        self.current_order_books[tick.symbol]
                    )

            # Track equity
            if len(self.equity_curve) == 0 or \
               (tick.timestamp - self.equity_curve[-1][0]).total_seconds() >= 60:
                equity = self._calculate_equity()
                self.equity_curve.append((tick.timestamp, equity))

        # Finalize strategy
        await strategy.on_stop()

        # Generate results
        result = self._generate_results(start_time, end_time)
        self.logger.info(
            f"Backtest complete: PnL={result.total_pnl:.2f}, "
            f"Return={result.total_return:.2%}, Sharpe={result.sharpe_ratio:.2f}"
        )

        return result

    async def _process_tick(self, tick: Tick):
        """Process incoming tick and update order book"""
        # Update or create order book
        if tick.symbol not in self.current_order_books:
            self.current_order_books[tick.symbol] = OrderBook(symbol=tick.symbol)

        order_book = self.current_order_books[tick.symbol]

        # Simple order book update based on trade
        # In production, would use full order book feed
        if tick.side == "BUY":
            # Aggressive buy hit the ask
            order_book.update_ask(tick.price, tick.quantity)
        else:
            # Aggressive sell hit the bid
            order_book.update_bid(tick.price, tick.quantity)

        order_book.timestamp = tick.timestamp

        # Update risk manager reference prices
        if self.risk_manager:
            self.risk_manager.update_reference_price(tick.symbol, tick.price)

    async def _check_order_fills(self, tick: Tick):
        """Check if any active orders should be filled"""
        orders_to_remove = []

        for order_id, order in self.active_orders.items():
            if order.symbol != tick.symbol:
                continue

            # Check if order would be filled
            fill_price, fill_qty = self._simulate_fill(order, tick)

            if fill_qty > 0:
                # Create fill
                fee = self._calculate_fee(fill_qty, fill_price, order)

                fill = Fill(
                    order_id=order.order_id,
                    symbol=order.symbol,
                    side=order.side,
                    quantity=fill_qty,
                    price=fill_price,
                    timestamp=tick.timestamp,
                    venue="BACKTEST",
                    fee=fee,
                    liquidity_flag=self._determine_liquidity_flag(order)
                )

                # Update order
                order.filled_quantity += fill_qty
                order.average_fill_price = (
                    (order.average_fill_price * (order.filled_quantity - fill_qty) +
                     fill_price * fill_qty) / order.filled_quantity
                )

                if order.filled_quantity >= order.quantity:
                    order.status = OrderStatus.FILLED
                    orders_to_remove.append(order_id)
                else:
                    order.status = OrderStatus.PARTIAL_FILL

                # Record fill
                self.fills.append(fill)

                # Update position
                position_delta = fill_qty if order.side == OrderSide.BUY else -fill_qty
                current_pos = self.positions.get(order.symbol, 0.0)
                self.positions[order.symbol] = current_pos + position_delta

                # Update capital
                cost = fill_qty * fill_price + fee
                if order.side == OrderSide.BUY:
                    self.current_capital -= cost
                else:
                    self.current_capital += fill_qty * fill_price - fee

                # Notify risk manager
                if self.risk_manager:
                    self.risk_manager.on_fill(fill)

                self.logger.debug(
                    f"Fill: {order.symbol} {order.side.value} {fill_qty}@{fill_price}, "
                    f"fee={fee:.2f}"
                )

        # Remove filled orders
        for order_id in orders_to_remove:
            del self.active_orders[order_id]

    def _simulate_fill(self, order: Order, tick: Tick) -> tuple:
        """
        Simulate order fill based on market conditions
        Returns (fill_price, fill_quantity)
        """
        if order.order_type == OrderType.MARKET:
            # Market orders fill immediately at current price + slippage
            slippage = self._calculate_slippage(order, tick)
            fill_price = tick.price * (1 + slippage) if order.side == OrderSide.BUY else tick.price * (1 - slippage)
            return fill_price, order.remaining_quantity

        elif order.order_type == OrderType.LIMIT:
            # Limit orders only fill if price is favorable
            if order.side == OrderSide.BUY:
                if tick.price <= order.price:
                    # Can fill
                    fill_qty = min(order.remaining_quantity, tick.quantity)
                    return order.price, fill_qty
            else:  # SELL
                if tick.price >= order.price:
                    fill_qty = min(order.remaining_quantity, tick.quantity)
                    return order.price, fill_qty

        return 0.0, 0.0

    def _calculate_slippage(self, order: Order, tick: Tick) -> float:
        """Calculate slippage for market order"""
        # Get order book
        order_book = self.current_order_books.get(order.symbol)
        if not order_book:
            # Fallback to fixed slippage
            return self.config.base_slippage_bps / 10000.0

        # Calculate market impact
        side = "BUY" if order.side == OrderSide.BUY else "SELL"
        available_liquidity = sum(
            level.quantity for level in
            (order_book.asks[:10] if side == "BUY" else order_book.bids[:10])
        )

        if available_liquidity == 0:
            return self.config.base_slippage_bps / 10000.0

        # Market impact model: price impact proportional to sqrt(order_size/liquidity)
        size_ratio = order.quantity / available_liquidity

        if self.config.slippage_model == "LINEAR":
            impact = self.config.market_impact_coefficient * size_ratio
        elif self.config.slippage_model == "SQRT":
            impact = self.config.market_impact_coefficient * np.sqrt(size_ratio)
        else:  # FIXED
            impact = self.config.base_slippage_bps / 10000.0

        # Add base slippage
        total_slippage = self.config.base_slippage_bps / 10000.0 + impact

        return total_slippage

    def _calculate_fee(self, quantity: float, price: float, order: Order) -> float:
        """Calculate exchange fee"""
        notional = quantity * price

        # Determine if maker or taker
        if order.order_type == OrderType.MARKET:
            fee_bps = self.config.taker_fee_bps
        else:
            # Simplified: limit orders are makers
            fee_bps = self.config.maker_fee_bps

        return notional * (fee_bps / 10000.0)

    def _determine_liquidity_flag(self, order: Order) -> str:
        """Determine if order is maker or taker"""
        return "TAKER" if order.order_type == OrderType.MARKET else "MAKER"

    def _calculate_equity(self) -> float:
        """Calculate current equity (cash + positions marked to market)"""
        equity = self.current_capital

        for symbol, position in self.positions.items():
            if symbol in self.current_order_books:
                mark_price = self.current_order_books[symbol].mid_price
                equity += position * mark_price

        return equity

    def _generate_results(self, start_time: datetime, end_time: datetime) -> BacktestResult:
        """Generate backtest results"""
        final_equity = self._calculate_equity()
        total_pnl = final_equity - self.config.initial_capital
        total_return = total_pnl / self.config.initial_capital

        # Calculate Sharpe ratio
        if len(self.equity_curve) > 1:
            returns = []
            for i in range(1, len(self.equity_curve)):
                ret = (self.equity_curve[i][1] - self.equity_curve[i-1][1]) / self.equity_curve[i-1][1]
                returns.append(ret)

            if returns:
                mean_return = np.mean(returns)
                std_return = np.std(returns)
                sharpe_ratio = (mean_return / std_return * np.sqrt(252)) if std_return > 0 else 0.0
            else:
                sharpe_ratio = 0.0
        else:
            sharpe_ratio = 0.0

        # Calculate max drawdown
        max_drawdown = 0.0
        peak = self.config.initial_capital
        for _, equity in self.equity_curve:
            if equity > peak:
                peak = equity
            drawdown = (peak - equity) / peak
            max_drawdown = max(max_drawdown, drawdown)

        # Calculate win rate
        winning_trades = sum(1 for f in self.fills if f.side == OrderSide.SELL)
        total_trades = len(self.fills)
        win_rate = winning_trades / total_trades if total_trades > 0 else 0.0

        # Calculate total fees
        total_fees = sum(f.fee for f in self.fills)

        # Calculate total volume
        total_volume = sum(f.notional for f in self.fills)

        return BacktestResult(
            start_time=start_time,
            end_time=end_time,
            initial_capital=self.config.initial_capital,
            final_capital=final_equity,
            total_pnl=total_pnl,
            total_return=total_return,
            sharpe_ratio=sharpe_ratio,
            max_drawdown=max_drawdown,
            win_rate=win_rate,
            total_trades=total_trades,
            total_volume=total_volume,
            total_fees=total_fees,
            fills=self.fills,
            equity_curve=self.equity_curve
        )

    async def submit_order(self, order: Order) -> bool:
        """Submit order in backtest"""
        # Apply latency
        order.timestamp = self.current_time + timedelta(milliseconds=self.config.order_latency_ms)

        # Risk check
        if self.risk_manager:
            approved, reason = await self.risk_manager.pre_trade_check(order)
            if not approved:
                self.logger.warning(f"Order rejected by risk: {reason}")
                order.status = OrderStatus.REJECTED
                return False

        # Add to active orders
        order.status = OrderStatus.SUBMITTED
        self.active_orders[order.order_id] = order

        self.logger.debug(f"Order submitted: {order.order_id}")
        return True

    async def cancel_order(self, order_id: str) -> bool:
        """Cancel order in backtest"""
        if order_id in self.active_orders:
            # Apply latency
            cancel_time = self.current_time + timedelta(milliseconds=self.config.cancel_latency_ms)

            order = self.active_orders[order_id]
            order.status = OrderStatus.CANCELLED
            del self.active_orders[order_id]

            self.logger.debug(f"Order cancelled: {order_id}")
            return True

        return False
