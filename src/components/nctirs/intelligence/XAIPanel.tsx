'use client';

import React from 'react';
import {
    HelpCircle,
    Search,
    CheckCircle2,
    AlertOctagon,
    TrendingUp,
    ZoomIn
} from 'lucide-react';
import { DesignSystem } from '@/lib/nctirs/designSystem';
import { generateXAIExplanations } from '@/lib/nctirs/mockData';

export function XAIPanel() {
    // Generate some mock explanations on mount
    const explanations = React.useMemo(() => generateXAIExplanations(1), []);
    const currentExplanation = explanations[0];

    if (!currentExplanation) return null;

    return (
        <div className={`h-full flex flex-col ${DesignSystem.layout.cardShadow} bg-black/40 border border-purple-900/50`}>
            {/* Header */}
            <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Search className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-gray-100 tracking-wide font-mono">
                        XAI EXPLAINABILITY
                    </h2>
                </div>
                <div className="text-[10px] text-purple-400 font-mono bg-purple-900/20 px-2 py-1 rounded border border-purple-700/30">
                    SHAP VALUES
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Top Insight */}
                <div className="bg-purple-950/10 border border-purple-900/30 p-4 rounded-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-2 opacity-10">
                        <HelpCircle className="w-24 h-24 text-purple-500" />
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xs text-purple-300 font-bold uppercase mb-2 flex items-center gap-2">
                            <ZoomIn className="w-3 h-3" />
                            Model Reasoning
                        </h3>
                        <p className="text-sm text-gray-200 leading-relaxed font-mono border-l-2 border-purple-500 pl-3">
                            &quot;{currentExplanation.naturalLanguage}&quot;
                        </p>
                    </div>
                </div>

                {/* Factor Contribution Chart (Bar Chart Visual) */}
                <div>
                    <h3 className="text-xs text-gray-400 font-bold uppercase mb-3 flex items-center gap-2">
                        <TrendingUp className="w-3 h-3" />
                        Top Contributing Factors
                    </h3>
                    <div className="space-y-3">
                        {currentExplanation.factors.map((factor, idx) => (
                            <div key={idx} className="group">
                                <div className="flex justify-between text-[11px] mb-1 font-mono">
                                    <span className="text-gray-300 group-hover:text-purple-300 transition-colors">
                                        {factor.name}
                                    </span>
                                    <span className="text-purple-400 font-bold">
                                        {(factor.weight * 100).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-900 to-purple-500 relative"
                                        style={{ width: `${factor.weight * 100}%` }}
                                    >
                                        <div className="absolute inset-0 bg-white/20 group-hover:bg-white/30 transition-colors" />
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 mt-0.5 italic">
                                    {factor.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Model Confidence & Action */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-black/40 border border-gray-800 rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Decision Confidence</div>
                        <div className="text-2xl font-bold text-white font-mono flex items-baseline gap-1">
                            {currentExplanation.confidence}%
                            <span className="text-[10px] text-green-500 font-normal">v2.1 Model</span>
                        </div>
                    </div>
                    <div className="p-3 bg-black/40 border border-gray-800 rounded">
                        <div className="text-[10px] text-gray-500 uppercase mb-1">Recommended Action</div>
                        <div className="text-sm font-bold text-red-400 font-mono flex items-center gap-2">
                            <AlertOctagon className="w-4 h-4" />
                            {currentExplanation.action}
                        </div>
                    </div>
                </div>

                {/* Analyst Verification Status */}
                <div className={`p-3 rounded border flex items-center gap-3
                    ${currentExplanation.analystApproved
                        ? 'bg-green-950/20 border-green-900/50'
                        : 'bg-yellow-950/20 border-yellow-900/50'}`}>

                    {currentExplanation.analystApproved
                        ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                        : <HelpCircle className="w-5 h-5 text-yellow-500" />
                    }

                    <div>
                        <div className={`text-xs font-bold ${currentExplanation.analystApproved ? 'text-green-400' : 'text-yellow-400'}`}>
                            {currentExplanation.analystApproved ? 'Human Verified' : 'Pending Review'}
                        </div>
                        <div className="text-[10px] text-gray-500">
                            {currentExplanation.analystApproved
                                ? 'Confirmed by Level 3 Analyst'
                                : 'Flagged for manual verification'}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
