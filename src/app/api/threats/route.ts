// Threats API: CRUD operations
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createHash } from 'crypto'

// GET /api/threats - List all threats
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get('type')
        const severity = searchParams.get('severity')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: Record<string, unknown> = {}
        if (type) where.type = type
        if (severity) where.severity = severity

        const [threats, total] = await Promise.all([
            prisma.threat.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    incident: true,
                }
            }),
            prisma.threat.count({ where })
        ])

        return NextResponse.json({
            threats,
            total,
            limit,
            offset,
        })

    } catch (error) {
        console.error('[API] Get threats error:', error)
        // Fallback for demo: return empty list
        return NextResponse.json({
            threats: [],
            total: 0,
        })
    }
}

// POST /api/threats - Create new threat
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        const {
            name,
            type,
            severity,
            source,
            targetSector,
            confidence,
            mitreId,
            description,
            indicators,
            incidentId,
        } = data

        if (!name || !type || !severity) {
            return NextResponse.json(
                { error: 'Name, type, and severity are required' },
                { status: 400 }
            )
        }

        const threat = await prisma.threat.create({
            data: {
                name,
                type,
                severity,
                source,
                targetSector,
                confidence: confidence ? parseFloat(confidence) : 0,
                mitreId,
                description,
                indicators: indicators ? JSON.stringify(indicators) : null,
                incidentId,
            },
            include: {
                incident: true,
            }
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                resource: 'threats',
                resourceId: threat.id,
                details: JSON.stringify({ name, type, severity }),
                hash: createHash('sha256').update(`CREATE-threat-${threat.id}-${Date.now()}`).digest('hex'),
            }
        })

        return NextResponse.json({
            success: true,
            threat,
        }, { status: 201 })

    } catch (error) {
        console.error('[API] Create threat error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
