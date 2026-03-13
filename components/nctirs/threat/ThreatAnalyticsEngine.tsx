'use client'

import { useState, useEffect } from "react"
import { Brain, Cpu, Target, TrendingUp, AlertTriangle, Zap } from "lucide-react"
import { CyberThreat, CoordinatedAttack } from "@/lib/nctirs/mockData"
import { AIAnalysisPanel } from "@/components/nctirs/intelligence/AIAnalysisPanel"

interface ThreatAnalyticsEngineProps {
    cyberThreats: CyberThreat[];
    coordinatedAttacks: CoordinatedAttack[];
}

const severityColors = {
    CRITICAL: 'text-red-400 bg-red-950/50 border-red-700/50',
    HIGH: 'text-orange-400 bg-orange-950/50 border-orange-700/50',
    MEDIUM: 'text-yellow-400 bg-yellow-950/50 border-yellow-700/50',
    LOW: 'text-green-400 bg-green-950/50 border-green-700/50',
}

export function ThreatAnalyticsEngine({ cyberThreats, coordinatedAttacks }: ThreatAnalyticsEngineProps) {
    const [processingCount, setProcessingCount] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setProcessingCount(prev => prev + Math.floor(Math.random() * 50) + 10);
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const criticalThreats = cyberThreats.filter(t => t.severity === 'CRITICAL');
    const activeCoordinated = coordinatedAttacks.filter(a => a.status !== 'RESOLVED');

    return (
        <div className="bg-black border border-green-900/50 rounded-none p-4 card-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-purple-600 blur-lg opacity-30 animate-pulse" />
                        <div className="relative p-2 bg-purple-950/50 border border-purple-700/50">
                            <Brain className="h-5 w-5 text-purple-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-green-400 tracking-wider">AI THREAT ANALYTICS ENGINE</h2>
                        <p className="text-[10px] text-green-800 font-mono">ATAE v3.2 • DEEP LEARNING ACTIVE</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-950/30 border border-green-800/50">
                    <Cpu className="h-4 w-4 text-green-500 animate-pulse" />
                    <span className="text-[10px] font-mono text-green-400">PROCESSING: {processingCount.toLocaleString()}/hr</span>
                </div>
            </div>

            {/* Coordinated Attack Alerts */}
            {activeCoordinated.length > 0 && (
                <div className="mb-4 p-3 bg-red-950/30 border border-red-700/50 animate-pulse">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <span className="text-xs font-bold text-red-400">COORDINATED ATTACK DETECTED</span>
                    </div>
                    {activeCoordinated.slice(0, 2).map(attack => (
                        <div key={attack.id} className="mb-2 last:mb-0">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-red-300 font-mono">{attack.targetFacility}</span>
                                <span className="text-yellow-400">{attack.correlationScore}% correlation</span>
                            </div>
                            <div className="text-[9px] text-red-400/70 font-mono">{attack.attackVector}</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Threat Classification Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/50 border border-green-900/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-cyan-400" />
                        <span className="text-[10px] font-bold text-green-400">THREAT CLASSIFICATION</span>
                    </div>
                    <div className="space-y-1">
                        {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(level => {
                            const count = cyberThreats.filter(t => t.severity === level).length;
                            return (
                                <div key={level} className="flex items-center justify-between text-[9px]">
                                    <span className={severityColors[level as keyof typeof severityColors].split(' ')[0]}>{level}</span>
                                    <div className="flex items-center gap-2">
                                        <div className="w-20 h-1.5 bg-green-950 overflow-hidden">
                                            <div
                                                className={`h-full ${level === 'CRITICAL' ? 'bg-red-500' : level === 'HIGH' ? 'bg-orange-500' : level === 'MEDIUM' ? 'bg-yellow-500' : 'bg-green-500'}`}
                                                style={{ width: `${(count / cyberThreats.length) * 100}%` }}
                                            />
                                        </div>
                                        <span className="font-mono text-green-400 w-6">{count}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-black/50 border border-green-900/30 p-3">
                    <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-orange-400" />
                        <span className="text-[10px] font-bold text-green-400">ATTACK VECTORS</span>
                    </div>
                    <div className="space-y-1">
                        {['APT', 'RANSOMWARE', 'DDOS', 'PHISHING'].map(type => {
                            const count = cyberThreats.filter(t => t.type === type).length;
                            return (
                                <div key={type} className="flex items-center justify-between text-[9px]">
                                    <span className="text-green-600">{type}</span>
                                    <span className="font-mono text-cyan-400">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Recent Critical Threats */}
            <div className="space-y-2">
                <div className="text-[10px] font-bold text-green-400 flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    CRITICAL CYBER THREATS
                </div>
                {criticalThreats.slice(0, 4).map(threat => (
                    <div
                        key={threat.id}
                        className="bg-black/50 border border-red-900/30 p-2 hover:border-red-700/50 transition-all"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold text-red-400">{threat.name}</span>
                            <span className={`text-[8px] px-1.5 py-0.5 ${severityColors[threat.severity]}`}>
                                {threat.severity}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-[9px]">
                            <span className="text-green-700">{threat.targetSystem}</span>
                            <span className="text-cyan-500 font-mono">{threat.aiConfidence}% conf</span>
                        </div>
                        <div className="text-[8px] text-green-900 font-mono mt-1">
                            {threat.iocIndicators[0]}
                        </div>
                        <div className="mt-2">
                            <AIAnalysisPanel
                                type="threat"
                                data={{
                                    name: threat.name,
                                    type: threat.type,
                                    severity: threat.severity,
                                    description: threat.description,
                                    targetSystem: threat.targetSystem,
                                    indicators: threat.iocIndicators
                                }}
                                compact
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
