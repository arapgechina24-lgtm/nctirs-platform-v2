"""
Market Microstructure Strategy: Order Flow Imbalance
Exploits temporary supply/demand imbalances in the order book

Key concepts:
1. Order Flow Imbalance (OFI): Measures aggressive buying vs selling pressure
2. Bid-Ask Imbalance: Measures depth imbalance in order book
3. Trade Flow Toxicity: Identifies informed trading
4. Mean reversion on microstructure signals

This strategy does NOT use RSI, MACD, or other retail indicators.
"""
from typing import Dict, Optional
from collections import deque
from datetime import datetime, timedelta
import numpy as np

from strategies.base_strategy import BaseStrategy
from core.data_structures.order import Order, Fill, OrderSide, OrderType
from core.data_structures.market_data import Tick, OrderBook


class OrderFlowImbalanceStrategy(BaseStrategy):
    """
    Trades on order flow imbalance signals from market microstructure
    """

    def __init__(self, config: Dict, execution_engine, risk_manager):
        super().__init__(config)
        self.execution_engine = execution_engine
        self.risk_manager = risk_manager

        # Strategy parameters
        self.symbols = config.get('symbols', ['BTCUSD'])
        self.lookback_window = config.get('lookback_window', 100)  # ticks
        self.ofi_threshold = config.get('ofi_threshold', 2.0)  # Standard deviations
        self.position_size = config.get('position_size', 1.0)
        self.hold_time_seconds = config.get('hold_time_seconds', 60)

        # Microstructure state
        self.tick_history: Dict[str, deque] = {symbol: deque(maxlen=self.lookback_window) for symbol in self.symbols}
        self.order_book_snapshots: Dict[str, deque] = {symbol: deque(maxlen=50) for symbol in self.symbols}
        self.ofi_values: Dict[str, deque] = {symbol: deque(maxlen=100) for symbol in self.symbols}

        # Position tracking
        self.entry_times: Dict[str, datetime] = {}
        self.entry_prices: Dict[str, float] = {}

        # Performance metrics
        self.signals_generated = 0
        self.trades_executed = 0

    async def on_start(self):
        """Initialize strategy"""
        self.is_running = True
        self.logger.info(f"Starting {self.name}")
        self.logger.info(f"Trading symbols: {self.symbols}")
        self.logger.info(f"OFI threshold: {self.ofi_threshold} std devs")

    async def on_stop(self):
        """Cleanup strategy"""
        self.is_running = False
        self.logger.info(f"Stopping {self.name}")
        self.logger.info(f"Signals generated: {self.signals_generated}")
        self.logger.info(f"Trades executed: {self.trades_executed}")

    async def on_tick(self, tick: Tick):
        """Process each tick"""
        if tick.symbol not in self.symbols:
            return

        # Store tick
        self.tick_history[tick.symbol].append(tick)

        # Check exit conditions for existing positions
        await self._check_exit_conditions(tick)

    async def on_order_book_update(self, symbol: str, order_book: OrderBook):
        """Process order book updates - main signal generation"""
        if symbol not in self.symbols:
            return

        # Store order book snapshot
        self.order_book_snapshots[symbol].append(order_book)

        # Need sufficient history
        if len(self.order_book_snapshots[symbol]) < 2:
            return

        # Calculate Order Flow Imbalance (OFI)
        ofi = self._calculate_order_flow_imbalance(symbol)
        if ofi is not None:
            self.ofi_values[symbol].append(ofi)

        # Need sufficient OFI history for z-score
        if len(self.ofi_values[symbol]) < 20:
            return

        # Calculate z-score of OFI
        ofi_array = np.array(list(self.ofi_values[symbol]))
        ofi_mean = np.mean(ofi_array)
        ofi_std = np.std(ofi_array)

        if ofi_std == 0:
            return

        current_ofi = self.ofi_values[symbol][-1]
        ofi_zscore = (current_ofi - ofi_mean) / ofi_std

        # Generate signals
        await self._generate_signals(symbol, order_book, ofi_zscore)

    def _calculate_order_flow_imbalance(self, symbol: str) -> Optional[float]:
        """
        Calculate Order Flow Imbalance (OFI)

        OFI measures the net change in bid/ask quantities weighted by their position
        in the order book. Positive OFI suggests buying pressure, negative suggests selling.

        Formula (simplified):
        OFI = Σ(ΔBid_volume - ΔAsk_volume) weighted by distance from mid
        """
        snapshots = self.order_book_snapshots[symbol]
        if len(snapshots) < 2:
            return None

        current_ob = snapshots[-1]
        previous_ob = snapshots[-2]

        ofi = 0.0

        # Compare bid side (top 10 levels)
        for i in range(min(10, len(current_ob.bids), len(previous_ob.bids))):
            current_level = current_ob.bids[i]
            previous_level = previous_ob.bids[i]

            # If price level exists in both snapshots
            if current_level.price == previous_level.price:
                volume_change = current_level.quantity - previous_level.quantity
                # Weight by inverse distance from best bid (closer = more important)
                weight = 1.0 / (i + 1)
                ofi += volume_change * weight

        # Compare ask side (top 10 levels)
        for i in range(min(10, len(current_ob.asks), len(previous_ob.asks))):
            current_level = current_ob.asks[i]
            previous_level = previous_ob.asks[i]

            if current_level.price == previous_level.price:
                volume_change = current_level.quantity - previous_level.quantity
                weight = 1.0 / (i + 1)
                ofi -= volume_change * weight  # Subtract for ask side

        return ofi

    def _calculate_bid_ask_imbalance(self, order_book: OrderBook) -> float:
        """
        Calculate bid-ask imbalance ratio

        Ratio of bid depth to ask depth. > 1 suggests buying pressure.
        """
        bid_depth = sum(level.quantity for level in order_book.bids[:10])
        ask_depth = sum(level.quantity for level in order_book.asks[:10])

        if ask_depth == 0:
            return 0.0

        return bid_depth / ask_depth

    def _calculate_trade_flow_toxicity(self, symbol: str) -> float:
        """
        Estimate trade flow toxicity (VPIN - Volume-Synchronized Probability of Informed Trading)

        Measures whether recent trades are informed (toxic) or uninformed
        High toxicity suggests informed traders are active
        """
        ticks = list(self.tick_history[symbol])
        if len(ticks) < 20:
            return 0.0

        # Calculate volume imbalance
        buy_volume = sum(t.quantity for t in ticks if t.side == "BUY")
        sell_volume = sum(t.quantity for t in ticks if t.side == "SELL")
        total_volume = buy_volume + sell_volume

        if total_volume == 0:
            return 0.0

        # VPIN approximation
        vpin = abs(buy_volume - sell_volume) / total_volume

        return vpin

    async def _generate_signals(self, symbol: str, order_book: OrderBook, ofi_zscore: float):
        """Generate trading signals from microstructure analysis"""

        # Skip if already in position
        if self.get_position(symbol) != 0:
            return

        # Calculate additional signals
        ba_imbalance = self._calculate_bid_ask_imbalance(order_book)
        toxicity = self._calculate_trade_flow_toxicity(symbol)

        # Signal logic:
        # 1. Strong positive OFI + bid-ask imbalance suggests buying pressure
        # 2. Use mean-reversion: fade extreme OFI if toxicity is low (uninformed flow)
        # 3. Follow OFI if toxicity is high (informed flow)

        signal = None

        # Mean reversion strategy (fade extreme OFI when uninformed)
        if toxicity < 0.5:  # Uninformed flow
            if ofi_zscore > self.ofi_threshold:
                # Extreme buying pressure, fade by selling
                signal = "SELL"
                self.logger.info(
                    f"SELL signal: OFI z-score={ofi_zscore:.2f}, "
                    f"BA imbalance={ba_imbalance:.2f}, toxicity={toxicity:.2f}"
                )
            elif ofi_zscore < -self.ofi_threshold:
                # Extreme selling pressure, fade by buying
                signal = "BUY"
                self.logger.info(
                    f"BUY signal: OFI z-score={ofi_zscore:.2f}, "
                    f"BA imbalance={ba_imbalance:.2f}, toxicity={toxicity:.2f}"
                )

        # Momentum strategy (follow OFI when informed)
        else:  # Informed flow (high toxicity)
            if ofi_zscore > self.ofi_threshold and ba_imbalance > 1.2:
                # Strong buying pressure from informed traders
                signal = "BUY"
                self.logger.info(
                    f"BUY signal (informed): OFI z-score={ofi_zscore:.2f}, "
                    f"BA imbalance={ba_imbalance:.2f}, toxicity={toxicity:.2f}"
                )
            elif ofi_zscore < -self.ofi_threshold and ba_imbalance < 0.8:
                # Strong selling pressure from informed traders
                signal = "SELL"
                self.logger.info(
                    f"SELL signal (informed): OFI z-score={ofi_zscore:.2f}, "
                    f"BA imbalance={ba_imbalance:.2f}, toxicity={toxicity:.2f}"
                )

        # Execute signal
        if signal:
            await self._execute_signal(symbol, signal, order_book)

    async def _execute_signal(self, symbol: str, signal: str, order_book: OrderBook):
        """Execute trading signal"""
        self.signals_generated += 1

        # Create order
        side = OrderSide.BUY if signal == "BUY" else OrderSide.SELL

        # Use limit order at best bid/ask to ensure maker status (lower fees)
        price = order_book.best_bid.price if side == OrderSide.BUY else order_book.best_ask.price

        order = Order(
            symbol=symbol,
            side=side,
            order_type=OrderType.LIMIT,
            quantity=self.position_size,
            price=price,
            strategy_id=self.name
        )

        # Submit order
        success = await self.execution_engine.submit_order(
            order,
            risk_check_callback=self.risk_manager.pre_trade_check if self.risk_manager else None
        )

        if success:
            self.trades_executed += 1
            self.entry_times[symbol] = datetime.utcnow()
            self.entry_prices[symbol] = price

    async def _check_exit_conditions(self, tick: Tick):
        """Check if we should exit positions"""
        symbol = tick.symbol
        position = self.get_position(symbol)

        if position == 0:
            return

        # Time-based exit
        if symbol in self.entry_times:
            time_in_position = (datetime.utcnow() - self.entry_times[symbol]).total_seconds()

            if time_in_position >= self.hold_time_seconds:
                await self._exit_position(symbol, tick.price, "Time exit")

        # PnL-based exit (take profit / stop loss)
        if symbol in self.entry_prices:
            entry_price = self.entry_prices[symbol]
            pnl_pct = (tick.price - entry_price) / entry_price

            # Adjust for position direction
            if position < 0:  # Short position
                pnl_pct = -pnl_pct

            # Take profit at 0.1%
            if pnl_pct > 0.001:
                await self._exit_position(symbol, tick.price, f"Take profit {pnl_pct:.2%}")

            # Stop loss at -0.2%
            elif pnl_pct < -0.002:
                await self._exit_position(symbol, tick.price, f"Stop loss {pnl_pct:.2%}")

    async def _exit_position(self, symbol: str, price: float, reason: str):
        """Exit position"""
        position = self.get_position(symbol)
        if position == 0:
            return

        self.logger.info(f"Exiting position: {symbol}, reason: {reason}")

        # Create closing order
        side = OrderSide.SELL if position > 0 else OrderSide.BUY

        order = Order(
            symbol=symbol,
            side=side,
            order_type=OrderType.MARKET,
            quantity=abs(position),
            strategy_id=self.name
        )

        # Submit order
        await self.execution_engine.submit_order(order)

        # Clean up state
        if symbol in self.entry_times:
            del self.entry_times[symbol]
        if symbol in self.entry_prices:
            del self.entry_prices[symbol]

    async def on_fill(self, fill: Fill):
        """Update position on fill"""
        self.update_position(fill.symbol, fill.quantity, fill.side.value)
        self.logger.info(
            f"Fill: {fill.symbol} {fill.side.value} {fill.quantity}@{fill.price}, "
            f"position={self.get_position(fill.symbol)}"
        )
