'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    getDetector,
    generateNetworkTelemetry,
    type AnomalyResult,
    type ModelMetrics,
    type NetworkFeatures,
} from '@/lib/anomalyDetection';

// ... (Sub-Components remain unchanged)

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

            const featureLabels: Record<string, string> = {
                packetRate: 'packet rate spike',
                byteVolume: 'unusual byte volume',
                uniqueDestinations: 'destination count anomaly',
                protocolEntropy: 'protocol distribution anomaly',
                timeOfDayFactor: 'off-hours activity',
                connectionDuration: 'connection duration anomaly',
            };

            setAlerts(prev => [
                {
                    message: `${result.classification}: ${featureLabels[topFeature[0]] || topFeature[0]} detected (score: ${result.score})`,
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
                        TF.js
                    </span>
                </div>
                {metrics && (
                    <span className="text-[10px] text-gray-500 font-mono">
                        {metrics.trainingSamples} samples • {metrics.trainingEpochs} epochs
                    </span>
                )}
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    <p className="text-xs text-gray-400">Training autoencoder model...</p>
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
                            <h4 className="text-[10px] text-gray-500 uppercase tracking-wider">Live Telemetry</h4>
                            {currentFeatures && (
                                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                                    <div>
                                        <span className="text-gray-500">Packets/s</span>
                                        <span className="float-right text-white font-mono">
                                            {currentFeatures.packetRate.toFixed(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Bytes/s</span>
                                        <span className="float-right text-white font-mono">
                                            {(currentFeatures.byteVolume / 1000).toFixed(1)}K
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Unique Dst</span>
                                        <span className="float-right text-white font-mono">
                                            {currentFeatures.uniqueDestinations}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Entropy</span>
                                        <span className="float-right text-white font-mono">
                                            {currentFeatures.protocolEntropy.toFixed(2)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Conn Dur</span>
                                        <span className="float-right text-white font-mono">
                                            {currentFeatures.connectionDuration.toFixed(1)}s
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Confidence</span>
                                        <span className="float-right text-white font-mono">
                                            {currentResult ? (currentResult.confidence * 100).toFixed(0) : 0}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Feature Contributions */}
                    {currentResult && (
                        <div>
                            <h4 className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">
                                Feature Contributions
                            </h4>
                            <div className="space-y-1.5">
                                {Object.entries(currentResult.featureContributions)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([name, value]) => (
                                        <FeatureBar
                                            key={name}
                                            name={name}
                                            value={value}
                                            max={0.5}
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
