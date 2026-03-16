"use client"

import { useState, useEffect, useRef } from 'react'
import { Card } from "@/components/ui/card"
import { Terminal, Cpu, Lock, Activity, ShieldAlert, Wifi } from "lucide-react"

interface LogEntry {
    id: string;
    text: string;
    color: string;
    timestamp: string;
    type?: 'info' | 'alert' | 'success' | 'warning';
}

const REASONING_CHAINS = [
    [
        { text: "ANALYSING PACKET HEADER [TCP/443]...", color: "text-blue-500", delay: 800 },
        { text: "› DECRYPTING TLS 1.3 PAYLOAD", color: "text-blue-400", delay: 600 },
        { text: "› PATTERN MATCH: MINT SANDSTORM (APT-35)", color: "text-orange-500 font-bold", delay: 800 },
        { text: "› CONFIDENCE SCORE: 99.8%", color: "text-cyan-400", delay: 400 },
        { text: "› ACTION: AUTO-BLOCK SOURCE IP", color: "text-red-500 font-bold", delay: 1000 }
    ],
    [
        { text: "MONITORING OUTBOUND TRAFFIC...", color: "text-green-600", delay: 1000 },
        { text: "› ANOMALY: DATA EXFILTRATION DETECTED", color: "text-red-400", delay: 800 },
        { text: "› DESTINATION: UNKNOWN SERVER (RU)", color: "text-yellow-500", delay: 600 },
        { text: "› QUANTUM ENCRYPTION ENGAGED", color: "text-purple-400", delay: 800 },
        { text: "› CONNECTION SEVERED", color: "text-green-500 font-bold", delay: 1000 }
    ],
    [
        { text: "SCANNING CNI GRID (NAIROBI NODE)...", color: "text-blue-500", delay: 1200 },
        { text: "› VOLTAGE FLUCTUATION DETECTED", color: "text-yellow-600", delay: 600 },
        { text: "› SOURCE: INDUSTRIAL CONTROL SYSTEM", color: "text-orange-400", delay: 700 },
        { text: "› RE-ROUTING POWER LOAD...", color: "text-blue-300", delay: 900 },
        { text: "› GRID STABILITY RESTORED", color: "text-green-500", delay: 1000 }
    ],
    [
        { text: "BIOMETRIC SCAN INITIATED...", color: "text-cyan-600", delay: 1000 },
        { text: "› FACIAL RECOGNITION: MATCHING...", color: "text-cyan-500", delay: 800 },
        { text: "› IDENTITY VERIFIED: DIRECTOR GENERAL", color: "text-green-400", delay: 500 },
        { text: "› ACCESS GRANTED: LEVEL 5", color: "text-green-500 font-bold", delay: 1000 }
    ]
];

export function AIConsole() {
    const [logs, setLogs] = useState<LogEntry[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)
    const processingRef = useRef(false)

    useEffect(() => {
        // Initial logs
        setLogs([
            { id: 'init-1', text: "NEURAL CORE INITIALIZED...", color: "text-green-600", timestamp: new Date().toLocaleTimeString() },
            { id: 'init-2', text: "CONNECTING TO KDF-SAT-1...", color: "text-green-600", timestamp: new Date().toLocaleTimeString() },
            { id: 'init-3', text: "DEFENSIVE SUB-ROUTINES ACTIVE.", color: "text-green-500", timestamp: new Date().toLocaleTimeString() }
        ])

        const triggerChain = async () => {
            if (processingRef.current) return;
            processingRef.current = true;

            const chain = REASONING_CHAINS[Math.floor(Math.random() * REASONING_CHAINS.length)];

            for (const step of chain) {
                await new Promise(r => setTimeout(r, step.delay));

                const timestamp = new Date().toLocaleTimeString('en-GB', { hour12: false }) + `.${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`;

                setLogs(prev => {
                    const newLogs = [...prev, {
                        id: Math.random().toString(36),
                        text: step.text,
                        color: step.color,
                        timestamp
                    }];
                    if (newLogs.length > 50) newLogs.shift();
                    return newLogs;
                });
            }

            processingRef.current = false;
        };

        const interval = setInterval(() => {
            if (!processingRef.current && Math.random() > 0.3) {
                triggerChain();
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [logs])

    return (
        <Card className="bg-black border border-green-900/50 font-mono text-[10px] md:text-xs flex flex-col h-full min-h-[300px] overflow-hidden shadow-[0_0_15px_rgba(0,255,0,0.05)]">
            {/* Header */}
            <div className="bg-green-950/20 border-b border-green-900/50 p-2 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 text-green-400">
                    <Terminal size={14} />
                    <span className="font-bold tracking-wider">AI_REASONING_CORE // MAJESTIC</span>
                </div>
                <div className="flex gap-3 text-[9px] text-green-700">
                    <span className="flex items-center gap-1"><Activity size={10} className="animate-pulse" /> PROCESSING</span>
                    <span className="flex items-center gap-1"><Cpu size={10} /> 128-CORE</span>
                    <span className="flex items-center gap-1"><Lock size={10} /> ENCRYPTED</span>
                </div>
            </div>

            {/* Log Window */}
            <div
                ref={scrollRef}
                className="flex-1 p-3 overflow-y-auto space-y-1.5 scrollbar-thin scrollbar-thumb-green-900/50 scrollbar-track-transparent"
            >
                {logs.map((log) => (
                    <div key={log.id} className={`${log.color} font-mono leading-tight whitespace-nowrap flex gap-2`}>
                        <span className="text-green-900 shrink-0 select-none">[{log.timestamp}]</span>
                        <span className="truncate">{log.text}</span>
                    </div>
                ))}

                {/* Cursor Blinking */}
                <div className="flex items-center text-green-500 animate-pulse mt-2">
                    <span className="mr-2">&gt;</span>
                    <span className="w-2 h-4 bg-green-500 inline-block shadow-[0_0_8px_rgba(0,255,0,0.8)]"></span>
                </div>
            </div>

            {/* Status Footer */}
            <div className="bg-black border-t border-green-900/30 p-1.5 flex justify-between items-center text-[9px] text-green-800 uppercase tracking-widest shrink-0">
                <div>Mem: 64TB / 128TB</div>
                <div>Latency: 2ms</div>
            </div>
        </Card>
    )
}
