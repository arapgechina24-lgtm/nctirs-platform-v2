"""
Market data structures for Level 2 order book
"""
from dataclasses import dataclass, field
from typing import List, Dict, Tuple
from datetime import datetime
from collections import defaultdict
import bisect


@dataclass
class PriceLevel:
    """Single price level in order book"""
    price: float
    quantity: float
    num_orders: int = 1

    def __lt__(self, other):
        return self.price < other.price

    def __eq__(self, other):
        return self.price == other.price


@dataclass
class OrderBook:
    """Level 2 order book with full depth"""
    symbol: str
    timestamp: datetime = field(default_factory=datetime.utcnow)
    bids: List[PriceLevel] = field(default_factory=list)  # Sorted descending
    asks: List[PriceLevel] = field(default_factory=list)  # Sorted ascending
    sequence_number: int = 0

    def update_bid(self, price: float, quantity: float, num_orders: int = 1):
        """Update bid side - O(log n) insertion"""
        level = PriceLevel(price, quantity, num_orders)
        if quantity == 0:
            self._remove_level(self.bids, price, reverse=True)
        else:
            self._update_level(self.bids, level, reverse=True)
        self.timestamp = datetime.utcnow()

    def update_ask(self, price: float, quantity: float, num_orders: int = 1):
        """Update ask side - O(log n) insertion"""
        level = PriceLevel(price, quantity, num_orders)
        if quantity == 0:
            self._remove_level(self.asks, price, reverse=False)
        else:
            self._update_level(self.asks, level, reverse=False)
        self.timestamp = datetime.utcnow()

    def _update_level(self, side: List[PriceLevel], level: PriceLevel, reverse: bool):
        """Update or insert price level maintaining sort order"""
        # Binary search for existing level
        for i, existing in enumerate(side):
            if existing.price == level.price:
                side[i] = level
                return

        # Insert new level maintaining sort
        if reverse:
            # Bids: highest to lowest
            idx = bisect.bisect_left([-l.price for l in side], -level.price)
        else:
            # Asks: lowest to highest
            idx = bisect.bisect_left([l.price for l in side], level.price)
        side.insert(idx, level)

    def _remove_level(self, side: List[PriceLevel], price: float, reverse: bool):
        """Remove price level"""
        side[:] = [l for l in side if l.price != price]

    @property
    def best_bid(self) -> Optional[PriceLevel]:
        return self.bids[0] if self.bids else None

    @property
    def best_ask(self) -> Optional[PriceLevel]:
        return self.asks[0] if self.asks else None

    @property
    def spread(self) -> float:
        """Bid-ask spread"""
        if self.best_bid and self.best_ask:
            return self.best_ask.price - self.best_bid.price
        return 0.0

    @property
    def mid_price(self) -> float:
        """Mid price"""
        if self.best_bid and self.best_ask:
            return (self.best_bid.price + self.best_ask.price) / 2.0
        return 0.0

    def get_depth(self, levels: int = 10) -> Tuple[List[PriceLevel], List[PriceLevel]]:
        """Get top N levels of depth"""
        return self.bids[:levels], self.asks[:levels]

    def calculate_vwap(self, quantity: float, side: str) -> float:
        """Calculate VWAP for given quantity"""
        levels = self.asks if side == "BUY" else self.bids
        remaining = quantity
        total_cost = 0.0

        for level in levels:
            if remaining <= 0:
                break
            trade_qty = min(remaining, level.quantity)
            total_cost += trade_qty * level.price
            remaining -= trade_qty

        if remaining > 0:
            return 0.0  # Insufficient liquidity

        return total_cost / quantity

    def calculate_market_impact(self, quantity: float, side: str) -> float:
        """Estimate market impact as percentage"""
        vwap = self.calculate_vwap(quantity, side)
        if vwap == 0:
            return float('inf')

        ref_price = self.best_ask.price if side == "BUY" else self.best_bid.price
        return abs(vwap - ref_price) / ref_price


@dataclass
class Tick:
    """Single tick/trade"""
    symbol: str
    timestamp: datetime
    price: float
    quantity: float
    side: str  # Aggressor side
    trade_id: str = ""

    def to_tuple(self) -> tuple:
        """Convert to tuple for time-series storage"""
        return (
            self.timestamp,
            self.symbol,
            self.price,
            self.quantity,
            self.side,
            self.trade_id
        )


@dataclass
class OHLCV:
    """OHLCV bar"""
    symbol: str
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    volume: float
    vwap: float = 0.0
    num_trades: int = 0
