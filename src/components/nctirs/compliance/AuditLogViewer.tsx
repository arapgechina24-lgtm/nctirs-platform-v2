'use client';

import React, { useState } from 'react';
import {
    FileText,
    Search,
    Filter,
    Download,
    ShieldCheck,
    User,
    Cpu,
    Clock
} from 'lucide-react';
import { DesignSystem } from '@/lib/nctirs/designSystem';
import { generateBlockchainLedger } from '@/lib/nctirs/mockData';
import { BlockchainLedgerEntry } from '@/types';

export function AuditLogViewer() {
    const [logs] = useState<BlockchainLedgerEntry[]>(() => generateBlockchainLedger(50));
    const [filter, setFilter] = useState('');

    const filteredLogs = logs.filter(log =>
        log.content.toLowerCase().includes(filter.toLowerCase()) ||
        log.id.toLowerCase().includes(filter.toLowerCase()) ||
        log.dataType.toLowerCase().includes(filter.toLowerCase())
    );

    return (
        <div className={`h-full flex flex-col ${DesignSystem.layout.cardShadow} bg-black/40 border border-green-900/50`}>
            {/* Header */}
            <div className="p-4 border-b border-green-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-500" />
                    <h2 className="text-lg font-bold text-gray-100 tracking-wide font-mono">
                        IMMUTABLE AUDIT LOGS
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="w-3 h-3 text-gray-500 absolute left-2 top-1.5" />
                        <input
                            type="text"
                            placeholder="Search logs..."
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            className="bg-black border border-gray-700 rounded pl-7 pr-2 py-1 text-xs text-gray-300 focus:border-green-500 focus:outline-none w-48 font-mono"
                        />
                    </div>
                    <button className="p-1.5 rounded border border-gray-700 hover:bg-gray-800 text-gray-400">
                        <Filter className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 rounded border border-gray-700 hover:bg-gray-800 text-gray-400">
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="flex-1 overflow-y-auto font-mono text-xs">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-green-950/20 text-green-400 sticky top-0 z-10">
                        <tr>
                            <th className="p-3 border-b border-green-900/30 font-bold uppercase tracking-wider">Timestamp</th>
                            <th className="p-3 border-b border-green-900/30 font-bold uppercase tracking-wider">ID</th>
                            <th className="p-3 border-b border-green-900/30 font-bold uppercase tracking-wider">Type</th>
                            <th className="p-3 border-b border-green-900/30 font-bold uppercase tracking-wider">Actor</th>
                            <th className="p-3 border-b border-green-900/30 font-bold uppercase tracking-wider">Details</th>
                            <th className="p-3 border-b border-green-900/30 font-bold uppercase tracking-wider text-right">Verification</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {filteredLogs.map(log => (
                            <tr key={log.id} className="hover:bg-green-900/5 transition-colors group">
                                <td className="p-3 text-gray-500 whitespace-nowrap">
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3 opacity-50" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </div>
                                </td>
                                <td className="p-3 text-gray-400 font-bold">{log.id}</td>
                                <td className="p-3">
                                    <span className={`px-1.5 py-0.5 rounded border text-[10px] font-bold
                                        ${log.dataType === 'THREAT_ALERT' ? 'bg-red-900/20 border-red-900/50 text-red-400' :
                                            log.dataType === 'RESPONSE_ACTION' ? 'bg-blue-900/20 border-blue-900/50 text-blue-400' :
                                                log.dataType === 'EVIDENCE' ? 'bg-yellow-900/20 border-yellow-900/50 text-yellow-400' :
                                                    'bg-gray-900/50 border-gray-700 text-gray-400'}`}>
                                        {log.dataType}
                                    </span>
                                </td>
                                <td className="p-3 text-gray-300">
                                    <div className="flex items-center gap-2">
                                        {log.agencyId === 'SYSTEM' ? <Cpu className="w-3 h-3 text-cyan-400" /> : <User className="w-3 h-3 text-purple-400" />}
                                        {log.agencyId}
                                    </div>
                                </td>
                                <td className="p-3 text-gray-400 max-w-xs truncate" title={log.content}>
                                    {log.content}
                                </td>
                                <td className="p-3 text-right">
                                    <div className="flex items-center justify-end gap-1.5 text-green-500/80 group-hover:text-green-400">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span className="text-[10px] uppercase font-bold">Verified</span>
                                    </div>
                                    <div className="text-[9px] text-gray-600 font-mono mt-0.5" title={log.blockHash}>
                                        {log.blockHash.substr(0, 12)}...
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredLogs.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No logs found matching your criteria.
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-2 border-t border-green-900/30 bg-green-950/20 text-center text-[10px] text-green-400/60 font-mono">
                BLOCKCHAIN VERIFIED • DATA PROTECTION ACT 2019 COMPLIANT • RETENTION: 7 YEARS
            </div>
        </div>
    );
}
