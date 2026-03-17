/**
 * NCTIRS Platform - Cyber Intelligence Mock Data
 */

import type {
  ThreatLevel,
  IncidentType,
  IncidentStatus,
  Region,
  SecurityIncident,
  CyberRiskPrediction,
  SurveillanceFeed,
  CommunityReport,
  EmergencyResponse,
  ThreatAnalytics,
  TimeSeriesData,
  CyberThreatType,
  CyberThreatSeverity,
  CyberTargetType,
  CyberThreat,
  DataLakeSource,
  BlockchainLedgerEntry,
  CoordinatedAttack,
  ResponseType,
  AutomatedResponse,
  PerceptionLayerStatus,
  CognitionLayerStatus,
  IntegrityLayerStatus,
  AdversarialMetrics,
  FederatedLearningStatus,
  XAIExplanation,
  SovereignAIStatus,
} from '@/types';

// Digital Infrastructure Nodes
const infraNodes = {
  GLOBAL: [
    { name: 'External Gateway 01', coordinates: [34.0522, -118.2437] as [number, number] },
    { name: 'External Gateway 02', coordinates: [51.5074, -0.1278] as [number, number] },
  ],
  NAIROBI_HUB: [
    { name: 'Core Router Alpha', coordinates: [-1.2864, 36.8172] as [number, number] },
    { name: 'Gov Data Center', coordinates: [-1.2764, 36.8392] as [number, number] },
  ],
  MOMBASA_EDGE: [
    { name: 'Submarine Cable Landing', coordinates: [-4.0435, 39.6682] as [number, number] },
  ],
  CLOUD_INSTANCE: [
    { name: 'AWS-IAD-1 Cluster', coordinates: [38.9072, -77.0369] as [number, number] },
  ],
  HYBRID_INFRA: [
    { name: 'On-premise Sanity Check', coordinates: [-1.2672, 36.8078] as [number, number] },
  ],
};

const incidentTitles: Record<IncidentType, string[]> = {
  APT: [
    'APT-KE-55 "Sandstorm" Lateral Movement Detected',
    'Unusual SSH activity from known APT jumpbox',
    'Spear-phishing campaign targeting treasury officials',
    'Zero-day exploit attempt on eCitizen kernel',
  ],
  DDoS: [
    'Volumetric UDP flood on cloud gateway',
    'Application layer Slowloris attack detected',
    'Botnet coordination observed in traffic entropy',
    'DNS amplification attack targeting core resolvers',
  ],
  RANSOMWARE: [
    'LockBit-4.0 encryption process identified',
    'Unauthorized shadow copy deletion attempt',
    'Large-scale data staging in /tmp/staging',
    'Ransom note "DECRYPT_README" created on FS',
  ],
  PHISHING: [
    'Malicious domain "kra-verify.top" active',
    'Credential harvesting portal identified',
    'CEO fraud email bypasses SPF/DKIM',
    'M-Pesa API impersonation attempt',
  ],
  ZERO_DAY: [
    'Anomalous memory access pattern in logic layer',
    'JIT-compiler exploitation heuristic match',
    'Buffer overflow attempt on secure enclave',
    'Unexpected instruction pointer redirect',
  ],
  DATA_EXFIL: [
    'High-volume outbound HTTPS spike to unknown IP',
    'Chunks of database being tunneled via DNS',
    'Compressed archive creation on sensitive share',
    'Unauthorized cloud storage sync initiated',
  ],
};

