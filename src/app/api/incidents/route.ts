// Incidents API: CRUD operations
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createHash } from 'crypto'

// GET /api/incidents - List all incidents
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const status = searchParams.get('status')
        const severity = searchParams.get('severity')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: Record<string, unknown> = {}
        if (status) where.status = status
        if (severity) where.severity = severity

        const [incidents, total] = await Promise.all([
            prisma.incident.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    createdBy: {
                        select: { id: true, name: true, email: true, role: true }
                    },
                    threats: true,
                    responses: true,
                }
            }),
            prisma.incident.count({ where })
        ])

        return NextResponse.json({
            incidents,
            total,
            limit,
            offset,
        })

    } catch (error) {
        console.error('[API] Get incidents error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/incidents - Create new incident
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        const {
            title,
            description,
            type,
            severity,
            location,
            latitude,
            longitude,
            county,
            targetAsset,
            attackVector,
            indicators,
            createdById,
        } = data

        if (!title || !type || !severity) {
            return NextResponse.json(
                { error: 'Title, type, and severity are required' },
                { status: 400 }
            )
        }

        const incident = await prisma.incident.create({
            data: {
                title,
                description: description || '',
                type,
                severity,
                status: 'ACTIVE',
                location,
                latitude: latitude ? parseFloat(latitude) : null,
                longitude: longitude ? parseFloat(longitude) : null,
                county,
                targetAsset,
                attackVector,
                indicators: indicators ? JSON.stringify(indicators) : null,
                createdById,
            },
            include: {
                createdBy: {
                    select: { id: true, name: true, email: true, role: true }
                },
            }
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'CREATE',
                resource: 'incidents',
                resourceId: incident.id,
                userId: createdById,
                details: JSON.stringify({ title, type, severity }),
                hash: createHash('sha256').update(`CREATE-incident-${incident.id}-${Date.now()}`).digest('hex'),
            }
        })

        return NextResponse.json({
            success: true,
            incident,
        }, { status: 201 })

    } catch (error) {
        console.error('[API] Create incident error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
