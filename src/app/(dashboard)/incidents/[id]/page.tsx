import { prisma } from "@/lib/db"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { UpdateStatus } from "@/components/incidents/update-status"

export default async function IncidentPage({ params }: { params: { id: string } }) {
    // Next.js 15+ params are async, need to await. But this is Next 14/15 based on scaffolding? 
    // Recent Next.js versions require awaiting params.
    const { id } = await params

    const incident = await prisma.incident.findUnique({
        where: { id },
        include: { reporter: true }
    })

    if (!incident) {
        return notFound()
    }

    return (
        <div className="container mx-auto py-10 space-y-6">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-3xl font-bold">{incident.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mt-2">
                        <span>Incident ID: {incident.id}</span>
                        <span>•</span>
                        <span>{incident.createdAt.toLocaleDateString()}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <UpdateStatus id={incident.id} currentStatus={incident.status} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="whitespace-pre-wrap">{incident.description}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground italic">No activity recorded yet.</p>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="font-semibold block">Priority</span>
                                <Badge variant={
                                    incident.priority === 'CRITICAL' ? 'destructive' :
                                        incident.priority === 'HIGH' ? 'destructive' :
                                            incident.priority === 'MEDIUM' ? 'default' : 'secondary'
                                }>{incident.priority}</Badge>
                            </div>
                            <Separator />
                            <div>
                                <span className="font-semibold block">Location</span>
                                <span>{incident.location || "Unknown"}</span>
                            </div>
                            <Separator />
                            <div>
                                <span className="font-semibold block">Reporter</span>
                                <span>{incident.reporter?.name || 'Unknown User'}</span>
                                <span className="block text-xs text-muted-foreground">{incident.reporter?.email || 'No email provided'}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
