"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { submitCitizenReport } from "@/lib/actions/incidents"
import { MapPin, Loader2, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export default function ReportPage() {
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const [reportId, setReportId] = useState("")
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null)
    const [locating, setLocating] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        
        try {
            const result = await submitCitizenReport(formData)
            if (result.success) {
                setReportId((Math.random() * 10000).toFixed(0))
                setSuccess(true)
                toast.success("Report transmitted to NCTIRS")
            } else {
                toast.error(result.message || "Failed to submit report")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setLoading(false)
        }
    }

    function getLocation() {
        setLocating(true)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                })
                setLocating(false)
                toast.success("Location acquired")
            }, () => {
                setLocating(false)
                toast.error("Could not get location")
            })
        }
    }

    if (success) {
        return (
            <Card className="border-green-500/50 bg-green-500/10">
                <CardContent className="pt-6 text-center space-y-4">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">Report Submitted</h2>
                    <p className="text-muted-foreground">Thank you for helping keep our community safe. Your report ID is #{reportId}.</p>
                    <Button onClick={() => setSuccess(false)} variant="outline">Submit Another</Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Report an Incident</CardTitle>
                <CardDescription>Securely report suspicious activity to the National Security Service.</CardDescription>
            </CardHeader>
            <form action={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Subject</Label>
                        <Input id="title" name="title" placeholder="e.g. Suspicious vehicle..." required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" name="description" placeholder="Describe what you saw..." required />
                    </div>

                    <div className="space-y-2">
                        <Label>Location</Label>
                        <div className="flex gap-2">
                            <Button type="button" variant="outline" className="w-full" onClick={getLocation} disabled={locating}>
                                {locating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
                                {location ? `Lat: ${location.lat.toFixed(4)}, Lng: ${location.lng.toFixed(4)}` : "Use My Current Location"}
                            </Button>
                        </div>
                        {location && (
                            <input type="hidden" name="location" value={JSON.stringify(location)} />
                        )}
                    </div>
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Secure Report"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
