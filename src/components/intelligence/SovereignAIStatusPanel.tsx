'use client'

import { SovereignAIStatus } from '@/types'
import { Server, Cpu, MapPin, ShieldCheck, Globe, Ban, Clock, Cloud } from 'lucide-react'
import { useSovereign } from '@/contexts/SovereignContext'

interface SovereignAIStatusPanelProps {
    status: SovereignAIStatus
}

export function SovereignAIStatusPanel({ status }: SovereignAIStatusPanelProps) {
    const { isSovereign } = useSovereign()
    const onlineEdgeNodes = status.edgeNodes.filter(n => n.status === 'ONLINE').length

    return (
        <div className="bg-black border border-green-900/50 p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-green-400 font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                    <Server className="w-4 h-4" />
                    Sovereign AI Infrastructure
                </h3>
                <div className={`text-[9px] px-2 py-1 uppercase tracking-wider font-bold border ${isSovereign ? 'bg-green-950/30 text-green-400 border-green-500/50' : 'bg-blue-950/30 text-blue-400 border-blue-500/50'}`}>
                    {isSovereign ? '100% On-Premise' : 'Hybrid Cloud Active'}
                </div>
            </div>

            {/* Zero Foreign API Banner */}
            <div className={`border-2 p-3 mb-4 transition-all duration-500 ${isSovereign ? 'bg-green-950/30 border-green-500/50' : 'bg-blue-950/30 border-blue-500/50'}`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isSovereign ? 'bg-green-900/50' : 'bg-blue-900/50'}`}>
                            {isSovereign ? <Ban className="w-5 h-5 text-green-400" /> : <Cloud className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div>
                            <div className={`font-bold text-sm ${isSovereign ? 'text-green-400' : 'text-blue-400'}`}>
                                {isSovereign ? 'ZERO FOREIGN API CALLS' : 'CLOUD ANALYTICS ACTIVE'}
                            </div>
                            <div className={`text-[9px] ${isSovereign ? 'text-green-600' : 'text-blue-600'}`}>
                                {isSovereign ? 'No data leaves Kenya jurisdiction' : 'Accelerated synthesis enabled'}
                            </div>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className={`text-2xl font-bold ${isSovereign ? 'text-green-400' : 'text-blue-400'}`}>
                            {isSovereign ? '0' : status.foreignAPICallsToday}
                        </div>
                        <div className="text-[8px] text-gray-500">External API Calls Today</div>
                    </div>
                </div>
            </div>

            {/* LLM Status Grid */}
            <div className="mb-4">
                <div className="text-[9px] text-gray-600 uppercase tracking-wider mb-2">Localized LLMs</div>
                <div className="space-y-2">
                    {status.llms.map(llm => (
                        <div
                            key={llm.id}
                            className={`flex items-center justify-between p-2 border ${llm.status === 'ONLINE'
                                ? 'border-green-900/30 bg-green-950/10'
                                : llm.status === 'UPDATING'
                                    ? 'border-yellow-900/30 bg-yellow-950/10'
                                    : 'border-red-900/30 bg-red-950/10'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <Cpu className={`w-5 h-5 ${llm.status === 'ONLINE' ? 'text-green-400' :
                                    llm.status === 'UPDATING' ? 'text-yellow-400' :
                                        'text-red-400'
                                    }`} />
                                <div>
                                    <div className="text-sm text-gray-200 font-medium">{llm.name}</div>
                                    <div className="text-[9px] text-gray-500">{llm.version}</div>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-right text-[10px]">
                                <div>
                                    <div className="text-cyan-400 font-mono text-sm">{llm.inferenceLatencyMs}ms</div>
                                    <div className="text-gray-500">Latency</div>
                                </div>
                                <div>
                                    <div className="text-purple-400 font-mono text-sm">{llm.gpuUtilization}%</div>
                                    <div className="text-gray-500">GPU</div>
                                </div>
                                <div>
                                    <div className="text-green-400 font-mono text-sm">{llm.requestsPerSecond}</div>
                                    <div className="text-gray-500">RPS</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Edge Nodes */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-gray-600 uppercase tracking-wider">Edge Deployment Nodes</span>
                    <span className="text-[10px] text-green-400">{onlineEdgeNodes}/{status.edgeNodes.length} Online</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                    {status.edgeNodes.map(node => (
                        <div
                            key={node.id}
                            className={`p-1.5 text-center border ${node.status === 'ONLINE'
                                ? 'border-green-900/30 bg-green-950/10'
                                : node.status === 'MAINTENANCE'
                                    ? 'border-yellow-900/30 bg-yellow-950/10'
                                    : 'border-red-900/30 bg-red-950/10'
                                }`}
                            title={`${node.location} - ${node.inferenceCount.toLocaleString()} inferences`}
                        >
                            <MapPin className={`w-4 h-4 mx-auto mb-1 ${node.status === 'ONLINE' ? 'text-green-400' :
                                node.status === 'MAINTENANCE' ? 'text-yellow-400' :
                                    'text-red-400'
                                }`} />
                            <div className="text-[9px] text-gray-300">{node.location.split(' ')[0]}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sovereignty Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className={`bg-black border p-3 text-center transition-colors ${isSovereign ? 'border-green-900/30' : 'border-blue-900/30'}`}>
                    <div className={`text-xl font-bold ${isSovereign ? 'text-green-400' : 'text-blue-400'}`}>
                        {isSovereign ? '100%' : '15%'}
                    </div>
                    <div className="text-[9px] text-gray-500 uppercase">On-Premise</div>
                </div>
                <div className={`bg-black border p-3 text-center transition-colors ${isSovereign ? 'border-cyan-900/30' : 'border-blue-900/30'}`}>
                    <ShieldCheck className={`w-5 h-5 mx-auto mb-1 ${isSovereign ? 'text-cyan-400' : 'text-blue-400'}`} />
                    <div className="text-[9px] text-gray-500 uppercase">DPA Compliant</div>
                </div>
                <div className={`bg-black border p-3 text-center transition-colors ${isSovereign ? 'border-purple-900/30' : 'border-blue-900/30'}`}>
                    <Globe className={`w-5 h-5 mx-auto mb-1 ${isSovereign ? 'text-purple-400' : 'text-blue-400'}`} />
                    <div className="text-[9px] text-gray-500 uppercase">
                        {isSovereign ? 'Kenya Only' : 'Global Net'}
                    </div>
                </div>
            </div>

            {/* Provider Info */}
            <div className="mt-3 text-[8px] text-gray-600 flex items-center justify-between">
                <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Audit: {status.lastSecurityAudit.toLocaleDateString()}
                </span>
                <span>{isSovereign ? status.sovereignCloudProvider : 'Commercial Cloud (Gemini v2)'}</span>
            </div>
        </div>
    )
}

export default SovereignAIStatusPanel
