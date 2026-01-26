// Keyboard Accessibility utilities for WCAG compliance
'use client'

import { useEffect, useCallback } from 'react'

// Keyboard shortcut definitions
export const KEYBOARD_SHORTCUTS = {
    // Navigation
    'g+c': { description: 'Go to Command Center', action: 'navigate:COMMAND_CENTER' },
    'g+f': { description: 'Go to Fusion Center', action: 'navigate:FUSION_CENTER' },
    'g+t': { description: 'Go to Threat Matrix', action: 'navigate:THREAT_MATRIX' },
    'g+a': { description: 'Go to Analytics', action: 'navigate:ANALYTICS' },
    'g+o': { description: 'Go to Operations (4 Pillars)', action: 'navigate:OPERATIONS' },

    // Actions
    'Escape': { description: 'Close modal/overlay', action: 'close' },
    '?': { description: 'Show keyboard shortcuts', action: 'help' },
    'n': { description: 'New incident report', action: 'new:incident' },
    'r': { description: 'Refresh data', action: 'refresh' },
    '/': { description: 'Focus search', action: 'search' },

    // Emergency (with modifier)
    'Control+Shift+KeyE': { description: 'Trigger emergency simulation', action: 'emergency' },
    'Control+Shift+KeyA': { description: 'Open audit trail', action: 'audit' },
} as const

type ShortcutAction = typeof KEYBOARD_SHORTCUTS[keyof typeof KEYBOARD_SHORTCUTS]['action']

// Hook for handling keyboard shortcuts
export function useKeyboardShortcuts(
    onAction: (action: ShortcutAction) => void,
    enabled: boolean = true
) {
    const handleKeyDown = useCallback((event: KeyboardEvent) => {
        if (!enabled) return

        // Skip if user is typing in an input
        const target = event.target as HTMLElement
        if (
            target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable
        ) {
            return
        }

        // Build key string
        let key = ''
        if (event.ctrlKey || event.metaKey) key += 'Control+'
        if (event.shiftKey) key += 'Shift+'
        if (event.altKey) key += 'Alt+'
        key += event.code || event.key

        // Check if this matches any shortcut
        const shortcut = KEYBOARD_SHORTCUTS[key as keyof typeof KEYBOARD_SHORTCUTS]
        if (shortcut) {
            event.preventDefault()
            onAction(shortcut.action as ShortcutAction)
        }
    }, [enabled, onAction])

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [handleKeyDown])
}

// Focus trap for modals (WCAG requirement)
export function useFocusTrap(containerRef: React.RefObject<HTMLElement>) {
    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        const focusableElements = container.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        const firstElement = focusableElements[0]
        const lastElement = focusableElements[focusableElements.length - 1]

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Tab') return

            if (event.shiftKey) {
                if (document.activeElement === firstElement) {
                    event.preventDefault()
                    lastElement?.focus()
                }
            } else {
                if (document.activeElement === lastElement) {
                    event.preventDefault()
                    firstElement?.focus()
                }
            }
        }

        container.addEventListener('keydown', handleKeyDown)
        firstElement?.focus()

        return () => container.removeEventListener('keydown', handleKeyDown)
    }, [containerRef])
}

// Skip link component for keyboard navigation
export function SkipLink({ href, children }: { href: string; children: React.ReactNode }) {
    return (
        <a
            href={href}
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded"
        >
            {children}
        </a>
    )
}

// Live region for screen reader announcements
export function useLiveRegion() {
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
        const region = document.getElementById('live-region')
        if (region) {
            region.setAttribute('aria-live', priority)
            region.textContent = message

            // Clear after announcement
            setTimeout(() => {
                region.textContent = ''
            }, 1000)
        }
    }, [])

    return { announce }
}

// Component for accessible live announcements
export function LiveRegion() {
    return (
        <div
            id="live-region"
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
        />
    )
}

// ARIA helper for dynamic content
export const ariaLabels = {
    incidentList: 'List of security incidents, sorted by severity',
    threatMap: 'Interactive map showing threat locations across Kenya',
    surveillance: 'Surveillance camera feeds status monitor',
    charts: {
        threats: 'Bar chart showing regional threat analysis',
        trends: 'Line chart showing 30-day incident trends',
    },
    navigation: {
        main: 'Main dashboard navigation',
        views: 'Dashboard view selector',
    },
    status: {
        critical: 'Critical: Immediate attention required',
        high: 'High priority alert',
        medium: 'Medium priority',
        low: 'Low priority, for information',
    },
}
