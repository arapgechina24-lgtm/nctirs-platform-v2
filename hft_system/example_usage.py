"""
Example: Complete HFT System Demonstration

This example demonstrates how to use the institutional HFT system components:
1. Setting up venues and instruments
2. Initializing the execution engine
3. Configuring risk management
4. Running a backtest
5. Executing live orders with VWAP/Iceberg/SOR
"""

import asyncio
from decimal import Decimal
from datetime import datetime, timedelta
import logging

# Core types
from core.types import (
    Instrument, Venue, Order, Side, OrderType,
    RiskLimits, OrderBookLevel, OrderBookSnapshot
)

# Data feeds
from data.feeds.fix_gateway import SimulatedFIXGateway

# Execution
from execution.engine import (
    ExecutionEngine, VWAPParams, IcebergParams, SORParams
)

# Risk management
from risk.manager import RiskManager

# Order book and microstructure
from core.orderbook import (
    OrderBook, MarketMicrostructureAnalyzer, OrderBookAggregator
)

# Backtesting
from backtesting.engine import BacktestEngine, BacktestConfig

# Database
from database.timeseries import InMemoryTickStore, MarketDataRecorder

# Strategies
from strategies.base import OrderFlowImbalanceStrategy


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class MockMarketDataProvider:
    """Mock market data provider for testing"""

    async def get_quote(self, instrument, venue=None):
        from core.types import Quote
        return Quote(
            instrument=instrument,
            bid_price=Decimal("99.95"),
            bid_size=Decimal("100"),
            ask_price=Decimal("100.05"),
            ask_size=Decimal("100"),
            timestamp=datetime.utcnow(),
            venue=venue or Venue(
                venue_id="MOCK",
                name="Mock Exchange"
            )
        )


async def example_1_basic_order_execution():
    """Example 1: Basic order execution through FIX gateway"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 1: Basic Order Execution")
    logger.info("=" * 60)

    # Create venue
    venue = Venue(
        venue_id="NYSE",
        name="New York Stock Exchange",
        maker_fee=Decimal("0.0001"),  # 1 bp
        taker_fee=Decimal("0.0002"),  # 2 bp
        tick_size=Decimal("0.01")
    )

    # Create instrument
    instrument = Instrument(
        symbol="AAPL",
        exchange="NYSE",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    # Initialize FIX gateway (simulated)
    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    # Create and send order
    order = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.LIMIT,
        quantity=Decimal("100"),
        price=Decimal("150.00"),
        venue=venue
    )

    # Set up fill callback
    def on_fill(fill):
        logger.info(f"Fill received: {fill.quantity} @ {fill.price}")

    gateway.on_fill = on_fill

    # Send order
    await gateway.send_order(order)

    # Wait for fill
    await asyncio.sleep(0.1)

    await gateway.disconnect()

    logger.info("Example 1 complete\n")


async def example_2_vwap_execution():
    """Example 2: VWAP algorithm execution"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 2: VWAP Execution")
    logger.info("=" * 60)

    # Setup
    venue = Venue(venue_id="NASDAQ", name="NASDAQ")
    instrument = Instrument(
        symbol="MSFT",
        exchange="NASDAQ",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    market_data = MockMarketDataProvider()
    execution_engine = ExecutionEngine(market_data, gateway)

    # Create large parent order
    parent_order = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.VWAP,
        quantity=Decimal("10000"),  # Large order
        venue=venue
    )

    # VWAP parameters
    vwap_params = VWAPParams(
        start_time=datetime.utcnow(),
        end_time=datetime.utcnow() + timedelta(minutes=30),
        participation_rate=0.10,  # 10% of volume
        urgency=0.5,  # Medium urgency
        price_limit=Decimal("151.00")  # Don't pay more than $151
    )

    # Submit VWAP order
    order_id = await execution_engine.submit_order(parent_order, vwap_params)
    logger.info(f"VWAP order submitted: {order_id}")

    # Let it run briefly (in production, this would run for the full duration)
    await asyncio.sleep(1.0)

    await gateway.disconnect()

    logger.info("Example 2 complete\n")


