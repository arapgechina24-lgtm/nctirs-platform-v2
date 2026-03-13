
export type RiskResponse = {
    risk_score: number
    risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    contributing_factors: string[]
}

export type SurveillanceResponse = {
    feed_id: string
    timestamp: string
    detected_objects: {
        label: string
        confidence: number
        bbox: number[]
    }[]
    alert_triggered: boolean
}

const AI_ENGINE_URL = process.env.NEXT_PUBLIC_AI_ENGINE_URL || "/api/ai"

export async function fetchRiskScore(lat: number, lng: number): Promise<RiskResponse | null> {
    try {
        const res = await fetch(`${AI_ENGINE_URL}/predict/risk-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ latitude: lat, longitude: lng }),
            cache: "no-store", // Real-time data
        })

        if (!res.ok) {
            console.error("AI Engine Error:", res.statusText)
            return null
        }

        return await res.json()
    } catch (error) {
        console.error("Failed to connect to AI Engine:", error)
        return null
    }
}

export async function analyzeSurveillance(feedId: string): Promise<SurveillanceResponse | null> {
    try {
        const res = await fetch(`${AI_ENGINE_URL}/analyze/surveillance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ feed_id: feedId }),
            cache: "no-store",
        })

        if (!res.ok) return null
        return await res.json()
    } catch (error) {
        console.error("Failed to analyze surveillance:", error)
        return null
    }
}
