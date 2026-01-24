'use client'

import { AdversarialMetrics } from '@/lib/mockData'
import { Shield, ShieldAlert, ShieldCheck, Activity, RefreshCw, Zap } from 'lucide-react'

interface AdversarialDefensePanelProps {
    metrics: AdversarialMetrics
}

export function AdversarialDefensePanel({ metrics }: AdversarialDefensePanelProps) {
    const blockRate = ((metrics.attacksBlocked / metrics.attacksDetected) * 100).toFixed(1)

    const defenseItems = [
        { key: 'gradientMasking', label: 'Gradient Masking' },
        { key: 'noiseInjection', label: 'Noise Injection' },
        { key: 'adversarialTraining', label: 'Adversarial Training' },
        { key: 'ensembleVoting', label: 'Ensemble Voting' },
        { key: 'certifiedRobustness', label: 'Certified Robustness' },
    ] as const

    return (
        <div className="bg-black border border-red-900/50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-red-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" />
                    Adversarial Defense Layer
                </h3>
                <div className="text-[9px] bg-red-950/30 text-red-400 px-2 py-1 uppercase tracking-wider">
                    Shield for the Shield
                </div>
            </div>

            {/* Attack Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="bg-red-950/20 border border-red-900/30 p-2 text-center">
                    <div className="text-lg font-bold text-red-400">{metrics.attacksDetected}</div>
                    <div className="text-[8px] text-red-600 uppercase">Attacks Detected</div>
                </div>
                <div className="bg-green-950/20 border border-green-900/30 p-2 text-center">
                    <div className="text-lg font-bold text-green-400">{metrics.attacksBlocked}</div>
                    <div className="text-[8px] text-green-600 uppercase">Attacks Blocked</div>
                </div>
                <div className="bg-cyan-950/20 border border-cyan-900/30 p-2 text-center">
                    <div className="text-lg font-bold text-cyan-400">{blockRate}%</div>
                    <div className="text-[8px] text-cyan-600 uppercase">Block Rate</div>
                </div>
            </div>

            {/* Attack Types */}
            <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="flex justify-between items-center text-xs px-2 py-1 bg-black border border-red-900/20">
                    <span className="text-gray-500">Evasion</span>
                    <span className="text-red-400 font-mono">{metrics.evasionAttempts}</span>
                </div>
                <div className="flex justify-between items-center text-xs px-2 py-1 bg-black border border-red-900/20">
                    <span className="text-gray-500">Poisoning</span>
                    <span className="text-orange-400 font-mono">{metrics.poisoningAttempts}</span>
                </div>
                <div className="flex justify-between items-center text-xs px-2 py-1 bg-black border border-red-900/20">
                    <span className="text-gray-500">Extraction</span>
                    <span className="text-yellow-400 font-mono">{metrics.modelExtractionAttempts}</span>
                </div>
            </div>

            {/* Defense Status */}
            <div className="mb-4">
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Defense Mechanisms</div>
                <div className="grid grid-cols-2 gap-1">
                    {defenseItems.map(item => (
                        <div
                            key={item.key}
                            className={`flex items-center gap-2 text-[10px] px-2 py-1 ${metrics.defenseStatus[item.key] === 'ACTIVE'
                                    ? 'bg-green-950/20 text-green-400 border border-green-900/30'
                                    : 'bg-red-950/20 text-red-400 border border-red-900/30'
                                }`}
                        >
                            {metrics.defenseStatus[item.key] === 'ACTIVE' ? (
                                <ShieldCheck className="w-3 h-3" />
                            ) : (
                                <Shield className="w-3 h-3" />
                            )}
                            {item.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Red Team Cycle */}
            <div className="bg-purple-950/10 border border-purple-900/30 p-3">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-purple-400 uppercase tracking-wider flex items-center gap-1">
                        <RefreshCw className="w-3 h-3" />
                        Red Team Cycle
                    </span>
                    <span className="text-[8px] text-gray-600">
                        Last: {metrics.redTeamCycle.lastRun.toLocaleTimeString()}
                    </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div>
                        <div className="text-purple-400 font-bold">{metrics.redTeamCycle.attacksGenerated}</div>
                        <div className="text-gray-600">Attacks Gen</div>
                    </div>
                    <div>
                        <div className="text-yellow-400 font-bold">{metrics.redTeamCycle.failuresAnalyzed}</div>
                        <div className="text-gray-600">Failures</div>
                    </div>
                    <div>
                        <div className="text-green-400 font-bold">{metrics.redTeamCycle.modelsRetrained}</div>
                        <div className="text-gray-600">Retrained</div>
                    </div>
                </div>
            </div>

            {/* Hardening Progress */}
            <div className="mt-3">
                <div className="flex justify-between text-[9px] text-gray-500 mb-1">
                    <span>Model Hardening Progress</span>
                    <span className="text-green-400">{metrics.hardeningProgress}%</span>
                </div>
                <div className="h-1.5 bg-gray-900 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 transition-all"
                        style={{ width: `${metrics.hardeningProgress}%` }}
                    />
                </div>
            </div>
        </div>
    )
}

export default AdversarialDefensePanel
