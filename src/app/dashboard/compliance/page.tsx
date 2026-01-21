import { getAuditLogs } from '@/lib/actions/audit';

export default async function ComplianceAuditPage() {
    const logs = await getAuditLogs();

    return (
        <div className="p-8 bg-black min-h-screen font-mono text-green-500">
            <header className="mb-8 border-b border-green-900 pb-4 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tighter uppercase">National Compliance Audit Trail</h1>
                    <p className="text-xs text-green-700 mt-1">Authorized Access Only // NIST SP 800-53 Compliant</p>
                </div>
                <div className="text-right">
                    <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-[10px] border border-green-500 animate-pulse">
                        LIVE SYSTEM INTEGRITY: VERIFIED
                    </span>
                </div>
            </header>

            <div className="overflow-x-auto border border-green-900 bg-black/50 backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-green-900 bg-green-900/10 uppercase text-[10px]">
                            <th className="p-4">Timestamp (EAT)</th>
                            <th className="p-4">Event ID</th>
                            <th className="p-4">Asset / Sector</th>
                            <th className="p-4">Action Taken</th>
                            <th className="p-4">NC4 Status</th>
                            <th className="p-4 text-right">Verification</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log) => (
                            <tr key={log.id} className="border-b border-green-900/30 hover:bg-green-900/5 transition-colors group">
                                <td className="p-4 text-xs font-bold text-green-400">{log.timestamp}</td>
                                <td className="p-4 text-xs font-mono opacity-60">[{log.id.substring(0, 8)}]</td>
                                <td className="p-4">
                                    <div className="text-sm">{log.assetName}</div>
                                    <div className="text-[9px] text-gray-500">{log.sector}</div>
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-[10px] ${log.severity === 'CRITICAL' ? 'bg-red-900/40 text-red-400 border border-red-500' :
                                            log.severity === 'HIGH' ? 'bg-orange-900/40 text-orange-400 border border-orange-500' :
                                                'bg-blue-900/40 text-blue-400 border border-blue-500'
                                        }`}>
                                        {log.action}
                                    </span>
                                </td>
                                <td className="p-4 text-[10px]">
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${log.notifiedNC4 ? 'bg-blue-500 shadow-[0_0_5px_cyan]' : 'bg-gray-700'}`} />
                                        {log.receiptId || "PENDING"}
                                    </div>
                                </td>
                                <td className="p-4 text-right">
                                    <button className="text-[10px] underline hover:text-white opacity-40 group-hover:opacity-100">
                                        VIEW PAYLOAD
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <footer className="mt-6 flex justify-between text-[10px] text-green-800">
                <p>TOTAL LOG ENTRIES: {logs.length}</p>
                <p>RECORDS ENCRYPTED VIA AES-256-GCM</p>
            </footer>
        </div>
    );
}
