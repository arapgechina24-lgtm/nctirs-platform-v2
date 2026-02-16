// Users API Route - GET all users (L3+ admin only)
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { requireRole } from '@/lib/rbac'

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic'

// GET /api/users - List users (requires L3+ clearance — admin only)
export async function GET(request: NextRequest) {
    try {
        const session = await requireRole('L3');
        if (session instanceof NextResponse) return session;

        const { searchParams } = new URL(request.url)
        const role = searchParams.get('role')
        const agency = searchParams.get('agency')
        const limit = parseInt(searchParams.get('limit') || '50')

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
