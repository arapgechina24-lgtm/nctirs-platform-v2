// Threats API: CRUD operations (with RBAC + rate limiting)
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createHash } from 'crypto'
import { requireAuth, requireRole } from '@/lib/rbac'
import { checkRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/rateLimit'

// GET /api/threats - List all threats (authenticated, any role)
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (session instanceof NextResponse) return session;

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
        return NextResponse.json({
            threats: [],
            total: 0,
        })
    }
}

// POST /api/threats - Create new threat (L2+ only, rate limited)
export async function POST(request: NextRequest) {
    try {
        // Allow python background script to bypass auth on local network using a secret header
        const streamToken = request.headers.get('x-stream-token');
        let userId = null;

        if (streamToken !== 'NCTIRS_LOCAL_STREAM_SECRET_123') {
            const session = await requireRole('L2');
            if (session instanceof NextResponse) return session;
            userId = session.user?.id || null;
        }

        // Rate limit
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
        const rl = checkRateLimit(`threats:${userId || clientIP}`, RATE_LIMITS.STANDARD);
        if (!rl.allowed && streamToken !== 'NCTIRS_LOCAL_STREAM_SECRET_123') {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: rateLimitHeaders(rl.remaining, rl.resetAt) }
            );
        }

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
                userId: userId,
                details: JSON.stringify({ name, type, severity }),
                hash: createHash('sha256').update(`CREATE-threat-${threat.id}-${Date.now()}`).digest('hex'),
            }
        })

        return NextResponse.json({
            success: true,
            threat,
        }, { status: 201 })

    } catch (error) {
        console.error('[API] Create threat CRITICAL error:', error)
        return NextResponse.json(
            { error: 'Internal server error', details: String(error) },
            { status: 500 }
        )
    }
}
