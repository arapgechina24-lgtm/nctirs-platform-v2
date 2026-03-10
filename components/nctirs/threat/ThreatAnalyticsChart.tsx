'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/nctirs/ui/card"
import { ThreatAnalytics } from "@/lib/nctirs/mockData"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Shield } from "lucide-react"

interface ThreatAnalyticsChartProps {
  analytics: ThreatAnalytics[];
}

export function ThreatAnalyticsChart({ analytics }: ThreatAnalyticsChartProps) {
  const threatColors = {
    CRITICAL: '#ff0000',
    HIGH: '#ff6600',
    MEDIUM: '#ffff00',
    LOW: '#00ff41',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-green-500" />
          Regional Threat Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics}>
            <CartesianGrid strokeDasharray="3 3" stroke="#003b00" vertical={false} />
            <XAxis
              dataKey="region"
              stroke="#008f11"
              style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}
            />
            <YAxis stroke="#008f11" style={{ fontSize: '10px', fontFamily: 'monospace' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#000',
                border: '1px solid #00ff41',
                borderRadius: '0px',
                color: '#00ff41',
                fontFamily: 'monospace',
                fontSize: '10px'
              }}
            />
            <Legend wrapperStyle={{ fontFamily: 'monospace', fontSize: '10px', textTransform: 'uppercase' }} />
            <Bar dataKey="activeIncidents" name="Active_Incidents" fill="#00ff41" radius={[0, 0, 0, 0]} />
            <Bar dataKey="riskScore" name="Risk_Score" fill="#003b00" radius={[0, 0, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
          {analytics.map((item) => (
            <div
              key={item.region}
              className="rounded-lg border border-slate-800/50 bg-slate-900/30 p-3 hover:border-blue-800/50 transition-all"
            >
              <div className="text-sm font-bold text-blue-50 mb-1">
                {item.region}
              </div>
              <div
                className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold mb-2"
                style={{
                  backgroundColor: `${threatColors[item.threatLevel]}20`,
                  color: threatColors[item.threatLevel],
                }}
              >
                {item.threatLevel}
              </div>
              <div className="text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Active:</span>
                  <span className="font-semibold text-blue-100">{item.activeIncidents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolved:</span>
                  <span className="font-semibold text-blue-100">{item.resolvedIncidents}</span>
                </div>
                <div className="flex justify-between">
                  <span>Trend:</span>
                  <span className={`font-semibold ${item.crimeTrend === 'INCREASING' ? 'text-red-400' :
                    item.crimeTrend === 'DECREASING' ? 'text-green-400' :
                      'text-gray-400'
                    }`}>
                    {item.crimeTrend === 'INCREASING' ? '↑' :
                      item.crimeTrend === 'DECREASING' ? '↓' : '→'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
