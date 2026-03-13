import { NextResponse } from "next/server"
import { analyzeSurveillance } from "@/lib/api/ai-service"

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { feed_id } = body

        if (!feed_id) {
            return NextResponse.json({ error: "Feed ID required" }, { status: 400 })
        }

        const data = await analyzeSurveillance(feed_id)

        if (!data) {
            return NextResponse.json({ error: "AI Service Unavailable" }, { status: 503 })
        }

        return NextResponse.json(data)
    } catch {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
