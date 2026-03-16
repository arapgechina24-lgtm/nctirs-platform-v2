// React hook for WebSocket connection
'use client'

import { useEffect, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { socketConfig, SocketEventData } from './socket'

type SocketStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

export function useSocket() {
    const [socket, setSocket] = useState<Socket | null>(null)
    const [status, setStatus] = useState<SocketStatus>('disconnected')
    const [lastEvent, setLastEvent] = useState<{ type: string; data: unknown } | null>(null)

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(process.env.NEXT_PUBLIC_SOCKET_URL || '', socketConfig)
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setSocket(newSocket)

        newSocket.on('connect', () => {
            console.log('[Socket] Connected:', newSocket.id)
            setStatus('connected')
        })

        newSocket.on('disconnect', () => {
            console.log('[Socket] Disconnected')
            setStatus('disconnected')
        })

        newSocket.on('connect_error', (error) => {
            console.error('[Socket] Connection error:', error)
            setStatus('error')
        })

        // Listen for real-time events
        newSocket.on('incident:new', (data: SocketEventData['incident:new']) => {
            setLastEvent({ type: 'incident:new', data })
        })

        newSocket.on('incident:update', (data: SocketEventData['incident:update']) => {
            setLastEvent({ type: 'incident:update', data })
        })

        newSocket.on('threat:detected', (data: SocketEventData['threat:detected']) => {
            setLastEvent({ type: 'threat:detected', data })
        })

        newSocket.on('alert:critical', (data: SocketEventData['alert:critical']) => {
            setLastEvent({ type: 'alert:critical', data })
            // Could trigger emergency overlay here
        })

        newSocket.on('system:status', (data: SocketEventData['system:status']) => {
            setLastEvent({ type: 'system:status', data })
        })

        setStatus('connecting')

        // Cleanup on unmount
        return () => {
            newSocket.disconnect()
        }
    }, [])

    // Join agency room
    const joinAgency = useCallback((agency: string) => {
        socket?.emit('join:agency', agency)
    }, [socket])

    // Join incident room
    const joinIncident = useCallback((incidentId: string) => {
        socket?.emit('join:incident', incidentId)
    }, [socket])

    // Emit custom event
    const emit = useCallback((event: string, data: unknown) => {
        socket?.emit(event, data)
    }, [socket])

    return {
        socket,
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
