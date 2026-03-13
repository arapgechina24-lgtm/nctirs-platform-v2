'use client';

import React, { useState, useEffect } from 'react';
import {
    Brain,
    Zap,
    Activity,
    GitBranch,
    Database,
    ShieldCheck,
    Cpu
} from 'lucide-react';
import { DesignSystem } from '@/lib/nctirs/designSystem';
import { generateCyberThreats } from '@/lib/nctirs/mockData';

const mockThreats = generateCyberThreats(10);

// Mock ML Pipeline Stages
const PIPELINE_STAGES = [
    { id: 'INGEST', name: 'Data Ingestion', icon: Database, status: 'PROCESSING' },
    { id: 'FEATURE', name: 'Feature Extraction', icon: Zap, status: 'COMPLETED' },
    { id: 'INFERENCE', name: 'Model Inference', icon: Brain, status: 'COMPLETED' },
    { id: 'DECISION', name: 'Threat Scoring', icon: Activity, status: 'COMPLETED' },
];

export function ThreatPredictionPanel({ aiProvider = 'gemini' }: { aiProvider?: string }) {
    const [activeStage, setActiveStage] = useState(0);
    const [currentPrediction, setCurrentPrediction] = useState(mockThreats[0]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [aiAnalysis, setAiAnalysis] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Simulate pipeline animation
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStage(prev => (prev + 1) % PIPELINE_STAGES.length);
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    // Simulate switching predictions & Trigger Real AI
    useEffect(() => {
        const interval = setInterval(() => {
            const randomThreat = mockThreats[Math.floor(Math.random() * mockThreats.length)];
            setCurrentPrediction(randomThreat);
            setAiAnalysis(null); // Reset analysis
        }, 8000); // Slower rotation to allow for API call
        return () => clearInterval(interval);
    }, []);

    // Trigger AI Analysis when entering "INFERENCE" stage (index 2)
    useEffect(() => {
        if (activeStage === 2 && !aiAnalysis && !isAnalyzing) {
            const fetchAnalysis = async () => {
                setIsAnalyzing(true);
                try {
                    const response = await fetch('/api/ai/analyze', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'threat',
                            data: {
                                name: currentPrediction.name,
                                type: currentPrediction.type,
                                severity: currentPrediction.severity,
                                description: `Detected anomaly in ${currentPrediction.targetSector} sector.`,
                                targetSector: currentPrediction.targetSector,
                            },
                            provider: aiProvider,
                        })
                    });
                    const result = await response.json();
                    if (result.success) {
                        setAiAnalysis(result.analysis);
                    }
                } catch (error) {
                    console.error('AI Analysis failed:', error);
                } finally {
                    setIsAnalyzing(false);
                }
            };
            fetchAnalysis();
        }
    }, [activeStage, currentPrediction, aiAnalysis, isAnalyzing, aiProvider]);

    const confidenceScore = aiAnalysis?.riskAssessment?.confidenceScore
        ? Math.round(aiAnalysis.riskAssessment.confidenceScore * 100)
        : (currentPrediction.aiConfidence || 85);

    const isHighRisk = confidenceScore > 80;
    const isRealAI = aiAnalysis?.source === 'gemini' || aiAnalysis?.source === 'anthropic';
    const activeModel = aiAnalysis?.source === 'anthropic' ? 'CLAUDE-3-OPUS' : 'GEMINI-2.0-FLASH';

    return (
        <div className={`h-full flex flex-col ${DesignSystem.layout.cardShadow} bg-black/40 border border-cyan-900/50`}>
            {/* Header */}
            <div className="p-4 border-b border-cyan-900/30 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-cyan-400" />
                    <h2 className="text-lg font-bold text-gray-100 tracking-wide font-mono">
                        THREAT PREDICTION ENGINE
                    </h2>
                </div>
                <div className={`flex items-center gap-2 px-2 py-1 rounded text-xs font-mono border transition-colors duration-500
                    ${isRealAI
                        ? 'bg-purple-900/40 border-purple-500/50 text-purple-300 shadow-[0_0_10px_purple]'
                        : 'bg-cyan-900/20 border-cyan-700/30 text-cyan-400'}`}>
                    {isRealAI ? <Zap className="w-3 h-3 animate-pulse text-purple-400" /> : <Cpu className="w-3 h-3" />}
                    <span>{isRealAI ? `MODEL: ${activeModel}` : 'MODEL: SENTINEL-V2.1 (SIM)'}</span>
                </div>
            </div>

            {/* Pipeline Visualizer */}
            <div className="p-4 bg-cyan-950/10 border-b border-cyan-900/30">
                <div className="flex items-center justify-between relative px-2">
                    {/* Connecting Line */}
                    <div className="absolute top-1/2 left-0 w-full h-0.5 bg-cyan-900/30 -z-10" />

                    {PIPELINE_STAGES.map((stage, index) => {
                        const isActive = index === activeStage;
                        return (
                            <div key={stage.id} className="flex flex-col items-center gap-2 bg-black/60 p-2 rounded-lg border border-transparent transition-all duration-300">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-500
                                    ${isActive
                                        ? 'bg-cyan-500/20 border-cyan-400 text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.3)] scale-110'
                                        : 'bg-gray-900 border-gray-700 text-gray-500'
                                    }`}>
                                    {stage.id === 'INFERENCE' && isAnalyzing ? (
                                        <Zap className="w-4 h-4 animate-spin text-yellow-400" />
                                    ) : (
                                        <stage.icon className="w-4 h-4" />
                                    )}
                                </div>
                                <span className={`text-[9px] font-mono uppercase transition-colors ${isActive ? 'text-cyan-400' : 'text-gray-600'}`}>
                                    {stage.name}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Prediction Output */}
            <div className="flex-1 p-4 grid grid-cols-2 gap-4">
                {/* Confidence Meter */}
                <div className="flex flex-col items-center justify-center p-4 bg-black/40 border border-gray-800 rounded-lg relative overflow-hidden">
                    <div className="absolute inset-0 bg-cyan-500/5 pulse-slow" />
                    <div className="relative z-10 text-center">
                        <div className="text-xs text-gray-400 font-mono mb-2 uppercase tracking-widest">Threat Probability</div>
                        <div className={`text-5xl font-bold font-mono tracking-tighter mb-1
                            ${isHighRisk ? 'text-red-500 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]' : 'text-cyan-400'}`}>
                            {confidenceScore}%
                        </div>
                        <div className={`text-xs px-2 py-0.5 rounded border inline-block font-mono
                            ${isHighRisk
                                ? 'bg-red-900/30 border-red-500/50 text-red-400'
                                : 'bg-cyan-900/30 border-cyan-500/50 text-cyan-400'}`}>
                            {isHighRisk ? 'CRITICAL CONFIDENCE' : 'MODERATE CONFIDENCE'}
                        </div>
                    </div>
                </div>

                {/* Latest Analyzed Threat */}
                <div className="space-y-3">
                    <div className="text-xs font-bold text-gray-400 font-mono uppercase border-b border-gray-800 pb-1">
                        Currently Analyzing
                    </div>
                    <div className="p-3 bg-gray-900/30 border border-gray-800 rounded">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-gray-300 font-bold">{currentPrediction.id}</span>
                            <span className="text-[10px] text-gray-500">{currentPrediction.type}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 leading-snug mb-2 line-clamp-2">
                            {aiAnalysis ? aiAnalysis.summary : currentPrediction.name}
                        </div>
                        <div className="flex items-center gap-2">
                            <GitBranch className="w-3 h-3 text-purple-400" />
                            <span className="text-[10px] text-purple-300 font-mono">
                                Vector: {aiAnalysis?.attackVectorAnalysis?.mitreId || 'Analyzing...'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 p-2 rounded bg-green-900/10 border border-green-900/30">
                        <ShieldCheck className="w-4 h-4 text-green-500" />
                        <span className="text-[10px] text-green-400 font-mono">
                            {isRealAI ? 'AI Verification Complete' : 'Auto-Response Ready'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer Status */}
            <div className="p-2 border-t border-cyan-900/30 bg-cyan-950/20 text-center">
                <span className="text-[10px] text-cyan-300/70 font-mono flex items-center justify-center gap-2">
                    <Activity className="w-3 h-3" />
                    {isRealAI ? `Latency: ${aiAnalysis?.source === 'anthropic' ? '850ms (Claude API)' : '240ms (Gemini API)'}` : 'Processing 1.4M events/sec • Latency: 12ms'}
                </span>
            </div>
        </div>
    );
}
