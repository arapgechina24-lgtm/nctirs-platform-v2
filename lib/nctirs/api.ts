
// API Client for NSSPIP Dashboard
// Fetches data from backend API routes with fallback to mock data
import {
    generateMockIncidents,
    generateCyberThreats,
    SecurityIncident,
    CyberThreat,
} from './mockData'

// Base API URL
const API_BASE = '/api'

// Generic fetch wrapper with error handling and timeout
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
            ...options,
            signal: controller.signal,
        })

        if (!response.ok) {
            throw new Error(`API Error: ${response.status} ${response.statusText}`)
        }

        return await response.json()
    } finally {
        clearTimeout(timeoutId)
    }
}

// ===== INCIDENTS API =====

export interface DBIncident {
    id: string
    title: string
    description: string
    type: string
    severity: string
    status: string
    location: string | null
    latitude: number | null
    longitude: number | null
    county: string | null
    targetAsset: string | null
    attackVector: string | null
    indicators: string | null
    createdAt: string
    updatedAt: string
    detectedAt: string
    resolvedAt: string | null
    createdById: string | null
}

export async function fetchIncidents(options?: {
    status?: string
    severity?: string
    limit?: number
}): Promise<SecurityIncident[]> {
    try {
        const params = new URLSearchParams()
        if (options?.status) params.set('status', options.status)
        if (options?.severity) params.set('severity', options.severity)
        if (options?.limit) params.set('limit', options.limit.toString())

        const queryString = params.toString()
        const endpoint = queryString ? `/incidents?${queryString}` : '/incidents'

        const data = await apiFetch<{ incidents: DBIncident[], total: number }>(endpoint)

        // Map DB incidents to SecurityIncident format
        return data.incidents.map(mapDBIncidentToSecurityIncident)
    } catch (error) {
        console.warn('Failed to fetch incidents from API, using mock data:', error)
        return generateMockIncidents(30)
    }
}

function mapDBIncidentToSecurityIncident(db: DBIncident): SecurityIncident {
    // Map county to Region type
    const regionMap: Record<string, SecurityIncident['location']['region']> = {
        'Nairobi': 'NAIROBI',
        'Mombasa': 'MOMBASA',
        'Kisumu': 'KISUMU',
        'Nakuru': 'NAKURU',
        'Eldoret': 'ELDORET',
        'Turkana': 'TURKANA',
        'Garissa': 'GARISSA',
        'Mandera': 'MANDERA',
    }
    const region = db.county ? (regionMap[db.county] || 'NAIROBI') : 'NAIROBI'

    return {
        id: db.id,
        type: db.type as SecurityIncident['type'],
        title: db.title,
        description: db.description,
        location: {
            name: db.location || 'Unknown Location',
            region: region,
            coordinates: [
                db.latitude || -1.2921,
                db.longitude || 36.8219
            ] as [number, number],
        },
        threatLevel: db.severity as SecurityIncident['threatLevel'], // 'threatLevel' not 'severity'
        status: db.status as SecurityIncident['status'],
        timestamp: new Date(db.createdAt),
        affectedArea: Math.floor(Math.random() * 50) + 1, // Not stored in DB, generate placeholder
        casualties: undefined, // Not stored in DB
        suspects: undefined, // Not stored in DB
        aiConfidence: 75 + Math.floor(Math.random() * 20), // Not stored in DB, generate realistic value
        sources: ['Database', 'API'].slice(0, Math.floor(Math.random() * 2) + 1), // Placeholder
    }
}



export async function createIncident(incident: Partial<DBIncident>): Promise<DBIncident> {
    return apiFetch<DBIncident>('/incidents', {
        method: 'POST',
        body: JSON.stringify(incident),
    })
}

// ===== THREATS API =====

export interface DBThreat {
    id: string
    name: string
    type: string
    severity: string
    source: string | null
    targetSector: string | null
    confidence: number
    mitreId: string | null
    description: string | null
    indicators: string | null
    createdAt: string
    updatedAt: string
}

