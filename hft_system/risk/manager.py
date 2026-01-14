"""
Risk Management System

Implements institutional-grade risk controls:
- Pre-trade risk checks (fat-finger protection, position limits, etc.)
- Post-trade monitoring
- Real-time P&L tracking
- Hard-stop mechanisms

This module operates INDEPENDENTLY of strategy logic to ensure
risk limits are enforced regardless of strategy behavior.
"""

from typing import Dict, Optional, List, Callable
from decimal import Decimal
from datetime import datetime, timedelta
from dataclasses import dataclass
import logging
from enum import Enum

from core.types import (
    Order, Fill, Position, Instrument, Side,
    OrderStatus, RiskLimits
)


logger = logging.getLogger(__name__)


class RiskViolationType(Enum):
    """Types of risk violations"""
    FAT_FINGER = "FAT_FINGER"  # Unusually large order
    POSITION_LIMIT = "POSITION_LIMIT"  # Exceeds max position
    ORDER_SIZE_LIMIT = "ORDER_SIZE_LIMIT"  # Single order too large
    DAILY_LOSS_LIMIT = "DAILY_LOSS_LIMIT"  # Daily loss exceeded
    DAILY_VOLUME_LIMIT = "DAILY_VOLUME_LIMIT"  # Daily volume exceeded
    ORDER_VALUE_LIMIT = "ORDER_VALUE_LIMIT"  # Order value too large/small
    MAX_OPEN_ORDERS = "MAX_OPEN_ORDERS"  # Too many open orders
    INVALID_PRICE = "INVALID_PRICE"  # Price outside acceptable range
    SELF_TRADE = "SELF_TRADE"  # Would trade against own order


@dataclass
class RiskViolation:
    """Risk violation details"""
    violation_type: RiskViolationType
    description: str
    order: Order
    timestamp: datetime
    severity: str = "HIGH"  # LOW, MEDIUM, HIGH, CRITICAL


@dataclass
class RiskMetrics:
    """Current risk metrics"""
    total_position_value: Decimal = Decimal("0")
    daily_pnl: Decimal = Decimal("0")
    daily_volume: Decimal = Decimal("0")
    open_order_count: int = 0
    max_position_concentration: float = 0.0
    var_95: Decimal = Decimal("0")  # Value at Risk 95%
    sharpe_ratio: float = 0.0
    max_drawdown: Decimal = Decimal("0")


