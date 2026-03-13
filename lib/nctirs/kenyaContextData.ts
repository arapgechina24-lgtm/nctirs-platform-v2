// KENYA CONTEXT DATASET (THE "GOLDEN" SET)
// Specialized data for AI Training & Simulation
// Context: Nairobi Region

// ==========================================
// 1. NAIROBI TRAFFIC FLOWS
// Impact: Response times, patrol routing
// ==========================================

export interface TrafficNode {
    id: string;
    roadName: string;
    segment: string;
    coordinates: [number, number];
    congestionLevel: number; // 0 (Clear) to 10 (Gridlock)
    avgSpeedKmh: number;
    incident?: string;
    timestamp: Date;
}

const nairobiRoads = [
    { name: 'Thika Superhighway', segments: ['Muthaiga', 'Allsops', 'Kasarani', 'Ruiru'] },
    { name: 'Mombasa Road', segments: ['City Cabanas', 'Imara Daima', 'Nyayo Stadium', 'GM'] },
    { name: 'Waiyaki Way', segments: ['Westlands', 'Kangemi', 'Uthiru', 'ABC Place'] },
    { name: 'Langata Road', segments: ['T-Mall', 'Bomas', 'Karen', 'Carnivore'] },
    { name: 'Jogoo Road', segments: ['City Stadium', 'Makadara', 'Donholm'] },
];

export function generateNairobiTraffic(count: number = 50): TrafficNode[] {
    const data: TrafficNode[] = [];
    const now = new Date();
    const hour = now.getHours();
    const isPeakHour = (hour >= 6 && hour <= 9) || (hour >= 16 && hour <= 19);

    for (let i = 0; i < count; i++) {
        const road = nairobiRoads[Math.floor(Math.random() * nairobiRoads.length)];
        const segment = road.segments[Math.floor(Math.random() * road.segments.length)];

        // Traffic logic: Peak hours = higher congestion
        let baseCongestion = isPeakHour ? Math.floor(Math.random() * 5) + 5 : Math.floor(Math.random() * 4);

        // Random incident injection (Accidents, Police Checks)
        const hasIncident = Math.random() > 0.85;
        let incidentDetail = undefined;

        if (hasIncident) {
            baseCongestion = Math.min(10, baseCongestion + 3);
            const incidents = ['Stalled Lorry', 'Minor Accident', 'Police Roadblock', 'Construction Work', 'PSV Strike'];
            incidentDetail = incidents[Math.floor(Math.random() * incidents.length)];
        }

        const speed = Math.max(0, 100 - (baseCongestion * 10) + (Math.random() * 10 - 5));

        data.push({
            id: `TRF-${Date.now()}-${i}`,
            roadName: road.name,
            segment: segment,
            coordinates: [-1.2921 + (Math.random() * 0.1 - 0.05), 36.8219 + (Math.random() * 0.1 - 0.05)], // Approx Nairobi bounds
            congestionLevel: baseCongestion,
            avgSpeedKmh: Math.floor(speed),
            incident: incidentDetail,
            timestamp: now,
        });
    }
    return data;
}

// ==========================================
// 2. MPESA TRANSACTION PATTERNS
// Impact: Fraud detection, Financial crime
// ==========================================

export type TransactionType = 'PAYBILL' | 'SEND_MONEY' | 'WITHDRAW' | 'BUY_GOODS' | 'FULIZA';
export type FraudFlag = 'NONE' | 'STRUCTURING' | 'SIM_SWAP_PATTERN' | 'VELOCITY_LIMIT' | 'HIGH_VALUE_NEW_DEVICE';

export interface MpesaTransaction {
    transactionId: string;
    amount: number;
    type: TransactionType;
    senderMasked: string; // e.g. 2547***123
    recipient: string;
    location: string;
    timestamp: Date;
    deviceId: string;
    fraudFlag: FraudFlag;
    riskScore: number; // 0-100
}

