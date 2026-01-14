"""
Time-Series Database Interface for tick-by-tick data storage
Designed for QuestDB/kdb+ style time-series data
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Tuple
from datetime import datetime, timedelta
import logging
import asyncio
from pathlib import Path
import struct
import gzip

from core.data_structures.market_data import Tick, OrderBook, OHLCV, PriceLevel


class TimeSeriesDB(ABC):
    """Abstract base class for time-series database"""

    @abstractmethod
    async def write_tick(self, tick: Tick):
        """Write single tick to database"""
        pass

    @abstractmethod
    async def write_ticks_batch(self, ticks: List[Tick]):
        """Write batch of ticks (optimized for high throughput)"""
        pass

    @abstractmethod
    async def write_order_book_snapshot(self, order_book: OrderBook):
        """Write order book snapshot"""
        pass

    @abstractmethod
    async def query_ticks(
        self,
        symbol: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[Tick]:
        """Query ticks for time range"""
        pass

    @abstractmethod
    async def query_ohlcv(
        self,
        symbol: str,
        start_time: datetime,
        end_time: datetime,
        interval: str = "1m"
    ) -> List[OHLCV]:
        """Query OHLCV bars"""
        pass

    @abstractmethod
    async def get_latest_tick(self, symbol: str) -> Optional[Tick]:
        """Get most recent tick"""
        pass


class BinaryTickStore(TimeSeriesDB):
    """
    High-performance binary tick store for backtesting
    Optimized for sequential writes and reads
    Format: [timestamp(8), price(8), quantity(8), side(1)] = 25 bytes per tick
    """

    def __init__(self, data_dir: str = "/home/vibecode/workspace/hft-trading-system/data"):
        self.data_dir = Path(data_dir)
        self.data_dir.mkdir(parents=True, exist_ok=True)
        self.logger = logging.getLogger(self.__class__.__name__)

        # Write buffers for batching
        self.write_buffers = {}
        self.buffer_size = 10000  # Flush every 10k ticks
        self.compression_enabled = True

    async def write_tick(self, tick: Tick):
        """Write single tick"""
        await self.write_ticks_batch([tick])

    async def write_ticks_batch(self, ticks: List[Tick]):
        """Write batch of ticks"""
        if not ticks:
            return

        # Group by symbol
        by_symbol = {}
        for tick in ticks:
            if tick.symbol not in by_symbol:
                by_symbol[tick.symbol] = []
            by_symbol[tick.symbol].append(tick)

        # Write each symbol's ticks
        for symbol, symbol_ticks in by_symbol.items():
            await self._append_ticks(symbol, symbol_ticks)

    async def _append_ticks(self, symbol: str, ticks: List[Tick]):
        """Append ticks to symbol's binary file"""
        # Get date for partitioning (one file per symbol per day)
        date_str = ticks[0].timestamp.strftime("%Y%m%d")
        file_path = self.data_dir / symbol / f"{date_str}.ticks"
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Convert to binary
        binary_data = b""
        for tick in ticks:
            binary_data += self._serialize_tick(tick)

        # Append to file
        mode = "ab"  # Append binary
        with open(file_path, mode) as f:
            f.write(binary_data)

        self.logger.debug(f"Wrote {len(ticks)} ticks to {file_path}")

    def _serialize_tick(self, tick: Tick) -> bytes:
        """Serialize tick to binary (25 bytes)"""
        # timestamp (8 bytes) - microseconds since epoch
        timestamp_us = int(tick.timestamp.timestamp() * 1_000_000)

        # price (8 bytes double), quantity (8 bytes double)
        # side (1 byte): 0=BUY, 1=SELL
        side_byte = 0 if tick.side == "BUY" else 1

        return struct.pack('Qddb', timestamp_us, tick.price, tick.quantity, side_byte)

    def _deserialize_tick(self, data: bytes, symbol: str) -> Tick:
        """Deserialize tick from binary"""
        timestamp_us, price, quantity, side_byte = struct.unpack('Qddb', data)
        timestamp = datetime.fromtimestamp(timestamp_us / 1_000_000)
        side = "BUY" if side_byte == 0 else "SELL"

        return Tick(
            symbol=symbol,
            timestamp=timestamp,
            price=price,
            quantity=quantity,
            side=side
        )

    async def write_order_book_snapshot(self, order_book: OrderBook):
        """Write order book snapshot"""
        date_str = order_book.timestamp.strftime("%Y%m%d")
        file_path = self.data_dir / order_book.symbol / f"{date_str}.orderbook"
        file_path.parent.mkdir(parents=True, exist_ok=True)

        # Serialize order book (simplified)
        binary_data = self._serialize_order_book(order_book)

        with open(file_path, "ab") as f:
            f.write(binary_data)

    def _serialize_order_book(self, ob: OrderBook) -> bytes:
        """Serialize order book snapshot"""
        # Format: timestamp(8) + num_bids(2) + num_asks(2) + bid_levels + ask_levels
        # Each level: price(8) + quantity(8) + num_orders(4)
        timestamp_us = int(ob.timestamp.timestamp() * 1_000_000)
        num_bids = len(ob.bids)
        num_asks = len(ob.asks)

        data = struct.pack('QHH', timestamp_us, num_bids, num_asks)

        # Serialize bid levels
        for level in ob.bids:
            data += struct.pack('ddi', level.price, level.quantity, level.num_orders)

        # Serialize ask levels
        for level in ob.asks:
            data += struct.pack('ddi', level.price, level.quantity, level.num_orders)

        return data

    async def query_ticks(
        self,
        symbol: str,
        start_time: datetime,
        end_time: datetime
    ) -> List[Tick]:
        """Query ticks for time range"""
        ticks = []

        # Iterate through date range
        current_date = start_time.date()
        end_date = end_time.date()

        while current_date <= end_date:
            date_str = current_date.strftime("%Y%m%d")
            file_path = self.data_dir / symbol / f"{date_str}.ticks"

            if file_path.exists():
                daily_ticks = await self._read_ticks_file(file_path, symbol)

                # Filter by time range
                filtered = [
                    t for t in daily_ticks
                    if start_time <= t.timestamp <= end_time
                ]
                ticks.extend(filtered)

            current_date += timedelta(days=1)

        return ticks

    async def _read_ticks_file(self, file_path: Path, symbol: str) -> List[Tick]:
        """Read all ticks from binary file"""
        ticks = []
        tick_size = 25  # bytes

        with open(file_path, "rb") as f:
            while True:
                data = f.read(tick_size)
                if not data:
                    break
                if len(data) == tick_size:
                    tick = self._deserialize_tick(data, symbol)
                    ticks.append(tick)

        return ticks

    async def query_ohlcv(
        self,
        symbol: str,
        start_time: datetime,
        end_time: datetime,
        interval: str = "1m"
    ) -> List[OHLCV]:
        """Generate OHLCV bars from ticks"""
        # Get ticks
        ticks = await self.query_ticks(symbol, start_time, end_time)

        if not ticks:
            return []

        # Parse interval
        interval_seconds = self._parse_interval(interval)

        # Aggregate into bars
        bars = []
        current_bar_start = self._floor_timestamp(ticks[0].timestamp, interval_seconds)
        current_bar = None

        for tick in ticks:
            bar_start = self._floor_timestamp(tick.timestamp, interval_seconds)

            if bar_start != current_bar_start:
                if current_bar:
                    bars.append(current_bar)
                current_bar = OHLCV(
                    symbol=symbol,
                    timestamp=bar_start,
                    open=tick.price,
                    high=tick.price,
                    low=tick.price,
                    close=tick.price,
                    volume=tick.quantity,
                    num_trades=1
                )
                current_bar_start = bar_start
            else:
                if current_bar is None:
                    current_bar = OHLCV(
                        symbol=symbol,
                        timestamp=bar_start,
                        open=tick.price,
                        high=tick.price,
                        low=tick.price,
                        close=tick.price,
                        volume=tick.quantity,
                        num_trades=1
                    )
                else:
                    current_bar.high = max(current_bar.high, tick.price)
                    current_bar.low = min(current_bar.low, tick.price)
                    current_bar.close = tick.price
                    current_bar.volume += tick.quantity
                    current_bar.num_trades += 1

        if current_bar:
            bars.append(current_bar)

        # Calculate VWAP for each bar
        for bar in bars:
            bar.vwap = (bar.open + bar.high + bar.low + bar.close) / 4

        return bars

    def _parse_interval(self, interval: str) -> int:
        """Parse interval string to seconds"""
        unit = interval[-1]
        value = int(interval[:-1])

        if unit == 's':
            return value
        elif unit == 'm':
            return value * 60
        elif unit == 'h':
            return value * 3600
        elif unit == 'd':
            return value * 86400
        else:
            raise ValueError(f"Invalid interval: {interval}")

    def _floor_timestamp(self, timestamp: datetime, interval_seconds: int) -> datetime:
        """Floor timestamp to interval"""
        epoch = timestamp.timestamp()
        floored = (epoch // interval_seconds) * interval_seconds
        return datetime.fromtimestamp(floored)

    async def get_latest_tick(self, symbol: str) -> Optional[Tick]:
        """Get most recent tick"""
        # Find most recent file
        symbol_dir = self.data_dir / symbol
        if not symbol_dir.exists():
            return None

        tick_files = sorted(symbol_dir.glob("*.ticks"), reverse=True)
        if not tick_files:
            return None

        # Read last tick from most recent file
        ticks = await self._read_ticks_file(tick_files[0], symbol)
        return ticks[-1] if ticks else None

    async def compress_old_data(self, days_to_keep_uncompressed: int = 7):
        """Compress old tick data to save space"""
        cutoff_date = datetime.utcnow().date() - timedelta(days=days_to_keep_uncompressed)

        for symbol_dir in self.data_dir.iterdir():
            if not symbol_dir.is_dir():
                continue

            for tick_file in symbol_dir.glob("*.ticks"):
                date_str = tick_file.stem
                file_date = datetime.strptime(date_str, "%Y%m%d").date()

                if file_date < cutoff_date:
                    # Compress file
                    compressed_path = tick_file.with_suffix(".ticks.gz")
                    if not compressed_path.exists():
                        with open(tick_file, "rb") as f_in:
                            with gzip.open(compressed_path, "wb") as f_out:
                                f_out.write(f_in.read())
                        tick_file.unlink()
                        self.logger.info(f"Compressed {tick_file}")

    def get_storage_stats(self) -> dict:
        """Get storage statistics"""
        total_size = 0
        file_count = 0

        for symbol_dir in self.data_dir.iterdir():
            if not symbol_dir.is_dir():
                continue

            for file in symbol_dir.glob("*"):
                total_size += file.stat().st_size
                file_count += 1

        return {
            'total_size_mb': total_size / (1024 * 1024),
            'file_count': file_count,
            'symbols': len(list(self.data_dir.iterdir()))
        }
