'use client';

import React from 'react';
import {
    AlertTriangle,
    ShieldAlert,
    Unlock,
    LockKeyhole,
    Activity,
    TrendingUp,
    Link as LinkIcon
} from 'lucide-react';
import { DesignSystem } from '@/lib/designSystem';
import type { RansomwareCampaign, DecryptorStatus, CyberTargetType, RansomwareVariant } from '@/types';

import { CampaignDetailModal } from './CampaignDetailModal';

// Mock Data for Demostration
const MOCK_CAMPAIGNS: RansomwareCampaign[] = [
    {
        id: 'RW-2026-001',
        name: 'LockBit 4.0',
        variant: 'LOCKBIT',
        firstSeen: new Date('2025-11-15'),
        lastSeen: new Date(), // Now
        active: true,
        victimCount: 142,
        targetSectors: ['FINANCIAL', 'HEALTHCARE', 'INFRASTRUCTURE'],
        averageRansomDemandUSD: 2500000,
        encryptionMethod: 'AES-256 + RSA-4096',
        decryptorStatus: 'PARTIAL',
        decryptorLink: 'https://www.nomoreransom.org/en/decryption-tools.html',
        attributionConfidence: 0.95,
        description: 'Advanced RaaS group targeting high-value infrastructure. Uses double extortion tactics.',
        iocIndicators: ['185.243.112.55', 'lockbit_4_encryptor.exe', '0x7e4a9c... wallet']
    },
    {
        id: 'RW-2026-002',
        name: 'BlackCat/ALPHV Resurgence',
        variant: 'BLACKCAT',
        firstSeen: new Date('2026-01-10'),
        lastSeen: new Date(),
        active: true,
        victimCount: 28,
        targetSectors: ['ENERGY', 'TRANSPORT'],
        averageRansomDemandUSD: 5000000,
        encryptionMethod: 'Rust-based bespoke encryption',
        decryptorStatus: 'NONE',
        attributionConfidence: 0.88,
        description: 'Rebranded variant targeting critical energy sectors in East Africa.',
        iocIndicators: ['phishing-campaign-ke.com', 'rust_payload_v2.bin']
    },
    {
        id: 'RW-2025-045',
        name: 'Akira Legacy',
        variant: 'AKIRA',
        firstSeen: new Date('2025-06-20'),
        lastSeen: new Date('2025-12-01'),
        active: false,
        victimCount: 89,
        targetSectors: ['GOVERNMENT', 'TELECOM'],
        averageRansomDemandUSD: 500000,
        encryptionMethod: 'ChaCha20',
        decryptorStatus: 'AVAILABLE',
        decryptorLink: 'https://www.nomoreransom.org/en/decryption-tools.html',
        attributionConfidence: 0.92,
        description: 'Previously active group, now largely dormant following law enforcement action.',
        iocIndicators: ['192.168.1.102', 'akira_decrypt.exe']
    }
];

const DECRYPTOR_STYLES: Record<DecryptorStatus, string> = {
    AVAILABLE: 'bg-green-500/20 text-green-400 border-green-500/50',
    PARTIAL: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
    NONE: 'bg-red-500/20 text-red-400 border-red-500/50',
    UNKNOWN: 'bg-gray-500/20 text-gray-400 border-gray-500/50',
};

const SECTOR_COLORS: Record<CyberTargetType, string> = {
    GOVERNMENT: 'text-purple-400',
    FINANCIAL: 'text-green-400',
    INFRASTRUCTURE: 'text-orange-400',
    HEALTHCARE: 'text-red-400',
    TELECOM: 'text-blue-400',
    ENERGY: 'text-yellow-400',
    TRANSPORT: 'text-cyan-400',
};