class PreTradeRiskManager:
    """
    Pre-Trade Risk Checks

    Validates all orders BEFORE they are sent to the market.
    Acts as a hard-stop to prevent risky orders from execution.
    """

    def __init__(self, risk_limits: RiskLimits):
        self.limits = risk_limits
        self.violation_history: List[RiskViolation] = []
        self.rejection_count = 0

        # Callbacks
        self.on_violation: Optional[Callable[[RiskViolation], None]] = None

    def check_order(
        self,
        order: Order,
        current_positions: Dict[str, Position],
        open_orders: List[Order],
        daily_pnl: Decimal,
        daily_volume: Decimal,
        current_price: Decimal
    ) -> tuple[bool, Optional[RiskViolation]]:
        """
        Perform comprehensive pre-trade risk checks.

        Args:
            order: Order to validate
            current_positions: Current positions by symbol
            open_orders: List of open orders
            daily_pnl: Current daily P&L
            daily_volume: Current daily volume traded
            current_price: Current market price

        Returns:
            (is_valid, violation) - True if order passes all checks
        """
        logger.debug(f"Pre-trade risk check for order {order.order_id}")

        # 1. Fat-finger check: Detect unusually large orders
        violation = self._check_fat_finger(order, current_price)
        if violation:
            return False, violation

        # 2. Order size limit
        violation = self._check_order_size(order)
        if violation:
            return False, violation

        # 3. Order value limit
        violation = self._check_order_value(order, current_price)
        if violation:
            return False, violation

        # 4. Position limit
        violation = self._check_position_limit(order, current_positions)
        if violation:
            return False, violation

        # 5. Daily loss limit
        violation = self._check_daily_loss(order, daily_pnl)
        if violation:
            return False, violation

        # 6. Daily volume limit
        violation = self._check_daily_volume(order, daily_volume, current_price)
        if violation:
            return False, violation

        # 7. Max open orders
        violation = self._check_max_open_orders(open_orders)
        if violation:
            return False, violation

        # 8. Price validity
        violation = self._check_price_validity(order, current_price)
        if violation:
            return False, violation

        # 9. Self-trade check
        violation = self._check_self_trade(order, open_orders)
        if violation:
            return False, violation

        logger.info(f"Pre-trade risk check PASSED for order {order.order_id}")
        return True, None

    def _check_fat_finger(
        self,
        order: Order,
        current_price: Decimal
    ) -> Optional[RiskViolation]:
        """
        Fat-finger protection: Detect orders that are significantly
        larger than typical order size or have unreasonable prices.
        """
        order_value = order.quantity * current_price

        # Check if order value is more than 10x the typical max order
        fat_finger_threshold = self.limits.max_order_value * Decimal("10")

        if order_value > fat_finger_threshold:
            violation = RiskViolation(
                violation_type=RiskViolationType.FAT_FINGER,
                description=f"Order value ${order_value} exceeds fat-finger threshold ${fat_finger_threshold}",
                order=order,
                timestamp=datetime.utcnow(),
                severity="CRITICAL"
            )
            self._record_violation(violation)
            return violation

        # Check price deviation from market
        if order.price:
            price_deviation = abs(order.price - current_price) / current_price
            if price_deviation > Decimal("0.05"):  # 5% deviation
                violation = RiskViolation(
                    violation_type=RiskViolationType.FAT_FINGER,
                    description=f"Order price {order.price} deviates {price_deviation:.2%} from market {current_price}",
                    order=order,
                    timestamp=datetime.utcnow(),
                    severity="HIGH"
                )
                self._record_violation(violation)
                return violation

        return None

    def _check_order_size(self, order: Order) -> Optional[RiskViolation]:
        """Check order size against limits"""
        if order.quantity > self.limits.max_order_size:
            violation = RiskViolation(
                violation_type=RiskViolationType.ORDER_SIZE_LIMIT,
                description=f"Order size {order.quantity} exceeds limit {self.limits.max_order_size}",
                order=order,
                timestamp=datetime.utcnow(),
                severity="HIGH"
            )
            self._record_violation(violation)
            return violation
        return None

    def _check_order_value(
        self,
        order: Order,
        current_price: Decimal
    ) -> Optional[RiskViolation]:
        """Check order notional value"""
        order_value = order.quantity * current_price

        if order_value > self.limits.max_order_value:
            violation = RiskViolation(
                violation_type=RiskViolationType.ORDER_VALUE_LIMIT,
                description=f"Order value ${order_value} exceeds max ${self.limits.max_order_value}",
                order=order,
                timestamp=datetime.utcnow(),
                severity="HIGH"
            )
            self._record_violation(violation)
            return violation

        if order_value < self.limits.min_order_value:
            violation = RiskViolation(
                violation_type=RiskViolationType.ORDER_VALUE_LIMIT,
                description=f"Order value ${order_value} below min ${self.limits.min_order_value}",
                order=order,
                timestamp=datetime.utcnow(),
                severity="LOW"
            )
            self._record_violation(violation)
            return violation

        return None

    def _check_position_limit(
        self,
        order: Order,
        current_positions: Dict[str, Position]
    ) -> Optional[RiskViolation]:
        """Check if order would exceed position limits"""
        symbol = order.instrument.symbol
        current_position = current_positions.get(symbol, Position(
            instrument=order.instrument,
            quantity=Decimal("0"),
            avg_entry_price=Decimal("0")
        ))

        # Calculate position after order
        if order.side == Side.BUY:
            new_position = current_position.quantity + order.quantity
        else:
            new_position = current_position.quantity - order.quantity

        # Check absolute position limit
        if abs(new_position) > self.limits.max_position_size:
            violation = RiskViolation(
                violation_type=RiskViolationType.POSITION_LIMIT,
                description=f"Position {new_position} would exceed limit {self.limits.max_position_size}",
                order=order,
                timestamp=datetime.utcnow(),
                severity="HIGH"
            )
            self._record_violation(violation)
            return violation

        return None

    def _check_daily_loss(
        self,
        order: Order,
        daily_pnl: Decimal
    ) -> Optional[RiskViolation]:
        """Check if daily loss limit has been breached"""
        if daily_pnl < -self.limits.max_daily_loss:
            violation = RiskViolation(
                violation_type=RiskViolationType.DAILY_LOSS_LIMIT,
                description=f"Daily loss ${-daily_pnl} exceeds limit ${self.limits.max_daily_loss}",
                order=order,
                timestamp=datetime.utcnow(),
                severity="CRITICAL"
            )
            self._record_violation(violation)
            return violation
        return None

    def _check_daily_volume(
        self,
        order: Order,
        daily_volume: Decimal,
        current_price: Decimal
    ) -> Optional[RiskViolation]:
        """Check daily volume limit"""
        order_volume = order.quantity * current_price
        total_volume = daily_volume + order_volume

        if total_volume > self.limits.max_daily_volume:
            violation = RiskViolation(
                violation_type=RiskViolationType.DAILY_VOLUME_LIMIT,
                description=f"Daily volume ${total_volume} would exceed limit ${self.limits.max_daily_volume}",
                order=order,
                timestamp=datetime.utcnow(),
                severity="MEDIUM"
            )
            self._record_violation(violation)
            return violation
        return None

    def _check_max_open_orders(
        self,
        open_orders: List[Order]
    ) -> Optional[RiskViolation]:
        """Check maximum open orders limit"""
        if len(open_orders) >= self.limits.max_open_orders:
            violation = RiskViolation(
                violation_type=RiskViolationType.MAX_OPEN_ORDERS,
                description=f"Open orders {len(open_orders)} at limit {self.limits.max_open_orders}",
                order=None,
                timestamp=datetime.utcnow(),
                severity="MEDIUM"
            )
            self._record_violation(violation)
            return violation
        return None

    def _check_price_validity(
        self,
        order: Order,
        current_price: Decimal
    ) -> Optional[RiskViolation]:
        """Validate order price is within reasonable bounds"""
        if not order.price:
            return None  # Market order, no price check

        # Check if price is positive
        if order.price <= 0:
            violation = RiskViolation(
                violation_type=RiskViolationType.INVALID_PRICE,
                description=f"Invalid price {order.price}",
                order=order,
                timestamp=datetime.utcnow(),
                severity="CRITICAL"
            )
            self._record_violation(violation)
            return violation

        # Check if price is within 50% of current market price
        max_deviation = Decimal("0.50")  # 50%
        lower_bound = current_price * (1 - max_deviation)
        upper_bound = current_price * (1 + max_deviation)

        if order.price < lower_bound or order.price > upper_bound:
            violation = RiskViolation(
                violation_type=RiskViolationType.INVALID_PRICE,
                description=f"Price {order.price} outside valid range [{lower_bound}, {upper_bound}]",
                order=order,
                timestamp=datetime.utcnow(),
                severity="HIGH"
            )
            self._record_violation(violation)
            return violation

        return None

    def _check_self_trade(
        self,
        order: Order,
        open_orders: List[Order]
    ) -> Optional[RiskViolation]:
        """Check if order would trade against own open orders"""
        for open_order in open_orders:
            # Check same instrument
            if open_order.instrument.symbol != order.instrument.symbol:
                continue

            # Check opposite side
            if open_order.side == order.side:
                continue

            # Check price cross
            if order.price and open_order.price:
                if order.side == Side.BUY and order.price >= open_order.price:
                    # Buy order at/above own sell order
                    violation = RiskViolation(
                        violation_type=RiskViolationType.SELF_TRADE,
                        description=f"Order would self-trade with order {open_order.order_id}",
                        order=order,
                        timestamp=datetime.utcnow(),
                        severity="MEDIUM"
                    )
                    self._record_violation(violation)
                    return violation
                elif order.side == Side.SELL and order.price <= open_order.price:
                    # Sell order at/below own buy order
                    violation = RiskViolation(
                        violation_type=RiskViolationType.SELF_TRADE,
                        description=f"Order would self-trade with order {open_order.order_id}",
                        order=order,
                        timestamp=datetime.utcnow(),
                        severity="MEDIUM"
                    )
                    self._record_violation(violation)
                    return violation

        return None

    def _record_violation(self, violation: RiskViolation):
        """Record risk violation"""
        self.violation_history.append(violation)
        self.rejection_count += 1

        logger.warning(f"RISK VIOLATION [{violation.severity}]: {violation.violation_type.value} - "
                      f"{violation.description}")

        if self.on_violation:
            self.on_violation(violation)


