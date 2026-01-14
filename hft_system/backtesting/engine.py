"""
High-Fidelity Backtesting Engine

Implements realistic backtesting with:
- Market impact modeling (order moves the price)
- Slippage (execution price differs from signal price)
- Exchange fees (maker/taker)
- Order book simulation
- Latency modeling
"""

from typing import List, Dict, Optional, Callable
from decimal import Decimal
from datetime import datetime, timedelta
from dataclasses import dataclass, field
import logging
import numpy as np

from core.types import (
    Order, Fill, OrderType, Side, OrderStatus,
    Instrument, Venue, Position, OrderBookSnapshot
)


logger = logging.getLogger(__name__)


@dataclass
class BacktestConfig:
    """Backtesting configuration"""
    start_date: datetime
    end_date: datetime
    initial_capital: Decimal
    instruments: List[Instrument]
    venues: List[Venue]

    # Market impact parameters
    enable_market_impact: bool = True
    market_impact_model: str = "SQRT"  # LINEAR, SQRT, PERMANENT
    impact_coefficient: float = 0.1  # Impact parameter

    # Slippage parameters
    enable_slippage: bool = True
    slippage_model: str = "PROPORTIONAL"  # FIXED, PROPORTIONAL
    slippage_bps: float = 1.0  # Basis points

    # Latency modeling
    enable_latency: bool = True
    order_latency_ms: float = 5.0  # Order submission latency
    market_data_latency_ms: float = 1.0  # Market data latency

    # Fees
    enable_fees: bool = True
    default_maker_fee_bps: float = 1.0  # 1 bp
    default_taker_fee_bps: float = 2.0  # 2 bp

    # Realism settings
    enable_partial_fills: bool = True
    partial_fill_probability: float = 0.15  # 15% chance of partial fill
    max_order_book_levels: int = 20


@dataclass
class BacktestResult:
    """Backtesting results"""
    config: BacktestConfig
    start_time: datetime
    end_time: datetime
    duration_seconds: float

    # Performance metrics
    total_pnl: Decimal = Decimal("0")
    total_return_pct: float = 0.0
    sharpe_ratio: float = 0.0
    sortino_ratio: float = 0.0
    max_drawdown: Decimal = Decimal("0")
    max_drawdown_pct: float = 0.0

    # Trading metrics
    total_trades: int = 0
    winning_trades: int = 0
    losing_trades: int = 0
    win_rate: float = 0.0
    avg_win: Decimal = Decimal("0")
    avg_loss: Decimal = Decimal("0")
    profit_factor: float = 0.0  # Gross profit / Gross loss

    # Execution metrics
    total_volume: Decimal = Decimal("0")
    total_fees: Decimal = Decimal("0")
    avg_slippage_bps: float = 0.0
    avg_market_impact_bps: float = 0.0

    # Time-series data
    equity_curve: List[tuple[datetime, Decimal]] = field(default_factory=list)
    daily_returns: List[float] = field(default_factory=list)
    trade_history: List[Dict] = field(default_factory=list)


class MarketImpactModel:
    """
    Market Impact Models

    Models how orders move the market price.
    """

    @staticmethod
    def calculate_impact(
        order_size: Decimal,
        daily_volume: Decimal,
        current_price: Decimal,
        model: str = "SQRT",
        coefficient: float = 0.1
    ) -> Decimal:
        """
        Calculate market impact.

        Args:
            order_size: Size of the order
            daily_volume: Average daily volume
            current_price: Current market price
            model: Impact model (LINEAR, SQRT, PERMANENT)
            coefficient: Impact coefficient

        Returns:
            Price impact as absolute value
        """
        if daily_volume == 0:
            return Decimal("0")

        # Participation rate
        participation = float(order_size) / float(daily_volume)

        if model == "LINEAR":
            # Linear: impact = coef * participation
            impact_pct = coefficient * participation
        elif model == "SQRT":
            # Square root: impact = coef * sqrt(participation)
            impact_pct = coefficient * np.sqrt(participation)
        elif model == "PERMANENT":
            # Permanent impact: larger coefficient
            impact_pct = coefficient * participation * 0.5
        else:
            impact_pct = 0.0

        # Convert to absolute price impact
        impact = current_price * Decimal(str(impact_pct))

        return impact


