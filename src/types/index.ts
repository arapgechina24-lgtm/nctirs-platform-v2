/**
 * NCTIRS Platform - Shared Type Definitions
 *
 * Central type definitions for the National Cyber Threat Intelligence
 * & Response System. All domain types are defined here and re-exported
 * from their original locations for backward compatibility.
 */

// ============================================================
// Core Platform Types
// ============================================================

export type ThreatLevel = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type IncidentType = 'TERRORISM' | 'ORGANIZED_CRIME' | 'CYBER_ATTACK' | 'VIOLENT_CRIME' | 'TRAFFICKING' | 'RADICALIZATION' | 'BORDER_SECURITY' | 'PUBLIC_DISORDER';
export type IncidentStatus = 'ACTIVE' | 'INVESTIGATING' | 'RESOLVED' | 'MONITORING';
export type Region = 'NAIROBI' | 'MOMBASA' | 'KISUMU' | 'NAKURU' | 'ELDORET' | 'TURKANA' | 'GARISSA' | 'MANDERA';

export interface SecurityIncident {
    id: string;
    type: IncidentType;
    title: string;
    description: string;
    location: {
        name: string;
        region: Region;
        coordinates: [number, number];
    };
    threatLevel: ThreatLevel;
    status: IncidentStatus;
    timestamp: Date;
    affectedArea: number;
    casualties?: number;
    suspects?: number;
    aiConfidence: number;
    sources: string[];
}

export interface CrimePrediction {
    id: string;
    location: {
        name: string;
        region: Region;
        coordinates: [number, number];
    };
    crimeTypes: IncidentType[];
    probability: number;
    timeWindow: string;
    riskFactors: string[];
    recommendedActions: string[];
}

export interface SurveillanceFeed {
    id: string;
    location: string;
    region: Region;
    coordinates: [number, number];
    status: 'ACTIVE' | 'INACTIVE' | 'ALERT';
    lastActivity?: string;
    alerts: number;
    type: 'CCTV' | 'DRONE' | 'IOT_SENSOR';
}

export interface CommunityReport {
    id: string;
    type: IncidentType;
    description: string;
    location: {
        name: string;
        region: Region;
        coordinates: [number, number];
    };
    timestamp: Date;
    verified: boolean;
    urgency: ThreatLevel;
    mediaAttachments: number;
}

export interface EmergencyResponse {
    id: string;
    incident: string;
    location: string;
    region: Region;
    unitsDispatched: number;
    eta: number;
    status: 'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED';
    coordinatingAgencies: string[];
    timestamp: Date;
}

export interface ThreatAnalytics {
    region: Region;
    threatLevel: ThreatLevel;
    activeIncidents: number;
    resolvedIncidents: number;
    crimeTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
    riskScore: number;
}

export interface TimeSeriesData {
    date: string;
    total: number;
    [key: string]: string | number;
}

// ============================================================
// Cyber Threat Types
// ============================================================

export type CyberThreatType = 'APT' | 'ZERO_DAY' | 'DDOS' | 'RANSOMWARE' | 'PHISHING' | 'DATA_BREACH' | 'MALWARE' | 'SQL_INJECTION';
export type RansomwareVariant = 'LOCKBIT' | 'BLACKCAT' | 'CLOP' | 'ROYAL' | 'PLAY' | 'AKIRA' | 'UNKNOWN';
export type DecryptorStatus = 'AVAILABLE' | 'PARTIAL' | 'NONE' | 'UNKNOWN';

export type CyberThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type CyberTargetType = 'GOVERNMENT' | 'FINANCIAL' | 'INFRASTRUCTURE' | 'HEALTHCARE' | 'TELECOM' | 'ENERGY' | 'TRANSPORT';

export interface CyberThreat {
    id: string;
    type: CyberThreatType;
    name: string;
    description: string;
    severity: CyberThreatSeverity;
    targetSector: CyberTargetType;
    sourceIP?: string;
    targetSystem: string;
    aptSignature?: string;
    timestamp: Date;
    aiConfidence: number;
    status: 'DETECTED' | 'ANALYZING' | 'CONTAINED' | 'NEUTRALIZED';
    iocIndicators: string[];
}

export interface RansomwareCampaign {
    id: string;
    name: string;
    variant: RansomwareVariant;
    firstSeen: Date;
    lastSeen: Date;
    active: boolean;
    victimCount: number;
    targetSectors: CyberTargetType[];
    averageRansomDemandUSD: number;
    encryptionMethod: string;
    decryptorStatus: DecryptorStatus;
    decryptorLink?: string;
    attributionConfidence: number;
    description: string;
    iocIndicators?: string[];
}

// ============================================================
// Data Lake & Infrastructure Types
// ============================================================

export type DataSourceType = 'NETWORK_LOGS' | 'DARK_WEB' | 'CCTV_STREAM' | 'CITIZEN_REPORT' | 'OSINT' | 'SIGINT' | 'HUMINT';

export interface DataLakeSource {
    id: string;
    type: DataSourceType;
    name: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PROCESSING';
    dataRate: number;
    lastUpdate: Date;
    recordsProcessed: number;
    alertsGenerated: number;
}

export interface BlockchainLedgerEntry {
    id: string;
    blockHash: string;
    previousHash: string;
    timestamp: Date;
    dataType: 'THREAT_ALERT' | 'EVIDENCE' | 'RESPONSE_ACTION' | 'AUDIT_LOG';
    content: string;
    agencyId: string;
    verified: boolean;
    courtAdmissible: boolean;
}

