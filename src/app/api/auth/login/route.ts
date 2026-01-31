// Authentication API: Login
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Find user by email
        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                name: true,
                password: true,
                role: true,
                agency: true,
                department: true,
                clearanceLevel: true,
                isActive: true,
            }
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Account is disabled' },
                { status: 403 }
            )
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.password)
        if (!isValid) {
            return NextResponse.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            )
        }

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() }
        })

        // Create audit log
        await prisma.auditLog.create({
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

        // Return user data (without password)
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password: _, ...userWithoutPassword } = user

        // In production, you would set a secure HTTP-only cookie here
        // For now, return user data as JSON
        return NextResponse.json({
            success: true,
            user: userWithoutPassword,
            token: createHash('sha256').update(`${user.id}-${Date.now()}`).digest('hex'),
        })

    } catch (error) {
        console.error('[API] Login error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
