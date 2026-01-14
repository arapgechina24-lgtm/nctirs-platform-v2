"""
FIX Protocol Gateway Interface for market data and order execution
"""
from abc import ABC, abstractmethod
from typing import Callable, Optional, Dict, Any
from datetime import datetime
import asyncio
import logging
from enum import Enum

from core.data_structures.order import Order, Fill, OrderStatus
from core.data_structures.market_data import OrderBook, Tick


class FIXMsgType(Enum):
    """FIX message types"""
    LOGON = "A"
    HEARTBEAT = "0"
    TEST_REQUEST = "1"
    RESEND_REQUEST = "2"
    REJECT = "3"
    LOGOUT = "5"
    NEW_ORDER_SINGLE = "D"
    EXECUTION_REPORT = "8"
    ORDER_CANCEL_REQUEST = "F"
    ORDER_CANCEL_REJECT = "9"
    MARKET_DATA_REQUEST = "V"
    MARKET_DATA_SNAPSHOT = "W"
    MARKET_DATA_INCREMENTAL_REFRESH = "X"


class FIXGateway(ABC):
    """Abstract base class for FIX protocol gateway"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.session_id: Optional[str] = None
        self.is_connected: bool = False
        self.sequence_number: int = 1

        # Callbacks
        self.on_market_data_callback: Optional[Callable] = None
        self.on_execution_report_callback: Optional[Callable] = None
        self.on_order_book_update_callback: Optional[Callable] = None

    @abstractmethod
    async def connect(self) -> bool:
        """Establish FIX session"""
        pass

    @abstractmethod
    async def disconnect(self) -> bool:
        """Terminate FIX session"""
        pass

    @abstractmethod
    async def send_order(self, order: Order) -> bool:
        """Send new order to exchange via FIX"""
        pass

    @abstractmethod
    async def cancel_order(self, order_id: str) -> bool:
        """Cancel order via FIX"""
        pass

    @abstractmethod
    async def subscribe_market_data(self, symbols: list[str]) -> bool:
        """Subscribe to Level 2 market data"""
        pass

    @abstractmethod
    async def unsubscribe_market_data(self, symbols: list[str]) -> bool:
        """Unsubscribe from market data"""
        pass

    def register_market_data_handler(self, callback: Callable):
        """Register callback for market data updates"""
        self.on_market_data_callback = callback

    def register_execution_handler(self, callback: Callable):
        """Register callback for execution reports"""
        self.on_execution_report_callback = callback

    def register_order_book_handler(self, callback: Callable):
        """Register callback for order book updates"""
        self.on_order_book_update_callback = callback

    def _generate_fix_message(self, msg_type: str, fields: Dict[str, Any]) -> str:
        """Generate FIX message (simplified)"""
        # FIX message format: field=value|field=value|...
        # In production, use proper FIX library (simplefix, quickfix)
        fix_msg = f"35={msg_type}|"
        fix_msg += f"49={self.config.get('sender_comp_id')}|"
        fix_msg += f"56={self.config.get('target_comp_id')}|"
        fix_msg += f"34={self.sequence_number}|"
        fix_msg += f"52={datetime.utcnow().strftime('%Y%m%d-%H:%M:%S')}|"

        for tag, value in fields.items():
            fix_msg += f"{tag}={value}|"

        self.sequence_number += 1
        return fix_msg

    def _parse_fix_message(self, raw_message: str) -> Dict[str, str]:
        """Parse FIX message into dictionary"""
        fields = {}
        for field in raw_message.split("|"):
            if "=" in field:
                tag, value = field.split("=", 1)
                fields[tag] = value
        return fields


class SimulatedFIXGateway(FIXGateway):
    """Simulated FIX gateway for testing/backtesting"""

    def __init__(self, config: Dict[str, Any]):
        super().__init__(config)
        self.order_books: Dict[str, OrderBook] = {}
        self.latency_ms: float = config.get('simulated_latency_ms', 1.0)

    async def connect(self) -> bool:
        """Simulate connection"""
        await asyncio.sleep(self.latency_ms / 1000.0)
        self.is_connected = True
        self.session_id = f"SIM_{datetime.utcnow().timestamp()}"
        self.logger.info(f"Connected to simulated FIX gateway: {self.session_id}")
        return True

    async def disconnect(self) -> bool:
        """Simulate disconnection"""
        self.is_connected = False
        self.logger.info("Disconnected from simulated FIX gateway")
        return True

    async def send_order(self, order: Order) -> bool:
        """Simulate order submission"""
        if not self.is_connected:
            self.logger.error("Not connected to gateway")
            return False

        # Simulate network latency
        await asyncio.sleep(self.latency_ms / 1000.0)

        # Generate execution report
        if self.on_execution_report_callback:
            order.status = OrderStatus.SUBMITTED
            await self.on_execution_report_callback(order)

        self.logger.info(f"Order submitted: {order.order_id}")
        return True

    async def cancel_order(self, order_id: str) -> bool:
        """Simulate order cancellation"""
        await asyncio.sleep(self.latency_ms / 1000.0)
        self.logger.info(f"Order cancelled: {order_id}")
        return True

    async def subscribe_market_data(self, symbols: list[str]) -> bool:
        """Simulate market data subscription"""
        for symbol in symbols:
            if symbol not in self.order_books:
                self.order_books[symbol] = OrderBook(symbol=symbol)
        self.logger.info(f"Subscribed to market data: {symbols}")
        return True

    async def unsubscribe_market_data(self, symbols: list[str]) -> bool:
        """Simulate market data unsubscription"""
        for symbol in symbols:
            if symbol in self.order_books:
                del self.order_books[symbol]
        self.logger.info(f"Unsubscribed from market data: {symbols}")
        return True

    async def inject_market_data(self, symbol: str, order_book: OrderBook):
        """Inject market data for testing"""
        if self.on_order_book_update_callback:
            await self.on_order_book_update_callback(symbol, order_book)


class WebSocketGateway(ABC):
    """Abstract WebSocket gateway for binary feeds"""

    def __init__(self, config: Dict[str, Any]):
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.ws_connection = None
        self.is_connected = False

    @abstractmethod
    async def connect(self, url: str) -> bool:
        """Connect to WebSocket"""
        pass

    @abstractmethod
    async def subscribe(self, channels: list[str]) -> bool:
        """Subscribe to WebSocket channels"""
        pass

    @abstractmethod
    async def handle_message(self, message: bytes):
        """Handle incoming binary message"""
        pass

    @abstractmethod
    def parse_order_book(self, data: bytes) -> OrderBook:
        """Parse binary order book data"""
        pass

    @abstractmethod
    def parse_trade(self, data: bytes) -> Tick:
        """Parse binary trade data"""
        pass
