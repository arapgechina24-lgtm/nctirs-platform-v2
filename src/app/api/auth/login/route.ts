// Authentication API: Login with demo mode
import { NextRequest, NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'

// Demo user for demo mode
const demoUser = {
    id: 'demo-001',
    email: 'demo@nctirs.go.ke',
    name: 'Demo Analyst',
    role: 'L2',
    agency: 'NIS',
    department: 'Cyber Division',
    clearanceLevel: 2,
    isActive: true,
}

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        const prisma = await getPrismaClient()

        // Demo mode - accept any credentials
        if (!prisma) {
            return NextResponse.json({
                success: true,
                demo: true,
                user: { ...demoUser, email },
                token: createHash('sha256').update(`demo-${Date.now()}`).digest('hex'),
            })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any

        const user = await db.user.findUnique({
            where: { email },
            select: {
                id: true, email: true, name: true, password: true,
                role: true, agency: true, department: true,
                clearanceLevel: true, isActive: true,
            }
        })

        if (!user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        if (!user.isActive) {
            return NextResponse.json({ error: 'Account is disabled' }, { status: 403 })
        }

        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        })

        await db.auditLog.create({
            data: {
                action: 'LOGIN',
                resource: 'auth',
                userId: user.id,
                details: JSON.stringify({ email: user.email }),
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                hash: createHash('sha256').update(`LOGIN-${user.id}-${Date.now()}`).digest('hex'),
            }
        })

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user

        return NextResponse.json({
            success: true,
            user: userWithoutPassword,
            token: createHash('sha256').update(`${user.id}-${Date.now()}`).digest('hex'),
        })

    } catch (error) {
        console.error('[API] Login error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
