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
  DataLakeSource,
  BlockchainLedgerEntry,
  CoordinatedAttack,
  ResponseType,
  AutomatedResponse,
  PerceptionLayerStatus,
  CognitionLayerStatus,
  IntegrityLayerStatus,
} from '@/types';

// Kenyan locations with realistic coordinates
const kenyaLocations = {
  NAIROBI: [
    { name: 'CBD', coordinates: [-1.2864, 36.8172] as [number, number] },
    { name: 'Eastleigh', coordinates: [-1.2764, 36.8392] as [number, number] },
    { name: 'Westlands', coordinates: [-1.2672, 36.8078] as [number, number] },
    { name: 'Kibera', coordinates: [-1.3127, 36.7885] as [number, number] },
    { name: 'Industrial Area', coordinates: [-1.3246, 36.8433] as [number, number] },
  ],
  MOMBASA: [
    { name: 'Mombasa CBD', coordinates: [-4.0435, 39.6682] as [number, number] },
    { name: 'Likoni', coordinates: [-4.0889, 39.6647] as [number, number] },
    { name: 'Nyali', coordinates: [-4.0181, 39.7121] as [number, number] },
    { name: 'Port Reitz', coordinates: [-4.0733, 39.6347] as [number, number] },
  ],
  KISUMU: [
    { name: 'Kisumu Central', coordinates: [-0.0917, 34.7680] as [number, number] },
    { name: 'Kondele', coordinates: [-0.0831, 34.7492] as [number, number] },
  ],
  NAKURU: [
    { name: 'Nakuru Town', coordinates: [-0.3031, 36.0800] as [number, number] },
  ],
  ELDORET: [
    { name: 'Eldoret Town', coordinates: [0.5143, 35.2698] as [number, number] },
  ],
  TURKANA: [
    { name: 'Lodwar', coordinates: [3.1190, 35.5970] as [number, number] },
    { name: 'Kakuma', coordinates: [3.7294, 34.8530] as [number, number] },
  ],
  GARISSA: [
    { name: 'Garissa Town', coordinates: [-0.4569, 39.6403] as [number, number] },
  ],
  MANDERA: [
    { name: 'Mandera Town', coordinates: [3.9366, 41.8550] as [number, number] },
  ],
};

const incidentTitles: Record<IncidentType, string[]> = {
  TERRORISM: [
    'Suspected extremist activity detected',
    'Explosive device neutralized',
    'Terror cell identified',
    'Radicalization center discovered',
  ],
  ORGANIZED_CRIME: [
    'Drug trafficking operation',
    'Human trafficking ring',
    'Organized theft syndicate',
    'Money laundering network',
  ],
  CYBER_ATTACK: [
    'Government system breach attempt',
    'Malware attack on infrastructure',
    'Phishing campaign targeting officials',
    'DDoS attack detected',
  ],
  VIOLENT_CRIME: [
    'Armed robbery reported',
    'Gang violence incident',
    'Assault and battery case',
    'Carjacking incident',
  ],
  TRAFFICKING: [
    'Wildlife trafficking operation',
    'Arms smuggling detected',
    'Counterfeit goods seizure',
    'Illegal border crossing',
  ],
  RADICALIZATION: [
    'Extremist recruitment activity',
    'Hate speech dissemination',
    'Radical propaganda distribution',
    'Youth radicalization attempt',
  ],
  BORDER_SECURITY: [
    'Illegal border crossing',
    'Contraband smuggling',
    'Cross-border incursion',
    'Border patrol alert',
  ],
  PUBLIC_DISORDER: [
    'Riot and civil unrest',
    'Illegal protest gathering',
    'Public violence outbreak',
    'Mob justice incident',
  ],
};

