// Authentication API: Register
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const { email, password, name, agency, department, role } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User already exists' },
                { status: 409 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12)

        // Validate role (default to L1 if not specified or invalid)
        const validRoles = ['L1', 'L2', 'L3', 'L4']
        const userRole = validRoles.includes(role) ? role : 'L1'

        // Map role to clearance level
        const clearanceLevels: Record<string, number> = { L1: 1, L2: 2, L3: 3, L4: 4 }

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
                role: userRole,
                agency: agency || 'NIS',
                department: department || 'Cyber Division',
                clearanceLevel: clearanceLevels[userRole] || 1,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                agency: true,
                department: true,
                clearanceLevel: true,
                createdAt: true,
            }
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'REGISTER',
                resource: 'auth',
                userId: user.id,
                details: JSON.stringify({ email: user.email, role: user.role }),
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                hash: createHash('sha256').update(`REGISTER-${user.id}-${Date.now()}`).digest('hex'),
            }
        })

        return NextResponse.json({
            success: true,
            user,
        }, { status: 201 })

    } catch (error) {
        console.error('[API] Register error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
