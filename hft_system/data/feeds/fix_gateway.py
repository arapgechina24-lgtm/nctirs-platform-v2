"""
FIX Protocol Gateway Interface

Implements FIX 4.4/5.0 SP2 protocol for institutional connectivity.
This is a high-level interface - production implementation would use
QuickFIX or a commercial FIX engine.
"""

from abc import ABC, abstractmethod
from typing import Callable, Dict, Optional, List
from datetime import datetime
from decimal import Decimal
import asyncio
import logging

from core.types import (
    Order, Fill, OrderStatus, Side, OrderType,
    Instrument, Venue, OrderBookSnapshot, Quote
)


logger = logging.getLogger(__name__)


class FIXMessage:
    """FIX message representation"""

    # Common FIX tags
    TAG_MSG_TYPE = "35"
    TAG_SENDER_COMP_ID = "49"
    TAG_TARGET_COMP_ID = "56"
    TAG_MSG_SEQ_NUM = "34"
    TAG_SENDING_TIME = "52"
    TAG_SYMBOL = "55"
    TAG_SIDE = "54"
    TAG_ORDER_QTY = "38"
    TAG_PRICE = "44"
    TAG_CL_ORD_ID = "11"
    TAG_ORDER_ID = "37"
    TAG_EXEC_ID = "17"
    TAG_EXEC_TYPE = "150"
    TAG_ORD_STATUS = "39"
    TAG_CUM_QTY = "14"
    TAG_AVG_PX = "6"
    TAG_LAST_QTY = "32"
    TAG_LAST_PX = "31"

    # Message types
    MSGTYPE_NEW_ORDER = "D"
    MSGTYPE_CANCEL_REQUEST = "F"
    MSGTYPE_EXECUTION_REPORT = "8"
    MSGTYPE_ORDER_CANCEL_REJECT = "9"
    MSGTYPE_MARKET_DATA_REQUEST = "V"
    MSGTYPE_MARKET_DATA_SNAPSHOT = "W"
    MSGTYPE_MARKET_DATA_INCREMENTAL = "X"

    def __init__(self, msg_type: str):
        self.fields: Dict[str, str] = {}
        self.fields[self.TAG_MSG_TYPE] = msg_type
        self.fields[self.TAG_SENDING_TIME] = datetime.utcnow().strftime(
            "%Y%m%d-%H:%M:%S.%f"
        )

    def set_field(self, tag: str, value: str):
        """Set FIX field"""
        self.fields[tag] = str(value)

    def get_field(self, tag: str) -> Optional[str]:
        """Get FIX field"""
        return self.fields.get(tag)

    def to_fix_string(self) -> str:
        """Convert to FIX protocol string (SOH delimited)"""
        # In real FIX, SOH is \x01, using | for readability
        return "|".join([f"{tag}={value}" for tag, value in self.fields.items()])

    @classmethod
    def from_fix_string(cls, fix_str: str) -> 'FIXMessage':
        """Parse FIX string into message"""
        fields = {}
        for field in fix_str.split("|"):
            if "=" in field:
                tag, value = field.split("=", 1)
                fields[tag] = value

        msg_type = fields.get(cls.TAG_MSG_TYPE, "")
        msg = cls(msg_type)
        msg.fields = fields
        return msg


