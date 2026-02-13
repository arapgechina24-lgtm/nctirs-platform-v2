import { CyberThreatSeverity, ResponseType } from '@/types';

export interface AutomatedResponseTrigger {
    id: string;
    threatType: string;
    severity: CyberThreatSeverity;
    action: ResponseType;
    autoApprove: boolean;
    description: string;
}

// Pre-defined response playbooks
const RESPONSE_PLAYBOOKS: AutomatedResponseTrigger[] = [
    {
        id: 'PB-001',
        threatType: 'RANSOMWARE',
        severity: 'CRITICAL',
        action: 'SYSTEM_ISOLATE',
        autoApprove: true,
        description: 'Immediately isolate infected hosts to prevent lateral movement.',
    },
    {
        id: 'PB-002',
        threatType: 'DDOS',
        severity: 'HIGH',
        action: 'IP_BLOCK',
        autoApprove: true,
        description: 'Block source IPs at the firewall level.',
    },
    {
        id: 'PB-003',
        threatType: 'APT',
        severity: 'CRITICAL',
        action: 'EVIDENCE_PRESERVE',
        autoApprove: true,
        description: 'Snapshot memory and logs for forensic analysis.',
    },
    {
        id: 'PB-004',
        threatType: 'DATA_BREACH',
        severity: 'HIGH',
        action: 'LOCKDOWN',
        autoApprove: false, // Requires manual approval
        description: 'Lock down user accounts and access points.',
    },
    {
        id: 'PB-005',
        threatType: 'TERRORISM',
        severity: 'CRITICAL',
        action: 'POLICE_DISPATCH',
        autoApprove: false, // Requires manual approval
        description: 'Dispatch Quick Response Team to physical location.',
    },
];

export function evaluateThreatResponse(threat: { type: string; severity: string }): AutomatedResponseTrigger | null {
    // Find matching playbook
    const match = RESPONSE_PLAYBOOKS.find(pb =>
        pb.threatType === threat.type && pb.severity === threat.severity
    );

    return match || null;
}

export function executeResponseAction(action: AutomatedResponseTrigger): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
        // Simulate execution latency
        setTimeout(() => {
            const success = Math.random() > 0.1; // 90% success rate simulation
            resolve({
                success,
                message: success
                    ? `Successfully executed ${action.action}: ${action.description}`
                    : `Failed to execute ${action.action}. Manual intervention required.`
            });
        }, 2000);
    });
}
