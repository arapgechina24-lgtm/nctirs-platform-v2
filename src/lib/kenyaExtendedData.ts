// KENYA EXTENDED CONTEXT DATASET
// Specialized for Advanced AI Training (NIRU Hackathon Winning Features)
// Covers: Border Control, Wildlife, Influence Ops, Cyber Attribution

// ==========================================
// 4. BORDER CONTROL LOGS (Mandera/Busia/Namanga)
// Impact: Cross-border terrorism, smuggling, illegal immigration
// ==========================================

export interface BorderLog {
    id: string;
    pointOfEntry: 'Mandera' | 'Busia' | 'Namanga' | 'Moyale' | 'JKIA';
    direction: 'ENTRY' | 'EXIT';
    travelerNationality: string;
    riskFlag: 'NONE' | 'INTERPOL_MATCH' | 'TRAVEL_PATTERN_ANOMALY' | 'FAKE_DOCS';
    notes: string;
    timestamp: Date;
}

export function generateBorderLogs(count: number = 30): BorderLog[] {
    const points = ['Mandera', 'Busia', 'Namanga', 'Moyale', 'JKIA'] as const;
    const flags = ['NONE', 'NONE', 'NONE', 'INTERPOL_MATCH', 'TRAVEL_PATTERN_ANOMALY', 'FAKE_DOCS'] as const;
    const logs: BorderLog[] = [];

    for (let i = 0; i < count; i++) {
        const point = points[Math.floor(Math.random() * points.length)];
        const flag = flags[Math.floor(Math.random() * flags.length)];
        let note = "Standard clearance.";

        if (flag === 'INTERPOL_MATCH') note = "Subject matched Red Notice (ID: REF-88392). Detained.";
        if (flag === 'TRAVEL_PATTERN_ANOMALY') note = "Subject travel history: SOM -> YEM -> KEN within 48hrs.";
        if (point === 'Mandera' && Math.random() > 0.7) note = "Unverified biometric data. Enhanced screening required.";

        logs.push({
            id: `BDR-${Date.now()}-${i}`,
            pointOfEntry: point,
            direction: Math.random() > 0.5 ? 'ENTRY' : 'EXIT',
            travelerNationality: Math.random() > 0.6 ? 'Kenyan' : ['Somali', 'Ugandan', 'Tanzanian', 'British', 'Yemeni'][Math.floor(Math.random() * 5)],
            riskFlag: flag,
            notes: note,
            timestamp: new Date(Date.now() - Math.random() * 48 * 60 * 60 * 1000)
        });
    }
    return logs;
}

// ==========================================
// 5. WILDLIFE POACHING TRACKERS (Tsavo/Mara)
// Impact: Economic sabotage, organized crime funding
// ==========================================

export interface WildlifePing {
    assetId: string;
    type: 'ELEPHANT' | 'RHINO' | 'RANGER_UNIT';
    location: string;
    coordinates: [number, number];
    status: 'NORMAL' | 'STRESS_MOVEMENT' | 'GEOFENCE_BREACH' | 'SIGNAL_LOST';
    batteryLevel: number;
}

export function generateWildlifeData(count: number = 20): WildlifePing[] {
    const assets: WildlifePing[] = [];
    const parks = ['Tsavo East', 'Tsavo West', 'Maasai Mara', 'Laikipia Conservancy'];

    for (let i = 0; i < count; i++) {
        const type = (['ELEPHANT', 'RHINO', 'RANGER_UNIT'] as const)[Math.floor(Math.random() * 3)];
        const status = (['NORMAL', 'NORMAL', 'STRESS_MOVEMENT', 'GEOFENCE_BREACH'] as const)[Math.floor(Math.random() * 4)];

        assets.push({
            assetId: `${type.substring(0, 3)}-${Math.floor(Math.random() * 1000)}`,
            type,
            location: parks[Math.floor(Math.random() * parks.length)],
            coordinates: [-2.0 + (Math.random()), 38.0 + (Math.random())], // Rough Tsavo coords
            status,
            batteryLevel: Math.floor(Math.random() * 100)
        });
    }
    return assets;
}

// ==========================================
// 6. SOCIAL MEDIA SENTIMENT (Radicalization/Unrest)
// Impact: Predicting public disorder (Maandamano) or recruitment
// ==========================================

export interface SocialSentiment {
    platform: 'TWITTER_X' | 'TIKTOK' | 'TELEGRAM' | 'WHATSAPP_PUBLIC';
    topic: string;
    sentimentScore: number; // -1.0 (Negative/Violent) to 1.0 (Positive/Peaceful)
    volume: number; // Mentions per hour
    trendingKeywords: string[];
    flaggedContent: boolean;
}

export function generateSocialSentiment(): SocialSentiment[] {
    return [
        {
            platform: 'TWITTER_X',
            topic: '#MaandamanoTuesday',
            sentimentScore: -0.8,
            volume: 15400,
            trendingKeywords: ['Occupy', 'StateHouse', 'RejectBill', 'PoliceBrutality'],
            flaggedContent: true // Potential for unrest
        },
        {
            platform: 'TIKTOK',
            topic: 'Youth Employment',
            sentimentScore: -0.4,
            volume: 8900,
            trendingKeywords: ['Jobs', 'Government', 'Promises'],
            flaggedContent: false
        },
        {
            platform: 'TELEGRAM',
            topic: 'Encrypted Chatter Group A',
            sentimentScore: -0.9,
            volume: 120,
            trendingKeywords: ['Material', 'Meeting', 'Location', 'Coordinate'],
            flaggedContent: true // High risk recruitment
        },
        {
            platform: 'WHATSAPP_PUBLIC',
            topic: 'Community Policing',
            sentimentScore: 0.7,
            volume: 450,
            trendingKeywords: ['Safety', 'Report', 'Neighbor'],
            flaggedContent: false
        }
    ];
}

// ==========================================
// 7. CYBER ATTRIBUTION (Local ISP Context)
// Impact: Identifying if attack is domestic or foreign
// ==========================================

export interface ISPTrace {
    ip: string;
    isp: string;
    asn: number;
    city: string;
    connectionType: 'FIBER_HOME' | '4G_MOBILE' | 'DATA_CENTER' | 'SAT_LINK';
    riskScore: number;
}

const kenyanISPs = [
    { name: 'Safaricom PLC', asn: 33771 },
    { name: 'Wananchi Group (Zuku)', asn: 36914 },
    { name: 'Jamii Telecommunications', asn: 37063 },
    { name: 'Liquid Intelligent Technologies', asn: 30844 },
    { name: 'Starlink Kenya', asn: 14593 }
];

export function generateCyberAttribution(count: number = 10): ISPTrace[] {
    const traces: ISPTrace[] = [];

    for (let i = 0; i < count; i++) {
        const isp = kenyanISPs[Math.floor(Math.random() * kenyanISPs.length)];
        const isMalicious = Math.random() > 0.8;

        traces.push({
            ip: `196.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`, // Typical KE IP block
            isp: isp.name,
            asn: isp.asn,
            city: ['Nairobi', 'Mombasa', 'Kisumu', 'Nakuru'][Math.floor(Math.random() * 4)],
            connectionType: (['FIBER_HOME', '4G_MOBILE', 'DATA_CENTER'] as const)[Math.floor(Math.random() * 3)],
            riskScore: isMalicious ? 85 + Math.floor(Math.random() * 15) : Math.floor(Math.random() * 20)
        });
    }
    return traces;
}
