import { NextResponse } from 'next/server'
export const dynamic = 'force-dynamic'

export async function GET() {
    return NextResponse.json({ message: "Diagnostic Hello 200 OK", timestamp: new Date().toISOString() })
}
