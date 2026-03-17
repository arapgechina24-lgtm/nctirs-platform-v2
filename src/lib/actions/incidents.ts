"use server"

import { prisma } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"

const incidentSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1, "Description is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    location: z.string().optional(),
})

export type CreateIncidentState = {
    errors?: {
        title?: string[]
        description?: string[]
        priority?: string[]
        location?: string[]
    }
    message?: string
}

export async function createIncident(prevState: CreateIncidentState, formData: FormData) {
    const validatedFields = incidentSchema.safeParse({
        title: formData.get("title"),
        description: formData.get("description"),
        priority: formData.get("priority"),
        location: formData.get("location"),
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: "Missing Fields. Failed to Create Incident.",
        }
    }

    const { title, description, priority, location } = validatedFields.data

    try {
        // Ideally get the user from the session, for now we mock a reporter
        // You'd use auth() here to get the session.user.id

        // Check if a default user exists, if not create one for dev purposes
        let reporter = await prisma.user.findFirst()
        if (!reporter) {
            reporter = await prisma.user.create({
                data: {
                    email: "officer@example.com",
                    name: "Officer Test",
                }
            })
        }

        await prisma.incident.create({
            data: {
                title,
                description,
                priority,
                location,
                status: "OPEN",
                reportedBy: reporter.id,
            },
        })
    } catch (error) {
        console.error("Database Error:", error)
        return {
            message: "Database Error: Failed to Create Incident.",
        }
    }

    revalidatePath("/incidents")
    redirect("/incidents")
}

export async function updateIncidentStatus(id: string, status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED") {
    try {
        await prisma.incident.update({
            where: { id },
            data: { status }
        })
    } catch (error) {
        console.error("Failed to update status:", error)
        throw new Error("Failed to update status")
    }
    revalidatePath(`/incidents/${id}`)
    revalidatePath("/incidents")
}

export async function submitCitizenReport(formData: FormData) {
    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const locationData = formData.get("location") as string // JSON string

    let latitude: number | undefined
    let longitude: number | undefined

    if (locationData) {
        try {
            const parsed = JSON.parse(locationData)
            latitude = parsed.lat
            longitude = parsed.lng
        } catch (e) {
            console.error("Failed to parse location data", e)
        }
    }

    const payload = {
        title,
        description,
        type: "CITIZEN_REPORT",
        severity: "MEDIUM", // Default for citizen reports
        latitude,
        longitude,
        location: latitude && longitude ? `Lat: ${latitude.toFixed(4)}, Lng: ${longitude.toFixed(4)}` : "Unknown",
        reportedBy: "CITIZEN_PORTAL"
    }

    const NCTIRS_API_URL = process.env.NCTIRS_API_URL
    const NCTIRS_SYNC_TOKEN = process.env.NCTIRS_SYNC_TOKEN

    if (!NCTIRS_API_URL || !NCTIRS_SYNC_TOKEN) {
        console.error("Sync configuration missing")
        return { success: false, message: "Server configuration error" }
    }

    try {
        const response = await fetch(NCTIRS_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-Sync-Token": NCTIRS_SYNC_TOKEN
            },
            body: JSON.stringify(payload)
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error("NCTIRS Sync Error:", errorText)
            return { success: false, message: "Failed to sync with NCTIRS" }
        }

        return { success: true, message: "Report submitted successfully" }
    } catch (error) {
        console.error("Sync Connection Error:", error)
        return { success: false, message: "Failed to reach NCTIRS" }
    }
}
