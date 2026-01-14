"""
Configuration Example for AEGIS Trading System

Advanced Execution & Global Investment System
Copy this file to config.py and customize for your setup.
"""

from decimal import Decimal
from datetime import time

# ============================================================================
# SYSTEM CONFIGURATION
# ============================================================================

SYSTEM_NAME = "AEGIS_TRADING_SYSTEM"
ENVIRONMENT = "DEVELOPMENT"  # DEVELOPMENT, STAGING, PRODUCTION

# ============================================================================
# VENUE CONFIGURATION
# ============================================================================

# IMPORTANT: This system has ZERO swap/rollover/financing costs
# Only execution fees (maker/taker) are charged per trade
# No time-based or overnight holding costs

VENUES = {
    "NYSE": {
        "name": "New York Stock Exchange",
        "maker_fee": 0.0001,  # 1 bp (execution only, not time-based)
        "taker_fee": 0.0002,  # 2 bp (execution only, not time-based)
        "tick_size": 0.01,
        "min_order_size": 1,
        # NO swap_rate - Zero overnight costs ✅
        # NO financing_rate - Zero holding costs ✅
        # NO rollover_fee - Zero time-based fees ✅
    },
    "NASDAQ": {
        "name": "NASDAQ",
        "maker_fee": 0.00015,  # Execution only
        "taker_fee": 0.00025,  # Execution only
        "tick_size": 0.01,
        "min_order_size": 1,
        # NO swap costs ✅
    },
    "BATS": {
        "name": "BATS Exchange",
        "maker_fee": 0.00005,  # Execution only
        "taker_fee": 0.00015,  # Execution only
        "tick_size": 0.01,
        "min_order_size": 1,
        # NO swap costs ✅
    }
}

# ============================================================================
# FIX GATEWAY CONFIGURATION
# ============================================================================

FIX_CONFIG = {
    "sender_comp_id": "YOUR_FIRM_ID",
    "target_comp_id": "BROKER_ID",
    "host": "fix.broker.com",
    "port": 9000,
    "heartbeat_interval": 30,  # seconds
    "reconnect_interval": 5,  # seconds
    "max_reconnect_attempts": 10
}

# ============================================================================
# RISK MANAGEMENT CONFIGURATION
# ============================================================================

RISK_LIMITS = {
    "max_position_size": Decimal("10000"),
    "max_order_size": Decimal("1000"),
    "max_daily_loss": Decimal("50000"),
    "max_daily_volume": Decimal("1000000"),
    "max_open_orders": 50,
    "max_order_value": Decimal("100000"),
    "min_order_value": Decimal("100"),
}

# Alert thresholds (as percentage of limit)
RISK_ALERT_THRESHOLDS = {
    "daily_loss": 0.75,  # Alert at 75% of limit
    "position_size": 0.90,
    "daily_volume": 0.80
}

# ============================================================================
# EXECUTION ENGINE CONFIGURATION
# ============================================================================

EXECUTION_CONFIG = {
    "default_algo": "VWAP",
    "max_child_orders": 100,
    "child_order_timeout": 30,  # seconds
    "cancel_timeout": 5,  # seconds
}

# VWAP default parameters
VWAP_DEFAULTS = {
    "participation_rate": 0.10,  # 10%
    "urgency": 0.5,
    "min_fill_ratio": 0.05,
    "max_fill_ratio": 0.30
}

# Iceberg default parameters
ICEBERG_DEFAULTS = {
    "display_quantity_pct": 0.10,  # 10% of total
    "variance": 0.10,  # 10% randomization
    "refresh_on_fill": True
}

# SOR default parameters
SOR_DEFAULTS = {
    "route_strategy": "BEST_PRICE",  # BEST_PRICE, PRO_RATA, WEIGHTED
    "prefer_maker_fee": True,
    "include_dark_pools": False,
    "max_venue_latency_ms": 50.0
}

# ============================================================================
# MARKET DATA CONFIGURATION
# ============================================================================