// Generate mock security incidents
export function generateMockIncidents(count: number = 20): SecurityIncident[] {
  const incidents: SecurityIncident[] = [];
  const regions = Object.keys(kenyaLocations) as Region[];
  const types = Object.keys(incidentTitles) as IncidentType[];
  const statuses: IncidentStatus[] = ['ACTIVE', 'INVESTIGATING', 'RESOLVED', 'MONITORING'];
  const threatLevels: ThreatLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const locations = kenyaLocations[region];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const titles = incidentTitles[type];

    incidents.push({
      id: `INC-${Date.now()}-${i}`,
      type,
      title: titles[Math.floor(Math.random() * titles.length)],
      description: `Intelligence analysis indicates ${type.toLowerCase().replace('_', ' ')} activity in the area.`,
      location: {
        name: location.name,
        region,
        coordinates: location.coordinates,
      },
      threatLevel: threatLevels[Math.floor(Math.random() * threatLevels.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      affectedArea: Math.floor(Math.random() * 50) + 1,
      casualties: Math.random() > 0.7 ? Math.floor(Math.random() * 10) : undefined,
      suspects: Math.random() > 0.5 ? Math.floor(Math.random() * 5) + 1 : undefined,
      aiConfidence: Math.floor(Math.random() * 30) + 70,
      sources: ['CCTV', 'OSINT', 'Field Reports', 'Citizen Reports', 'Intercepted Communications'].slice(0, Math.floor(Math.random() * 3) + 1),
    });
  }

  return incidents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate crime predictions
export function generateCrimePredictions(count: number = 15): CrimePrediction[] {
  const predictions: CrimePrediction[] = [];
  const regions = Object.keys(kenyaLocations) as Region[];
  const types = Object.keys(incidentTitles) as IncidentType[];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const locations = kenyaLocations[region];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const crimeCount = Math.floor(Math.random() * 2) + 1;
    const crimeTypes = Array.from({ length: crimeCount }, () =>
      types[Math.floor(Math.random() * types.length)]
    );

    predictions.push({
      id: `PRED-${Date.now()}-${i}`,
      location: {
        name: location.name,
        region,
        coordinates: location.coordinates,
      },
      crimeTypes,
      probability: Math.floor(Math.random() * 40) + 60,
      timeWindow: ['Next 24 hours', 'Next 48 hours', 'Next 72 hours'][Math.floor(Math.random() * 3)],
      riskFactors: [
        'High population density',
        'Historical crime patterns',
        'Social media intelligence',
        'Economic indicators',
        'Political tensions',
        'Recent similar incidents',
      ].slice(0, Math.floor(Math.random() * 3) + 2),
      recommendedActions: [
        'Increase patrol presence',
        'Deploy undercover units',
        'Community engagement',
        'Surveillance enhancement',
        'Inter-agency coordination',
      ].slice(0, Math.floor(Math.random() * 2) + 2),
    });
  }

  return predictions.sort((a, b) => b.probability - a.probability);
}

// Generate surveillance feeds
export function generateSurveillanceFeeds(count: number = 30): SurveillanceFeed[] {
  const feeds: SurveillanceFeed[] = [];
  const regions = Object.keys(kenyaLocations) as Region[];
  const types: Array<'CCTV' | 'DRONE' | 'IOT_SENSOR'> = ['CCTV', 'DRONE', 'IOT_SENSOR'];
  const statuses: Array<'ACTIVE' | 'INACTIVE' | 'ALERT'> = ['ACTIVE', 'INACTIVE', 'ALERT'];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const locations = kenyaLocations[region];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    feeds.push({
      id: `CAM-${region}-${i.toString().padStart(3, '0')}`,
      location: location.name,
      region,
      coordinates: location.coordinates,
      status,
      lastActivity: status === 'ALERT' ? 'Suspicious activity detected' : undefined,
      alerts: status === 'ALERT' ? Math.floor(Math.random() * 5) + 1 : 0,
      type: types[Math.floor(Math.random() * types.length)],
    });
  }

  return feeds;
}

// Generate community reports
export function generateCommunityReports(count: number = 25): CommunityReport[] {
  const reports: CommunityReport[] = [];
  const regions = Object.keys(kenyaLocations) as Region[];
  const types = Object.keys(incidentTitles) as IncidentType[];
  const urgencyLevels: ThreatLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const locations = kenyaLocations[region];
    const location = locations[Math.floor(Math.random() * locations.length)];
    const type = types[Math.floor(Math.random() * types.length)];

    reports.push({
      id: `REP-${Date.now()}-${i}`,
      type,
      description: `Anonymous citizen report: ${incidentTitles[type][0].toLowerCase()} observed in the vicinity.`,
      location: {
        name: location.name,
        region,
        coordinates: location.coordinates,
      },
      timestamp: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
      verified: Math.random() > 0.4,
      urgency: urgencyLevels[Math.floor(Math.random() * urgencyLevels.length)],
      mediaAttachments: Math.floor(Math.random() * 4),
    });
  }

  return reports.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate emergency responses
