"""
🐂 AEGIS Trading System - Web Dashboard

Advanced Execution & Global Investment System
Provides real-time monitoring and control of the trading system.
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import asyncio
import uvicorn
from datetime import datetime
from decimal import Decimal
import logging
from typing import Dict, List
import json

from core.types import (
    Instrument, Venue, Order, Side, OrderType,
    RiskLimits, OrderBookLevel, OrderBookSnapshot
)
from data.feeds.fix_gateway import SimulatedFIXGateway
from execution.engine import ExecutionEngine, VWAPParams
from execution.trailing_stop import (
    TrailingStopManager, TrailingStopConfig,
    TrailingType, TrailingMode
)
from risk.manager import RiskManager
from core.orderbook import OrderBook, MarketMicrostructureAnalyzer
from strategies.base import OrderFlowImbalanceStrategy

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="🐂 AEGIS Trading System Dashboard")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
class TradingSystemState:
    def __init__(self):
        self.is_running = False
        self.venue = None
        self.instruments = []
        self.gateway = None
        self.execution_engine = None
        self.risk_manager = None
        self.trailing_manager = None
        self.strategies = []
        self.order_books = {}
        self.analyzer = None

        # Metrics
        self.total_orders = 0
        self.total_fills = 0
        self.daily_pnl = Decimal("0")
        self.positions = {}
        self.recent_orders = []
        self.recent_fills = []
        self.risk_violations = []

        # WebSocket connections
        self.websocket_connections: List[WebSocket] = []

state = TradingSystemState()


class DecimalEncoder(json.JSONEncoder):
    """JSON encoder for Decimal types"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)


def json_response(data):
    """Helper to create JSON response with Decimal support"""
    return JSONResponse(
        content=json.loads(json.dumps(data, cls=DecimalEncoder))
    )


class MockMarketDataProvider:
    """Mock market data for simulation"""
    async def get_quote(self, instrument, venue=None):
        from core.types import Quote
        import random

        # Simulate price movement
        base_price = Decimal("150.00")
        volatility = Decimal(str(random.uniform(-0.5, 0.5)))

        return Quote(
            instrument=instrument,
            bid_price=base_price + volatility - Decimal("0.05"),
            bid_size=Decimal("1000"),
            ask_price=base_price + volatility + Decimal("0.05"),
            ask_size=Decimal("1000"),
            timestamp=datetime.utcnow(),
            venue=venue or state.venue
        )