async def example_3_iceberg_order():
    """Example 3: Iceberg order to hide size"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 3: Iceberg Order")
    logger.info("=" * 60)

    venue = Venue(venue_id="CBOE", name="CBOE")
    instrument = Instrument(
        symbol="SPY",
        exchange="CBOE",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    market_data = MockMarketDataProvider()
    execution_engine = ExecutionEngine(market_data, gateway)

    # Create iceberg order
    parent_order = Order(
        instrument=instrument,
        side=Side.SELL,
        order_type=OrderType.ICEBERG,
        quantity=Decimal("5000"),  # Total size
        venue=venue
    )

    # Iceberg parameters
    iceberg_params = IcebergParams(
        display_quantity=Decimal("100"),  # Only show 100 at a time
        refresh_on_fill=True,
        variance=0.10  # 10% variance to avoid detection
    )

    # Submit iceberg order
    order_id = await execution_engine.submit_order(parent_order, iceberg_params)
    logger.info(f"Iceberg order submitted: {order_id} (total: 5000, display: 100)")

    await asyncio.sleep(1.0)

    await gateway.disconnect()

    logger.info("Example 3 complete\n")


async def example_4_smart_order_routing():
    """Example 4: Smart Order Routing across multiple venues"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 4: Smart Order Routing")
    logger.info("=" * 60)

    # Create multiple venues
    venues = [
        Venue(
            venue_id="NYSE",
            name="NYSE",
            maker_fee=Decimal("0.0001"),
            taker_fee=Decimal("0.0002")
        ),
        Venue(
            venue_id="NASDAQ",
            name="NASDAQ",
            maker_fee=Decimal("0.00015"),
            taker_fee=Decimal("0.00025")
        ),
        Venue(
            venue_id="BATS",
            name="BATS",
            maker_fee=Decimal("0.00005"),
            taker_fee=Decimal("0.00015")
        )
    ]

    instrument = Instrument(
        symbol="TSLA",
        exchange="NASDAQ",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    gateway = SimulatedFIXGateway(venues[0])
    await gateway.connect()

    market_data = MockMarketDataProvider()
    execution_engine = ExecutionEngine(market_data, gateway)

    # Create order
    parent_order = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.LIMIT,
        quantity=Decimal("1000"),
        price=Decimal("200.00")
    )

    # SOR parameters
    sor_params = SORParams(
        venues=venues,
        prefer_maker_fee=True,
        include_dark_pools=False,
        route_strategy="WEIGHTED"  # Route based on venue quality
    )

    # Submit SOR order
    order_id = await execution_engine.submit_order(parent_order, sor_params)
    logger.info(f"SOR order submitted: {order_id} across {len(venues)} venues")

    await asyncio.sleep(1.0)

    await gateway.disconnect()

    logger.info("Example 4 complete\n")


