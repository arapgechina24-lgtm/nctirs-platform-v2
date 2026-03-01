// Types re-exported from @/types for backward compatibility
// All type definitions now live in src/types/index.ts
export type {
  ThreatLevel,
  IncidentType,
  IncidentStatus,
  Region,
  SecurityIncident,
  CrimePrediction,
  SurveillanceFeed,
  CommunityReport,
  EmergencyResponse,
  ThreatAnalytics,
  TimeSeriesData,
  CyberThreatType,
  CyberThreatSeverity,
  CyberTargetType,
  CyberThreat,
  DataSourceType,
  DataLakeSource,
  BlockchainLedgerEntry,
  CoordinatedAttack,
  ResponseType,
  AutomatedResponse,
  PerceptionLayerStatus,
  CognitionLayerStatus,
  IntegrityLayerStatus,
  DataProtectionImpact,
  SovereignAIStatus,
  DigitalPulse,
  HateSpeechAlert,
  AdversarialMetrics,
  FederatedLearningStatus,
  XAIExplanation,
  FederatedNode,
  AgencyID,
  IncidentParticipant,
  RansomwareCampaign,
  RansomwareVariant,
  DecryptorStatus,
} from '@/types';

import type {
  ThreatLevel,
  IncidentType,
  IncidentStatus,
  Region,
  SecurityIncident,
  CrimePrediction,
  SurveillanceFeed,
  CommunityReport,
  EmergencyResponse,
  ThreatAnalytics,
  TimeSeriesData,
  CyberThreatType,
  CyberThreatSeverity,
  CyberTargetType,
  CyberThreat,
  DataSourceType,
  DataLakeSource,
  BlockchainLedgerEntry,
  CoordinatedAttack,
  ResponseType,
  AutomatedResponse,
  PerceptionLayerStatus,
  CognitionLayerStatus,
  IntegrityLayerStatus,
  DataProtectionImpact,
  SovereignAIStatus,
  DigitalPulse,
  HateSpeechAlert,
  AdversarialMetrics,
  FederatedLearningStatus,
  XAIExplanation,
  FederatedNode,
  AgencyID,
  IncidentParticipant,
  RansomwareCampaign,
  RansomwareVariant,
  DecryptorStatus,
} from '@/types';
// Kenyan locations with realistic coordinates
const kenyaLocations = {
  'NAIROBI': { name: 'Nairobi HQ', coordinates: [-1.2921, 36.8219] },
  'MOMBASA': { name: 'Mombasa Port Authority', coordinates: [-4.0435, 39.6682] },
  'KISUMU': { name: 'Kisumu Tech Hub', coordinates: [-0.0917, 34.7680] },
  'NAKURU': { name: 'Nakuru Data Center', coordinates: [-0.3031, 36.0613] },
  'ELDORET': { name: 'Eldoret Regional Office', coordinates: [0.5143, 35.2697] },
  'TURKANA': { name: 'Turkana Energy Site', coordinates: [3.5833, 35.9167] },
  'GARISSA': { name: 'Garissa Border Post', coordinates: [-0.4532, 39.6461] },
  'MANDERA': { name: 'Mandera Command Center', coordinates: [3.9366, 41.8569] },
} as const;

const regions: Region[] = ['NAIROBI', 'MOMBASA', 'KISUMU', 'NAKURU', 'ELDORET', 'TURKANA', 'GARISSA', 'MANDERA'];

// Mock Security Incidents
export const initialIncidents: SecurityIncident[] = [
  {
    id: 'INC-2024-001',
    type: 'APT',
    title: 'Advanced Persistent Threat: Silver Fox',
    description: 'Sophisticated state-sponsored actor targeting critical government financial systems via spear-phishing and custom malware.',
    location: {
      name: 'Central Bank of Kenya',
      region: 'NAIROBI',
      coordinates: [-1.2921, 36.8219],
    },
    threatLevel: 'CRITICAL',
    status: 'ACTIVE',
    timestamp: new Date(),
    affectedArea: 5,
    aiConfidence: 0.94,
    sources: ['SIGINT', 'NETWORK_LOGS'],
    dataProtectionImpact: 'FINANCIAL_DATA',
    mitreAttackId: 'T1190',
  },
  {
    id: 'INC-2024-002',
    type: 'RANSOMWARE',
    title: 'LockBit 3.0: Energy Sector Attack',
    description: 'Ransomware-as-a-Service attack encrypting critical databases at a major energy utility provider.',
    location: {
      name: 'KenGen Hub',
      region: 'TURKANA',
      coordinates: [3.5833, 35.9167],
    },
    threatLevel: 'HIGH',
    status: 'INVESTIGATING',
    timestamp: new Date(Date.now() - 3600000),
    affectedArea: 12,
    aiConfidence: 0.88,
    sources: ['EDR', 'HUMINT'],
    dataProtectionImpact: 'NONE',
    mitreAttackId: 'T1486',
  }
];

