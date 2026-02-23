'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Brain, Shield, AlertTriangle, Zap, Target, MapPin, Scan, ShieldAlert, FileWarning } from 'lucide-react';

// Types matching the API response
interface AIAnalysisResult {
    summary: string;
    riskAssessment: {
        level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
        justification: string;
        confidenceScore: number;
    };
    attackVectorAnalysis: {
        likelyTechnique: string;
        mitreId: string;
        description: string;
    };
    recommendedActions: string[];
    kenyaContext: string;
    timestamp: string;
    source: 'gemini' | 'anthropic' | 'fallback';
}

interface AIAnalysisPanelProps {
    type: 'threat' | 'incident';
    data: Record<string, unknown>;
    compact?: boolean;
}

const SEVERITY_COLORS: Record<string, string> = {
    CRITICAL: 'text-red-500 border-red-500/50 bg-red-500/10',
    HIGH: 'text-orange-400 border-orange-400/50 bg-orange-400/10',
    MEDIUM: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10',
    LOW: 'text-green-400 border-green-400/50 bg-green-400/10',
};

const SEVERITY_GLOW: Record<string, string> = {
    CRITICAL: '0 0 20px rgba(239,68,68,0.3)',
    HIGH: '0 0 20px rgba(251,146,60,0.2)',
    MEDIUM: '0 0 15px rgba(250,204,21,0.15)',
    LOW: '0 0 10px rgba(74,222,128,0.1)',
};

const SOURCE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
    gemini: { label: 'GEMINI 2.0 FLASH', icon: '🤖', color: 'bg-purple-900/50 text-purple-300 border-purple-700/50' },
    anthropic: { label: 'CLAUDE OPUS', icon: '🧠', color: 'bg-indigo-900/50 text-indigo-300 border-indigo-700/50' },
    fallback: { label: 'RULE ENGINE', icon: '⚙', color: 'bg-gray-800 text-gray-400 border-gray-700/50' },
};

// CSS for all animations
const ANIMATION_CSS = `
@keyframes revealUp {
    from { opacity: 0; transform: translateY(12px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes scanLine {
    0% { top: 0%; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { top: 100%; opacity: 0; }
}
@keyframes progressFill1 {
    0% { width: 0%; }
    60% { width: 95%; }
    100% { width: 100%; }
}
@keyframes progressFill2 {
    0% { width: 0%; }
    30% { width: 10%; }
    70% { width: 90%; }
    100% { width: 100%; }
}
@keyframes progressFill3 {
    0% { width: 0%; }
    50% { width: 20%; }
    80% { width: 85%; }
    100% { width: 100%; }
}
.ai-reveal-1 { animation: revealUp 0.7s ease-out 0.1s both; }
.ai-reveal-2 { animation: revealUp 0.7s ease-out 0.4s both; }
.ai-reveal-3 { animation: revealUp 0.7s ease-out 0.7s both; }
.ai-reveal-4 { animation: revealUp 0.7s ease-out 1.0s both; }
.ai-reveal-5 { animation: revealUp 0.7s ease-out 1.3s both; }
.ai-reveal-6 { animation: revealUp 0.7s ease-out 1.5s both; }
.ai-reveal-7 { animation: revealUp 0.7s ease-out 1.7s both; }
.ai-scan-line { animation: scanLine 2s ease-in-out infinite; }
.ai-progress-1 { animation: progressFill1 3s ease-out forwards; }
.ai-progress-2 { animation: progressFill2 3s ease-out 0.3s forwards; width: 0; }
.ai-progress-3 { animation: progressFill3 3s ease-out 0.6s forwards; width: 0; }
`;

