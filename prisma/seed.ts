/**
 * Prisma DB Seed Script
 * Seeds the database with the Kenya Cyber Threat Intelligence dataset,
 * admin users, and surveillance feeds.
 * 
 * Run: npx prisma db seed
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ---- Inline dataset (avoiding @/ path alias issues in seed) ----

const REGIONS = ['NAIROBI', 'MOMBASA', 'KISUMU', 'NAKURU', 'ELDORET', 'TURKANA', 'GARISSA', 'MANDERA'] as const;
const INCIDENT_TYPES = ['PHISHING', 'RANSOMWARE', 'DATA_BREACH', 'MALWARE', 'DDOS', 'APT', 'INSIDER_THREAT', 'IDENTITY_THEFT'] as const;
const SEVERITY_LEVELS = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'] as const;
const STATUSES = ['ACTIVE', 'INVESTIGATING', 'CONTAINED', 'RESOLVED'] as const;

interface SeedThreatRecord {
    id: string;
    title: string;
    description: string;
    type: typeof INCIDENT_TYPES[number];
    threatLevel: typeof SEVERITY_LEVELS[number];
    targetSystem: string;
    targetSector: string;
    region: typeof REGIONS[number];
    locationName: string;
    coordinates: [number, number];
    mitreAttackId: string;
    dataProtectionImpact: string;
    affectedCitizens: number;
    iocIndicators: string[];
    dpaViolation?: string;
    aiConfidence: number;
    sources: string[];
}

// 30 seed records covering all 8 types
const SEED_THREATS: SeedThreatRecord[] = [
    {
        id: 'KCT-001', title: 'eCitizen Portal Credential Harvesting Campaign',
        description: 'Sophisticated phishing campaign impersonating eCitizen.go.ke portal targeting government employees and citizens seeking online services.',
        type: 'PHISHING', threatLevel: 'CRITICAL', targetSystem: 'eCitizen Portal', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1566.001', dataProtectionImpact: 'CREDENTIALS_LEAKED', affectedCitizens: 45000,
        iocIndicators: ['domain:ecitizen-verify.co.ke', 'hash:a3f2b8c9d1e4f5a6b7c8d9e0f1a2b3c4', 'ip:185.234.72.0/24'],
        dpaViolation: 'Section 41 - Unauthorized collection of personal data', aiConfidence: 96,
        sources: ['KE-CIRT/CC', 'OSINT', 'Citizen Reports'],
    },
    {
        id: 'KCT-002', title: 'KRA iTax Phishing - Tax Refund Scam',
        description: 'SMS and email phishing claiming KRA tax refunds, redirecting to fake iTax portal. Harvests KRA PINs, ID numbers, and bank details.',
        type: 'PHISHING', threatLevel: 'HIGH', targetSystem: 'KRA iTax', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'Westlands', coordinates: [-1.2672, 36.8078],
        mitreAttackId: 'T1566.002', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 23000,
        iocIndicators: ['domain:kra-refund-portal.com', 'ip:91.215.85.0/24'],
        dpaViolation: 'Section 43 - Processing without consent', aiConfidence: 94,
        sources: ['KRA Security Team', 'OSINT', 'Dark Web Intel'],
    },
    {
        id: 'KCT-003', title: 'M-Pesa Agent Verification Phishing',
        description: 'Social engineering campaign targeting M-Pesa agents with fake verification SMS messages leading to credential theft.',
        type: 'PHISHING', threatLevel: 'HIGH', targetSystem: 'M-Pesa Infrastructure', targetSector: 'FINANCIAL',
        region: 'MOMBASA', locationName: 'Mombasa CBD', coordinates: [-4.0435, 39.6682],
        mitreAttackId: 'T1598.003', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 8500,
        iocIndicators: ['domain:mpesa-verify-agent.com', 'hash:e7f8a9b0c1d2e3f4a5b6c7d8'],
        aiConfidence: 92, sources: ['Safaricom Security', 'CAK', 'Citizen Reports'],
    },
    {
        id: 'KCT-006', title: 'LOCKBIT 4.0 Attack on KPLC Grid Systems',
        description: 'Ransomware deployment targeting Kenya Power control systems. SCADA network partially encrypted.',
        type: 'RANSOMWARE', threatLevel: 'CRITICAL', targetSystem: 'KPLC Grid Control', targetSector: 'ENERGY',
        region: 'NAIROBI', locationName: 'Industrial Area', coordinates: [-1.3246, 36.8433],
        mitreAttackId: 'T1486', dataProtectionImpact: 'NONE', affectedCitizens: 2000000,
        iocIndicators: ['hash:d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', 'domain:lockbit4-ransom.onion'],
        aiConfidence: 98, sources: ['KPLC SOC', 'KE-CIRT/CC', 'Network Logs'],
    },
    {
        id: 'KCT-007', title: 'BlackCat Ransomware - Mombasa Port Authority',
        description: 'ALPHV/BlackCat ransomware variant targeting Kenya Ports Authority logistics systems, disrupting cargo manifests.',
        type: 'RANSOMWARE', threatLevel: 'CRITICAL', targetSystem: 'Kenya Ports Authority', targetSector: 'TRANSPORT',
        region: 'MOMBASA', locationName: 'Port Reitz', coordinates: [-4.0733, 39.6347],
        mitreAttackId: 'T1486', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 50000,
        iocIndicators: ['hash:b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6', 'domain:blackcat-leak.onion'],
        aiConfidence: 95, sources: ['KPA Security', 'INTERPOL IGCI'],
    },
    {
        id: 'KCT-008', title: 'Conti Variant Targeting Nairobi Hospital Network',
        description: 'Healthcare-focused ransomware encrypting patient records across private hospital network.',
        type: 'RANSOMWARE', threatLevel: 'HIGH', targetSystem: 'Hospital EHR Systems', targetSector: 'HEALTHCARE',
        region: 'NAIROBI', locationName: 'Westlands', coordinates: [-1.2672, 36.8078],
        mitreAttackId: 'T1486', dataProtectionImpact: 'HEALTH_RECORDS', affectedCitizens: 180000,
        iocIndicators: ['hash:f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5'],
        dpaViolation: 'Section 44 - Failure to protect health data', aiConfidence: 91,
        sources: ['Hospital ICT', 'KE-CIRT/CC'],
    },
    {
        id: 'KCT-009', title: 'eCitizen Platform Major Data Breach',
        description: 'Unauthorized access to eCitizen database exposing passport details, birth certificates, and national ID data.',
        type: 'DATA_BREACH', threatLevel: 'CRITICAL', targetSystem: 'eCitizen Portal', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1530', dataProtectionImpact: 'PII_EXPOSED', affectedCitizens: 700000,
        iocIndicators: ['ip:194.26.29.0/24', 'hash:a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6'],
        dpaViolation: 'Section 41 - Breach of data security obligations', aiConfidence: 97,
        sources: ['KE-CIRT/CC', 'Dark Web Intel', 'International Partners'],
    },
    {
        id: 'KCT-010', title: 'CBK Mobile Banking Data Exfiltration',
        description: 'Sophisticated SQL injection chain targeting Central Bank-connected mobile banking APIs.',
        type: 'DATA_BREACH', threatLevel: 'CRITICAL', targetSystem: 'CBK Core Banking', targetSector: 'FINANCIAL',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1190', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 350000,
        iocIndicators: ['ip:91.132.92.0/24', 'domain:cbk-api-shadow.com'],
        dpaViolation: 'Section 43 - Unauthorized processing of financial data', aiConfidence: 93,
        sources: ['CBK SOC', 'Financial ISAC'],
    },
    {
        id: 'KCT-011', title: 'IEBC Voter Database Leak',
        description: 'Partial exfiltration of voter registration data from IEBC systems including biometric references.',
        type: 'DATA_BREACH', threatLevel: 'HIGH', targetSystem: 'IEBC Voter Register', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'Eastleigh', coordinates: [-1.2764, 36.8392],
        mitreAttackId: 'T1005', dataProtectionImpact: 'PII_EXPOSED', affectedCitizens: 500000,
        iocIndicators: ['hash:c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9'],
        dpaViolation: 'Section 41 - Failure to implement appropriate safeguards', aiConfidence: 88,
        sources: ['IEBC ICT', 'OSINT'],
    },
    {
        id: 'KCT-013', title: 'Trojan on Safaricom Internal Network',
        description: 'Remote access Trojan (RAT) detected on Safaricom internal engineering workstations.',
        type: 'MALWARE', threatLevel: 'CRITICAL', targetSystem: 'Safaricom Core Network', targetSector: 'TELECOM',
        region: 'NAIROBI', locationName: 'Westlands', coordinates: [-1.2672, 36.8078],
        mitreAttackId: 'T1059.001', dataProtectionImpact: 'CREDENTIALS_LEAKED', affectedCitizens: 30000000,
        iocIndicators: ['hash:e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3', 'c2:command-relay-ke.ddns.net', 'ip:77.91.124.0/24'],
        aiConfidence: 96, sources: ['Safaricom SOC', 'Threat Intel Partner'],
    },
    {
        id: 'KCT-014', title: 'Wiper Malware on JKIA Control Systems',
        description: 'Destructive wiper malware detected attempting to corrupt JKIA flight management systems.',
        type: 'MALWARE', threatLevel: 'CRITICAL', targetSystem: 'JKIA Control Systems', targetSector: 'TRANSPORT',
        region: 'NAIROBI', locationName: 'Industrial Area', coordinates: [-1.3246, 36.8433],
        mitreAttackId: 'T1485', dataProtectionImpact: 'NONE', affectedCitizens: 500000,
        iocIndicators: ['hash:d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', 'mutex:GlobalWiperKE2026'],
        aiConfidence: 97, sources: ['KAA Security', 'NIS', 'Network Logs'],
    },
    {
        id: 'KCT-015', title: 'Banking Trojan Targeting Equity Bank Customers',
        description: 'Android banking Trojan distributed via fake Equity Mobile app on third-party stores.',
        type: 'MALWARE', threatLevel: 'HIGH', targetSystem: 'Equity Mobile Banking', targetSector: 'FINANCIAL',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1409', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 17000,
        iocIndicators: ['apk:com.equity.mobile.fake', 'hash:a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7'],
        dpaViolation: 'Section 43 - Unauthorized processing', aiConfidence: 90,
        sources: ['Equity SOC', 'Google Play Protect', 'CAK'],
    },
    {
        id: 'KCT-017', title: 'Volumetric DDoS on NTSA TIMS Portal',
        description: 'Sustained 1.2Tbps volumetric DDoS attack on NTSA TIMS disrupting vehicle registration.',
        type: 'DDOS', threatLevel: 'HIGH', targetSystem: 'NTSA TIMS Portal', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1498.001', dataProtectionImpact: 'NONE', affectedCitizens: 150000,
        iocIndicators: ['botnet:Mirai-KE-variant', 'ip:185.220.101.0/24'],
        aiConfidence: 94, sources: ['NTSA ICT', 'ISP Partners', 'KE-CIRT/CC'],
    },
    {
        id: 'KCT-018', title: 'Application Layer DDoS on NSE Trading Platform',
        description: 'HTTP flood targeting Nairobi Securities Exchange causing trading halts.',
        type: 'DDOS', threatLevel: 'CRITICAL', targetSystem: 'NSE Trading Platform', targetSector: 'FINANCIAL',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1499.003', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 75000,
        iocIndicators: ['ip:23.227.38.0/24', 'ua:Bot/DDoS-KE-2026'],
        aiConfidence: 92, sources: ['NSE SOC', 'CMA', 'Network Logs'],
    },
    {
        id: 'KCT-019', title: 'DDoS Campaign Against Kenyan ISPs',
        description: 'Coordinated DDoS attacks against multiple Kenyan ISPs affecting internet connectivity nationwide.',
        type: 'DDOS', threatLevel: 'HIGH', targetSystem: 'National Fiber Backbone', targetSector: 'TELECOM',
        region: 'NAIROBI', locationName: 'Industrial Area', coordinates: [-1.3246, 36.8433],
        mitreAttackId: 'T1498.002', dataProtectionImpact: 'NONE', affectedCitizens: 5000000,
        iocIndicators: ['ip:45.95.169.0/24', 'protocol:DNS-amplification'],
        aiConfidence: 91, sources: ['KIXP', 'ISP Consortium', 'CAK'],
    },
    {
        id: 'KCT-020', title: 'APT-KE-001 SANDSTORM - State Ministry Espionage',
        description: 'Long-running APT campaign targeting Ministry of Foreign Affairs email servers for diplomatic intelligence.',
        type: 'APT', threatLevel: 'CRITICAL', targetSystem: 'MFA Email Infrastructure', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1078.004', dataProtectionImpact: 'PII_EXPOSED', affectedCitizens: 5000,
        iocIndicators: ['c2:apt-ke-sandstorm.ddns.net', 'hash:c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0', 'ip:203.0.113.0/24'],
        aiConfidence: 97, sources: ['NIS', 'International SIGINT', 'Network Logs'],
    },
    {
        id: 'KCT-021', title: 'APT-KE-002 BUSHFIRE - SEACOM Cable Surveillance',
        description: 'Persistent access to SEACOM submarine cable landing station for traffic interception.',
        type: 'APT', threatLevel: 'CRITICAL', targetSystem: 'SEACOM Landing Station', targetSector: 'TELECOM',
        region: 'MOMBASA', locationName: 'Nyali', coordinates: [-4.0181, 39.7121],
        mitreAttackId: 'T1040', dataProtectionImpact: 'PII_EXPOSED', affectedCitizens: 10000000,
        iocIndicators: ['implant:seacom-intercept-v2', 'ip:198.51.100.0/24'],
        aiConfidence: 95, sources: ['NIS', 'SEACOM Operations', 'International Partners'],
    },
    {
        id: 'KCT-022', title: 'APT-KE-003 MONSOON - Defense Network Intrusion',
        description: 'APT group maintaining persistence in KDF military communications through compromised firmware.',
        type: 'APT', threatLevel: 'CRITICAL', targetSystem: 'KDF Communications', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'Eastleigh', coordinates: [-1.2764, 36.8392],
        mitreAttackId: 'T1195.003', dataProtectionImpact: 'CREDENTIALS_LEAKED', affectedCitizens: 25000,
        iocIndicators: ['firmware:modified-cisco-ios-ke', 'c2:monsoon-c2.example.com'],
        aiConfidence: 93, sources: ['KDF Cyber Command', 'NIS', 'SIGINT'],
    },
    {
        id: 'KCT-024', title: 'IFMIS Insider Data Theft',
        description: 'Privileged government employee exfiltrating procurement data from IFMIS.',
        type: 'INSIDER_THREAT', threatLevel: 'HIGH', targetSystem: 'IFMIS', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1567.002', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 10000,
        iocIndicators: ['user:admin-ifmis-compromised', 'cloud:gdrive-exfil-ke'],
        dpaViolation: 'Section 42 - Breach of confidentiality by data processor', aiConfidence: 86,
        sources: ['IFMIS Audit', 'DCI Cyber Unit'],
    },
    {
        id: 'KCT-025', title: 'Telco Employee Selling Customer Data',
        description: 'Telecom employee selling subscriber location data, call records, and M-Pesa histories.',
        type: 'INSIDER_THREAT', threatLevel: 'HIGH', targetSystem: 'Telco CRM Systems', targetSector: 'TELECOM',
        region: 'NAIROBI', locationName: 'Westlands', coordinates: [-1.2672, 36.8078],
        mitreAttackId: 'T1078', dataProtectionImpact: 'PII_EXPOSED', affectedCitizens: 250000,
        iocIndicators: ['user:insider-telco-2026', 'exfil:usb-device-detected'],
        dpaViolation: 'Section 41(d) - Processing beyond authorized purpose', aiConfidence: 91,
        sources: ['Telco Internal Audit', 'CAK', 'DCI'],
    },
    {
        id: 'KCT-026', title: 'Bank Teller Credential Abuse',
        description: 'Multiple branch tellers using shared admin credentials to access customer accounts.',
        type: 'INSIDER_THREAT', threatLevel: 'MEDIUM', targetSystem: 'Core Banking Systems', targetSector: 'FINANCIAL',
        region: 'KISUMU', locationName: 'Kisumu Central', coordinates: [-0.0917, 34.7680],
        mitreAttackId: 'T1078.001', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 4500,
        iocIndicators: ['user:shared-admin-branch-ksm'],
        dpaViolation: 'Section 43 - Processing without data subject consent', aiConfidence: 84,
        sources: ['Bank Internal Audit', 'CBK Supervision'],
    },
    {
        id: 'KCT-027', title: 'Digital ID System Identity Fraud Ring',
        description: 'Criminal network using stolen biometric data to create fraudulent Digital IDs.',
        type: 'IDENTITY_THEFT', threatLevel: 'CRITICAL', targetSystem: 'Digital ID System', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'Eastleigh', coordinates: [-1.2764, 36.8392],
        mitreAttackId: 'T1588.002', dataProtectionImpact: 'PII_EXPOSED', affectedCitizens: 15000,
        iocIndicators: ['biometric:stolen-fingerprint-db', 'sim:bulk-swap-detected'],
        dpaViolation: 'Section 41 - Breach of biometric data security', aiConfidence: 92,
        sources: ['DCI', 'CAK', 'Telco Partners'],
    },
    {
        id: 'KCT-028', title: 'Synthetic Identity Fraud - Mobile Loans',
        description: 'Fraudsters creating synthetic identities to obtain mobile loans from digital lending platforms.',
        type: 'IDENTITY_THEFT', threatLevel: 'HIGH', targetSystem: 'Digital Lending Platforms', targetSector: 'FINANCIAL',
        region: 'NAIROBI', locationName: 'Kibera', coordinates: [-1.3127, 36.7885],
        mitreAttackId: 'T1589.001', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 8000,
        iocIndicators: ['pattern:synthetic-id-cluster-ke'],
        aiConfidence: 87, sources: ['Digital Lenders Association', 'CRB Kenya'],
    },
    {
        id: 'KCT-029', title: 'SIM Swap Fraud Ring - Garissa',
        description: 'Organized SIM swap fraud ring operating from Garissa targeting elderly citizens.',
        type: 'IDENTITY_THEFT', threatLevel: 'MEDIUM', targetSystem: 'Telecom SIM Management', targetSector: 'TELECOM',
        region: 'GARISSA', locationName: 'Garissa Town', coordinates: [-0.4569, 39.6403],
        mitreAttackId: 'T1556', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 3200,
        iocIndicators: ['pattern:sim-swap-garissa-ring'],
        aiConfidence: 83, sources: ['DCI Garissa', 'CAK', 'Citizen Reports'],
    },
    {
        id: 'KCT-034', title: 'Akira Ransomware - County Government Systems',
        description: 'Akira ransomware encrypting county government financial systems.',
        type: 'RANSOMWARE', threatLevel: 'HIGH', targetSystem: 'County IFMIS Systems', targetSector: 'GOVERNMENT',
        region: 'ELDORET', locationName: 'Eldoret Town', coordinates: [0.5143, 35.2698],
        mitreAttackId: 'T1486', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 100000,
        iocIndicators: ['hash:d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7', 'domain:akira-leak-ke.onion'],
        aiConfidence: 89, sources: ['County ICT', 'KE-CIRT/CC'],
    },
    {
        id: 'KCT-035', title: 'APT-KE-004 SAVANNA - Oil Pipeline Monitoring',
        description: 'State-sponsored actor maintaining persistent access to oil pipeline monitoring systems in Turkana.',
        type: 'APT', threatLevel: 'CRITICAL', targetSystem: 'Oil Pipeline Monitoring', targetSector: 'ENERGY',
        region: 'TURKANA', locationName: 'Lodwar', coordinates: [3.1190, 35.5970],
        mitreAttackId: 'T1195.002', dataProtectionImpact: 'NONE', affectedCitizens: 500000,
        iocIndicators: ['c2:savanna-ke-apt.onion', 'backdoor:pipeline-mon-v2.dll'],
        aiConfidence: 94, sources: ['NIS', 'Energy Ministry', 'International Partners'],
    },
    {
        id: 'KCT-036', title: 'Immigration Officer Selling Passport Data',
        description: 'Immigration officer selling passport application data and travel histories.',
        type: 'INSIDER_THREAT', threatLevel: 'HIGH', targetSystem: 'Immigration Database', targetSector: 'GOVERNMENT',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1530', dataProtectionImpact: 'PII_EXPOSED', affectedCitizens: 50000,
        iocIndicators: ['user:insider-immigration-2026'],
        dpaViolation: 'Section 42 - Breach of confidentiality', aiConfidence: 88,
        sources: ['Internal Affairs', 'DCI'],
    },
    {
        id: 'KCT-037', title: 'Deepfake Voice KYC Bypass',
        description: 'Criminals using AI-generated deepfake voices to bypass voice-based KYC verification.',
        type: 'IDENTITY_THEFT', threatLevel: 'HIGH', targetSystem: 'Banking KYC Systems', targetSector: 'FINANCIAL',
        region: 'NAIROBI', locationName: 'CBD', coordinates: [-1.2864, 36.8172],
        mitreAttackId: 'T1589.003', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 2100,
        iocIndicators: ['ai-tool:deepfake-voice-ke', 'pattern:kyc-bypass-cluster'],
        aiConfidence: 85, sources: ['Banking ISAC', 'AI Threat Research'],
    },
    {
        id: 'KCT-038', title: 'Cross-Border M-Pesa Fraud Network',
        description: 'International fraud network exploiting M-Pesa Global cross-border payment system.',
        type: 'IDENTITY_THEFT', threatLevel: 'CRITICAL', targetSystem: 'M-Pesa Global', targetSector: 'FINANCIAL',
        region: 'MANDERA', locationName: 'Mandera Town', coordinates: [3.9366, 41.8550],
        mitreAttackId: 'T1583.003', dataProtectionImpact: 'FINANCIAL_DATA', affectedCitizens: 25000,
        iocIndicators: ['pattern:mpesa-global-abuse', 'ip:41.206.0.0/16'],
        aiConfidence: 90, sources: ['DCI', 'FRC Kenya', 'INTERPOL'],
    },
];

const SURVEILLANCE_FEEDS = [
    { location: 'Nairobi CBD - Kenyatta Avenue', type: 'CCTV', latitude: -1.2864, longitude: 36.8172, streamUrl: 'rtsp://nctirs-cam-001.ke/live' },
    { location: 'JKIA International Terminal', type: 'CCTV', latitude: -1.3246, longitude: 36.9274, streamUrl: 'rtsp://nctirs-cam-002.ke/live' },
    { location: 'Mombasa Port - Gate 1', type: 'ANPR', latitude: -4.0435, longitude: 39.6682, streamUrl: 'rtsp://nctirs-cam-003.ke/live' },
    { location: 'Nakuru Town Center', type: 'CCTV', latitude: -0.3031, longitude: 36.0800, streamUrl: 'rtsp://nctirs-cam-004.ke/live' },
    { location: 'Kisumu Lakefront', type: 'CCTV', latitude: -0.0917, longitude: 34.7680, streamUrl: 'rtsp://nctirs-cam-005.ke/live' },
    { location: 'Eldoret Highway', type: 'ANPR', latitude: 0.5143, longitude: 35.2698, streamUrl: 'rtsp://nctirs-cam-006.ke/live' },
    { location: 'Garissa Bridge Checkpoint', type: 'CCTV', latitude: -0.4569, longitude: 39.6403, streamUrl: 'rtsp://nctirs-cam-007.ke/live' },
    { location: 'Turkana Oil Pipeline', type: 'DRONE', latitude: 3.1190, longitude: 35.5970, streamUrl: 'rtsp://nctirs-cam-008.ke/live' },
    { location: 'Mandera Border Post', type: 'CCTV', latitude: 3.9366, longitude: 41.8550, streamUrl: 'rtsp://nctirs-cam-009.ke/live' },
    { location: 'Westlands Commercial District', type: 'CCTV', latitude: -1.2672, longitude: 36.8078, streamUrl: 'rtsp://nctirs-cam-010.ke/live' },
];

async function main() {
    console.log('🌱 Seeding NCTIRS database...\n');

    // 1. Create admin users
    console.log('👤 Creating admin users...');
    const hashedPassword = await bcrypt.hash('admin@nctirs2026', 12);

    const admin = await prisma.user.upsert({
        where: { email: 'admin@nctirs.go.ke' },
        update: {},
        create: {
            email: 'admin@nctirs.go.ke',
            name: 'System Administrator',
            password: hashedPassword,
            role: 'L4',
            agency: 'NCTIRS',
            department: 'Cybersecurity Operations',
            clearanceLevel: 4,
            isActive: true,
        },
    });

    const analyst = await prisma.user.upsert({
        where: { email: 'analyst@nctirs.go.ke' },
        update: {},
        create: {
            email: 'analyst@nctirs.go.ke',
            name: 'Senior Cyber Analyst',
            password: await bcrypt.hash('analyst@nctirs2026', 12),
            role: 'L2',
            agency: 'KE-CIRT/CC',
            department: 'Threat Intelligence',
            clearanceLevel: 2,
            isActive: true,
        },
    });

    console.log(`   ✅ Created admin: ${admin.email} (L4)`);
    console.log(`   ✅ Created analyst: ${analyst.email} (L2)`);

    // 2. Seed incidents + linked threats from Kenya cyber dataset
    console.log('\n🔒 Seeding cyber threat incidents...');
    let incidentCount = 0;
    let threatCount = 0;

    for (const record of SEED_THREATS) {
        const status = STATUSES[Math.floor(Math.random() * STATUSES.length)];
        const daysAgo = Math.floor(Math.random() * 30);
        const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

        // Create the incident
        const incident = await prisma.incident.create({
            data: {
                title: record.title,
                description: record.description,
                type: record.type,
                severity: record.threatLevel,
                status,
                location: record.locationName,
                latitude: record.coordinates[0],
                longitude: record.coordinates[1],
                county: record.region,
                targetAsset: record.targetSystem,
                attackVector: record.mitreAttackId,
                indicators: JSON.stringify(record.iocIndicators),
                dataProtectionImpact: record.dataProtectionImpact,
                mitreAttackId: record.mitreAttackId,
                createdById: admin.id,
                createdAt,
                detectedAt: createdAt,
                resolvedAt: status === 'RESOLVED' ? new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
            },
        });
        incidentCount++;

        // Create a linked threat for each incident
        await prisma.threat.create({
            data: {
                name: record.title,
                type: record.type,
                severity: record.threatLevel,
                source: record.sources[0],
                targetSector: record.targetSector,
                confidence: record.aiConfidence / 100,
                mitreId: record.mitreAttackId,
                description: record.description,
                indicators: JSON.stringify(record.iocIndicators),
                affectedCitizens: record.affectedCitizens,
                dpaViolation: record.dpaViolation || null,
                incidentId: incident.id,
                createdAt,
            },
        });
        threatCount++;
    }

    console.log(`   ✅ Created ${incidentCount} incidents`);
    console.log(`   ✅ Created ${threatCount} linked threats`);

    // 3. Seed surveillance feeds
    console.log('\n📹 Seeding surveillance feeds...');
    for (const feed of SURVEILLANCE_FEEDS) {
        await prisma.surveillanceFeed.create({
            data: {
                location: feed.location,
                type: feed.type,
                status: 'ACTIVE',
                latitude: feed.latitude,
                longitude: feed.longitude,
                streamUrl: feed.streamUrl,
            },
        });
    }
    console.log(`   ✅ Created ${SURVEILLANCE_FEEDS.length} surveillance feeds`);

    // 4. Create initial audit log
    console.log('\n📋 Creating genesis audit log...');
    await prisma.auditLog.create({
        data: {
            action: 'SYSTEM_INIT',
            resource: 'system',
            userId: admin.id,
            details: JSON.stringify({
                message: 'NCTIRS database initialized with Kenya Cyber Threat Intelligence dataset',
                incidentsSeeded: incidentCount,
                threatsSeeded: threatCount,
                feedsSeeded: SURVEILLANCE_FEEDS.length,
            }),
            hash: 'genesis-block-nctirs-2026',
            previousHash: null,
        },
    });
    console.log('   ✅ Genesis audit log created');

    // Summary
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 NCTIRS Database Seeded Successfully!');
    console.log('═'.repeat(50));
    console.log(`   Users:        2`);
    console.log(`   Incidents:    ${incidentCount}`);
    console.log(`   Threats:      ${threatCount}`);
    console.log(`   Feeds:        ${SURVEILLANCE_FEEDS.length}`);
    console.log(`   Audit Logs:   1`);
    console.log('═'.repeat(50));
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error('❌ Seed failed:', e);
        await prisma.$disconnect();
        process.exit(1);
    });
