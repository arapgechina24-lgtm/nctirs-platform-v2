'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SurveillanceFeed } from "@/lib/mockData"
import { Camera, Activity } from "lucide-react"

interface SurveillanceMonitorProps {
  feeds: SurveillanceFeed[];
  maxItems?: number;
}

export function SurveillanceMonitor({ feeds, maxItems = 12 }: SurveillanceMonitorProps) {
  const displayFeeds = feeds.slice(0, maxItems);
  const activeCount = feeds.filter(f => f.status === 'ACTIVE').length;
  const alertCount = feeds.filter(f => f.status === 'ALERT').length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-green-500" />
            Surveillance Network Monitor
          </CardTitle>
          <div className="flex items-center gap-3 text-[10px] font-mono uppercase">
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 bg-green-500 shadow-[0_0_5px_#00ff41]"></div>
              <span className="text-green-800">{activeCount} ACTIVE</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-1.5 w-1.5 bg-red-600 animate-pulse"></div>
              <span className="text-green-800">{alertCount} ALERTS</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayFeeds.map((feed) => (
            <div
              key={feed.id}
              className={`rounded-none border p-3 transition-colors ${feed.status === 'ALERT'
                ? 'border-red-900 bg-red-950/20'
                : 'border-green-900/30 bg-black/50 hover:border-green-500/50'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-[9px] font-mono text-green-900 border border-green-950 px-1 uppercase tracking-tighter">CAM_{feed.id.split('-').pop()}</div>
                {feed.status === 'ALERT' && (
                  <Activity className="h-3 w-3 text-red-600 animate-pulse" />
                )}
              </div>

              <div className="mb-2">
                <div className="text-[10px] font-bold text-green-400 font-mono uppercase truncate">{feed.location}</div>
                <div className="text-[8px] text-green-800 font-mono uppercase">{feed.region}</div>
              </div>

              <div className="flex items-center justify-between">
                <Badge
                  variant={feed.status === 'ALERT' ? 'critical' : 'default'}
                  className="h-4 text-[8px] rounded-none font-mono uppercase"
                >
                  {feed.type}
                </Badge>
                {feed.alerts > 0 && (
                  <span className="text-[8px] font-bold text-red-600 animate-pulse font-mono uppercase">
                    ALRT:{feed.alerts}
                  </span>
                )}
              </div>

              {feed.lastActivity && (
                <div className="mt-2 text-xs text-gray-400 border-t border-gray-800 pt-2">
                  {feed.lastActivity}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
