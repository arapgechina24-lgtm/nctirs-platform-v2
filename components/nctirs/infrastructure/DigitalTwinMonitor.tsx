'use client';

import React, { useState, useEffect } from 'react';
import { DesignSystem } from '@/lib/nctirs/designSystem';
import { Shield, Server, Lock, Unlock, Wifi, WifiOff } from 'lucide-react';

const DigitalTwinMonitor: React.FC = () => {
    const [isAirGapped, setIsAirGapped] = useState(false);
    const [serverLoad, setServerLoad] = useState([45, 62, 28, 91]);

    useEffect(() => {
        const interval = setInterval(() => {
            setServerLoad(prev => prev.map(load => Math.max(10, Math.min(99, load + (Math.random() * 20 - 10)))));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const toggleAirGap = () => {
        setIsAirGapped(!isAirGapped);
    };

    return (
        <div className={`p-4 border border-[#003b00] bg-black/90 ${DesignSystem.layout.cardShadow} rounded-md h-full`}>
            <div className="flex items-center justify-between mb-4 border-b border-[#003b00] pb-2">
                <h2 className={`text-lg font-bold ${DesignSystem.layout.terminalText} flex items-center gap-2`}>
                    <Server className="w-5 h-5 text-blue-400" />
                    DIGITAL TWIN STATUS
                </h2>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    <span>LIVE SYNC</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                {serverLoad.map((load, i) => (
                    <div key={i} className="relative p-3 border border-[#003b00] bg-[#001000] rounded">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-[#008f11]">SVR-{i + 1}</span>
                            <span className={`text-xs font-mono font-bold ${load > 85 ? 'text-red-500' : 'text-[#00ff41]'}`}>{load.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-[#003b00] h-1.5 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ease-out ${load > 85 ? 'bg-red-600' : 'bg-[#00ff41]'}`}
                                style={{ width: `${load}%` }}
                            ></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-auto">
                <div className={`flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-lg transition-all duration-500 ${isAirGapped ? 'border-red-500 bg-red-900/10' : 'border-[#00ff41] bg-[#001000]'}`}>
                    <div className="mb-4 relative">
                        {isAirGapped ? (
                            <WifiOff className="w-16 h-16 text-red-500 animate-pulse" />
                        ) : (
                            <Wifi className="w-16 h-16 text-[#00ff41]" />
                        )}
                        {isAirGapped && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Shield className="w-8 h-8 text-red-500" />
                            </div>
                        )}
                    </div>

                    <h3 className={`text-xl font-black tracking-widest mb-1 ${isAirGapped ? 'text-red-500' : 'text-[#00ff41]'}`}>
                        {isAirGapped ? 'AIR-GAPPED' : 'NETWORK LINKED'}
                    </h3>
                    <p className="text-xs text-center text-gray-500 mb-4 opacity-80 uppercase tracking-wider">
                        {isAirGapped ? 'Physical isolation active. No external traffic.' : 'Standard operational connection active.'}
                    </p>

                    <button
                        onClick={toggleAirGap}
                        className={`
              relative group overflow-hidden px-6 py-3 rounded font-bold tracking-wider text-sm transition-all duration-300
              ${isAirGapped
                                ? 'bg-red-600 hover:bg-red-700 text-black border border-red-400 shadow-[0_0_20px_rgba(220,38,38,0.5)]'
                                : 'bg-[#003b00] hover:bg-[#004b00] text-[#00ff41] border border-[#00ff41] shadow-[0_0_15px_rgba(0,255,65,0.2)]'
                            }
            `}
                    >
                        <span className="relative z-10 flex items-center gap-2">
                            {isAirGapped ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            {isAirGapped ? 'RECONNECT SYSTEM' : 'INITIATE AIR-GAP'}
                        </span>
                        <div className={`absolute inset-0 opacity-20 ${isAirGapped ? 'bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,#000_5px,#000_10px)]' : ''}`}></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DigitalTwinMonitor;
