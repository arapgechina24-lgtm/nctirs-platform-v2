import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
    trackEvent,
    trackPageView,
    trackAction,
    trackClick,
    trackError,
    trackPerformance,
    getAnalyticsSummary,
    clearAnalytics,
    exportAnalytics,
} from '@/lib/analytics'

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
        clear: vi.fn(() => { store = {} }),
    }
})()

// Mock sessionStorage
const sessionStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => { store[key] = value }),
        removeItem: vi.fn((key: string) => { delete store[key] }),
        clear: vi.fn(() => { store = {} }),
    }
})()

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock })
Object.defineProperty(globalThis, 'sessionStorage', { value: sessionStorageMock })

describe('Analytics Module', () => {
    beforeEach(() => {
        localStorageMock.clear()
        sessionStorageMock.clear()
        vi.clearAllMocks()
    })

    describe('trackEvent', () => {
        it('should create an event with correct structure', () => {
            const event = trackEvent('action', 'test-action', { key: 'value' })

            expect(event).toHaveProperty('type', 'action')
            expect(event).toHaveProperty('name', 'test-action')
            expect(event).toHaveProperty('properties')
            expect(event.properties).toEqual({ key: 'value' })
            expect(event).toHaveProperty('timestamp')
            expect(event).toHaveProperty('sessionId')
        })

        it('should store events in localStorage', () => {
            trackEvent('click', 'button-click')
            expect(localStorageMock.setItem).toHaveBeenCalled()
        })

        it('should return a valid ISO timestamp', () => {
            const event = trackEvent('action', 'test')
            expect(() => new Date(event.timestamp)).not.toThrow()
        })
    })

    describe('trackPageView', () => {
        it('should track pageview event type', () => {
            const event = trackPageView('Dashboard')
            expect(event.type).toBe('pageview')
            expect(event.name).toBe('Dashboard')
        })

        it('should include URL and referrer properties', () => {
            const event = trackPageView('Dashboard')
            expect(event.properties).toHaveProperty('url')
            expect(event.properties).toHaveProperty('referrer')
        })

        it('should merge custom properties', () => {
            const event = trackPageView('Dashboard', { custom: true })
            expect(event.properties).toHaveProperty('custom', true)
        })
    })

    describe('trackAction', () => {
        it('should track action event type', () => {
            const event = trackAction('emergency-triggered')
            expect(event.type).toBe('action')
            expect(event.name).toBe('emergency-triggered')
        })
    })

    describe('trackClick', () => {
        it('should track click event type', () => {
            const event = trackClick('submit-button')
            expect(event.type).toBe('click')
            expect(event.name).toBe('submit-button')
        })
    })

    describe('trackError', () => {
        it('should track error event type', () => {
            const error = new Error('Test error')
            const event = trackError('api-failure', error)

            expect(event.type).toBe('error')
            expect(event.name).toBe('api-failure')
            expect(event.properties).toHaveProperty('message', 'Test error')
            expect(event.properties).toHaveProperty('stack')
        })

        it('should handle undefined error gracefully', () => {
            const event = trackError('unknown-error')
            expect(event.type).toBe('error')
            expect(event.properties).toHaveProperty('message', undefined)
        })
    })

    describe('trackPerformance', () => {
        it('should track performance metrics', () => {
            const event = trackPerformance('page-load', {
                loadTime: 1200,
                renderTime: 300,
            })

            expect(event.type).toBe('performance')
            expect(event.properties).toHaveProperty('loadTime', 1200)
            expect(event.properties).toHaveProperty('renderTime', 300)
        })
    })

    describe('getAnalyticsSummary', () => {
        it('should return summary with correct counts', () => {
            trackPageView('Dashboard')
            trackAction('toggle')
            trackClick('button')
            trackError('err')

            const summary = getAnalyticsSummary()
            expect(summary.totalEvents).toBe(4)
            expect(summary.pageViews).toBe(1)
            expect(summary.actions).toBe(1)
            expect(summary.errors).toBe(1)
        })

        it('should return empty summary when no events', () => {
            const summary = getAnalyticsSummary()
            expect(summary.totalEvents).toBe(0)
            expect(summary.pageViews).toBe(0)
        })
    })

    describe('clearAnalytics', () => {
        it('should clear analytics from localStorage', () => {
            trackEvent('action', 'test')
            clearAnalytics()
            expect(localStorageMock.removeItem).toHaveBeenCalledWith('nctirs_analytics')
        })
    })

    describe('exportAnalytics', () => {
        it('should return valid JSON string', () => {
            trackEvent('action', 'test')
            const exported = exportAnalytics()
            expect(() => JSON.parse(exported)).not.toThrow()
        })

        it('should include tracked events', () => {
            trackAction('my-action')
            const exported = JSON.parse(exportAnalytics())
            expect(exported.length).toBeGreaterThan(0)
            expect(exported[exported.length - 1].name).toBe('my-action')
        })
    })
})
