'use client'

import { FederatedLearningStatus } from '@/lib/nctirs/mockData'
import { Network, Database, Lock, ArrowUpDown, CheckCircle, RefreshCw, Wifi } from 'lucide-react'

interface FederatedLearningHubProps {
    status: FederatedLearningStatus
}

export function FederatedLearningHub({ status }: FederatedLearningHubProps) {
    const onlineNodes = status.nodes.filter(n => n.status !== 'OFFLINE').length

    return (
        <div className="bg-black border border-cyan-900/50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-cyan-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Network className="w-4 h-4" />
                    Federated Learning Hub
                </h3>
                <div className="flex items-center gap-2">
                    <div className="text-[9px] bg-green-950/30 text-green-400 px-2 py-1 uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        {status.dataTransferred}
                    </div>
                </div>
            </div>

            {/* Global Model Status */}
            <div className="bg-cyan-950/20 border border-cyan-900/30 p-3 mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] text-cyan-400 uppercase tracking-wider">Global Model</span>
                    <span className="text-[10px] text-cyan-300 font-mono">{status.globalModelVersion}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px]">
                    <div>
                        <div className="text-cyan-400 font-bold">{status.trainingRound}/{status.totalRounds}</div>
                        <div className="text-gray-600">Rounds</div>
                    </div>
                    <div>
                        <div className="text-purple-400 font-bold">ε={status.differentialPrivacyEpsilon.toFixed(2)}</div>
                        <div className="text-gray-600">DP Epsilon</div>
                    </div>
                    <div>
                        <div className="text-green-400 font-bold">{onlineNodes}/{status.nodes.length}</div>
                        <div className="text-gray-600">Nodes Online</div>
                    </div>
                </div>
                {/* Aggregation Progress */}
                <div className="mt-3">
                    <div className="flex justify-between text-[8px] text-gray-500 mb-1">
                        <span>Gradient Aggregation</span>
                        <span className="text-cyan-400">{status.aggregationProgress}%</span>
                    </div>
                    <div className="h-1 bg-gray-900 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-cyan-500 transition-all"
                            style={{ width: `${status.aggregationProgress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Privacy Badge */}
            <div className="bg-green-950/20 border border-green-900/30 p-2 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-green-400" />
                    <span className="text-[10px] text-green-300">Zero Raw Data Transfer</span>
                </div>
                <div className="text-[9px] text-green-400 uppercase">DPA 2019 Compliant</div>
            </div>

            {/* Agency Nodes */}
            <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Agency Enclaves</div>
            <div className="space-y-2">
                {status.nodes.map(node => (
                    <div
                        key={node.id}
                        className={`flex items-center justify-between text-[10px] px-2 py-1.5 border ${node.status === 'OFFLINE'
                            ? 'bg-red-950/10 border-red-900/30'
                            : node.status === 'TRAINING'
                                ? 'bg-yellow-950/10 border-yellow-900/30'
                                : node.status === 'SYNCING'
                                    ? 'bg-blue-950/10 border-blue-900/30'
                                    : 'bg-green-950/10 border-green-900/30'
                            }`}
                    >
                        <div className="flex items-center gap-2 min-w-0">
                            {node.status === 'OFFLINE' ? (
                                <Wifi className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            ) : node.status === 'TRAINING' ? (
                                <RefreshCw className="w-3.5 h-3.5 text-yellow-400 animate-spin shrink-0" />
                            ) : node.status === 'SYNCING' ? (
                                <ArrowUpDown className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                            ) : (
                                <CheckCircle className="w-3.5 h-3.5 text-green-400 shrink-0" />
                            )}
                            <span className="text-gray-200 text-xs">{node.agency}</span>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="text-gray-400 text-xs">
                                <Database className="w-3 h-3 inline mr-1" />
                                {(node.localDataPoints / 1000).toFixed(0)}K
                            </div>
                            <div className={`font-mono text-xs ${node.status === 'OFFLINE' ? 'text-red-400' :
                                node.status === 'TRAINING' ? 'text-yellow-400' :
                                    node.status === 'SYNCING' ? 'text-blue-400' :
                                        'text-green-400'
                                }`}>
                                {node.status}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Last Sync */}
            <div className="mt-3 text-[8px] text-gray-600 text-right">
                Last Global Update: {status.lastGlobalUpdate.toLocaleTimeString()}
            </div>
        </div>
    )
}

export default FederatedLearningHub
