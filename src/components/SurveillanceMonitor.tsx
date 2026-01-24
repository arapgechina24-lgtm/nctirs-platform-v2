'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SurveillanceFeed } from "@/lib/mockData"
import { Camera, Activity, MapPin, Clock } from "lucide-react"

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
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-green-500" />
            Surveillance Network Monitor
          </CardTitle>
          <div className="flex items-center gap-4 text-xs font-mono uppercase">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 shadow-[0_0_5px_#00ff41]"></div>
              <span className="text-green-400">{activeCount} ACTIVE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-600 animate-pulse"></div>
              <span className="text-red-400">{alertCount} ALERTS</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayFeeds.map((feed) => (
            <div
              key={feed.id}
              className={`border p-4 transition-colors ${feed.status === 'ALERT'
                ? 'border-red-900 bg-red-950/20'
                : 'border-green-900/30 bg-black/50 hover:border-green-500/50'
                }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-mono text-green-600 border border-green-900/50 px-2 py-0.5 uppercase">
                  CAM_{feed.id.split('-').pop()}
                </div>
                {feed.status === 'ALERT' && (
                  <div className="flex items-center gap-1 text-red-400">
                    <Activity className="h-4 w-4 animate-pulse" />
                    <span className="text-xs font-bold uppercase">ALERT</span>
                  </div>
                )}
              </div>

              {/* Location */}
              <div className="mb-3">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="h-3.5 w-3.5 text-green-600" />
                  <span className="text-sm font-medium text-green-300">{feed.location}</span>
                </div>
                <div className="text-xs text-gray-500 uppercase ml-5">{feed.region}</div>
              </div>

              {/* Type and Alerts */}
              <div className="flex items-center justify-between">
                <Badge
                  variant={feed.status === 'ALERT' ? 'critical' : 'default'}
                  className="text-xs font-mono uppercase"
                >
                  {feed.type}
                </Badge>
                {feed.alerts > 0 && (
                  <span className="text-xs font-bold text-red-500 animate-pulse font-mono uppercase">
                    {feed.alerts} ALERTS
                  </span>
                )}
              </div>

              {/* Last Activity */}
              {feed.lastActivity && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  <div className="flex items-start gap-2">
                    <Clock className="h-3.5 w-3.5 text-gray-600 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-400 leading-relaxed">{feed.lastActivity}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
