import { getIntelligenceItems } from "@/lib/actions/intelligence"
import { columns } from "@/components/intelligence/columns"
import { IntelligenceTable } from "@/components/intelligence/intelligence-table"

export const dynamic = 'force-dynamic'

export default async function IntelligencePage() {
    const data = await getIntelligenceItems()

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold">Intelligence Repository</h1>
                    <p className="text-muted-foreground">Secure access to classified intelligence reports.</p>
                </div>
            </div>
            <IntelligenceTable columns={columns} data={data} />
        </div>
    )
}
