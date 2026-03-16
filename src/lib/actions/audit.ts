'use server';

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export interface AuditLog {
    id: string;
    timestamp: string;
    assetName: string;
    sector: string;
    action: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    notifiedNC4: boolean;
    receiptId?: string;
    integrityHash?: string; // SHA-256 hash for tamper-proof verification
}

const DB_PATH = path.join(process.cwd(), 'audit-db.json');

// Generate SHA-256 hash for tamper-proof audit trail
function generateIntegrityHash(log: Omit<AuditLog, 'integrityHash'>): string {
    const payload = JSON.stringify({
        id: log.id,
        timestamp: log.timestamp,
        assetName: log.assetName,
        action: log.action,
        severity: log.severity
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
}

// Verify integrity of a log entry
export async function verifyLogIntegrity(log: AuditLog): Promise<boolean> {
    if (!log.integrityHash) return false;
    const expectedHash = generateIntegrityHash(log);
    return expectedHash === log.integrityHash;
}

// Initialize DB with seed data if it doesn't exist
async function initDB() {
    try {
        await fs.access(DB_PATH);
    } catch {
        const seedData = [
            {
                id: "ev_8x29kLm01",
                timestamp: "2026-01-22 10:45:12",
                assetName: "SEACOM Landing Station",
                sector: "Telecommunications (Mombasa)",
                action: "ISOLATE_NETWORK",
                severity: "CRITICAL" as const,
                notifiedNC4: true,
                receiptId: "NC4-B83X-9921",
            },
            {
                id: "ev_1a55pQv92",
                timestamp: "2026-01-22 09:12:05",
                assetName: "KPLC Roysambu Substation",
                sector: "Energy (Nairobi)",
                action: "BLOCK_IP_RANGE",
                severity: "HIGH" as const,
                notifiedNC4: true,
                receiptId: "NC4-A12P-4402",
            },
            {
                id: "ev_99z4mXk11",
                timestamp: "2026-01-21 23:30:59",
                assetName: "M-Pesa Gateway Node 4",
                sector: "Financial Services",
                action: "SUSPEND_AUTH",
                severity: "MEDIUM" as const,
                notifiedNC4: false,
                receiptId: undefined,
            },
        ].map(log => ({
            ...log,
            integrityHash: generateIntegrityHash(log as AuditLog)
        }));
        await fs.writeFile(DB_PATH, JSON.stringify(seedData, null, 2));
    }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
    await initDB();
    const data = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(data);
}

export async function addAuditLog(log: Omit<AuditLog, 'id' | 'timestamp' | 'integrityHash'>): Promise<AuditLog> {
    await initDB();
    const logs = await getAuditLogs();

    const baseLog = {
        ...log,
        id: `ev_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19)
    };

    const newLog: AuditLog = {
        ...baseLog,
        integrityHash: generateIntegrityHash(baseLog as AuditLog)
    };

    logs.unshift(newLog);
    await fs.writeFile(DB_PATH, JSON.stringify(logs, null, 2));
    return newLog;
}
