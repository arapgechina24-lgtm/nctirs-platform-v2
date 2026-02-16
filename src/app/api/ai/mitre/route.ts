// MITRE ATT&CK IOC Classification API — POST /api/ai/mitre
// Takes raw IOCs (IPs, hashes, domains, CVEs) and returns structured MITRE ATT&CK classifications

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import { classifyIOCs } from '@/lib/ai';
import { checkRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const MAX_INDICATORS = 50;

const IOCSchema = z.object({
    indicators: z
        .array(z.string().min(1).max(500))
        .min(1, 'At least one indicator is required')
        .max(MAX_INDICATORS, `Maximum ${MAX_INDICATORS} indicators per request`),
    context: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Rate limit
        const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
        const rl = checkRateLimit(
            `mitre:${session.user?.email || clientIP}`,
            RATE_LIMITS.AI
        );
        if (!rl.allowed) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Try again in 60 seconds.' },
                { status: 429, headers: rateLimitHeaders(rl.remaining, rl.resetAt) }
            );
        }

        const body = await req.json();
        const parseResult = IOCSchema.safeParse(body);

        if (!parseResult.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input', details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const result = await classifyIOCs(parseResult.data);

        return NextResponse.json({
            success: true,
            ...result,
            meta: {
                aiEnabled: !!process.env.GEMINI_API_KEY,
                model: process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'rule-based-fallback',
                maxIndicators: MAX_INDICATORS,
            },
        });
    } catch (error) {
        console.error('[API] MITRE classification error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error during classification' },
            { status: 500 }
        );
    }
}

// GET for health check
export async function GET() {
    return NextResponse.json({
        status: 'operational',
        endpoint: '/api/ai/mitre',
        methods: ['POST'],
        description: 'MITRE ATT&CK IOC Classifier — classify indicators of compromise against the MITRE framework',
    });
}
