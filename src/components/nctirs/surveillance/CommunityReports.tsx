'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/nctirs/ui/card"
import { Badge } from "@/components/nctirs/ui/badge"
import { CommunityReport } from "@/lib/nctirs/mockData"
import { Users, MapPin, Clock, CheckCircle, Image as ImageIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface CommunityReportsProps {
  reports: CommunityReport[];
  maxItems?: number;
}

export function CommunityReports({ reports, maxItems = 8 }: CommunityReportsProps) {
  const displayReports = reports.slice(0, maxItems);
  const verifiedCount = reports.filter(r => r.verified).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-500" />
            Intelligence Field Reports
          </CardTitle>
          <div className="text-[9px] font-mono text-green-800 uppercase tracking-widest">
            {verifiedCount} VERIFIED_SIG
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayReports.map((report) => (
            <div
              key={report.id}
              className="rounded-none border border-green-900/30 bg-black/50 p-4 transition-all hover:border-green-500/50 hover:bg-green-950/10 shadow-[0_0_15px_rgba(0,255,65,0.02)]"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      report.urgency === 'CRITICAL'
                        ? 'critical'
                        : report.urgency === 'HIGH'
                          ? 'high'
                          : report.urgency === 'MEDIUM'
                            ? 'medium'
                            : 'low'
                    }
                    className="h-4 text-[8px] rounded-none font-mono"
                  >
                    {report.urgency}
                  </Badge>
                  <Badge variant="info" className="h-4 text-[8px] rounded-none font-mono uppercase">{report.type.replace(/_/g, ' ')}</Badge>
                  {report.verified && (
                    <div className="flex items-center gap-1 text-green-500 opacity-80">
                      <CheckCircle className="h-3 w-3" />
                      <span className="text-[8px] font-mono uppercase tracking-tighter">SIG_VERIFIED</span>
                    </div>
                  )}
                </div>
                {report.mediaAttachments > 0 && (
                  <div className="flex items-center gap-1 text-green-700">
                    <ImageIcon className="h-3 w-3" />
                    <span className="text-[9px] font-mono">{report.mediaAttachments}</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-green-400 font-mono mb-3 leading-relaxed tracking-tight">{report.description}</p>

              <div className="flex items-center gap-4 text-[9px] text-green-900 font-mono uppercase">
                <div className="flex items-center gap-1">
                  <MapPin className="h-2.5 w-2.5" />
                  <span>LOC: {report.location.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-2.5 w-2.5" />
                  <span>TIME: {formatDistanceToNow(report.timestamp, { addSuffix: true })}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
