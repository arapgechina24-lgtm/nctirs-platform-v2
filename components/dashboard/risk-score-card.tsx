"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Loader2 } from "lucide-react"
import { fetchRiskScore, type RiskResponse } from "@/lib/api/ai-service"

export function RiskScoreCard() {
    const [riskData, setRiskData] = useState<RiskResponse | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function load() {
            try {
                // Nairobi CBD Coordinates
                const data = await fetchRiskScore(-1.286389, 36.817223)
                setRiskData(data)
            } catch (err) {
                console.error(err)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    if (loading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Risk Level</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-xs">Analyzing...</span>
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (!riskData) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">AI Risk Level</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-muted-foreground">--</div>
                    <p className="text-xs text-muted-foreground">AI Service Unavailable</p>
                </CardContent>
            </Card>
        )
    }

    const colorClass =
        riskData.risk_level === "CRITICAL" ? "text-red-600" :
            riskData.risk_level === "HIGH" ? "text-orange-500" :
                riskData.risk_level === "MEDIUM" ? "text-yellow-500" : "text-green-500"

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Risk Level</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${colorClass}`} />
            </CardHeader>
            <CardContent>
                <div className={`text-2xl font-bold ${colorClass}`}>
                    {riskData.risk_score}/100
                </div>
                <p className="text-xs text-muted-foreground">
                    {riskData.risk_level} - {riskData.contributing_factors[0] || "No factors"}
                </p>
            </CardContent>
        </Card>
    )
}
