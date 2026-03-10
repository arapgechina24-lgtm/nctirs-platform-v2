'use client';

import React, { useState, useEffect } from 'react';
import {
    ShieldAlert,
    Play,
    Pause,
    Settings,
    CheckCircle2,
    XCircle,
    Loader2,
    Lock
} from 'lucide-react';
import { DesignSystem } from '@/lib/nctirs/designSystem';
import { generateAutomatedResponses } from '@/lib/nctirs/mockData';
import { AutomatedResponse } from '@/types';

export function AutomatedResponseEngine() {
    const [responses, setResponses] = useState<AutomatedResponse[]>(() => generateAutomatedResponses(6));
    const [engineStatus, setEngineStatus] = useState<'ACTIVE' | 'PAUSED'>('ACTIVE');

    // Simulate incoming responses
    useEffect(() => {
        if (engineStatus === 'PAUSED') return;

        const interval = setInterval(() => {
            if (Math.random() > 0.7) return; // Only add sometimes

            const newResponse = generateAutomatedResponses(1)[0];
            setResponses(prev => [newResponse, ...prev].slice(0, 8));
        }, 5000);

        return () => clearInterval(interval);
    }, [engineStatus]);

    const handleAction = (id: string, action: 'APPROVE' | 'REJECT') => {
        setResponses(prev => prev.map(r => {
            if (r.id === id) {
                return {
                    ...r,
                    status: action === 'APPROVE' ? 'EXECUTING' : 'FAILED', // Simulating rejection as failed/cancelled
                    description: action === 'APPROVE' ? r.description : 'Action rejected by operator.'
                };
            }
            return r;
        }));

        // Simulate completion after approve
        if (action === 'APPROVE') {
            setTimeout(() => {
                setResponses(prev => prev.map(r => {
                    if (r.id === id) {
                        return { ...r, status: 'COMPLETED' };
                    }
                    return r;
                }));
            }, 3000);
        }
    };

    return (
        <div className={`h-full flex flex-col ${DesignSystem.layout.cardShadow} bg-black/40 border border-red-900/50`}>
            {/* Header */}
            <div className="p-4 border-b border-red-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-red-500" />
                    <h2 className="text-lg font-bold text-gray-100 tracking-wide font-mono">
                        AUTOMATED RESPONSE ENGINE
                    </h2>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setEngineStatus(prev => prev === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                        className={`px-3 py-1 rounded border text-xs font-mono flex items-center gap-2 transition-colors
                            ${engineStatus === 'ACTIVE'
                                ? 'bg-green-900/20 border-green-500/30 text-green-400 hover:bg-green-900/40'
                                : 'bg-yellow-900/20 border-yellow-500/30 text-yellow-400 hover:bg-yellow-900/40'}`}
                    >
                        {engineStatus === 'ACTIVE' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        {engineStatus === 'ACTIVE' ? 'ARMED' : 'DISARMED'}
                    </button>
                    <button className="p-1.5 rounded border border-gray-700 hover:bg-gray-800 text-gray-400">
                        <Settings className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Response List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {responses.map(response => (
                    <div
                        key={response.id}
                        className={`p-3 rounded border text-xs font-mono transition-all
                            ${response.status === 'PENDING' ? 'bg-yellow-950/20 border-yellow-900/50 animate-pulse' :
                                response.status === 'EXECUTING' ? 'bg-blue-950/20 border-blue-900/50' :
                                    response.status === 'COMPLETED' ? 'bg-green-950/10 border-green-900/30 opacity-70' :
                                        'bg-red-950/10 border-red-900/30 opacity-70'}`}
                    >
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-bold text-gray-200 flex items-center gap-2">
                                    {response.status === 'PENDING' && <Lock className="w-3 h-3 text-yellow-500" />}
                                    {response.status === 'EXECUTING' && <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />}
                                    {response.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-green-500" />}
                                    {response.status === 'FAILED' && <XCircle className="w-3 h-3 text-red-500" />}
                                    {response.responseType.replace(/_/g, ' ')}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5">
                                    Trigger: {response.triggerThreatId}
                                </div>
                            </div>
                            <div className="text-[10px] text-gray-500">
                                {new Date(response.timestamp).toLocaleTimeString()}
                            </div>
                        </div>

                        <p className="text-gray-400 mb-3 leading-snug">
                            {response.description}
                        </p>

                        {response.status === 'PENDING' && (
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => handleAction(response.id, 'APPROVE')}
                                    className="flex-1 bg-green-900/20 hover:bg-green-900/40 border border-green-700/50 text-green-400 py-1 rounded text-[10px] font-bold uppercase transition-colors"
                                >
                                    Authorize
                                </button>
                                <button
                                    onClick={() => handleAction(response.id, 'REJECT')}
                                    className="flex-1 bg-red-900/20 hover:bg-red-900/40 border border-red-700/50 text-red-400 py-1 rounded text-[10px] font-bold uppercase transition-colors"
                                >
                                    Reject
                                </button>
                            </div>
                        )}

                        {response.status === 'EXECUTING' && (
                            <div className="w-full bg-blue-900/20 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 animate-progress origin-left" style={{ width: '60%' }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
