// Threats API: CRUD operations with demo mode fallback
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { getPrismaClient } from '@/lib/db'

// Mock threats for demo mode
const mockThreats = [
    {
        id: 'thr-001',
        name: 'Lazarus Group Campaign',
        type: 'APT',
        severity: 'CRITICAL',
        source: 'North Korea',
        targetSector: 'FINANCE',
        confidence: 0.92,
        mitreId: 'T1566.001',
        description: 'Sophisticated spearphishing campaign targeting Kenyan banks',
        indicators: JSON.stringify(['malicious-bank.ke', '185.234.72.100']),
        createdAt: new Date(),
        updatedAt: new Date(),
        incidentId: null,
        incident: null
    },
    {
        id: 'thr-002',
        name: 'Ransomware Variant - KPLC',
        type: 'RANSOMWARE',
        severity: 'HIGH',
        source: 'Unknown',
        targetSector: 'ENERGY',
        confidence: 0.85,
        mitreId: 'T1486',
        description: 'New ransomware strain targeting power grid control systems',
        indicators: JSON.stringify(['*.encrypted', 'ransom-note.txt']),
        createdAt: new Date(Date.now() - 3600000),
        updatedAt: new Date(Date.now() - 3600000),
        incidentId: null,
        incident: null
    },
    {
        id: 'thr-003',
        name: 'DDoS on eCitizen',
        type: 'DDOS',
        severity: 'HIGH',
        source: 'Botnet',
        targetSector: 'GOVERNMENT',
        confidence: 0.78,
        mitreId: 'T1498',
        description: 'Coordinated DDoS attack affecting government services',
        indicators: JSON.stringify(['SYN flood', '500k req/s']),
        createdAt: new Date(Date.now() - 7200000),
        updatedAt: new Date(Date.now() - 7200000),
        incidentId: null,
        incident: null
    }
]

// GET /api/threats - List all threats
export async function GET(request: NextRequest) {
    try {
        const prisma = await getPrismaClient()

        // Demo mode fallback
        if (!prisma) {
            return NextResponse.json({
                threats: mockThreats,
                total: mockThreats.length,
                limit: 50,
                offset: 0,
                demo: true
            })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any

        const searchParams = request.nextUrl.searchParams
        const type = searchParams.get('type')
        const severity = searchParams.get('severity')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: Record<string, unknown> = {}
        if (type) where.type = type
        if (severity) where.severity = severity

        const [threats, total] = await Promise.all([
            db.threat.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: { incident: true }
            }),
            db.threat.count({ where })
        ])

        return NextResponse.json({ threats, total, limit, offset })

    } catch (error) {
        console.error('[API] Get threats error:', error)
        return NextResponse.json({
            threats: mockThreats,
            total: mockThreats.length,
            limit: 50,
            offset: 0,
            demo: true
        })
    }
}

// POST /api/threats - Create new threat
export async function POST(request: NextRequest) {
    try {
        const prisma = await getPrismaClient()
        const data = await request.json()

        const {
            name, type, severity, source, targetSector,
            confidence, mitreId, description, indicators, incidentId
        } = data

        if (!name || !type || !severity) {
            return NextResponse.json(
                { error: 'Name, type, and severity are required' },
                { status: 400 }
            )
        }

        // Demo mode fallback
        if (!prisma) {
            const id = `thr-${Date.now()}`
            return NextResponse.json({
                success: true,
                demo: true,
                threat: {
                    id, name, type, severity, source, targetSector,
                    confidence, mitreId, description, createdAt: new Date()
                }
            }, { status: 201 })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any

        const threat = await db.threat.create({
            data: {
                name, type, severity, source, targetSector,
                confidence: confidence ? parseFloat(confidence) : 0,
                mitreId, description,
                indicators: indicators ? JSON.stringify(indicators) : null,
                incidentId
            },
            include: { incident: true }
        })

        await db.auditLog.create({
            data: {
                action: 'CREATE',
                resource: 'threats',
                resourceId: threat.id,
                details: JSON.stringify({ name, type, severity }),
                hash: createHash('sha256').update(`CREATE-threat-${threat.id}-${Date.now()}`).digest('hex'),
            }
        })

        return NextResponse.json({ success: true, threat }, { status: 201 })

    } catch (error) {
        console.error('[API] Create threat error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
