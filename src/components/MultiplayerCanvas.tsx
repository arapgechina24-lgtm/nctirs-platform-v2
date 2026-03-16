'use client'

import { useState, useEffect, useRef } from 'react'
import * as Ably from 'ably'
import { AblyProvider, useChannel, usePresence } from 'ably/react'
import { Send, Users, Activity, ShieldCheck, MousePointer2 } from 'lucide-react'

// Types
interface Cursor {
    id: string;
    x: number;
    y: number;
    name: string;
    color: string;
    agency: string;
}

interface ChatMessage {
    id: string;
    user: string;
    agency: string;
    text: string;
    timestamp: string;
    isSystem?: boolean;
}

// Ghost Agents for Simulation
const GHOST_AGENTS = [
    { name: 'Eng. Ochieng', agency: 'Ministry of Energy', color: '#ef4444' }, // Red
    { name: 'Director Kamau', agency: 'NIS HQ', color: '#3b82f6' },        // Blue
];

const GHOST_SCRIPT = [
    { delay: 2000, type: 'join', agentIdx: 0 },
    { delay: 3500, type: 'move', agentIdx: 0, x: 45, y: 30 }, // Move to critical area
    { delay: 4500, type: 'chat', agentIdx: 0, text: "I'm seeing a voltage spike at Seven Forks. Confirming grid stability." },
    { delay: 6000, type: 'join', agentIdx: 1 },
    { delay: 7500, type: 'move', agentIdx: 1, x: 50, y: 35 },
    { delay: 8500, type: 'chat', agentIdx: 1, text: "Confirmed. We have a matching signature on the dark web filters. This is coordinated." },
    { delay: 10500, type: 'move', agentIdx: 0, x: 80, y: 80 }, // Move to 'Action' button
    { delay: 11500, type: 'chat', agentIdx: 0, text: "Initiating isolate protocol on Sector 4." },
    { delay: 13000, type: 'system', text: "⚠ SECTOR 4 ISOLATED BY MINISTRY OF ENERGY" },
];

