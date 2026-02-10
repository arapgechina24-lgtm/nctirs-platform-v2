'use client';

import React from 'react';
import { ShieldAlert, Activity, CheckCircle } from 'lucide-react';

export type SecurityLevel = 1 | 3 | 5;

const GlobalStatusBanner = () => {
    // In a real app, this would come from a global context or API
    // Simulating Level 3 (Amber) as per request context of "Active Sectoral Threats"
    const currentLevel: SecurityLevel = 3;

    const getStatusConfig = (level: SecurityLevel) => {
        switch (level) {
            case 5:
                return {
                    color: 'bg-red-600',
                    borderColor: 'border-red-800',
                    textColor: 'text-white',
                    icon: <ShieldAlert className="w-5 h-5 animate-pulse" />,
                    text: 'NATIONAL EMERGENCY: CRITICAL INFRASTRUCTURE UNDER ATTACK (LEVEL 5)',
                    pulse: 'animate-pulse'
                };
            case 3:
                return {
                    color: 'bg-amber-600',
                    borderColor: 'border-amber-800',
                    textColor: 'text-white',
                    icon: <Activity className="w-5 h-5" />,
                    text: 'ACTIVE SECTORAL THREATS DETECTED (LEVEL 3)',
                    pulse: ''
                };
            case 1:
            default:
                return {
                    color: 'bg-green-600',
                    borderColor: 'border-green-800',
                    textColor: 'text-white',
                    icon: <CheckCircle className="w-5 h-5" />,
                    text: 'NORMAL OPERATIONS (LEVEL 1)',
                    pulse: ''
                };
        }
    };

    const config = getStatusConfig(currentLevel);

    return (
        <div className={`w-full ${config.color} ${config.borderColor} border-b-4 flex items-center justify-center py-2 px-4 shadow-lg z-50 relative`}>
            <div className={`flex items-center gap-3 font-black tracking-widest uppercase ${config.textColor} ${config.pulse}`}>
                {config.icon}
                <span>{config.text}</span>
            </div>
        </div>
    );
};

export default GlobalStatusBanner;
