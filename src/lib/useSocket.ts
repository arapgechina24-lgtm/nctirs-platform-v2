// React hook for WebSocket connection
'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { socketConfig, SocketEventData } from './socket'

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export function useSocket() {
    const socketRef = useRef<Socket | null>(null)
    const [status, setStatus] = useState<SocketStatus>('disconnected')
    const [lastEvent, setLastEvent] = useState<{ type: string; data: unknown } | null>(null)

    useEffect(() => {
        // Initialize socket connection
        const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', socketConfig)
        socketRef.current = socket

        socket.on('connect', () => {
            console.log('[Socket] Connected:', socket.id)
            setStatus('connected')
        })

        socket.on('disconnect', () => {
            console.log('[Socket] Disconnected')
            setStatus('disconnected')
        })

        socket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error)
            setStatus('error')
        })

        // Listen for real-time events
        socket.on('incident:new', (data: SocketEventData['incident:new']) => {
            setLastEvent({ type: 'incident:new', data })
        })

        socket.on('incident:update', (data: SocketEventData['incident:update']) => {
            setLastEvent({ type: 'incident:update', data })
        })

        socket.on('threat:detected', (data: SocketEventData['threat:detected']) => {
            setLastEvent({ type: 'threat:detected', data })
        })

        socket.on('alert:critical', (data: SocketEventData['alert:critical']) => {
            setLastEvent({ type: 'alert:critical', data })
            // Could trigger emergency overlay here
        })

        socket.on('system:status', (data: SocketEventData['system:status']) => {
            setLastEvent({ type: 'system:status', data })
        })

        setStatus('connecting')

        // Cleanup on unmount
        return () => {
            socket.disconnect()
        }
    }, [])

    // Join agency room
    const joinAgency = useCallback((agency: string) => {
        socketRef.current?.emit('join:agency', agency)
    }, [])

    // Join incident room
    const joinIncident = useCallback((incidentId: string) => {
        socketRef.current?.emit('join:incident', incidentId)
    }, [])

    // Emit custom event
    const emit = useCallback((event: string, data: unknown) => {
        socketRef.current?.emit(event, data)
    }, [])

    return {
        socket: socketRef.current,
        status,
        lastEvent,
        joinAgency,
        joinIncident,
        emit,
        isConnected: status === 'connected',
    }
}

// Hook for subscribing to specific events
export function useSocketEvent<T = unknown>(
    eventName: string,
    callback: (data: T) => void
) {
    const { socket } = useSocket()

    useEffect(() => {
        if (!socket) return

        socket.on(eventName, callback)

        return () => {
            socket.off(eventName, callback)
        }
    }, [socket, eventName, callback])
}
