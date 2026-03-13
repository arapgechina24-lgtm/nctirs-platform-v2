'use client';

import React, { useState, useCallback } from 'react';
import { DesignSystem } from '@/lib/nctirs/designSystem';
import { Brain, Shield, AlertTriangle, ChevronRight, Loader2, Zap, Target, MapPin } from 'lucide-react';

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
    source: 'gemini' | 'fallback';
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

const ConfidenceGauge: React.FC<{ score: number }> = ({ score }) => {
    const percentage = Math.round(score * 100);
    const color = percentage >= 80 ? '#00ff41' : percentage >= 60 ? '#ffff00' : '#ff8c00';

    return (
        <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${percentage}%`, backgroundColor: color }}
                />
            </div>
            <span className="text-xs font-mono" style={{ color }}>{percentage}%</span>
        </div>
    );
};

export function AIAnalysisPanel({ type, data, compact = false }: AIAnalysisPanelProps) {
    const [analysis, setAnalysis] = useState<AIAnalysisResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    const runAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/ai/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, data }),
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `Analysis failed (${response.status})`);
            }

            const result = await response.json();
            setAnalysis(result.analysis);
            setIsExpanded(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Analysis failed');
        } finally {
            setIsLoading(false);
        }
    }, [type, data]);

    // Compact trigger button
    if (!isExpanded && !isLoading) {
        return (
            <button
                onClick={runAnalysis}
                disabled={isLoading}
                className={`flex items-center gap-2 px-3 py-1.5 rounded border transition-all duration-300 font-mono text-xs
                    ${compact
                        ? 'border-purple-800/50 text-purple-400 hover:bg-purple-900/20 hover:border-purple-600'
                        : 'border-purple-700/50 text-purple-300 hover:bg-purple-900/30 hover:border-purple-500 hover:shadow-[0_0_15px_rgba(168,85,247,0.2)]'
                    }`}
                id="ai-analysis-trigger"
            >
                <Brain className="w-3.5 h-3.5" />
                <span>AI ANALYSIS</span>
                {analysis && <span className="text-[10px] opacity-60">↻ RE-RUN</span>}
            </button>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className={`border border-purple-800/50 rounded-md bg-black/90 p-4 ${DesignSystem.layout.cardShadow}`}>
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                    <div>
                        <p className="text-purple-300 text-sm font-mono">SENTINEL ANALYZING...</p>
                        <p className="text-gray-600 text-xs font-mono mt-1">
                            Processing {type} data through Cognition Layer
                        </p>
                    </div>
                </div>
                <div className="mt-3 h-1 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="border border-red-800/50 rounded-md bg-black/90 p-4">
                <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="font-mono text-sm">ANALYSIS ERROR</span>
                </div>
                <p className="text-gray-400 text-xs mt-2 font-mono">{error}</p>
                <button
                    onClick={() => { setError(null); runAnalysis(); }}
                    className="mt-3 text-xs text-purple-400 hover:text-purple-300 font-mono underline"
                >
                    ↻ RETRY ANALYSIS
                </button>
            </div>
        );
    }

    // Full analysis display
    if (!analysis) return null;

    return (
        <div className={`border border-purple-800/40 rounded-md bg-black/95 overflow-hidden ${DesignSystem.layout.cardShadow}`}
            style={{ boxShadow: '0 0 20px rgba(168,85,247,0.08)' }}
        >
            {/* Header */}
            <div className="flex items-center justify-between p-3 border-b border-purple-800/30 bg-purple-950/20">
                <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    <h3 className="text-purple-300 text-xs font-mono font-bold">SENTINEL AI ANALYSIS</h3>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${analysis.source === 'gemini'
                        ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                        : 'bg-gray-800 text-gray-400 border border-gray-700/50'
                        }`}>
                        {analysis.source === 'gemini' ? '🤖 GEMINI 2.0' : '⚙ RULE-BASED'}
                    </span>
                </div>
                <button
                    onClick={() => setIsExpanded(false)}
                    className="text-gray-500 hover:text-gray-300 text-xs font-mono"
                >
                    [MINIMIZE]
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Summary */}
                <div>
                    <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
                </div>

                {/* Risk Assessment */}
                <div className={`border rounded p-3 ${SEVERITY_COLORS[analysis.riskAssessment.level]}`}>
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4" />
                        <span className="font-mono text-xs font-bold">RISK: {analysis.riskAssessment.level}</span>
                    </div>
                    <p className="text-xs opacity-80 mb-2">{analysis.riskAssessment.justification}</p>
                    <div>
                        <span className="text-[10px] font-mono opacity-60 block mb-1">CONFIDENCE</span>
                        <ConfidenceGauge score={analysis.riskAssessment.confidenceScore} />
                    </div>
                </div>

                {/* MITRE ATT&CK */}
                <div className="border border-cyan-800/30 rounded p-3 bg-cyan-950/10">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span className="font-mono text-xs font-bold text-cyan-300">MITRE ATT&CK</span>
                        <code className="text-[10px] bg-cyan-900/30 px-1.5 py-0.5 rounded text-cyan-400 border border-cyan-800/40">
                            {analysis.attackVectorAnalysis.mitreId}
                        </code>
                    </div>
                    <p className="text-xs text-cyan-200 font-medium mb-1">{analysis.attackVectorAnalysis.likelyTechnique}</p>
                    <p className="text-xs text-gray-400">{analysis.attackVectorAnalysis.description}</p>
                </div>

                {/* Recommended Actions */}
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Zap className="w-4 h-4 text-[#00ff41]" />
                        <span className="font-mono text-xs font-bold text-[#00ff41]">RECOMMENDED ACTIONS</span>
                    </div>
                    <div className="space-y-1.5">
                        {analysis.recommendedActions.map((action, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                                <ChevronRight className="w-3 h-3 text-[#00ff41] mt-0.5 flex-shrink-0" />
                                <span className="text-gray-300">{action}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Kenya Context */}
                <div className="border border-amber-800/30 rounded p-3 bg-amber-950/10">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-amber-400" />
                        <span className="font-mono text-xs font-bold text-amber-300">KENYA CONTEXT</span>
                    </div>
                    <p className="text-xs text-gray-300">{analysis.kenyaContext}</p>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                    <span className="text-[10px] text-gray-600 font-mono">
                        {new Date(analysis.timestamp).toLocaleString()}
                    </span>
                    <button
                        onClick={runAnalysis}
                        className="text-[10px] text-purple-500 hover:text-purple-400 font-mono transition-colors"
                    >
                        ↻ RE-ANALYZE
                    </button>
                </div>
            </div>
        </div>
    );
};