export function generateEmergencyResponses(count: number = 10): EmergencyResponse[] {
  const responses: EmergencyResponse[] = [];
  const regions = Object.keys(kenyaLocations) as Region[];
  const statuses: Array<'DISPATCHED' | 'EN_ROUTE' | 'ON_SCENE' | 'RESOLVED'> = ['DISPATCHED', 'EN_ROUTE', 'ON_SCENE', 'RESOLVED'];
  const agencies = ['NIS', 'National Police Service', 'County Security', 'GSU', 'Military', 'Emergency Services'];

  for (let i = 0; i < count; i++) {
    const region = regions[Math.floor(Math.random() * regions.length)];
    const locations = kenyaLocations[region];
    const location = locations[Math.floor(Math.random() * locations.length)];

    responses.push({
      id: `ER-${Date.now()}-${i}`,
      incident: `Emergency incident at ${location.name}`,
      location: location.name,
      region,
      unitsDispatched: Math.floor(Math.random() * 5) + 1,
      eta: Math.floor(Math.random() * 30) + 5,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      coordinatingAgencies: agencies.slice(0, Math.floor(Math.random() * 3) + 2),
      timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
    });
  }

  return responses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate threat analytics by region
export function generateThreatAnalytics(): ThreatAnalytics[] {
  const regions = Object.keys(kenyaLocations) as Region[];
  const threatLevels: ThreatLevel[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const trends: Array<'INCREASING' | 'STABLE' | 'DECREASING'> = ['INCREASING', 'STABLE', 'DECREASING'];

  return regions.map(region => ({
    region,
    threatLevel: threatLevels[Math.floor(Math.random() * threatLevels.length)],
    activeIncidents: Math.floor(Math.random() * 20) + 1,
    resolvedIncidents: Math.floor(Math.random() * 50) + 10,
    crimeTrend: trends[Math.floor(Math.random() * trends.length)],
    riskScore: Math.floor(Math.random() * 100),
  }));
}

// Generate time-series data for charts
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

// === NSSPIP UNIFIED PLATFORM GENERATORS ===

const cyberThreatNames: Record<CyberThreatType, string[]> = {
  APT: ['APT-KE-001 SANDSTORM', 'APT-KE-002 BUSHFIRE', 'APT-KE-003 MONSOON', 'APT-KE-004 SAVANNA'],
  ZERO_DAY: ['CVE-2026-0041 Kernel Exploit', 'CVE-2026-0089 Browser RCE', 'CVE-2026-0123 Network Stack'],
  DDOS: ['Volumetric Flood Attack', 'Application Layer Assault', 'Protocol Exploitation'],
  RANSOMWARE: ['LOCKBIT-4.0', 'BLACKCAT-KENYA', 'REVIL-VARIANT', 'CONTI-RESURGENCE'],
  PHISHING: ['Spear Phishing Campaign', 'Credential Harvesting', 'Business Email Compromise'],
  DATA_BREACH: ['Database Exfiltration', 'API Data Leak', 'Insider Threat Detected'],
  MALWARE: ['Trojan Deployment', 'Rootkit Installation', 'Wiper Malware'],
  SQL_INJECTION: ['SQLi on Public Portal', 'Database Manipulation', 'Authentication Bypass'],
};

const targetSystems: Record<CyberTargetType, string[]> = {
  GOVERNMENT: ['eCitizen Portal', 'Huduma Centers', 'IFMIS', 'Digital ID System', 'KRA iTax'],
  FINANCIAL: ['CBK Core Banking', 'M-Pesa Infrastructure', 'NSE Trading Platform', 'RTGS System'],
  INFRASTRUCTURE: ['KPLC Grid Control', 'Nairobi Water SCADA', 'Kenya Ports Authority'],
  HEALTHCARE: ['NHIF Database', 'Kenyatta Hospital EHR', 'Medical Supply Chain'],
  TELECOM: ['Safaricom Core Network', 'Airtel Kenya Systems', 'National Fiber Backbone'],
  ENERGY: ['Geothermal Plant SCADA', 'Oil Pipeline Monitoring', 'Fuel Distribution Network'],
  TRANSPORT: ['JKIA Control Systems', 'SGR Operations', 'Kenya Airways Reservation'],
};

// Generate cyber threats
export function generateCyberThreats(count: number = 15): CyberThreat[] {
  const threats: CyberThreat[] = [];
  const types = Object.keys(cyberThreatNames) as CyberThreatType[];
  const sectors = Object.keys(targetSystems) as CyberTargetType[];
  const severities: CyberThreatSeverity[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
  const statuses: Array<'DETECTED' | 'ANALYZING' | 'CONTAINED' | 'NEUTRALIZED'> = ['DETECTED', 'ANALYZING', 'CONTAINED', 'NEUTRALIZED'];

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const sector = sectors[Math.floor(Math.random() * sectors.length)];
    const names = cyberThreatNames[type];
    const systems = targetSystems[sector];

    threats.push({
      id: `CTH-${Date.now()}-${i}`,
      type,
      name: names[Math.floor(Math.random() * names.length)],
      description: `AI-detected ${type.toLowerCase().replace('_', ' ')} targeting ${sector.toLowerCase()} sector infrastructure.`,
      severity: severities[Math.floor(Math.random() * severities.length)],
      targetSector: sector,
      sourceIP: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
      targetSystem: systems[Math.floor(Math.random() * systems.length)],
      aptSignature: type === 'APT' ? `SIG-${Math.random().toString(36).substr(2, 8).toUpperCase()}` : undefined,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      aiConfidence: Math.floor(Math.random() * 25) + 75,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      iocIndicators: [
        `hash:${Math.random().toString(36).substr(2, 32)}`,
        `domain:malicious-${Math.floor(Math.random() * 1000)}.ke`,
        `ip:${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.0.0/16`,
      ].slice(0, Math.floor(Math.random() * 3) + 1),
    });
  }

  return threats.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate data lake sources
export function generateDataLakeSources(): DataLakeSource[] {
  const sources: DataLakeSource[] = [
    {
      id: 'DLS-001',
      type: 'NETWORK_LOGS',
      name: 'National Firewall Logs',
      status: 'ACTIVE',
      dataRate: 2450,
      lastUpdate: new Date(),
      recordsProcessed: 15420000,
      alertsGenerated: 342,
    },
    {
      id: 'DLS-002',
      type: 'DARK_WEB',
      name: 'Dark Web Intelligence Feed',
      status: 'ACTIVE',
      dataRate: 128,
      lastUpdate: new Date(Date.now() - 5 * 60 * 1000),
      recordsProcessed: 89450,
      alertsGenerated: 67,
    },
    {
      id: 'DLS-003',
      type: 'CCTV_STREAM',
      name: 'National CCTV Network',
      status: 'ACTIVE',
      dataRate: 8500,
      lastUpdate: new Date(),
      recordsProcessed: 4520000,
      alertsGenerated: 156,
    },
    {
      id: 'DLS-004',
      type: 'CITIZEN_REPORT',
      name: 'Community Intelligence App',
      status: 'ACTIVE',
      dataRate: 45,
      lastUpdate: new Date(Date.now() - 2 * 60 * 1000),
      recordsProcessed: 12890,
      alertsGenerated: 89,
    },
    {
      id: 'DLS-005',
      type: 'OSINT',
      name: 'Open Source Intelligence',
      status: 'PROCESSING',
      dataRate: 890,
      lastUpdate: new Date(Date.now() - 10 * 60 * 1000),
      recordsProcessed: 2340000,
      alertsGenerated: 234,
    },
    {
      id: 'DLS-006',
      type: 'SIGINT',
      name: 'Signals Intelligence',
      status: 'ACTIVE',
      dataRate: 1200,
      lastUpdate: new Date(),
      recordsProcessed: 890000,
      alertsGenerated: 45,
    },
  ];
  return sources;
}

// Generate blockchain ledger entries
export function generateBlockchainLedger(count: number = 20): BlockchainLedgerEntry[] {
  const entries: BlockchainLedgerEntry[] = [];
  const dataTypes: Array<'THREAT_ALERT' | 'EVIDENCE' | 'RESPONSE_ACTION' | 'AUDIT_LOG'> = ['THREAT_ALERT', 'EVIDENCE', 'RESPONSE_ACTION', 'AUDIT_LOG'];
  const agencies = ['NIS', 'NPS', 'KDF', 'DCI', 'NCTC', 'CAK'];

  let prevHash = '0000000000000000000000000000000000000000000000000000000000000000';

  for (let i = 0; i < count; i++) {
    const hash = Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    const dataType = dataTypes[Math.floor(Math.random() * dataTypes.length)];

    entries.push({
      id: `BLK-${i.toString().padStart(6, '0')}`,
      blockHash: hash,
      previousHash: prevHash,
      timestamp: new Date(Date.now() - (count - i) * 15 * 60 * 1000),
      dataType,
      content: `${dataType.replace('_', ' ')} recorded at block ${i}`,
      agencyId: agencies[Math.floor(Math.random() * agencies.length)],
      verified: true,
      courtAdmissible: Math.random() > 0.2,
    });

    prevHash = hash;
  }

  return entries.reverse();
}

// Generate coordinated attacks
export function generateCoordinatedAttacks(count: number = 5): CoordinatedAttack[] {
  const attacks: CoordinatedAttack[] = [];
  const regions = Object.keys(kenyaLocations) as Region[];
  const statuses: Array<'DETECTED' | 'RESPONDING' | 'CONTAINED' | 'RESOLVED'> = ['DETECTED', 'RESPONDING', 'CONTAINED', 'RESOLVED'];
  const facilities = [
    'KPLC Grid Station Alpha',
    'Mombasa Port Control Center',
    'JKIA Terminal Control',
    'CBK Data Center',
    'Safaricom NOC',
    'Water Treatment Plant',
  ];
  const vectors = [
    'Cyber intrusion timed with physical breach',
    'DDoS cover for facility infiltration',
    'Network disruption with simultaneous sabotage',
    'Ransomware deployment with insider threat',
  ];

  for (let i = 0; i < count; i++) {
    attacks.push({
      id: `COORD-${Date.now()}-${i}`,
      cyberId: `CTH-${Date.now()}-${Math.floor(Math.random() * 10)}`,
      physicalId: `INC-${Date.now()}-${Math.floor(Math.random() * 10)}`,
      correlationScore: Math.floor(Math.random() * 30) + 70,
      attackVector: vectors[Math.floor(Math.random() * vectors.length)],
      targetFacility: facilities[Math.floor(Math.random() * facilities.length)],
      region: regions[Math.floor(Math.random() * regions.length)],
      timestamp: new Date(Date.now() - Math.random() * 6 * 60 * 60 * 1000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      responseActions: [
        'IP blocking initiated',
        'Physical security dispatched',
        'System isolation in progress',
        'Evidence preservation active',
      ].slice(0, Math.floor(Math.random() * 3) + 2),
    });
  }

  return attacks.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate automated responses
export function generateAutomatedResponses(count: number = 12): AutomatedResponse[] {
  const responses: AutomatedResponse[] = [];
  const types: ResponseType[] = ['IP_BLOCK', 'SYSTEM_ISOLATE', 'POLICE_DISPATCH', 'ALERT_AGENCY', 'LOCKDOWN', 'EVIDENCE_PRESERVE'];
  const statuses: Array<'PENDING' | 'EXECUTING' | 'COMPLETED' | 'FAILED'> = ['PENDING', 'EXECUTING', 'COMPLETED', 'FAILED'];
  const agencies = ['NIS', 'NPS', 'KDF', 'DCI', 'NCTC', 'CAK', 'GSU'];

  const descriptions: Record<ResponseType, string[]> = {
    IP_BLOCK: ['Blocking malicious IP range', 'Firewall rule deployed', 'Traffic blackhole initiated'],
    SYSTEM_ISOLATE: ['Critical system isolated', 'Network segment quarantined', 'Server taken offline'],
    POLICE_DISPATCH: ['Quick response unit dispatched', 'Patrol units redirected', 'GSU team deployed'],
    ALERT_AGENCY: ['Inter-agency alert sent', 'Threat notification broadcast', 'Emergency coordination initiated'],
    LOCKDOWN: ['Facility lockdown initiated', 'Access control override', 'Perimeter secured'],
    EVIDENCE_PRESERVE: ['Memory dump captured', 'Log files preserved', 'Blockchain record created'],
  };

  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)];
    const descs = descriptions[type];

    responses.push({
      id: `RESP-${Date.now()}-${i}`,
      triggerThreatId: `CTH-${Date.now()}-${Math.floor(Math.random() * 10)}`,
      responseType: type,
      description: descs[Math.floor(Math.random() * descs.length)],
      timestamp: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
      status: statuses[Math.floor(Math.random() * statuses.length)],
      executionTimeMs: Math.floor(Math.random() * 5000) + 100,
      targetSystem: type === 'IP_BLOCK' || type === 'SYSTEM_ISOLATE' ? 'Target System ' + Math.floor(Math.random() * 100) : undefined,
      unitsDispatched: type === 'POLICE_DISPATCH' ? Math.floor(Math.random() * 5) + 1 : undefined,
      coordinatingAgencies: agencies.slice(0, Math.floor(Math.random() * 3) + 1),
    });
  }

  return responses.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Generate system layer statuses
export function generatePerceptionLayerStatus(): PerceptionLayerStatus {
  return {
    iotSensorsActive: Math.floor(Math.random() * 500) + 4500,
    iotSensorsTotal: 5000,
    dronesActive: Math.floor(Math.random() * 5) + 20,
    dronesTotal: 25,
    networkSniffersActive: Math.floor(Math.random() * 10) + 40,
    cctvFeeds: Math.floor(Math.random() * 500) + 4500,
    dataIngestionRate: Math.floor(Math.random() * 100) + 850,
  };
}

export function generateCognitionLayerStatus(): CognitionLayerStatus {
  return {
    mlModelsActive: 12,
    aptSignaturesLoaded: 15420,
    threatClassificationsToday: Math.floor(Math.random() * 5000) + 10000,
    averageProcessingTimeMs: Math.floor(Math.random() * 50) + 25,
    falsePositiveRate: Math.random() * 2 + 1,
    modelAccuracy: 97 + Math.random() * 2,
  };
}

export function generateIntegrityLayerStatus(): IntegrityLayerStatus {
  return {
    blockchainHeight: Math.floor(Math.random() * 10000) + 150000,
    lastBlockHash: Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''),
    pendingTransactions: Math.floor(Math.random() * 50),
    nodesOnline: Math.floor(Math.random() * 3) + 7,
    dataProtectionCompliant: true,
    lastAuditDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
  };
}

// === NEW MULTIPLAYER INCIDENT TYPES (re-exported from @/types) ===

export type {
  AgencyID,
  IncidentParticipant,
  AuditEntry,
  ThreatIncident,
} from '@/types';

// Removed unused IncidentParticipant import
import type { AgencyID, ThreatIncident } from '@/types';

// Generate advanced threat incidents
export function generateThreatIncidents(count: number = 5): ThreatIncident[] {
  const incidents: ThreatIncident[] = [];
  const agencies: AgencyID[] = ['ICT_MINISTRY', 'CENTRAL_BANK', 'KE_CIRT', 'ENERGY_REGULATOR'];
  const severities: Array<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'> = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
  const statuses: Array<'DETECTED' | 'TRIAGED' | 'CONTAINED' | 'RESOLVED'> = ['DETECTED', 'TRIAGED', 'CONTAINED', 'RESOLVED'];
  const mitreIds = ['T1566', 'T1190', 'T1078', 'T1204', 'T1003'];

  for (let i = 0; i < count; i++) {
    const assigned = agencies.slice(0, Math.floor(Math.random() * 3) + 1);

    incidents.push({
      id: `ADV-INC-${Date.now()}-${i}`,
      mitreAttackId: mitreIds[Math.floor(Math.random() * mitreIds.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      assignedAgencies: assigned,
      activeWarRoom: Array.from({ length: Math.floor(Math.random() * 3) + 1 }, (_, idx) => ({
        id: `USR-${idx}`,
        agency: assigned[idx % assigned.length],
        activeStatus: ['VIEWING', 'REMEDIATING', 'IDLE'][Math.floor(Math.random() * 3)] as 'VIEWING' | 'REMEDIATING' | 'IDLE',
        lastSeen: new Date()
      })),
      auditTrail: [
        {
          timestamp: new Date().toISOString(),
          actor: 'SYSTEM',
          action: 'INCIDENT_CREATED',
          previousState: 'NULL',
          newState: 'DETECTED'
        }
      ]
    });
  }

  return incidents;
}

// === 4 WINNING PILLARS: MAJESTIC SHIELD (types re-exported from @/types) ===

export type {
  AdversarialMetrics,
  FederatedNode,
  FederatedLearningStatus,
  XAIExplanation,
  SovereignLLM,
  EdgeNode,
  SovereignAIStatus,
} from '@/types';

import type {
  AdversarialMetrics,
  FederatedLearningStatus,
  XAIExplanation,
  SovereignLLM,
  EdgeNode,
  SovereignAIStatus,
} from '@/types';

// Pillar 1: Adversarial Robustness Layer

export function generateAdversarialMetrics(): AdversarialMetrics {
  return {
    attacksDetected: Math.floor(Math.random() * 500) + 1200,
    attacksBlocked: Math.floor(Math.random() * 480) + 1180,
    evasionAttempts: Math.floor(Math.random() * 50) + 30,
    poisoningAttempts: Math.floor(Math.random() * 10) + 5,
    modelExtractionAttempts: Math.floor(Math.random() * 8) + 2,
    defenseStatus: {
      gradientMasking: 'ACTIVE',
      noiseInjection: 'ACTIVE',
      adversarialTraining: 'ACTIVE',
      ensembleVoting: 'ACTIVE',
      certifiedRobustness: Math.random() > 0.3 ? 'ACTIVE' : 'INACTIVE',
    },
    redTeamCycle: {
      lastRun: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      attacksGenerated: Math.floor(Math.random() * 1000) + 500,
      failuresAnalyzed: Math.floor(Math.random() * 50) + 10,
      modelsRetrained: Math.floor(Math.random() * 5) + 1,
    },
    hardeningProgress: Math.floor(Math.random() * 15) + 85,
  };
}

// Pillar 2: Federated Learning Architecture

export function generateFederatedNodes(): FederatedLearningStatus {
  const agencies = [
    { id: 'NIS-FL-001', agency: 'National Intelligence Service' },
    { id: 'KRA-FL-002', agency: 'Kenya Revenue Authority' },
    { id: 'CBK-FL-003', agency: 'Central Bank of Kenya' },
    { id: 'IMM-FL-004', agency: 'Immigration Department' },
    { id: 'DCI-FL-005', agency: 'Directorate of Criminal Investigations' },
    { id: 'CAK-FL-006', agency: 'Communications Authority' },
  ];

  const statuses: Array<'ONLINE' | 'TRAINING' | 'SYNCING' | 'OFFLINE'> = ['ONLINE', 'TRAINING', 'SYNCING', 'OFFLINE'];

  return {
    globalModelVersion: `v${Math.floor(Math.random() * 5) + 3}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
    trainingRound: Math.floor(Math.random() * 50) + 150,
    totalRounds: 200,
    nodes: agencies.map(a => ({
      ...a,
      status: statuses[Math.floor(Math.random() * (statuses.length - 1))], // Avoid OFFLINE mostly
      lastSync: new Date(Date.now() - Math.random() * 60 * 60 * 1000),
      localDataPoints: Math.floor(Math.random() * 500000) + 100000,
      gradientsSent: Math.floor(Math.random() * 1000) + 500,
      modelVersion: `v${Math.floor(Math.random() * 5) + 3}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
      privacyBudget: Math.random() * 0.5 + 0.3,
    })),
    aggregationProgress: Math.floor(Math.random() * 100),
    differentialPrivacyEpsilon: 0.8 + Math.random() * 0.4,
    dataTransferred: 'GRADIENTS_ONLY',
    lastGlobalUpdate: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
  };
}

// Pillar 3: Explainable AI (XAI)

export function generateXAIExplanations(count: number = 5): XAIExplanation[] {
  const explanations: XAIExplanation[] = [];
  const actions = [
    'IP Blocked',
    'Session Terminated',
    'User Account Locked',
    'System Isolated',
    'Alert Escalated',
    'Evidence Preserved',
  ];
  const threatTypes = ['APT', 'Ransomware', 'Phishing', 'DDoS', 'Insider Threat', 'Data Breach'];

  const factorTemplates = [
    { name: 'Mouse pattern anomaly', description: 'Right-handed to left-handed transition detected' },
    { name: 'Geo-fence violation', description: 'Access from outside authorized coordinates' },
    { name: 'Keystroke cadence', description: 'Typing rhythm deviation from baseline' },
    { name: 'Access time anomaly', description: 'Login outside normal working hours' },
    { name: 'IP reputation', description: 'Source IP associated with known threat actors' },
    { name: 'Behavioral score', description: 'Session behavior deviates from user profile' },
    { name: 'Network traffic pattern', description: 'Unusual data exfiltration pattern detected' },
    { name: 'Authentication failures', description: 'Multiple failed authentication attempts' },
  ];

  for (let i = 0; i < count; i++) {
    const selectedFactors = factorTemplates
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.floor(Math.random() * 3) + 2)
      .map(f => ({
        ...f,
        weight: Math.random() * 0.5 + 0.1,
      }))
      .sort((a, b) => b.weight - a.weight);

    const threatType = threatTypes[Math.floor(Math.random() * threatTypes.length)];
    const action = actions[Math.floor(Math.random() * actions.length)];

    explanations.push({
      id: `XAI-${Date.now()}-${i}`,
      threatId: `CTH-${Date.now()}-${i}`,
      threatType,
      action,
      confidence: Math.floor(Math.random() * 15) + 85,
      factors: selectedFactors,
      naturalLanguage: `${action} because ${selectedFactors[0].description.toLowerCase()} (${(selectedFactors[0].weight * 100).toFixed(0)}% confidence) AND ${selectedFactors[1]?.description.toLowerCase() || 'additional anomalies detected'}.`,
      timestamp: new Date(Date.now() - Math.random() * 2 * 60 * 60 * 1000),
      overrideLevel: Math.random() > 0.8 ? (['L1', 'L2', 'L3', 'L4'][Math.floor(Math.random() * 4)] as 'L1' | 'L2' | 'L3' | 'L4') : null,
      analystApproved: Math.random() > 0.3,
    });
  }

  return explanations.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Pillar 4: Sovereign AI Status

export function generateSovereignAIStatus(): SovereignAIStatus {
  const llms: SovereignLLM[] = [
    {
      id: 'LLM-001',
      name: 'LLaMA-70B',
      version: '2.1.0',
      status: 'ONLINE',
      gpuUtilization: Math.floor(Math.random() * 30) + 60,
      inferenceLatencyMs: Math.floor(Math.random() * 20) + 35,
      requestsPerSecond: Math.floor(Math.random() * 50) + 100,
      memoryUsageGB: Math.floor(Math.random() * 20) + 120,
    },
    {
      id: 'LLM-002',
      name: 'Mistral-22B',
      version: '1.8.0',
      status: 'ONLINE',
      gpuUtilization: Math.floor(Math.random() * 25) + 45,
      inferenceLatencyMs: Math.floor(Math.random() * 15) + 25,
      requestsPerSecond: Math.floor(Math.random() * 80) + 150,
      memoryUsageGB: Math.floor(Math.random() * 15) + 45,
    },
    {
      id: 'LLM-003',
      name: 'Falcon-40B (Swahili)',
      version: '3.2.1',
      status: Math.random() > 0.9 ? 'UPDATING' : 'ONLINE',
      gpuUtilization: Math.floor(Math.random() * 20) + 50,
      inferenceLatencyMs: Math.floor(Math.random() * 18) + 30,
      requestsPerSecond: Math.floor(Math.random() * 60) + 80,
      memoryUsageGB: Math.floor(Math.random() * 18) + 80,
    },
  ];

  const edgeLocations = [
    'JKIA Border Control',
    'Port of Mombasa',
    'Busia Checkpoint',
    'Malaba Border',
    'Namanga Border',
    'Wilson Airport',
    'NIS HQ Nairobi',
    'Regional HQ Mombasa',
  ];

  const edgeNodes: EdgeNode[] = edgeLocations.map((location, i) => ({
    id: `EDGE-${i.toString().padStart(3, '0')}`,
    location,
    status: Math.random() > 0.1 ? 'ONLINE' : (Math.random() > 0.5 ? 'MAINTENANCE' : 'OFFLINE'),
    lastHeartbeat: new Date(Date.now() - Math.random() * 60 * 1000),
    inferenceCount: Math.floor(Math.random() * 10000) + 1000,
  }));

  return {
    llms,
    edgeNodes,
    foreignAPICallsToday: 0, // ALWAYS 0 - Digital Sovereignty
    dataEgressToday: 0, // ALWAYS 0 - No data leaves Kenya
    onPremisePercentage: 100, // ALWAYS 100
    sovereignCloudProvider: 'NIS Secure Data Center (Nairobi)',
    lastSecurityAudit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    dpaCompliant: true,
  };
}
