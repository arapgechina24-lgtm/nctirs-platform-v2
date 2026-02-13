'use client';

import React from 'react';
import { ShieldAlert, FileText, Gavel, Radio } from 'lucide-react';
import { AutomatedResponseEngine } from '@/components/SOAR/AutomatedResponseEngine';
import { AuditLogViewer } from '@/components/compliance/AuditLogViewer';

export default function SecurityOperationsPage() {
    return (
        <div className="p-6 space-y-6 h-full overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400 font-mono tracking-tight">
                        SECURITY OPERATIONS CENTER
                    </h1>
                    <p className="text-gray-400 text-sm font-mono mt-1">
                        Automated Incident Response & Compliance Auditing
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded text-xs font-mono text-red-300">
                        <ShieldAlert className="w-4 h-4 animate-pulse" />
                        <span>ACTIVE DEFENSE: ENABLED</span>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Left Column: Automated Response Engine (5 cols) */}
                <div className="lg:col-span-12 xl:col-span-5 h-full flex flex-col gap-6 overflow-hidden">
                    {/* Operations Status Overlay */}
                    <div className="bg-black border border-gray-800 p-4 shrink-0">
                        <h3 className="text-xs text-gray-500 font-bold uppercase mb-3 flex items-center gap-2">
                            <Radio className="w-4 h-4 text-green-500" />
                            System Status
                        </h3>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <div className="text-2xl font-bold text-green-500">99.9%</div>
                                <div className="text-[10px] text-gray-500 uppercase">Uptime</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-blue-500">12ms</div>
                                <div className="text-[10px] text-gray-500 uppercase">Response Latency</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-purple-500">Zero</div>
                                <div className="text-[10px] text-gray-500 uppercase">Breaches Today</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-h-0">
                        <AutomatedResponseEngine />
                    </div>
                </div>

                {/* Right Column: Audit Logs & Compliance (7 cols) */}
                <div className="lg:col-span-12 xl:col-span-7 h-full flex flex-col gap-6 overflow-hidden">
                    <div className="flex-1 min-h-0">
                        <AuditLogViewer />
                    </div>
                </div>

            </div>
        </div>
    );
}
