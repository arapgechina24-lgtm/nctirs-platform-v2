"""
Base Strategy Interface
All trading strategies should inherit from this class
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict
import logging

from core.data_structures.order import Order, Fill
from core.data_structures.market_data import Tick, OrderBook


class BaseStrategy(ABC):
    """Abstract base class for trading strategies"""

    def __init__(self, config: Dict):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.name = self.__class__.__name__

        # Strategy state
        self.is_running = False
        self.positions: Dict[str, float] = {}

    @abstractmethod
    async def on_start(self):
        """Called when strategy starts"""
        pass

    @abstractmethod
    async def on_stop(self):
        """Called when strategy stops"""
        pass

    @abstractmethod
    async def on_tick(self, tick: Tick):
        """Called on each tick"""
        pass

    @abstractmethod
    async def on_order_book_update(self, symbol: str, order_book: OrderBook):
        """Called when order book is updated"""
        pass

    @abstractmethod
    async def on_fill(self, fill: Fill):
        """Called when order is filled"""
        pass

    def get_position(self, symbol: str) -> float:
        """Get current position for symbol"""
        return self.positions.get(symbol, 0.0)

    def update_position(self, symbol: str, quantity: float, side: str):
        """Update position"""
        current = self.positions.get(symbol, 0.0)
        delta = quantity if side == "BUY" else -quantity
        self.positions[symbol] = current + delta
