'use client'

import { Shield, Ban, Truck, Bell, Lock, FileCheck, Zap, Clock, CheckCircle, XCircle, Loader } from "lucide-react"
import { AutomatedResponse, ResponseType } from "@/lib/mockData"

interface AutomatedResponsePanelProps {
    responses: AutomatedResponse[];
}

const responseIcons: Record<ResponseType, typeof Shield> = {
    IP_BLOCK: Ban,
    SYSTEM_ISOLATE: Lock,
    POLICE_DISPATCH: Truck,
    ALERT_AGENCY: Bell,
    LOCKDOWN: Shield,
    EVIDENCE_PRESERVE: FileCheck,
}

const responseColors: Record<ResponseType, string> = {
    IP_BLOCK: 'text-red-400 bg-red-950/50',
    SYSTEM_ISOLATE: 'text-orange-400 bg-orange-950/50',
    POLICE_DISPATCH: 'text-blue-400 bg-blue-950/50',
    ALERT_AGENCY: 'text-yellow-400 bg-yellow-950/50',
    LOCKDOWN: 'text-purple-400 bg-purple-950/50',
    EVIDENCE_PRESERVE: 'text-cyan-400 bg-cyan-950/50',
}

const statusIcons = {
    PENDING: Clock,
    EXECUTING: Loader,
    COMPLETED: CheckCircle,
    FAILED: XCircle,
}

export function AutomatedResponsePanel({ responses }: AutomatedResponsePanelProps) {
    const cyberResponses = responses.filter(r =>
        r.responseType === 'IP_BLOCK' || r.responseType === 'SYSTEM_ISOLATE'
    );
    const physicalResponses = responses.filter(r =>
        r.responseType === 'POLICE_DISPATCH' || r.responseType === 'LOCKDOWN'
    );
    const completedCount = responses.filter(r => r.status === 'COMPLETED').length;
    const executingCount = responses.filter(r => r.status === 'EXECUTING').length;

    return (
        <div className="bg-black border border-green-900/50 rounded-none p-4 card-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-600 blur-lg opacity-20 animate-pulse" />
                        <div className="relative p-2 bg-red-950/50 border border-red-700/50">
                            <Zap className="h-5 w-5 text-red-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-green-400 tracking-wider">AUTOMATED RESPONSE MODULE</h2>
                        <p className="text-[10px] text-green-800 font-mono">ARCM + ERCM UNIFIED COMMAND</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-center px-3 py-1 bg-green-950/30 border border-green-800/50">
                        <div className="text-lg font-bold text-green-400">{completedCount}</div>
                        <div className="text-[8px] text-green-800">COMPLETED</div>
                    </div>
                    <div className="text-center px-3 py-1 bg-yellow-950/30 border border-yellow-800/50">
                        <div className="text-lg font-bold text-yellow-400 animate-pulse">{executingCount}</div>
                        <div className="text-[8px] text-yellow-800">EXECUTING</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Cyber Response Column (ARCM) */}
                <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-cyan-900/30">
                        <Ban className="h-4 w-4 text-cyan-400" />
                        <span className="text-[10px] font-bold text-cyan-400">CYBER CONTAINMENT (ARCM)</span>
                    </div>
                    <div className="space-y-2">
                        {cyberResponses.slice(0, 5).map(response => {
                            const Icon = responseIcons[response.responseType];
                            const StatusIcon = statusIcons[response.status];
                            const colorClass = responseColors[response.responseType];

                            return (
                                <div
                                    key={response.id}
                                    className="bg-black/50 border border-green-900/30 p-2 hover:border-cyan-700/30 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1 ${colorClass}`}>
                                                <Icon className="h-3 w-3" />
                                            </div>
                                            <span className="text-[9px] font-bold text-green-400">
                                                {response.responseType.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-[8px] ${response.status === 'COMPLETED' ? 'text-green-400' :
                                                response.status === 'EXECUTING' ? 'text-yellow-400' :
                                                    response.status === 'FAILED' ? 'text-red-400' :
                                                        'text-gray-400'
                                            }`}>
                                            <StatusIcon className={`h-3 w-3 ${response.status === 'EXECUTING' ? 'animate-spin' : ''}`} />
                                            {response.status}
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-green-600">{response.description}</div>
                                    <div className="flex items-center justify-between mt-1 text-[8px] text-green-900 font-mono">
                                        <span>{response.targetSystem}</span>
                                        <span>{response.executionTimeMs}ms</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Physical Response Column (ERCM) */}
                <div>
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-900/30">
                        <Truck className="h-4 w-4 text-blue-400" />
                        <span className="text-[10px] font-bold text-blue-400">PHYSICAL RESPONSE (ERCM)</span>
                    </div>
                    <div className="space-y-2">
                        {physicalResponses.slice(0, 5).map(response => {
                            const Icon = responseIcons[response.responseType];
                            const StatusIcon = statusIcons[response.status];
                            const colorClass = responseColors[response.responseType];

                            return (
                                <div
                                    key={response.id}
                                    className="bg-black/50 border border-green-900/30 p-2 hover:border-blue-700/30 transition-all"
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1 ${colorClass}`}>
                                                <Icon className="h-3 w-3" />
                                            </div>
                                            <span className="text-[9px] font-bold text-green-400">
                                                {response.responseType.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <div className={`flex items-center gap-1 text-[8px] ${response.status === 'COMPLETED' ? 'text-green-400' :
                                                response.status === 'EXECUTING' ? 'text-yellow-400' :
                                                    response.status === 'FAILED' ? 'text-red-400' :
                                                        'text-gray-400'
                                            }`}>
                                            <StatusIcon className={`h-3 w-3 ${response.status === 'EXECUTING' ? 'animate-spin' : ''}`} />
                                            {response.status}
                                        </div>
                                    </div>
                                    <div className="text-[9px] text-green-600">{response.description}</div>
                                    {response.unitsDispatched && (
                                        <div className="flex items-center gap-1 mt-1 text-[8px] text-blue-400">
                                            <Truck className="h-3 w-3" />
                                            {response.unitsDispatched} units dispatched
                                        </div>
                                    )}
                                    <div className="text-[8px] text-green-900 font-mono mt-1">
                                        {response.coordinatingAgencies.join(' • ')}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
