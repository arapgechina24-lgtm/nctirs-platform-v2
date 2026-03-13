import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic'; // Ensure this endpoint is never cached

// GET: Fetch active incidents and pending responses for OpenClaw to process
export async function GET(req: NextRequest) {
    try {
        // Require API key authentication — deny if key is not configured or doesn't match
        const authHeader = req.headers.get('authorization');
        if (!process.env.OPENCLAW_API_KEY || authHeader !== `Bearer ${process.env.OPENCLAW_API_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const activeIncidents = await prisma.incident.findMany({
            where: {
                status: { not: 'RESOLVED' }
            },
            include: {
                threats: true,
                responses: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const pendingResponses = await prisma.response.findMany({
            where: {
                status: 'PENDING'
            },
            include: {
                incident: true
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                incidents: activeIncidents,
                pending_actions: pendingResponses
            }
        });

    } catch (error) {
        console.error('OpenClaw Agent API Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}

// POST: OpenClaw reports back (New Incident, Threat Update, or Action Completion)
export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!process.env.OPENCLAW_API_KEY || authHeader !== `Bearer ${process.env.OPENCLAW_API_KEY}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { action, payload } = body;

        // 1. Report a new Incident
        if (action === 'REPORT_INCIDENT') {
            const newIncident = await prisma.incident.create({
                data: {
                    title: payload.title,
                    description: `${payload.description}\n\n[Source: OpenClaw Agent]`,
                    type: payload.type || 'CYBER_ATTACK',
                    severity: payload.severity || 'HIGH',
                    status: 'ACTIVE',
                    indicators: JSON.stringify(payload.indicators || {}),
                }
            });
            return NextResponse.json({ success: true, id: newIncident.id });
        }

        // 2. Report a specific Threat found within an existing incident
        if (action === 'REPORT_THREAT') {
            // Requires incidentId
            if (!payload.incidentId) {
                return NextResponse.json({ success: false, error: 'incidentId required' }, { status: 400 });
            }
            const newThreat = await prisma.threat.create({
                data: {
                    name: payload.name,
                    type: payload.type || 'MALWARE',
                    severity: payload.severity || 'MEDIUM',
                    confidence: payload.confidence || 0.8,
                    description: payload.description,
                    incidentId: payload.incidentId,
                    indicators: JSON.stringify(payload.indicators || {})
                }
            });
            return NextResponse.json({ success: true, id: newThreat.id });
        }

        // 3. Update Response/Action Status (e.g., "Firewall rule added")
        if (action === 'UPDATE_ACTION') {
            if (!payload.responseId || !payload.status) {
                return NextResponse.json({ success: false, error: 'responseId and status required' }, { status: 400 });
            }

            const updatedResponse = await prisma.response.update({
                where: { id: payload.responseId },
                data: {
                    status: payload.status,
                    result: payload.result, // Optional execution logs
                    completedAt: payload.status === 'COMPLETED' ? new Date() : undefined
                }
            });
            return NextResponse.json({ success: true, id: updatedResponse.id });
        }

        return NextResponse.json({ success: false, error: 'Unknown action type' }, { status: 400 });

    } catch (error) {
        console.error('OpenClaw Agent POST Error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
