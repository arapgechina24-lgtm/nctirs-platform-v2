'use client'

import {
    Eye, Brain, Shield, Wifi, Camera, Radio, Cpu,
    Database, Link2, CheckCircle, AlertTriangle
} from "lucide-react"
import {
    PerceptionLayerStatus,
    CognitionLayerStatus,
    IntegrityLayerStatus
} from "@/lib/nctirs/mockData"

interface SystemArchitectureProps {
    perception: PerceptionLayerStatus;
    cognition: CognitionLayerStatus;
    integrity: IntegrityLayerStatus;
}

export function SystemArchitecture({ perception, cognition, integrity }: SystemArchitectureProps) {
    return (
        <div className="bg-black border border-green-900/50 rounded-none p-4 card-shadow mb-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-950/50 border border-green-700/50">
                        <Database className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-green-400 tracking-wider">NSSPIP THREE-LAYER ARCHITECTURE</h2>
                        <p className="text-[10px] text-green-800 font-mono">PERCEPTION • COGNITION • INTEGRITY</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-[10px] font-mono text-green-400">ALL SYSTEMS OPERATIONAL</span>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {/* Perception Layer */}
                <div className="bg-gradient-to-b from-cyan-950/30 to-black border border-cyan-900/50 p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 via-cyan-400 to-cyan-600" />

                    <div className="flex items-center gap-2 mb-3">
                        <Eye className="h-4 w-4 text-cyan-400" />
                        <span className="text-[11px] font-bold text-cyan-400">PERCEPTION LAYER</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Wifi className="h-3 w-3 text-cyan-600" />
                                <span className="text-[9px] text-green-600">IoT Sensors</span>
                            </div>
                            <span className="text-[9px] font-mono text-cyan-400">
                                {perception.iotSensorsActive}/{perception.iotSensorsTotal}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Radio className="h-3 w-3 text-cyan-600" />
                                <span className="text-[9px] text-green-600">Drone Fleet</span>
                            </div>
                            <span className="text-[9px] font-mono text-cyan-400">
                                {perception.dronesActive}/{perception.dronesTotal}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Camera className="h-3 w-3 text-cyan-600" />
                                <span className="text-[9px] text-green-600">CCTV Feeds</span>
                            </div>
                            <span className="text-[9px] font-mono text-cyan-400">{perception.cctvFeeds}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Wifi className="h-3 w-3 text-cyan-600" />
                                <span className="text-[9px] text-green-600">Net Sniffers</span>
                            </div>
                            <span className="text-[9px] font-mono text-cyan-400">{perception.networkSniffersActive}</span>
                        </div>

                        <div className="pt-2 border-t border-cyan-900/30">
                            <div className="text-[8px] text-green-800 mb-1">DATA INGESTION</div>
                            <div className="text-sm font-bold text-cyan-400 font-mono">
                                {perception.dataIngestionRate} GB/hr
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cognition Layer */}
                <div className="bg-gradient-to-b from-purple-950/30 to-black border border-purple-900/50 p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-600 via-purple-400 to-purple-600" />

                    <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-4 w-4 text-purple-400" />
                        <span className="text-[11px] font-bold text-purple-400">COGNITION LAYER</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Cpu className="h-3 w-3 text-purple-600" />
                                <span className="text-[9px] text-green-600">ML Models</span>
                            </div>
                            <span className="text-[9px] font-mono text-purple-400">{cognition.mlModelsActive} active</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3 text-purple-600" />
                                <span className="text-[9px] text-green-600">APT Signatures</span>
                            </div>
                            <span className="text-[9px] font-mono text-purple-400">
                                {cognition.aptSignaturesLoaded.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Database className="h-3 w-3 text-purple-600" />
                                <span className="text-[9px] text-green-600">Classifications</span>
                            </div>
                            <span className="text-[9px] font-mono text-purple-400">
                                {cognition.threatClassificationsToday.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Cpu className="h-3 w-3 text-purple-600" />
                                <span className="text-[9px] text-green-600">Avg Latency</span>
                            </div>
                            <span className="text-[9px] font-mono text-purple-400">{cognition.averageProcessingTimeMs}ms</span>
                        </div>

                        <div className="pt-2 border-t border-purple-900/30">
                            <div className="text-[8px] text-green-800 mb-1">MODEL ACCURACY</div>
                            <div className="text-sm font-bold text-purple-400 font-mono">
                                {cognition.modelAccuracy.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </div>

                {/* Integrity Layer */}
                <div className="bg-gradient-to-b from-amber-950/30 to-black border border-amber-900/50 p-3 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600" />

                    <div className="flex items-center gap-2 mb-3">
                        <Shield className="h-4 w-4 text-amber-400" />
                        <span className="text-[11px] font-bold text-amber-400">INTEGRITY LAYER</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Link2 className="h-3 w-3 text-amber-600" />
                                <span className="text-[9px] text-green-600">Chain Height</span>
                            </div>
                            <span className="text-[9px] font-mono text-amber-400">
                                #{integrity.blockchainHeight.toLocaleString()}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Database className="h-3 w-3 text-amber-600" />
                                <span className="text-[9px] text-green-600">Pending TX</span>
                            </div>
                            <span className="text-[9px] font-mono text-amber-400">{integrity.pendingTransactions}</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Wifi className="h-3 w-3 text-amber-600" />
                                <span className="text-[9px] text-green-600">Nodes Online</span>
                            </div>
                            <span className="text-[9px] font-mono text-amber-400">{integrity.nodesOnline}/10</span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <Shield className="h-3 w-3 text-amber-600" />
                                <span className="text-[9px] text-green-600">DPA 2019</span>
                            </div>
                            <span className={`text-[9px] font-mono ${integrity.dataProtectionCompliant ? 'text-green-400' : 'text-red-400'
                                }`}>
                                {integrity.dataProtectionCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                            </span>
                        </div>

                        <div className="pt-2 border-t border-amber-900/30">
                            <div className="text-[8px] text-green-800 mb-1">LAST BLOCK</div>
                            <div className="text-[9px] font-mono text-amber-400 truncate" title={integrity.lastBlockHash}>
                                {integrity.lastBlockHash.substring(0, 20)}...
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