MARKET_DATA_CONFIG = {
    "websocket_url": "wss://market-data.provider.com/v1/stream",
    "api_key": "YOUR_API_KEY",
    "subscribe_to": [
        "trades",
        "quotes",
        "orderbook_l2"
    ],
    "reconnect_on_disconnect": True,
    "max_reconnect_attempts": 10
}

# ============================================================================
# DATABASE CONFIGURATION
# ============================================================================

# QuestDB configuration
QUESTDB_CONFIG = {
    "host": "localhost",
    "port": 9000,
    "http_port": 9009,
    "username": "admin",
    "password": "quest",
    "database": "hft_data"
}

# In-memory store settings (for development)
INMEMORY_STORE_CONFIG = {
    "max_ticks_per_instrument": 100000,
    "cleanup_interval": 3600  # seconds
}

# ============================================================================
# BACKTESTING CONFIGURATION
# ============================================================================

BACKTEST_CONFIG = {
    "enable_market_impact": True,
    "market_impact_model": "SQRT",  # LINEAR, SQRT, PERMANENT
    "impact_coefficient": 0.1,

    "enable_slippage": True,
    "slippage_model": "PROPORTIONAL",  # FIXED, PROPORTIONAL
    "slippage_bps": 1.0,

    "enable_latency": True,
    "order_latency_ms": 5.0,
    "market_data_latency_ms": 1.0,

    "enable_fees": True,
    "enable_partial_fills": True,
    "partial_fill_probability": 0.15
}

# ============================================================================
# STRATEGY CONFIGURATION
# ============================================================================

STRATEGIES = {
    "order_flow_imbalance": {
        "enabled": True,
        "instruments": ["AAPL", "MSFT", "GOOGL"],
        "imbalance_threshold": 0.3,
        "position_limit": Decimal("100"),
        "order_size": Decimal("10")
    },
    "spread_capture": {
        "enabled": True,
        "instruments": ["SPY", "QQQ"],
        "quote_size": Decimal("10"),
        "max_inventory": Decimal("100"),
        "spread_multiplier": 1.5
    },
    "statistical_arbitrage": {
        "enabled": False,
        "pairs": [
            ("AAPL", "MSFT"),
            ("JPM", "BAC")
        ],
        "lookback_periods": 100,
        "entry_threshold": 2.0,
        "exit_threshold": 0.5
    }
}

# ============================================================================
# TRADING HOURS
# ============================================================================

TRADING_HOURS = {
    "NYSE": {
        "pre_market_open": time(4, 0),
        "market_open": time(9, 30),
        "market_close": time(16, 0),
        "post_market_close": time(20, 0),
    }
}

# Only trade during regular hours
TRADE_DURING_EXTENDED_HOURS = False

# ============================================================================
# LOGGING CONFIGURATION
# ============================================================================

LOGGING_CONFIG = {
    "level": "INFO",  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    "file": "logs/hft_system.log",
    "max_bytes": 10485760,  # 10MB
    "backup_count": 5,
    "console_output": True
}

# ============================================================================
# MONITORING AND ALERTING
# ============================================================================

MONITORING_CONFIG = {
    "enabled": True,
    "metrics_port": 8000,
    "health_check_interval": 60,  # seconds
    "alert_email": "trading@yourfirm.com",
    "alert_phone": "+1234567890"
}

# ============================================================================
# PERFORMANCE SETTINGS
# ============================================================================

PERFORMANCE_CONFIG = {
    "use_uvloop": True,  # Faster event loop (Linux/Mac only)
    "worker_threads": 4,
    "enable_profiling": False,
    "profile_output_dir": "profiling/"
}

# ============================================================================
# DEVELOPMENT/DEBUG SETTINGS
# ============================================================================

DEBUG_CONFIG = {
    "simulate_mode": True,  # Use simulated gateway
    "save_all_messages": False,
    "verbose_logging": False,
    "record_market_data": True
}
