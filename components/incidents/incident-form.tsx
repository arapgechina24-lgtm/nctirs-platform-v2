"use client"

import { useActionState } from "react"
import { createIncident, CreateIncidentState } from "@/lib/actions/incidents"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function IncidentForm() {
    const initialState: CreateIncidentState = { message: "", errors: {} }
    const [state, formAction] = useActionState(createIncident, initialState)

    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle>Report New Incident</CardTitle>
                <CardDescription>
                    Fill in the details below to log a new security incident.
                </CardDescription>
            </CardHeader>
            <form action={formAction}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Incident Title</Label>
                        <Input id="title" name="title" placeholder="e.g. Suspicious Activity at Sector 7" required />
                        {state.errors?.title && (
                            <p className="text-sm text-red-500">{state.errors.title}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority Level</Label>
                            <Select name="priority" defaultValue="MEDIUM" required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="LOW">Low</SelectItem>
                                    <SelectItem value="MEDIUM">Medium</SelectItem>
                                    <SelectItem value="HIGH">High</SelectItem>
                                    <SelectItem value="CRITICAL">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input id="location" name="location" placeholder="e.g. 123 Main St" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            placeholder="Describe the incident in detail..."
                            className="min-h-[100px]"
                            required
                        />
                        {state.errors?.description && (
                            <p className="text-sm text-red-500">{state.errors.description}</p>
                        )}
                    </div>

                    {state.message && (
                        <p className="text-sm text-red-500">{state.message}</p>
                    )}
                </CardContent>
                <CardFooter>
                    <Button type="submit" className="w-full">Submit Report</Button>
                </CardFooter>
            </form>
        </Card>
    )
}
