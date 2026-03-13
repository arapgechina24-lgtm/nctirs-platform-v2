// components/Security/EmergencyOverlay.tsx
'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { NC4IncidentReport } from '@/lib/nctirs/soar-logic';

interface EmergencyOverlayProps {
    isActive: boolean;
    onMitigate: () => Promise<NC4IncidentReport> | NC4IncidentReport;
    onDismiss?: () => void;
    targetAsset: string;
}

export default function EmergencyOverlay({ isActive, onMitigate, onDismiss, targetAsset }: EmergencyOverlayProps) {
    const [mounted, setMounted] = useState(false);
    const [sentPacket, setSentPacket] = useState<NC4IncidentReport | null>(null);
    const [receiptId, setReceiptId] = useState<string>("");

    useEffect(() => {
        setTimeout(() => setMounted(true), 0);
    }, []);

    useEffect(() => {
        if (isActive) {
            // Reset state on activation
            setTimeout(() => {
                setSentPacket(null);
                setReceiptId("");
            }, 0);

            // Audio cue for hackathon judges
            const alertAudio = new Audio('/emergency-siren.mp3');
            alertAudio.loop = true;
            alertAudio.play().catch(() => console.log("Audio blocked by browser"));

            // Voice narration using Web Speech API
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(
                    `National Emergency Protocol Activated. ${targetAsset} is under critical threat. Initiating Air Gap isolation sequence.`
                );
                utterance.rate = 0.9;
                utterance.pitch = 0.8;
                utterance.volume = 1;
                // Try to get a robotic voice
                const voices = speechSynthesis.getVoices();
                const robotVoice = voices.find(v => v.name.includes('Google') || v.name.includes('English'));
                if (robotVoice) utterance.voice = robotVoice;
                speechSynthesis.speak(utterance);
            }

            return () => {
                alertAudio.pause();
                speechSynthesis.cancel();
            };
        }
    }, [isActive, targetAsset]);

    const handleMitigationClick = async () => {
        // Execute the mitigation logic from parent
        const report = await onMitigate();
        setSentPacket(report);
        setReceiptId(`KC-${Math.random().toString(36).substr(2, 9).toUpperCase()}`);
    };

    const handleClose = () => {
        if (onDismiss) onDismiss();
    };

    if (!isActive || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-red-950/90 backdrop-blur-md font-mono">
            {/* Moving Scanline Effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="w-full h-1 bg-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-scanline" />
            </div>

            {/* Main Alert Content */}
            <div className="relative z-10 text-center px-6 max-w-4xl w-full flex flex-col items-center">
                <h1 className="text-6xl md:text-8xl font-black text-red-500 animate-glitch tracking-tighter uppercase mb-4">
                    National Emergency
                </h1>

                {!sentPacket ? (
                    <>
                        <div className="bg-black border-2 border-red-500 p-4 inline-block mb-12">
                            <p className="text-xl text-white">IMMINENT FAILURE DETECTED: <span className="text-red-400 font-bold">{targetAsset}</span></p>
                            <p className="text-sm text-red-500 mt-1 uppercase">Protocol: NC4-Sovereign-Defense-Alpha</p>
                        </div>

                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={handleMitigationClick}
                                className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-2xl font-bold border-4 border-white shadow-[0_0_20px_rgba(255,255,255,0.5)] transition-all hover:scale-105"
                            >
                                [ INITIATE EMERGENCY AIR-GAP ]
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="mt-8 bg-black/90 border-2 border-green-500 p-6 w-full max-w-3xl overflow-hidden shadow-[0_0_30px_rgba(34,197,94,0.3)] animate-in fade-in zoom-in duration-300">
                        <div className="text-xs text-green-400 mb-4 font-bold uppercase tracking-widest border-b border-green-800 pb-2 flex justify-between">
                            <span>&gt;&gt;&gt; TRANSMITTING NC4 COMPLIANCE PACKET...</span>
                            <span className="animate-pulse">● LIVE</span>
                        </div>
                        <pre className="text-[10px] md:text-xs text-green-500 whitespace-pre-wrap text-left font-mono h-64 overflow-y-auto mb-4 custom-scrollbar">
                            {JSON.stringify(sentPacket, null, 2)}
                        </pre>
                        <div className="mt-2 text-cyan-400 font-bold text-lg border-t border-green-800 pt-3 flex justify-between items-center">
                            <span>STATUS: SECURE ACKNOWLEDGEMENT RECEIVED</span>
                            <span className="text-sm bg-cyan-950/50 px-2 py-1 rounded border border-cyan-800">RECEIPT: {receiptId}</span>
                        </div>

                        <button
                            onClick={handleClose}
                            className="mt-6 w-full bg-green-900/30 hover:bg-green-800/40 text-green-400 border border-green-600 py-3 uppercase font-bold tracking-widest transition-colors"
                        >
                            System Secured - Return to Dashboard
                        </button>
                    </div>
                )}
            </div>

            {/* Background Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
        </div>,
        document.body
    );
}