class SlippageModel:
    """
    Slippage Models

    Models the difference between expected and actual execution price.
    """

    @staticmethod
    def calculate_slippage(
        order: Order,
        market_price: Decimal,
        model: str = "PROPORTIONAL",
        slippage_bps: float = 1.0,
        volatility: Optional[float] = None
    ) -> Decimal:
        """
        Calculate slippage.

        Args:
            order: Order to execute
            market_price: Current market price
            model: Slippage model
            slippage_bps: Slippage in basis points
            volatility: Market volatility (for proportional model)

        Returns:
            Slippage amount (positive = adverse)
        """
        if model == "FIXED":
            # Fixed slippage in basis points
            slippage = market_price * Decimal(str(slippage_bps / 10000))
        elif model == "PROPORTIONAL":
            # Proportional to volatility and order size
            base_slippage = slippage_bps / 10000
            if volatility:
                slippage_factor = base_slippage * (1 + volatility)
            else:
                slippage_factor = base_slippage

            slippage = market_price * Decimal(str(slippage_factor))
        else:
            slippage = Decimal("0")

        # Add some randomness
        random_factor = np.random.normal(1.0, 0.2)  # 20% std dev
        slippage = slippage * Decimal(str(max(0.1, random_factor)))

        return slippage


class BacktestOrderBook:
    """
    Simulated order book for backtesting.

    Provides realistic order execution simulation.
    """

    def __init__(self, instrument: Instrument, venue: Venue):
        self.instrument = instrument
        self.venue = venue
        self.snapshot: Optional[OrderBookSnapshot] = None
        self.last_trade_price: Optional[Decimal] = None

    def update(self, snapshot: OrderBookSnapshot):
        """Update order book snapshot"""
        self.snapshot = snapshot
        if snapshot.mid_price:
            self.last_trade_price = snapshot.mid_price

    def get_execution_price(
        self,
        order: Order,
        market_impact: Decimal,
        slippage: Decimal
    ) -> Decimal:
        """
        Calculate realistic execution price.

        Args:
            order: Order to execute
            market_impact: Market impact amount
            slippage: Slippage amount

        Returns:
            Execution price
        """
        if not self.snapshot or not self.snapshot.mid_price:
            # No order book data, use last trade price
            base_price = self.last_trade_price or Decimal("100.0")
        else:
            base_price = self.snapshot.mid_price

        # Apply market impact and slippage
        if order.side == Side.BUY:
            # Buying pushes price up
            execution_price = base_price + market_impact + slippage
        else:
            # Selling pushes price down
            execution_price = base_price - market_impact - slippage

        # Ensure price stays positive
        execution_price = max(execution_price, self.instrument.tick_size)

        return execution_price

    def check_liquidity(self, order: Order) -> tuple[bool, Decimal]:
        """
        Check if sufficient liquidity exists for order.

        Returns:
            (can_fill, available_quantity)
        """
        if not self.snapshot:
            # No order book, assume full liquidity
            return True, order.quantity

        if order.side == Side.BUY:
            # Check ask side liquidity
            total_liquidity = sum(level.size for level in self.snapshot.asks)
        else:
            # Check bid side liquidity
            total_liquidity = sum(level.size for level in self.snapshot.bids)

        can_fill = total_liquidity >= order.quantity
        available_quantity = min(total_liquidity, order.quantity)

        return can_fill, available_quantity


