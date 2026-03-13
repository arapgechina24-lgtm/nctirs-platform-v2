"use client"

import dynamic from "next/dynamic"

export const IncidentMap = dynamic(
    () => import("./incident-map-client"),
    {
        ssr: false,
        loading: () => <p>Loading Map...</p>
    }
)
