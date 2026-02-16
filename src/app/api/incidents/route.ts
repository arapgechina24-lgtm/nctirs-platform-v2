// Incidents API: CRUD operations (with RBAC + rate limiting)
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createHash } from 'crypto'
import { requireAuth, requireRole } from '@/lib/rbac'
import { checkRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/rateLimit'

// GET /api/incidents - List all incidents (authenticated, any role)
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (session instanceof NextResponse) return session;

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
        return NextResponse.json({
            incidents: [],
            total: 0,
            limit: parseInt(request.nextUrl.searchParams.get('limit') || '50'),
            offset: parseInt(request.nextUrl.searchParams.get('offset') || '0'),
        })
    }
}

// POST /api/incidents - Create new incident (L2+ only, rate limited)
export async function POST(request: NextRequest) {
    try {
        const session = await requireRole('L2');
        if (session instanceof NextResponse) return session;

        // Rate limit
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
        const rl = checkRateLimit(`incidents:${session.user?.email || clientIP}`, RATE_LIMITS.STANDARD);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: rateLimitHeaders(rl.remaining, rl.resetAt) }
            );
        }

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
                createdById: session.user?.id || null,
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
                userId: session.user?.id || null,
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