// Generate mock cyber security incidents
export function generateMockIncidents(count: number = 20): SecurityIncident[] {
  const incidents: SecurityIncident[] = [];
  const regions = Object.keys(infraNodes) as Region[];
  const types = Object.keys(incidentTitles) as IncidentType[];
  const statuses: IncidentStatus[] = ['DETECTED', 'ANALYZING', 'CONTAINED', 'NEUTRALIZED'];
  const threatLevels: ThreatLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const nodes = infraNodes[region];
    const node = nodes[Math.floor(Math.random() * nodes.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const titles = incidentTitles[type];

    incidents.push({
      id: `CYB-${Date.now()}-${i}`,
      type,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: `Cyber intelligence matched ${type} heuristic patterns in the ${region} segment.`,
      location: {
        name: node.name,
        region,
        coordinates: node.coordinates,
      },
      networkContext: {
        sourceIp: `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        targetIp: `10.0.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`,
        protocol: ['TCP', 'UDP', 'HTTP', 'HTTPS', 'SSH'][Math.floor(Math.random()*5)] as any,
        attackVector: 'Brute Force / Initial Access',
        asn: 'AS37075'
      },
      threatLevel: threatLevels[Math.floor(Math.random() * threatLevels.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      affectedSystems: Math.floor(Math.random() * 50) + 1,
      aiConfidence: Math.floor(Math.random() * 30) + 70,
      sources: ['SIEM', 'IDS', 'Firewall Cluster'],
    });
  }

  return incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate cyber risk predictions
export function generateCyberRiskPredictions(count: number = 15): CyberRiskPrediction[] {
  const predictions: CyberRiskPrediction[] = [];
  const types = Object.keys(incidentTitles) as IncidentType[];

  for (let i = 0; i < count; i++) {
    const system = ['eCitizen Portal', 'KRA iTax', 'CBK Ledger', 'NTSA Database', 'Huduma Network'][Math.floor(Math.random()*5)];
    
    predictions.push({
      id: `PRED-${Date.now()}-${i}`,
      targetSystem: system,
      riskProbability: Math.floor(Math.random() * 40) + 60,
      riskFactors: [
          'Unusual traffic entropy spikes',
          'Multiple failed login attempts from Tor nodes',
          'Shadow IT activity detected',
          'Outdated package versions detected'
      ],
      predictedVector: types[Math.floor(Math.random()*types.length)],
      recommendedMitigation: [
          'Apply immediate patch CVE-2026-X',
          'Enable MFA for all admin accounts',
          'Isolate affected subnet',
          'Initiate deep packet inspection'
      ]
    });
  }

  return predictions.sort((a, b) => b.riskProbability - a.riskProbability);
}

// Generate surveillance feeds (repurposed for Network Sensors)
export function generateSurveillanceFeeds(count: number = 30): SurveillanceFeed[] {
  const feeds: SurveillanceFeed[] = [];
  const regions = Object.keys(infraNodes) as Region[];
  const types: Array<'CCTV' | 'DRONE' | 'IOT_SENSOR'> = ['IOT_SENSOR']; // Use IOT_SENSOR as network node proxies

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const nodes = infraNodes[region];
    const node = nodes[Math.floor(Math.random() * nodes.length)];

    feeds.push({
      id: `NET-${region}-${i.toString().padStart(3, '0')}`,
      location: node.name,
      region,
      coordinates: node.coordinates,
      status: Math.random() > 0.1 ? 'ACTIVE' : 'ALERT',
      alerts: Math.random() > 0.8 ? Math.floor(Math.random() * 5) + 1 : 0,
      type: 'IOT_SENSOR',
    });
  }

  return feeds;
}

// Generate community reports (repurposed for Bug Bounties / Disclosures)
export function generateCommunityReports(count: number = 25): CommunityReport[] {
  const reports: CommunityReport[] = [];
  const regions = Object.keys(infraNodes) as Region[];
  const types = Object.keys(incidentTitles) as IncidentType[];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const node = infraNodes[region][0];
    const type = types[Math.floor(Math.random() * types.length)];

    reports.push({
      id: `DISC-${Date.now()}-${i}`,
      type,
      description: `Responsible disclosure: Potential ${type} vector identified in ${node.name}.`,
      location: {
        name: node.name,
        region,
        coordinates: node.coordinates,
      },
      timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      verified: Math.random() > 0.4,
      urgency: 'HIGH',
      mediaAttachments: Math.floor(Math.random() * 2),
    });
  }

  return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate threat analytics
export function generateThreatAnalytics(): ThreatAnalytics[] {
  const regions = Object.keys(infraNodes) as Region[];
  const trends: Array<'INCREASING' | 'STABLE' | 'DECREASING'> = ['INCREASING', 'STABLE', 'DECREASING'];

  return regions.map(region => ({
    region,
    threatLevel: 'HIGH',
    activeIncidents: Math.floor(Math.random() * 20),
    resolvedIncidents: Math.floor(Math.random() * 100),
    crimeTrend: trends[Math.floor(Math.random() * trends.length)],
    riskScore: Math.floor(Math.random() * 100),
  }));
}

// Generate time-series data
export function generateTimeSeriesData(days: number = 30) {
  const data = [];
  const types = Object.keys(incidentTitles) as IncidentType[];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const dayData: TimeSeriesData = {
      date: date.toISOString().split('T')[0],
      total: 0,
    };

    types.forEach(type => {
      const count = Math.floor(Math.random() * 10) + 1;
      dayData[type] = count;
      dayData.total += count;
    });

    data.push(dayData);
  }

  return data;
}

// Keep other generators but adjust if needed for Cyber focus
export const generateCyberThreats = (count: number = 20): CyberThreat[] => {
    const threatNames = [
        'APT-KE-55 "Sandstorm"', 'LockBit-4.0 Campaign', 'DNS Amplification Wave',
        'eCitizen Portal Breach', 'CBK SWIFT Hijack', 'M-Pesa API Exploit',
        'KRA iTax SQL Injection', 'NTSA Database Ransomware',
    ];
    const sectors: CyberTargetType[] = ['GOVERNMENT', 'FINANCIAL', 'INFRASTRUCTURE', 'TELECOM', 'ENERGY'];
    const iocSamples = [
        'IP:41.206.188.x', 'HASH:e3b0c44298fc1c14', 'DOMAIN:kra-verify.top',
        'CVE-2024-21762', 'IP:185.220.101.x', 'URL:https://c2.malicious.io',
    ];
    return Array.from({ length: count }, (_, i) => ({
        id: `CT-${i}`,
        type: i % 2 === 0 ? 'APT' : 'DDOS',
        name: threatNames[i % threatNames.length],
        description: `Threat ${i + 1}: Advanced persistent threat detected in national infrastructure.`,
        severity: i % 5 === 0 ? 'CRITICAL' : 'HIGH',
        targetSector: sectors[i % sectors.length],
        targetSystem: 'National Backbone Router',
        timestamp: new Date(Date.now() - i * 3600000),
        aiConfidence: Math.floor(Math.random() * 30) + 70,
        status: 'DETECTED' as const,
        iocIndicators: [iocSamples[i % iocSamples.length], iocSamples[(i + 1) % iocSamples.length]],
        attribution: 'ZINC-24 GROUP',
        mitigationStatus: 'IN_PROGRESS',
    }));
};

export function generateDataLakeSources(): DataLakeSource[] {
    return [
        { id: 'DLS-001', type: 'NETWORK_LOGS', name: 'National Firewall Logs', status: 'ACTIVE', dataRate: 2450, lastUpdate: new Date(), recordsProcessed: 15420000, alertsGenerated: 342 },
        { id: 'DLS-002', type: 'DARK_WEB', name: 'Dark Web Scrapings', status: 'ACTIVE', dataRate: 128, lastUpdate: new Date(), recordsProcessed: 89450, alertsGenerated: 67 },
    ];
}

export function generatePerceptionLayerStatus(): PerceptionLayerStatus {
  return {
    sensorCount: Math.floor(Math.random() * 1000) + 500,
    activeSensors: Math.floor(Math.random() * 500) + 300,
    dataIngestionRate: Math.floor(Math.random() * 1000) + 100, // MB/s
    anomalyDetectionRate: Math.floor(Math.random() * 100) + 10, // anomalies/min
    lastUpdate: new Date(),
    status: Math.random() > 0.1 ? 'OPERATIONAL' : 'DEGRADED',
  };
}

export function generateCognitionLayerStatus(): CognitionLayerStatus {
  return {
    modelCount: Math.floor(Math.random() * 50) + 10,
    activeModels: Math.floor(Math.random() * 40) + 5,
    inferenceRate: Math.floor(Math.random() * 5000) + 1000, // inferences/sec
    threatIntelligenceFeeds: Math.floor(Math.random() * 20) + 5,
    lastUpdate: new Date(),
    status: Math.random() > 0.05 ? 'OPTIMAL' : 'WARNING',
  };
}

export function generateIntegrityLayerStatus(): IntegrityLayerStatus {
  return {
    policyCount: Math.floor(Math.random() * 200) + 50,
    enforcementPoints: Math.floor(Math.random() * 100) + 20,
    complianceScore: Math.floor(Math.random() * 20) + 80, // %
    incidentResponseAutomations: Math.floor(Math.random() * 30) + 10,
    lastUpdate: new Date(),
    status: Math.random() > 0.02 ? 'SECURE' : 'CRITICAL',
  };
}

export function generateAdversarialMetrics(): AdversarialMetrics {
  return {
    attacksDetected: Math.floor(Math.random() * 10000) + 1000,
    attacksBlocked: Math.floor(Math.random() * 9500) + 900,
    evasionAttempts: Math.floor(Math.random() * 50) + 5,
    poisoningAttempts: 2,
    modelExtractionAttempts: 0,
    defenseStatus: {
        gradientMasking: 'ACTIVE',
        noiseInjection: 'ACTIVE',
        adversarialTraining: 'ACTIVE',
        ensembleVoting: 'ACTIVE',
        certifiedRobustness: 'ACTIVE'
    },
    redTeamCycle: {
        lastRun: new Date(),
        attacksGenerated: 120,
        failuresAnalyzed: 12,
        modelsRetrained: 2
    },
    hardeningProgress: 94
  };
}

export function generateFederatedNodes(): FederatedLearningStatus {
  return {
    globalModelVersion: 'v4.2.1',
    trainingRound: 452,
    totalRounds: 1000,
    nodes: [],
    aggregationProgress: 0.85,
    differentialPrivacyEpsilon: 0.1,
    dataTransferred: 'GRADIENTS_ONLY',
    lastGlobalUpdate: new Date()
  };
}

export function generateXAIExplanations(count: number = 8): XAIExplanation[] {
    return Array.from({ length: count }, (_, i) => ({
        id: `XAI-${i}`,
        threatId: `TH-${i}`,
        threatType: 'APT',
        action: 'QUARANTINE',
        confidence: 0.92,
        factors: [
            { name: 'IP_REPUTATION', weight: 0.8, description: 'Source IP known for C2' },
            { name: 'PAYLOAD_ENTROPY', weight: 0.6, description: 'Encrypted blob detected' }
        ],
        naturalLanguage: 'Heuristic analysis detected encrypted command-and-control beaconing.',
        timestamp: new Date(),
        overrideLevel: null,
        analystApproved: true
    }));
}

export function generateSovereignAIStatus(): SovereignAIStatus {
  return {
    llms: [],
    edgeNodes: [],
    foreignAPICallsToday: 0,
    dataEgressToday: 12,
    onPremisePercentage: 100,
    sovereignCloudProvider: 'Government Private Cloud',
    lastSecurityAudit: new Date(),
    dpaCompliant: true
  };
}
