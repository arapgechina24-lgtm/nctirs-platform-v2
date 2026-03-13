'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/nctirs/ui/card"
import { ThreatBadge, StatusBadge, Badge } from "@/components/nctirs/ui/badge"
import { SecurityIncident } from "@/lib/nctirs/mockData"
import { MapPin, Clock, Users, AlertCircle, BrainCircuit, Activity } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { AIAnalysisPanel } from "@/components/nctirs/intelligence/AIAnalysisPanel"

interface IncidentListProps {
  incidents: SecurityIncident[];
  maxItems?: number;
}

export function IncidentList({ incidents, maxItems = 10 }: IncidentListProps) {
  const displayIncidents = incidents.slice(0, maxItems);

  const [loadingScores, setLoadingScores] = useState<Set<string>>(new Set());
  const [riskScores, setRiskScores] = useState<Record<string, any>>({});

  const handleRiskAssessment = async (incidentId: string) => {
    setLoadingScores(prev => new Set(prev).add(incidentId));
    try {
      const res = await fetch('/api/ai/predict/risk-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: -1.282,
          longitude: 36.821,
          time_of_day: new Date().getHours() > 18 ? "night" : "day"
        })
      });
      if (res.ok) {
        const data = await res.json();
        setRiskScores(prev => ({ ...prev, [incidentId]: data }));
      }
    } catch (error) {
      console.error('Risk assessment failed:', error);
    } finally {
      setLoadingScores(prev => {
        const next = new Set(prev);
        next.delete(incidentId);
        return next;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          Recent Security Incidents
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {displayIncidents.map((incident) => (
            <div
              key={incident.id}
              className="flex flex-col gap-3 rounded-none border border-green-900/30 bg-black/50 p-4 transition-all hover:border-green-500/50 hover:bg-green-950/10 hover:shadow-[0_0_20px_rgba(0,255,65,0.05)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <ThreatBadge level={incident.threatLevel} />
                    <StatusBadge status={incident.status} />
                    <Badge variant="info">{incident.type.replace(/_/g, ' ')}</Badge>
                  </div>
                  <h4 className="font-bold text-green-400 font-mono tracking-tight">{incident.title}</h4>
                  <p className="text-[11px] text-green-800 mt-1 uppercase leading-relaxed">{incident.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] font-bold text-green-600 font-mono">
                    AI_CONFIDENCE: {incident.aiConfidence}%
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px] text-green-900 font-mono uppercase">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{incident.location.name}, {incident.location.region}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(incident.timestamp, { addSuffix: true })}</span>
                </div>
                {incident.suspects && (
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{incident.suspects} suspects</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 text-[9px] text-green-950 font-mono uppercase">
                <span>Data_Sources:</span>
                {incident.sources.map((source, idx) => (
                  <Badge key={idx} variant="default" className="text-[8px] h-4">
                    {source}
                  </Badge>
                ))}
              </div>

              <div className="mt-2">
                <AIAnalysisPanel
                  type="incident"
                  data={{
                    title: incident.title,
                    type: incident.type,
                    severity: incident.threatLevel,
                    description: incident.description,
                    location: incident.location.name,
                    region: incident.location.region,
                    status: incident.status
                  }}
                  compact
                />
              </div>

              {/* Risk Assessment Button */}
              <div className="mt-3 pt-3 border-t border-green-900/30">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-green-600 font-mono uppercase">Live Risk Analysis</span>
                  <button
                    onClick={() => handleRiskAssessment(incident.id)}
                    disabled={loadingScores.has(incident.id)}
                    className="text-[10px] px-2 py-1 bg-green-950/50 hover:bg-green-900/50 border border-green-800 text-green-400 font-mono flex items-center gap-1 disabled:opacity-50 transition-colors"
                  >
                    {loadingScores.has(incident.id) ? (
                      <><Activity className="h-3 w-3 animate-spin" /> SCANNING...</>
                    ) : (
                      <><BrainCircuit className="h-3 w-3" /> ASSESS RISK</>
                    )}
                  </button>
                </div>

                {riskScores[incident.id] && (
                  <div className="bg-black border border-green-900/50 p-2 animate-in fade-in zoom-in duration-300">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-[10px] text-gray-400">Calculated Score:</span>
                      <span className={`text-lg font-bold ${riskScores[incident.id].risk_level === 'HIGH' || riskScores[incident.id].risk_level === 'CRITICAL' ? 'text-red-500' : 'text-green-500'}`}>
                        {riskScores[incident.id].risk_score}/100
                        <span className="text-[10px] ml-1 uppercase text-gray-500"> ({riskScores[incident.id].risk_level})</span>
                      </span>
                    </div>
                    <div className="text-[9px] text-green-700 mb-1 uppercase">Contributing Factors:</div>
                    <ul className="list-disc pl-4 text-[10px] text-green-500 space-y-1">
                      {riskScores[incident.id].contributing_factors.map((factor: string, i: number) => (
                        <li key={i}>{factor}</li>
                      ))}
                      {riskScores[incident.id].contributing_factors.length === 0 && (
                        <li className="text-gray-500 italic ml-[-10px] list-none">No active risk factors detected.</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