async def initialize_system():
    """Initialize the trading system"""
    logger.info("Initializing HFT Trading System...")

    # Create venue
    state.venue = Venue(
        venue_id="NYSE",
        name="New York Stock Exchange",
        maker_fee=Decimal("0.0001"),
        taker_fee=Decimal("0.0002"),
        tick_size=Decimal("0.01")
    )

    # Create instruments
    state.instruments = [
        Instrument(
            symbol="AAPL",
            exchange="NYSE",
            asset_class="EQUITY",
            tick_size=Decimal("0.01"),
            lot_size=Decimal("1"),
            min_order_qty=Decimal("1"),
            max_order_qty=Decimal("1000000")
        ),
        Instrument(
            symbol="MSFT",
            exchange="NYSE",
            asset_class="EQUITY",
            tick_size=Decimal("0.01"),
            lot_size=Decimal("1"),
            min_order_qty=Decimal("1"),
            max_order_qty=Decimal("1000000")
        ),
        Instrument(
            symbol="GOOGL",
            exchange="NYSE",
            asset_class="EQUITY",
            tick_size=Decimal("0.01"),
            lot_size=Decimal("1"),
            min_order_qty=Decimal("1"),
            max_order_qty=Decimal("1000000")
        )
    ]

    # Initialize FIX gateway
    state.gateway = SimulatedFIXGateway(state.venue)

    # Set up callbacks
    def on_fill(fill):
        state.total_fills += 1
        state.recent_fills.insert(0, {
            "time": fill.timestamp.isoformat(),
            "symbol": fill.instrument.symbol,
            "side": fill.side.value,
            "quantity": float(fill.quantity),
            "price": float(fill.price),
            "commission": float(fill.commission)
        })
        state.recent_fills = state.recent_fills[:50]  # Keep last 50

        # Broadcast to websockets
        asyncio.create_task(broadcast_update("fill", state.recent_fills[0]))

    state.gateway.on_fill = on_fill
    await state.gateway.connect()

    # Initialize market data provider
    market_data = MockMarketDataProvider()

    # Initialize execution engine
    state.execution_engine = ExecutionEngine(market_data, state.gateway)

    # Initialize risk manager
    risk_limits = RiskLimits(
        max_position_size=Decimal("10000"),
        max_order_size=Decimal("1000"),
        max_daily_loss=Decimal("50000"),
        max_daily_volume=Decimal("1000000"),
        max_open_orders=50
    )
    state.risk_manager = RiskManager(risk_limits)

    # Set up risk callbacks
    def on_violation(violation):
        state.risk_violations.insert(0, {
            "time": violation.timestamp.isoformat(),
            "type": violation.violation_type.value,
            "description": violation.description,
            "severity": violation.severity
        })
        state.risk_violations = state.risk_violations[:20]
        asyncio.create_task(broadcast_update("violation", state.risk_violations[0]))

    state.risk_manager.pre_trade.on_violation = on_violation

    # Initialize order book analyzer
    state.analyzer = MarketMicrostructureAnalyzer()

    # Create order books for each instrument
    for instrument in state.instruments:
        ob = OrderBook(instrument, state.venue)
        state.order_books[instrument.symbol] = ob
        state.analyzer.register_orderbook(ob)

        # Initialize with sample data
        snapshot = OrderBookSnapshot(
            instrument=instrument,
            venue=state.venue,
            bids=[
                OrderBookLevel(Decimal("149.99"), Decimal("1000")),
                OrderBookLevel(Decimal("149.98"), Decimal("500")),
                OrderBookLevel(Decimal("149.97"), Decimal("750")),
            ],
            asks=[
                OrderBookLevel(Decimal("150.01"), Decimal("800")),
                OrderBookLevel(Decimal("150.02"), Decimal("600")),
                OrderBookLevel(Decimal("150.03"), Decimal("900")),
            ],
            timestamp=datetime.utcnow()
        )
        ob.update_snapshot(snapshot)

    # Initialize Trailing Stop Manager
    trailing_config = TrailingStopConfig(
        trailing_type=TrailingType.PERCENTAGE,
        trailing_mode=TrailingMode.IMMEDIATE,
        trailing_distance=Decimal("0.02"),  # 2% trailing
        min_profit_lock=Decimal("0.01")  # Lock at 1% profit
    )

    state.trailing_manager = TrailingStopManager(
        execution_engine=state.execution_engine,
        market_data_provider=market_data,
        default_config=trailing_config
    )

    # Set up trailing callbacks
    def on_stop_adjusted(trailing_stop):
        logger.info(
            f"📈 Trailing stop adjusted: {trailing_stop.instrument.symbol} "
            f"Stop=${trailing_stop.current_stop_price:.2f}"
        )
        asyncio.create_task(broadcast_update("trailing_adjusted", {
            "symbol": trailing_stop.instrument.symbol,
            "stop_price": float(trailing_stop.current_stop_price),
            "protected_profit": float(trailing_stop.protected_profit_pct)
        }))

    def on_stop_triggered(trailing_stop):
        logger.warning(f"🛑 Stop triggered: {trailing_stop.instrument.symbol}")
        asyncio.create_task(broadcast_update("stop_triggered", {
            "symbol": trailing_stop.instrument.symbol,
            "exit_price": float(trailing_stop.current_stop_price),
            "final_profit": float(trailing_stop.protected_profit_pct)
        }))

    state.trailing_manager.on_stop_adjusted = on_stop_adjusted
    state.trailing_manager.on_stop_triggered = on_stop_triggered

    await state.trailing_manager.start()

    state.is_running = True
    logger.info("✅ Trading system initialized successfully")
    logger.info("✅ Auto Trailing System activated (2% trailing distance)")