// Helper to generate random incidents for demonstration
export function generateIncidents(count: number = 20): SecurityIncident[] {
  const types: IncidentType[] = ['PHISHING', 'RANSOMWARE', 'DATA_BREACH', 'MALWARE', 'DDOS', 'APT', 'INSIDER_THREAT', 'IDENTITY_THEFT'];
  const titles = [
    'Unauthorized Cloud Access Detected',
    'Financial Exfiltration Attempt',
    'Coordinated DDoS on E-Citizen',
    'Malicious Insider Activity',
    'Suspicious API Traffic Burst',
    'SQL Injection on Public Registry',
    'Credential Stuffing Attack',
    'Rogue Access Point Found'
  ];

  const incidents: SecurityIncident[] = [...initialIncidents];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const loc = kenyaLocations[region];

    incidents.push({
      id: `INC-2024-${(i + 3).toString().padStart(3, '0')}`,
      type,
      title: titles[i % titles.length],
      description: `Automated detection of ${type.toLowerCase()} pattern affecting systems in the ${region} region.`,
      location: {
        name: loc.name,
        region,
        coordinates: loc.coordinates as [number, number],
      },
      threatLevel: Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW',
      status: Math.random() > 0.5 ? 'MONITORING' : 'RESOLVED',
      timestamp: new Date(Date.now() - Math.random() * 86400000 * 7),
      affectedArea: Math.floor(Math.random() * 50),
      aiConfidence: 0.7 + Math.random() * 0.25,
      sources: ['CLOUD_WATCH', 'INTERNAL_IDS'],
      dataProtectionImpact: Math.random() > 0.8 ? 'PII_EXPOSED' : 'NONE',
    });
  }

  return incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

export function generateCrimePredictions(count: number = 8): CrimePrediction[] {
  const crimes: IncidentType[] = ['PHISHING', 'RANSOMWARE', 'DATA_BREACH', 'MALWARE'];
  const predictions: CrimePrediction[] = [];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const loc = kenyaLocations[region];
    predictions.push({
      id: `PRED-${i}`,
      location: { name: loc.name, region, coordinates: loc.coordinates as [number, number] },
      crimeTypes: [crimes[Math.floor(Math.random() * crimes.length)]],
      probability: 0.6 + Math.random() * 0.35,
      timeWindow: 'Next 24 Hours',
      riskFactors: ['High Latency Peaks', 'Known APT Infrastructure Active', 'Dormant Malware Heartbeats'],
      recommendedActions: ['Patch External Hubs', 'Increase Monitoring Depth'],
    });
  }
  return predictions;
}

export function generateCommunityReports(count: number = 5): CommunityReport[] {
  const reports: CommunityReport[] = [];
  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const loc = kenyaLocations[region];
    reports.push({
      id: `CR-${i}`,
      type: 'PHISHING',
      description: 'Suspicious portal impersonating government login.',
      location: { name: loc.name, region, coordinates: loc.coordinates as [number, number] },
      timestamp: new Date(),
      verified: Math.random() > 0.3,
      urgency: Math.random() > 0.7 ? 'HIGH' : 'MEDIUM',
      mediaAttachments: Math.floor(Math.random() * 3),
    });
  }
  return reports;
}

export function generateEmergencyResponses(count: number = 3): EmergencyResponse[] {
  const responses: EmergencyResponse[] = [];
  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    responses.push({
      id: `ERR-${i}`,
      incident: `INC-2024-00${i + 1}`,
      location: 'Industrial Area Sector 4',
      region,
      unitsDispatched: 2 + i,
      eta: 5 + i * 2,
      status: 'EN_ROUTE',
      coordinatingAgencies: ['NIS', 'KE-CIRT'],
      timestamp: new Date(),
    });
  }
  return responses;
}

