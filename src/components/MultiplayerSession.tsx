'use client';

import React, { useState, useEffect } from 'react';
import { MousePointer2 } from 'lucide-react';

const users = [
    { id: 'u1', name: 'Commander.Kibara [DCI]', color: '#ef4444' }, // Red
    { id: 'u2', name: 'Analyst.Wanjiku [NIS]', color: '#3b82f6' },  // Blue
    { id: 'u3', name: 'Eng.Otieno [KPLC]', color: '#eab308' },      // Yellow
];

const MultiplayerSession: React.FC = () => {
    const [cursors, setCursors] = useState<{ id: string, x: number, y: number }[]>([]);

    useEffect(() => {
        // Initialize random positions
        const timer = setTimeout(() => {
            setCursors(users.map(u => ({ id: u.id, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10 })));
        }, 0);

        const interval = setInterval(() => {
            setCursors(prev => prev.map(cursor => ({
                ...cursor,
                x: Math.max(0, Math.min(100, cursor.x + (Math.random() * 10 - 5))),
                y: Math.max(0, Math.min(100, cursor.y + (Math.random() * 10 - 5))),
            })));
        }, 2000);



        return () => {
            clearInterval(interval);
            clearTimeout(timer);
        };
    }, []);

    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-50 mix-blend-screen">
            {/* Render simulated cursors */}
            {cursors.map((cursor) => {
                const user = users.find(u => u.id === cursor.id);
                if (!user) return null;

                return (
                    <div
                        key={cursor.id}
                        className="absolute transition-all duration-[2000ms] ease-in-out flex flex-col items-start opacity-70"
                        style={{
                            left: `${cursor.x}%`,
                            top: `${cursor.y}%`,
                        }}
                    >
                        <MousePointer2
                            className="w-4 h-4 -rotate-12"
                            fill={user.color}
                            color={user.color}
                        />
                        <span
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-3 mt-1 whitespace-nowrap text-white"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.name}
                        </span>
                    </div>
                );
            })}

            <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto">
                <div className="bg-black/80 border border-gray-700 rounded p-2 text-xs font-mono text-gray-400">
                    <div className="flex items-center gap-2 mb-1 border-b border-gray-800 pb-1">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        ACTIVE SESSION
                    </div>
                    {users.map(u => (
                        <div key={u.id} className="flex items-center gap-2 py-0.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: u.color }}></span>
                            <span>{u.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MultiplayerSession;
