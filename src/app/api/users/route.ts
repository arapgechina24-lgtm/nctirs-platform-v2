// Users API: with demo mode fallback
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

// Mock users for demo
const mockUsers = [
    {
        id: 'user-001',
        email: 'analyst@nctirs.go.ke',
        name: 'Demo Analyst',
        role: 'L1',
        agency: 'NIS',
        department: 'Cyber Division',
        isActive: true,
        createdAt: new Date()
    },
    {
        id: 'user-002',
        email: 'supervisor@nctirs.go.ke',
        name: 'Demo Supervisor',
        role: 'L2',
        agency: 'NIS',
        department: 'Operations',
        isActive: true,
        createdAt: new Date()
    }
]

// GET /api/users - List users (admin only)
export async function GET(request: NextRequest) {
    try {
        const prisma = await getPrismaClient()

        if (!prisma) {
            return NextResponse.json({
                users: mockUsers,
                total: mockUsers.length,
                demo: true
            })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any

        const searchParams = request.nextUrl.searchParams
        const role = searchParams.get('role')
        const agency = searchParams.get('agency')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: Record<string, unknown> = { isActive: true }
        if (role) where.role = role
        if (agency) where.agency = agency

        const [users, total] = await Promise.all([
            db.user.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true, email: true, name: true, role: true,
                    agency: true, department: true, isActive: true,
                    createdAt: true, lastLogin: true
                }
            }),
            db.user.count({ where })
        ])

        return NextResponse.json({ users, total, limit, offset })

    } catch (error) {
        console.error('[API] Get users error:', error)
        return NextResponse.json({
            users: mockUsers,
            total: mockUsers.length,
            demo: true
        })
    }
}
