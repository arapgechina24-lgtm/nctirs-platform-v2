'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { ChartSkeleton, MapSkeleton, PanelSkeleton } from '../ui/Skeleton'

// Lazy load heavy chart components with loading skeletons
export const LazyThreatAnalyticsChart = dynamic(
    () => import('../threat/ThreatAnalyticsChart').then(mod => ({ default: mod.ThreatAnalyticsChart })),
    {
        loading: () => <ChartSkeleton height={280} />,
        ssr: false,
    }
)

export const LazyIncidentTrendsChart = dynamic(
    () => import('../incident/IncidentTrendsChart').then(mod => ({ default: mod.IncidentTrendsChart })),
    {
        loading: () => <ChartSkeleton height={280} />,
        ssr: false,
    }
)

// Lazy load map components (heavy due to Leaflet)
export const LazyThreatMap = dynamic(
    () => import('../threat/ThreatMap').then(mod => ({ default: mod.ThreatMap })),
    {
        loading: () => <MapSkeleton height={300} />,
        ssr: false, // Leaflet doesn't work on server
    }
)

export const LazyCNIHeatmap = dynamic(
    () => import('../infrastructure/CNIHeatmap'),
    {
        loading: () => <MapSkeleton height={400} />,
        ssr: false,
    }
)

// Lazy load complex panels
export const LazySystemArchitecture = dynamic(
    () => import('../infrastructure/SystemArchitecture').then(mod => ({ default: mod.SystemArchitecture })),
    {
        loading: () => <PanelSkeleton rows={6} />,
        ssr: false,
    }
)

export const LazyThreatAnalyticsEngine = dynamic(
    () => import('../threat/ThreatAnalyticsEngine').then(mod => ({ default: mod.ThreatAnalyticsEngine })),
    {
        loading: () => <PanelSkeleton rows={5} />,
        ssr: false,
    }
)

export const LazyAutomatedResponsePanel = dynamic(
    () => import('../incident/AutomatedResponsePanel').then(mod => ({ default: mod.AutomatedResponsePanel })),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

// Lazy load 4 Pillars components
export const LazyAdversarialDefensePanel = dynamic(
    () => import('../threat/AdversarialDefensePanel'),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

export const LazyFederatedLearningHub = dynamic(
    () => import('../intelligence/FederatedLearningHub'),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

export const LazyXAIPanel = dynamic(
    () => import('../intelligence/XAIPanel').then(mod => ({ default: mod.XAIPanel })),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

export const LazySovereignAIStatusPanel = dynamic(
    () => import('../intelligence/SovereignAIStatusPanel'),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

// Wrapper component for lazy loaded content with Suspense
export function LazyWrapper({
    children,
    fallback
}: {
    children: React.ReactNode
    fallback?: React.ReactNode
}) {
    return (
        <Suspense fallback={fallback || <PanelSkeleton />}>
            {children}
        </Suspense>
    )
}