export function RansomwareTracker() {
    const [selectedCampaign, setSelectedCampaign] = React.useState<RansomwareCampaign | null>(null);

    return (
        <div className={`h-full flex flex-col ${DesignSystem.layout.cardShadow} bg-black/40 border border-gray-800/50`}>
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <h2 className="text-lg font-bold text-gray-100 tracking-wide font-mono">
                        RANSOMWARE INTELLIGENCE
                    </h2>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                    <Activity className="w-3 h-3 animate-pulse text-red-500" />
                    <span>LIVE TRACKING</span>
                </div>
            </div>

            {/* Campaign List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {MOCK_CAMPAIGNS.map((campaign) => (
                    <div
                        key={campaign.id}
                        onClick={() => setSelectedCampaign(campaign)}
                        className={`group relative p-4 border rounded-lg transition-all duration-300 cursor-pointer
                            ${campaign.active
                                ? 'border-red-900/40 bg-red-950/10 hover:border-red-700/60 hover:bg-red-900/20'
                                : 'border-gray-800 bg-gray-900/20 opacity-70 hover:opacity-100 hover:border-gray-700'
                            }`}
                    >
                        {/* Title Row */}
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-md font-bold text-gray-200 font-mono group-hover:text-red-400 transition-colors">
                                        {campaign.name}
                                    </h3>
                                    {campaign.active && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-600/20 text-red-500 border border-red-600/30 rounded animate-pulse">
                                            ACTIVE
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-gray-500 font-mono">ID: {campaign.id}</span>
                            </div>

                            {/* Decryptor Status Badge */}
                            <div className={`px-2 py-1 rounded border text-[10px] font-bold flex items-center gap-1.5 ${DECRYPTOR_STYLES[campaign.decryptorStatus]}`}>
                                {campaign.decryptorStatus === 'AVAILABLE' ? <Unlock className="w-3 h-3" /> : <LockKeyhole className="w-3 h-3" />}
                                <span>DECRYPTOR: {campaign.decryptorStatus}</span>
                            </div>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                            <div className="bg-black/40 rounded p-2 border border-gray-800/50">
                                <span className="text-gray-500 block mb-1 font-mono">VICTIM COUNT</span>
                                <div className="flex items-end gap-1">
                                    <span className="text-lg font-bold text-gray-200">{campaign.victimCount}</span>
                                    <TrendingUp className="w-3 h-3 text-red-400 mb-1.5" />
                                </div>
                            </div>
                            <div className="bg-black/40 rounded p-2 border border-gray-800/50">
                                <span className="text-gray-500 block mb-1 font-mono">AVG RANSOM</span>
                                <span className="text-lg font-bold text-green-400 font-mono">
                                    ${(campaign.averageRansomDemandUSD / 1000000).toFixed(1)}M
                                </span>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-gray-400 mb-3 leading-relaxed border-l-2 border-gray-700 pl-2">
                            {campaign.description}
                        </p>

                        {/* Footer (Sectors & Links) */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-800/50">
                            <div className="flex flex-wrap gap-1.5">
                                {campaign.targetSectors.map((sector) => (
                                    <span
                                        key={sector}
                                        className={`text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-900 border border-gray-800 ${SECTOR_COLORS[sector] || 'text-gray-400'}`}
                                    >
                                        {sector}
                                    </span>
                                ))}
                            </div>

                            <div className="flex items-center gap-1 text-[10px] text-gray-500 group-hover:text-gray-300">
                                <span>View Intelligence</span>
                                <Activity className="w-3 h-3" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Warning Footer */}
            <div className="p-3 bg-red-950/20 border-t border-red-900/30 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-red-300/80 leading-tight font-mono">
                    CAUTION: Do not interact with ransomware negotiation sites directly from this terminal.
                    Use an isolated sandbox environment for further investigation.
                </p>
            </div>

            {/* Details Modal */}
            {selectedCampaign && (
                <CampaignDetailModal
                    campaign={selectedCampaign}
                    onClose={() => setSelectedCampaign(null)}
                />
            )}
        </div>
    );
}
