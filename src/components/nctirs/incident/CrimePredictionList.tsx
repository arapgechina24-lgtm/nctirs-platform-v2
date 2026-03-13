'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/nctirs/ui/card"
import { Badge } from "@/components/nctirs/ui/badge"
import { CrimePrediction } from "@/lib/nctirs/mockData"
import { TrendingUp, MapPin, Clock } from "lucide-react"

interface CrimePredictionListProps {
  predictions: CrimePrediction[];
  maxItems?: number;
}

export function CrimePredictionList({ predictions, maxItems = 8 }: CrimePredictionListProps) {
  const displayPredictions = predictions.slice(0, maxItems);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          AI Predictive Threat Hotspots
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {displayPredictions.map((prediction) => (
            <div
              key={prediction.id}
              className="rounded-none border border-green-900/30 bg-black/50 p-4 transition-all hover:border-green-500/50 hover:bg-green-950/10 shadow-[0_0_15px_rgba(0,255,65,0.02)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex items-center gap-1 font-mono text-green-400">
                      <MapPin className="h-3 w-3 text-green-700" />
                      <span className="text-[11px] font-bold uppercase tracking-tight">
                        {prediction.location.name}, {prediction.location.region}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-2">
                    {prediction.crimeTypes.map((type, idx) => (
                      <Badge key={idx} variant="warning" className="h-4 text-[8px] rounded-none font-mono">
                        {type.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 text-[9px] text-green-900 font-mono uppercase">
                    <Clock className="h-2.5 w-2.5" />
                    <span>WINDOW: {prediction.timeWindow}</span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-2xl font-bold text-green-400 font-mono glow-text">
                    {prediction.probability}%
                  </div>
                  <div className="text-[8px] text-green-900 font-mono uppercase font-bold tracking-widest">PROB_RATE</div>
                </div>
              </div>

              <div className="mt-3 border-t border-green-900/20 pt-3">
                <div className="text-[9px] font-bold text-green-900 mb-1 uppercase tracking-widest">Risk_Factors:</div>
                <div className="flex flex-wrap gap-1">
                  {prediction.riskFactors.map((factor, idx) => (
                    <span key={idx} className="text-[8px] text-green-500 bg-green-950/30 px-1.5 py-0.5 border border-green-900/30 font-mono uppercase">
                      {factor}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-2">
                <div className="text-[9px] font-bold text-green-900 mb-1 uppercase tracking-widest">Protocol_Directives:</div>
                <div className="flex flex-wrap gap-1">
                  {prediction.recommendedActions.map((action, idx) => (
                    <span key={idx} className="text-[8px] text-green-400 bg-black px-1.5 py-0.5 border border-green-600/30 font-mono uppercase">
                      {action}
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