async def broadcast_update(event_type: str, data: dict):
    """Broadcast update to all connected WebSocket clients"""
    message = json.dumps({
        "type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    }, cls=DecimalEncoder)

    # Remove disconnected clients
    disconnected = []
    for websocket in state.websocket_connections:
        try:
            await websocket.send_text(message)
        except:
            disconnected.append(websocket)

    for ws in disconnected:
        state.websocket_connections.remove(ws)


# HTML Dashboard
DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🐂 AEGIS Trading System Dashboard</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #0a0e27;
            color: #e0e0e0;
            padding: 20px;
        }

        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
        }

        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            color: white;
        }

        .header .subtitle {
            font-size: 1.1em;
            opacity: 0.9;
            color: white;
        }

        .status-bar {
            display: flex;
            gap: 20px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        .status-card {
            background: #1a1f3a;
            padding: 20px;
            border-radius: 8px;
            flex: 1;
            min-width: 200px;
            border: 1px solid #2a2f4a;
            transition: all 0.3s ease;
        }

        .status-card:hover {
            border-color: #667eea;
            transform: translateY(-2px);
        }

        .status-card h3 {
            color: #8b92b0;
            font-size: 0.9em;
            margin-bottom: 10px;
            text-transform: uppercase;
        }

        .status-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #667eea;
        }

        .status-card.positive .value {
            color: #4ade80;
        }

        .status-card.negative .value {
            color: #f87171;
        }

        .controls {
            display: flex;
            gap: 15px;
            margin-bottom: 30px;
            flex-wrap: wrap;
        }

        button {
            background: #667eea;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 1em;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        button:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 4px 8px rgba(102, 126, 234, 0.4);
        }

        button:disabled {
            background: #4a5568;
            cursor: not-allowed;
            transform: none;
        }

        .button-success {
            background: #10b981;
        }

        .button-success:hover {
            background: #059669;
        }

        .button-danger {
            background: #ef4444;
        }

        .button-danger:hover {
            background: #dc2626;
        }

        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .panel {
            background: #1a1f3a;
            border-radius: 8px;
            padding: 20px;
            border: 1px solid #2a2f4a;
        }

        .panel h2 {
            color: #667eea;
            margin-bottom: 15px;
            font-size: 1.3em;
            border-bottom: 2px solid #2a2f4a;
            padding-bottom: 10px;
        }

        .table {
            width: 100%;
            border-collapse: collapse;
        }

        .table th {
            background: #2a2f4a;
            padding: 10px;
            text-align: left;
            font-weight: 600;
            color: #8b92b0;
            font-size: 0.9em;
        }

        .table td {
            padding: 10px;
            border-bottom: 1px solid #2a2f4a;
        }

        .table tr:hover {
            background: #252a45;
        }

        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.85em;
            font-weight: 600;
        }

        .badge-buy {
            background: rgba(74, 222, 128, 0.2);
            color: #4ade80;
        }

        .badge-sell {
            background: rgba(248, 113, 113, 0.2);
            color: #f87171;
        }

        .badge-success {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
        }

        .badge-warning {
            background: rgba(251, 191, 36, 0.2);
            color: #fbbf24;
        }

        .badge-error {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
        }

        .status-indicator {
            display: inline-block;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            margin-right: 8px;
            animation: pulse 2s infinite;
        }

        .status-running {
            background: #10b981;
        }

        .status-stopped {
            background: #ef4444;
            animation: none;
        }

        @keyframes pulse {
            0%, 100% {
                opacity: 1;
            }
            50% {
                opacity: 0.5;
            }
        }

        .empty-state {
            text-align: center;
            padding: 40px;
            color: #6b7280;
        }

        .form-group {
            margin-bottom: 15px;
        }

        .form-group label {
            display: block;
            margin-bottom: 5px;
            color: #8b92b0;
        }

        .form-group input,
        .form-group select {
            width: 100%;
            padding: 10px;
            background: #0a0e27;
            border: 1px solid #2a2f4a;
            border-radius: 6px;
            color: #e0e0e0;
            font-size: 1em;
        }

        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: #667eea;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🐂 AEGIS Trading System</h1>
        <div class="subtitle">Advanced Execution & Global Investment System</div>
    </div>

    <div class="status-bar">
        <div class="status-card">
            <h3>System Status</h3>
            <div class="value" id="systemStatus">
                <span class="status-indicator status-stopped"></span>Stopped
            </div>
        </div>
        <div class="status-card positive">
            <h3>Daily P&L</h3>
            <div class="value" id="dailyPnl">$0.00</div>
        </div>
        <div class="status-card">
            <h3>Total Orders</h3>
            <div class="value" id="totalOrders">0</div>
        </div>
        <div class="status-card">
            <h3>Total Fills</h3>
            <div class="value" id="totalFills">0</div>
        </div>
        <div class="status-card">
            <h3>Open Positions</h3>
            <div class="value" id="openPositions">0</div>
        </div>
    </div>

    <div class="controls">
        <button id="initBtn" onclick="initializeSystem()">Initialize System</button>
        <button id="startBtn" onclick="startTrading()" disabled>Start Trading</button>
        <button id="stopBtn" onclick="stopTrading()" class="button-danger" disabled>Stop Trading</button>
        <button onclick="showOrderForm()" class="button-success">Submit Order</button>
    </div>

    <div class="grid">
        <div class="panel">
            <h2>Positions</h2>
            <table class="table" id="positionsTable">
                <thead>
                    <tr>
                        <th>Symbol</th>
                        <th>Quantity</th>
                        <th>Avg Price</th>
                        <th>P&L</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="4" class="empty-state">No positions</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="panel">
            <h2>Recent Orders</h2>
            <table class="table" id="ordersTable">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Symbol</th>
                        <th>Side</th>
                        <th>Quantity</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="5" class="empty-state">No orders yet</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="grid">
        <div class="panel">
            <h2>Recent Fills</h2>
            <table class="table" id="fillsTable">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Symbol</th>
                        <th>Side</th>
                        <th>Qty</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="5" class="empty-state">No fills yet</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="panel">
            <h2>Risk Violations</h2>
            <table class="table" id="violationsTable">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Type</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td colspan="3" class="empty-state">No violations</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="panel">
        <h2>🎯 Auto Trailing Stops (Live Protection)</h2>
        <div style="margin-bottom: 15px; padding: 10px; background: rgba(102, 126, 234, 0.1); border-radius: 6px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span><strong>Active Trailing Stops:</strong> <span id="activeTrailingStops">0</span></span>
                <span><strong>Total Adjustments:</strong> <span id="totalAdjustments">0</span></span>
                <span><strong>Avg Protected Profit:</strong> <span id="avgProtectedProfit">0.00%</span></span>
            </div>
        </div>
        <table class="table" id="trailingStopsTable">
            <thead>
                <tr>
                    <th>Symbol</th>
                    <th>Side</th>
                    <th>Entry</th>
                    <th>Current Stop</th>
                    <th>Profit</th>
                    <th>Protected</th>
                    <th>Adjustments</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td colspan="8" class="empty-state">No active trailing stops</td>
                </tr>
            </tbody>
        </table>
    </div>

    <div class="panel">
        <h2>Order Book - AAPL</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
                <h3 style="color: #4ade80; margin-bottom: 10px;">Bids</h3>
                <table class="table" id="bidsTable">
                    <thead>
                        <tr>
                            <th>Price</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
            <div>
                <h3 style="color: #f87171; margin-bottom: 10px;">Asks</h3>
                <table class="table" id="asksTable">
                    <thead>
                        <tr>
                            <th>Price</th>
                            <th>Size</th>
                        </tr>
                    </thead>
                    <tbody></tbody>
                </table>
            </div>
        </div>
    </div>

    <script>
        let ws = null;

        // WebSocket connection
        function connectWebSocket() {
            ws = new WebSocket(`ws://${window.location.host}/ws`);

            ws.onopen = () => {
                console.log('WebSocket connected');
            };

            ws.onmessage = (event) => {
                const message = JSON.parse(event.data);
                handleWebSocketMessage(message);
            };

            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
            };

            ws.onclose = () => {
                console.log('WebSocket closed, reconnecting...');
                setTimeout(connectWebSocket, 3000);
            };
        }

        function handleWebSocketMessage(message) {
            if (message.type === 'fill') {
                updateRecentFills([message.data]);
            } else if (message.type === 'violation') {
                updateViolations([message.data]);
            }
        }

        async function initializeSystem() {
            const btn = document.getElementById('initBtn');
            btn.disabled = true;
            btn.textContent = 'Initializing...';

            try {
                const response = await fetch('/api/initialize', { method: 'POST' });
                const data = await response.json();

                if (data.success) {
                    document.getElementById('systemStatus').innerHTML =
                        '<span class="status-indicator status-running"></span>Running';
                    document.getElementById('startBtn').disabled = false;
                    document.getElementById('stopBtn').disabled = false;
                    connectWebSocket();
                    startPolling();
                    alert('✅ System initialized successfully!');
                } else {
                    alert('❌ Failed to initialize: ' + data.error);
                    btn.disabled = false;
                    btn.textContent = 'Initialize System';
                }
            } catch (error) {
                alert('❌ Error: ' + error);
                btn.disabled = false;
                btn.textContent = 'Initialize System';
            }
        }

        async function startTrading() {
            // Placeholder for future strategy start
            alert('✅ Trading started (strategies can be added)');
        }

        async function stopTrading() {
            alert('⚠️ Trading stopped');
        }

        function showOrderForm() {
            const symbol = prompt('Symbol (AAPL, MSFT, GOOGL):', 'AAPL');
            if (!symbol) return;

            const side = prompt('Side (BUY/SELL):', 'BUY');
            if (!side) return;

            const quantity = prompt('Quantity:', '100');
            if (!quantity) return;

            const price = prompt('Price:', '150.00');
            if (!price) return;

            submitOrder(symbol, side, quantity, price);
        }

        async function submitOrder(symbol, side, quantity, price) {
            try {
                const response = await fetch('/api/order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ symbol, side, quantity, price })
                });

                const data = await response.json();

                if (data.success) {
                    alert('✅ Order submitted: ' + data.order_id);
                    refreshData();
                } else {
                    alert('❌ Order rejected: ' + data.error);
                }
            } catch (error) {
                alert('❌ Error: ' + error);
            }
        }

        async function refreshData() {
            try {
                const response = await fetch('/api/status');
                const data = await response.json();

                // Update status cards
                document.getElementById('dailyPnl').textContent =
                    '$' + data.daily_pnl.toFixed(2);
                document.getElementById('totalOrders').textContent = data.total_orders;
                document.getElementById('totalFills').textContent = data.total_fills;
                document.getElementById('openPositions').textContent = data.open_positions;

                // Update P&L color
                const pnlCard = document.getElementById('dailyPnl').parentElement;
                pnlCard.className = 'status-card ' +
                    (data.daily_pnl >= 0 ? 'positive' : 'negative');

                // Update tables
                updateRecentOrders(data.recent_orders);
                updateRecentFills(data.recent_fills);
                updateViolations(data.risk_violations);
                updateTrailingStops(data.trailing_stops);
                updateOrderBook(data.order_book);

            } catch (error) {
                console.error('Error refreshing data:', error);
            }
        }

        function updateRecentOrders(orders) {
            const tbody = document.querySelector('#ordersTable tbody');
            if (orders.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No orders yet</td></tr>';
                return;
            }

            tbody.innerHTML = orders.slice(0, 10).map(order => `
                <tr>
                    <td>${new Date(order.time).toLocaleTimeString()}</td>
                    <td>${order.symbol}</td>
                    <td><span class="badge badge-${order.side.toLowerCase()}">${order.side}</span></td>
                    <td>${order.quantity}</td>
                    <td><span class="badge badge-success">${order.status}</span></td>
                </tr>
            `).join('');
        }

        function updateRecentFills(fills) {
            const tbody = document.querySelector('#fillsTable tbody');
            if (fills.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" class="empty-state">No fills yet</td></tr>';
                return;
            }

            tbody.innerHTML = fills.slice(0, 10).map(fill => `
                <tr>
                    <td>${new Date(fill.time).toLocaleTimeString()}</td>
                    <td>${fill.symbol}</td>
                    <td><span class="badge badge-${fill.side.toLowerCase()}">${fill.side}</span></td>
                    <td>${fill.quantity}</td>
                    <td>$${fill.price.toFixed(2)}</td>
                </tr>
            `).join('');
        }

        function updateViolations(violations) {
            const tbody = document.querySelector('#violationsTable tbody');
            if (violations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" class="empty-state">No violations</td></tr>';
                return;
            }

            tbody.innerHTML = violations.slice(0, 10).map(v => `
                <tr>
                    <td>${new Date(v.time).toLocaleTimeString()}</td>
                    <td><span class="badge badge-error">${v.type}</span></td>
                    <td>${v.description}</td>
                </tr>
            `).join('');
        }

        function updateTrailingStops(trailingData) {
            if (!trailingData) return;

            // Update summary stats
            document.getElementById('activeTrailingStops').textContent =
                trailingData.active_trailing_stops || 0;
            document.getElementById('totalAdjustments').textContent =
                trailingData.total_adjustments || 0;
            document.getElementById('avgProtectedProfit').textContent =
                ((trailingData.avg_protected_profit_pct || 0) * 100).toFixed(2) + '%';

            // Update table
            const tbody = document.querySelector('#trailingStopsTable tbody');
            const stops = trailingData.trailing_stops || [];

            if (stops.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No active trailing stops</td></tr>';
                return;
            }

            tbody.innerHTML = stops.map(ts => `
                <tr>
                    <td><strong>${ts.symbol}</strong></td>
                    <td><span class="badge badge-${ts.side.toLowerCase()}">${ts.side}</span></td>
                    <td>$${ts.entry_price.toFixed(2)}</td>
                    <td style="color: ${ts.side === 'BUY' ? '#4ade80' : '#f87171'};">
                        <strong>$${ts.current_stop.toFixed(2)}</strong>
                    </td>
                    <td style="color: ${ts.current_profit_pct >= 0 ? '#4ade80' : '#f87171'};">
                        ${(ts.current_profit_pct * 100).toFixed(2)}%
                    </td>
                    <td style="color: #10b981;">
                        <strong>${(ts.protected_profit_pct * 100).toFixed(2)}%</strong>
                    </td>
                    <td>${ts.adjustment_count}</td>
                    <td><span class="badge ${ts.is_active ? 'badge-success' : 'badge-warning'}">
                        ${ts.is_active ? 'ACTIVE' : 'WAITING'}
                    </span></td>
                </tr>
            `).join('');
        }

        function updateOrderBook(orderBook) {
            if (!orderBook) return;

            const bidsBody = document.querySelector('#bidsTable tbody');
            const asksBody = document.querySelector('#asksTable tbody');

            bidsBody.innerHTML = orderBook.bids.map(level => `
                <tr>
                    <td style="color: #4ade80;">$${level.price.toFixed(2)}</td>
                    <td>${level.size}</td>
                </tr>
            `).join('');

            asksBody.innerHTML = orderBook.asks.map(level => `
                <tr>
                    <td style="color: #f87171;">$${level.price.toFixed(2)}</td>
                    <td>${level.size}</td>
                </tr>
            `).join('');
        }

        let pollingInterval = null;

        function startPolling() {
            if (pollingInterval) return;
            pollingInterval = setInterval(refreshData, 2000);
            refreshData();
        }

        // Initial load
        document.addEventListener('DOMContentLoaded', () => {
            console.log('HFT Dashboard loaded');
        });
    </script>
