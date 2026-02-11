'use client';

import React from 'react';
import { X, Globe, Server, Hash, Calendar, Shield } from 'lucide-react';
import type { RansomwareCampaign } from '@/types';

interface CampaignDetailModalProps {
    campaign: RansomwareCampaign | null;
    onClose: () => void;
}

export function CampaignDetailModal({ campaign, onClose }: CampaignDetailModalProps) {
    if (!campaign) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-black border border-gray-700 rounded-lg shadow-2xl relative flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/30">
                    <div>
                        <h2 className="text-xl font-bold text-gray-100 font-mono flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-500" />
                            {campaign.name}
                        </h2>
                        <span className="text-xs text-gray-500 font-mono">ID: {campaign.id}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">

                    {/* Description */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 font-mono mb-2 uppercase">Profile</h3>
                        <p className="text-gray-300 text-sm leading-relaxed border-l-2 border-purple-500/50 pl-3">
                            {campaign.description}
                        </p>
                    </div>

                    {/* Technical Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-900/20 p-3 rounded border border-gray-800">
                            <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-mono uppercase">
                                <Server className="w-3 h-3" /> Encryption
                            </div>
                            <div className="text-gray-200 text-sm font-mono">{campaign.encryptionMethod}</div>
                        </div>
                        <div className="bg-gray-900/20 p-3 rounded border border-gray-800">
                            <div className="flex items-center gap-2 mb-2 text-gray-400 text-xs font-mono uppercase">
                                <Calendar className="w-3 h-3" /> First Seen
                            </div>
                            <div className="text-gray-200 text-sm font-mono">
                                {new Date(campaign.firstSeen).toLocaleDateString()}
                            </div>
                        </div>
                    </div>

                    {/* IOCs (Indicators of Compromise) */}
                    <div>
                        <h3 className="text-xs font-bold text-gray-400 font-mono mb-2 uppercase flex items-center gap-2">
                            <Hash className="w-3 h-3" />
                            Indicators of Compromise (IOCs)
                        </h3>
                        {campaign.iocIndicators && campaign.iocIndicators.length > 0 ? (
                            <div className="bg-black border border-gray-800 rounded p-2 font-mono text-xs space-y-1">
                                {campaign.iocIndicators.map((ioc, idx) => (
                                    <div key={idx} className="text-green-400/80 break-all select-all hover:bg-gray-900 px-1 rounded">
                                        {ioc}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-gray-600 text-xs italic">No public IOCs available at this classification level.</div>
                        )}
                    </div>

                    {/* Attribution & Links */}
                    <div className="flex items-center justify-between text-xs pt-4 border-t border-gray-800">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">Attribution Confidence:</span>
                            <div className="flex items-center gap-1">
                                <div className="w-20 h-2 bg-gray-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-500"
                                        style={{ width: `${(campaign.attributionConfidence || 0) * 100}%` }}
                                    />
                                </div>
                                <span className="text-blue-400 font-mono">{((campaign.attributionConfidence || 0) * 100).toFixed(0)}%</span>
                            </div>
                        </div>
                        {campaign.decryptorLink && (
                            <a
                                href={campaign.decryptorLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-blue-400 hover:underline"
                            >
                                <Globe className="w-3 h-3" />
                                External Report
                            </a>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}
