// Threat Intelligence Ingestion API
// POST /api/threats/ingest - Bulk import threat records
// Requires L3+ clearance

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'
import { createHash } from 'crypto'
import { requireRole } from '@/lib/rbac'
import { checkRateLimit, RATE_LIMITS, rateLimitHeaders } from '@/lib/rateLimit'

const VALID_TYPES = ['PHISHING', 'RANSOMWARE', 'DATA_BREACH', 'MALWARE', 'DDOS', 'APT', 'INSIDER_THREAT', 'IDENTITY_THEFT'] as const;
const VALID_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const VALID_IMPACTS = ['PII_EXPOSED', 'CREDENTIALS_LEAKED', 'FINANCIAL_DATA', 'HEALTH_RECORDS', 'NONE'] as const;

interface IngestRecord {
    title: string;
    description: string;
    type: string;
    severity: string;
    location?: string;
    latitude?: number;
    longitude?: number;
    county?: string;
    targetAsset?: string;
    attackVector?: string;
    mitreAttackId?: string;
    dataProtectionImpact?: string;
    indicators?: string[];
    threatName?: string;
    source?: string;
    targetSector?: string;
    confidence?: number;
    affectedCitizens?: number;
    dpaViolation?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Require L3+ clearance for bulk import
        const session = await requireRole('L3');
        if (session instanceof NextResponse) return session;

        // Rate limit
        const clientIP = request.headers.get('x-forwarded-for') || 'unknown';
        const rl = checkRateLimit(`ingest:${session.user?.email || clientIP}`, RATE_LIMITS.STRICT);
        if (!rl.allowed) {
            return NextResponse.json(
                { error: 'Rate limit exceeded' },
                { status: 429, headers: rateLimitHeaders(rl.remaining, rl.resetAt) }
            );
        }

        const body = await request.json();
        const records: IngestRecord[] = Array.isArray(body) ? body : body.records;

        if (!records || !Array.isArray(records) || records.length === 0) {
            return NextResponse.json(
                { error: 'Request body must contain an array of threat records (top-level array or { records: [...] })' },
                { status: 400 }
            );
        }

        if (records.length > 100) {
            return NextResponse.json(
                { error: 'Maximum 100 records per batch' },
                { status: 400 }
            );
        }

        const results = {
            total: records.length,
            created: 0,
            skipped: 0,
            errors: [] as { index: number; title: string; error: string }[],
        };

        for (let i = 0; i < records.length; i++) {
            const record = records[i];

            // Validate required fields
            if (!record.title || !record.type || !record.severity) {
                results.errors.push({ index: i, title: record.title || 'untitled', error: 'Missing required fields: title, type, severity' });
                results.skipped++;
                continue;
            }

            // Validate type
            if (!VALID_TYPES.includes(record.type as typeof VALID_TYPES[number])) {
                results.errors.push({ index: i, title: record.title, error: `Invalid type: ${record.type}. Must be one of: ${VALID_TYPES.join(', ')}` });
                results.skipped++;
                continue;
            }

            // Validate severity
            if (!VALID_SEVERITIES.includes(record.severity as typeof VALID_SEVERITIES[number])) {
                results.errors.push({ index: i, title: record.title, error: `Invalid severity: ${record.severity}` });
                results.skipped++;
                continue;
            }

            // Validate dataProtectionImpact if provided
            if (record.dataProtectionImpact && !VALID_IMPACTS.includes(record.dataProtectionImpact as typeof VALID_IMPACTS[number])) {
                results.errors.push({ index: i, title: record.title, error: `Invalid dataProtectionImpact: ${record.dataProtectionImpact}` });
                results.skipped++;
                continue;
            }

            try {
                // Use a transaction to create both incident and threat atomically
                await prisma.$transaction(async (tx) => {
                    const incident = await tx.incident.create({
                        data: {
                            title: record.title,
                            description: record.description || '',
                            type: record.type,
                            severity: record.severity,
                            status: 'ACTIVE',
                            location: record.location || null,
                            latitude: record.latitude ?? null,
                            longitude: record.longitude ?? null,
                            county: record.county || null,
                            targetAsset: record.targetAsset || null,
                            attackVector: record.attackVector || record.mitreAttackId || null,
                            indicators: record.indicators ? JSON.stringify(record.indicators) : null,
                            dataProtectionImpact: record.dataProtectionImpact || 'NONE',
                            mitreAttackId: record.mitreAttackId || null,
                            createdById: session.user?.id || null,
                        },
                    });

                    // Create linked threat
                    await tx.threat.create({
                        data: {
                            name: record.threatName || record.title,
                            type: record.type,
                            severity: record.severity,
                            source: record.source || null,
                            targetSector: record.targetSector || null,
                            confidence: record.confidence ?? 0.8,
                            mitreId: record.mitreAttackId || null,
                            description: record.description || null,
                            indicators: record.indicators ? JSON.stringify(record.indicators) : null,
                            affectedCitizens: record.affectedCitizens ?? null,
                            dpaViolation: record.dpaViolation || null,
                            incidentId: incident.id,
                        },
                    });

                    // Create audit log entry
                    await tx.auditLog.create({
                        data: {
                            action: 'INGEST',
                            resource: 'threats',
                            resourceId: incident.id,
                            userId: session.user?.id || null,
                            details: JSON.stringify({
                                title: record.title,
                                type: record.type,
                                severity: record.severity,
                                source: 'bulk_ingest',
                            }),
                            hash: createHash('sha256')
                                .update(`INGEST-${incident.id}-${Date.now()}`)
                                .digest('hex'),
                        },
                    });
                });

                results.created++;
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : 'Unknown database error';
                results.errors.push({ index: i, title: record.title, error: errorMsg });
                results.skipped++;
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                total: results.total,
                created: results.created,
                skipped: results.skipped,
                errors: results.errors.length,
            },
            errors: results.errors.length > 0 ? results.errors : undefined,
        }, { status: results.created > 0 ? 201 : 400 });

    } catch (error) {
        console.error('[API] Threat ingestion error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
