"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, ArrowUpDown, Lock } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { IntelligenceItem } from "@/lib/actions/intelligence"

export const columns: ColumnDef<IntelligenceItem>[] = [
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
        accessorKey: "classification",
        header: "Classification",
        cell: ({ row }) => {
            const classification = row.getValue("classification") as string
            let variant: "default" | "secondary" | "destructive" | "outline" = "outline"

            if (classification === "TOP_SECRET") variant = "destructive"
            if (classification === "SECRET") variant = "default"
            if (classification === "CONFIDENTIAL") variant = "secondary"

            return (
                <div className="flex items-center gap-2">
                    {classification === "TOP_SECRET" && <Lock className="w-3 h-3 text-red-500" />}
                    <Badge variant={variant}>{classification}</Badge>
                </div>
            )
        },
    },
    {
        accessorKey: "title",
        header: "Subject",
        cell: ({ row }) => <span className="font-medium">{row.getValue("title")}</span>
    },
    {
        accessorKey: "source",
        header: "Source",
    },
    {
        accessorKey: "authorName",
        header: "Author",
    },
    {
        accessorKey: "createdAt",
        header: "Date",
    },
    {
        id: "actions",
        cell: ({ row }) => {
            const item = row.original

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
                            onClick={() => navigator.clipboard.writeText(item.id)}
                        >
                            Copy ID
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <a href={`/intelligence/${item.id}`}>View Report</a>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            )
        },
    },
]
