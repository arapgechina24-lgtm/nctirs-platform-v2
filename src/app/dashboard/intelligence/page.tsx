'use client';

import React, { useState } from 'react';
import { BrainCircuit, Sparkles } from 'lucide-react';
import {
    RansomwareTracker,
    SovereignAIStatusPanel,
    FederatedLearningHub,
    RansomwareAnalytics,
    ThreatPredictionPanel,
    XAIPanel
} from '@/components/intelligence';
import AnomalyDetectionPanel from '@/components/intelligence/AnomalyDetectionPanel';
import { generateSovereignAIStatus, generateFederatedStatus } from '@/lib/mockData';

import type { RansomwareCampaign } from '@/types';

// Generate mock campaigns for analytics (replicating from RansomwareTracker for now, ideally shared)
// In a real app, this would come from a context or API.
const MOCK_CAMPAIGNS_ANALYTICS: Partial<RansomwareCampaign>[] = [
    {
        id: 'RW-2026-001',
        active: true,
        targetSectors: ['FINANCIAL', 'HEALTHCARE', 'INFRASTRUCTURE'],
        averageRansomDemandUSD: 2500000,
        encryptionMethod: 'AES-256 + RSA-4096'
    },
    {
        id: 'RW-2026-002',
        active: true,
        targetSectors: ['ENERGY', 'TRANSPORT'],
        averageRansomDemandUSD: 5000000,
        encryptionMethod: 'Rust-based bespoke encryption'
    },
    {
        id: 'RW-2025-045',
        active: false,
        targetSectors: ['GOVERNMENT', 'TELECOM'],
        averageRansomDemandUSD: 500000,
        encryptionMethod: 'ChaCha20'
    }
];

export default function IntelligencePage() {
    const [aiProvider, setAiProvider] = useState<string>('gemini');
    const sovereignStatus = generateSovereignAIStatus();
    const federatedStatus = generateFederatedStatus();

    return (
        <div className="p-6 space-y-6 h-full overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-2 flex-shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400 font-mono tracking-tight">
                        INTELLIGENCE OVERSIGHT
                    </h1>
                    <p className="text-gray-400 text-sm font-mono mt-1">
                        Real-time threat actor tracking, AI governance, and advanced analytics.
                    </p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-900/20 border border-purple-500/30 rounded text-xs font-mono text-purple-300">
                    <BrainCircuit className="w-4 h-4" />
                    <span>COGNITION LAYER ACTIVE</span>
                </div>
            </div>

            {/* AI Provider Toggle */}
            <div className="flex justify-end mb-4 px-2">
                <div className="flex items-center gap-3 bg-black/40 border border-gray-800 rounded-lg p-1">
                    <span className="text-xs text-gray-500 font-mono pl-2 uppercase tracking-wider">AI Model:</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => setAiProvider('gemini')}
                            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-2
                                ${aiProvider === 'gemini'
                                    ? 'bg-cyan-900/40 text-cyan-400 border border-cyan-700/50 shadow-[0_0_10px_rgba(34,211,238,0.2)]'
                                    : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Sparkles className="w-3 h-3" />
                            GEMINI 2.0
                        </button>
                        <button
                            onClick={() => setAiProvider('claude')}
                            className={`px-3 py-1.5 rounded text-xs font-mono transition-all flex items-center gap-2
                                ${aiProvider === 'claude'
                                    ? 'bg-purple-900/40 text-purple-400 border border-purple-700/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]'
                                    : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <BrainCircuit className="w-3 h-3" />
                            CLAUDE 3.5
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-0">

                {/* Column 1: Ransomware Campaign Tracking (4 cols) */}
                <div className="lg:col-span-4 h-full flex flex-col gap-6 overflow-hidden">
                    <div className="flex-1 min-h-[300px]">
                        <ThreatPredictionPanel aiProvider={aiProvider} />
                    </div>
                    <div className="flex-1 min-h-[200px]">
                        <RansomwareTracker />
                    </div>
                </div>

                {/* Column 2: Analytics & Negotiation (4 cols) */}
                <div className="lg:col-span-4 h-full flex flex-col gap-6 overflow-hidden">
                    <div className="flex-1 min-h-[300px]">
                        <XAIPanel />
                    </div>
                    <div className="flex-1 min-h-[300px]">
                        <RansomwareAnalytics campaigns={MOCK_CAMPAIGNS_ANALYTICS as RansomwareCampaign[]} />
                    </div>
                </div>

                {/* Column 3: AI Governance, Anomaly Detection & Federated Learning (4 cols) */}
                <div className="lg:col-span-4 h-full flex flex-col gap-6 overflow-y-auto">
                    <div className="flex-shrink-0">
                        <AnomalyDetectionPanel />
                    </div>
                    <div className="flex-1 min-h-[250px]">
                        <SovereignAIStatusPanel status={sovereignStatus} />
                    </div>
                    <div className="flex-1 min-h-[250px]">
                        <FederatedLearningHub status={federatedStatus} />
                    </div>
                </div>
            </div>
        </div>
    );
}
