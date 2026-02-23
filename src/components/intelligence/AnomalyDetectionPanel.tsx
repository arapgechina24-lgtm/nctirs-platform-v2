'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    getDetector,
    generateNetworkTelemetry,
    type AnomalyResult,
    type ModelMetrics,
    type NetworkFeatures,
} from '@/lib/anomalyDetection';

// ===== Sub-Components =====

function AnomalyGauge({ score, classification }: { score: number; classification: string }) {
    const radius = 70;
    const circumference = Math.PI * radius; // half circle
    const progress = (score / 100) * circumference;
    const color =
        classification === 'CRITICAL' ? '#ef4444' :
            classification === 'ANOMALOUS' ? '#f97316' :
                classification === 'SUSPICIOUS' ? '#eab308' :
                    '#22c55e';

    return (
        <div className="flex flex-col items-center">
            <svg width="180" height="110" viewBox="0 0 180 110">
                {/* Background arc */}
                <path
                    d="M 10 100 A 70 70 0 0 1 170 100"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="12"
                    strokeLinecap="round"
                />
                {/* Progress arc */}
                <path
                    d="M 10 100 A 70 70 0 0 1 170 100"
                    fill="none"
                    stroke={color}
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${progress} ${circumference}`}
                    style={{
                        transition: 'stroke-dasharray 0.5s ease, stroke 0.5s ease',
                        filter: `drop-shadow(0 0 8px ${color}80)`,
                    }}
                />
                {/* Score text */}
                <text x="90" y="85" textAnchor="middle" fill="white" fontSize="28" fontWeight="bold">
                    {score.toFixed(1)}
                </text>
                <text x="90" y="105" textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize="11">
                    ANOMALY SCORE
                </text>
            </svg>
            <span
                className="text-xs font-bold tracking-wider px-3 py-1 rounded-full mt-1"
                style={{
                    backgroundColor: `${color}20`,
                    color,
                    border: `1px solid ${color}40`,
                }}
            >
                {classification}
            </span>
        </div>
    );
}

function FeatureBar({ name, value, max }: { name: string; value: number; max: number }) {
    const percentage = Math.min(100, (value / max) * 100);
    const barColor =
        percentage > 70 ? '#ef4444' :
            percentage > 40 ? '#f97316' :
                '#22c55e';

    const labels: Record<string, string> = {
        // Flow
        flow_duration: 'Flow Duration',
        total_fwd_packets: 'Fwd Packets',
        total_bwd_packets: 'Bwd Packets',
        total_fwd_bytes: 'Fwd Bytes',
        total_bwd_bytes: 'Bwd Bytes',
        flow_bytes_per_sec: 'Bytes/s',
        flow_packets_per_sec: 'Packets/s',
        flow_iat_mean: 'IAT Mean',
        flow_iat_std: 'IAT Std',
        flow_iat_max: 'IAT Max',
        // Protocol
        protocol_type: 'Protocol',
        dst_port_entropy: 'Dst Port Entropy',
        src_port_entropy: 'Src Port Entropy',
        tcp_flag_syn_ratio: 'SYN Ratio',
        tcp_flag_ack_ratio: 'ACK Ratio',
        tcp_flag_fin_ratio: 'FIN Ratio',
        tcp_flag_rst_ratio: 'RST Ratio',
        tcp_flag_psh_ratio: 'PSH Ratio',
        // Payload
        fwd_payload_mean: 'Fwd Payload',
        payload_entropy: 'Payload Entropy',
        small_packet_ratio: 'Small Pkt Ratio',
        large_packet_ratio: 'Large Pkt Ratio',
        // Connection
        unique_src_ips: 'Unique Src IPs',
        unique_dst_ips: 'Unique Dst IPs',
        src_fanout: 'Src Fan-out',
        dst_fanin: 'Dst Fan-in',
        connection_count: 'Connections',
        // Temporal
        time_of_day: 'Time-of-Day',
        burstiness_index: 'Burstiness',
        periodic_score: 'Periodicity',
        // Behavioral
        failed_connection_ratio: 'Failed Conns',
        dns_query_rate: 'DNS Queries',
        retransmission_rate: 'Retransmits',
    };

    return (
        <div className="flex items-center gap-2 text-xs">
            <span className="w-24 text-gray-400 truncate" title={name}>
                {labels[name] || name.replace(/_/g, ' ')}
            </span>
            <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: barColor,
                        boxShadow: `0 0 6px ${barColor}60`,
                    }}
                />
            </div>
            <span className="w-10 text-right text-gray-500 font-mono">
                {(value * 100).toFixed(0)}%
            </span>
        </div>
    );
}

function TimelineChart({ history }: { history: AnomalyResult[] }) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || history.length < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;
        const padding = { top: 10, right: 10, bottom: 20, left: 30 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, w, h);

        // Draw threshold line
        const thresholdY = padding.top + chartH * (1 - 25 / 100);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, thresholdY);
        ctx.lineTo(w - padding.right, thresholdY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw Y axis labels
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.font = '9px monospace';
        ctx.textAlign = 'right';
        [0, 25, 50, 75, 100].forEach(val => {
            const y = padding.top + chartH * (1 - val / 100);
            ctx.fillText(String(val), padding.left - 4, y + 3);
        });

        // Draw line chart
        const maxPoints = Math.min(history.length, 60);
        const data = history.slice(-maxPoints);
        const stepX = chartW / (maxPoints - 1);

        // Gradient fill
        const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
        gradient.addColorStop(0, 'rgba(34, 211, 238, 0.2)');
        gradient.addColorStop(1, 'rgba(34, 211, 238, 0)');

        // Draw filled area
        ctx.beginPath();
        ctx.moveTo(padding.left, padding.top + chartH);
        data.forEach((point, i) => {
            const x = padding.left + i * stepX;
            const y = padding.top + chartH * (1 - point.score / 100);
            ctx.lineTo(x, y);
        });
        ctx.lineTo(padding.left + (data.length - 1) * stepX, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Draw line
        ctx.beginPath();
        data.forEach((point, i) => {
            const x = padding.left + i * stepX;
            const y = padding.top + chartH * (1 - point.score / 100);

            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Draw anomaly dots
        data.forEach((point, i) => {
            if (point.isAnomaly) {
                const x = padding.left + i * stepX;
                const y = padding.top + chartH * (1 - point.score / 100);
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI * 2);
                ctx.fillStyle = point.classification === 'CRITICAL' ? '#ef4444' : '#f97316';
                ctx.fill();
                ctx.strokeStyle = 'rgba(255,255,255,0.5)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });
    }, [history]);

    return (
        <canvas
            ref={canvasRef}
            className="w-full"
            style={{ height: '120px' }}
        />
    );
}

// ===== Main Component =====

export default function AnomalyDetectionPanel() {
    // Use singleton instance to prevent retraining on navigation
    const [detector] = useState(() => getDetector());
    const [modelReady, setModelReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentResult, setCurrentResult] = useState<AnomalyResult | null>(null);
    const [history, setHistory] = useState<AnomalyResult[]>([]);
    const [alerts, setAlerts] = useState<{ message: string; severity: string; time: string }[]>([]);
    const [metrics, setMetrics] = useState<ModelMetrics | null>(null);
    const [currentFeatures, setCurrentFeatures] = useState<NetworkFeatures | null>(null);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const tickRef = useRef(0);

    // Initialize model
    useEffect(() => {
        let cancelled = false;

        async function init() {
            // If already trained, skip training
            if (detector.getMetrics().isReady) {
                if (!cancelled) {
                    setModelReady(true);
                    setMetrics(detector.getMetrics());
                    setLoading(false);
                }
                return;
            }

            try {
                // Reduced epochs for faster load (30 -> 10)
                await detector.train(10, 200);
                if (!cancelled) {
                    setModelReady(true);
                    setMetrics(detector.getMetrics());
                    setLoading(false);
                }
            } catch (err) {
                console.error('[AnomalyDetector] Training failed:', err);
                if (!cancelled) {
                    setModelReady(false);
                    setLoading(false);
                }
            }
        }

        init();

        return () => {
            cancelled = true;
            // Do NOT dispose the singleton, so it persists across navigations
            // detector.dispose(); 
        };
    }, [detector]);

    // Run detection loop
    const runDetection = useCallback(() => {
        tickRef.current += 1;

        // 10% chance of anomaly injection
        const injectAnomaly = Math.random() < 0.10;
        const features = generateNetworkTelemetry(injectAnomaly);
        setCurrentFeatures(features);

        const result = detector.detect(features);
        setCurrentResult(result);
        setHistory(prev => [...prev.slice(-59), result]);

        // Generate alerts for anomalies
        if (result.isAnomaly) {
            const topFeature = Object.entries(result.featureContributions)
                .sort(([, a], [, b]) => b - a)[0];

            const attackLabel = result.attackType || topFeature[0].replace(/_/g, ' ');

            setAlerts(prev => [
                {
                    message: `${result.classification}: ${attackLabel} detected (score: ${result.score})`,
                    severity: result.classification,
                    time: new Date().toLocaleTimeString(),
                },
                ...prev.slice(0, 9),
            ]);
        }
    }, [detector]);

    useEffect(() => {
        if (!modelReady) return;

        // Run every 2 seconds
        intervalRef.current = setInterval(runDetection, 2000);
        // Run immediately (on next tick to avoid set-state-in-effect warning)
        setTimeout(runDetection, 0);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [modelReady, runDetection]);

    const alertColor = (severity: string) =>
        severity === 'CRITICAL' ? '#ef4444' :
            severity === 'ANOMALOUS' ? '#f97316' :
                '#eab308';

    return (
        <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${modelReady ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'}`} />
                    <h3 className="text-sm font-semibold text-white tracking-wide">
                        ANOMALY DETECTION ENGINE
                    </h3>
                    <span className="text-[10px] text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full font-mono">
                        {metrics?.modelVersion || 'v2.0'} • LSTM-AE
                    </span>
                    {metrics?.f1Score && (
                        <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-mono">
                            F1={metrics.f1Score}
                        </span>
                    )}
                </div>
                {metrics && (
                    <span className="text-[10px] text-gray-500 font-mono">
                        {(metrics.trainingSamples || 0).toLocaleString()} samples • {metrics.totalParameters?.toLocaleString() || '254K'} params
                    </span>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400">Loading SENTINEL-OMEGA model...</p>
                </div>
            ) : (
                <div className="p-4 space-y-4">
                    {/* Top row: Gauge + Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* Gauge */}
                        <div className="flex justify-center">
                            {currentResult && (
                                <AnomalyGauge
                                    score={currentResult.score}
                                    classification={currentResult.classification}
                                />
                            )}
                        </div>

                        {/* Live Stats */}
                        <div className="space-y-2">
                            <h4 className="text-[10px] text-gray-500 uppercase tracking-wider">Live Telemetry (46 features)</h4>
                            {currentFeatures && (
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                    <div>
                                        <span className="text-gray-500">Packets/s</span>
                                        <span className="float-right text-white font-mono">
                                            {currentFeatures.flow_packets_per_sec.toFixed(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Bytes/s</span>
                                        <span className="float-right text-white font-mono">
                                            {(currentFeatures.flow_bytes_per_sec / 1000).toFixed(1)}K
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Unique Dst</span>
                                        <span className="float-right text-white font-mono">
                                            {currentFeatures.unique_dst_ips}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Payload Ent</span>
                                        <span className="float-right text-white font-mono">
                                            {currentFeatures.payload_entropy.toFixed(2)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">DNS Rate</span>
                                        <span className="float-right text-white font-mono">
                                            {currentFeatures.dns_query_rate.toFixed(1)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Confidence</span>
                                        <span className="float-right text-white font-mono">
                                            {currentResult ? (currentResult.confidence * 100).toFixed(0) : 0}%
                                        </span>
                                    </div>
                                    {currentResult?.attackType && (
                                        <div className="col-span-2 mt-1">
                                            <span className="text-red-400 text-[10px] bg-red-400/10 px-2 py-0.5 rounded-full">
                                                ⚠ {currentResult.attackType}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feature Contributions */}
                    {currentResult && (
                        <div>
                            <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                Top Feature Contributions (of 46)
                            </h4>
                            <div className="space-y-1.5">
                                {Object.entries(currentResult.featureContributions)
                                    .sort(([, a], [, b]) => b - a)
                                    .slice(0, 8)
                                    .map(([name, value]) => (
                                        <FeatureBar
                                            key={name}
                                            name={name}
                                            value={value}
                                            max={0.3}
                                        />
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Timeline */}
                    <div>
                        <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">
                            Anomaly Timeline
                        </h4>
                        <div className="bg-white/5 rounded-lg p-2">
                            <TimelineChart history={history} />
                        </div>
                    </div>

                    {/* Alerts */}
                    {alerts.length > 0 && (
                        <div>
                            <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                Recent Alerts ({alerts.length})
                            </h4>
                            <div className="space-y-1 max-h-24 overflow-y-auto">
                                {alerts.slice(0, 5).map((alert, i) => (
                                    <div
                                        key={i}
                                        className="flex items-center gap-2 text-[11px] px-2 py-1 rounded"
                                        style={{ backgroundColor: `${alertColor(alert.severity)}10` }}
                                    >
                                        <div
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: alertColor(alert.severity) }}
                                        />
                                        <span className="text-gray-300 truncate flex-1">
                                            {alert.message}
                                        </span>
                                        <span className="text-gray-500 flex-shrink-0">
                                            {alert.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
