'use client'

import { useState, useEffect } from "react"
import { Shield, AlertTriangle, Activity, TrendingUp, Lock, Radio, Users, User, LogOut, LogIn } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import Link from "next/link"

export type ViewType = 'COMMAND_CENTER' | 'FUSION_CENTER' | 'THREAT_MATRIX' | 'ANALYTICS' | 'OPERATIONS';

interface HeaderProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function Header({ currentView, onViewChange }: HeaderProps) {
  const { user, isAuthenticated, logout } = useAuth()
  const [sessionId, setSessionId] = useState<string>("")
  const [currentTime, setCurrentTime] = useState<string>("")

  useEffect(() => {
    // Functional initializations to avoid sync setState warning
    const initialize = () => {
      setSessionId(`NIS-${Math.random().toString(36).substr(2, 9).toUpperCase()}`)

      const updateTime = () => {
        setCurrentTime(new Date().toLocaleString('en-KE', {
          dateStyle: 'medium',
          timeStyle: 'medium',
          hour12: false
        }))
      }

      updateTime()
      return updateTime
    }

    const updateTimeFn = initialize()
    const timer = setInterval(updateTimeFn, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <>
      {/* Scan line effect */}
      <div className="scan-line" />

      <header className="border-b border-green-900/40 bg-black/95 backdrop-blur-md relative z-10">
        {/* Classification Banner */}
        <div className="bg-green-950 border-b border-green-800">
          <div className="flex items-center justify-between px-6 py-1">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold text-green-400 tracking-[0.3em]">
                TOP SECRET // SCI // NOFORN
              </span>
              <div className="h-3 w-px bg-green-800" />
              <span className="text-[10px] text-green-500 font-mono uppercase">
                CLASSIFICATION: NATIONAL SECURITY LEVEL 5
              </span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-green-500">
              <div className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                <span className="font-mono">AES-256 ENCRYPTED</span>
              </div>
              <div className="flex items-center gap-1">
                <Radio className="h-3 w-3 animate-pulse" />
                <span className="font-mono">SECURE LINK ACTIVE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex h-20 items-center px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 bg-green-600 blur-xl opacity-20 rounded-full"></div>
              <div className="relative rounded-none bg-black p-3 border border-green-500/50 shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                <Shield className="h-7 w-7 text-green-400" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-green-400 tracking-tighter glow-text">
                  NCTIRS
                </h1>
                <div className="px-2 py-0.5 bg-green-950 border border-green-700/50 rounded-none text-[10px] font-mono text-green-300">
                  NIS-KENYA
                </div>
                <div className="px-2 py-0.5 bg-amber-950 border border-amber-700/50 rounded-none text-[10px] font-mono text-amber-300">
                  DPA 2019
                </div>
              </div>
              <p className="text-[10px] text-green-800 tracking-[0.2em] mt-1 font-bold uppercase">
                NATIONAL CYBER THREAT INTELLIGENCE & RESPONSE SYSTEM • AI-POWERED UNIFIED PLATFORM
              </p>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-6">
            {/* System Status */}
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-2 rounded-none bg-black border border-green-900/50 px-4 py-2 shadow-[inset_0_0_10px_rgba(0,255,65,0.05)]">
                <div className="relative">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <div className="absolute inset-0 h-1.5 w-1.5 rounded-full bg-green-500 animate-ping"></div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-green-500 tracking-widest">SYSTEM_OPERATIONAL</span>
                  <span className="text-[9px] text-green-900 font-mono">UPTIME: 99.98%</span>
                </div>
              </div>
            </div>

            {/* Date/Time */}
            <div className="flex flex-col items-end gap-1 px-4 py-2 bg-black border border-green-900/50 rounded-none">
              <div className="text-[9px] font-mono text-green-800">EAST AFRICA TIME</div>
              <div className="text-sm font-bold text-green-400 font-mono tracking-widest">
                {currentTime || "LOADING..."}
              </div>
            </div>

            {/* User Profile */}
            {isAuthenticated && user ? (
              <div className="flex items-center gap-3 px-4 py-2 bg-black border border-green-900/50 rounded-none">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-950 border border-green-800 rounded-full">
                    <User className="h-4 w-4 text-green-400" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-green-400">{user.name || user.email.split('@')[0]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[8px] text-green-700 font-mono">{user.agency || 'AGENCY'}</span>
                      <span className={`text-[8px] px-1 py-0.5 font-bold rounded-none ${user.role === 'L4' ? 'bg-red-950 text-red-400 border border-red-700/50' :
                          user.role === 'L3' ? 'bg-orange-950 text-orange-400 border border-orange-700/50' :
                            user.role === 'L2' ? 'bg-yellow-950 text-yellow-400 border border-yellow-700/50' :
                              'bg-green-950 text-green-400 border border-green-700/50'
                        }`}>{user.role}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="p-1.5 bg-red-950/50 border border-red-900/50 text-red-400 hover:bg-red-900/50 hover:border-red-700 transition-all"
                  title="Logout"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-2 px-4 py-2 bg-cyan-950/50 border border-cyan-900/50 text-cyan-400 hover:bg-cyan-900/50 hover:border-cyan-700 transition-all"
              >
                <LogIn className="h-4 w-4" />
                <span className="text-[10px] font-bold tracking-wider">LOGIN</span>
              </Link>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="border-t border-green-900/40 bg-gradient-to-b from-black/80 to-black/95">
          <nav className="grid grid-cols-5 w-full">
            {[
              { icon: Activity, label: 'COMMAND_CENTER', display: 'COMMAND', shortDesc: 'Main Hub' },
              { icon: Users, label: 'FUSION_CENTER', display: 'FUSION', shortDesc: 'Intel Feed' },
              { icon: AlertTriangle, label: 'THREAT_MATRIX', display: 'THREATS', shortDesc: 'Live Matrix' },
              { icon: TrendingUp, label: 'ANALYTICS', display: 'ANALYTICS', shortDesc: 'AI Insights' },
              { icon: Shield, label: 'OPERATIONS', display: 'OPS', shortDesc: 'Response' },
            ].map((item, index) => (
              <button
                key={item.label}
                onClick={() => onViewChange(item.label as ViewType)}
                className={`group relative flex flex-col items-center justify-center gap-1 py-3 px-2 text-center transition-all duration-200 border-r border-green-900/30 last:border-r-0
                  ${currentView === item.label
                    ? 'bg-green-900/30 text-green-400 shadow-[inset_0_-3px_0_0_#22c55e,inset_0_0_20px_rgba(0,255,65,0.15)]'
                    : 'text-green-700 hover:bg-green-900/15 hover:text-green-400'}
                `}
              >
                <div className="flex items-center gap-1.5">
                  <item.icon className={`h-4 w-4 ${currentView === item.label ? 'text-green-400' : 'text-green-700 group-hover:text-green-400'}`} strokeWidth={1.5} />
                  <span className="text-[11px] font-bold tracking-wider">{item.display}</span>
                </div>
                <span className={`text-[8px] uppercase tracking-widest ${currentView === item.label ? 'text-green-500' : 'text-green-800'}`}>
                  {item.shortDesc}
                </span>
                {currentView === item.label && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-green-500 rounded-t-sm" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </header>
    </>
  )
}