class PostTradeRiskMonitor:
    """
    Post-Trade Risk Monitoring

    Continuously monitors positions and P&L.
    Triggers alerts and automatic position closure if limits are breached.
    """

    def __init__(self, risk_limits: RiskLimits):
        self.limits = risk_limits
        self.positions: Dict[str, Position] = {}
        self.daily_pnl = Decimal("0")
        self.daily_volume = Decimal("0")
        self.session_start = datetime.utcnow()

        # Alert thresholds
        self.loss_alert_threshold = self.limits.max_daily_loss * Decimal("0.75")  # 75% of limit

        # Callbacks
        self.on_risk_alert: Optional[Callable[[str], None]] = None
        self.on_emergency_stop: Optional[Callable[[], None]] = None

    def update_position(self, fill: Fill):
        """Update position based on fill"""
        symbol = fill.instrument.symbol

        if symbol not in self.positions:
            self.positions[symbol] = Position(
                instrument=fill.instrument,
                quantity=Decimal("0"),
                avg_entry_price=Decimal("0")
            )

        position = self.positions[symbol]

        # Update position quantity and average price
        if fill.side == Side.BUY:
            new_qty = position.quantity + fill.quantity
            if new_qty != 0:
                position.avg_entry_price = (
                    (position.avg_entry_price * position.quantity + fill.price * fill.quantity) / new_qty
                )
            position.quantity = new_qty
        else:
            # Calculate realized P&L on sell
            if position.quantity > 0:
                realized_pnl = (fill.price - position.avg_entry_price) * fill.quantity
                position.realized_pnl += realized_pnl
                self.daily_pnl += realized_pnl

            position.quantity -= fill.quantity

        # Update daily volume
        self.daily_volume += fill.quantity * fill.price

        position.last_update = datetime.utcnow()

        logger.info(f"Position update: {symbol} qty={position.quantity} "
                   f"avg_price={position.avg_entry_price}")

        # Check for risk breaches
        self._check_risk_breaches()

    def update_market_prices(self, prices: Dict[str, Decimal]):
        """Update unrealized P&L based on current market prices"""
        for symbol, position in self.positions.items():
            if symbol in prices and position.quantity != 0:
                current_price = prices[symbol]
                position.unrealized_pnl = (
                    (current_price - position.avg_entry_price) * position.quantity
                )
                position.total_pnl = position.realized_pnl + position.unrealized_pnl

        # Recalculate daily P&L
        total_unrealized = sum(p.unrealized_pnl for p in self.positions.values())
        self.daily_pnl = sum(p.realized_pnl for p in self.positions.values()) + total_unrealized

        # Check for risk breaches
        self._check_risk_breaches()

    def _check_risk_breaches(self):
        """Check for post-trade risk limit breaches"""
        # Daily loss limit
        if self.daily_pnl < -self.limits.max_daily_loss:
            self._trigger_emergency_stop(
                f"DAILY LOSS LIMIT BREACHED: ${-self.daily_pnl} > ${self.limits.max_daily_loss}"
            )
        elif self.daily_pnl < -self.loss_alert_threshold:
            self._trigger_alert(
                f"Daily loss warning: ${-self.daily_pnl} approaching limit ${self.limits.max_daily_loss}"
            )

        # Position size limits
        for symbol, position in self.positions.items():
            if abs(position.quantity) > self.limits.max_position_size:
                self._trigger_alert(
                    f"Position limit exceeded: {symbol} qty={position.quantity} > {self.limits.max_position_size}"
                )

    def _trigger_alert(self, message: str):
        """Trigger risk alert"""
        logger.warning(f"RISK ALERT: {message}")
        if self.on_risk_alert:
            self.on_risk_alert(message)

    def _trigger_emergency_stop(self, message: str):
        """Trigger emergency stop - halt all trading"""
        logger.critical(f"EMERGENCY STOP: {message}")
        if self.on_emergency_stop:
            self.on_emergency_stop()

    def get_risk_metrics(self) -> RiskMetrics:
        """Calculate current risk metrics"""
        total_position_value = sum(
            abs(p.quantity * p.avg_entry_price) for p in self.positions.values()
        )

        open_positions = len([p for p in self.positions.values() if p.quantity != 0])

        # Calculate position concentration (largest position as % of total)
        if total_position_value > 0:
            max_concentration = max(
                abs(p.quantity * p.avg_entry_price) / total_position_value
                for p in self.positions.values()
                if p.quantity != 0
            ) if open_positions > 0 else 0.0
        else:
            max_concentration = 0.0

        return RiskMetrics(
            total_position_value=total_position_value,
            daily_pnl=self.daily_pnl,
            daily_volume=self.daily_volume,
            open_order_count=open_positions,
            max_position_concentration=max_concentration
        )

    def reset_daily_metrics(self):
        """Reset daily metrics (call at start of new trading day)"""
        self.daily_pnl = Decimal("0")
        self.daily_volume = Decimal("0")
        self.session_start = datetime.utcnow()

        # Reset realized P&L in positions
        for position in self.positions.values():
            position.realized_pnl = Decimal("0")

        logger.info("Daily risk metrics reset")


