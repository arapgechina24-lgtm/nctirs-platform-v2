// Users API Route - GET all users (L3+ admin only)
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireRole } from '@/lib/rbac'
import { z } from 'zod'

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic'

const QuerySchema = z.object({
    role: z.string().optional(),
    agency: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(50),
});

// GET /api/users - List users (requires L3+ clearance — admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await requireRole('L3');
        if (session instanceof NextResponse) return session;

        const { searchParams } = new URL(request.url)
        const parsedQuery = QuerySchema.safeParse(Object.fromEntries(searchParams));

        if (!parsedQuery.success) {
            return NextResponse.json({ error: 'Invalid query parameters', details: parsedQuery.error.format() }, { status: 400 });
        }

        const { role, agency, limit } = parsedQuery.data;

        // Build where clause
        const where: Record<string, unknown> = { isActive: true }
        if (role) where.role = role
        if (agency) where.agency = agency

        const users = await prisma.user.findMany({
            where,
            take: limit,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                agency: true,
                department: true,
                clearanceLevel: true,
                isActive: true,
                createdAt: true,
                lastLogin: true,
                // Exclude password for security
            },
        })

        const total = await prisma.user.count({ where })

        return NextResponse.json({ users, total })
    } catch (error) {
        console.error('Failed to fetch users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}