export function MultiplayerCanvas() {
    // State
    const [cursors, setCursors] = useState<Cursor[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [connectionStatus, setConnectionStatus] = useState<'CONNECTING' | 'CONNECTED' | 'SIMULATION'>('CONNECTING');
    const [myId] = useState(`local-${Math.random().toString(36).substr(2, 5)}`);

    // Simulation Ref
    const simulationTime = useRef(0);

    // Initialize Simulation (Fallback)
    useEffect(() => {
        // In a real app, we'd try to connect to Ably here.
        // For this MVP Hackathon demo, we default significantly to Simulation to guarantee the "Show"
        // unless an API key is strictly provided.

        const startSimulation = () => {
            setConnectionStatus('SIMULATION');
            setMessages([{
                id: 'sys-init',
                user: 'System',
                agency: 'NCTIRS',
                text: 'Secure Channel Established. Waiting for agency partners...',
                timestamp: new Date().toLocaleTimeString(),
                isSystem: true
            }]);

            const startTime = Date.now();

            const interval = setInterval(() => {
                const elapsed = Date.now() - startTime;

                // Process Script
                GHOST_SCRIPT.forEach(step => {
                    if (elapsed >= step.delay && elapsed < step.delay + 500) {
                        // Execute Step (deduped by time window)
                        executeGhostStep(step);
                    }
                });

                // Animate Random Cursor Movements for active ghosts
                if (Math.random() > 0.8) {
                    setCursors(prev => prev.map(c => ({
                        ...c,
                        x: c.x + (Math.random() - 0.5) * 5,
                        y: c.y + (Math.random() - 0.5) * 5
                    })));
                }

            }, 500);

            return () => clearInterval(interval);
        };

        const timer = setTimeout(startSimulation, 1000); // 1s connection timeout simulation
        return () => clearTimeout(timer);
    }, []);

    const executeGhostStep = (step: any) => {
        if (step.type === 'join') {
            const agent = GHOST_AGENTS[step.agentIdx];
            setCursors(prev => {
                if (prev.find(c => c.name === agent.name)) return prev;
                return [...prev, {
                    id: `ghost-${step.agentIdx}`,
                    name: agent.name,
                    agency: agent.agency,
                    color: agent.color,
                    x: Math.random() * 80 + 10,
                    y: Math.random() * 80 + 10
                }];
            });
            addSystemMessage(`${agent.name} (${agent.agency}) joined the session.`);
        } else if (step.type === 'chat') {
            const agent = GHOST_AGENTS[step.agentIdx];
            addMessage(agent.name, agent.agency, step.text);
        } else if (step.type === 'move') {
            setCursors(prev => prev.map((c, i) => {
                if (i === step.agentIdx) return { ...c, x: step.x, y: step.y };
                return c;
            }));
        } else if (step.type === 'system') {
            addSystemMessage(step.text);
        }
    };

    const addMessage = (user: string, agency: string, text: string) => {
        setMessages(prev => [...prev, {
            id: Math.random().toString(36),
            user,
            agency,
            text,
            timestamp: new Date().toLocaleTimeString()
        }]);
    };

    const addSystemMessage = (text: string) => {
        setMessages(prev => [...prev, {
            id: Math.random().toString(36),
            user: 'SYSTEM',
            agency: '',
            text,
            timestamp: new Date().toLocaleTimeString(),
            isSystem: true
        }]);
    };

    const handleSend = () => {
        if (!inputText.trim()) return;
        addMessage('Director General', 'Office of President', inputText);
        setInputText('');
    };

    return (
        <div className="flex flex-col h-full bg-black/80 border border-green-900/50 backdrop-blur-sm relative overflow-hidden">
            {/* Connection Status Header */}
            <div className="flex items-center justify-between p-2 border-b border-green-900/30 bg-green-950/20">
                <div className="flex items-center gap-2 text-[10px] uppercase font-bold tracking-wider text-green-400">
                    <Users size={12} />
                    <span>Joint Ops Channel</span>
                </div>
                <div className="flex items-center gap-2 text-[9px]">
                    <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'SIMULATION' ? 'bg-amber-500' : 'bg-green-500'} animate-pulse`}></span>
                    <span className="text-green-700">{connectionStatus === 'SIMULATION' ? 'SECURE_SIM_LINK' : 'LIVE_UPLINK'}</span>
                </div>
            </div>

            {/* Main Canvas Area - Placeholder for "Shared Object" */}
            <div className="flex-1 relative bg-[url('/grid.png')] bg-repeat opacity-20 hover:opacity-30 transition-opacity cursor-crosshair group">
                {/* Fake Collaborative Elements */}
                <div className="absolute top-1/4 left-1/4 w-32 h-20 border border-green-800/40 rounded flex items-center justify-center text-[9px] text-green-900 select-none">
                    SECTOR 1 (STABLE)
                </div>
                <div className="absolute top-1/3 right-1/4 w-32 h-20 border border-red-900/60 bg-red-950/10 rounded flex items-center justify-center text-[9px] text-red-500 font-bold animate-pulse select-none">
                    SECTOR 4 (BREACHED)
                </div>

                {/* Cursors */}
                {cursors.map(cursor => (
                    <div
                        key={cursor.id}
                        className="absolute transition-all duration-700 ease-in-out z-20 pointer-events-none"
                        style={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
                    >
                        <MousePointer2
                            size={16}
                            fill={cursor.color}
                            color={cursor.color}
                            className="transform -rotate-12"
                        />
                        <div
                            className="bg-black/50 backdrop-blur-md text-[8px] px-1.5 py-0.5 rounded ml-3 mt-1 whitespace-nowrap border"
                            style={{ borderColor: cursor.color, color: cursor.color }}
                        >
                            {cursor.name} <span className="opacity-70">| {cursor.agency}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Chat Area */}
            <div className="h-48 border-t border-green-900/50 flex flex-col bg-black">
                <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-thin scrollbar-thumb-green-900/50">
                    {messages.map(msg => (
                        <div key={msg.id} className={`text-[10px] ${msg.isSystem ? 'text-center my-2 opacity-70' : ''}`}>
                            {msg.isSystem ? (
                                <span className="text-yellow-500 font-mono">=== {msg.text} ===</span>
                            ) : (
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-2 mb-0.5">
                                        <span className="font-bold text-green-400">{msg.user}</span>
                                        <span className="text-[8px] text-green-800 uppercase tracking-tight">{msg.agency}</span>
                                        <span className="text-[8px] text-gray-600 ml-auto">{msg.timestamp}</span>
                                    </div>
                                    <div className={`p-1.5 rounded border-l-2 pl-2 ${msg.user === 'Director General' ? 'border-green-500 bg-green-900/10 text-green-100' : 'border-gray-700 text-gray-300'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Input */}
                <div className="p-2 border-t border-green-900/30 flex gap-2">
                    <input
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Broadcast secure message..."
                        className="flex-1 bg-green-950/10 border border-green-900/50 rounded px-2 py-1 text-[10px] text-green-400 focus:outline-none focus:border-green-500"
                    />
                    <button
                        onClick={handleSend}
                        className="p-1.5 bg-green-900/30 text-green-400 rounded hover:bg-green-800/50 border border-green-800/50"
                    >
                        <Send size={12} />
                    </button>
                </div>
            </div>
        </div>
    )
}
