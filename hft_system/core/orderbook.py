"""
Order Book Management and Market Microstructure

Maintains real-time order book state and provides microstructure analytics:
- Order book reconstruction from L2 feeds
- Bid-ask spread analysis
- Order flow imbalance
- Liquidity metrics
- Market regime detection
"""

from typing import List, Optional, Dict, Deque
from decimal import Decimal
from datetime import datetime, timedelta
from collections import deque, defaultdict
from dataclasses import dataclass
import logging
import numpy as np

from core.types import (
    OrderBookLevel, OrderBookSnapshot, Instrument,
    Venue, Trade, Quote, Side
)


logger = logging.getLogger(__name__)


@dataclass
class OrderBookUpdate:
    """Incremental order book update"""
    timestamp: datetime
    side: Side
    price: Decimal
    size: Decimal
    action: str  # ADD, UPDATE, DELETE


@dataclass
class MicrostructureMetrics:
    """Market microstructure metrics"""
    timestamp: datetime
    instrument: str

    # Spread metrics
    bid_ask_spread: Decimal
    relative_spread_bps: float
    effective_spread_bps: float

    # Liquidity metrics
    bid_liquidity: Decimal  # Total size on bid side
    ask_liquidity: Decimal  # Total size on ask side
    order_book_imbalance: float  # (bid_liq - ask_liq) / (bid_liq + ask_liq)

    # Depth metrics
    depth_5_bid: Decimal  # Liquidity within 5 bps of mid
    depth_5_ask: Decimal
    depth_10_bid: Decimal  # Liquidity within 10 bps of mid
    depth_10_ask: Decimal

    # Price metrics
    microprice: Decimal  # Volume-weighted mid price
    mid_price: Decimal

    # Flow metrics
    recent_buy_volume: Decimal  # Last 5 seconds
    recent_sell_volume: Decimal
    order_flow_imbalance: float  # (buy - sell) / (buy + sell)

    # Volatility
    realized_volatility: float  # Recent price volatility


