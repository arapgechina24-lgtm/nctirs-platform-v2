"""
Risk Management Layer - Pre-trade and post-trade risk controls
Independent of strategy logic for institutional-grade protection
"""
import logging
from typing import Dict, Tuple, Optional, List
from datetime import datetime, timedelta
from collections import defaultdict
from dataclasses import dataclass, field

from core.data_structures.order import Order, OrderSide, Fill


@dataclass
class RiskLimits:
    """Risk limit configuration"""
    # Position limits
    max_position_size: float = 1000000.0  # Max position per symbol
    max_total_exposure: float = 10000000.0  # Max total exposure across all positions

    # Order size limits
    max_order_size: float = 100000.0  # Max single order size
    min_order_size: float = 100.0  # Min order size (prevent fat-finger)

    # Daily limits
    max_daily_loss: float = 50000.0  # Max daily loss
    max_daily_volume: float = 50000000.0  # Max daily traded volume
    max_trades_per_day: int = 10000  # Max number of trades per day

    # Concentration limits
    max_position_concentration: float = 0.3  # Max 30% in single symbol

    # Volatility limits
    max_price_deviation: float = 0.05  # 5% max price deviation from reference

    # Rate limits
    max_orders_per_second: int = 100
    max_cancels_per_second: int = 200

    # Drawdown protection
    max_drawdown_pct: float = 0.10  # 10% max drawdown from daily high


@dataclass
class RiskMetrics:
    """Current risk metrics"""
    timestamp: datetime = field(default_factory=datetime.utcnow)

    # Position metrics
    positions: Dict[str, float] = field(default_factory=dict)  # {symbol: net_position}
    total_exposure: float = 0.0

    # Daily metrics
    daily_pnl: float = 0.0
    daily_volume: float = 0.0
    daily_trades: int = 0
    daily_high_equity: float = 0.0
    daily_low_equity: float = 0.0

    # Rate metrics
    orders_this_second: int = 0
    cancels_this_second: int = 0
    last_rate_reset: datetime = field(default_factory=datetime.utcnow)


