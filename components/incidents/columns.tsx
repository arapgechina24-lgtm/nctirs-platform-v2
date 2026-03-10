"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// This type is used to define the shape of our data.
// You can use a Zod schema here if you want.
export type Incident = {
    id: string
    title: string
    status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED"
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    location: string | null
    createdAt: string
}

export const columns: ColumnDef<Incident>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
        enableHiding: false,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            let variant: "default" | "secondary" | "destructive" | "outline" = "default"

            if (status === "OPEN") variant = "destructive"
            if (status === "IN_PROGRESS") variant = "default"
            if (status === "RESOLVED") variant = "secondary"
            if (status === "CLOSED") variant = "outline"

            return <Badge variant={variant}>{status}</Badge>
        },
    },
    {
        accessorKey: "priority",
        header: ({ column }) => {
            return (
                <Button
                    variant="ghost"
                    onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                >
                    Priority
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
            )
        },
        cell: ({ row }) => {
            const priority = row.getValue("priority") as string
            let color = "text-gray-500"
            if (priority === "CRITICAL") color = "text-red-700 font-bold"
            if (priority === "HIGH") color = "text-red-500"
            if (priority === "MEDIUM") color = "text-yellow-500"

            return <div className={color}>{priority}</div>
        }
    },
    {
        accessorKey: "title",
        header: "Title",
    },
    {
        accessorKey: "location",
        header: "Location",
    },
    {
        accessorKey: "createdAt",
        header: "Reported At",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const incident = row.original

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                            onClick={() => navigator.clipboard.writeText(incident.id)}
                        >
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View details</DropdownMenuItem>
                        <DropdownMenuItem>Update status</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
