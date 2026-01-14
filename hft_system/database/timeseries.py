"""
Time-Series Database Interface

Optimized for tick-by-tick market data storage and retrieval.
Designed to work with QuestDB, TimescaleDB, or similar TSDB.

Key features:
- High-throughput tick data ingestion
- Efficient range queries
- Market data replay for backtesting
- Data compression
"""

from typing import List, Optional, Dict, Iterator
from datetime import datetime, timedelta
from decimal import Decimal
from dataclasses import dataclass, asdict
import asyncio
import logging
from abc import ABC, abstractmethod

from core.types import (
    Trade, Quote, OrderBookSnapshot, Instrument,
    Venue, OrderBookLevel
)


logger = logging.getLogger(__name__)


@dataclass
class TickData:
    """Generic tick data point"""
    timestamp: datetime
    instrument: str
    venue: str
    data_type: str  # TRADE, QUOTE, ORDERBOOK
    bid_price: Optional[Decimal] = None
    bid_size: Optional[Decimal] = None
    ask_price: Optional[Decimal] = None
    ask_size: Optional[Decimal] = None
    trade_price: Optional[Decimal] = None
    trade_size: Optional[Decimal] = None
    trade_side: Optional[str] = None


class TimeSeriesDB(ABC):
    """Abstract time-series database interface"""

    @abstractmethod
    async def connect(self):
        """Connect to database"""
        pass

    @abstractmethod
    async def disconnect(self):
        """Disconnect from database"""
        pass

    @abstractmethod
    async def write_tick(self, tick: TickData):
        """Write single tick"""
        pass

    @abstractmethod
    async def write_ticks_batch(self, ticks: List[TickData]):
        """Write batch of ticks"""
        pass

    @abstractmethod
    async def query_ticks(
        self,
        instrument: str,
        start_time: datetime,
        end_time: datetime,
        data_type: Optional[str] = None
    ) -> List[TickData]:
        """Query ticks in time range"""
        pass

    @abstractmethod
    async def get_latest_tick(
        self,
        instrument: str,
        data_type: str
    ) -> Optional[TickData]:
        """Get most recent tick"""
        pass


