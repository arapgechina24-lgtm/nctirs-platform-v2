// Incidents API: CRUD operations with demo mode
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getPrismaClient } from '@/lib/db'

// Mock incidents for demo
const mockIncidents = [
    {
        id: 'inc-001',
        title: 'APT Attack on eCitizen Portal',
        description: 'Sophisticated attack targeting government services',
        type: 'CYBER_ATTACK',
        severity: 'CRITICAL',
        status: 'ACTIVE',
        location: 'Nairobi',
        county: 'Nairobi',
        targetAsset: 'eCitizen',
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        id: 'inc-002',
        title: 'DDoS on Banking Infrastructure',
        description: 'Distributed denial of service targeting financial sector',
        type: 'CYBER_ATTACK',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        location: 'Mombasa',
        county: 'Mombasa',
        targetAsset: 'Banking API',
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
    }
]

// GET /api/incidents - List all incidents
export async function GET(request: NextRequest) {
    try {
        const prisma = await getPrismaClient()

        if (!prisma) {
            return NextResponse.json({
                incidents: mockIncidents,
                total: mockIncidents.length,
                limit: 50,
                offset: 0,
                demo: true
            })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any

        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status')
        const severity = searchParams.get('severity')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: Record<string, unknown> = {}
        if (status) where.status = status
        if (severity) where.severity = severity

        const [incidents, total] = await Promise.all([
            db.incident.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: { select: { id: true, name: true, email: true, role: true } },
                    threats: true,
                    responses: true,
                }
            }),
            db.incident.count({ where })
        ])

        return NextResponse.json({ incidents, total, limit, offset })

    } catch (error) {
        console.error('[API] Get incidents error:', error)
        return NextResponse.json({
            incidents: mockIncidents,
            total: mockIncidents.length,
            demo: true
        })
    }
}

// POST /api/incidents - Create new incident
export async function POST(request: NextRequest) {
    try {
        const prisma = await getPrismaClient()
        const data = await request.json()

        const {
            title, description, type, severity, location,
            county, targetAsset, attackVector, indicators, createdById
        } = data

        if (!title || !type || !severity) {
            return NextResponse.json(
                { error: 'Title, type, and severity are required' },
                { status: 400 }
            )
        }

        if (!prisma) {
            return NextResponse.json({
                success: true,
                demo: true,
                incident: {
                    id: `inc-${Date.now()}`,
                    title, type, severity, status: 'ACTIVE',
                    createdAt: new Date()
                }
            }, { status: 201 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any

        const incident = await db.incident.create({
            data: {
                title, description, type, severity, status: 'ACTIVE',
                location, county, targetAsset, attackVector,
                indicators: indicators ? JSON.stringify(indicators) : null,
                createdById
            },
            include: {
                createdBy: { select: { id: true, name: true, email: true, role: true } }
            }
        })

        await db.auditLog.create({
            data: {
                action: 'CREATE',
                resource: 'incidents',
                resourceId: incident.id,
                userId: createdById,
                details: JSON.stringify({ title, type, severity }),
                hash: createHash('sha256').update(`CREATE-incident-${incident.id}-${Date.now()}`).digest('hex'),
            }
        })

        return NextResponse.json({ success: true, incident }, { status: 201 })

    } catch (error) {
        console.error('[API] Create incident error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
