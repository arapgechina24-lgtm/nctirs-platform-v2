// WebSocket Server for Real-time Updates
// Note: This would typically run on a separate server or using Socket.io with Next.js API routes

import { Server as HTTPServer } from 'http'
import { Server as SocketIOServer, Socket } from 'socket.io'

// Event types for real-time updates
export type SocketEvent =
    | 'connect'
    | 'disconnect'
    | 'incident:new'
    | 'incident:update'
    | 'incident:resolve'
    | 'threat:detected'
    | 'threat:mitigated'
    | 'alert:critical'
    | 'alert:high'
    | 'surveillance:alert'
    | 'system:status'

// Data types for socket events
export interface SocketEventData {
    'incident:new': {
        id: string
        title: string
        severity: string
        location?: string
        timestamp: string
    }
    'incident:update': {
        id: string
        status: string
        updates: Record<string, unknown>
    }
    'threat:detected': {
        id: string
        name: string
        type: string
        severity: string
        confidence: number
    }
    'alert:critical': {
        message: string
        asset: string
        action: string
        timestamp: string
    }
    'system:status': {
        status: 'NOMINAL' | 'ELEVATED' | 'CRITICAL'
        metrics: {
            cpuLoad: number
            memoryUsage: number
            activeConnections: number
        }
    }
}

// Socket.io server setup function
export function setupSocketServer(httpServer: HTTPServer): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
            methods: ['GET', 'POST'],
        },
        path: '/api/socket',
    })

    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Client connected: ${socket.id}`)

        // Join room based on user agency/role
        socket.on('join:agency', (agency: string) => {
            socket.join(`agency:${agency}`)
            console.log(`[Socket] ${socket.id} joined agency: ${agency}`)
        })

        // Join room for specific incident
        socket.on('join:incident', (incidentId: string) => {
            socket.join(`incident:${incidentId}`)
            console.log(`[Socket] ${socket.id} joined incident: ${incidentId}`)
        })

        // Handle real-time incident updates
        socket.on('incident:update', (data: SocketEventData['incident:update']) => {
            io.to(`incident:${data.id}`).emit('incident:update', data)
        })

        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`[Socket] Client disconnected: ${socket.id}`)
        })
    })

    return io
}

// Client-side socket hook (for use in React components)
export const socketConfig = {
    path: '/api/socket',
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
}

// Broadcast helpers
export function broadcastIncident(io: SocketIOServer, data: SocketEventData['incident:new']) {
    io.emit('incident:new', data)
}

export function broadcastThreat(io: SocketIOServer, data: SocketEventData['threat:detected']) {
    io.emit('threat:detected', data)
}

export function broadcastCriticalAlert(io: SocketIOServer, data: SocketEventData['alert:critical']) {
    io.emit('alert:critical', data)
}