class RiskManager:
    """
    Hard-stop risk manager that operates independently of strategy
    All orders must pass pre-trade risk checks
    """

    def __init__(self, limits: RiskLimits, initial_capital: float = 1000000.0):
        self.limits = limits
        self.initial_capital = initial_capital
        self.current_capital = initial_capital
        self.logger = logging.getLogger(self.__class__.__name__)

        # Risk state
        self.metrics = RiskMetrics()
        self.metrics.daily_high_equity = initial_capital

        # Order tracking
        self.pending_orders: Dict[str, Order] = {}
        self.fills_today: List[Fill] = []

        # Circuit breaker
        self.is_trading_halted: bool = False
        self.halt_reason: Optional[str] = None

        # Reference prices for fat-finger protection
        self.reference_prices: Dict[str, float] = {}

    async def pre_trade_check(self, order: Order) -> Tuple[bool, str]:
        """
        Comprehensive pre-trade risk check
        Returns (approved, reason)
        """
        if self.is_trading_halted:
            return False, f"Trading halted: {self.halt_reason}"

        # Check 1: Fat-finger protection
        approved, reason = self._check_fat_finger(order)
        if not approved:
            return False, f"Fat-finger check failed: {reason}"

        # Check 2: Order size limits
        approved, reason = self._check_order_size(order)
        if not approved:
            return False, f"Order size check failed: {reason}"

        # Check 3: Position limits
        approved, reason = self._check_position_limits(order)
        if not approved:
            return False, f"Position limit check failed: {reason}"

        # Check 4: Daily loss limit
        approved, reason = self._check_daily_loss_limit()
        if not approved:
            return False, f"Daily loss limit check failed: {reason}"

        # Check 5: Daily volume limit
        approved, reason = self._check_daily_volume_limit(order)
        if not approved:
            return False, f"Daily volume limit check failed: {reason}"

        # Check 6: Rate limits
        approved, reason = self._check_rate_limits(order)
        if not approved:
            return False, f"Rate limit check failed: {reason}"

        # Check 7: Concentration limits
        approved, reason = self._check_concentration_limits(order)
        if not approved:
            return False, f"Concentration limit check failed: {reason}"

        # Check 8: Drawdown protection
        approved, reason = self._check_drawdown_limit()
        if not approved:
            return False, f"Drawdown limit check failed: {reason}"

        # All checks passed
        self.pending_orders[order.order_id] = order
        self.logger.info(f"Pre-trade check passed: {order.order_id}")
        return True, "Approved"

    def _check_fat_finger(self, order: Order) -> Tuple[bool, str]:
        """
        Detect erroneous orders (fat-finger protection)
        Check if order price deviates significantly from reference price
        """
        if order.price is None:
            return True, "Market order"

        # Get reference price
        ref_price = self.reference_prices.get(order.symbol)
        if ref_price is None:
            # No reference, allow (but log warning)
            self.logger.warning(f"No reference price for {order.symbol}")
            return True, "No reference price"

        # Check deviation
        deviation = abs(order.price - ref_price) / ref_price

        if deviation > self.limits.max_price_deviation:
            return False, (
                f"Price deviation {deviation:.2%} exceeds limit "
                f"{self.limits.max_price_deviation:.2%} "
                f"(order={order.price}, ref={ref_price})"
            )

        return True, "Price within acceptable range"

    def _check_order_size(self, order: Order) -> Tuple[bool, str]:
        """Check order size is within acceptable range"""
        if order.quantity < self.limits.min_order_size:
            return False, f"Order size {order.quantity} below minimum {self.limits.min_order_size}"

        if order.quantity > self.limits.max_order_size:
            return False, f"Order size {order.quantity} exceeds maximum {self.limits.max_order_size}"

        return True, "Order size acceptable"

    def _check_position_limits(self, order: Order) -> Tuple[bool, str]:
        """Check if order would exceed position limits"""
        current_position = self.metrics.positions.get(order.symbol, 0.0)
        order_delta = order.quantity if order.side == OrderSide.BUY else -order.quantity
        new_position = current_position + order_delta

        # Check single symbol position limit
        if abs(new_position) > self.limits.max_position_size:
            return False, (
                f"New position {new_position} would exceed limit "
                f"{self.limits.max_position_size}"
            )

        # Check total exposure
        new_total_exposure = self.metrics.total_exposure + abs(order_delta * (order.price or 0))
        if new_total_exposure > self.limits.max_total_exposure:
            return False, (
                f"New total exposure {new_total_exposure} would exceed limit "
                f"{self.limits.max_total_exposure}"
            )

        return True, "Position limits OK"

    def _check_daily_loss_limit(self) -> Tuple[bool, str]:
        """Check daily loss limit"""
        if -self.metrics.daily_pnl > self.limits.max_daily_loss:
            self._trigger_circuit_breaker(
                f"Daily loss {-self.metrics.daily_pnl} exceeds limit {self.limits.max_daily_loss}"
            )
            return False, "Daily loss limit exceeded"

        return True, "Daily loss within limit"

    def _check_daily_volume_limit(self, order: Order) -> Tuple[bool, str]:
        """Check daily trading volume limit"""
        order_notional = order.quantity * (order.price or 0)
        new_daily_volume = self.metrics.daily_volume + order_notional

        if new_daily_volume > self.limits.max_daily_volume:
            return False, (
                f"New daily volume {new_daily_volume} would exceed limit "
                f"{self.limits.max_daily_volume}"
            )

        # Check trade count
        if self.metrics.daily_trades >= self.limits.max_trades_per_day:
            return False, f"Daily trade count limit {self.limits.max_trades_per_day} reached"

        return True, "Daily volume OK"

    def _check_rate_limits(self, order: Order) -> Tuple[bool, str]:
        """Check order rate limits"""
        now = datetime.utcnow()

        # Reset counters if new second
        if (now - self.metrics.last_rate_reset).total_seconds() >= 1.0:
            self.metrics.orders_this_second = 0
            self.metrics.cancels_this_second = 0
            self.metrics.last_rate_reset = now

        # Check order rate
        if self.metrics.orders_this_second >= self.limits.max_orders_per_second:
            return False, f"Order rate limit {self.limits.max_orders_per_second}/s exceeded"

        self.metrics.orders_this_second += 1
        return True, "Rate limit OK"

    def _check_concentration_limits(self, order: Order) -> Tuple[bool, str]:
        """Check position concentration limits"""
        if not self.metrics.total_exposure:
            return True, "No concentration risk"

        current_position_value = abs(self.metrics.positions.get(order.symbol, 0.0) * (order.price or 0))
        order_value = order.quantity * (order.price or 0)
        new_position_value = current_position_value + order_value

        concentration = new_position_value / (self.metrics.total_exposure + order_value)

        if concentration > self.limits.max_position_concentration:
            return False, (
                f"Position concentration {concentration:.2%} would exceed limit "
                f"{self.limits.max_position_concentration:.2%}"
            )

        return True, "Concentration OK"

    def _check_drawdown_limit(self) -> Tuple[bool, str]:
        """Check drawdown from daily high"""
        if self.metrics.daily_high_equity == 0:
            return True, "No drawdown"

        drawdown = (self.metrics.daily_high_equity - self.current_capital) / self.metrics.daily_high_equity

        if drawdown > self.limits.max_drawdown_pct:
            self._trigger_circuit_breaker(
                f"Drawdown {drawdown:.2%} exceeds limit {self.limits.max_drawdown_pct:.2%}"
            )
            return False, "Drawdown limit exceeded"

        return True, "Drawdown within limit"

    def _trigger_circuit_breaker(self, reason: str):
        """Halt all trading"""
        self.is_trading_halted = True
        self.halt_reason = reason
        self.logger.critical(f"CIRCUIT BREAKER TRIGGERED: {reason}")

    def on_fill(self, fill: Fill):
        """Update risk metrics on fill"""
        # Update position
        position_delta = fill.quantity if fill.side == OrderSide.BUY else -fill.quantity
        current_position = self.metrics.positions.get(fill.symbol, 0.0)
        self.metrics.positions[fill.symbol] = current_position + position_delta

        # Update daily metrics
        self.metrics.daily_volume += fill.notional
        self.metrics.daily_trades += 1
        self.fills_today.append(fill)

        # Update PnL (simplified - assumes position was flat at start of day)
        # In production, track cost basis properly
        pnl_delta = -fill.notional if fill.side == OrderSide.BUY else fill.notional
        self.metrics.daily_pnl += pnl_delta
        self.current_capital = self.initial_capital + self.metrics.daily_pnl

        # Update high water mark
        if self.current_capital > self.metrics.daily_high_equity:
            self.metrics.daily_high_equity = self.current_capital

        # Recalculate total exposure
        self._recalculate_exposure()

        # Remove from pending
        if fill.order_id in self.pending_orders:
            del self.pending_orders[fill.order_id]

        self.logger.info(
            f"Fill processed: {fill.symbol} {fill.side.value} {fill.quantity}@{fill.price}, "
            f"PnL: {self.metrics.daily_pnl:.2f}, Capital: {self.current_capital:.2f}"
        )

    def _recalculate_exposure(self):
        """Recalculate total exposure"""
        self.metrics.total_exposure = sum(
            abs(pos * self.reference_prices.get(symbol, 0))
            for symbol, pos in self.metrics.positions.items()
        )

    def update_reference_price(self, symbol: str, price: float):
        """Update reference price for symbol"""
        self.reference_prices[symbol] = price

    def reset_daily_metrics(self):
        """Reset daily metrics (call at start of trading day)"""
        self.logger.info(f"Resetting daily metrics. Final PnL: {self.metrics.daily_pnl:.2f}")

        self.initial_capital = self.current_capital
        self.metrics = RiskMetrics()
        self.metrics.daily_high_equity = self.current_capital
        self.fills_today = []
        self.is_trading_halted = False
        self.halt_reason = None

    def get_risk_report(self) -> Dict:
        """Generate risk report"""
        return {
            'timestamp': datetime.utcnow().isoformat(),
            'is_trading_halted': self.is_trading_halted,
            'halt_reason': self.halt_reason,
            'current_capital': self.current_capital,
            'daily_pnl': self.metrics.daily_pnl,
            'daily_volume': self.metrics.daily_volume,
            'daily_trades': self.metrics.daily_trades,
            'total_exposure': self.metrics.total_exposure,
            'positions': self.metrics.positions,
            'daily_high': self.metrics.daily_high_equity,
            'current_drawdown': (
                (self.metrics.daily_high_equity - self.current_capital) /
                self.metrics.daily_high_equity if self.metrics.daily_high_equity > 0 else 0
            ),
            'utilization': {
                'max_position': max(abs(p) for p in self.metrics.positions.values()) / self.limits.max_position_size if self.metrics.positions else 0,
                'total_exposure': self.metrics.total_exposure / self.limits.max_total_exposure,
                'daily_volume': self.metrics.daily_volume / self.limits.max_daily_volume,
                'daily_trades': self.metrics.daily_trades / self.limits.max_trades_per_day,
            }
        }
