"""
Auto Trailing System

Implements sophisticated trailing stop mechanisms:
- Trailing Stop-Loss: Follows profitable positions
- Trailing Take-Profit: Locks in gains as price moves
- Dynamic Position Sizing: Adjusts based on volatility
- Profit Protection: Automatically secures gains
- Multiple Trailing Strategies

This system operates independently to protect positions and maximize returns.
"""

from typing import Dict, Optional, List, Callable
from decimal import Decimal
from datetime import datetime, timedelta
from dataclasses import dataclass, field
from enum import Enum
import asyncio
import logging

from core.types import (
    Order, Side, OrderType, Position, Instrument,
    Venue, Fill
)


logger = logging.getLogger(__name__)


class TrailingType(Enum):
    """Types of trailing mechanisms"""
    FIXED_DISTANCE = "FIXED_DISTANCE"  # Fixed dollar/pip distance
    PERCENTAGE = "PERCENTAGE"  # Percentage of price
    ATR_BASED = "ATR_BASED"  # Based on Average True Range
    VOLATILITY_ADJUSTED = "VOLATILITY_ADJUSTED"  # Adjusts with volatility
    STEP_TRAIL = "STEP_TRAIL"  # Steps at fixed intervals


class TrailingMode(Enum):
    """Trailing activation modes"""
    IMMEDIATE = "IMMEDIATE"  # Trail from entry
    PROFIT_THRESHOLD = "PROFIT_THRESHOLD"  # Only after profit target
    BREAKEVEN_PLUS = "BREAKEVEN_PLUS"  # After breakeven + buffer


@dataclass
class TrailingStopConfig:
    """Configuration for trailing stop"""
    trailing_type: TrailingType = TrailingType.PERCENTAGE
    trailing_mode: TrailingMode = TrailingMode.IMMEDIATE

    # Distance parameters
    trailing_distance: Decimal = Decimal("0.02")  # 2% default
    trailing_distance_pips: Decimal = Decimal("0.10")  # For fixed distance

    # Activation parameters
    activation_profit_pct: Decimal = Decimal("0.01")  # Activate at 1% profit
    breakeven_buffer_pct: Decimal = Decimal("0.005")  # 0.5% above breakeven

    # Step trail parameters
    step_size: Decimal = Decimal("0.01")  # 1% steps
    step_interval: Decimal = Decimal("0.02")  # Move every 2% gain

    # Protection parameters
    min_profit_lock: Decimal = Decimal("0.005")  # Minimum 0.5% profit to lock
    max_trailing_distance: Decimal = Decimal("0.05")  # Max 5% trail distance

    # Volatility adjustment
    use_volatility_adjustment: bool = True
    volatility_multiplier: float = 1.5  # Multiply ATR by this

    # Time-based parameters
    time_to_activation: Optional[timedelta] = None  # Wait before activating
    time_to_tighten: Optional[timedelta] = timedelta(hours=4)  # Tighten after time


@dataclass
class TrailingStop:
    """Active trailing stop for a position"""
    position_id: str
    instrument: Instrument
    side: Side
    entry_price: Decimal
    quantity: Decimal

    # Current trailing values
    current_stop_price: Decimal
    highest_price: Decimal  # For long positions
    lowest_price: Decimal  # For short positions

    # Configuration
    config: TrailingStopConfig

    # State
    is_active: bool = False
    activation_time: Optional[datetime] = None
    last_adjustment_time: datetime = field(default_factory=datetime.utcnow)
    adjustment_count: int = 0

    # Performance tracking
    max_profit_pct: Decimal = Decimal("0")
    current_profit_pct: Decimal = Decimal("0")
    protected_profit_pct: Decimal = Decimal("0")

    # Stop order
    stop_order_id: Optional[str] = None
    stop_order: Optional[Order] = None