class FIXSession:
    """FIX session management"""

    def __init__(
        self,
        sender_comp_id: str,
        target_comp_id: str,
        host: str,
        port: int
    ):
        self.sender_comp_id = sender_comp_id
        self.target_comp_id = target_comp_id
        self.host = host
        self.port = port
        self.seq_num_out = 1
        self.seq_num_in = 1
        self.is_connected = False
        self.reader: Optional[asyncio.StreamReader] = None
        self.writer: Optional[asyncio.StreamWriter] = None

    async def connect(self):
        """Establish FIX session"""
        logger.info(f"Connecting to {self.host}:{self.port}")
        try:
            self.reader, self.writer = await asyncio.open_connection(
                self.host, self.port
            )
            # Send Logon message (MsgType = A)
            await self._send_logon()
            self.is_connected = True
            logger.info(f"FIX session established with {self.target_comp_id}")
        except Exception as e:
            logger.error(f"Failed to connect: {e}")
            raise

    async def disconnect(self):
        """Close FIX session"""
        if self.writer:
            # Send Logout message (MsgType = 5)
            await self._send_logout()
            self.writer.close()
            await self.writer.wait_closed()
            self.is_connected = False
            logger.info("FIX session closed")

    async def _send_logon(self):
        """Send Logon message"""
        msg = FIXMessage("A")  # Logon
        msg.set_field(FIXMessage.TAG_SENDER_COMP_ID, self.sender_comp_id)
        msg.set_field(FIXMessage.TAG_TARGET_COMP_ID, self.target_comp_id)
        msg.set_field(FIXMessage.TAG_MSG_SEQ_NUM, str(self.seq_num_out))
        msg.set_field("98", "0")  # EncryptMethod = None
        msg.set_field("108", "30")  # HeartBtInt = 30 seconds
        await self._send_message(msg)

    async def _send_logout(self):
        """Send Logout message"""
        msg = FIXMessage("5")  # Logout
        msg.set_field(FIXMessage.TAG_SENDER_COMP_ID, self.sender_comp_id)
        msg.set_field(FIXMessage.TAG_TARGET_COMP_ID, self.target_comp_id)
        msg.set_field(FIXMessage.TAG_MSG_SEQ_NUM, str(self.seq_num_out))
        await self._send_message(msg)

    async def _send_message(self, msg: FIXMessage):
        """Send FIX message"""
        msg.set_field(FIXMessage.TAG_MSG_SEQ_NUM, str(self.seq_num_out))
        fix_str = msg.to_fix_string()
        logger.debug(f"OUT: {fix_str}")
        if self.writer:
            self.writer.write((fix_str + "\n").encode())
            await self.writer.drain()
            self.seq_num_out += 1

    async def receive_message(self) -> Optional[FIXMessage]:
        """Receive FIX message"""
        if not self.reader:
            return None

        try:
            data = await self.reader.readline()
            if data:
                fix_str = data.decode().strip()
                logger.debug(f"IN: {fix_str}")
                msg = FIXMessage.from_fix_string(fix_str)
                self.seq_num_in += 1
                return msg
        except Exception as e:
            logger.error(f"Error receiving message: {e}")
            return None


