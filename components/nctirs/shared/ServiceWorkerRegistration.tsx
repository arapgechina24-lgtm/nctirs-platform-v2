'use client'

import { useEffect } from 'react'

// Service Worker registration component
export function ServiceWorkerRegistration() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            // Register service worker on page load
            window.addEventListener('load', () => {
                navigator.serviceWorker
                    .register('/sw.js')
                    .then((registration) => {
                        console.log('[SW] Service Worker registered:', registration.scope)

                        // Check for updates
                        registration.addEventListener('updatefound', () => {
                            const newWorker = registration.installing
                            if (newWorker) {
                                newWorker.addEventListener('statechange', () => {
                                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                        // New content available, notify user
                                        console.log('[SW] New content available, refresh to update')
                                        // Could show a toast notification here
                                    }
                                })
                            }
                        })
                    })
                    .catch((error) => {
                        console.error('[SW] Service Worker registration failed:', error)
                    })
            })

            // Handle controller change (when new SW takes over)
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                console.log('[SW] Controller changed, page will reload')
            })
        }
    }, [])

    // This component doesn't render anything
    return null
}

// Hook for checking online status
export function useOnlineStatus() {
    const getOnlineStatus = () => typeof navigator !== 'undefined' ? navigator.onLine : true

    useEffect(() => {
        const handleOnline = () => {
            console.log('[Network] Online')
        }

        const handleOffline = () => {
            console.log('[Network] Offline')
        }

        window.addEventListener('online', handleOnline)
        window.addEventListener('offline', handleOffline)

        return () => {
            window.removeEventListener('online', handleOnline)
            window.removeEventListener('offline', handleOffline)
        }
    }, [])

    return getOnlineStatus()
}
