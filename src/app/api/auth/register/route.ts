// Authentication API: Register — Gated with admin approval
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import bcrypt from 'bcryptjs'
import { createHash } from 'crypto'
import { checkRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/rateLimit'

// Allowed email domains (only government/authorized domains can self-register)
const ALLOWED_DOMAINS = [
    'gov.ke',
    'nctirs.go.ke',
    'police.go.ke',
    'nis.go.ke',
    'dci.go.ke',
    'nps.go.ke',
];

function isAllowedDomain(email: string): boolean {
    const domain = email.split('@')[1]?.toLowerCase();
    // In development, allow any domain; in production, enforce allowed domains
    if (process.env.NODE_ENV !== 'production') return true;
    return ALLOWED_DOMAINS.some(d => domain === d || domain?.endsWith(`.${d}`));
}

export async function POST(request: NextRequest) {
    try {
        // Rate limit: 5 registrations per minute per IP
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
        const rl = checkRateLimit(`register:${clientIP}`, RATE_LIMITS.STRICT);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Too many registration attempts. Try again later.' },
                { status: 429, headers: rateLimitHeaders(rl.remaining, rl.resetAt) }
            );
        }

        const { email, password, name, agency, department, role } = await request.json()

        if (!email || !password) {
            return NextResponse.json(
                { error: 'Email and password are required' },
                { status: 400 }
            )
        }

        // Enforce minimum password length
        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters' },
                { status: 400 }
            )
        }

        // Domain restriction
        if (!isAllowedDomain(email)) {
            return NextResponse.json(
                { error: 'Registration is restricted to authorized government domains' },
                { status: 403 }
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

        // Create user — isActive defaults to false, requiring admin approval
        // In production, a new user must be activated by an L3+ admin
        const requireApproval = process.env.NODE_ENV === 'production';

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name: name || email.split('@')[0],
                role: userRole,
                agency: agency || 'NIS',
                department: department || 'Cyber Division',
                clearanceLevel: clearanceLevels[userRole] || 1,
                isActive: !requireApproval, // Active immediately in dev, pending approval in prod
            },
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
            }
        })

        // Create audit log
        await prisma.auditLog.create({
            data: {
                action: 'REGISTER',
                resource: 'auth',
                userId: user.id,
                details: JSON.stringify({
                    email: user.email,
                    role: user.role,
                    requiresApproval: requireApproval,
                }),
                ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: request.headers.get('user-agent') || 'unknown',
                hash: createHash('sha256').update(`REGISTER-${user.id}-${Date.now()}`).digest('hex'),
            }
        })

        return NextResponse.json({
            success: true,
            user,
            message: requireApproval
                ? 'Account created. Awaiting admin approval before activation.'
                : 'Account created and activated.',
        }, { status: 201 })

    } catch (error) {
        console.error('[API] Register error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
