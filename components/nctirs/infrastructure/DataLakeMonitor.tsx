'use client'

import { Database, Globe, Camera, Users, Radio, Wifi } from "lucide-react"
import { DataLakeSource } from "@/lib/nctirs/mockData"

interface DataLakeMonitorProps {
    sources: DataLakeSource[];
}

const sourceIcons: Record<string, typeof Database> = {
    NETWORK_LOGS: Wifi,
    DARK_WEB: Globe,
    CCTV_STREAM: Camera,
    CITIZEN_REPORT: Users,
    OSINT: Globe,
    SIGINT: Radio,
    HUMINT: Users,
}

const sourceColors: Record<string, string> = {
    NETWORK_LOGS: 'text-cyan-400 bg-cyan-950/50',
    DARK_WEB: 'text-purple-400 bg-purple-950/50',
    CCTV_STREAM: 'text-orange-400 bg-orange-950/50',
    CITIZEN_REPORT: 'text-green-400 bg-green-950/50',
    OSINT: 'text-blue-400 bg-blue-950/50',
    SIGINT: 'text-red-400 bg-red-950/50',
    HUMINT: 'text-yellow-400 bg-yellow-950/50',
}

export function DataLakeMonitor({ sources }: DataLakeMonitorProps) {
    const totalDataRate = sources.reduce((acc, s) => acc + s.dataRate, 0);
    const totalRecords = sources.reduce((acc, s) => acc + s.recordsProcessed, 0);
    const totalAlerts = sources.reduce((acc, s) => acc + s.alertsGenerated, 0);

    return (
        <div className="bg-black border border-green-900/50 rounded-none p-4 card-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-cyan-950/50 border border-cyan-700/50">
                        <Database className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-green-400 tracking-wider">UNIFIED DATA LAKE</h2>
                        <p className="text-[10px] text-green-800 font-mono">REAL-TIME INTELLIGENCE FUSION</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <div className="text-[9px] text-green-800 font-mono">DATA RATE</div>
                        <div className="text-sm font-bold text-cyan-400 font-mono">{(totalDataRate / 1000).toFixed(1)} GB/s</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] text-green-800 font-mono">RECORDS</div>
                        <div className="text-sm font-bold text-green-400 font-mono">{(totalRecords / 1000000).toFixed(1)}M</div>
                    </div>
                    <div className="text-right">
                        <div className="text-[9px] text-green-800 font-mono">ALERTS</div>
                        <div className="text-sm font-bold text-orange-400 font-mono">{totalAlerts}</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
                {sources.slice(0, 4).map((source) => {
                    const Icon = sourceIcons[source.type] || Database;
                    const colorClass = sourceColors[source.type] || 'text-green-400 bg-green-950/50';

                    return (
                        <div
                            key={source.id}
                            className="bg-black/50 border border-green-900/30 p-2 relative overflow-hidden group hover:border-green-700/50 transition-all"
                        >
                            {/* Animated data flow effect */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-pulse" />
                            </div>

                            <div className="relative flex items-center justify-between mb-1">
                                <div className={`p-1 ${colorClass.split(' ')[1]} border border-current/30`}>
                                    <Icon className={`h-3 w-3 ${colorClass.split(' ')[0]}`} />
                                </div>
                                <div className={`flex items-center gap-1 px-1 py-0.5 text-[8px] font-mono ${source.status === 'ACTIVE' ? 'bg-green-950/50 text-green-400' :
                                    source.status === 'PROCESSING' ? 'bg-yellow-950/50 text-yellow-400' :
                                        'bg-red-950/50 text-red-400'
                                    }`}>
                                    <div className={`h-1 w-1 rounded-full ${source.status === 'ACTIVE' ? 'bg-green-500 animate-pulse' :
                                        source.status === 'PROCESSING' ? 'bg-yellow-500 animate-pulse' :
                                            'bg-red-500'
                                        }`} />
                                    {source.status}
                                </div>
                            </div>

                            <div className="relative">
                                <div className="text-[9px] font-bold text-green-400 truncate">{source.name}</div>
                                <div className="flex justify-between text-[8px] mt-1">
                                    <span className="text-cyan-400 font-mono">{source.dataRate} MB/s</span>
                                    <span className="text-orange-400 font-mono">{source.alertsGenerated} alerts</span>
                                </div>
                            </div>

                            {/* Data flow animation bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-950 overflow-hidden">
                                <div
                                    className="h-full bg-gradient-to-r from-green-600 via-cyan-500 to-green-600 animate-pulse"
                                    style={{
                                        width: `${Math.min(100, (source.dataRate / 100))}%`,
                                        animation: 'pulse 1s ease-in-out infinite'
                                    }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
