'use client'

import dynamic from 'next/dynamic'
import { Suspense } from 'react'
import { ChartSkeleton, MapSkeleton, PanelSkeleton } from './ui/Skeleton'

// Lazy load heavy chart components with loading skeletons
export const LazyThreatAnalyticsChart = dynamic(
    () => import('./ThreatAnalyticsChart').then(mod => ({ default: mod.ThreatAnalyticsChart })),
    {
        loading: () => <ChartSkeleton height={280} />,
        ssr: false,
    }
)

export const LazyIncidentTrendsChart = dynamic(
    () => import('./IncidentTrendsChart').then(mod => ({ default: mod.IncidentTrendsChart })),
    {
        loading: () => <ChartSkeleton height={280} />,
        ssr: false,
    }
)

// Lazy load map components (heavy due to Leaflet)
export const LazyThreatMap = dynamic(
    () => import('./ThreatMap').then(mod => ({ default: mod.ThreatMap })),
    {
        loading: () => <MapSkeleton height={300} />,
        ssr: false, // Leaflet doesn't work on server
    }
)

export const LazyCNIHeatmap = dynamic(
    () => import('./CNIHeatmap'),
    {
        loading: () => <MapSkeleton height={400} />,
        ssr: false,
    }
)

// Lazy load complex panels
export const LazySystemArchitecture = dynamic(
    () => import('./SystemArchitecture').then(mod => ({ default: mod.SystemArchitecture })),
    {
        loading: () => <PanelSkeleton rows={6} />,
        ssr: false,
    }
)

export const LazyThreatAnalyticsEngine = dynamic(
    () => import('./ThreatAnalyticsEngine').then(mod => ({ default: mod.ThreatAnalyticsEngine })),
    {
        loading: () => <PanelSkeleton rows={5} />,
        ssr: false,
    }
)

export const LazyAutomatedResponsePanel = dynamic(
    () => import('./AutomatedResponsePanel').then(mod => ({ default: mod.AutomatedResponsePanel })),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

// Lazy load 4 Pillars components
export const LazyAdversarialDefensePanel = dynamic(
    () => import('./AdversarialDefensePanel'),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

export const LazyFederatedLearningHub = dynamic(
    () => import('./FederatedLearningHub'),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

export const LazyExplainableAIPanel = dynamic(
    () => import('./ExplainableAIPanel'),
    {
        loading: () => <PanelSkeleton rows={4} />,
        ssr: false,
    }
)

export const LazySovereignAIStatusPanel = dynamic(
    () => import('./SovereignAIStatusPanel'),
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
