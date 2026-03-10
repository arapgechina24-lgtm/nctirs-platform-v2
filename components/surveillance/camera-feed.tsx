"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Signal, Video, VideoOff } from "lucide-react"
import Image from "next/image"
import { useState, useEffect } from "react"

interface Detection {
    label: string
    confidence: number
    bbox: number[]
}

interface CameraFeedProps {
    id: string
    name: string
    location: string
    status: "LIVE" | "OFFLINE" | "RECORDING"
    imageUrl?: string
    videoUrl?: string
}

export function CameraFeed({ id, name, location, status, imageUrl, videoUrl }: CameraFeedProps) {
    const [detections, setDetections] = useState<Detection[]>([])
    const [analyzing, setAnalyzing] = useState(false)

    useEffect(() => {
        if (status !== "LIVE") return

        const interval = setInterval(async () => {
            setAnalyzing(true)
            // Simulation of AI processing delay
            await new Promise(r => setTimeout(r, 1000))
            setAnalyzing(false)

            // Random mock detections
            if (Math.random() > 0.7) {
                setDetections([{
                    label: "Person",
                    confidence: 0.85 + Math.random() * 0.1,
                    bbox: [50, 50, 100, 200] // Mock bbox
                }])
                setTimeout(() => setDetections([]), 2000)
            }
        }, 5000) // Poll every 5 seconds

        return () => clearInterval(interval)
    }, [id, status])

    return (
        <Card className="overflow-hidden">
            <div className="relative aspect-video bg-muted flex items-center justify-center bg-black">
                {status === "OFFLINE" ? (
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <VideoOff className="h-10 w-10" />
                        <span className="text-sm">Camera Feed Unavailable</span>
                    </div>
                ) : videoUrl ? (
                    <video
                        src={videoUrl}
                        autoPlay
                        muted
                        loop
                        playsInline
                        className="object-cover w-full h-full"
                    />
                ) : imageUrl ? (
                    <Image src={imageUrl} alt={name} fill className="object-cover opacity-80" unoptimized />
                ) : (
                    <div className="text-muted-foreground flex flex-col items-center gap-2">
                        <Video className="h-10 w-10" />
                        <span className="text-sm">No Signal</span>
                    </div>
                )}

                {/* Detection Overlays - Simplified for video demo */}
                {detections.map((det, idx) => (
                    <div
                        key={idx}
                        className="absolute border-2 border-red-500 bg-red-500/20 z-10 flex items-start justify-center animate-pulse"
                        style={{
                            left: `20%`,
                            top: `20%`,
                            width: `15%`,
                            height: `40%`
                        }}
                    >
                        <span className="bg-red-600 text-white text-[10px] px-1 font-bold uppercase">{det.label} {Math.round(det.confidence * 100)}%</span>
                    </div>
                ))}

                <div className="absolute top-2 left-2 flex gap-2 z-20">
                    <Badge variant={status === "LIVE" ? "destructive" : status === "RECORDING" ? "default" : "secondary"} className="uppercase text-[10px]">
                        {status === "LIVE" && <Signal className="w-3 h-3 mr-1 animate-pulse" />}
                        {status}
                    </Badge>
                    {analyzing && <Badge variant="outline" className="bg-background/50 text-[10px] backdrop-blur-md border-primary/50 text-primary-foreground">AI ANALYZING</Badge>}
                </div>
                <div className="absolute top-2 right-2 text-white text-[10px] font-mono bg-black/50 px-1 rounded">
                    {new Date().toLocaleTimeString()}
                </div>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white px-2 py-1 rounded text-xs backdrop-blur-sm z-20">
                    {location}
                </div>
            </div>
            <CardHeader className="p-3">
                <CardTitle className="text-sm font-medium flex justify-between items-center">
                    <span>{name}</span>
                    <span className="text-xs text-muted-foreground font-normal">{id}</span>
                </CardTitle>
            </CardHeader>
        </Card>
    )
}