class QuestDBAdapter(TimeSeriesDB):
    """
    QuestDB Adapter

    QuestDB is optimized for time-series data with high ingestion rates.
    Uses HTTP REST API and InfluxDB Line Protocol for ingestion.
    """

    def __init__(
        self,
        host: str = "localhost",
        port: int = 9000,
        http_port: int = 9009
    ):
        self.host = host
        self.port = port
        self.http_port = http_port
        self.is_connected = False
        self.write_buffer: List[TickData] = []
        self.buffer_size = 1000  # Batch writes
        self.connection = None

    async def connect(self):
        """Connect to QuestDB"""
        try:
            # In production, use actual QuestDB client library
            # For now, simulate connection
            logger.info(f"Connecting to QuestDB at {self.host}:{self.port}")
            self.is_connected = True

            # Create tables if not exists
            await self._create_tables()

            logger.info("Connected to QuestDB")
        except Exception as e:
            logger.error(f"Failed to connect to QuestDB: {e}")
            raise

    async def disconnect(self):
        """Disconnect from QuestDB"""
        if self.write_buffer:
            await self._flush_buffer()

        self.is_connected = False
        logger.info("Disconnected from QuestDB")

    async def _create_tables(self):
        """Create QuestDB tables"""
        # QuestDB SQL to create tick data table
        create_table_sql = """
        CREATE TABLE IF NOT EXISTS tick_data (
            timestamp TIMESTAMP,
            instrument SYMBOL,
            venue SYMBOL,
            data_type SYMBOL,
            bid_price DOUBLE,
            bid_size DOUBLE,
            ask_price DOUBLE,
            ask_size DOUBLE,
            trade_price DOUBLE,
            trade_size DOUBLE,
            trade_side SYMBOL
        ) timestamp(timestamp) PARTITION BY DAY;
        """

        # Create indexes
        create_index_sql = """
        CREATE INDEX IF NOT EXISTS tick_data_instrument_idx
        ON tick_data (instrument);
        """

        logger.debug("Tables created/verified")

    async def write_tick(self, tick: TickData):
        """Write single tick to buffer"""
        self.write_buffer.append(tick)

        if len(self.write_buffer) >= self.buffer_size:
            await self._flush_buffer()

    async def write_ticks_batch(self, ticks: List[TickData]):
        """Write batch of ticks"""
        self.write_buffer.extend(ticks)

        if len(self.write_buffer) >= self.buffer_size:
            await self._flush_buffer()

    async def _flush_buffer(self):
        """Flush write buffer to database"""
        if not self.write_buffer:
            return

        try:
            # Convert to QuestDB ILP (InfluxDB Line Protocol) format
            # Format: table_name,tag1=value1,tag2=value2 field1=value1,field2=value2 timestamp
            lines = []

            for tick in self.write_buffer:
                tags = f"instrument={tick.instrument},venue={tick.venue},data_type={tick.data_type}"

                fields = []
                if tick.bid_price is not None:
                    fields.append(f"bid_price={float(tick.bid_price)}")
                if tick.bid_size is not None:
                    fields.append(f"bid_size={float(tick.bid_size)}")
                if tick.ask_price is not None:
                    fields.append(f"ask_price={float(tick.ask_price)}")
                if tick.ask_size is not None:
                    fields.append(f"ask_size={float(tick.ask_size)}")
                if tick.trade_price is not None:
                    fields.append(f"trade_price={float(tick.trade_price)}")
                if tick.trade_size is not None:
                    fields.append(f"trade_size={float(tick.trade_size)}")
                if tick.trade_side is not None:
                    fields.append(f"trade_side=\"{tick.trade_side}\"")

                fields_str = ",".join(fields)
                timestamp_ns = int(tick.timestamp.timestamp() * 1_000_000_000)

                line = f"tick_data,{tags} {fields_str} {timestamp_ns}"
                lines.append(line)

            # Send to QuestDB via ILP
            ilp_data = "\n".join(lines)

            # In production, send via TCP or HTTP to QuestDB
            logger.debug(f"Flushing {len(self.write_buffer)} ticks to QuestDB")

            # Simulate write
            await asyncio.sleep(0.001)

            self.write_buffer.clear()

        except Exception as e:
            logger.error(f"Error flushing buffer: {e}")

    async def query_ticks(
        self,
        instrument: str,
        start_time: datetime,
        end_time: datetime,
        data_type: Optional[str] = None
    ) -> List[TickData]:
        """Query ticks from QuestDB"""
        # QuestDB SQL query
        sql = f"""
        SELECT * FROM tick_data
        WHERE instrument = '{instrument}'
        AND timestamp >= '{start_time.isoformat()}'
        AND timestamp <= '{end_time.isoformat()}'
        """

        if data_type:
            sql += f" AND data_type = '{data_type}'"

        sql += " ORDER BY timestamp ASC"

        logger.debug(f"Querying ticks: {instrument} from {start_time} to {end_time}")

        # In production, execute query via QuestDB client
        # For now, return empty list
        return []

    async def get_latest_tick(
        self,
        instrument: str,
        data_type: str
    ) -> Optional[TickData]:
        """Get most recent tick"""
        sql = f"""
        SELECT * FROM tick_data
        WHERE instrument = '{instrument}'
        AND data_type = '{data_type}'
        ORDER BY timestamp DESC
        LIMIT 1
        """

        logger.debug(f"Getting latest tick: {instrument} {data_type}")

        # In production, execute query
        return None


class InMemoryTickStore:
    """
    In-memory tick data store for development/testing.

    Stores tick data in memory with time-series indexing.
    Not suitable for production (limited by memory).
    """

    def __init__(self):
        self.ticks: Dict[str, List[TickData]] = {}  # instrument -> ticks
        self.is_connected = False

    async def connect(self):
        """Connect (no-op for in-memory)"""
        self.is_connected = True
        logger.info("In-memory tick store ready")

    async def disconnect(self):
        """Disconnect"""
        self.is_connected = False
        logger.info(f"In-memory tick store closed ({len(self.ticks)} instruments)")

    async def write_tick(self, tick: TickData):
        """Write tick to memory"""
        if tick.instrument not in self.ticks:
            self.ticks[tick.instrument] = []

        self.ticks[tick.instrument].append(tick)

        # Keep only last 100k ticks per instrument
        if len(self.ticks[tick.instrument]) > 100000:
            self.ticks[tick.instrument] = self.ticks[tick.instrument][-100000:]

    async def write_ticks_batch(self, ticks: List[TickData]):
        """Write batch of ticks"""
        for tick in ticks:
            await self.write_tick(tick)

    async def query_ticks(
        self,
        instrument: str,
        start_time: datetime,
        end_time: datetime,
        data_type: Optional[str] = None
    ) -> List[TickData]:
        """Query ticks from memory"""
        if instrument not in self.ticks:
            return []

        # Filter by time and data type
        result = []
        for tick in self.ticks[instrument]:
            if start_time <= tick.timestamp <= end_time:
                if data_type is None or tick.data_type == data_type:
                    result.append(tick)

        return result

    async def get_latest_tick(
        self,
        instrument: str,
        data_type: str
    ) -> Optional[TickData]:
        """Get most recent tick"""
        if instrument not in self.ticks:
            return None

        # Search backwards for matching data type
        for tick in reversed(self.ticks[instrument]):
            if tick.data_type == data_type:
                return tick

        return None

    def get_stats(self) -> Dict:
        """Get storage statistics"""
        total_ticks = sum(len(ticks) for ticks in self.ticks.values())
        return {
            "instruments": len(self.ticks),
            "total_ticks": total_ticks,
            "memory_mb": total_ticks * 200 / 1024 / 1024  # Rough estimate
        }


