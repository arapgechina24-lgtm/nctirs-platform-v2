'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThreatBadge, StatusBadge, Badge } from "@/components/ui/badge"
import { SecurityIncident } from "@/lib/mockData"
import { MapPin, Clock, Users, AlertCircle } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { AIAnalysisPanel } from "@/components/intelligence/AIAnalysisPanel"

interface IncidentListProps {
  incidents: SecurityIncident[];
  maxItems?: number;
}

export function IncidentList({ incidents, maxItems = 10 }: IncidentListProps) {
  const displayIncidents = incidents.slice(0, maxItems);

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
              <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <ThreatBadge level={incident.threatLevel} />
                    <StatusBadge status={incident.status} />
                    <Badge variant="info">{incident.type.replace(/_/g, ' ')}</Badge>
                  </div>
                  <h4 className="font-bold text-green-400 font-mono tracking-tight truncate">{incident.title}</h4>
                  <p className="text-[11px] text-green-800 mt-1 uppercase leading-relaxed">{incident.description}</p>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <div className="text-[10px] font-bold text-green-600 font-mono bg-black/50 px-2 py-1 rounded">
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
                    status: incident.status,
                    dataProtectionImpact: incident.dataProtectionImpact,
                    mitreAttackId: incident.mitreAttackId,
                  }}
                  compact
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
