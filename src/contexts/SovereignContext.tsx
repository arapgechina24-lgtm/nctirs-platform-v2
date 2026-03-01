'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface SovereignContextType {
    isSovereign: boolean
    setIsSovereign: (value: boolean) => void
}

const SovereignContext = createContext<SovereignContextType | undefined>(undefined)

export function SovereignProvider({ children }: { children: React.ReactNode }) {
    const [isSovereign, setIsSovereign] = useState(false)

    // Load initial state from localStorage if available
    useEffect(() => {
        const stored = localStorage.getItem('nctirs_sovereign_mode')
        if (stored === 'true') {
            setIsSovereign(true)
        }
    }, [])

    // Sync state to localStorage and potentially cookies for SSR access
    const handleSetSovereign = (value: boolean) => {
        setIsSovereign(value)
        localStorage.setItem('nctirs_sovereign_mode', String(value))
        // Set a cookie so the server-side AI logic can potentially see it
        document.cookie = `nctirs_sovereign_mode=${value}; path=/; max-age=31536000`
    }

    return (
        <SovereignContext.Provider value={{ isSovereign, setIsSovereign: handleSetSovereign }}>
            {children}
        </SovereignContext.Provider>
    )
}

export function useSovereign() {
    const context = useContext(SovereignContext)
    if (context === undefined) {
        throw new Error('useSovereign must be used within a SovereignProvider')
    }
    return context
}
