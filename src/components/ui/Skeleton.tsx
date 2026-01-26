'use client'

import React from 'react'

// Base skeleton component with shimmer animation
export function Skeleton({
    className = '',
    width,
    height,
}: {
    className?: string
    width?: string | number
    height?: string | number
}) {
    return (
        <div
            className={`animate-pulse bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 bg-[length:200%_100%] rounded ${className}`}
            style={{ width, height }}
        />
    )
}

// Skeleton for stat cards
export function CardSkeleton() {
    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-3 w-32" />
        </div>
    )
}

// Skeleton for charts
export function ChartSkeleton({ height = 300 }: { height?: number }) {
    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex items-end justify-around gap-2" style={{ height }}>
                {[...Array(8)].map((_, i) => (
                    <Skeleton
                        key={i}
                        className="flex-1 max-w-12"
                        height={`${((i * 13) % 60) + 20}%`}
                    />
                ))}
            </div>
            <div className="flex justify-between mt-4">
                {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-3 w-12" />
                ))}
            </div>
        </div>
    )
}

// Skeleton for list items
export function ListItemSkeleton() {
    return (
        <div className="flex items-center gap-3 p-3 border-b border-gray-800">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-6 w-16 rounded" />
        </div>
    )
}

// Skeleton for a full list
export function ListSkeleton({ items = 5 }: { items?: number }) {
    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
            <div className="p-3 border-b border-gray-800">
                <Skeleton className="h-5 w-32" />
            </div>
            {[...Array(items)].map((_, i) => (
                <ListItemSkeleton key={i} />
            ))}
        </div>
    )
}

// Skeleton for the map component
export function MapSkeleton({ height = 200 }: { height?: number }) {
    return (
        <div
            className="bg-gray-900/50 border border-gray-800 rounded-lg flex items-center justify-center"
            style={{ height }}
        >
            <div className="text-center space-y-3">
                <Skeleton className="h-12 w-12 rounded-full mx-auto" />
                <Skeleton className="h-4 w-32 mx-auto" />
                <div className="flex gap-2 justify-center">
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                    <Skeleton className="h-2 w-2 rounded-full" />
                </div>
            </div>
        </div>
    )
}

// Skeleton for panel/section
export function PanelSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-5 rounded" />
            </div>
            {[...Array(rows)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-2/3" />
                    </div>
                </div>
            ))}
        </div>
    )
}

// Dashboard loading skeleton
export function DashboardSkeleton() {
    return (
        <div className="p-4 space-y-4">
            {/* Stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[...Array(6)].map((_, i) => (
                    <CardSkeleton key={i} />
                ))}
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                    <MapSkeleton height={300} />
                    <ChartSkeleton height={200} />
                </div>
                <div className="space-y-4">
                    <ListSkeleton items={5} />
                    <PanelSkeleton rows={3} />
                </div>
            </div>
        </div>
    )
}