class OrderBook:
    """
    Limit Order Book implementation.

    Maintains sorted bid and ask sides with efficient updates.
    """

    def __init__(self, instrument: Instrument, venue: Venue):
        self.instrument = instrument
        self.venue = venue

        # Order book levels: price -> size
        self.bids: Dict[Decimal, Decimal] = {}
        self.asks: Dict[Decimal, Decimal] = {}

        # Sorted price levels (cached for performance)
        self.bid_prices: List[Decimal] = []  # Descending
        self.ask_prices: List[Decimal] = []  # Ascending

        # Metadata
        self.last_update: Optional[datetime] = None
        self.sequence_number: int = 0

        # Statistics
        self.update_count = 0

    def update_snapshot(self, snapshot: OrderBookSnapshot):
        """Update from full snapshot"""
        self.bids.clear()
        self.asks.clear()

        for level in snapshot.bids:
            if level.size > 0:
                self.bids[level.price] = level.size

        for level in snapshot.asks:
            if level.size > 0:
                self.asks[level.price] = level.size

        self._rebuild_sorted_levels()
        self.last_update = snapshot.timestamp
        self.sequence_number = snapshot.sequence_number
        self.update_count += 1

        logger.debug(f"Order book snapshot: {len(self.bids)} bids, {len(self.asks)} asks")

    def update_incremental(self, update: OrderBookUpdate):
        """Apply incremental update"""
        if update.side == Side.BUY:
            if update.action == "DELETE" or update.size == 0:
                self.bids.pop(update.price, None)
            else:
                self.bids[update.price] = update.size
            self._rebuild_sorted_levels()
        else:
            if update.action == "DELETE" or update.size == 0:
                self.asks.pop(update.price, None)
            else:
                self.asks[update.price] = update.size
            self._rebuild_sorted_levels()

        self.last_update = update.timestamp
        self.sequence_number += 1
        self.update_count += 1

    def _rebuild_sorted_levels(self):
        """Rebuild sorted price level lists"""
        self.bid_prices = sorted(self.bids.keys(), reverse=True)
        self.ask_prices = sorted(self.asks.keys())

    def get_best_bid(self) -> Optional[OrderBookLevel]:
        """Get best bid"""
        if not self.bid_prices:
            return None
        price = self.bid_prices[0]
        return OrderBookLevel(price=price, size=self.bids[price])

    def get_best_ask(self) -> Optional[OrderBookLevel]:
        """Get best ask"""
        if not self.ask_prices:
            return None
        price = self.ask_prices[0]
        return OrderBookLevel(price=price, size=self.asks[price])

    def get_mid_price(self) -> Optional[Decimal]:
        """Get mid price"""
        best_bid = self.get_best_bid()
        best_ask = self.get_best_ask()

        if best_bid and best_ask:
            return (best_bid.price + best_ask.price) / 2
        return None

    def get_spread(self) -> Optional[Decimal]:
        """Get bid-ask spread"""
        best_bid = self.get_best_bid()
        best_ask = self.get_best_ask()

        if best_bid and best_ask:
            return best_ask.price - best_bid.price
        return None

    def get_microprice(self) -> Optional[Decimal]:
        """
        Calculate microprice (volume-weighted mid price).

        Microprice weights bid and ask by their sizes:
        microprice = (ask_size * bid + bid_size * ask) / (bid_size + ask_size)
        """
        best_bid = self.get_best_bid()
        best_ask = self.get_best_ask()

        if best_bid and best_ask:
            total_size = best_bid.size + best_ask.size
            if total_size > 0:
                return (
                    best_ask.size * best_bid.price + best_bid.size * best_ask.price
                ) / total_size
        return None

    def get_depth_at_distance(
        self,
        side: Side,
        distance_bps: float
    ) -> Decimal:
        """
        Get liquidity within specified distance from mid price.

        Args:
            side: BUY for bid side, SELL for ask side
            distance_bps: Distance in basis points from mid

        Returns:
            Total liquidity within distance
        """
        mid = self.get_mid_price()
        if not mid:
            return Decimal("0")

        distance_factor = Decimal(str(1 + distance_bps / 10000))
        total_size = Decimal("0")

        if side == Side.BUY:
            # Bid side: prices >= mid * (1 - distance_bps)
            threshold = mid / distance_factor
            for price in self.bid_prices:
                if price >= threshold:
                    total_size += self.bids[price]
                else:
                    break
        else:
            # Ask side: prices <= mid * (1 + distance_bps)
            threshold = mid * distance_factor
            for price in self.ask_prices:
                if price <= threshold:
                    total_size += self.asks[price]
                else:
                    break

        return total_size

    def get_order_book_imbalance(self) -> float:
        """
        Calculate order book imbalance.

        Imbalance = (bid_liquidity - ask_liquidity) / (bid_liquidity + ask_liquidity)

        Returns value in [-1, 1]:
        - Positive: More liquidity on bid side (buying pressure)
        - Negative: More liquidity on ask side (selling pressure)
        """
        bid_liq = sum(self.bids.values())
        ask_liq = sum(self.asks.values())

        total_liq = bid_liq + ask_liq
        if total_liq == 0:
            return 0.0

        return float((bid_liq - ask_liq) / total_liq)

    def get_snapshot(self) -> OrderBookSnapshot:
        """Get current order book snapshot"""
        bid_levels = [
            OrderBookLevel(price=p, size=self.bids[p])
            for p in self.bid_prices
        ]

        ask_levels = [
            OrderBookLevel(price=p, size=self.asks[p])
            for p in self.ask_prices
        ]

        return OrderBookSnapshot(
            instrument=self.instrument,
            venue=self.venue,
            bids=bid_levels,
            asks=ask_levels,
            timestamp=self.last_update or datetime.utcnow(),
            sequence_number=self.sequence_number
        )

    def __repr__(self) -> str:
        best_bid = self.get_best_bid()
        best_ask = self.get_best_ask()
        return (f"OrderBook({self.instrument.symbol}: "
                f"Bid={best_bid.price if best_bid else 'N/A'} "
                f"Ask={best_ask.price if best_ask else 'N/A'})")