class TrailingStopManager:
    """
    Manages trailing stops for all positions.

    Automatically adjusts stop-loss orders as positions move in favor,
    protecting profits while allowing for continued gains.
    """

    def __init__(
        self,
        execution_engine,
        market_data_provider,
        default_config: Optional[TrailingStopConfig] = None
    ):
        self.execution_engine = execution_engine
        self.market_data = market_data_provider
        self.default_config = default_config or TrailingStopConfig()

        # Active trailing stops by position ID
        self.trailing_stops: Dict[str, TrailingStop] = {}

        # Performance tracking
        self.total_adjustments = 0
        self.total_stops_triggered = 0
        self.total_profit_protected = Decimal("0")

        # Callbacks
        self.on_stop_adjusted: Optional[Callable[[TrailingStop], None]] = None
        self.on_stop_triggered: Optional[Callable[[TrailingStop], None]] = None
        self.on_profit_locked: Optional[Callable[[TrailingStop, Decimal], None]] = None

        # Background tasks
        self.is_running = False
        self.monitoring_task: Optional[asyncio.Task] = None

    async def start(self):
        """Start trailing stop monitoring"""
        if self.is_running:
            return

        self.is_running = True
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        logger.info("✅ Trailing Stop Manager started")

    async def stop(self):
        """Stop trailing stop monitoring"""
        self.is_running = False
        if self.monitoring_task:
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        logger.info("⚠️ Trailing Stop Manager stopped")

    def add_position(
        self,
        position_id: str,
        instrument: Instrument,
        side: Side,
        entry_price: Decimal,
        quantity: Decimal,
        config: Optional[TrailingStopConfig] = None
    ) -> TrailingStop:
        """
        Add a position to trailing stop management.

        Args:
            position_id: Unique position identifier
            instrument: Trading instrument
            side: Long (BUY) or Short (SELL)
            entry_price: Entry price of position
            quantity: Position size
            config: Optional custom config (uses default if not provided)

        Returns:
            TrailingStop object
        """
        config = config or self.default_config

        # Calculate initial stop price
        if side == Side.BUY:
            # Long position: stop below entry
            initial_stop = entry_price * (1 - config.trailing_distance)
            highest_price = entry_price
            lowest_price = Decimal("0")
        else:
            # Short position: stop above entry
            initial_stop = entry_price * (1 + config.trailing_distance)
            highest_price = Decimal("0")
            lowest_price = entry_price

        trailing_stop = TrailingStop(
            position_id=position_id,
            instrument=instrument,
            side=side,
            entry_price=entry_price,
            quantity=quantity,
            current_stop_price=initial_stop,
            highest_price=highest_price,
            lowest_price=lowest_price,
            config=config
        )

        # Activate immediately or wait based on mode
        if config.trailing_mode == TrailingMode.IMMEDIATE:
            trailing_stop.is_active = True
            trailing_stop.activation_time = datetime.utcnow()

        self.trailing_stops[position_id] = trailing_stop

        logger.info(
            f"📍 Added trailing stop for {instrument.symbol}: "
            f"Entry={entry_price}, Stop={initial_stop}, Distance={config.trailing_distance:.2%}"
        )

        return trailing_stop

    async def update_price(
        self,
        position_id: str,
        current_price: Decimal
    ) -> bool:
        """
        Update current price and adjust trailing stop if needed.

        Args:
            position_id: Position identifier
            current_price: Current market price

        Returns:
            True if stop was adjusted
        """
        if position_id not in self.trailing_stops:
            return False

        trailing_stop = self.trailing_stops[position_id]

        # Update profit calculations
        if trailing_stop.side == Side.BUY:
            profit_pct = (current_price - trailing_stop.entry_price) / trailing_stop.entry_price
        else:
            profit_pct = (trailing_stop.entry_price - current_price) / trailing_stop.entry_price

        trailing_stop.current_profit_pct = profit_pct
        trailing_stop.max_profit_pct = max(trailing_stop.max_profit_pct, profit_pct)

        # Check if should activate
        if not trailing_stop.is_active:
            should_activate = await self._check_activation(trailing_stop, current_price)
            if should_activate:
                trailing_stop.is_active = True
                trailing_stop.activation_time = datetime.utcnow()
                logger.info(
                    f"✅ Trailing stop activated for {trailing_stop.instrument.symbol} "
                    f"at {profit_pct:.2%} profit"
                )

        # Update highest/lowest prices
        if trailing_stop.side == Side.BUY:
            if current_price > trailing_stop.highest_price:
                trailing_stop.highest_price = current_price
        else:
            if trailing_stop.lowest_price == 0 or current_price < trailing_stop.lowest_price:
                trailing_stop.lowest_price = current_price

        # Adjust stop if active
        if trailing_stop.is_active:
            adjusted = await self._adjust_trailing_stop(trailing_stop, current_price)
            if adjusted:
                self.total_adjustments += 1
                if self.on_stop_adjusted:
                    self.on_stop_adjusted(trailing_stop)
                return True

        # Check if stop triggered
        if await self._check_stop_triggered(trailing_stop, current_price):
            await self._trigger_stop(trailing_stop, current_price)

        return False

    async def _check_activation(
        self,
        trailing_stop: TrailingStop,
        current_price: Decimal
    ) -> bool:
        """Check if trailing stop should be activated"""
        config = trailing_stop.config

        if config.trailing_mode == TrailingMode.IMMEDIATE:
            return True

        elif config.trailing_mode == TrailingMode.PROFIT_THRESHOLD:
            # Activate when profit threshold reached
            if trailing_stop.side == Side.BUY:
                profit_pct = (current_price - trailing_stop.entry_price) / trailing_stop.entry_price
            else:
                profit_pct = (trailing_stop.entry_price - current_price) / trailing_stop.entry_price

            return profit_pct >= config.activation_profit_pct

        elif config.trailing_mode == TrailingMode.BREAKEVEN_PLUS:
            # Activate when price exceeds breakeven + buffer
            if trailing_stop.side == Side.BUY:
                breakeven_plus = trailing_stop.entry_price * (1 + config.breakeven_buffer_pct)
                return current_price >= breakeven_plus
            else:
                breakeven_plus = trailing_stop.entry_price * (1 - config.breakeven_buffer_pct)
                return current_price <= breakeven_plus

        return False

    async def _adjust_trailing_stop(
        self,
        trailing_stop: TrailingStop,
        current_price: Decimal
    ) -> bool:
        """Adjust trailing stop based on price movement"""
        config = trailing_stop.config

        # Calculate new stop price based on trailing type
        new_stop = await self._calculate_new_stop(trailing_stop, current_price)

        # Only adjust if moving in favorable direction
        if trailing_stop.side == Side.BUY:
            # Long: Only move stop up
            if new_stop > trailing_stop.current_stop_price:
                old_stop = trailing_stop.current_stop_price
                trailing_stop.current_stop_price = new_stop
                trailing_stop.last_adjustment_time = datetime.utcnow()
                trailing_stop.adjustment_count += 1

                # Calculate protected profit
                protected_profit = (new_stop - trailing_stop.entry_price) / trailing_stop.entry_price
                trailing_stop.protected_profit_pct = max(
                    trailing_stop.protected_profit_pct,
                    protected_profit
                )

                logger.info(
                    f"📈 Trailing stop adjusted for {trailing_stop.instrument.symbol}: "
                    f"{old_stop:.2f} → {new_stop:.2f} "
                    f"(Protected: {protected_profit:.2%})"
                )

                # Update stop order if exists
                await self._update_stop_order(trailing_stop)

                # Notify profit locked
                if protected_profit >= config.min_profit_lock and self.on_profit_locked:
                    self.on_profit_locked(trailing_stop, protected_profit)

                return True

        else:
            # Short: Only move stop down
            if new_stop < trailing_stop.current_stop_price:
                old_stop = trailing_stop.current_stop_price
                trailing_stop.current_stop_price = new_stop
                trailing_stop.last_adjustment_time = datetime.utcnow()
                trailing_stop.adjustment_count += 1

                protected_profit = (trailing_stop.entry_price - new_stop) / trailing_stop.entry_price
                trailing_stop.protected_profit_pct = max(
                    trailing_stop.protected_profit_pct,
                    protected_profit
                )

                logger.info(
                    f"📉 Trailing stop adjusted for {trailing_stop.instrument.symbol}: "
                    f"{old_stop:.2f} → {new_stop:.2f} "
                    f"(Protected: {protected_profit:.2%})"
                )

                await self._update_stop_order(trailing_stop)

                if protected_profit >= config.min_profit_lock and self.on_profit_locked:
                    self.on_profit_locked(trailing_stop, protected_profit)

                return True

        return False

    async def _calculate_new_stop(
        self,
        trailing_stop: TrailingStop,
        current_price: Decimal
    ) -> Decimal:
        """Calculate new stop price based on trailing type"""
        config = trailing_stop.config

        if config.trailing_type == TrailingType.FIXED_DISTANCE:
            # Fixed dollar distance
            if trailing_stop.side == Side.BUY:
                return trailing_stop.highest_price - config.trailing_distance_pips
            else:
                return trailing_stop.lowest_price + config.trailing_distance_pips

        elif config.trailing_type == TrailingType.PERCENTAGE:
            # Percentage-based
            if trailing_stop.side == Side.BUY:
                return trailing_stop.highest_price * (1 - config.trailing_distance)
            else:
                return trailing_stop.lowest_price * (1 + config.trailing_distance)

        elif config.trailing_type == TrailingType.STEP_TRAIL:
            # Step-based trailing
            if trailing_stop.side == Side.BUY:
                profit_pct = (trailing_stop.highest_price - trailing_stop.entry_price) / trailing_stop.entry_price
                steps = int(profit_pct / config.step_interval)
                return trailing_stop.entry_price + (steps * config.step_size * trailing_stop.entry_price)
            else:
                profit_pct = (trailing_stop.entry_price - trailing_stop.lowest_price) / trailing_stop.entry_price
                steps = int(profit_pct / config.step_interval)
                return trailing_stop.entry_price - (steps * config.step_size * trailing_stop.entry_price)

        elif config.trailing_type == TrailingType.VOLATILITY_ADJUSTED:
            # Adjust distance based on recent volatility
            # Simplified: use a percentage that adjusts with profit
            base_distance = config.trailing_distance

            # Tighten as profit increases
            profit_pct = abs(trailing_stop.current_profit_pct)
            if profit_pct > Decimal("0.05"):  # > 5% profit
                adjusted_distance = base_distance * Decimal("0.7")  # Tighter
            elif profit_pct > Decimal("0.02"):  # > 2% profit
                adjusted_distance = base_distance * Decimal("0.85")
            else:
                adjusted_distance = base_distance

            # Apply max limit
            adjusted_distance = min(adjusted_distance, config.max_trailing_distance)

            if trailing_stop.side == Side.BUY:
                return trailing_stop.highest_price * (1 - adjusted_distance)
            else:
                return trailing_stop.lowest_price * (1 + adjusted_distance)

        # Default: percentage-based
        if trailing_stop.side == Side.BUY:
            return trailing_stop.highest_price * (1 - config.trailing_distance)
        else:
            return trailing_stop.lowest_price * (1 + config.trailing_distance)

    async def _check_stop_triggered(
        self,
        trailing_stop: TrailingStop,
        current_price: Decimal
    ) -> bool:
        """Check if trailing stop has been triggered"""
        if not trailing_stop.is_active:
            return False

        if trailing_stop.side == Side.BUY:
            # Long: Stop triggered if price drops below stop
            return current_price <= trailing_stop.current_stop_price
        else:
            # Short: Stop triggered if price rises above stop
            return current_price >= trailing_stop.current_stop_price

    async def _trigger_stop(
        self,
        trailing_stop: TrailingStop,
        current_price: Decimal
    ):
        """Execute stop-loss order"""
        logger.warning(
            f"🛑 STOP TRIGGERED for {trailing_stop.instrument.symbol}: "
            f"Price={current_price}, Stop={trailing_stop.current_stop_price}, "
            f"Protected Profit={trailing_stop.protected_profit_pct:.2%}"
        )

        # Create market order to close position
        close_order = Order(
            instrument=trailing_stop.instrument,
            side=Side.SELL if trailing_stop.side == Side.BUY else Side.BUY,
            order_type=OrderType.MARKET,
            quantity=trailing_stop.quantity
        )

        # Submit order
        await self.execution_engine.submit_order(close_order)

        # Update statistics
        self.total_stops_triggered += 1
        self.total_profit_protected += trailing_stop.protected_profit_pct

        # Remove from tracking
        del self.trailing_stops[trailing_stop.position_id]

        # Callback
        if self.on_stop_triggered:
            self.on_stop_triggered(trailing_stop)

    async def _update_stop_order(self, trailing_stop: TrailingStop):
        """Update or create stop order at broker"""
        # In production, this would update the actual stop order at the broker
        # For now, we just track it internally
        pass

    async def _monitoring_loop(self):
        """Background monitoring loop"""
        while self.is_running:
            try:
                # Update all trailing stops with current prices
                for position_id, trailing_stop in list(self.trailing_stops.items()):
                    try:
                        # Get current price from market data
                        quote = await self.market_data.get_quote(trailing_stop.instrument)
                        if quote:
                            current_price = quote.mid_price
                            await self.update_price(position_id, current_price)

                    except Exception as e:
                        logger.error(
                            f"Error updating trailing stop for {trailing_stop.instrument.symbol}: {e}"
                        )

                # Sleep before next update
                await asyncio.sleep(1.0)  # Update every second

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Error in trailing stop monitoring loop: {e}")
                await asyncio.sleep(5.0)

    def get_status(self) -> Dict:
        """Get trailing stop manager status"""
        active_stops = len(self.trailing_stops)

        total_protected_profit = sum(
            ts.protected_profit_pct for ts in self.trailing_stops.values()
        )

        avg_protected_profit = (
            total_protected_profit / active_stops if active_stops > 0 else Decimal("0")
        )

        return {
            "is_running": self.is_running,
            "active_trailing_stops": active_stops,
            "total_adjustments": self.total_adjustments,
            "total_stops_triggered": self.total_stops_triggered,
            "avg_protected_profit_pct": float(avg_protected_profit),
            "trailing_stops": [
                {
                    "position_id": ts.position_id,
                    "symbol": ts.instrument.symbol,
                    "side": ts.side.value,
                    "entry_price": float(ts.entry_price),
                    "current_stop": float(ts.current_stop_price),
                    "current_profit_pct": float(ts.current_profit_pct),
                    "protected_profit_pct": float(ts.protected_profit_pct),
                    "adjustment_count": ts.adjustment_count,
                    "is_active": ts.is_active
                }
                for ts in self.trailing_stops.values()
            ]
        }

    def remove_position(self, position_id: str):
        """Remove position from trailing stop management"""
        if position_id in self.trailing_stops:
            del self.trailing_stops[position_id]
            logger.info(f"Removed trailing stop for position {position_id}")
