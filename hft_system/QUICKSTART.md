# Quick Start Guide

Get up and running with the HFT system in 5 minutes.

## Installation

```bash
# 1. Navigate to the system directory
cd hft_system

# 2. Install dependencies
pip install -r requirements.txt

# 3. (Optional) Install QuestDB for production
# docker run -p 9000:9000 -p 9009:9009 questdb/questdb
```

## Run Examples

```bash
# Run all examples to see the system in action
python example_usage.py
```

This will demonstrate:
1. ✅ Basic order execution
2. ✅ VWAP algorithm
3. ✅ Iceberg orders
4. ✅ Smart order routing
5. ✅ Risk management
6. ✅ Order book analysis
7. ✅ Backtesting

## Your First Strategy

Create a file `my_strategy.py`:

```python
import asyncio
from decimal import Decimal
from datetime import datetime, timedelta

from core.types import Instrument, Venue, Order, Side, OrderType, RiskLimits
from data.feeds.fix_gateway import SimulatedFIXGateway
from execution.engine import ExecutionEngine, VWAPParams
from risk.manager import RiskManager
from strategies.base import Strategy

class MockMarketData:
    async def get_quote(self, instrument, venue=None):
        from core.types import Quote
        return Quote(
            instrument=instrument,
            bid_price=Decimal("99.95"),
            bid_size=Decimal("100"),
            ask_price=Decimal("100.05"),
            ask_size=Decimal("100"),
            timestamp=datetime.utcnow(),
            venue=venue or Venue(venue_id="MOCK", name="Mock")
        )

async def main():
    # 1. Setup venue and instrument
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

    # 2. Setup infrastructure
    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    market_data = MockMarketData()
    execution_engine = ExecutionEngine(market_data, gateway)

    risk_limits = RiskLimits(
        max_position_size=Decimal("10000"),
        max_order_size=Decimal("1000"),
        max_daily_loss=Decimal("50000"),
        max_daily_volume=Decimal("1000000")
    )
    risk_manager = RiskManager(risk_limits)

    # 3. Create and submit order
    order = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.LIMIT,
        quantity=Decimal("100"),
        price=Decimal("150.00"),
        venue=venue
    )

    # 4. Risk check
    is_valid, violation = risk_manager.check_order(order, Decimal("150.00"))
    if is_valid:
        print(f"✅ Order passed risk checks")
        order_id = await execution_engine.submit_order(order)
        print(f"✅ Order submitted: {order_id}")
    else:
        print(f"❌ Order rejected: {violation.description}")

    await asyncio.sleep(1.0)
    await gateway.disconnect()
    print("✅ Complete!")

if __name__ == "__main__":
    asyncio.run(main())
```

Run it:
```bash
python my_strategy.py
```

## Using VWAP for Large Orders

```python
# Create a large parent order
parent_order = Order(
    instrument=instrument,
    side=Side.BUY,
    order_type=OrderType.VWAP,
    quantity=Decimal("10000"),  # Large order
    venue=venue
)

# Configure VWAP parameters
vwap_params = VWAPParams(
    start_time=datetime.utcnow(),
    end_time=datetime.utcnow() + timedelta(minutes=30),
    participation_rate=0.10,  # 10% of market volume
    urgency=0.5,  # Medium urgency
    price_limit=Decimal("151.00")  # Max price
)

# Submit VWAP order
order_id = await execution_engine.submit_order(parent_order, vwap_params)
print(f"VWAP order submitted: {order_id}")
```

## Analyzing Order Book

```python
from core.orderbook import OrderBook, MarketMicrostructureAnalyzer
from core.types import OrderBookSnapshot, OrderBookLevel

# Create order book
order_book = OrderBook(instrument, venue)

# Create sample snapshot
snapshot = OrderBookSnapshot(
    instrument=instrument,
    venue=venue,
    bids=[
        OrderBookLevel(Decimal("149.99"), Decimal("1000")),
        OrderBookLevel(Decimal("149.98"), Decimal("500")),
    ],
    asks=[
        OrderBookLevel(Decimal("150.01"), Decimal("800")),
        OrderBookLevel(Decimal("150.02"), Decimal("600")),
    ],
    timestamp=datetime.utcnow()
)

order_book.update_snapshot(snapshot)

# Analyze
print(f"Mid price: {order_book.get_mid_price()}")
print(f"Spread: {order_book.get_spread()}")
print(f"Microprice: {order_book.get_microprice()}")
print(f"Imbalance: {order_book.get_order_book_imbalance():.2%}")

# Microstructure metrics
analyzer = MarketMicrostructureAnalyzer()
analyzer.register_orderbook(order_book)
metrics = analyzer.get_metrics(instrument, venue)
print(f"Market regime: {analyzer.detect_market_regime(instrument, venue)}")
```