class MarketMicrostructureAnalyzer:
    """
    Analyzes market microstructure in real-time.

    Computes liquidity metrics, order flow, and market regime indicators.
    """

    def __init__(self, window_seconds: int = 300):
        self.window_seconds = window_seconds
        self.order_books: Dict[str, OrderBook] = {}

        # Trade history for order flow analysis
        self.trade_history: Dict[str, Deque[Trade]] = defaultdict(
            lambda: deque(maxlen=1000)
        )

        # Price history for volatility
        self.price_history: Dict[str, Deque[tuple[datetime, Decimal]]] = defaultdict(
            lambda: deque(maxlen=1000)
        )

    def register_orderbook(self, order_book: OrderBook):
        """Register order book for analysis"""
        key = f"{order_book.instrument.symbol}_{order_book.venue.venue_id}"
        self.order_books[key] = order_book
        logger.info(f"Registered order book: {key}")

    def on_trade(self, trade: Trade):
        """Process trade for order flow analysis"""
        key = trade.instrument.symbol
        self.trade_history[key].append(trade)
        self.price_history[key].append((trade.timestamp, trade.price))

    def get_metrics(
        self,
        instrument: Instrument,
        venue: Venue
    ) -> Optional[MicrostructureMetrics]:
        """Calculate current microstructure metrics"""
        key = f"{instrument.symbol}_{venue.venue_id}"
        order_book = self.order_books.get(key)

        if not order_book:
            return None

        # Basic metrics
        mid_price = order_book.get_mid_price()
        if not mid_price:
            return None

        spread = order_book.get_spread()
        relative_spread_bps = float(spread / mid_price * 10000) if spread else 0.0

        # Liquidity metrics
        bid_liq = sum(order_book.bids.values())
        ask_liq = sum(order_book.asks.values())
        ob_imbalance = order_book.get_order_book_imbalance()

        # Depth metrics
        depth_5_bid = order_book.get_depth_at_distance(Side.BUY, 5.0)
        depth_5_ask = order_book.get_depth_at_distance(Side.SELL, 5.0)
        depth_10_bid = order_book.get_depth_at_distance(Side.BUY, 10.0)
        depth_10_ask = order_book.get_depth_at_distance(Side.SELL, 10.0)

        # Microprice
        microprice = order_book.get_microprice() or mid_price

        # Order flow analysis
        cutoff_time = datetime.utcnow() - timedelta(seconds=5)
        recent_trades = [
            t for t in self.trade_history[instrument.symbol]
            if t.timestamp >= cutoff_time
        ]

        buy_volume = sum(
            t.size for t in recent_trades if t.side == Side.BUY
        )
        sell_volume = sum(
            t.size for t in recent_trades if t.side == Side.SELL
        )

        total_volume = buy_volume + sell_volume
        order_flow_imbalance = float(
            (buy_volume - sell_volume) / total_volume
        ) if total_volume > 0 else 0.0

        # Calculate effective spread (actual vs mid price)
        effective_spread_bps = 0.0
        if recent_trades:
            avg_trade_price = sum(t.price * t.size for t in recent_trades) / total_volume
            effective_spread_bps = abs(float((avg_trade_price - mid_price) / mid_price * 10000))

        # Realized volatility
        realized_vol = self._calculate_realized_volatility(instrument.symbol)

        return MicrostructureMetrics(
            timestamp=datetime.utcnow(),
            instrument=instrument.symbol,
            bid_ask_spread=spread or Decimal("0"),
            relative_spread_bps=relative_spread_bps,
            effective_spread_bps=effective_spread_bps,
            bid_liquidity=bid_liq,
            ask_liquidity=ask_liq,
            order_book_imbalance=ob_imbalance,
            depth_5_bid=depth_5_bid,
            depth_5_ask=depth_5_ask,
            depth_10_bid=depth_10_bid,
            depth_10_ask=depth_10_ask,
            microprice=microprice,
            mid_price=mid_price,
            recent_buy_volume=buy_volume,
            recent_sell_volume=sell_volume,
            order_flow_imbalance=order_flow_imbalance,
            realized_volatility=realized_vol
        )

    def _calculate_realized_volatility(self, symbol: str) -> float:
        """
        Calculate realized volatility from recent price changes.

        Uses 5-minute price returns.
        """
        prices = self.price_history[symbol]
        if len(prices) < 2:
            return 0.0

        # Calculate returns
        returns = []
        for i in range(1, len(prices)):
            prev_price = float(prices[i-1][1])
            curr_price = float(prices[i][1])
            if prev_price > 0:
                ret = (curr_price - prev_price) / prev_price
                returns.append(ret)

        if not returns:
            return 0.0

        # Annualized volatility (assuming ~78,000 5-second intervals per year)
        std_dev = np.std(returns)
        annualized_vol = std_dev * np.sqrt(78000)

        return annualized_vol

    def detect_market_regime(
        self,
        instrument: Instrument,
        venue: Venue
    ) -> str:
        """
        Detect current market regime.

        Returns: HIGH_LIQUIDITY, LOW_LIQUIDITY, VOLATILE, STABLE, TRENDING, MEAN_REVERTING
        """
        metrics = self.get_metrics(instrument, venue)
        if not metrics:
            return "UNKNOWN"

        # High liquidity: tight spreads and deep book
        if (metrics.relative_spread_bps < 2.0 and
            metrics.depth_5_bid > Decimal("10000") and
            metrics.depth_5_ask > Decimal("10000")):
            return "HIGH_LIQUIDITY"

        # Low liquidity: wide spreads or thin book
        if (metrics.relative_spread_bps > 10.0 or
            metrics.depth_5_bid < Decimal("1000")):
            return "LOW_LIQUIDITY"

        # Volatile: high realized volatility
        if metrics.realized_volatility > 0.30:  # 30% annualized
            return "VOLATILE"

        # Stable: low volatility
        if metrics.realized_volatility < 0.10:  # 10% annualized
            return "STABLE"

        # Trending: strong order flow imbalance
        if abs(metrics.order_flow_imbalance) > 0.6:
            return "TRENDING"

        # Mean reverting: balanced flow
        if abs(metrics.order_flow_imbalance) < 0.2:
            return "MEAN_REVERTING"

        return "NORMAL"


