"use client"

import { useTransition } from "react"
import { updateIncidentStatus } from "@/lib/actions/incidents"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
// import { toast } from "sonner" 

export function UpdateStatus({ id, currentStatus }: { id: string, currentStatus: string }) {
    const [isPending, startTransition] = useTransition()

    const handleValueChange = (value: string) => {
        startTransition(async () => {
            try {
                const validStatus = value as "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
                await updateIncidentStatus(id, validStatus)
            } catch (error) {
                console.error(error)
            }
        })
    }

    return (
        <Select defaultValue={currentStatus} onValueChange={handleValueChange} disabled={isPending}>
            <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
        </Select>
    )
}
