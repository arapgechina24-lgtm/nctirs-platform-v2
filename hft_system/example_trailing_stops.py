"""
Example: Auto Trailing System Usage

Demonstrates the trailing stop system with various strategies.
"""

import asyncio
from decimal import Decimal
from datetime import datetime, timedelta
import logging

from core.types import (
    Instrument, Venue, Order, Side, OrderType
)
from data.feeds.fix_gateway import SimulatedFIXGateway
from execution.engine import ExecutionEngine
from execution.trailing_stop import (
    TrailingStopManager,
    TrailingStopConfig,
    TrailingType,
    TrailingMode
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class MockMarketData:
    """Mock market data with simulated price movement"""

    def __init__(self):
        self.base_price = Decimal("150.00")
        self.time_step = 0

    async def get_quote(self, instrument, venue=None):
        from core.types import Quote
        import math

        # Simulate upward trend with noise
        trend = self.time_step * Decimal("0.10")  # Upward trend
        noise = Decimal(str(math.sin(self.time_step * 0.5) * 0.20))  # Oscillation

        current_price = self.base_price + trend + noise

        return Quote(
            instrument=instrument,
            bid_price=current_price - Decimal("0.05"),
            bid_size=Decimal("1000"),
            ask_price=current_price + Decimal("0.05"),
            ask_size=Decimal("1000"),
            timestamp=datetime.utcnow(),
            venue=venue or Venue(venue_id="NYSE", name="NYSE")
        )

    @property
    def mid_price(self):
        """Get current mid price for testing"""
        import math
        trend = self.time_step * Decimal("0.10")
        noise = Decimal(str(math.sin(self.time_step * 0.5) * 0.20))
        return self.base_price + trend + noise

    def advance_time(self):
        """Move time forward"""
        self.time_step += 1


async def example_1_basic_trailing_stop():
    """Example 1: Basic percentage-based trailing stop"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 1: Basic Trailing Stop")
    logger.info("=" * 60)

    # Setup
    venue = Venue(venue_id="NYSE", name="NYSE")
    instrument = Instrument(
        symbol="AAPL",
        exchange="NYSE",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    market_data = MockMarketData()
    execution_engine = ExecutionEngine(market_data, gateway)

    # Create trailing stop manager
    config = TrailingStopConfig(
        trailing_type=TrailingType.PERCENTAGE,
        trailing_mode=TrailingMode.IMMEDIATE,
        trailing_distance=Decimal("0.02")  # 2% trailing distance
    )

    trailing_manager = TrailingStopManager(
        execution_engine=execution_engine,
        market_data_provider=market_data,
        default_config=config
    )

    # Set up callbacks
    def on_stop_adjusted(trailing_stop):
        logger.info(
            f"  ✅ Stop adjusted: {trailing_stop.current_stop_price:.2f} "
            f"(Protected: {trailing_stop.protected_profit_pct:.2%})"
        )

    def on_profit_locked(trailing_stop, profit):
        logger.info(f"  🔒 Profit locked: {profit:.2%}")

    trailing_manager.on_stop_adjusted = on_stop_adjusted
    trailing_manager.on_profit_locked = on_profit_locked

    await trailing_manager.start()

    # Simulate entering a position
    entry_price = Decimal("150.00")
    logger.info(f"\n📍 Entering LONG position at ${entry_price}")

    trailing_manager.add_position(
        position_id="pos_001",
        instrument=instrument,
        side=Side.BUY,
        entry_price=entry_price,
        quantity=Decimal("100"),
        config=config
    )

    # Simulate price movement
    logger.info("\n📈 Simulating price movement...")

    for i in range(20):
        market_data.advance_time()
        current_price = market_data.mid_price

        logger.info(f"Time {i+1}: Price = ${current_price:.2f}")

        await trailing_manager.update_price("pos_001", current_price)
        await asyncio.sleep(0.5)

    await trailing_manager.stop()
    await gateway.disconnect()

    logger.info("\n✅ Example 1 complete\n")


async def example_2_profit_threshold_activation():
    """Example 2: Trailing stop activates only after profit threshold"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 2: Profit Threshold Activation")
    logger.info("=" * 60)

    venue = Venue(venue_id="NYSE", name="NYSE")
    instrument = Instrument(
        symbol="MSFT",
        exchange="NYSE",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    market_data = MockMarketData()
    market_data.base_price = Decimal("300.00")
    execution_engine = ExecutionEngine(market_data, gateway)

    # Configure trailing to activate only after 3% profit
    config = TrailingStopConfig(
        trailing_type=TrailingType.PERCENTAGE,
        trailing_mode=TrailingMode.PROFIT_THRESHOLD,
        trailing_distance=Decimal("0.015"),  # 1.5% trail
        activation_profit_pct=Decimal("0.03")  # Activate at 3% profit
    )

    trailing_manager = TrailingStopManager(
        execution_engine=execution_engine,
        market_data_provider=market_data,
        default_config=config
    )

    await trailing_manager.start()

    entry_price = Decimal("300.00")
    logger.info(f"\n📍 Entering LONG position at ${entry_price}")
    logger.info(f"⏳ Trailing will activate at {entry_price * Decimal('1.03'):.2f} (3% profit)")

    trailing_manager.add_position(
        position_id="pos_002",
        instrument=instrument,
        side=Side.BUY,
        entry_price=entry_price,
        quantity=Decimal("50")
    )

    # Simulate price movement
    logger.info("\n📈 Simulating price movement...")

    for i in range(15):
        market_data.advance_time()
        current_price = market_data.mid_price

        profit_pct = (current_price - entry_price) / entry_price

        trailing_stop = trailing_manager.trailing_stops.get("pos_002")
        status = "ACTIVE" if trailing_stop and trailing_stop.is_active else "WAITING"

        logger.info(
            f"Time {i+1}: Price = ${current_price:.2f}, "
            f"Profit = {profit_pct:.2%}, Status = {status}"
        )

        await trailing_manager.update_price("pos_002", current_price)
        await asyncio.sleep(0.5)

    await trailing_manager.stop()
    await gateway.disconnect()

    logger.info("\n✅ Example 2 complete\n")


async def example_3_step_trailing():
    """Example 3: Step-based trailing (locks profit in steps)"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 3: Step-Based Trailing")
    logger.info("=" * 60)

    venue = Venue(venue_id="NYSE", name="NYSE")
    instrument = Instrument(
        symbol="GOOGL",
        exchange="NYSE",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    market_data = MockMarketData()
    market_data.base_price = Decimal("2500.00")
    execution_engine = ExecutionEngine(market_data, gateway)

    # Step trailing: Move stop every 2% gain
    config = TrailingStopConfig(
        trailing_type=TrailingType.STEP_TRAIL,
        trailing_mode=TrailingMode.IMMEDIATE,
        step_interval=Decimal("0.02"),  # Step every 2% gain
        step_size=Decimal("0.015")  # Move stop 1.5% per step
    )

    trailing_manager = TrailingStopManager(
        execution_engine=execution_engine,
        market_data_provider=market_data,
        default_config=config
    )

    await trailing_manager.start()

    entry_price = Decimal("2500.00")
    logger.info(f"\n📍 Entering LONG position at ${entry_price}")
    logger.info(f"📊 Stop will move 1.5% every 2% profit gain")

    trailing_manager.add_position(
        position_id="pos_003",
        instrument=instrument,
        side=Side.BUY,
        entry_price=entry_price,
        quantity=Decimal("10")
    )

    logger.info("\n📈 Simulating price movement...")

    for i in range(20):
        market_data.advance_time()
        current_price = market_data.mid_price

        profit_pct = (current_price - entry_price) / entry_price
        trailing_stop = trailing_manager.trailing_stops.get("pos_003")

        if trailing_stop:
            logger.info(
                f"Time {i+1}: Price = ${current_price:.2f}, "
                f"Profit = {profit_pct:.2%}, "
                f"Stop = ${trailing_stop.current_stop_price:.2f}, "
                f"Adjustments = {trailing_stop.adjustment_count}"
            )

        await trailing_manager.update_price("pos_003", current_price)
        await asyncio.sleep(0.5)

    await trailing_manager.stop()
    await gateway.disconnect()

    logger.info("\n✅ Example 3 complete\n")


async def example_4_multiple_positions():
    """Example 4: Multiple positions with different trailing configs"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 4: Multiple Positions with Auto Trailing")
    logger.info("=" * 60)

    venue = Venue(venue_id="NYSE", name="NYSE")

    instruments = [
        Instrument(
            symbol="AAPL",
            exchange="NYSE",
            asset_class="EQUITY",
            tick_size=Decimal("0.01"),
            lot_size=Decimal("1"),
            min_order_qty=Decimal("1"),
            max_order_qty=Decimal("1000000")
        ),
        Instrument(
            symbol="MSFT",
            exchange="NYSE",
            asset_class="EQUITY",
            tick_size=Decimal("0.01"),
            lot_size=Decimal("1"),
            min_order_qty=Decimal("1"),
            max_order_qty=Decimal("1000000")
        ),
        Instrument(
            symbol="GOOGL",
            exchange="NYSE",
            asset_class="EQUITY",
            tick_size=Decimal("0.01"),
            lot_size=Decimal("1"),
            min_order_qty=Decimal("1"),
            max_order_qty=Decimal("1000000")
        )
    ]

    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    market_data = MockMarketData()
    execution_engine = ExecutionEngine(market_data, gateway)

    trailing_manager = TrailingStopManager(
        execution_engine=execution_engine,
        market_data_provider=market_data
    )

    await trailing_manager.start()

    # Add positions with different strategies
    logger.info("\n📍 Entering 3 positions with different trailing strategies:")

    # Position 1: Tight trailing (1%)
    logger.info("  1. AAPL: Tight 1% trailing")
    trailing_manager.add_position(
        position_id="pos_aapl",
        instrument=instruments[0],
        side=Side.BUY,
        entry_price=Decimal("150.00"),
        quantity=Decimal("100"),
        config=TrailingStopConfig(
            trailing_type=TrailingType.PERCENTAGE,
            trailing_distance=Decimal("0.01")  # 1% tight
        )
    )

    # Position 2: Wide trailing (3%)
    logger.info("  2. MSFT: Wide 3% trailing")
    trailing_manager.add_position(
        position_id="pos_msft",
        instrument=instruments[1],
        side=Side.BUY,
        entry_price=Decimal("300.00"),
        quantity=Decimal("50"),
        config=TrailingStopConfig(
            trailing_type=TrailingType.PERCENTAGE,
            trailing_distance=Decimal("0.03")  # 3% wide
        )
    )

    # Position 3: Step trailing
    logger.info("  3. GOOGL: Step trailing (2% steps)")
    trailing_manager.add_position(
        position_id="pos_googl",
        instrument=instruments[2],
        side=Side.BUY,
        entry_price=Decimal("2500.00"),
        quantity=Decimal("10"),
        config=TrailingStopConfig(
            trailing_type=TrailingType.STEP_TRAIL,
            step_interval=Decimal("0.02")
        )
    )

    # Simulate concurrent price updates
    logger.info("\n📈 Simulating concurrent price movement for all positions...\n")

    for i in range(15):
        # Update all positions
        for j, pos_id in enumerate(["pos_aapl", "pos_msft", "pos_googl"]):
            market_data.base_price = Decimal(str(150.0 + j * 150.0))
            market_data.advance_time()

            current_price = market_data.mid_price
            await trailing_manager.update_price(pos_id, current_price)

        # Print status
        status = trailing_manager.get_status()
        logger.info(f"Time {i+1}:")
        for ts in status["trailing_stops"]:
            logger.info(
                f"  {ts['symbol']}: Price=${ts['current_stop']:.2f}, "
                f"Profit={ts['current_profit_pct']:.2%}, "
                f"Protected={ts['protected_profit_pct']:.2%}"
            )

        await asyncio.sleep(0.5)

    # Final status
    final_status = trailing_manager.get_status()
    logger.info("\n📊 Final Status:")
    logger.info(f"  Total Adjustments: {final_status['total_adjustments']}")
    logger.info(f"  Active Positions: {final_status['active_trailing_stops']}")
    logger.info(f"  Avg Protected Profit: {final_status['avg_protected_profit_pct']:.2%}")

    await trailing_manager.stop()
    await gateway.disconnect()

    logger.info("\n✅ Example 4 complete\n")


async def main():
    """Run all trailing stop examples"""
    logger.info("\n" + "=" * 60)
    logger.info("AUTO TRAILING SYSTEM - EXAMPLES")
    logger.info("=" * 60 + "\n")

    try:
        await example_1_basic_trailing_stop()
        await example_2_profit_threshold_activation()
        await example_3_step_trailing()
        await example_4_multiple_positions()

        logger.info("\n" + "=" * 60)
        logger.info("ALL TRAILING STOP EXAMPLES COMPLETED")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Error running examples: {e}", exc_info=True)


if __name__ == "__main__":
    asyncio.run(main())
