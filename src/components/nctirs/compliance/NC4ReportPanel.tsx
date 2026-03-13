'use client';

import React, { useState } from 'react';
import { FileText, Download, Shield, AlertOctagon } from 'lucide-react';
import { generateNC4Report, NC4ReportData } from '@/lib/nctirs/nc4Report';

interface NC4ReportPanelProps {
    incidentId: string;
    assetType: string;
}

export const NC4ReportPanel: React.FC<NC4ReportPanelProps> = ({ incidentId, assetType }) => {
    const [report, setReport] = useState<NC4ReportData | null>(null);

    const handleGenerate = () => {
        const data = generateNC4Report(incidentId, assetType);
        setReport(data);
    };

    return (
        <div className="border border-green-900/50 bg-black/80 p-4 rounded-none">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-green-400 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    NC4 COMPLIANCE REPORTING
                </h3>
                {!report && (
                    <button
                        onClick={handleGenerate}
                        className="text-[10px] bg-green-900/30 text-green-400 border border-green-700 px-3 py-1 hover:bg-green-800/50 transition-colors uppercase tracking-wider"
                    >
                        Generate Report
                    </button>
                )}
            </div>

            {report && (
                <div className="space-y-3 animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono border-b border-green-900/30 pb-2">
                        <div>
                            <span className="text-gray-500 block">ASSET CATEGORY</span>
                            <span className="text-white font-bold">{report.assetCategory}</span>
                        </div>
                        <div>
                            <span className="text-gray-500 block">MITRE TECHNIQUE</span>
                            <span className="text-yellow-500 font-bold">{report.mitreTechnique}</span>
                        </div>
                    </div>

                    <div className="bg-gray-900/50 p-2 border-l-2 border-orange-500">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-gray-400 uppercase">Data Protection (DPA 2019)</span>
                            {report.piiAccessed ? (
                                <span className="flex items-center gap-1 text-[10px] text-red-500 font-bold">
                                    <AlertOctagon className="w-3 h-3" /> PII ACCESSED
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[10px] text-green-500 font-bold">
                                    <Shield className="w-3 h-3" /> SECURE
                                </span>
                            )}
                        </div>
                        <p className="text-[10px] text-green-100/80 leading-relaxed italic">
                            &quot;{report.narrative}&quot;
                        </p>
                    </div>

                    <button className="w-full mt-2 bg-green-600 hover:bg-green-500 text-black font-bold text-[10px] py-2 flex items-center justify-center gap-2 uppercase">
                        <Download className="w-3 h-3" />
                        Download Official PDF
                    </button>
                </div>
            )}
        </div>
    );
};
