export interface NC4ReportData {
    timestamp: string;
    incidentId: string;
    assetCategory: 'TELECOMMUNICATIONS' | 'ELECTRICITY' | 'WATER' | 'FINANCE' | 'GOVERNMENT';
    mitreTechnique: string;
    piiAccessed: boolean;
    complianceStatus: 'COMPLIANT' | 'VIOLATION' | 'UNDER_REVIEW';
    narrative: string;
}

export function generateNC4Report(incidentId: string, assetType: string): NC4ReportData {
    // Logic to determine report details based on incident
    // Simulating deterministic generation for demonstration

    const isPiiHighRisk = assetType === 'FINANCE' || assetType === 'GOVERNMENT' || assetType === 'TELECOMMUNICATIONS';
    const technique = assetType === 'ELECTRICITY' ? 'T1078 - Valid Accounts' : 'T1190 - Exploit Public-Facing Application';

    return {
        timestamp: new Date().toISOString(),
        incidentId,
        assetCategory: assetType as NC4ReportData['assetCategory'],
        mitreTechnique: technique,
        piiAccessed: isPiiHighRisk,
        complianceStatus: isPiiHighRisk ? 'UNDER_REVIEW' : 'COMPLIANT',
        narrative: `Automated report generated pursuant to Kenya Computer Misuse and Cybercrime Act (2018). Incident involving ${assetType} infrastructure detected using technique ${technique}. ${isPiiHighRisk ? 'POTENTIAL PII EXPOSURE DETECTED - ODPC NOTIFICATION REQUIRED.' : 'No PII indicators found at this stage.'}`
    };
}