class BacktestEngine:
    """
    High-Fidelity Backtesting Engine

    Simulates realistic order execution with market impact,
    slippage, fees, and latency.
    """

    def __init__(self, config: BacktestConfig):
        self.config = config
        self.current_time = config.start_date
        self.capital = config.initial_capital
        self.positions: Dict[str, Position] = {}
        self.order_books: Dict[str, BacktestOrderBook] = {}
        self.pending_orders: List[Order] = []
        self.filled_orders: List[Order] = []
        self.fills: List[Fill] = []

        # Performance tracking
        self.equity_history: List[tuple[datetime, Decimal]] = []
        self.daily_pnls: List[Decimal] = []
        self.trade_pnls: List[Decimal] = []

        # Execution tracking
        self.total_slippage = Decimal("0")
        self.total_impact = Decimal("0")
        self.total_fees = Decimal("0")

        # Market data
        self.market_prices: Dict[str, Decimal] = {}
        self.daily_volumes: Dict[str, Decimal] = {}

        # Initialize order books
        for instrument in config.instruments:
            for venue in config.venues:
                key = f"{instrument.symbol}_{venue.venue_id}"
                self.order_books[key] = BacktestOrderBook(instrument, venue)

        logger.info(f"Backtest initialized: {config.start_date} to {config.end_date}")

    def submit_order(self, order: Order) -> str:
        """Submit order for backtesting"""
        # Apply order latency
        if self.config.enable_latency:
            order.submitted_at = self.current_time + timedelta(
                milliseconds=self.config.order_latency_ms
            )
        else:
            order.submitted_at = self.current_time

        self.pending_orders.append(order)
        order.status = OrderStatus.PENDING_NEW

        logger.debug(f"Order submitted: {order.order_id} {order.side} "
                    f"{order.quantity} {order.instrument.symbol}")

        return order.order_id

    def process_orders(self):
        """Process pending orders"""
        executed_orders = []

        for order in self.pending_orders:
            # Check if order should be executed (latency passed)
            if order.submitted_at and order.submitted_at > self.current_time:
                continue

            # Execute order
            if self._execute_order(order):
                executed_orders.append(order)

        # Remove executed orders from pending
        for order in executed_orders:
            self.pending_orders.remove(order)

    def _execute_order(self, order: Order) -> bool:
        """Execute a single order"""
        symbol = order.instrument.symbol
        current_price = self.market_prices.get(symbol, Decimal("100.0"))
        daily_volume = self.daily_volumes.get(symbol, Decimal("1000000"))

        # Get order book
        ob_key = f"{symbol}_{order.venue.venue_id if order.venue else 'default'}"
        order_book = self.order_books.get(ob_key)

        # Check liquidity
        if order_book and self.config.enable_partial_fills:
            can_fill, available_qty = order_book.check_liquidity(order)
            if not can_fill:
                # Partial fill
                if np.random.random() < self.config.partial_fill_probability:
                    fill_qty = available_qty
                    logger.debug(f"Partial fill: {fill_qty} of {order.quantity}")
                else:
                    fill_qty = order.quantity
            else:
                fill_qty = order.quantity
        else:
            fill_qty = order.quantity

        # Calculate market impact
        market_impact = Decimal("0")
        if self.config.enable_market_impact:
            market_impact = MarketImpactModel.calculate_impact(
                order_size=fill_qty,
                daily_volume=daily_volume,
                current_price=current_price,
                model=self.config.market_impact_model,
                coefficient=self.config.impact_coefficient
            )
            self.total_impact += market_impact

        # Calculate slippage
        slippage = Decimal("0")
        if self.config.enable_slippage:
            slippage = SlippageModel.calculate_slippage(
                order=order,
                market_price=current_price,
                model=self.config.slippage_model,
                slippage_bps=self.config.slippage_bps
            )
            self.total_slippage += slippage

        # Determine execution price
        if order_book:
            execution_price = order_book.get_execution_price(
                order, market_impact, slippage
            )
        else:
            if order.side == Side.BUY:
                execution_price = current_price + market_impact + slippage
            else:
                execution_price = current_price - market_impact - slippage

        # Calculate fees
        fee = Decimal("0")
        if self.config.enable_fees:
            venue = order.venue or self.config.venues[0]
            # Assume taker for simplicity (market orders)
            if order.order_type == OrderType.MARKET:
                fee_bps = venue.taker_fee * 10000
            else:
                fee_bps = venue.maker_fee * 10000

            fee = execution_price * fill_qty * venue.taker_fee
            self.total_fees += fee

        # Create fill
        fill = Fill(
            order_id=order.order_id,
            instrument=order.instrument,
            side=order.side,
            quantity=fill_qty,
            price=execution_price,
            venue=order.venue or self.config.venues[0],
            commission=fee,
            timestamp=self.current_time
        )

        self.fills.append(fill)

        # Update order
        order.filled_quantity += fill_qty
        order.avg_fill_price = execution_price

        if order.filled_quantity >= order.quantity:
            order.status = OrderStatus.FILLED
            self.filled_orders.append(order)
        else:
            order.status = OrderStatus.PARTIALLY_FILLED

        # Update position
        self._update_position(fill)

        logger.info(f"Fill: {fill.quantity} {symbol} @ {execution_price} "
                   f"(impact: {market_impact}, slippage: {slippage}, fee: {fee})")

        return order.status == OrderStatus.FILLED

    def _update_position(self, fill: Fill):
        """Update position based on fill"""
        symbol = fill.instrument.symbol

        if symbol not in self.positions:
            self.positions[symbol] = Position(
                instrument=fill.instrument,
                quantity=Decimal("0"),
                avg_entry_price=Decimal("0")
            )

        position = self.positions[symbol]

        if fill.side == Side.BUY:
            # Opening or adding to long position
            new_qty = position.quantity + fill.quantity
            if new_qty != 0:
                position.avg_entry_price = (
                    (position.avg_entry_price * position.quantity +
                     fill.price * fill.quantity) / new_qty
                )
            position.quantity = new_qty
        else:
            # Closing or adding to short position
            if position.quantity > 0:
                # Closing long position - calculate realized P&L
                closed_qty = min(fill.quantity, position.quantity)
                pnl = (fill.price - position.avg_entry_price) * closed_qty - fill.commission
                position.realized_pnl += pnl
                self.trade_pnls.append(pnl)
                self.capital += pnl

            position.quantity -= fill.quantity

        # Deduct trade cost from capital
        trade_cost = fill.quantity * fill.price + fill.commission
        if fill.side == Side.BUY:
            self.capital -= trade_cost
        else:
            self.capital += trade_cost

    def update_market_data(
        self,
        timestamp: datetime,
        prices: Dict[str, Decimal],
        volumes: Optional[Dict[str, Decimal]] = None,
        order_books: Optional[Dict[str, OrderBookSnapshot]] = None
    ):
        """
        Update market data for backtesting.

        Args:
            timestamp: Current timestamp
            prices: Current prices by symbol
            volumes: Daily volumes by symbol
            order_books: Order book snapshots
        """
        self.current_time = timestamp
        self.market_prices = prices

        if volumes:
            self.daily_volumes = volumes

        if order_books:
            for symbol, snapshot in order_books.items():
                for venue in self.config.venues:
                    key = f"{symbol}_{venue.venue_id}"
                    if key in self.order_books:
                        self.order_books[key].update(snapshot)

        # Update unrealized P&L
        self._update_unrealized_pnl()

        # Record equity
        total_equity = self._calculate_total_equity()
        self.equity_history.append((timestamp, total_equity))

        # Process pending orders
        self.process_orders()

    def _update_unrealized_pnl(self):
        """Update unrealized P&L for all positions"""
        for symbol, position in self.positions.items():
            if position.quantity != 0 and symbol in self.market_prices:
                current_price = self.market_prices[symbol]
                position.unrealized_pnl = (
                    (current_price - position.avg_entry_price) * position.quantity
                )
                position.total_pnl = position.realized_pnl + position.unrealized_pnl

    def _calculate_total_equity(self) -> Decimal:
        """Calculate total equity (capital + unrealized P&L)"""
        unrealized_pnl = sum(
            p.unrealized_pnl for p in self.positions.values()
        )
        return self.capital + unrealized_pnl

    def get_results(self) -> BacktestResult:
        """Calculate and return backtest results"""
        if not self.equity_history:
            logger.warning("No equity history to analyze")
            return BacktestResult(
                config=self.config,
                start_time=self.config.start_date,
                end_time=self.config.end_date,
                duration_seconds=0
            )

        # Calculate performance metrics
        initial_equity = self.config.initial_capital
        final_equity = self.equity_history[-1][1]
        total_pnl = final_equity - initial_equity
        total_return_pct = float(total_pnl / initial_equity * 100)

        # Calculate returns time series
        returns = []
        for i in range(1, len(self.equity_history)):
            prev_equity = self.equity_history[i-1][1]
            curr_equity = self.equity_history[i][1]
            if prev_equity > 0:
                ret = float((curr_equity - prev_equity) / prev_equity)
                returns.append(ret)

        # Sharpe ratio (annualized, assuming 252 trading days)
        if len(returns) > 0 and np.std(returns) > 0:
            sharpe_ratio = np.mean(returns) / np.std(returns) * np.sqrt(252)
        else:
            sharpe_ratio = 0.0

        # Sortino ratio (downside deviation)
        downside_returns = [r for r in returns if r < 0]
        if len(downside_returns) > 0 and np.std(downside_returns) > 0:
            sortino_ratio = np.mean(returns) / np.std(downside_returns) * np.sqrt(252)
        else:
            sortino_ratio = 0.0

        # Max drawdown
        max_equity = initial_equity
        max_drawdown = Decimal("0")
        for _, equity in self.equity_history:
            max_equity = max(max_equity, equity)
            drawdown = max_equity - equity
            max_drawdown = max(max_drawdown, drawdown)

        max_drawdown_pct = float(max_drawdown / max_equity * 100) if max_equity > 0 else 0.0

        # Trade statistics
        total_trades = len(self.trade_pnls)
        winning_trades = len([pnl for pnl in self.trade_pnls if pnl > 0])
        losing_trades = len([pnl for pnl in self.trade_pnls if pnl < 0])
        win_rate = winning_trades / total_trades if total_trades > 0 else 0.0

        wins = [pnl for pnl in self.trade_pnls if pnl > 0]
        losses = [pnl for pnl in self.trade_pnls if pnl < 0]

        avg_win = sum(wins) / len(wins) if wins else Decimal("0")
        avg_loss = sum(losses) / len(losses) if losses else Decimal("0")

        gross_profit = sum(wins) if wins else Decimal("0")
        gross_loss = abs(sum(losses)) if losses else Decimal("0")
        profit_factor = float(gross_profit / gross_loss) if gross_loss > 0 else 0.0

        # Execution metrics
        total_volume = sum(fill.quantity * fill.price for fill in self.fills)
        avg_slippage_bps = float(self.total_slippage / total_volume * 10000) if total_volume > 0 else 0.0
        avg_impact_bps = float(self.total_impact / total_volume * 10000) if total_volume > 0 else 0.0

        # Create result
        duration = (self.config.end_date - self.config.start_date).total_seconds()

        result = BacktestResult(
            config=self.config,
            start_time=self.config.start_date,
            end_time=self.config.end_date,
            duration_seconds=duration,
            total_pnl=total_pnl,
            total_return_pct=total_return_pct,
            sharpe_ratio=sharpe_ratio,
            sortino_ratio=sortino_ratio,
            max_drawdown=max_drawdown,
            max_drawdown_pct=max_drawdown_pct,
            total_trades=total_trades,
            winning_trades=winning_trades,
            losing_trades=losing_trades,
            win_rate=win_rate,
            avg_win=avg_win,
            avg_loss=avg_loss,
            profit_factor=profit_factor,
            total_volume=total_volume,
            total_fees=self.total_fees,
            avg_slippage_bps=avg_slippage_bps,
            avg_market_impact_bps=avg_impact_bps,
            equity_curve=self.equity_history,
            daily_returns=returns
        )

        logger.info(f"Backtest complete: P&L=${total_pnl:.2f} ({total_return_pct:.2f}%) "
                   f"Sharpe={sharpe_ratio:.2f} MaxDD={max_drawdown_pct:.2f}%")

        return result
