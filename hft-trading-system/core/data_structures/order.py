"""
Core order data structures for HFT system
"""
from enum import Enum
from dataclasses import dataclass, field
from typing import Optional, List
from datetime import datetime
import uuid


class OrderSide(Enum):
    BUY = "BUY"
    SELL = "SELL"


class OrderType(Enum):
    LIMIT = "LIMIT"
    MARKET = "MARKET"
    ICEBERG = "ICEBERG"
    VWAP = "VWAP"
    TWAP = "TWAP"


class OrderStatus(Enum):
    PENDING = "PENDING"
    SUBMITTED = "SUBMITTED"
    PARTIAL_FILL = "PARTIAL_FILL"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"


class TimeInForce(Enum):
    GTC = "GTC"  # Good Till Cancel
    IOC = "IOC"  # Immediate or Cancel
    FOK = "FOK"  # Fill or Kill
    DAY = "DAY"  # Day order


@dataclass
class Order:
    """Base order structure"""
    order_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    client_order_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    symbol: str = ""
    side: OrderSide = OrderSide.BUY
    order_type: OrderType = OrderType.LIMIT
    quantity: float = 0.0
    price: Optional[float] = None
    time_in_force: TimeInForce = TimeInForce.GTC
    status: OrderStatus = OrderStatus.PENDING
    filled_quantity: float = 0.0
    average_fill_price: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)
    last_update: datetime = field(default_factory=datetime.utcnow)
    venue: str = ""  # Exchange/liquidity pool
    parent_order_id: Optional[str] = None  # For child orders (iceberg slices)

    # Metadata
    strategy_id: Optional[str] = None
    account_id: Optional[str] = None

    @property
    def remaining_quantity(self) -> float:
        return self.quantity - self.filled_quantity

    @property
    def is_complete(self) -> bool:
        return self.status in [OrderStatus.FILLED, OrderStatus.CANCELLED, OrderStatus.REJECTED]

    @property
    def is_active(self) -> bool:
        return self.status in [OrderStatus.PENDING, OrderStatus.SUBMITTED, OrderStatus.PARTIAL_FILL]


@dataclass
class IcebergOrder(Order):
    """Iceberg order that hides total order size"""
    display_quantity: float = 0.0  # Visible quantity
    child_orders: List[str] = field(default_factory=list)  # Track child order IDs
    min_display_quantity: float = 0.0  # Minimum visible size

    def __post_init__(self):
        self.order_type = OrderType.ICEBERG
        if self.display_quantity == 0.0:
            self.display_quantity = min(self.quantity * 0.1, self.quantity)


@dataclass
class VWAPOrder(Order):
    """VWAP execution order"""
    start_time: datetime = field(default_factory=datetime.utcnow)
    end_time: Optional[datetime] = None
    participation_rate: float = 0.1  # 10% of volume
    num_slices: int = 10  # Number of time slices
    target_vwap: Optional[float] = None

    def __post_init__(self):
        self.order_type = OrderType.VWAP


@dataclass
class Fill:
    """Execution fill record"""
    fill_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    order_id: str = ""
    symbol: str = ""
    side: OrderSide = OrderSide.BUY
    quantity: float = 0.0
    price: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)
    venue: str = ""
    fee: float = 0.0
    fee_currency: str = "USD"
    liquidity_flag: str = "MAKER"  # MAKER or TAKER

    @property
    def notional(self) -> float:
        return self.quantity * self.price
