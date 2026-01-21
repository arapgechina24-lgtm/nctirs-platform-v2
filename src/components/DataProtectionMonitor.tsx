import React from 'react';
import { Shield, Lock, FileText, Scale } from 'lucide-react';

export function DataProtectionMonitor() {
    return (
        <div className="bg-black border border-green-900/50 p-4">
            <div className="flex items-center gap-3 mb-4">
                <Shield className="h-5 w-5 text-amber-500" />
                <h3 className="text-amber-500 font-bold">DATA PROTECTION ACT (2019) COMPLIANCE</h3>
            </div>
            <div className="space-y-4">
                <div className="bg-amber-950/10 border border-amber-900/30 p-3">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] text-amber-600">PROCESSOR STATUS</span>
                        <span className="text-[10px] text-green-500 font-bold">COMPLIANT</span>
                    </div>
                    <div className="w-full bg-amber-900/20 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full w-[98%]"></div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div className="bg-black border border-gray-800 p-2 text-center">
                        <Lock className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                        <div className="text-[9px] text-gray-400">ENCRYPTION</div>
                        <div className="text-xs text-green-500 font-mono">AES-256-GCM</div>
                    </div>
                    <div className="bg-black border border-gray-800 p-2 text-center">
                        <Scale className="h-4 w-4 text-gray-500 mx-auto mb-1" />
                        <div className="text-[9px] text-gray-400">ODPC AUDIT</div>
                        <div className="text-xs text-green-500 font-mono">PASSED</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-500 border-t border-gray-800 pt-2">
                    <FileText className="h-3 w-3" />
                    <span>last_audit_log_hash: 0x7f...a92</span>
                </div>
            </div>
        </div>
    );
}
