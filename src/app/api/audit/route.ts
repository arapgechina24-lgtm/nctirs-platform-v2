// Audit Log API: Blockchain-style immutable logging
import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// Dynamic import to avoid build errors
const getPrisma = async () => {
    try {
        const { default: prisma } = await import('@/lib/db')
        return prisma
    } catch {
        return null
    }
}

// Mock data for demo mode
const mockAuditLogs = [
    {
        id: 'audit-001',
        action: 'LOGIN',
        resource: 'users',
        resourceId: 'user-001',
        details: '{"ip": "192.168.1.1"}',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        hash: 'abc123def456',
        previousHash: null,
        createdAt: new Date(),
        userId: 'user-001',
        user: { id: 'user-001', name: 'Demo User', email: 'demo@nctirs.go.ke', role: 'L1' }
    },
    {
        id: 'audit-002',
        action: 'VIEW',
        resource: 'incidents',
        resourceId: 'inc-001',
        details: '{"incidentType": "CYBER_ATTACK"}',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        hash: 'def456ghi789',
        previousHash: 'abc123def456',
        createdAt: new Date(Date.now() - 60000),
        userId: 'user-001',
        user: { id: 'user-001', name: 'Demo User', email: 'demo@nctirs.go.ke', role: 'L1' }
    }
]

// GET /api/audit - List audit logs
export async function GET(request: NextRequest) {
    try {
        const prisma = await getPrisma()
        
        // If no database, return mock data for demo
        if (!prisma) {
            return NextResponse.json({
                logs: mockAuditLogs,
                total: mockAuditLogs.length,
                limit: 100,
                offset: 0,
                demo: true
            })
        }

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
        // Return mock data on error for demo
        return NextResponse.json({
            logs: mockAuditLogs,
            total: mockAuditLogs.length,
            limit: 100,
            offset: 0,
            demo: true
        })
    }
}

// POST /api/audit - Create audit log with blockchain-style hashing
export async function POST(request: NextRequest) {
    try {
        const prisma = await getPrisma()
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

        // If no database, return mock success for demo
        if (!prisma) {
            const timestamp = Date.now()
            const hash = createHash('sha256').update(`${action}-${resource}-${timestamp}`).digest('hex')
            
            return NextResponse.json({
                success: true,
                demo: true,
                auditLog: {
                    id: `audit-${timestamp}`,
                    action,
                    resource,
                    resourceId,
                    hash,
                    createdAt: new Date()
                }
            }, { status: 201 })
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
        // Return mock success for demo
        const timestamp = Date.now()
        return NextResponse.json({
            success: true,
            demo: true,
            auditLog: {
                id: `audit-${timestamp}`,
                hash: createHash('sha256').update(`demo-${timestamp}`).digest('hex'),
                createdAt: new Date()
            }
        }, { status: 201 })
    }
}
