// Types for the security intelligence platform
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
    coordinates: [number, number]; // [lat, lng]
  };
  threatLevel: ThreatLevel;
  status: IncidentStatus;
  timestamp: Date;
  affectedArea: number; // in km²
  casualties?: number;
  suspects?: number;
  aiConfidence: number; // 0-100
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
  probability: number; // 0-100
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
  eta: number; // minutes
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
  riskScore: number; // 0-100
}

export interface TimeSeriesData {
  date: string;
  total: number;
  [key: string]: string | number;
}

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
