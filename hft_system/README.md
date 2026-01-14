# 🐂 AEGIS Trading System

A production-grade High-Frequency Trading (HFT) system designed for institutional use, featuring low-latency execution, sophisticated order management, and comprehensive risk controls.

**AEGIS** - Advanced Execution & Global Investment System

## ⚡ Key Highlights

- **Zero Swap Costs** - No overnight/financing/rollover charges ✅
- **Institutional Execution** - VWAP, Iceberg, Smart Order Routing
- **Auto Trailing Stops** - Automatic profit protection on every position
- **Risk Management** - 9 pre-trade checks, real-time monitoring
- **High-Fidelity Backtesting** - Market impact, slippage, fees
- **Real-Time Dashboard** - Web interface on port 3000

## 💰 Zero Swap Cost Model

**This system has ZERO time-based costs:**
- ✅ No swap/rollover fees
- ✅ No overnight financing charges
- ✅ No carry costs
- ✅ Hold positions indefinitely without cost

**Only execution fees charged:**
- Maker fee: 1 bp (0.01%) - one-time per trade
- Taker fee: 2 bp (0.02%) - one-time per trade

**Benefits:**
- Simplified P&L: `Profit = Exit - Entry - Execution Fees`
- No time component in cost calculations
- Hold overnight/weekends without penalty
- True performance measurement

See [ZERO_SWAP_COSTS.md](ZERO_SWAP_COSTS.md) for detailed documentation.

## System Architecture

```
hft_system/
├── core/                    # Core data structures and utilities
│   ├── types/              # Type definitions (Order, Fill, Position, etc.)
│   ├── orderbook/          # Order book management and microstructure
│   └── utils/              # Utility functions
├── data/                   # Data ingestion and feeds
│   ├── feeds/              # FIX gateway, WebSocket feeds
│   ├── parsers/            # Data parsers
│   └── adapters/           # Protocol adapters
├── execution/              # Execution algorithms
│   ├── engine.py           # Core execution engine
│   ├── algos/              # Algorithm implementations
│   └── router/             # Smart order routing
├── risk/                   # Risk management
│   ├── manager.py          # Risk manager with pre/post-trade checks
│   ├── pre_trade/          # Pre-trade risk controls
│   └── post_trade/         # Post-trade monitoring
├── backtesting/            # Backtesting engine
│   ├── engine.py           # High-fidelity backtest engine
│   └── analysis/           # Performance analysis
├── database/               # Time-series data storage
│   ├── timeseries.py       # TSDB interface (QuestDB, TimescaleDB)
│   └── cache/              # In-memory caching
├── strategies/             # Trading strategies
│   └── base.py             # Strategy base class and examples
├── config/                 # Configuration files
├── tests/                  # Unit and integration tests
└── logs/                   # Log files
```

## Key Features

### 1. Execution Engine

**Advanced Execution Algorithms:**
- **VWAP (Volume Weighted Average Price)**: Executes large orders by following market volume patterns
- **TWAP (Time Weighted Average Price)**: Spreads orders evenly over time
- **Iceberg Orders**: Hides total order size by displaying only small portions
- **Smart Order Router (SOR)**: Routes orders across multiple venues for best execution

**Example:**
```python
# VWAP execution
vwap_params = VWAPParams(
    start_time=datetime.utcnow(),
    end_time=datetime.utcnow() + timedelta(minutes=30),
    participation_rate=0.10,  # 10% of market volume
    urgency=0.5
)

order_id = await execution_engine.submit_order(parent_order, vwap_params)
```

### 2. FIX Protocol Gateway

**Institutional-Grade Connectivity:**
- FIX 4.4/5.0 protocol implementation
- Async message handling
- Session management with heartbeat
- Order lifecycle management
- Market data subscriptions (Level 2)

**Example:**
```python
gateway = FIXGateway(
    sender_comp_id="YOUR_FIRM",
    target_comp_id="BROKER",
    host="fix.broker.com",
    port=9000,
    venue=venue
)

await gateway.connect()
await gateway.send_order(order)
```

### 3. Risk Management

**Multi-Layer Risk Controls:**

