// Audit Log API: Blockchain-style immutable logging
import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createHash } from 'crypto'

// GET /api/audit - List audit logs
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams
        const action = searchParams.get('action')
        const resource = searchParams.get('resource')
        const userId = searchParams.get('userId')
        const limit = parseInt(searchParams.get('limit') || '100')
        const offset = parseInt(searchParams.get('offset') || '0')

        const where: Record<string, unknown> = {}
        if (action) where.action = action
        if (resource) where.resource = resource
        if (userId) where.userId = userId

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                take: limit,
                skip: offset,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, role: true }
                    },
                }
            }),
            prisma.auditLog.count({ where })
        ])

        return NextResponse.json({
            logs,
            total,
            limit,
            offset,
        })

    } catch (error) {
        console.error('[API] Get audit logs error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// POST /api/audit - Create audit log with blockchain-style hashing
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        const {
            action,
            resource,
            resourceId,
            userId,
            details,
            ipAddress,
            userAgent,
        } = data

        if (!action || !resource) {
            return NextResponse.json(
                { error: 'Action and resource are required' },
                { status: 400 }
            )
        }

        // Get the last audit log entry to chain hashes
        const lastLog = await prisma.auditLog.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { hash: true }
        })

        // Create hash for this entry (includes previous hash for chain)
        const timestamp = Date.now()
        const hashContent = `${action}-${resource}-${resourceId || ''}-${userId || ''}-${timestamp}-${lastLog?.hash || 'genesis'}`
        const hash = createHash('sha256').update(hashContent).digest('hex')

        const auditLog = await prisma.auditLog.create({
            data: {
                action,
                resource,
                resourceId,
                userId,
                details: details ? JSON.stringify(details) : null,
                ipAddress: ipAddress || request.headers.get('x-forwarded-for') || 'unknown',
                userAgent: userAgent || request.headers.get('user-agent') || 'unknown',
                hash,
                previousHash: lastLog?.hash || null,
            }
        })

        return NextResponse.json({
            success: true,
            auditLog,
        }, { status: 201 })

    } catch (error) {
        console.error('[API] Create audit log error:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// GET /api/audit/verify - Verify blockchain integrity
export async function verifyChain() {
    const logs = await prisma.auditLog.findMany({
        orderBy: { createdAt: 'asc' }
    })

    let isValid = true
    let previousHash: string | null = null

    for (const log of logs) {
        // Check if previousHash matches
        if (log.previousHash !== previousHash) {
            isValid = false
            break
        }
        previousHash = log.hash
    }

    return { isValid, totalLogs: logs.length }
}
