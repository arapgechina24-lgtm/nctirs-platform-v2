"""
🐂 AEGIS Trading System - Core Type Definitions

Advanced Execution & Global Investment System
"""

from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, Dict, List
from decimal import Decimal
from datetime import datetime
import uuid


class Side(Enum):
    """Order side"""
    BUY = "BUY"
    SELL = "SELL"


class OrderType(Enum):
    """Order types"""
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"
    STOP_LIMIT = "STOP_LIMIT"
    ICEBERG = "ICEBERG"
    TWAP = "TWAP"
    VWAP = "VWAP"


class OrderStatus(Enum):
    """Order lifecycle states"""
    PENDING_NEW = "PENDING_NEW"
    NEW = "NEW"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    PENDING_CANCEL = "PENDING_CANCEL"
    CANCELED = "CANCELED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class TimeInForce(Enum):
    """Time in force"""
    DAY = "DAY"
    GTC = "GTC"  # Good Till Cancel
    IOC = "IOC"  # Immediate or Cancel
    FOK = "FOK"  # Fill or Kill
    GTD = "GTD"  # Good Till Date


@dataclass
class Venue:
    """
    Exchange or liquidity venue

    IMPORTANT: This system has ZERO swap/rollover/financing costs.
    Only execution fees (maker/taker) are charged per trade.
    No time-based or overnight holding costs are applied.
    """
    venue_id: str
    name: str
    is_dark_pool: bool = False
    maker_fee: Decimal = Decimal("0.0001")  # 1bp - execution only, not time-based
    taker_fee: Decimal = Decimal("0.0002")  # 2bp - execution only, not time-based
    min_order_size: Decimal = Decimal("0.01")
    tick_size: Decimal = Decimal("0.01")
    # NOTE: No swap_rate, financing_rate, or rollover_fee fields
    # This is intentional - zero overnight costs ✅


@dataclass
class Instrument:
    """Trading instrument"""
    symbol: str
    exchange: str
    asset_class: str  # FX, EQUITY, FUTURES, CRYPTO
    tick_size: Decimal
    lot_size: Decimal
    min_order_qty: Decimal
    max_order_qty: Decimal
    contract_multiplier: Decimal = Decimal("1")


@dataclass
class Order:
    """Base order object"""
    order_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    client_order_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    instrument: Instrument = None
    side: Side = None
    order_type: OrderType = None
    quantity: Decimal = Decimal("0")
    price: Optional[Decimal] = None
    stop_price: Optional[Decimal] = None
    time_in_force: TimeInForce = TimeInForce.DAY
    status: OrderStatus = OrderStatus.PENDING_NEW
    venue: Optional[Venue] = None

    # Execution details
    filled_quantity: Decimal = Decimal("0")
    avg_fill_price: Decimal = Decimal("0")

    # Timestamps
    created_at: datetime = field(default_factory=datetime.utcnow)
    submitted_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    # Algo-specific
    parent_order_id: Optional[str] = None  # For child orders
    algo_params: Dict = field(default_factory=dict)

    # Risk tags
    risk_checked: bool = False
    rejected_reason: Optional[str] = None

    @property
    def remaining_quantity(self) -> Decimal:
        return self.quantity - self.filled_quantity

    @property
    def is_complete(self) -> bool:
        return self.status in [
            OrderStatus.FILLED,
            OrderStatus.CANCELED,
            OrderStatus.REJECTED,
            OrderStatus.EXPIRED
        ]


@dataclass
class Fill:
    """Execution fill"""
    fill_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str = None
    instrument: Instrument = None
    side: Side = None
    quantity: Decimal = Decimal("0")
    price: Decimal = Decimal("0")
    venue: Venue = None
    commission: Decimal = Decimal("0")
    timestamp: datetime = field(default_factory=datetime.utcnow)
    is_maker: bool = False  # Maker vs Taker
    liquidity_flag: str = "A"  # Added/Removed liquidity


@dataclass
class Quote:
    """Level 1 quote"""
    instrument: Instrument
    bid_price: Decimal
    bid_size: Decimal
    ask_price: Decimal
    ask_size: Decimal
    timestamp: datetime
    venue: Venue

    @property
    def mid_price(self) -> Decimal:
        return (self.bid_price + self.ask_price) / 2

    @property
    def spread(self) -> Decimal:
        return self.ask_price - self.bid_price


@dataclass
class OrderBookLevel:
    """Single level in order book"""
    price: Decimal
    size: Decimal
    num_orders: int = 1


@dataclass
class OrderBookSnapshot:
    """Level 2 order book snapshot"""
    instrument: Instrument
    venue: Venue
    bids: List[OrderBookLevel]  # Sorted descending
    asks: List[OrderBookLevel]  # Sorted ascending
    timestamp: datetime
    sequence_number: int = 0

    @property
    def best_bid(self) -> Optional[OrderBookLevel]:
        return self.bids[0] if self.bids else None

    @property
    def best_ask(self) -> Optional[OrderBookLevel]:
        return self.asks[0] if self.asks else None

    @property
    def mid_price(self) -> Optional[Decimal]:
        if self.best_bid and self.best_ask:
            return (self.best_bid.price + self.best_ask.price) / 2
        return None


@dataclass
class Trade:
    """Public trade (tape)"""
    instrument: Instrument
    price: Decimal
    size: Decimal
    side: Side  # Aggressor side
    timestamp: datetime
    trade_id: str
    venue: Venue


@dataclass
class Position:
    """
    Current position

    P&L Calculation: NO swap/financing costs are deducted.
    - realized_pnl: From closed trades (minus execution fees only)
    - unrealized_pnl: Mark-to-market (no time-based costs)
    - total_pnl: Sum of above (pure price movement - execution fees)

    NOTE: No swap_accrued, financing_cost, or overnight_charges fields.
    This is intentional - positions have zero holding costs ✅
    """
    instrument: Instrument
    quantity: Decimal  # Positive = long, Negative = short
    avg_entry_price: Decimal
    realized_pnl: Decimal = Decimal("0")  # No swap deducted ✅
    unrealized_pnl: Decimal = Decimal("0")  # No swap deducted ✅
    total_pnl: Decimal = Decimal("0")  # No swap deducted ✅
    last_update: datetime = field(default_factory=datetime.utcnow)


@dataclass
class RiskLimits:
    """Risk limits configuration"""
    max_position_size: Decimal
    max_order_size: Decimal
    max_daily_loss: Decimal
    max_daily_volume: Decimal
    max_open_orders: int = 100
    max_order_value: Decimal = Decimal("1000000")
    min_order_value: Decimal = Decimal("10")