class FIXGateway(ABC):
    """
    Abstract FIX Gateway interface.

    This provides a clean interface for order execution and market data
    via FIX protocol. Production implementation would integrate with
    QuickFIX, OnixS, or a proprietary FIX engine.
    """

    def __init__(
        self,
        sender_comp_id: str,
        target_comp_id: str,
        host: str,
        port: int,
        venue: Venue
    ):
        self.sender_comp_id = sender_comp_id
        self.target_comp_id = target_comp_id
        self.host = host
        self.port = port
        self.venue = venue
        self.session = FIXSession(sender_comp_id, target_comp_id, host, port)

        # Callbacks
        self.on_order_update: Optional[Callable[[Order], None]] = None
        self.on_fill: Optional[Callable[[Fill], None]] = None
        self.on_reject: Optional[Callable[[Order, str], None]] = None
        self.on_market_data: Optional[Callable[[OrderBookSnapshot], None]] = None

        # Order tracking
        self.active_orders: Dict[str, Order] = {}

    async def connect(self):
        """Connect to FIX gateway"""
        await self.session.connect()
        asyncio.create_task(self._message_loop())

    async def disconnect(self):
        """Disconnect from FIX gateway"""
        await self.session.disconnect()

    async def send_order(self, order: Order) -> bool:
        """
        Send new order via FIX.

        Args:
            order: Order object to send

        Returns:
            True if order was sent successfully
        """
        msg = FIXMessage(FIXMessage.MSGTYPE_NEW_ORDER)
        msg.set_field(FIXMessage.TAG_CL_ORD_ID, order.client_order_id)
        msg.set_field(FIXMessage.TAG_SYMBOL, order.instrument.symbol)
        msg.set_field(
            FIXMessage.TAG_SIDE,
            "1" if order.side == Side.BUY else "2"
        )
        msg.set_field(FIXMessage.TAG_ORDER_QTY, str(order.quantity))

        if order.price:
            msg.set_field(FIXMessage.TAG_PRICE, str(order.price))

        # Order type
        if order.order_type == OrderType.MARKET:
            msg.set_field("40", "1")  # OrdType = Market
        elif order.order_type == OrderType.LIMIT:
            msg.set_field("40", "2")  # OrdType = Limit

        # Time in force
        msg.set_field("59", "0")  # TimeInForce = Day

        await self.session._send_message(msg)
        self.active_orders[order.client_order_id] = order
        order.status = OrderStatus.PENDING_NEW
        order.submitted_at = datetime.utcnow()

        logger.info(f"Sent order: {order.client_order_id} {order.side} "
                   f"{order.quantity} {order.instrument.symbol} @ {order.price}")
        return True

    async def cancel_order(self, order: Order) -> bool:
        """
        Cancel existing order via FIX.

        Args:
            order: Order to cancel

        Returns:
            True if cancel request was sent
        """
        msg = FIXMessage(FIXMessage.MSGTYPE_CANCEL_REQUEST)
        msg.set_field(FIXMessage.TAG_CL_ORD_ID, order.client_order_id)
        msg.set_field("41", order.client_order_id)  # OrigClOrdID
        msg.set_field(FIXMessage.TAG_SYMBOL, order.instrument.symbol)
        msg.set_field(
            FIXMessage.TAG_SIDE,
            "1" if order.side == Side.BUY else "2"
        )

        await self.session._send_message(msg)
        order.status = OrderStatus.PENDING_CANCEL

        logger.info(f"Sent cancel for order: {order.client_order_id}")
        return True

    async def subscribe_market_data(self, instruments: List[Instrument]):
        """
        Subscribe to Level 2 market data via FIX.

        Args:
            instruments: List of instruments to subscribe
        """
        msg = FIXMessage(FIXMessage.MSGTYPE_MARKET_DATA_REQUEST)
        msg.set_field("262", "SUB_1")  # MDReqID
        msg.set_field("263", "1")  # SubscriptionRequestType = Snapshot + Updates
        msg.set_field("264", "1")  # MarketDepth = Full book

        # Add symbols (in real FIX, this is a repeating group)
        symbols = ",".join([i.symbol for i in instruments])
        msg.set_field("146", str(len(instruments)))  # NoRelatedSym
        msg.set_field(FIXMessage.TAG_SYMBOL, symbols)

        await self.session._send_message(msg)
        logger.info(f"Subscribed to market data: {symbols}")

    async def _message_loop(self):
        """Main message processing loop"""
        while self.session.is_connected:
            try:
                msg = await self.session.receive_message()
                if msg:
                    await self._handle_message(msg)
            except Exception as e:
                logger.error(f"Error in message loop: {e}")
                break

    async def _handle_message(self, msg: FIXMessage):
        """Handle incoming FIX message"""
        msg_type = msg.get_field(FIXMessage.TAG_MSG_TYPE)

        if msg_type == FIXMessage.MSGTYPE_EXECUTION_REPORT:
            await self._handle_execution_report(msg)
        elif msg_type == FIXMessage.MSGTYPE_ORDER_CANCEL_REJECT:
            await self._handle_cancel_reject(msg)
        elif msg_type == FIXMessage.MSGTYPE_MARKET_DATA_SNAPSHOT:
            await self._handle_market_data_snapshot(msg)
        elif msg_type == FIXMessage.MSGTYPE_MARKET_DATA_INCREMENTAL:
            await self._handle_market_data_incremental(msg)

    async def _handle_execution_report(self, msg: FIXMessage):
        """Handle execution report (order update/fill)"""
        cl_ord_id = msg.get_field(FIXMessage.TAG_CL_ORD_ID)
        order = self.active_orders.get(cl_ord_id)

        if not order:
            logger.warning(f"Received exec report for unknown order: {cl_ord_id}")
            return

        # Update order status
        exec_type = msg.get_field(FIXMessage.TAG_EXEC_TYPE)
        ord_status = msg.get_field(FIXMessage.TAG_ORD_STATUS)

        # Map FIX status to internal status
        status_map = {
            "0": OrderStatus.NEW,
            "1": OrderStatus.PARTIALLY_FILLED,
            "2": OrderStatus.FILLED,
            "4": OrderStatus.CANCELED,
            "8": OrderStatus.REJECTED
        }

        if ord_status in status_map:
            order.status = status_map[ord_status]

        # Check for fill
        last_qty = msg.get_field(FIXMessage.TAG_LAST_QTY)
        last_px = msg.get_field(FIXMessage.TAG_LAST_PX)

        if last_qty and last_px:
            fill = Fill(
                order_id=order.order_id,
                instrument=order.instrument,
                side=order.side,
                quantity=Decimal(last_qty),
                price=Decimal(last_px),
                venue=self.venue,
                timestamp=datetime.utcnow()
            )

            order.filled_quantity += Decimal(last_qty)

            # Update average fill price
            if order.filled_quantity > 0:
                total_value = (order.avg_fill_price * (order.filled_quantity - Decimal(last_qty)) +
                              Decimal(last_px) * Decimal(last_qty))
                order.avg_fill_price = total_value / order.filled_quantity

            if self.on_fill:
                self.on_fill(fill)

            logger.info(f"Fill: {order.client_order_id} {last_qty} @ {last_px}")

        if self.on_order_update:
            self.on_order_update(order)

        # Clean up completed orders
        if order.is_complete:
            del self.active_orders[cl_ord_id]

    async def _handle_cancel_reject(self, msg: FIXMessage):
        """Handle order cancel reject"""
        cl_ord_id = msg.get_field(FIXMessage.TAG_CL_ORD_ID)
        reason = msg.get_field("102")  # CxlRejReason

        logger.warning(f"Cancel rejected for {cl_ord_id}: {reason}")

    async def _handle_market_data_snapshot(self, msg: FIXMessage):
        """Handle market data snapshot (Level 2)"""
        # This would parse the full order book from FIX repeating groups
        # Simplified for demonstration
        if self.on_market_data:
            # Parse and construct OrderBookSnapshot
            pass

    async def _handle_market_data_incremental(self, msg: FIXMessage):
        """Handle incremental market data update"""
        # This would apply incremental updates to the order book
        pass


