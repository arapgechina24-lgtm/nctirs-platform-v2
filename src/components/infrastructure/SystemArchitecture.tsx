'use client'

import {
    Eye, Brain, Shield, Wifi, Camera, Radio, Cpu,
    Database, Link2, AlertTriangle, Layers
} from "lucide-react"
import {
    PerceptionLayerStatus,
    CognitionLayerStatus,
    IntegrityLayerStatus
} from "@/lib/mockData"

interface SystemArchitectureProps {
    perception: PerceptionLayerStatus;
    cognition: CognitionLayerStatus;
    integrity: IntegrityLayerStatus;
}

export function SystemArchitecture({ perception, cognition, integrity }: SystemArchitectureProps) {
    return (
        <div className="relative overflow-hidden rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 p-5 shadow-2xl mb-6 group transition-all duration-500 hover:border-green-500/30">
            {/* Animated background glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-green-500/10 via-cyan-500/10 to-purple-500/10 blur-xl opacity-50 group-hover:opacity-100 transition duration-1000"></div>

            <div className="relative z-10 flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                        <Layers className="h-6 w-6 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 tracking-widest drop-shadow-sm">NCTIRS NEURAL ARCHITECTURE</h2>
                        <p className="text-[10px] text-green-300/70 font-mono mt-0.5">PERCEPTION • COGNITION • INTEGRITY</p>
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
                        <span className="text-[9px] font-mono text-green-400 font-bold uppercase">System Nominal</span>
                    </div>
                    <span className="text-[8px] font-mono text-gray-500">LATENCY: 12ms</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
                {/* ---------- PERCEPTION LAYER ---------- */}
                <div className="group/card relative rounded-xl bg-[#0a111a]/80 backdrop-blur-md border border-cyan-900/30 p-4 transition-all duration-300 hover:border-cyan-500/50 hover:bg-[#0d1825]/90 hover:shadow-[0_0_30px_rgba(6,182,212,0.15)] overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 group-hover/card:opacity-100 transition-opacity" />
                    <div className="absolute -right-4 -top-4 text-cyan-500/5 group-hover/card:text-cyan-500/10 transition-colors pointer-events-none">
                        <Eye className="w-24 h-24" />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-1.5 rounded-md bg-cyan-500/10">
                            <Eye className="h-4 w-4 text-cyan-400" />
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-cyan-400">PERCEPTION</span>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Wifi className="h-3.5 w-3.5 text-cyan-600" />
                                <span className="text-[10px] text-gray-400 font-medium">IoT Sensors</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-cyan-300">
                                {perception.iotSensorsActive}/{perception.iotSensorsTotal}
                            </span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Radio className="h-3.5 w-3.5 text-cyan-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Drone Fleet</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-cyan-300">
                                {perception.dronesActive}/{perception.dronesTotal}
                            </span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Camera className="h-3.5 w-3.5 text-cyan-600" />
                                <span className="text-[10px] text-gray-400 font-medium">CCTV Feeds</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-cyan-300">{perception.cctvFeeds}</span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Wifi className="h-3.5 w-3.5 text-cyan-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Net Sniffers</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-cyan-300">{perception.networkSniffersActive}</span>
                        </div>

                        <div className="pt-3 mt-1 border-t border-cyan-900/40">
                            <div className="text-[8px] text-cyan-600/70 font-bold tracking-widest mb-1">DATA INGESTION RATE</div>
                            <div className="flex items-end gap-1">
                                <div className="text-xl font-black text-cyan-400 font-mono leading-none">
                                    {perception.dataIngestionRate}
                                </div>
                                <div className="text-[9px] text-cyan-600 font-bold mb-[2px]">GB/hr</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---------- COGNITION LAYER ---------- */}
                <div className="group/card relative rounded-xl bg-[#130a1a]/80 backdrop-blur-md border border-purple-900/30 p-4 transition-all duration-300 hover:border-purple-500/50 hover:bg-[#1b0d26]/90 hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] overflow-hidden md:-mt-3 md:mb-3">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50 group-hover/card:opacity-100 transition-opacity" />
                    <div className="absolute -right-4 -bottom-4 text-purple-500/5 group-hover/card:text-purple-500/10 transition-colors pointer-events-none">
                        <Brain className="w-28 h-28" />
                    </div>

                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <div className="p-1.5 rounded-md bg-purple-500/10">
                            <Brain className="h-4 w-4 text-purple-400" />
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-purple-400">COGNITION</span>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Cpu className="h-3.5 w-3.5 text-purple-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Active ML Models</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-purple-300">{cognition.mlModelsActive}</span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Cpu className="h-3.5 w-3.5 text-purple-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Sovereign Mode</span>
                            </div>
                            <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded ${process.env.NEXT_PUBLIC_SOVEREIGN_AI_ENABLED === 'true' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-500/10 text-gray-400 border border-gray-500/20'}`}>
                                {process.env.NEXT_PUBLIC_SOVEREIGN_AI_ENABLED === 'true' ? 'ACTIVE' : 'OFFLINE'}
                            </span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-3.5 w-3.5 text-purple-600" />
                                <span className="text-[10px] text-gray-400 font-medium">APT Signatures</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-purple-300">
                                {cognition.aptSignaturesLoaded.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Database className="h-3.5 w-3.5 text-purple-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Classifications</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-purple-300">
                                {cognition.threatClassificationsToday.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Cpu className="h-3.5 w-3.5 text-purple-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Inference Latency</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-purple-300">{cognition.averageProcessingTimeMs}ms</span>
                        </div>

                        <div className="pt-3 mt-1 border-t border-purple-900/40">
                            <div className="text-[8px] text-purple-600/70 font-bold tracking-widest mb-1">MODEL ACCURACY OVERVIEW</div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-purple-950 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-purple-600 to-purple-400 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                                        style={{ width: `${cognition.modelAccuracy}%` }}
                                    />
                                </div>
                                <div className="text-sm font-black text-purple-400 font-mono leading-none">
                                    {cognition.modelAccuracy.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ---------- INTEGRITY LAYER ---------- */}
                <div className="group/card relative rounded-xl bg-[#1a130a]/80 backdrop-blur-md border border-amber-900/30 p-4 transition-all duration-300 hover:border-amber-500/50 hover:bg-[#261b0d]/90 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)] overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50 group-hover/card:opacity-100 transition-opacity" />
                    <div className="absolute -left-4 -top-4 text-amber-500/5 group-hover/card:text-amber-500/10 transition-colors pointer-events-none">
                        <Shield className="w-24 h-24" />
                    </div>

                    <div className="flex items-center gap-2 mb-4 relative z-10">
                        <div className="p-1.5 rounded-md bg-amber-500/10">
                            <Shield className="h-4 w-4 text-amber-400" />
                        </div>
                        <span className="text-[11px] font-black tracking-widest text-amber-400">INTEGRITY</span>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Link2 className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Chain Height</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-300">
                                #{integrity.blockchainHeight.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Database className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Pending TX</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-300">{integrity.pendingTransactions}</span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Wifi className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-[10px] text-gray-400 font-medium">Nodes Online</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-amber-300">{integrity.nodesOnline}/10</span>
                        </div>

                        <div className="flex items-center justify-between group-hover/card:pl-1 transition-all">
                            <div className="flex items-center gap-2">
                                <Shield className="h-3.5 w-3.5 text-amber-600" />
                                <span className="text-[10px] text-gray-400 font-medium">DPA 2019</span>
                            </div>
                            <span className={`text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded ${integrity.dataProtectionCompliant ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                                }`}>
                                {integrity.dataProtectionCompliant ? 'COMPLIANT' : 'VIOLATION'}
                            </span>
                        </div>

                        <div className="pt-3 mt-1 border-t border-amber-900/40">
                            <div className="text-[8px] text-amber-600/70 font-bold tracking-widest mb-1">CURRENT BLOCK HASH</div>
                            <div className="text-[10px] font-mono text-amber-400 truncate bg-amber-950/30 p-1.5 rounded ring-1 ring-amber-900/50" title={integrity.lastBlockHash}>
                                {integrity.lastBlockHash.substring(0, 24)}...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
