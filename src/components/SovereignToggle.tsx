'use client'

import { useState } from 'react'
import { Switch } from "@/components/ui/switch"
import { Shield, ShieldAlert, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface SovereignToggleProps {
    onToggle?: (isSovereign: boolean) => void;
}

export function SovereignToggle({ onToggle }: SovereignToggleProps) {
    const [isSovereign, setIsSovereign] = useState(false);

    const handleToggle = (checked: boolean) => {
        setIsSovereign(checked);
        if (onToggle) onToggle(checked);

        // Global dramatic effect - direct DOM manipulation for instant "Theme Lockdown"
        if (checked) {
            document.body.classList.add('theme-sovereign-lockdown');
        } else {
            document.body.classList.remove('theme-sovereign-lockdown');
        }
    };

    return (
        <div className={cn(
            "flex items-center gap-3 px-3 py-1.5 border rounded-md transition-all duration-500",
            isSovereign
                ? "bg-red-950/30 border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.3)]"
                : "bg-black border-green-900/30"
        )}>
            <div className="flex flex-col items-end">
                <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest transition-colors",
                    isSovereign ? "text-red-500" : "text-green-600"
                )}>
                    {isSovereign ? "AIR-GAPPED" : "CONNECTED"}
                </span>
                <span className="text-[8px] text-gray-500 font-mono">
                    {isSovereign ? "NO EXT. TRAFFIC" : "SECURE CHANNEL"}
                </span>
            </div>

            <Switch
                checked={isSovereign}
                onCheckedChange={handleToggle}
                className={cn(
                    "data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-green-900",
                    "border border-white/10"
                )}
            />

            <div className={cn(
                "p-1.5 rounded-full transition-all duration-500",
                isSovereign ? "bg-red-500/20 text-red-500 animate-pulse" : "bg-green-500/10 text-green-600"
            )}>
                {isSovereign ? <WifiOff size={16} /> : <Wifi size={16} />}
            </div>
        </div>
    )
}