**Pre-Trade Checks:**
- Fat-finger protection (unusual order detection)
- Position limit checks
- Order size limits
- Daily loss limits
- Daily volume limits
- Price validity checks
- Self-trade prevention

**Post-Trade Monitoring:**
- Real-time P&L tracking
- Position monitoring
- Automatic position closure on limit breach
- Emergency stop functionality

**Example:**
```python
risk_limits = RiskLimits(
    max_position_size=Decimal("10000"),
    max_order_size=Decimal("1000"),
    max_daily_loss=Decimal("50000"),
    max_daily_volume=Decimal("1000000")
)

risk_manager = RiskManager(risk_limits)

# All orders are automatically checked
is_valid, violation = risk_manager.check_order(order, current_price)
```

### 4. High-Fidelity Backtesting

**Realistic Simulation:**
- Market impact modeling (LINEAR, SQRT, PERMANENT)
- Slippage calculation
- Exchange fees (maker/taker)
- Partial fills
- Latency simulation
- Order book simulation

**Example:**
```python
config = BacktestConfig(
    start_date=datetime(2025, 1, 1),
    end_date=datetime(2025, 12, 31),
    initial_capital=Decimal("1000000"),
    enable_market_impact=True,
    market_impact_model="SQRT",
    enable_slippage=True,
    slippage_bps=1.0
)

engine = BacktestEngine(config)
results = engine.get_results()

print(f"Sharpe Ratio: {results.sharpe_ratio:.2f}")
print(f"Max Drawdown: {results.max_drawdown_pct:.2f}%")
```

### 5. Order Book Management

**Real-Time Order Book:**
- Efficient sorted bid/ask maintenance
- Incremental updates
- Microprice calculation
- Depth analysis
- Order book imbalance

**Market Microstructure Analytics:**
- Spread analysis (absolute, relative, effective)
- Liquidity metrics
- Order flow imbalance
- Market regime detection
- Realized volatility

**Example:**
```python
order_book = OrderBook(instrument, venue)
order_book.update_snapshot(snapshot)

print(f"Mid price: {order_book.get_mid_price()}")
print(f"Spread: {order_book.get_spread()}")
print(f"Microprice: {order_book.get_microprice()}")
print(f"OB Imbalance: {order_book.get_order_book_imbalance()}")

# Microstructure analysis
analyzer = MarketMicrostructureAnalyzer()
metrics = analyzer.get_metrics(instrument, venue)
regime = analyzer.detect_market_regime(instrument, venue)
```

### 6. Time-Series Database

**Optimized Tick Data Storage:**
- High-throughput ingestion
- QuestDB integration
- In-memory store for testing
- Market data replay for backtesting
- Efficient range queries

**Example:**
```python
# Recording market data
db = QuestDBAdapter(host="localhost", port=9000)
recorder = MarketDataRecorder(db)
await recorder.start()

await recorder.record_trade(trade)
await recorder.record_quote(quote)
await recorder.record_orderbook(snapshot)

# Replaying for backtest
replayer = MarketDataReplayer(db)
await replayer.replay(
    instruments=["AAPL", "MSFT"],
    start_time=start,
    end_time=end,
    callback=process_tick,
    speed_multiplier=10.0  # 10x speed
)
```

### 7. Strategy Framework

**Microstructure-Based Strategies:**
- Order flow imbalance
- Spread capture / market making
- Statistical arbitrage
- Mean reversion
- Momentum

**Example Strategy:**
```python
class MyStrategy(Strategy):
    async def on_orderbook_update(self, order_book: OrderBook):
        metrics = self.analyzer.get_metrics(
            order_book.instrument,
            order_book.venue
        )

        # Trading logic based on microstructure
        if metrics.order_flow_imbalance > 0.3:
            await self.submit_buy_order()
```

## Installation

### Requirements
- Python 3.9+
- Dependencies listed in requirements.txt

### Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Optional: Install QuestDB for production
docker run -p 9000:9000 -p 9009:9009 questdb/questdb
```

## Quick Start

### 1. Basic Order Execution

```python
import asyncio
from decimal import Decimal
from hft_system.core.types import Order, Side, OrderType, Instrument, Venue
from hft_system.data.feeds.fix_gateway import SimulatedFIXGateway