class SimulatedFIXGateway(FIXGateway):
    """
    Simulated FIX gateway for testing and backtesting.
    Simulates order execution without actual broker connectivity.
    """

    def __init__(self, venue: Venue):
        # Initialize with dummy connection params
        super().__init__(
            sender_comp_id="SIM_CLIENT",
            target_comp_id="SIM_BROKER",
            host="127.0.0.1",
            port=9999,
            venue=venue
        )
        self.simulated_mode = True

    async def connect(self):
        """Simulated connection"""
        self.session.is_connected = True
        logger.info("Simulated FIX gateway connected")

    async def send_order(self, order: Order) -> bool:
        """Simulate order execution"""
        await super().send_order(order)

        # Simulate immediate fill for market orders
        if order.order_type == OrderType.MARKET:
            await asyncio.sleep(0.001)  # Simulate latency
            # Simulate fill at mid price
            simulated_price = Decimal("100.00")  # Would come from market data
            fill = Fill(
                order_id=order.order_id,
                instrument=order.instrument,
                side=order.side,
                quantity=order.quantity,
                price=simulated_price,
                venue=self.venue,
                timestamp=datetime.utcnow()
            )

            order.filled_quantity = order.quantity
            order.avg_fill_price = simulated_price
            order.status = OrderStatus.FILLED

            if self.on_fill:
                self.on_fill(fill)

            if self.on_order_update:
                self.on_order_update(order)

        return True
