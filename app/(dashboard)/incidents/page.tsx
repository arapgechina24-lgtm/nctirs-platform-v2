import { prisma } from "@/lib/db"
import { Incident, columns } from "@/components/incidents/columns"
import { DataTable } from "@/components/incidents/data-table"

export const dynamic = 'force-dynamic'

async function getData(): Promise<Incident[]> {
    // Fetch from database
    // Note: We need to cast or transform dates to strings for now as Client Components don't like Date objects passed directly
    const incidents = await prisma.incident.findMany({
        orderBy: {
            createdAt: 'desc'
        },
        take: 100
    })

    return incidents.map(incident => ({
        id: incident.id,
        title: incident.title,
        status: incident.status,
        priority: incident.priority,
        location: incident.location,
        createdAt: incident.createdAt.toLocaleDateString() + ' ' + incident.createdAt.toLocaleTimeString()
    }))
}

export default async function IncidentsPage() {
    const data = await getData()

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Incident Management</h1>
            </div>
            <DataTable columns={columns} data={data} />
        </div>
    )
}