class RiskManager:
    """
    Unified Risk Manager

    Combines pre-trade and post-trade risk management into a single interface.
    """

    def __init__(self, risk_limits: RiskLimits):
        self.pre_trade = PreTradeRiskManager(risk_limits)
        self.post_trade = PostTradeRiskMonitor(risk_limits)
        self.is_trading_halted = False

        # Set up callbacks
        self.post_trade.on_emergency_stop = self._handle_emergency_stop

    def check_order(self, order: Order, current_price: Decimal) -> tuple[bool, Optional[RiskViolation]]:
        """Pre-trade risk check for order"""
        if self.is_trading_halted:
            violation = RiskViolation(
                violation_type=RiskViolationType.DAILY_LOSS_LIMIT,
                description="Trading is halted due to risk limits",
                order=order,
                timestamp=datetime.utcnow(),
                severity="CRITICAL"
            )
            return False, violation

        open_orders = []  # Would come from order management system

        return self.pre_trade.check_order(
            order=order,
            current_positions=self.post_trade.positions,
            open_orders=open_orders,
            daily_pnl=self.post_trade.daily_pnl,
            daily_volume=self.post_trade.daily_volume,
            current_price=current_price
        )

    def on_fill(self, fill: Fill):
        """Handle fill for post-trade monitoring"""
        self.post_trade.update_position(fill)

    def update_market_data(self, prices: Dict[str, Decimal]):
        """Update market prices for P&L calculation"""
        self.post_trade.update_market_prices(prices)

    def _handle_emergency_stop(self):
        """Handle emergency stop"""
        self.is_trading_halted = True
        logger.critical("TRADING HALTED - Emergency stop triggered")

    def resume_trading(self):
        """Resume trading after halt (requires manual intervention)"""
        self.is_trading_halted = False
        logger.info("Trading resumed")

    def get_status(self) -> dict:
        """Get current risk status"""
        metrics = self.post_trade.get_risk_metrics()
        return {
            "is_halted": self.is_trading_halted,
            "daily_pnl": float(self.post_trade.daily_pnl),
            "daily_volume": float(self.post_trade.daily_volume),
            "positions": len(self.post_trade.positions),
            "risk_metrics": metrics,
            "violations_today": len(self.pre_trade.violation_history)
        }
