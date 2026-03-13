'use client';

import React, { useState, useEffect } from 'react';
import { MousePointer2 } from 'lucide-react';
import { getAblyClient } from '@/lib/nctirs/ably';
import * as Ably from 'ably';

// Fallback "Ghost" Users for Demo Simulation
const GHOST_USERS = [
    { id: 'u1', name: 'Commander.Kibara [DCI]', color: '#ef4444' }, // Red
    { id: 'u2', name: 'Analyst.Wanjiku [NIS]', color: '#3b82f6' },  // Blue
    { id: 'u3', name: 'Eng.Otieno [KPLC]', color: '#eab308' },      // Yellow
];

interface CursorPosition {
    id: string;
    x: number;
    y: number;
    name?: string;
    color?: string;
}

const MultiplayerSession: React.FC = () => {
    const [cursors, setCursors] = useState<CursorPosition[]>([]);
    const [status, setStatus] = useState<'CONNECTING' | 'LIVE' | 'SIMULATION'>(() => {
        return getAblyClient() ? 'CONNECTING' : 'SIMULATION';
    });
    const [myId] = useState(() => `user-${Math.random().toString(36).substr(2, 5)}`);

    const startGhostSimulation = () => {
        // Initialize random positions
        setCursors(GHOST_USERS.map(u => ({ id: u.id, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, name: u.name, color: u.color })));

        const interval = setInterval(() => {
            setCursors(prev => prev.map(cursor => ({
                ...cursor,
                x: Math.max(0, Math.min(100, cursor.x + (Math.random() - 0.5) * 5)),
                y: Math.max(0, Math.min(100, cursor.y + (Math.random() - 0.5) * 5))
            })));
        }, 100); // Update every 100ms for smooth-ish animation

        return () => clearInterval(interval);
    };

    useEffect(() => {
        const ably = getAblyClient();

        if (!ably) {
            // FALLBACK: Start Ghost Simulation if no API Key
            console.log('Using Ghost Simulation Mode');
            // Defer execution to avoid sync state update warning
            setTimeout(() => startGhostSimulation(), 0);
            return;
        }

        // REAL-TIME: Ably Logic
        let channel: Ably.RealtimeChannel;

        const initAbly = async () => {
            try {
                await ably.connection.once('connected');
                setStatus('LIVE');
                channel = ably.channels.get('nctirs-collaboration');

                // Subscribe to cursor moves
                await channel.subscribe('cursor', (message) => {
                    const { id, x, y, name, color } = message.data;
                    if (id === myId) return; // Ignore self

                    setCursors(prev => {
                        const others = prev.filter(c => c.id !== id);
                        return [...others, { id, x, y, name, color }];
                    });
                });

                // Publish my cursor
                const handleMouseMove = (e: MouseEvent) => {
                    const x = (e.clientX / window.innerWidth) * 100;
                    const y = (e.clientY / window.innerHeight) * 100;

                    channel.publish('cursor', {
                        id: myId,
                        x,
                        y,
                        // Assign random identity for demo purposes if not set
                        name: 'Operator.You',
                        color: '#10b981' // Green for self (though we don't render self)
                    });
                };

                window.addEventListener('mousemove', handleMouseMove);

                return () => {
                    window.removeEventListener('mousemove', handleMouseMove);
                    channel.unsubscribe();
                };

            } catch (err) {
                console.error('Ably connection failed, falling back to simulation', err);
                setStatus('SIMULATION');
                startGhostSimulation();
            }
        };

        const cleanupPromise = initAbly();

        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
            // Intentionally not closing ably instance to reuse connection, 
            // but in a strict cleanup we might.
        };


    }, [myId]);



    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 mix-blend-screen">
            {/* Render cursors (Ghosts or Real) */}
            {cursors.map((cursor) => (
                <div
                    key={cursor.id}
                    className="absolute transition-all duration-[2000ms] ease-in-out flex flex-col items-start opacity-70"
                    style={{
                        left: `${cursor.x}%`,
                        top: `${cursor.y}%`,
                        transitionDuration: status === 'LIVE' ? '100ms' : '2000ms' // Smoother for real, floaty for ghost
                    }}
                >
                    <MousePointer2
                        className="w-4 h-4 -rotate-12"
                        fill={cursor.color || '#fff'}
                        color={cursor.color || '#fff'}
                    />
                    <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-3 mt-1 whitespace-nowrap text-white"
                        style={{ backgroundColor: cursor.color || '#555' }}
                    >
                        {cursor.name || 'Unknown'}
                    </span>
                </div>
            ))}

            {/* Session Indicator */}
            <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
                <div className="bg-black/80 border border-gray-700 rounded p-2 text-xs font-mono text-gray-400">
                    <div className="flex items-center gap-2 mb-1 border-b border-gray-800 pb-1">
                        <span className={`w-2 h-2 rounded-full ${status === 'LIVE' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`}></span>
                        {status === 'LIVE' ? 'LIVE SESSION (ABLY)' : 'SIMULATION MODE'}
                    </div>
                    {/* List active users (Merged list of ghosts or real users) */}
                    {cursors.map(u => (
                        <div key={u.id} className="flex items-center gap-2 py-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }}></span>
                            <span>{u.name}</span>
                        </div>
                    ))}
                    {status === 'LIVE' && (
                        <div className="flex items-center gap-2 py-0.5 opacity-50">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            <span>You</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MultiplayerSession;