</body>
</html>
"""


@app.get("/", response_class=HTMLResponse)
async def dashboard():
    """Serve the dashboard"""
    return DASHBOARD_HTML


@app.post("/api/initialize")
async def api_initialize():
    """Initialize the trading system"""
    try:
        if not state.is_running:
            await initialize_system()
        return {"success": True, "message": "System initialized"}
    except Exception as e:
        logger.error(f"Error initializing system: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@app.post("/api/order")
async def api_submit_order(order_data: dict):
    """Submit an order"""
    try:
        if not state.is_running:
            return {"success": False, "error": "System not initialized"}

        # Find instrument
        instrument = next(
            (i for i in state.instruments if i.symbol == order_data["symbol"]),
            None
        )
        if not instrument:
            return {"success": False, "error": "Invalid symbol"}

        # Create order
        order = Order(
            instrument=instrument,
            side=Side.BUY if order_data["side"].upper() == "BUY" else Side.SELL,
            order_type=OrderType.LIMIT,
            quantity=Decimal(str(order_data["quantity"])),
            price=Decimal(str(order_data["price"])),
            venue=state.venue
        )

        # Risk check
        is_valid, violation = state.risk_manager.check_order(
            order,
            Decimal(str(order_data["price"]))
        )

        if not is_valid:
            return {
                "success": False,
                "error": f"Risk check failed: {violation.description}"
            }

        # Submit order
        order_id = await state.execution_engine.submit_order(order)

        # Automatically add trailing stop for position
        if state.trailing_manager:
            position_id = f"pos_{order_id}"
            state.trailing_manager.add_position(
                position_id=position_id,
                instrument=instrument,
                side=order.side,
                entry_price=order.price,
                quantity=order.quantity
            )
            logger.info(f"✅ Auto trailing stop added for {instrument.symbol}")

        state.total_orders += 1
        state.recent_orders.insert(0, {
            "time": datetime.utcnow().isoformat(),
            "symbol": instrument.symbol,
            "side": order.side.value,
            "quantity": float(order.quantity),
            "price": float(order.price),
            "status": "SUBMITTED"
        })
        state.recent_orders = state.recent_orders[:50]

        await broadcast_update("order", state.recent_orders[0])

        return {"success": True, "order_id": order_id}

    except Exception as e:
        logger.error(f"Error submitting order: {e}", exc_info=True)
        return {"success": False, "error": str(e)}


@app.get("/api/status")
async def api_status():
    """Get system status"""
    try:
        order_book_data = None
        if "AAPL" in state.order_books:
            ob = state.order_books["AAPL"]
            order_book_data = {
                "bids": [
                    {"price": float(p), "size": float(ob.bids[p])}
                    for p in ob.bid_prices[:5]
                ],
                "asks": [
                    {"price": float(p), "size": float(ob.asks[p])}
                    for p in ob.ask_prices[:5]
                ]
            }

        # Get trailing stop status
        trailing_status = {}
        if state.trailing_manager:
            trailing_status = state.trailing_manager.get_status()

        return json_response({
            "is_running": state.is_running,
            "total_orders": state.total_orders,
            "total_fills": state.total_fills,
            "daily_pnl": float(state.daily_pnl),
            "open_positions": len(state.positions),
            "recent_orders": state.recent_orders,
            "recent_fills": state.recent_fills,
            "risk_violations": state.risk_violations,
            "order_book": order_book_data,
            "trailing_stops": trailing_status
        })
    except Exception as e:
        logger.error(f"Error getting status: {e}", exc_info=True)
        return {"error": str(e)}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates"""
    await websocket.accept()
    state.websocket_connections.append(websocket)

    try:
        while True:
            # Keep connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        state.websocket_connections.remove(websocket)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "system_running": state.is_running,
        "timestamp": datetime.utcnow().isoformat()
    }


if __name__ == "__main__":
    logger.info("🐂 Starting AEGIS Trading System Dashboard on port 3000")
    uvicorn.run(app, host="0.0.0.0", port=3000, log_level="info")
