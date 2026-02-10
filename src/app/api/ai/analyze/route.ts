// AI Analysis API Route — POST /api/ai/analyze
// Provides real-time AI threat and incident analysis via Google Gemini

import { NextRequest, NextResponse } from 'next/server';
import {
    analyzeThreat,
    analyzeIncident,
    type ThreatAnalysisInput,
    type IncidentAnalysisInput,
} from '@/lib/ai';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20; // requests per window
const RATE_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

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
        // Rate limiting
        const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
        if (!checkRateLimit(clientIP)) {
            return NextResponse.json(
                { success: false, error: 'Rate limit exceeded. Try again in 60 seconds.' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { type, data } = body;

        if (!type || !data) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: type and data' },
                { status: 400 }
            );
        }

        if (type !== 'threat' && type !== 'incident') {
            return NextResponse.json(
                { success: false, error: 'Invalid type. Must be "threat" or "incident".' },
                { status: 400 }
            );
        }

        let analysis;

        if (type === 'threat') {
            const input: ThreatAnalysisInput = {
                name: data.name || 'Unknown Threat',
                type: data.type || 'CYBER_ATTACK',
                severity: data.severity || 'MEDIUM',
                description: data.description,
                indicators: data.indicators,
                targetSector: data.targetSector,
                sourceIP: data.sourceIP,
                targetSystem: data.targetSystem,
            };
            analysis = await analyzeThreat(input);
        } else {
            const input: IncidentAnalysisInput = {
                title: data.title || 'Unknown Incident',
                type: data.type || 'CYBER_ATTACK',
                severity: data.severity || 'MEDIUM',
                description: data.description,
                location: data.location,
                region: data.region,
                status: data.status,
            };
            analysis = await analyzeIncident(input);
        }

        return NextResponse.json({
            success: true,
            analysis,
            meta: {
                aiEnabled: !!process.env.GEMINI_API_KEY,
                model: process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'rule-based-fallback',
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
        aiEnabled: !!process.env.GEMINI_API_KEY,
        model: process.env.GEMINI_API_KEY ? 'gemini-2.0-flash' : 'rule-based-fallback',
        endpoint: '/api/ai/analyze',
        methods: ['POST'],
        usage: {
            type: '"threat" | "incident"',
            data: '{ name, type, severity, ... }',
        },
    });
}