// === INFRASTRUCTURE & SURVEILLANCE MOCK DATA ===

export function generateSurveillanceFeeds(count: number = 8): SurveillanceFeed[] {
  const feeds: SurveillanceFeed[] = [];
  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const loc = kenyaLocations[region];
    feeds.push({
      id: `CAM-${i + 100}`,
      location: loc.name,
      region,
      coordinates: loc.coordinates as [number, number],
      status: Math.random() > 0.1 ? 'ACTIVE' : 'ALERT',
      alerts: Math.floor(Math.random() * 5),
      type: i % 2 === 0 ? 'CCTV' : 'DRONE',
      lastActivity: '2 mins ago',
    });
  }
  return feeds;
}

export function generateDataLakeSources(): DataLakeSource[] {
  const sources: DataSourceType[] = ['NETWORK_LOGS', 'DARK_WEB', 'CCTV_STREAM', 'CITIZEN_REPORT', 'OSINT', 'SIGINT'];
  return sources.map((type, i) => ({
    id: `DS-${i}`,
    type,
    name: type.replace('_', ' '),
    status: Math.random() > 0.1 ? 'ACTIVE' : 'PROCESSING',
    dataRate: Math.floor(Math.random() * 500) + 50,
    lastUpdate: new Date(),
    recordsProcessed: Math.floor(Math.random() * 1000000),
    alertsGenerated: Math.floor(Math.random() * 100),
  }));
}

// === SYSTEM HEALTH & AI STATUS ===

export function generatePerceptionLayerStatus(): PerceptionLayerStatus {
  return {
    iotSensorsActive: 1242,
    iotSensorsTotal: 1250,
    dronesActive: 18,
    dronesTotal: 25,
    networkSniffersActive: 89,
    cctvFeeds: 4521,
    dataIngestionRate: 4.2, // GB/s
  };
}

export function generateCognitionLayerStatus(): CognitionLayerStatus {
  return {
    mlModelsActive: 12,
    aptSignaturesLoaded: 4231,
    threatClassificationsToday: 842,
    averageProcessingTimeMs: 142,
    falsePositiveRate: 0.02,
    modelAccuracy: 0.985,
  };
}

export function generateIntegrityLayerStatus(): IntegrityLayerStatus {
  return {
    blockchainHeight: 842100,
    lastBlockHash: '0000...a4f2',
    pendingTransactions: 12,
    nodesOnline: 48,
    dataProtectionCompliant: true,
    lastAuditDate: new Date(Date.now() - 86400000),
  };
}

// === THREAT ANALYTICS ===

export function generateThreatAnalytics(): ThreatAnalytics[] {
  return regions.map(region => ({
    region,
    threatLevel: Math.random() > 0.8 ? 'HIGH' : Math.random() > 0.5 ? 'MEDIUM' : 'LOW',
    activeIncidents: Math.floor(Math.random() * 15),
    resolvedIncidents: Math.floor(Math.random() * 100),
    crimeTrend: Math.random() > 0.7 ? 'INCREASING' : Math.random() > 0.3 ? 'STABLE' : 'DECREASING',
    riskScore: 30 + Math.random() * 50,
  }));
}

// === CYBER THREATS ===

