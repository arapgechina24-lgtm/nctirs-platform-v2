// Analytics tracking utility for NCTIRS Dashboard
// Stores analytics in localStorage for demo mode

type EventType = 'pageview' | 'click' | 'action' | 'error' | 'performance'

interface AnalyticsEvent {
    type: EventType
    name: string
    properties?: Record<string, unknown>
    timestamp: string
    sessionId: string
}

interface PerformanceMetrics {
    loadTime?: number
    renderTime?: number
    interactionTime?: number
}

// Generate session ID once per page load
const SESSION_ID = typeof window !== 'undefined'
    ? sessionStorage.getItem('nctirs_session') || generateSessionId()
    : 'server'

function generateSessionId(): string {
    const id = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (typeof window !== 'undefined') {
        sessionStorage.setItem('nctirs_session', id)
    }
    return id
}

// Analytics storage key
const STORAGE_KEY = 'nctirs_analytics'
const MAX_EVENTS = 1000 // Keep last 1000 events

// Get stored events
function getStoredEvents(): AnalyticsEvent[] {
    if (typeof window === 'undefined') return []
    try {
        const stored = localStorage.getItem(STORAGE_KEY)
        return stored ? JSON.parse(stored) : []
    } catch {
        return []
    }
}

// Save events to storage
function saveEvents(events: AnalyticsEvent[]) {
    if (typeof window === 'undefined') return
    try {
        // Keep only the last MAX_EVENTS
        const trimmed = events.slice(-MAX_EVENTS)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
    } catch (e) {
        console.warn('[Analytics] Failed to save events:', e)
    }
}

// Track an event
export function trackEvent(
    type: EventType,
    name: string,
    properties?: Record<string, unknown>
) {
    const event: AnalyticsEvent = {
        type,
        name,
        properties,
        timestamp: new Date().toISOString(),
        sessionId: SESSION_ID,
    }

    // Log in development
    if (process.env.NODE_ENV === 'development') {
        console.log('[Analytics]', event)
    }

    // Store event
    const events = getStoredEvents()
    events.push(event)
    saveEvents(events)

    return event
}

// Track page view
export function trackPageView(viewName: string, properties?: Record<string, unknown>) {
    return trackEvent('pageview', viewName, {
        url: typeof window !== 'undefined' ? window.location.href : '',
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        ...properties,
    })
}

// Track user action
export function trackAction(actionName: string, properties?: Record<string, unknown>) {
    return trackEvent('action', actionName, properties)
}

// Track click event
export function trackClick(elementName: string, properties?: Record<string, unknown>) {
    return trackEvent('click', elementName, properties)
}

// Track error
export function trackError(errorName: string, error?: Error, properties?: Record<string, unknown>) {
    return trackEvent('error', errorName, {
        message: error?.message,
        stack: error?.stack,
        ...properties,
    })
}

// Track performance
export function trackPerformance(metricName: string, metrics: PerformanceMetrics) {
    return trackEvent('performance', metricName, metrics as Record<string, unknown>)
}

// Get analytics summary
export function getAnalyticsSummary() {
    const events = getStoredEvents()

    const summary = {
        totalEvents: events.length,
        sessions: new Set(events.map(e => e.sessionId)).size,
        pageViews: events.filter(e => e.type === 'pageview').length,
        actions: events.filter(e => e.type === 'action').length,
        errors: events.filter(e => e.type === 'error').length,
        byType: {} as Record<string, number>,
        byName: {} as Record<string, number>,
        recentEvents: events.slice(-10),
    }

    // Count by type and name
    events.forEach(event => {
        summary.byType[event.type] = (summary.byType[event.type] || 0) + 1
        summary.byName[event.name] = (summary.byName[event.name] || 0) + 1
    })

    return summary
}

// Clear all analytics data
export function clearAnalytics() {
    if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
    }
}

// Export analytics as JSON
export function exportAnalytics(): string {
    const events = getStoredEvents()
    return JSON.stringify(events, null, 2)
}

// React hook for tracking
export function useAnalytics() {
    return {
        trackEvent,
        trackPageView,
        trackAction,
        trackClick,
        trackError,
        trackPerformance,
        getAnalyticsSummary,
        clearAnalytics,
        exportAnalytics,
    }
}
