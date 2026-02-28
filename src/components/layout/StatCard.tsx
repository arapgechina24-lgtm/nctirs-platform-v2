'use client'

import { Card, CardContent } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor: string;
}

export function StatCard({ title, value, change, changeType = 'neutral', icon: Icon, iconColor }: StatCardProps) {
  const changeColors = {
    positive: 'text-green-400',
    negative: 'text-red-500',
    neutral: 'text-green-800',
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
    >
      <Card className="hover:border-green-500/60 transition-colors duration-300 group bg-black shadow-lg shadow-black">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-green-700 uppercase tracking-[0.2em] mb-2">{title}</p>
              <div className="flex items-baseline gap-3">
                <p className="text-4xl font-bold text-green-400 font-mono tracking-tight glow-text">{value}</p>
                {change && (
                  <span className={`text-[10px] font-bold ${changeColors[changeType]} font-mono`}>
                    {change}
                  </span>
                )}
              </div>
            </div>
            <div className={`rounded-none p-4 ${iconColor.replace('bg-red-950/50', 'bg-black').replace('text-red-400', 'text-red-600').replace('bg-orange-950/50', 'bg-black').replace('text-orange-400', 'text-orange-600').replace('bg-purple-950/50', 'bg-black').replace('text-purple-400', 'text-green-600').replace('bg-cyan-950/50', 'bg-black').replace('text-cyan-400', 'text-green-400').replace('bg-green-950/50', 'bg-black').replace('text-green-400', 'text-green-500')} border border-green-500/20 group-hover:scale-110 transition-transform duration-300 shadow-[0_0_10px_rgba(0,255,65,0.1)]`}>
              <Icon className="h-7 w-7" strokeWidth={1.5} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