export async function fetchThreats(options?: {
    type?: string
    severity?: string
    limit?: number
}): Promise<CyberThreat[]> {
    try {
        const params = new URLSearchParams()
        if (options?.type) params.set('type', options.type)
        if (options?.severity) params.set('severity', options.severity)
        if (options?.limit) params.set('limit', options.limit.toString())

        const queryString = params.toString()
        const endpoint = queryString ? `/threats?${queryString}` : '/threats'

        const data = await apiFetch<{ threats: DBThreat[], total: number }>(endpoint)

        return data.threats.map(mapDBThreatToCyberThreat)
    } catch (error) {
        console.warn('Failed to fetch threats from API, using mock data:', error)
        return generateCyberThreats(20)
    }
}

function mapDBThreatToCyberThreat(db: DBThreat): CyberThreat {
    // Parse indicators from JSON string if available
    const parsedIndicators: string[] = db.indicators
        ? (() => { try { return JSON.parse(db.indicators) } catch { return [] } })()
        : []

    return {
        id: db.id,
        name: db.name,
        type: db.type as CyberThreat['type'],
        description: db.description || `AI - detected ${db.type.toLowerCase()} threat targeting ${db.targetSector || 'unknown'} sector.`,
        severity: db.severity as CyberThreat['severity'],
        targetSector: (db.targetSector as CyberThreat['targetSector']) || 'GOVERNMENT',
        sourceIP: undefined, // Not stored in DB
        targetSystem: db.targetSector ? `${db.targetSector} Systems` : 'Unknown System', // Required field
        aptSignature: db.type === 'APT' ? db.mitreId || undefined : undefined,
        timestamp: new Date(db.createdAt), // Required Date field
        aiConfidence: Math.round(db.confidence * 100), // Required: convert 0-1 to 0-100
        status: 'DETECTED' as const, // Required status field
        iocIndicators: parsedIndicators.length > 0 ? parsedIndicators : [`hash:${db.id.slice(0, 32)} `], // Required IOC array
    }
}

export async function createThreat(threat: Partial<DBThreat>): Promise<DBThreat> {
    return apiFetch<DBThreat>('/threats', {
        method: 'POST',
        body: JSON.stringify(threat),
    })
}

// ===== AUTH API =====

export interface LoginCredentials {
    email: string
    password: string
}

export interface User {
    id: string
    email: string
    name: string | null
    role: string
    agency: string | null
    department: string | null
    clearanceLevel: number
}

export interface LoginResponse {
    user: User
    token: string
}

export async function login(credentials: LoginCredentials): Promise<LoginResponse> {
    return apiFetch<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    })
}

export async function register(userData: {
    email: string
    password: string
    name?: string
    agency?: string
}): Promise<{ user: User }> {
    return apiFetch<{ user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
    })
}

// ===== AUDIT API =====

export interface AuditLog {
    id: string
    action: string
    resource: string
    resourceId: string | null
    details: string | null
    ipAddress: string | null
    userAgent: string | null
    hash: string | null
    previousHash: string | null
    createdAt: string
    userId: string | null
}

export async function fetchAuditLogs(options?: {
    userId?: string
    action?: string
    resource?: string
    limit?: number
}): Promise<AuditLog[]> {
    const params = new URLSearchParams()
    if (options?.userId) params.set('userId', options.userId)
    if (options?.action) params.set('action', options.action)
    if (options?.resource) params.set('resource', options.resource)
    if (options?.limit) params.set('limit', options.limit.toString())

    const queryString = params.toString()
    const endpoint = queryString ? `/audit?${queryString}` : '/audit'

    const data = await apiFetch<{ logs: AuditLog[], total: number }>(endpoint)
    return data.logs
}

export async function createAuditLog(log: {
    action: string
    resource: string
    resourceId?: string
    details?: Record<string, unknown>
    userId?: string
}): Promise<AuditLog> {
    return apiFetch<AuditLog>('/audit', {
        method: 'POST',
        body: JSON.stringify(log),
    })
}

// ===== DATA HOOKS (re-exported from src/hooks/useData.ts) =====
// Hooks have been moved to src/hooks/useData.ts for proper separation of concerns.
// These re-exports maintain backward compatibility.
export { useIncidents, useThreats } from '@/hooks/useData'
