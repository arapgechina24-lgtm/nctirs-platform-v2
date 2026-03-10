'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/nctirs/ui/card"
import { Badge } from "@/components/nctirs/ui/badge"
import { EmergencyResponse } from "@/lib/nctirs/mockData"
import { Siren, MapPin, Users, Clock } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface EmergencyResponseListProps {
  responses: EmergencyResponse[];
  maxItems?: number;
}

export function EmergencyResponseList({ responses, maxItems = 6 }: EmergencyResponseListProps) {
  const displayResponses = responses.slice(0, maxItems);

  const statusVariant = (status: EmergencyResponse['status']) => {
    switch (status) {
      case 'DISPATCHED':
        return 'warning';
      case 'EN_ROUTE':
        return 'info';
      case 'ON_SCENE':
        return 'high';
      case 'RESOLVED':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Siren className="h-5 w-5 text-red-600" />
          Emergency Response Coordination
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayResponses.map((response) => (
            <div
              key={response.id}
              className="rounded-none border border-green-900/30 bg-black/50 p-4 transition-all hover:border-green-500/50 hover:bg-green-950/10 shadow-[0_0_15px_rgba(0,255,65,0.02)]"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusVariant(response.status)} className="h-4 text-[8px] rounded-none font-mono">
                      {response.status.replace(/_/g, ' ')}
                    </Badge>
                    <span className="text-[9px] font-mono text-green-900 uppercase">{response.id}</span>
                  </div>
                  <h4 className="font-bold text-green-400 text-xs font-mono tracking-tight uppercase">{response.incident}</h4>
                </div>
                {response.status !== 'RESOLVED' && (
                  <div className="text-right">
                    <div className="text-lg font-bold text-green-400 font-mono glow-text">
                      {response.eta}M
                    </div>
                    <div className="text-[8px] text-green-900 font-mono uppercase tracking-widest font-bold">EST_ARRIVAL</div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-[9px] text-green-800 font-mono mb-3 uppercase">
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{response.location}, {response.region}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  <span>{response.unitsDispatched} UNITS</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(response.timestamp, { addSuffix: true })}</span>
                </div>
              </div>

              <div className="border-t border-green-900/20 pt-2">
                <div className="text-[9px] text-green-900 mb-1 uppercase font-bold tracking-widest">COORDINATING_AGENCIES:</div>
                <div className="flex flex-wrap gap-1">
                  {response.coordinatingAgencies.map((agency, idx) => (
                    <span key={idx} className="text-[8px] bg-black text-green-400 px-1.5 py-0.5 border border-green-900/50 font-mono uppercase">
                      {agency}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