// ---- Animated Confidence Gauge ----
function ConfidenceGauge({ score, animated = true }: { score: number; animated?: boolean }) {
    const [displayScore, setDisplayScore] = useState(animated ? 0 : score);
    const percentage = Math.round(displayScore * 100);
    const color = percentage >= 80 ? '#00ff41' : percentage >= 60 ? '#ffff00' : '#ff8c00';

    useEffect(() => {
        if (!animated) return;
        const target = score;
        const duration = 1200;
        const start = performance.now();

        const animate = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplayScore(target * eased);
            if (progress < 1) requestAnimationFrame(animate);
        };
        requestAnimationFrame(animate);
    }, [score, animated]);

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2.5 bg-gray-800 rounded-full overflow-hidden border border-gray-700/50">
                <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 8px ${color}`,
                    }}
                />
            </div>
            <span className="text-xs font-mono font-bold min-w-[3ch]" style={{ color }}>{percentage}%</span>
        </div>
    );
}

// ---- Typewriter Text ----
function TypewriterText({ text, speed = 12, className = '' }: { text: string; speed?: number; className?: string }) {
    const [displayText, setDisplayText] = useState('');
    const [isDone, setIsDone] = useState(false);

    useEffect(() => {
        setDisplayText('');
        setIsDone(false);
        let i = 0;
        const interval = setInterval(() => {
            i++;
            setDisplayText(text.slice(0, i));
            if (i >= text.length) {
                clearInterval(interval);
                setIsDone(true);
            }
        }, speed);
        return () => clearInterval(interval);
    }, [text, speed]);

    return (
        <span className={className}>
            {displayText}
            {!isDone && <span className="inline-block w-[2px] h-[1em] bg-green-400 ml-0.5 animate-pulse align-text-bottom" />}
        </span>
    );
}

// ---- Scanning Lines Animation ----
function ScanningAnimation({ phase }: { phase: string }) {
    return (
        <div className="border border-purple-800/50 rounded-lg bg-black/95 p-5 overflow-hidden relative"
            style={{ boxShadow: '0 0 30px rgba(168,85,247,0.12)' }}
        >
            {/* Scanning line */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent absolute ai-scan-line" />
            </div>

            <div className="flex items-center gap-4">
                <div className="relative">
                    <Scan className="w-8 h-8 text-purple-400 animate-pulse" />
                    <div className="absolute inset-0 w-8 h-8 border-2 border-purple-500/30 rounded-full animate-ping" />
                </div>
                <div className="flex-1">
                    <p className="text-purple-300 text-sm font-mono font-bold">SENTINEL AI ACTIVE</p>
                    <p className="text-gray-500 text-xs font-mono mt-1">
                        <TypewriterText text={phase} speed={20} />
                    </p>
                </div>
            </div>

            {/* Progress bars */}
            <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 font-mono w-24">THREAT MODEL</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-purple-600 to-cyan-400 rounded-full ai-progress-1" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 font-mono w-24">MITRE MAPPING</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-600 to-green-400 rounded-full ai-progress-2" />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-600 font-mono w-24">KE CONTEXT</span>
                    <div className="flex-1 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-green-600 to-amber-400 rounded-full ai-progress-3" />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ===== Main Component =====
export function AIAnalysisPanel({ type, data, compact = false }: AIAnalysisPanelProps) {
    const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState('Initializing threat model...');
    const resultRef = useRef<HTMLDivElement>(null);

    // Inject animation CSS
    useEffect(() => {
        const id = 'ai-analysis-animations';
        if (!document.getElementById(id)) {
            const style = document.createElement('style');
            style.id = id;
            style.textContent = ANIMATION_CSS;
            document.head.appendChild(style);
        }
    }, []);

    const runAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        setLoadingPhase('Initializing threat model...');

        const phases = [
            'Correlating indicators of compromise...',
            'Mapping to MITRE ATT&CK framework...',
            'Applying Kenya threat intelligence context...',
            'Generating risk assessment and recommendations...',
        ];
        let phaseIdx = 0;
        const phaseInterval = setInterval(() => {
            phaseIdx = (phaseIdx + 1) % phases.length;
            setLoadingPhase(phases[phaseIdx]);
        }, 1500);

        try {
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data }),
            });

            clearInterval(phaseInterval);

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Analysis failed (${response.status})`);
            }

            const result = await response.json();
            setAnalysis(result.analysis);
            setIsExpanded(true);

            setTimeout(() => {
                resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 200);
        } catch (err) {
            clearInterval(phaseInterval);
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsLoading(false);
        }
    }, [type, data]);

    // ---- Trigger Button (Collapsed State) ----
    if (!isExpanded && !isLoading && !error) {
        return (
            <button
                onClick={runAnalysis}
                className={`group relative flex items-center gap-2.5 w-full justify-center px-4 py-2.5 rounded-md border transition-all duration-300 font-mono text-xs overflow-hidden
                    border-purple-700/60 text-purple-300
                    hover:border-purple-500 hover:text-purple-200
                    hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]
                    active:scale-[0.98]
                    ${!compact ? 'bg-purple-950/30 hover:bg-purple-900/40' : 'bg-black/30 hover:bg-purple-950/20'}
                `}
                id="ai-analysis-trigger"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/0 via-purple-600/5 to-purple-600/0 group-hover:via-purple-600/15 transition-all duration-500" />
                <Brain className="w-4 h-4 relative z-10 group-hover:animate-pulse" />
                <span className="relative z-10 font-bold tracking-wider">
                    {analysis ? '↻ RE-ANALYZE THREAT' : '⚡ ANALYZE THREAT'}
                </span>
                <ShieldAlert className="w-3.5 h-3.5 relative z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
            </button>
        );
    }

    // ---- Loading State ----
    if (isLoading) {
        return <ScanningAnimation phase={loadingPhase} />;
    }

    // ---- Error State ----
    if (error) {
        return (
            <div className="border border-red-800/50 rounded-lg bg-black/90 p-4">
                <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-mono text-sm font-bold">ANALYSIS ERROR</span>
                </div>
                <p className="text-gray-400 text-xs mt-2 font-mono">{error}</p>
                <div className="flex gap-3 mt-3">
                    <button
                        onClick={() => { setError(null); runAnalysis(); }}
                        className="text-xs text-purple-400 hover:text-purple-300 font-mono font-bold border border-purple-800/50 px-3 py-1.5 rounded hover:bg-purple-950/20 transition-all"
                    >
                        ↻ RETRY ANALYSIS
                    </button>
                    <button
                        onClick={() => { setError(null); }}
                        className="text-xs text-gray-500 hover:text-gray-400 font-mono"
                    >
                        DISMISS
                    </button>
                </div>
            </div>
        );
    }

    // ---- Full Analysis Display ----
    if (!analysis) return null;

    const sourceInfo = SOURCE_LABELS[analysis.source] || SOURCE_LABELS.fallback;
    const severityGlow = SEVERITY_GLOW[analysis.riskAssessment.level] || SEVERITY_GLOW.LOW;

    return (
        <div
            ref={resultRef}
            className="border border-purple-800/40 rounded-lg bg-black/95 overflow-hidden"
            style={{ boxShadow: `0 0 25px rgba(168,85,247,0.1), ${severityGlow}` }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-purple-800/30 bg-gradient-to-r from-purple-950/30 via-purple-950/20 to-black">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <h3 className="text-purple-300 text-xs font-mono font-bold tracking-wider">SENTINEL AI ANALYSIS</h3>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono border ${sourceInfo.color}`}>
                        {sourceInfo.icon} {sourceInfo.label}
                    </span>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-500 hover:text-gray-300 text-[10px] font-mono border border-gray-800 px-2 py-0.5 rounded hover:border-gray-600 transition-colors"
                >
                    MINIMIZE
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Summary */}
                <div className="ai-reveal-1">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        <TypewriterText text={analysis.summary} speed={8} />
                    </p>
                </div>

                {/* Risk Assessment */}
                <div className="ai-reveal-2">
                    <div
                        className={`border rounded-lg p-3.5 ${SEVERITY_COLORS[analysis.riskAssessment.level]}`}
                        style={{ boxShadow: severityGlow }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <Shield className="w-4 h-4" />
                            <span className="font-mono text-xs font-bold tracking-wider">
                                RISK LEVEL: {analysis.riskAssessment.level}
                            </span>
                        </div>
                        <p className="text-xs opacity-80 mb-3">{analysis.riskAssessment.justification}</p>
                        <div>
                            <span className="text-[10px] font-mono opacity-60 block mb-1.5">AI CONFIDENCE</span>
                            <ConfidenceGauge score={analysis.riskAssessment.confidenceScore} />
                        </div>
                    </div>
                </div>

                {/* MITRE ATT&CK */}
                <div className="ai-reveal-3">
                    <div className="border border-cyan-800/30 rounded-lg p-3.5 bg-cyan-950/10">
                        <div className="flex items-center gap-2 mb-2">
                            <Target className="w-4 h-4 text-cyan-400" />
                            <span className="font-mono text-xs font-bold text-cyan-300 tracking-wider">MITRE ATT&CK</span>
                            <code className="text-[10px] bg-cyan-900/40 px-2 py-0.5 rounded-full text-cyan-400 border border-cyan-800/40 font-bold">
                                {analysis.attackVectorAnalysis.mitreId}
                            </code>
                        </div>
                        <p className="text-xs text-cyan-200 font-medium mb-1">{analysis.attackVectorAnalysis.likelyTechnique}</p>
                        <p className="text-xs text-gray-400">{analysis.attackVectorAnalysis.description}</p>
                    </div>
                </div>

                {/* Recommended Actions */}
                <div className="ai-reveal-4">
                    <div className="flex items-center gap-2 mb-2.5">
                        <Zap className="w-4 h-4 text-[#00ff41]" />
                        <span className="font-mono text-xs font-bold text-[#00ff41] tracking-wider">RECOMMENDED ACTIONS</span>
                    </div>
                    <div className="space-y-2">
                        {analysis.recommendedActions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs group">
                                <div className="flex items-center justify-center w-5 h-5 rounded bg-green-950/30 border border-green-900/40 text-green-500 text-[10px] font-mono font-bold flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                </div>
                                <span className="text-gray-300 group-hover:text-gray-200 transition-colors">{action}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kenya Context */}
                <div className="ai-reveal-5">
                    <div className="border border-amber-800/30 rounded-lg p-3.5 bg-amber-950/10">
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-amber-400" />
                            <span className="font-mono text-xs font-bold text-amber-300 tracking-wider">KENYA CONTEXT</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{analysis.kenyaContext}</p>
                    </div>
                </div>

                {/* DPA 2019 Compliance Warning */}
                {Boolean(data.dataProtectionImpact) && data.dataProtectionImpact !== 'NONE' && (
                    <div className="ai-reveal-6">
                        <div className="border border-rose-800/30 rounded-lg p-3.5 bg-rose-950/10">
                            <div className="flex items-center gap-2 mb-2">
                                <FileWarning className="w-4 h-4 text-rose-400" />
                                <span className="font-mono text-xs font-bold text-rose-300 tracking-wider">DPA 2019 COMPLIANCE</span>
                            </div>
                            <p className="text-xs text-gray-300">
                                <span className="text-rose-400 font-bold">Data Protection Impact:</span>{' '}
                                {String(data.dataProtectionImpact).replace(/_/g, ' ')}
                            </p>
                            {Boolean(data.dpaViolation) ? (
                                <p className="text-xs text-rose-300/80 mt-1 border-t border-rose-900/30 pt-1.5">
                                    ⚠ {String(data.dpaViolation)}
                                </p>
                            ) : null}
                        </div>
                    </div>
                )}

                {/* Footer */}
                <div className="ai-reveal-7">
                    <div className="flex items-center justify-between pt-3 border-t border-gray-800/50">
                        <span className="text-[10px] text-gray-600 font-mono">
                            {new Date(analysis.timestamp).toLocaleString()} · Analysis ID: {Math.random().toString(36).slice(2, 8).toUpperCase()}
                        </span>
                        <button
                            onClick={runAnalysis}
                            className="text-[10px] text-purple-500 hover:text-purple-400 font-mono font-bold transition-colors border border-purple-800/40 px-2 py-0.5 rounded hover:bg-purple-950/20"
                        >
                            ↻ RE-ANALYZE
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
