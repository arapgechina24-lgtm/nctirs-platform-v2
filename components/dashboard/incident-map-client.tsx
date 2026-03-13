"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet-defaulticon-compatibility"
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css"
import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Clock, MapPin, User, AlertTriangle } from "lucide-react"

interface Incident {
    id: string
    title: string
    description: string
    status: string
    priority: string
    location: {
        lat: number
        lng: number
    }
    reporter?: {
        name: string | null
        email: string | null
        image: string | null
    }
    createdAt?: Date | string
}

interface IncidentMapProps {
    incidents: Incident[]
}

const NAIROBI_CENTER: [number, number] = [-1.2921, 36.8219]

export default function IncidentMapClient({ incidents }: IncidentMapProps) {
    const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

    return (
        <>
            <MapContainer
                center={NAIROBI_CENTER}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: "400px", width: "100%", borderRadius: "0.5rem" }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {incidents.map((incident) => (
                    <Marker
                        key={incident.id}
                        position={[incident.location.lat, incident.location.lng]}
                        eventHandlers={{
                            click: () => {
                                setSelectedIncident(incident)
                            },
                        }}
                    >
                        {/* Optional: Keep Popup for quick hover/click info if needed, but Sheet is main detail view */}
                    </Marker>
                ))}
            </MapContainer>

            <Sheet open={!!selectedIncident} onOpenChange={(open) => !open && setSelectedIncident(null)}>
                <SheetContent className="overflow-y-auto">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            {selectedIncident?.title}
                            {selectedIncident?.priority === 'HIGH' || selectedIncident?.priority === 'CRITICAL' ? (
                                <Badge variant="destructive" className="ml-2">{selectedIncident?.priority}</Badge>
                            ) : (
                                <Badge variant="secondary" className="ml-2">{selectedIncident?.priority}</Badge>
                            )}
                        </SheetTitle>
                        <SheetDescription>
                            Incident ID: {selectedIncident?.id}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedIncident && (
                        <div className="mt-6 space-y-6">
                            {/* Status Section */}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-muted-foreground">Status</span>
                                <Badge variant="outline" className="uppercase">{selectedIncident.status}</Badge>
                            </div>

                            <Separator />

                            {/* Description */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <AlertTriangle className="h-4 w-4" /> Description
                                </h4>
                                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                                    {selectedIncident.description}
                                </p>
                            </div>

                            {/* Location & Time */}
                            <div className="grid grid-cols-1 gap-4">
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <MapPin className="h-4 w-4" /> Location Coords
                                    </h4>
                                    <p className="text-xs font-mono text-muted-foreground">
                                        Lat: {selectedIncident.location.lat.toFixed(6)}, Lng: {selectedIncident.location.lng.toFixed(6)}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4" /> Reported At
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                        {selectedIncident.createdAt ? new Date(selectedIncident.createdAt).toLocaleString() : 'Unknown'}
                                    </p>
                                </div>
                            </div>

                            <Separator />

                            {/* Reporter Info */}
                            <div className="space-y-3">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <User className="h-4 w-4" /> Reported By
                                </h4>
                                <div className="flex items-center gap-3">
                                    <Avatar>
                                        <AvatarImage src={selectedIncident.reporter?.image || ""} />
                                        <AvatarFallback>{selectedIncident.reporter?.name?.charAt(0) || "U"}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-medium">{selectedIncident.reporter?.name || "Anonymous"}</p>
                                        <p className="text-xs text-muted-foreground">{selectedIncident.reporter?.email || "No contact info"}</p>
                                    </div>
                                </div>
                            </div>

                            <SheetFooter className="mt-8">
                                <Button className="w-full" onClick={() => setSelectedIncident(null)}>Close Details</Button>
                            </SheetFooter>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </>
    )
}
