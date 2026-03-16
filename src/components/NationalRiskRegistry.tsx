'use client'

import { CyberThreat } from '@/lib/mockData'
import { AlertTriangle, ShieldAlert, Target, Zap } from 'lucide-react'

interface NationalRiskRegistryProps {
    threats: CyberThreat[]
}

export function NationalRiskRegistry({ threats }: NationalRiskRegistryProps) {
    // Filter for CRITICAL threats only and take top 5
    const criticalThreats = threats
        .filter(t => t.severity === 'CRITICAL')
        .slice(0, 5);

    return (
        <div className="bg-black border border-red-900/50 flex flex-col h-full overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.1)]">
            {/* Header */}
            <div className="bg-red-950/20 border-b border-red-900/50 p-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-red-500">
                    <ShieldAlert size={16} className="animate-pulse" />
                    <span className="font-bold tracking-widest text-xs uppercase">National Risk Registry</span>
                </div>
                <div className="flex gap-2 text-[10px] text-red-700 font-mono">
                    <span>CLEARANCE: TS-SCI</span>
                    <span>EYES ONLY</span>
                </div>
            </div>

            {/* List */}
            <div className="p-3 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-red-900/50 flex-1">
                {criticalThreats.length === 0 ? (
                    <div className="text-green-500 text-xs font-mono text-center py-4 opacity-50">
                        NO CRITICAL THREATS DETECTED
                    </div>
                ) : (
                    criticalThreats.map(threat => (
                        <div key={threat.id} className="border-l-2 border-red-600 pl-3 py-1 relative group hover:bg-red-950/10 transition-colors">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-red-400 font-bold text-xs uppercase tracking-wider font-mono">
                                    {threat.name}
                                </span>
                                <span className="text-[9px] bg-red-950 text-red-500 px-1 border border-red-900/50">
                                    {threat.status}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-mono mb-1">
                                <Target size={10} className="text-red-700" />
                                <span className="uppercase text-red-200/70">{threat.targetSystem}</span>
                            </div>

                            <div className="flex justify-between items-end">
                                <span className="text-[9px] text-red-800 font-mono">
                                    VECTOR: {threat.type}
                                </span>
                                <div className="flex items-center gap-1 text-[9px] text-red-400">
                                    <Zap size={8} />
                                    CONFIDENCE: {threat.aiConfidence}%
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="bg-black border-t border-red-900/30 p-1 text-[8px] text-red-900 text-center uppercase tracking-[0.2em] font-mono">
                Unauthorized Access is Treason
            </div>
        </div>
    )
}
