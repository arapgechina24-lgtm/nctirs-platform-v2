'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface DemoModeProps {
    onTriggerEmergency: () => void;
}

export default function DemoModeController({ onTriggerEmergency }: DemoModeProps) {
    const [demoMode, setDemoMode] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const router = useRouter();

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Ctrl+Shift+E = Emergency
        if (e.ctrlKey && e.shiftKey && e.key === 'E') {
            e.preventDefault();
            onTriggerEmergency();
        }
        // Ctrl+Shift+A = Audit Trail
        if (e.ctrlKey && e.shiftKey && e.key === 'A') {
            e.preventDefault();
            router.push('/dashboard/compliance');
        }
        // Ctrl+Shift+D = Demo Mode
        if (e.ctrlKey && e.shiftKey && e.key === 'D') {
            e.preventDefault();
            setDemoMode(prev => !prev);
        }
    }, [onTriggerEmergency, router]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    // Auto-trigger in demo mode
    useEffect(() => {
        if (!demoMode) {
            setTimeout(() => setCountdown(30), 0);
            return;
        }

        const interval = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    onTriggerEmergency();
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [demoMode, onTriggerEmergency]);

    return (
        <>
            {/* Demo Mode Toggle Button */}
            <button
                onClick={() => setDemoMode(prev => !prev)}
                className={`fixed bottom-4 left-4 z-50 px-3 py-2 text-[10px] font-mono uppercase border transition-all ${demoMode
                    ? 'bg-yellow-900/50 text-yellow-400 border-yellow-500 animate-pulse'
                    : 'bg-gray-900/50 text-gray-500 border-gray-700 hover:border-gray-500'
                    }`}
            >
                {demoMode ? `[DEMO] Next: ${countdown}s` : '[DEMO OFF]'}
            </button>

            {/* Keyboard Shortcut Hints */}
            <div className="fixed bottom-4 right-4 z-50 text-[9px] font-mono text-gray-600 space-y-1">
                <div><kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+E</kbd> Emergency</div>
                <div><kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+A</kbd> Audit</div>
                <div><kbd className="bg-gray-800 px-1 rounded">Ctrl+Shift+D</kbd> Demo</div>
            </div>
        </>
    );
}