class OrderBookAggregator:
    """
    Aggregates order books across multiple venues.

    Provides consolidated best bid/offer (CBBO) and routing decisions.
    """

    def __init__(self):
        self.order_books: Dict[str, Dict[str, OrderBook]] = defaultdict(dict)
        # symbol -> venue_id -> OrderBook

    def add_order_book(self, order_book: OrderBook):
        """Add order book from a venue"""
        symbol = order_book.instrument.symbol
        venue_id = order_book.venue.venue_id
        self.order_books[symbol][venue_id] = order_book

    def get_cbbo(self, symbol: str) -> tuple[Optional[Decimal], Optional[Decimal]]:
        """
        Get Consolidated Best Bid and Offer.

        Returns:
            (best_bid_price, best_ask_price)
        """
        if symbol not in self.order_books:
            return None, None

        best_bid = None
        best_ask = None

        for venue_id, ob in self.order_books[symbol].items():
            bid = ob.get_best_bid()
            ask = ob.get_best_ask()

            if bid and (best_bid is None or bid.price > best_bid):
                best_bid = bid.price

            if ask and (best_ask is None or ask.price < best_ask):
                best_ask = ask.price

        return best_bid, best_ask

    def get_best_venue_for_order(
        self,
        symbol: str,
        side: Side,
        quantity: Decimal
    ) -> Optional[str]:
        """
        Find best venue to route an order.

        Considers price, liquidity, and fees.

        Returns:
            Venue ID or None
        """
        if symbol not in self.order_books:
            return None

        best_venue = None
        best_effective_price = None

        for venue_id, ob in self.order_books[symbol].items():
            if side == Side.BUY:
                level = ob.get_best_ask()
                if not level or level.size < quantity:
                    continue

                # Calculate effective price including fees
                effective_price = level.price * (1 + ob.venue.taker_fee)

                if best_effective_price is None or effective_price < best_effective_price:
                    best_effective_price = effective_price
                    best_venue = venue_id

            else:  # SELL
                level = ob.get_best_bid()
                if not level or level.size < quantity:
                    continue

                # Calculate effective price including fees
                effective_price = level.price * (1 - ob.venue.taker_fee)

                if best_effective_price is None or effective_price > best_effective_price:
                    best_effective_price = effective_price
                    best_venue = venue_id

        return best_venue

    def get_total_liquidity(
        self,
        symbol: str,
        side: Side,
        max_distance_bps: float = 10.0
    ) -> Decimal:
        """Get total liquidity across all venues"""
        if symbol not in self.order_books:
            return Decimal("0")

        total = Decimal("0")
        for ob in self.order_books[symbol].values():
            total += ob.get_depth_at_distance(side, max_distance_bps)

        return total
