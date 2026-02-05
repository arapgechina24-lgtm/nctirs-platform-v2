// Stats API: Dashboard statistics with demo mode
import { NextResponse } from 'next/server'
import { getPrismaClient } from '@/lib/db'

// Mock stats for demo
const mockStats = {
    incidents: {
        total: 42,
        active: 12,
        critical: 5,
        high: 15,
        resolved: 22
    },
    threats: {
        total: 128,
        apt: 8,
        ransomware: 15,
        ddos: 23,
        phishing: 45
    },
    responses: {
        total: 89,
        pending: 5,
        executing: 8,
        completed: 76
    },
    users: {
        total: 45,
        active: 38,
        l4Admin: 2,
        l3Director: 5
    },
    performance: {
        avgResponseTime: 342,
        threatDetectionRate: 94.2,
        falsePositiveRate: 1.8,
        systemUptime: 99.98
    }
}

// GET /api/stats - Get dashboard statistics
export async function GET() {
    try {
        const prisma = await getPrismaClient()

        // Demo mode - no database
        if (!prisma) {
            return NextResponse.json({
                stats: mockStats,
                timestamp: new Date().toISOString(),
                demo: true
            })
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const db = prisma as any

        const [
            incidentStats,
            threatStats,
            responseStats,
            userStats,
        ] = await Promise.all([
            db.incident.groupBy({ by: ['status'], _count: true }),
            db.threat.groupBy({ by: ['type'], _count: true }),
            db.response.groupBy({ by: ['status'], _count: true }),
            db.user.groupBy({ by: ['role'], _count: true }),
        ])

        const totalIncidents = incidentStats.reduce((sum: number, s: { _count: number }) => sum + s._count, 0)
        const activeIncidents = incidentStats.find((s: { status: string }) => s.status === 'ACTIVE')?._count || 0
        const criticalIncidents = await db.incident.count({ where: { severity: 'CRITICAL', status: 'ACTIVE' } })

        const totalThreats = threatStats.reduce((sum: number, s: { _count: number }) => sum + s._count, 0)
        const totalResponses = responseStats.reduce((sum: number, s: { _count: number }) => sum + s._count, 0)
        const totalUsers = userStats.reduce((sum: number, s: { _count: number }) => sum + s._count, 0)

        return NextResponse.json({
            stats: {
                incidents: {
                    total: totalIncidents,
                    active: activeIncidents,
                    critical: criticalIncidents,
                    byStatus: incidentStats,
                },
                threats: {
                    total: totalThreats,
                    byType: threatStats,
                },
                responses: {
                    total: totalResponses,
                    byStatus: responseStats,
                },
                users: {
                    total: totalUsers,
                    byRole: userStats,
                },
                performance: {
                    avgResponseTime: 342,
                    threatDetectionRate: 94.2,
                    falsePositiveRate: 1.8,
                    systemUptime: 99.98
                }
            },
            timestamp: new Date().toISOString(),
        })

    } catch (error) {
        console.error('[API] Stats error:', error)
        // Fallback to demo data on any error
        return NextResponse.json({
            stats: mockStats,
            timestamp: new Date().toISOString(),
            demo: true
        })
    }
}
