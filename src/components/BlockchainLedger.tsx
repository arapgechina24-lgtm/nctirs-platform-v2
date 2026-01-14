'use client'

import { Link2, Shield, FileCheck, Clock, Hash } from "lucide-react"
import { BlockchainLedgerEntry } from "@/lib/mockData"

interface BlockchainLedgerProps {
    entries: BlockchainLedgerEntry[];
    maxItems?: number;
}

const dataTypeColors = {
    THREAT_ALERT: 'text-red-400 bg-red-950/50',
    EVIDENCE: 'text-cyan-400 bg-cyan-950/50',
    RESPONSE_ACTION: 'text-yellow-400 bg-yellow-950/50',
    AUDIT_LOG: 'text-green-400 bg-green-950/50',
}

export function BlockchainLedger({ entries, maxItems = 8 }: BlockchainLedgerProps) {
    const displayEntries = entries.slice(0, maxItems);

    return (
        <div className="bg-black border border-green-900/50 rounded-none p-4 card-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="absolute inset-0 bg-amber-600 blur-lg opacity-20" />
                        <div className="relative p-2 bg-amber-950/50 border border-amber-700/50">
                            <Link2 className="h-5 w-5 text-amber-400" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-green-400 tracking-wider">BLOCKCHAIN INTEGRITY LEDGER</h2>
                        <p className="text-[10px] text-green-800 font-mono">IMMUTABLE EVIDENCE CHAIN • DATA PROTECTION ACT 2019</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-green-950/30 border border-green-700/50">
                    <Shield className="h-3 w-3 text-green-500" />
                    <span className="text-[9px] font-mono text-green-400">COMPLIANT</span>
                </div>
            </div>

            {/* Chain Visualization */}
            <div className="relative mb-4 overflow-hidden">
                <div className="flex items-center gap-1 overflow-x-auto pb-2">
                    {displayEntries.slice(0, 12).map((entry, idx) => (
                        <div key={entry.id} className="flex items-center">
                            <div
                                className={`w-8 h-8 flex items-center justify-center border ${entry.courtAdmissible
                                        ? 'border-amber-600/50 bg-amber-950/30'
                                        : 'border-green-900/50 bg-green-950/30'
                                    }`}
                                title={entry.blockHash}
                            >
                                <Hash className={`h-3 w-3 ${entry.courtAdmissible ? 'text-amber-400' : 'text-green-600'}`} />
                            </div>
                            {idx < displayEntries.length - 1 && (
                                <div className="w-4 h-0.5 bg-gradient-to-r from-green-700 to-green-900" />
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Ledger Entries */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
                {displayEntries.map(entry => (
                    <div
                        key={entry.id}
                        className="bg-black/50 border border-green-900/30 p-2 hover:border-amber-700/30 transition-all"
                    >
                        <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                                <span className={`text-[8px] px-1.5 py-0.5 font-mono ${dataTypeColors[entry.dataType]}`}>
                                    {entry.dataType.replace('_', ' ')}
                                </span>
                                <span className="text-[9px] text-green-500 font-mono">{entry.id}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                {entry.courtAdmissible && (
                                    <div className="flex items-center gap-1 text-[8px] text-amber-400">
                                        <FileCheck className="h-3 w-3" />
                                        COURT READY
                                    </div>
                                )}
                                <span className="text-[8px] text-green-800">{entry.agencyId}</span>
                            </div>
                        </div>
                        <div className="text-[9px] text-green-600 mb-1">{entry.content}</div>
                        <div className="flex items-center justify-between text-[8px] font-mono">
                            <div className="flex items-center gap-1 text-green-900">
                                <Clock className="h-3 w-3" />
                                {entry.timestamp.toLocaleTimeString()}
                            </div>
                            <div className="text-green-900 truncate max-w-[200px]" title={entry.blockHash}>
                                {entry.blockHash.substring(0, 16)}...
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
