'use client'

import { useState } from 'react'
import { XAIExplanation } from '@/lib/mockData'
import { Brain, ChevronDown, ChevronUp, Check, X, AlertTriangle, User } from 'lucide-react'

interface ExplainableAIPanelProps {
    explanations: XAIExplanation[]
}

export function ExplainableAIPanel({ explanations }: ExplainableAIPanelProps) {
    const [expanded, setExpanded] = useState<string | null>(explanations[0]?.id || null)
    const [overrides, setOverrides] = useState<Record<string, string>>({})

    const handleOverride = (id: string, level: string) => {
        setOverrides(prev => ({ ...prev, [id]: level }))
    }

    return (
        <div className="bg-black border border-purple-900/50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-purple-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Explainable AI (XAI)
                </h3>
                <div className="text-[9px] bg-purple-950/30 text-purple-400 px-2 py-1 uppercase tracking-wider">
                    Human-in-the-Loop
                </div>
            </div>

            {/* Explanations List */}
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {explanations.map(exp => (
                    <div
                        key={exp.id}
                        className={`border ${exp.analystApproved
                                ? 'border-green-900/30 bg-green-950/5'
                                : 'border-purple-900/30 bg-purple-950/5'
                            }`}
                    >
                        {/* Header Row */}
                        <button
                            onClick={() => setExpanded(expanded === exp.id ? null : exp.id)}
                            className="w-full flex items-center justify-between p-2 text-left"
                        >
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${exp.threatType === 'APT' ? 'bg-red-500' :
                                        exp.threatType === 'Ransomware' ? 'bg-orange-500' :
                                            'bg-yellow-500'
                                    }`} />
                                <span className="text-[10px] text-gray-300 font-medium">{exp.action}</span>
                                <span className="text-[9px] text-gray-500">({exp.threatType})</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-purple-400 font-mono">{exp.confidence}%</span>
                                {expanded === exp.id ? (
                                    <ChevronUp className="w-3 h-3 text-gray-500" />
                                ) : (
                                    <ChevronDown className="w-3 h-3 text-gray-500" />
                                )}
                            </div>
                        </button>

                        {/* Expanded Content */}
                        {expanded === exp.id && (
                            <div className="px-2 pb-3 space-y-3">
                                {/* SHAP Factors */}
                                <div>
                                    <div className="text-[8px] text-gray-600 uppercase tracking-wider mb-1">Contributing Factors (SHAP)</div>
                                    <div className="space-y-1">
                                        {exp.factors.map((factor, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                                <div className="flex-1">
                                                    <div className="h-2 bg-gray-900 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                                                            style={{ width: `${factor.weight * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <span className="text-[9px] text-gray-400 w-24 truncate">{factor.name}</span>
                                                <span className="text-[9px] text-purple-400 font-mono w-10">
                                                    +{(factor.weight * 100).toFixed(0)}%
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Natural Language Explanation */}
                                <div className="bg-black/50 border border-purple-900/20 p-2">
                                    <div className="text-[8px] text-gray-600 uppercase tracking-wider mb-1">Natural Language</div>
                                    <p className="text-[10px] text-gray-300 leading-relaxed">
                                        &quot;{exp.naturalLanguage}&quot;
                                    </p>
                                </div>

                                {/* Override Controls */}
                                <div className="flex items-center justify-between pt-2 border-t border-purple-900/20">
                                    <div className="flex items-center gap-1">
                                        <span className="text-[8px] text-gray-600 uppercase">Override:</span>
                                        {['L1', 'L2', 'L3', 'L4'].map(level => (
                                            <button
                                                key={level}
                                                onClick={() => handleOverride(exp.id, level)}
                                                className={`px-2 py-0.5 text-[8px] border ${overrides[exp.id] === level || exp.overrideLevel === level
                                                        ? 'bg-orange-900/30 border-orange-500 text-orange-400'
                                                        : 'border-gray-800 text-gray-500 hover:border-gray-600'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {exp.analystApproved ? (
                                            <span className="flex items-center gap-1 text-[9px] text-green-400">
                                                <Check className="w-3 h-3" />
                                                Approved
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1 text-[9px] text-yellow-400">
                                                <AlertTriangle className="w-3 h-3" />
                                                Pending Review
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Override Legend */}
            <div className="mt-3 pt-2 border-t border-purple-900/30">
                <div className="flex justify-between text-[8px] text-gray-600">
                    <span>L1: Analyst Pause</span>
                    <span>L2: Supervisor Reverse</span>
                    <span>L3: Director Override</span>
                    <span>L4: DG Emergency</span>
                </div>
            </div>
        </div>
    )
}

export default ExplainableAIPanel