async def main():
    # Create venue and instrument
    venue = Venue(venue_id="NYSE", name="New York Stock Exchange")
    instrument = Instrument(
        symbol="AAPL",
        exchange="NYSE",
        asset_class="EQUITY",
        tick_size=Decimal("0.01"),
        lot_size=Decimal("1"),
        min_order_qty=Decimal("1"),
        max_order_qty=Decimal("1000000")
    )

    # Connect to gateway
    gateway = SimulatedFIXGateway(venue)
    await gateway.connect()

    # Create and send order
    order = Order(
        instrument=instrument,
        side=Side.BUY,
        order_type=OrderType.LIMIT,
        quantity=Decimal("100"),
        price=Decimal("150.00")
    )

    await gateway.send_order(order)
    await asyncio.sleep(1.0)
    await gateway.disconnect()

asyncio.run(main())
```

### 2. Running Examples

```bash
# Run all examples
python example_usage.py
```

The examples demonstrate:
1. Basic order execution
2. VWAP execution
3. Iceberg orders
4. Smart order routing
5. Risk management
6. Order book analysis
7. Backtesting

## Design Philosophy

### Why No Traditional Indicators?

This system is designed for **institutional HFT**, not retail trading. Key differences:

**❌ NOT Used:**
- RSI, MACD, Moving Averages
- Candlestick patterns
- Support/resistance levels

**✅ Focus On:**
- **Market Microstructure**: Order book dynamics, liquidity
- **Order Flow**: Buy/sell pressure, trade tape
- **Statistical Arbitrage**: Mean reversion, cointegration
- **Latency Arbitrage**: Speed advantages
- **Market Making**: Spread capture, inventory management

### Institutional Trading Principles

1. **Execution Quality Over Entry Signals**
   - Getting filled matters more than timing
   - Minimize market impact
   - Optimize execution costs

2. **Risk Management is Paramount**
   - Pre-trade checks prevent disasters
   - Real-time position monitoring
   - Hard stops, not soft limits

3. **Infrastructure Over Alpha**
   - Low latency execution
   - Reliable connectivity
   - Robust error handling

4. **Realistic Backtesting**
   - Account for slippage and fees
   - Model market impact
   - Test at tick resolution

## Production Considerations

### Before Going Live:

1. **Replace Simulated Components:**
   - Use real FIX engine (QuickFIX, OnixS)
   - Connect to actual brokers/exchanges
   - Integrate real market data feeds

2. **Infrastructure:**
   - Co-location for low latency
   - Redundant connections
   - Hardware timestamping

3. **Monitoring:**
   - Real-time dashboards
   - Alert systems
   - Trade surveillance

4. **Compliance:**
   - Regulatory reporting
   - Audit trails
   - Best execution documentation

5. **Testing:**
   - Paper trading environment
   - Stress testing
   - Failover procedures

## Performance Metrics

### Target Latencies:
- Order submission: < 10μs
- Market data processing: < 1μs
- Risk checks: < 1μs
- Order book updates: < 100ns

### Throughput:
- Market data: > 1M messages/sec
- Order processing: > 100K orders/sec

## Risk Disclaimers

⚠️ **WARNING:** This is a reference implementation for educational purposes.

**Before using in production:**
- Conduct thorough testing
- Implement proper monitoring
- Comply with all regulations
- Have adequate capital and risk controls
- Consult with legal and compliance teams

**Trading involves substantial risk of loss.**

## Contributing

Contributions welcome! Focus areas:
- Additional execution algorithms
- More sophisticated market impact models
- Strategy implementations
- Performance optimizations

## License

MIT License - See LICENSE file for details

## References

- Algorithmic Trading and DMA by Barry Johnson
- Trading and Exchanges by Larry Harris
- High-Frequency Trading by Irene Aldridge
- FIX Protocol Specification (fixtrading.org)

## Contact

For questions or support, please open an issue on GitHub.

---

🐂 **AEGIS Trading System** - Built for institutional-grade performance. Not for retail use.