// ============================================================
// Coordinated Attack & Response Types
// ============================================================

export interface CoordinatedAttack {
    id: string;
    cyberId: string;
    physicalId: string;
    correlationScore: number;
    attackVector: string;
    targetFacility: string;
    region: Region;
    timestamp: Date;
    status: 'DETECTED' | 'RESPONDING' | 'CONTAINED' | 'RESOLVED';
    responseActions: string[];
}

export type ResponseType = 'IP_BLOCK' | 'SYSTEM_ISOLATE' | 'POLICE_DISPATCH' | 'ALERT_AGENCY' | 'LOCKDOWN' | 'EVIDENCE_PRESERVE';

export interface AutomatedResponse {
    id: string;
    triggerThreatId: string;
    responseType: ResponseType;
    description: string;
    timestamp: Date;
    status: 'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED';
    executionTimeMs: number;
    targetSystem?: string;
    unitsDispatched?: number;
    coordinatingAgencies: string[];
}

// ============================================================
// System Layer Status Types
// ============================================================

export interface PerceptionLayerStatus {
    iotSensorsActive: number;
    iotSensorsTotal: number;
    dronesActive: number;
    dronesTotal: number;
    networkSniffersActive: number;
    cctvFeeds: number;
    dataIngestionRate: number;
}

export interface CognitionLayerStatus {
    mlModelsActive: number;
    aptSignaturesLoaded: number;
    threatClassificationsToday: number;
    averageProcessingTimeMs: number;
    falsePositiveRate: number;
    modelAccuracy: number;
}

export interface IntegrityLayerStatus {
    blockchainHeight: number;
    lastBlockHash: string;
    pendingTransactions: number;
    nodesOnline: number;
    dataProtectionCompliant: boolean;
    lastAuditDate: Date;
}

// ============================================================
// Multiplayer / War Room Types
// ============================================================

export type AgencyID = 'ICT_MINISTRY' | 'CENTRAL_BANK' | 'KE_CIRT' | 'ENERGY_REGULATOR';

export interface IncidentParticipant {
    id: string;
    agency: AgencyID;
    activeStatus: 'VIEWING' | 'REMEDIATING' | 'IDLE';
    lastSeen: Date;
}

export interface AuditEntry {
    timestamp: string;
    actor: string;
    action: string;
    previousState: string;
    newState: string;
}

export interface ThreatIncident {
    id: string;
    mitreAttackId: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'DETECTED' | 'TRIAGED' | 'CONTAINED' | 'RESOLVED';
    assignedAgencies: AgencyID[];
    activeWarRoom: IncidentParticipant[];
    auditTrail: AuditEntry[];
}

// ============================================================
// AI Pillar Types
// ============================================================

/** Pillar 1: Adversarial Robustness */
export interface AdversarialMetrics {
    attacksDetected: number;
    attacksBlocked: number;
    evasionAttempts: number;
    poisoningAttempts: number;
    modelExtractionAttempts: number;
    defenseStatus: {
        gradientMasking: 'ACTIVE' | 'INACTIVE';
        noiseInjection: 'ACTIVE' | 'INACTIVE';
        adversarialTraining: 'ACTIVE' | 'INACTIVE';
        ensembleVoting: 'ACTIVE' | 'INACTIVE';
        certifiedRobustness: 'ACTIVE' | 'INACTIVE';
    };
    redTeamCycle: {
        lastRun: Date;
        attacksGenerated: number;
        failuresAnalyzed: number;
        modelsRetrained: number;
    };
    hardeningProgress: number;
}

/** Pillar 2: Federated Learning */
export interface FederatedNode {
    id: string;
    agency: string;
    status: 'ONLINE' | 'TRAINING' | 'SYNCING' | 'OFFLINE';
    lastSync: Date;
    localDataPoints: number;
    gradientsSent: number;
    modelVersion: string;
    privacyBudget: number;
}

export interface FederatedLearningStatus {
    globalModelVersion: string;
    trainingRound: number;
    totalRounds: number;
    nodes: FederatedNode[];
    aggregationProgress: number;
    differentialPrivacyEpsilon: number;
    dataTransferred: 'GRADIENTS_ONLY' | 'NONE';
    lastGlobalUpdate: Date;
}

/** Pillar 3: Explainable AI */
export interface XAIExplanation {
    id: string;
    threatId: string;
    threatType: string;
    action: string;
    confidence: number;
    factors: {
        name: string;
        weight: number;
        description: string;
    }[];
    naturalLanguage: string;
    timestamp: Date;
    overrideLevel: 'L1' | 'L2' | 'L3' | 'L4' | null;
    analystApproved: boolean;
}

/** Pillar 4: Sovereign AI */
export interface SovereignLLM {
    id: string;
    name: string;
    version: string;
    status: 'ONLINE' | 'LOADING' | 'OFFLINE' | 'UPDATING';
    gpuUtilization: number;
    inferenceLatencyMs: number;
    requestsPerSecond: number;
    memoryUsageGB: number;
}

export interface EdgeNode {
    id: string;
    location: string;
    status: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
    lastHeartbeat: Date;
    inferenceCount: number;
}

export interface SovereignAIStatus {
    llms: SovereignLLM[];
    edgeNodes: EdgeNode[];
    foreignAPICallsToday: number;
    dataEgressToday: number;
    onPremisePercentage: number;
    sovereignCloudProvider: string;
    lastSecurityAudit: Date;
    dpaCompliant: boolean;
}
