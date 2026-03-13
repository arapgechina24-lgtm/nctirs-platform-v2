'use server';

// Mock data items for the audit log
const MOCK_LOGS = Array.from({ length: 15 }).map((_, i) => ({
    id: `LOG-${Date.now()}-${i}`,
    timestamp: new Date(Date.now() - i * 1000 * 60 * 15).toISOString(),
    assetName: ['SEACOM Cable', 'Nairobi Data Center', 'Mombasa Port Server', 'JKIA Control'][i % 4],
    sector: ['Telecommunications', 'Government', 'Infrastructure', 'Transport'][i % 4],
    action: ['ISOLATION', 'DATA_MIRROR', 'SHUTDOWN', 'ACCESS_REVOKE'][i % 4],
    severity: ['CRITICAL', 'HIGH', 'MEDIUM', 'HIGH'][i % 4] as 'CRITICAL' | 'HIGH' | 'MEDIUM',
    notifiedNC4: true,
    receiptId: `NC4-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
    integrityHash: 'a1b2c3d4e5f67890...' + Math.random().toString(36).substr(2, 8),
}));

export async function addAuditLog(data: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
    // In a real implementation, this would write to a database or blockchain
    console.log('[AUDIT] Logging event:', data);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 500));

    return { success: true, id: `LOG-${Date.now()}` };
}

export async function getAuditLogs() {
    // Simulate fetching from DB
    await new Promise(resolve => setTimeout(resolve, 200));
    return MOCK_LOGS;
}

export async function verifyLogIntegrity(log: any) { // eslint-disable-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars
    // Simulate cryptographic verification
    await new Promise(resolve => setTimeout(resolve, 50));
    // Fail verification for 10% of logs to demo the feature
    return Math.random() > 0.1;
}