export function generateCyberThreats(count: number = 10): CyberThreat[] {
  const cyberTypes: CyberThreatType[] = ['APT', 'ZERO_DAY', 'DDOS', 'RANSOMWARE', 'PHISHING', 'DATA_BREACH'];
  const targets: CyberTargetType[] = ['GOVERNMENT', 'FINANCIAL', 'INFRASTRUCTURE', 'HEALTHCARE', 'TELECOM', 'ENERGY'];
  const threats: CyberThreat[] = [];

  for (let i = 0; i < count; i++) {
    threats.push({
      id: `CT-${2024}-${i.toString().padStart(3, '0')}`,
      type: cyberTypes[Math.floor(Math.random() * cyberTypes.length)],
      name: `Cyber Op: ${['Crimson', 'Azure', 'Golden', 'Shadow'][i % 4]} ${['Dragon', 'Wolf', 'Eagle', 'Storm'][i % 4]}`,
      description: 'Sophisticated campaign targeting critical infrastructure via lateral movement.',
      severity: Math.random() > 0.8 ? 'CRITICAL' : Math.random() > 0.5 ? 'HIGH' : 'MEDIUM',
      targetSector: targets[Math.floor(Math.random() * targets.length)],
      targetSystem: `System-X${i + 100}`,
      timestamp: new Date(Date.now() - Math.random() * 86400000),
      aiConfidence: 0.85 + Math.random() * 0.12,
      status: 'DETECTED',
      iocIndicators: ['192.168.1.1', 'malware_hash_alpha', 'c2_domain_xyz.com'],
    });
  }

  return threats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// === BLOCKCHAIN LEDGER ===

export function generateBlockchainLedger(count: number = 10): BlockchainLedgerEntry[] {
  const types: BlockchainLedgerEntry['dataType'][] = ['THREAT_ALERT', 'EVIDENCE', 'RESPONSE_ACTION', 'AUDIT_LOG'];
  const entries: BlockchainLedgerEntry[] = [];

  for (let i = 0; i < count; i++) {
    entries.push({
      id: `BLK-${i}`,
      blockHash: '0x' + Math.random().toString(16).slice(2, 18),
      previousHash: '0x' + Math.random().toString(16).slice(2, 18),
      timestamp: new Date(Date.now() - i * 600000),
      dataType: types[Math.floor(Math.random() * types.length)],
      content: `Encrypted audit trail for action-id: ${Math.floor(Math.random() * 1000)}`,
      agencyId: ['NIS', 'DCI', 'KE-CIRT', 'CENTRAL_BANK'][i % 4],
      verified: true,
      courtAdmissible: true,
    });
  }

  return entries;
}

// === COORDINATED ATTACKS ===

export function generateCoordinatedAttacks(count: number = 2): CoordinatedAttack[] {
  const attacks: CoordinatedAttack[] = [];
  for (let i = 0; i < count; i++) {
    attacks.push({
      id: `COORD-${i}`,
      cyberId: `CT-2024-00${i}`,
      physicalId: `INC-2024-00${i}`,
      correlationScore: 0.92,
      attackVector: 'Hybrid Cyber-Physical Sabotage',
      targetFacility: 'Grid Substation Apha',
      region: 'NAIROBI',
      timestamp: new Date(),
      status: 'DETECTED',
      responseActions: ['ISOLATE_SUBNET', 'DEPLOY_QRF', 'LOCKDOWN_FACILITY'],
    });
  }
  return attacks;
}

// === AUTOMATED RESPONSES ===

export function generateAutomatedResponses(count: number = 5): AutomatedResponse[] {
  const responseTypes: ResponseType[] = ['IP_BLOCK', 'SYSTEM_ISOLATE', 'POLICE_DISPATCH', 'ALERT_AGENCY', 'LOCKDOWN'];
  const agencies = ['NIS', 'DCI', 'KE-CIRT', 'KE_POLICE'];
  const responses: AutomatedResponse[] = [];

  for (let i = 0; i < count; i++) {
    const type = responseTypes[Math.floor(Math.random() * responseTypes.length)];
    responses.push({
      id: `RESP-${i}`,
      triggerThreatId: `CT-2024-00${i}`,
      responseType: type,
      description: `Automated protocol ${type} executed against detected threat vector.`,
      timestamp: new Date(Date.now() - i * 1800000),
      status: i === 0 ? 'EXECUTING' : 'COMPLETED',
      executionTimeMs: Math.floor(Math.random() * 5000) + 100,
      targetSystem: type === 'IP_BLOCK' || type === 'SYSTEM_ISOLATE' ? 'Target System ' + Math.floor(Math.random() * 100) : undefined,
      unitsDispatched: type === 'POLICE_DISPATCH' ? Math.floor(Math.random() * 5) + 1 : undefined,
      coordinatingAgencies: agencies.slice(0, Math.floor(Math.random() * 3) + 1),
    });
  }

  return responses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// === DIGITAL SURVEILLANCE & SOCIAL INTELLIGENCE ===

export function generateDigitalPulse(count: number = 10): DigitalPulse[] {
  const platforms: ('X' | 'FACEBOOK' | 'TIKTOK' | 'TELEGRAM' | 'WHATSAPP')[] = ['X', 'FACEBOOK', 'TIKTOK', 'TELEGRAM', 'WHATSAPP'];
  const locations = ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru', 'Garissa', 'Mandera'];
  const pulse: DigitalPulse[] = [];

  for (let i = 0; i < count; i++) {
    const sentiment = Math.floor(Math.random() * 60) + 10;
    pulse.push({
      id: `DP-${Date.now()}-${i}`,
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      sentimentScore: sentiment,
      hateSpeechSurge: Math.floor(Math.random() * 15),
      topHashtags: ['#KenyaSecurity', '#NCTIRS', '#DigitalSovereignty', '#StableKE'].slice(0, 3),
      threatLevel: sentiment > 50 ? 'HIGH' : sentiment > 30 ? 'MEDIUM' : 'LOW',
      location: locations[Math.floor(Math.random() * locations.length)],
    });
  }
  return pulse;
}

export function generateHateSpeechAlerts(count: number = 5): HateSpeechAlert[] {
  const content = [
    "Incitement detected against specific community in regional dialect.",
    "Hate speech surge identified on encrypted messaging platforms.",
    "Coordinated influence campaign spreading misinformation about border security.",
    "Extremist recruitment indicators found in vernacular forums.",
    "Linguistic analysis flags high-risk inflammatory rhetoric."
  ];

  const dialects: ('SHENG' | 'SWAHILI' | 'ENGLISH' | 'VERNACULAR')[] = ['SHENG', 'SWAHILI', 'ENGLISH', 'VERNACULAR'];
  const alerts: HateSpeechAlert[] = [];

  for (let i = 0; i < count; i++) {
    alerts.push({
      id: `HS-${Date.now()}-${i}`,
      timestamp: new Date(Date.now() - i * 3600000),
      content: content[i % content.length],
      dialect: dialects[Math.floor(Math.random() * dialects.length)],
      severity: i === 0 ? 'CRITICAL' : i < 3 ? 'HIGH' : 'MEDIUM',
      targetGroup: 'National Unity / Critical Infrastructure',
      coordinates: [-1.2921 + (Math.random() * 0.1), 36.8219 + (Math.random() * 0.1)],
    });
  }
  return alerts;
}

// === PILLAR 1: ADVERSARIAL DEFENSE ===

export function generateAdversarialMetrics(): AdversarialMetrics {
  return {
    attacksDetected: 1420,
    attacksBlocked: 1412,
    evasionAttempts: 842,
    poisoningAttempts: 124,
    modelExtractionAttempts: 454,
    defenseStatus: {
      gradientMasking: 'ACTIVE',
      noiseInjection: 'ACTIVE',
      adversarialTraining: 'ACTIVE',
      ensembleVoting: 'ACTIVE',
      certifiedRobustness: 'ACTIVE',
    },
    redTeamCycle: {
      lastRun: new Date(),
      attacksGenerated: 12000,
      failuresAnalyzed: 42,
      modelsRetrained: 3,
    },
    hardeningProgress: 94.5,
  };
}

// === PILLAR 2: FEDERATED LEARNING ===

export function generateFederatedNodes(): FederatedNode[] {
  return [
    {
      id: 'N-1',
      agency: 'ICT Ministry',
      status: 'ONLINE',
      lastSync: new Date(),
      localDataPoints: 452000,
      gradientsSent: 42,
      modelVersion: 'v2.1',
      privacyBudget: 0.82,
    },
    {
      id: 'N-2',
      agency: 'Central Bank',
      status: 'TRAINING',
      lastSync: new Date(),
      localDataPoints: 891000,
      gradientsSent: 12,
      modelVersion: 'v2.1',
      privacyBudget: 0.91,
    },
    {
      id: 'N-3',
      agency: 'NIS HQ',
      status: 'SYNCING',
      lastSync: new Date(),
      localDataPoints: 2400000,
      gradientsSent: 156,
      modelVersion: 'v2.1',
      privacyBudget: 0.45,
    }
  ];
}

export function generateFederatedStatus(): FederatedLearningStatus {
  return {
    globalModelVersion: 'SENTINEL-OMEGA-v1.4',
    trainingRound: 422,
    totalRounds: 500,
    nodes: generateFederatedNodes(),
    aggregationProgress: 68,
    differentialPrivacyEpsilon: 0.1,
    dataTransferred: 'GRADIENTS_ONLY',
    lastGlobalUpdate: new Date(),
  };
}

// === PILLAR 3: EXPLAINABLE AI (XAI) ===

export function generateXAIExplanations(count: number = 5): XAIExplanation[] {
  const explanations: XAIExplanation[] = [];
  for (let i = 0; i < count; i++) {
    explanations.push({
      id: `XAI-${i}`,
      threatId: `INC-2024-001`,
      threatType: 'APT',
      action: 'SYSTEM_ISOLATION',
      confidence: 94.2,
      factors: [
        { name: 'LATERAL_MOVEMENT', weight: 0.45, description: 'Unusual SSH patterns across segments' },
        { name: 'ENCRYPTED_EXFIL', weight: 0.30, description: 'High entropy outbound traffic' },
        { name: 'KNOWN_APT_SIG', weight: 0.25, description: 'Silver Fox signature match' }
      ],
      naturalLanguage: 'The model flagged this as an APT due to abnormal lateral movement and high-entropy outbound traffic matching the Silver Fox actor signature.',
      timestamp: new Date(),
      overrideLevel: null,
      analystApproved: true,
    });
  }
  return explanations;
}

// === PILLAR 4: SOVEREIGN AI ===

export function generateSovereignAIStatus(): SovereignAIStatus {
  return {
    llms: [
      {
        id: 'LLM-1',
        name: 'Sentinel-KE',
        version: 'v2.0-Sovereign',
        status: 'ONLINE',
        gpuUtilization: 72,
        inferenceLatencyMs: 142,
        requestsPerSecond: 15,
        memoryUsageGB: 48,
      },
      {
        id: 'LLM-2',
        name: 'Nyayo-Small',
        version: 'v1.4',
        status: 'ONLINE',
        gpuUtilization: 24,
        inferenceLatencyMs: 45,
        requestsPerSecond: 120,
        memoryUsageGB: 12,
      }
    ],
    edgeNodes: [
      { id: 'EDGE-1', location: 'Mombasa Port', status: 'ONLINE', lastHeartbeat: new Date(), inferenceCount: 45210 },
      { id: 'EDGE-2', location: 'Namanga Border', status: 'ONLINE', lastHeartbeat: new Date(), inferenceCount: 12100 },
      { id: 'EDGE-3', location: 'JKIA Terminal', status: 'ONLINE', lastHeartbeat: new Date(), inferenceCount: 89201 },
    ],
    foreignAPICallsToday: 0,
    dataEgressToday: 0.4,
    onPremisePercentage: 100,
    sovereignCloudProvider: 'Konza Private Cloud',
    lastSecurityAudit: new Date(Date.now() - 3600000 * 4),
    dpaCompliant: true,
  };
}

export function generateSovereignStatus(): SovereignAIStatus {
  return generateSovereignAIStatus();
}

// Historical data for charts
export function generateTimeSeriesData(count: number = 24): TimeSeriesData[] {
  const data: TimeSeriesData[] = [];
  const hours = count;
  for (let i = 0; i < hours; i++) {
    const hour = (i * (24 / hours)).toFixed(0).padStart(2, '0');
    data.push({
      date: `${hour}:00`,
      total: Math.floor(Math.random() * 50) + 10,
      ransomware: Math.floor(Math.random() * 20),
      phishing: Math.floor(Math.random() * 30),
    });
  }
  return data;
}

export const threatLevelHistory: TimeSeriesData[] = generateTimeSeriesData();

export const ransomwareCampaigns: RansomwareCampaign[] = [
  {
    id: 'CMP-2024-001',
    name: 'Operation DarkWater',
    variant: 'LOCKBIT',
    firstSeen: new Date(Date.now() - 30 * 86400000),
    lastSeen: new Date(),
    active: true,
    victimCount: 142,
    targetSectors: ['FINANCIAL', 'GOVERNMENT', 'INFRASTRUCTURE'],
    averageRansomDemandUSD: 1500000,
    encryptionMethod: 'AES-256 + RSA-4096',
    decryptorStatus: 'NONE',
    attributionConfidence: 0.82,
    description: 'Highly active campaign targeting Kenyan financial institutions with double extortion tactics.',
  }
];