## Running a Backtest

```python
from backtesting.engine import BacktestEngine, BacktestConfig

# Configure backtest
config = BacktestConfig(
    start_date=datetime(2025, 1, 1),
    end_date=datetime(2025, 12, 31),
    initial_capital=Decimal("1000000"),
    instruments=[instrument],
    venues=[venue],
    enable_market_impact=True,
    enable_slippage=True,
    enable_fees=True
)

# Run backtest
engine = BacktestEngine(config)

# Update with market data and submit orders...
# (see example_usage.py for complete example)

# Get results
results = engine.get_results()
print(f"Total P&L: ${results.total_pnl:.2f}")
print(f"Sharpe Ratio: {results.sharpe_ratio:.2f}")
print(f"Max Drawdown: {results.max_drawdown_pct:.2f}%")
```

## Implementing Your Own Strategy

```python
from strategies.base import Strategy
from core.orderbook import OrderBook

class MyCustomStrategy(Strategy):
    def __init__(self, name, instruments, execution_engine, risk_manager):
        super().__init__(name, instruments, execution_engine, risk_manager)
        self.signal_threshold = 0.02  # 2%

    async def on_orderbook_update(self, order_book: OrderBook):
        """Called when order book updates"""
        if not self.is_running:
            return

        # Your logic here
        mid_price = order_book.get_mid_price()
        imbalance = order_book.get_order_book_imbalance()

        # Example: Buy when strong bid pressure
        if imbalance > self.signal_threshold:
            order = Order(
                instrument=order_book.instrument,
                side=Side.BUY,
                order_type=OrderType.LIMIT,
                quantity=Decimal("10"),
                price=mid_price
            )
            await self.submit_order(order)

    async def on_trade(self, trade):
        """Called when a trade occurs"""
        pass

    async def on_quote(self, quote):
        """Called when quote updates"""
        pass

# Use your strategy
strategy = MyCustomStrategy(
    name="MyStrategy",
    instruments=[instrument],
    execution_engine=execution_engine,
    risk_manager=risk_manager
)

await strategy.start()
```

## Configuration

Copy and customize the configuration:

```bash
cp config/config_example.py config/config.py
# Edit config.py with your settings
```

Key settings to configure:
- `FIX_CONFIG`: FIX gateway connection details
- `RISK_LIMITS`: Your risk limits
- `VENUES`: Exchange/venue settings
- `STRATEGIES`: Enable/disable strategies

## Next Steps

1. **Read Documentation**
   - `README.md` - Complete system documentation
   - `SYSTEM_OVERVIEW.md` - Architecture details

2. **Study Examples**
   - `example_usage.py` - 7 working examples
   - Each example is self-contained

3. **Build Your Strategy**
   - Inherit from `Strategy` base class
   - Implement order book/trade/quote handlers
   - Test with simulated gateway first

4. **Backtest**
   - Use `BacktestEngine` for historical testing
   - Evaluate performance metrics
   - Optimize parameters

5. **Paper Trade**
   - Use `SimulatedFIXGateway` for paper trading
   - Monitor risk metrics
   - Verify execution quality

6. **Production**
   - Replace with real FIX gateway
   - Connect to live market data
   - Start with small position sizes
   - Monitor continuously

## Common Issues

### Import errors
Make sure you're in the correct directory:
```bash
cd /path/to/hft_system
python -c "from core.types import Order; print('✅ Imports working')"
```

### "No module named X"
Install requirements:
```bash
pip install -r requirements.txt
```

### Strategy not executing
Make sure strategy is started:
```python
await strategy.start()  # Don't forget this!
```

## Support

- Check `README.md` for detailed documentation
- Review `example_usage.py` for working examples
- See `SYSTEM_OVERVIEW.md` for architecture details

## Performance Tips

1. **Use uvloop for better async performance**
   ```python
   import uvloop
   uvloop.install()
   ```

2. **Enable batching for database writes**
   - Default batch size: 1000 ticks
   - Adjust in config if needed

3. **Profile critical paths**
   ```python
   import cProfile
   cProfile.run('your_function()')
   ```

4. **Use Decimal for precision**
   - Always use `Decimal` for prices/quantities
   - Never use `float` for financial calculations

---

**You're now ready to start building with the HFT system!**

For production deployment, see the "Production Considerations" section in README.md.