async def example_5_risk_management():
    """Example 5: Risk management and pre-trade checks"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 5: Risk Management")
    logger.info("=" * 60)

    # Configure risk limits
    risk_limits = RiskLimits(
        max_position_size=Decimal("10000"),
        max_order_size=Decimal("1000"),
        max_daily_loss=Decimal("50000"),
        max_daily_volume=Decimal("1000000"),
        max_open_orders=50,
        max_order_value=Decimal("100000"),
        min_order_value=Decimal("100")
    )

    # Initialize risk manager
    risk_manager = RiskManager(risk_limits)

    # Create test order
    instrument = Instrument(
        symbol="AAPL",
        exchange="NASDAQ",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    # Test 1: Normal order (should pass)
    order1 = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.LIMIT,
        quantity=Decimal("100"),
        price=Decimal("150.00")
    )

    is_valid, violation = risk_manager.check_order(order1, Decimal("150.00"))
    logger.info(f"Test 1 - Normal order: {'PASSED' if is_valid else 'REJECTED'}")

    # Test 2: Order too large (should fail)
    order2 = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.LIMIT,
        quantity=Decimal("5000"),  # Exceeds max_order_size
        price=Decimal("150.00")
    )

    is_valid, violation = risk_manager.check_order(order2, Decimal("150.00"))
    logger.info(f"Test 2 - Large order: {'PASSED' if is_valid else 'REJECTED'}")
    if violation:
        logger.info(f"  Reason: {violation.description}")

    # Test 3: Fat finger (should fail)
    order3 = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.LIMIT,
        quantity=Decimal("100"),
        price=Decimal("200.00")  # 33% above market
    )

    is_valid, violation = risk_manager.check_order(order3, Decimal("150.00"))
    logger.info(f"Test 3 - Fat finger: {'PASSED' if is_valid else 'REJECTED'}")
    if violation:
        logger.info(f"  Reason: {violation.description}")

    logger.info("Example 5 complete\n")


async def example_6_order_book_analysis():
    """Example 6: Order book and microstructure analysis"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 6: Order Book Analysis")
    logger.info("=" * 60)

    venue = Venue(venue_id="NASDAQ", name="NASDAQ")
    instrument = Instrument(
        symbol="AAPL",
        exchange="NASDAQ",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    # Create order book
    order_book = OrderBook(instrument, venue)

    # Create sample order book snapshot
    snapshot = OrderBookSnapshot(
        instrument=instrument,
        venue=venue,
        bids=[
            OrderBookLevel(Decimal("149.99"), Decimal("1000")),
            OrderBookLevel(Decimal("149.98"), Decimal("500")),
            OrderBookLevel(Decimal("149.97"), Decimal("750")),
        ],
        asks=[
            OrderBookLevel(Decimal("150.01"), Decimal("800")),
            OrderBookLevel(Decimal("150.02"), Decimal("600")),
            OrderBookLevel(Decimal("150.03"), Decimal("900")),
        ],
        timestamp=datetime.utcnow()
    )

    order_book.update_snapshot(snapshot)

    # Analyze order book
    logger.info(f"Best bid: {order_book.get_best_bid().price}")
    logger.info(f"Best ask: {order_book.get_best_ask().price}")
    logger.info(f"Mid price: {order_book.get_mid_price()}")
    logger.info(f"Spread: {order_book.get_spread()}")
    logger.info(f"Microprice: {order_book.get_microprice()}")
    logger.info(f"Order book imbalance: {order_book.get_order_book_imbalance():.2%}")

    # Liquidity depth
    depth_5bp = order_book.get_depth_at_distance(Side.BUY, 5.0)
    logger.info(f"Bid depth within 5bp: {depth_5bp}")

    # Microstructure analysis
    analyzer = MarketMicrostructureAnalyzer()
    analyzer.register_orderbook(order_book)

    metrics = analyzer.get_metrics(instrument, venue)
    if metrics:
        logger.info(f"\nMicrostructure Metrics:")
        logger.info(f"  Spread: {metrics.relative_spread_bps:.2f} bps")
        logger.info(f"  Order book imbalance: {metrics.order_book_imbalance:.2%}")
        logger.info(f"  Market regime: {analyzer.detect_market_regime(instrument, venue)}")

    logger.info("Example 6 complete\n")


async def example_7_backtesting():
    """Example 7: High-fidelity backtesting with slippage and market impact"""
    logger.info("=" * 60)
    logger.info("EXAMPLE 7: Backtesting")
    logger.info("=" * 60)

    # Create backtest configuration
    instrument = Instrument(
        symbol="AAPL",
        exchange="NASDAQ",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    venue = Venue(
        venue_id="NASDAQ",
        name="NASDAQ",
        maker_fee=Decimal("0.0001"),
        taker_fee=Decimal("0.0002")
    )

    config = BacktestConfig(
        start_date=datetime(2025, 1, 1),
        end_date=datetime(2025, 1, 2),
        initial_capital=Decimal("1000000"),
        instruments=[instrument],
        venues=[venue],
        enable_market_impact=True,
        market_impact_model="SQRT",
        impact_coefficient=0.1,
        enable_slippage=True,
        slippage_bps=1.0,
        enable_fees=True
    )

    # Initialize backtest engine
    engine = BacktestEngine(config)

    # Simulate some trades
    logger.info("Running backtest simulation...")

    # Day 1: 9:30 AM
    engine.update_market_data(
        timestamp=datetime(2025, 1, 1, 9, 30),
        prices={"AAPL": Decimal("150.00")},
        volumes={"AAPL": Decimal("1000000")}
    )

    # Submit buy order
    order1 = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.MARKET,
        quantity=Decimal("1000"),
        venue=venue
    )
    engine.submit_order(order1)
    engine.process_orders()

    # 10:00 AM - Price moved up
    engine.update_market_data(
        timestamp=datetime(2025, 1, 1, 10, 0),
        prices={"AAPL": Decimal("151.00")}
    )

    # Submit sell order
    order2 = Order(
        instrument=instrument,
        side=Side.SELL,
        order_type=OrderType.MARKET,
        quantity=Decimal("1000"),
        venue=venue
    )
    engine.submit_order(order2)
    engine.process_orders()

    # End of day
    engine.update_market_data(
        timestamp=datetime(2025, 1, 1, 16, 0),
        prices={"AAPL": Decimal("151.50")}
    )

    # Get results
    results = engine.get_results()

    logger.info(f"\nBacktest Results:")
    logger.info(f"  Total P&L: ${results.total_pnl:.2f}")
    logger.info(f"  Total Return: {results.total_return_pct:.2f}%")
    logger.info(f"  Total Trades: {results.total_trades}")
    logger.info(f"  Win Rate: {results.win_rate:.2%}")
    logger.info(f"  Sharpe Ratio: {results.sharpe_ratio:.2f}")
    logger.info(f"  Max Drawdown: {results.max_drawdown_pct:.2f}%")
    logger.info(f"  Total Fees: ${results.total_fees:.2f}")
    logger.info(f"  Avg Slippage: {results.avg_slippage_bps:.2f} bps")
    logger.info(f"  Avg Market Impact: {results.avg_market_impact_bps:.2f} bps")

    logger.info("Example 7 complete\n")


async def main():
    """Run all examples"""
    logger.info("\n" + "=" * 60)
    logger.info("INSTITUTIONAL HFT SYSTEM - EXAMPLES")
    logger.info("=" * 60 + "\n")

    try:
        await example_1_basic_order_execution()
        await example_2_vwap_execution()
        await example_3_iceberg_order()
        await example_4_smart_order_routing()
        await example_5_risk_management()
        await example_6_order_book_analysis()
        await example_7_backtesting()

        logger.info("\n" + "=" * 60)
        logger.info("ALL EXAMPLES COMPLETED SUCCESSFULLY")
        logger.info("=" * 60)

    except Exception as e:
        logger.error(f"Error running examples: {e}", exc_info=True)


if __name__ == "__main__":
    asyncio.run(main())
