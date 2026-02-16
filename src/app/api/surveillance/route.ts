// Surveillance Feeds API Route - GET all feeds, POST new feed (with RBAC + rate limiting)
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/rbac'
import { checkRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/rateLimit'

// GET /api/surveillance - List feeds (authenticated, any role)
export async function GET(request: NextRequest) {
    try {
        const session = await requireAuth();
        if (session instanceof NextResponse) return session;

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type')
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '100')

        // Build where clause
        const where: Record<string, unknown> = {}
        if (type) where.type = type
        if (status) where.status = status

        const feeds = await prisma.surveillanceFeed.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
        })

        const total = await prisma.surveillanceFeed.count({ where })

        return NextResponse.json({ feeds, total })
    } catch (error) {
        console.error('Failed to fetch surveillance feeds:', error)
        return NextResponse.json(
            { error: 'Failed to fetch surveillance feeds' },
            { status: 500 }
        )
    }
}

// POST /api/surveillance - Create new feed (L2+ only, rate limited)
export async function POST(request: NextRequest) {
    try {
        const session = await requireRole('L2');
        if (session instanceof NextResponse) return session;

        // Rate limit
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
        const rl = checkRateLimit(`surveillance:${session.user?.email || clientIP}`, RATE_LIMITS.STANDARD);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: rateLimitHeaders(rl.remaining, rl.resetAt) }
            );
        }

        const body = await request.json()
        const { location, type, latitude, longitude, streamUrl } = body

        if (!location || !type) {
            return NextResponse.json(
                { error: 'Location and type are required' },
                { status: 400 }
            )
        }

        const feed = await prisma.surveillanceFeed.create({
            data: {
                location,
                type,
                status: 'ACTIVE',
                latitude: latitude || null,
                longitude: longitude || null,
                streamUrl: streamUrl || null,
            },
        })

        return NextResponse.json({ feed }, { status: 201 })
    } catch (error) {
        console.error('Failed to create surveillance feed:', error)
        return NextResponse.json(
            { error: 'Failed to create surveillance feed' },
            { status: 500 }
        )
    }
}
