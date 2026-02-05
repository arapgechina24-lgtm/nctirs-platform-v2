// Surveillance API: Mock data for demo
import { NextResponse } from 'next/server'

// Mock surveillance data
const mockSurveillance = [
    {
        id: 'surv-001',
        location: 'JKIA Terminal 1',
        type: 'CCTV',
        status: 'ACTIVE',
        latitude: -1.319167,
        longitude: 36.927778,
        streamUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'surv-002',
        location: 'Mombasa Port Entry',
        type: 'ANPR',
        status: 'ACTIVE',
        latitude: -4.0435,
        longitude: 39.6682,
        streamUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        id: 'surv-003',
        location: 'Nairobi CBD - Kenyatta Ave',
        type: 'CCTV',
        status: 'ACTIVE',
        latitude: -1.2864,
        longitude: 36.8172,
        streamUrl: null,
        createdAt: new Date(),
        updatedAt: new Date()
    }
]

// GET /api/surveillance - List surveillance feeds
export async function GET() {
    return NextResponse.json({
        feeds: mockSurveillance,
        total: mockSurveillance.length,
        demo: true
    })
}
