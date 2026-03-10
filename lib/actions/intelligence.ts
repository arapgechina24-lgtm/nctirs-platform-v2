"use server"

import { prisma } from "@/lib/db"

export type IntelligenceItem = {
    id: string
    title: string
    source: string
    classification: "UNCLASSIFIED" | "CONFIDENTIAL" | "SECRET" | "TOP_SECRET"
    authorName: string
    createdAt: string
}

export async function getIntelligenceItems(): Promise<IntelligenceItem[]> {
    const items = await prisma.intelligence.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        include: {
            author: true
        },
        take: 100
    })

    return items.map(item => ({
        id: item.id,
        title: item.title,
        source: item.source,
        classification: item.classification,
        authorName: item.author.name || "Unknown",
        createdAt: item.createdAt.toLocaleDateString()
    }))
}

export async function getIntelligenceItem(id: string) {
    const item = await prisma.intelligence.findUnique({
        where: { id },
        include: {
            author: true
        }
    })

    return item
}
