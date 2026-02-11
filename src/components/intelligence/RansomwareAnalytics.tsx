'use client';

import React from 'react';
import { Shield, Brain, Activity, Lock, Globe, ShieldAlert, BarChart3 } from 'lucide-react';
import { DesignSystem } from '@/lib/designSystem';
import type { RansomwareCampaign, CyberTargetType } from '@/types';

interface RansomwareAnalyticsProps {
    campaigns: RansomwareCampaign[];
}

const SECTOR_COLORS: Record<CyberTargetType, string> = {
    GOVERNMENT: 'bg-purple-500',
    FINANCIAL: 'bg-green-500',
    INFRASTRUCTURE: 'bg-orange-500',
    HEALTHCARE: 'bg-red-500',
    TELECOM: 'bg-blue-500',
    ENERGY: 'bg-yellow-500',
    TRANSPORT: 'bg-cyan-500',
};

export function RansomwareAnalytics({ campaigns }: RansomwareAnalyticsProps) {
    // Calculate sector impact
    const sectorCounts: Record<string, number> = {};
    let totalTargets = 0;

    campaigns.forEach(campaign => {
        campaign.targetSectors.forEach(sector => {
            sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
            totalTargets++;
        });
    });

    const sortedSectors = Object.entries(sectorCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5); // Top 5

    // Calculate total ransoms
    const totalRansom = campaigns.reduce((acc, curr) => acc + curr.averageRansomDemandUSD, 0);
    const avgRansom = totalRansom / (campaigns.length || 1);

    return (
        <div className={`h-full flex flex-col ${DesignSystem.layout.cardShadow} bg-black/40 border border-purple-800/50`}>
            {/* Header */}
            <div className="p-4 border-b border-purple-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    <h2 className="text-lg font-bold text-gray-100 tracking-wide font-mono">
                        CAMPAIGN ANALYTICS
                    </h2>
                </div>
            </div>

            <div className="p-4 space-y-6 overflow-y-auto">
                {/* Key Metrics */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-purple-950/20 border border-purple-900/40 p-3 rounded">
                        <div className="text-xs text-purple-300 font-mono mb-1">AVG DEMAND (USD)</div>
                        <div className="text-xl font-bold text-gray-100 font-mono">
                            ${(avgRansom / 1000000).toFixed(2)}M
                        </div>
                    </div>
                    <div className="bg-red-950/20 border border-red-900/40 p-3 rounded">
                        <div className="text-xs text-red-300 font-mono mb-1">active CAMPAIGNS</div>
                        <div className="text-xl font-bold text-gray-100 font-mono">
                            {campaigns.filter(c => c.active).length}
                        </div>
                    </div>
                </div>

                {/* Sector Heatmap */}
                <div>
                    <h3 className="text-xs font-bold text-gray-400 font-mono mb-3 uppercase flex items-center gap-2">
                        <TargetIcon className="w-3 h-3" />
                        Most Targeted Sectors
                    </h3>
                    <div className="space-y-3">
                        {sortedSectors.map(([sector, count]) => (
                            <div key={sector}>
                                <div className="flex justify-between text-[10px] mb-1 font-mono">
                                    <span className="text-gray-300">{sector}</span>
                                    <span className="text-gray-500">{Math.round((count / totalTargets) * 100)}%</span>
                                </div>
                                <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${SECTOR_COLORS[sector as CyberTargetType] || 'bg-gray-500'}`}
                                        style={{ width: `${(count / totalTargets) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Encryption Trends (Placeholder for now) */}
                <div className="p-3 bg-gray-900/30 border border-gray-800 rounded">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldAlert className="w-4 h-4 text-gray-400" />
                        <span className="text-xs font-bold text-gray-300 font-mono">ENCRYPTION METHODS</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {Array.from(new Set(campaigns.map(c => c.encryptionMethod))).map(method => (
                            <span key={method} className="text-[10px] px-2 py-1 bg-black border border-gray-700 rounded text-gray-400 font-mono">
                                {method}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TargetIcon({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    );
}
