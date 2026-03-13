// Data fetching hooks for NSSPIP Dashboard
// Wraps API calls with React state management

import { useState, useEffect, useCallback } from 'react'
import { fetchIncidents, fetchThreats } from '@/lib/nctirs/api'
import type { SecurityIncident, CyberThreat } from '@/lib/nctirs/mockData'

export function useIncidents(options?: Parameters<typeof fetchIncidents>[0]) {
    const [incidents, setIncidents] = useState<SecurityIncident[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const refetch = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchIncidents(options)
            setIncidents(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options?.status, options?.severity, options?.limit])

    useEffect(() => {
        refetch()
    }, [refetch])

    return { incidents, loading, error, refetch }
}

export function useThreats(options?: Parameters<typeof fetchThreats>[0]) {
    const [threats, setThreats] = useState<CyberThreat[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<Error | null>(null)

    const refetch = useCallback(async () => {
        setLoading(true)
        try {
            const data = await fetchThreats(options)
            setThreats(data)
            setError(null)
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Unknown error'))
        } finally {
            setLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options?.type, options?.severity, options?.limit])

    useEffect(() => {
        refetch()
    }, [refetch])

    return { threats, loading, error, refetch }
}