class MarketDataRecorder:
    """
    Records market data to time-series database.

    Handles conversion from domain objects to database format.
    """

    def __init__(self, db: TimeSeriesDB):
        self.db = db
        self.recording = False

    async def start(self):
        """Start recording"""
        await self.db.connect()
        self.recording = True
        logger.info("Market data recording started")

    async def stop(self):
        """Stop recording"""
        self.recording = False
        await self.db.disconnect()
        logger.info("Market data recording stopped")

    async def record_trade(self, trade: Trade):
        """Record trade tick"""
        if not self.recording:
            return

        tick = TickData(
            timestamp=trade.timestamp,
            instrument=trade.instrument.symbol,
            venue=trade.venue.venue_id,
            data_type="TRADE",
            trade_price=trade.price,
            trade_size=trade.size,
            trade_side=trade.side.value
        )

        await self.db.write_tick(tick)

    async def record_quote(self, quote: Quote):
        """Record quote tick"""
        if not self.recording:
            return

        tick = TickData(
            timestamp=quote.timestamp,
            instrument=quote.instrument.symbol,
            venue=quote.venue.venue_id,
            data_type="QUOTE",
            bid_price=quote.bid_price,
            bid_size=quote.bid_size,
            ask_price=quote.ask_price,
            ask_size=quote.ask_size
        )

        await self.db.write_tick(tick)

    async def record_orderbook(self, snapshot: OrderBookSnapshot):
        """Record order book snapshot (best bid/ask only for efficiency)"""
        if not self.recording:
            return

        if snapshot.best_bid and snapshot.best_ask:
            tick = TickData(
                timestamp=snapshot.timestamp,
                instrument=snapshot.instrument.symbol,
                venue=snapshot.venue.venue_id,
                data_type="ORDERBOOK",
                bid_price=snapshot.best_bid.price,
                bid_size=snapshot.best_bid.size,
                ask_price=snapshot.best_ask.price,
                ask_size=snapshot.best_ask.size
            )

            await self.db.write_tick(tick)


class MarketDataReplayer:
    """
    Replays historical market data for backtesting.

    Reads tick data from database and replays in chronological order.
    """

    def __init__(self, db: TimeSeriesDB):
        self.db = db
        self.is_replaying = False

    async def replay(
        self,
        instruments: List[str],
        start_time: datetime,
        end_time: datetime,
        callback: callable,
        speed_multiplier: float = 1.0
    ):
        """
        Replay market data.

        Args:
            instruments: List of instrument symbols to replay
            start_time: Replay start time
            end_time: Replay end time
            callback: Callback function for each tick
            speed_multiplier: Replay speed (1.0 = real-time, 0 = as fast as possible)
        """
        await self.db.connect()
        self.is_replaying = True

        logger.info(f"Starting replay: {start_time} to {end_time} "
                   f"at {speed_multiplier}x speed")

        try:
            # Query all ticks for all instruments
            all_ticks: List[TickData] = []

            for instrument in instruments:
                ticks = await self.db.query_ticks(
                    instrument=instrument,
                    start_time=start_time,
                    end_time=end_time
                )
                all_ticks.extend(ticks)

            # Sort by timestamp
            all_ticks.sort(key=lambda t: t.timestamp)

            logger.info(f"Replaying {len(all_ticks)} ticks")

            # Replay ticks
            last_time = None
            for tick in all_ticks:
                if not self.is_replaying:
                    break

                # Simulate time passage
                if speed_multiplier > 0 and last_time:
                    time_diff = (tick.timestamp - last_time).total_seconds()
                    sleep_time = time_diff / speed_multiplier
                    if sleep_time > 0:
                        await asyncio.sleep(sleep_time)

                # Call callback with tick
                await callback(tick)

                last_time = tick.timestamp

        except Exception as e:
            logger.error(f"Error during replay: {e}")
            raise
        finally:
            self.is_replaying = False
            await self.db.disconnect()

        logger.info("Replay complete")

    def stop(self):
        """Stop replay"""
        self.is_replaying = False
        logger.info("Stopping replay")
