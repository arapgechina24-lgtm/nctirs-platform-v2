'use client';

import { useState, useEffect } from 'react';

interface DemoModeBannerProps {
  isDemoMode: boolean;
  onStartDemo: () => void;
  onDismiss: () => void;
}

export default function DemoModeBanner({ isDemoMode, onStartDemo, onDismiss }: DemoModeBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Auto-start demo countdown
    if (isVisible && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      onStartDemo();
    }
  }, [countdown, isVisible, onStartDemo]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss();
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-cyan-900/95 via-blue-900/95 to-purple-900/95 backdrop-blur-sm border-b-2 border-cyan-500/50 px-4 py-3 shadow-lg shadow-cyan-500/20">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Left Section: Info */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-400/50">
              <span className="text-lg">🛡️</span>
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
              <span className="text-[8px] font-bold text-white">!</span>
            </div>
          </div>
          
          <div className="text-left">
            <div className="text-white font-bold text-sm flex items-center gap-2">
              {isDemoMode ? (
                <>
                  <span className="text-yellow-400">⚡</span>
                  Demo Mode Active
                </>
              ) : (
                <>
                  <span className="text-green-400">●</span>
                  NCTIRS Live Platform
                </>
              )}
            </div>
            <div className="text-cyan-300/80 text-xs">
              NIRU AI Hackathon 2026 • Kenya National Intelligence Service
            </div>
          </div>
        </div>

        {/* Center: Quick Actions */}
        <div className="flex items-center gap-2 text-xs">
          <div className="hidden md:flex items-center gap-2 text-gray-300 bg-black/30 px-3 py-1.5 rounded border border-gray-700/50">
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] border border-gray-600">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] border border-gray-600">Shift</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] border border-gray-600">E</kbd>
            <span className="text-gray-400 ml-1">Emergency</span>
          </div>
          
          <div className="hidden lg:flex items-center gap-2 text-gray-300 bg-black/30 px-3 py-1.5 rounded border border-gray-700/50">
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] border border-gray-600">Ctrl</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] border border-gray-600">Shift</kbd>
            <span>+</span>
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] border border-gray-600">A</kbd>
            <span className="text-gray-400 ml-1">Audit</span>
          </div>
        </div>

        {/* Right Section: Demo Button + Dismiss */}
        <div className="flex items-center gap-3">
          <button
            onClick={onStartDemo}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 text-sm font-bold rounded border-2 border-red-400/50 shadow-lg shadow-red-500/30 transition-all hover:scale-105 flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span className="hidden sm:inline">Watch Demo</span>
            <span className="sm:hidden">Demo</span>
            <span className="text-xs opacity-75">({countdown}s)</span>
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-white transition-colors p-1"
            title="Dismiss"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Progress bar for auto-demo */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-cyan-400/50 transition-all duration-1000" 
           style={{ width: `${(countdown / 10) * 100}%` }} />
    </div>
  );
}
