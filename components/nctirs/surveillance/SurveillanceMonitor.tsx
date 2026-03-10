'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/nctirs/ui/card"
import { Badge } from "@/components/nctirs/ui/badge"
import { SurveillanceFeed } from "@/lib/nctirs/mockData"
import { Camera, Activity, MapPin, Clock, ScanFace, Target } from "lucide-react"

interface SurveillanceMonitorProps {
  feeds: SurveillanceFeed[];
  maxItems?: number;
}

export function SurveillanceMonitor({ feeds, maxItems = 12 }: SurveillanceMonitorProps) {
  const displayFeeds = feeds.slice(0, maxItems);
  const activeCount = feeds.filter(f => f.status === 'ACTIVE').length;
  const alertCount = feeds.filter(f => f.status === 'ALERT').length;

  const [scanningIds, setScanningIds] = useState<Set<string>>(new Set());
  const [scanResults, setScanResults] = useState<Record<string, any>>({});

  const handleScan = async (feedId: string) => {
    setScanningIds(prev => new Set(prev).add(feedId));
    try {
      const res = await fetch('/api/ai/analyze/surveillance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feed_id: feedId, image_url: 'live_stream_placeholder' })
      });

      if (res.ok) {
        const data = await res.json();
        setScanResults(prev => ({ ...prev, [feedId]: data }));
      }
    } catch (error) {
      console.error('AI Scan failed:', error);
    } finally {
      setScanningIds(prev => {
        const next = new Set(prev);
        next.delete(feedId);
        return next;
      });
    }
  };

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
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
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
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleScan(feed.id)}
                    disabled={scanningIds.has(feed.id)}
                    title="Run AI Scan"
                    className="flex justify-center items-center h-6 w-6 rounded border border-green-800/50 bg-green-950/30 hover:bg-green-900/60 text-green-400 disabled:opacity-50 transition-colors"
                  >
                    {scanningIds.has(feed.id) ? (
                      <Activity className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <ScanFace className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {feed.status === 'ALERT' && (
                    <div className="flex items-center gap-1 text-red-400">
                      <Activity className="h-4 w-4 animate-pulse" />
                      <span className="text-xs font-bold uppercase hidden sm:inline">ALERT</span>
                    </div>
                  )}
                </div>
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

              {/* AI Detection Results */}
              {scanResults[feed.id] && (
                <div className="mt-3 pt-2 border-t border-red-900/50 animate-in fade-in zoom-in duration-300">
                  <div className={`text-[10px] font-bold uppercase mb-1 flex items-center gap-1 ${scanResults[feed.id].alert_triggered ? 'text-red-500' : 'text-green-500'}`}>
                    <Target className="h-3 w-3" />
                    AI Detection: {scanResults[feed.id].alert_triggered ? 'THREAT' : 'CLEAR'}
                  </div>
                  <div className="space-y-1">
                    {scanResults[feed.id].detected_objects.map((obj: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center text-[10px] bg-red-950/30 p-1 border border-red-900/30">
                        <span className="text-red-400 uppercase">{obj.label}</span>
                        <span className="text-red-300 font-mono bg-red-900/50 px-1">{(obj.confidence * 100).toFixed(1)}%</span>
                      </div>
                    ))}
                    {scanResults[feed.id].detected_objects.length === 0 && (
                      <div className="text-[10px] text-green-700 font-mono italic">No anomalies detected.</div>
                    )}
                  </div>
                </div>
              )}

              {/* Last Activity */}
              {!scanResults[feed.id] && feed.lastActivity && (
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
