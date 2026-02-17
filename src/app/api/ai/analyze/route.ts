// AI Analysis API Route — POST /api/ai/analyze
// Provides real-time AI threat and incident analysis via Google Gemini

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { z } from 'zod';
import {
    analyzeThreat,
    analyzeIncident,
    type ThreatAnalysisInput,
} from '@/lib/ai';
import { CyberThreatSeverity } from '@/types';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    // Cleanup expired entries to prevent memory leak (cap at 10K)
    if (rateLimitMap.size > 10000) {
        for (const [key, val] of rateLimitMap) {
            if (now > val.resetAt) rateLimitMap.delete(key);
        }
    }

    if (!entry || now > entry.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
        return true;
    }

    if (entry.count >= RATE_LIMIT) {
        return false;
    }

    entry.count++;
    return true;
}

export async function POST(req: NextRequest) {
    try {
        const session = await auth();
        if (!session) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Rate limiting
        const clientIP = req.headers.get('x-forwarded-for') || 'unknown';
        // Simple distinct rate limit for authenticated users (could use user ID instead of IP)
        if (!checkRateLimit(session.user?.email || clientIP)) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Try again in 60 seconds.' },
                { status: 429 }
            );
        }

        const body = await req.json();

        // Zod Schema Definition
        const AnalysisSchema = z.object({
            type: z.enum(['threat', 'incident']),
            data: z.object({
                // Common fields
                name: z.string().optional(),
                title: z.string().optional(),
                type: z.string().optional(),
                severity: z.string().optional(),
                description: z.string().optional(),
                // Threat specific
                indicators: z.array(z.string()).optional(),
                targetSector: z.string().optional(),
                sourceIP: z.string().optional(),
                targetSystem: z.string().optional(),
                // Incident specific
                location: z.string().optional(),
                region: z.string().optional(),
                status: z.string().optional(),
            }),
            provider: z.string().optional(),
        });

        const parseResult = AnalysisSchema.safeParse(body);
        if (!parseResult.success) {
            return NextResponse.json(
                { success: false, error: 'Invalid input', details: parseResult.error.format() },
                { status: 400 }
            );
        }

        const { type, data, provider } = parseResult.data;
        let analysis;

        if (type === 'threat') {
            const input: ThreatAnalysisInput = {
                name: data.name || 'Unknown Threat',
                type: data.type || 'CYBER_ATTACK',
                severity: (data.severity as CyberThreatSeverity) || 'MEDIUM',
                description: data.description || '',
                indicators: data.indicators,
                targetSector: data.targetSector,
                sourceIP: data.sourceIP,
                targetSystem: data.targetSystem,
            };
            analysis = await analyzeThreat(input, provider);
        } else {
            const input: IncidentAnalysisInput = {
                title: data.title || 'Unknown Incident',
                type: data.type || 'CYBER_ATTACK',
                severity: (data.severity as CyberThreatSeverity) || 'MEDIUM',
                description: data.description || '',
                location: data.location || '',
                region: data.region || '',
                status: data.status || 'OPEN',
            };
            analysis = await analyzeIncident(input, provider);
        }

        return NextResponse.json({
            success: true,
            analysis,
            meta: {
                aiEnabled: !!process.env.GEMINI_API_KEY || !!process.env.ANTHROPIC_API_KEY,
                provider: analysis?.source || (process.env.AI_PROVIDER || 'gemini'),
                model: analysis?.source === 'anthropic' ? 'claude-3-opus' : (process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'rule-based-fallback'),
            },
        });
    } catch (error) {
        console.error('[API] AI Analysis error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error during analysis' },
            { status: 500 }
        );
    }
}

// GET for health check
export async function GET() {
    return NextResponse.json({
        status: 'operational',
        aiEnabled: !!process.env.GEMINI_API_KEY || !!process.env.ANTHROPIC_API_KEY,
        providers: {
            gemini: !!process.env.GEMINI_API_KEY,
            anthropic: !!process.env.ANTHROPIC_API_KEY,
        },
        defaultProvider: process.env.AI_PROVIDER || 'gemini',
        endpoint: '/api/ai/analyze',
        methods: ['POST'],
        usage: {
            type: '"threat" | "incident"',
            data: '{ name, type, severity, ... }',
        },
    });
}