export function generateMpesaData(count: number = 50): MpesaTransaction[] {
    const transactions: MpesaTransaction[] = [];
    const fraudFlags: FraudFlag[] = ['STRUCTURING', 'SIM_SWAP_PATTERN', 'VELOCITY_LIMIT', 'HIGH_VALUE_NEW_DEVICE'];

    for (let i = 0; i < count; i++) {
        const isFraud = Math.random() > 0.8;
        const type = (['PAYBILL', 'SEND_MONEY', 'WITHDRAW', 'BUY_GOODS', 'FULIZA'] as TransactionType[])[Math.floor(Math.random() * 5)];

        // Amount logic: Fraud often involves specific amounts or limits
        let amount = Math.floor(Math.random() * 5000) + 100;
        if (isFraud) {
            if (Math.random() > 0.5) amount = 299999; // Just below reporting limit
            else amount = Math.floor(Math.random() * 100); // Testing small amounts before big one
        }

        const riskScore = isFraud ? Math.floor(Math.random() * 40) + 60 : Math.floor(Math.random() * 20);

        transactions.push({
            transactionId: `R${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            amount: amount,
            type: type,
            senderMasked: `2547${Math.floor(Math.random() * 100)}***${Math.floor(Math.random() * 1000)}`,
            recipient: Math.random() > 0.5 ? 'Agent 284***' : 'Paybill 544***',
            location: ['M-PESA Agent - CBD', 'Online API', 'Phone Menu', 'ATM Withdrawal'].sort(() => 0.5 - Math.random())[0],
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            deviceId: `IMEI-${Math.floor(Math.random() * 999999)}`,
            fraudFlag: isFraud ? fraudFlags[Math.floor(Math.random() * fraudFlags.length)] : 'NONE',
            riskScore: riskScore,
        });
    }
    return transactions.sort((a, b) => b.riskScore - a.riskScore);
}

// ==========================================
// 3. NAIROBI WEATHER PATTERNS
// Impact: Crime correlation (e.g., Rain = traffic jams = reduced mugging but increased burglary)
// ==========================================

export interface WeatherLog {
    condition: 'Sunny' | 'Heavy Rain' | 'Cloudy' | 'Fog';
    temperature: number;
    rainfallMm: number;
    crimeCorrelationFactor: number; // Multiplier for crime probability
    predictionNote: string;
}

export function getCurrentNairobiWeather(): WeatherLog {
    const month = new Date().getMonth(); // 0-11
    // Kenya Seasons: Long Rains (Mar-May), Short Rains (Oct-Dec)
    const isRainySeason = [2, 3, 4, 9, 10, 11].includes(month);

    const rand = Math.random();
    let condition: 'Sunny' | 'Heavy Rain' | 'Cloudy' | 'Fog' = 'Sunny';

    if (isRainySeason && rand > 0.4) condition = 'Heavy Rain';
    else if (!isRainySeason && rand > 0.8) condition = 'Cloudy';
    else if (rand < 0.1) condition = 'Fog'; // 10% chance of Fog generally

    // Correlations
    let correlation = 1.0;
    let note = "Normal baseline activity expected.";

    if (condition === 'Heavy Rain') {
        correlation = 0.7; // Street crime drops during rain
        note = "Reduced foot traffic crime globally. Watch for structural failures in informal settlements.";
    } else if (condition === 'Fog') {
        correlation = 1.2; // Low visibility
        note = "High risk of traffic incidents and undetectable perimeter breaches.";
    } else if (condition === 'Sunny' && Math.random() > 0.7) {
        correlation = 1.1; // Heat effect
        note = "Higher temperatures correlating with increased agitation in public gatherings.";
    }

    return {
        condition,
        temperature: Math.floor(Math.random() * 10) + 20, // 20-30 deg C
        rainfallMm: condition === 'Heavy Rain' ? Math.floor(Math.random() * 50) + 10 : 0,
        crimeCorrelationFactor: correlation,
        predictionNote: note
    };
}
