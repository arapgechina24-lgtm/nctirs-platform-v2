import { getIntelligenceItem } from "@/lib/actions/intelligence"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Lock, FileText, User, Calendar } from "lucide-react"

export default async function IntelligenceDetailPage({ params }: { params: { id: string } }) {
    const { id } = await params
    const item = await getIntelligenceItem(id)

    if (!item) {
        return notFound()
    }

    const classificationColor =
        item.classification === "TOP_SECRET" ? "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800" :
            item.classification === "SECRET" ? "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800" :
                "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800"

    return (
        <div className="container mx-auto py-10 space-y-6">
            {/* Classification Banner */}
            <div className={`w-full p-4 text-center font-bold border rounded-md flex items-center justify-center gap-2 ${classificationColor}`}>
                <Lock className="w-4 h-4" />
                {item.classification}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-muted-foreground" />
                                {item.title}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="prose dark:prose-invert max-w-none">
                                <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Metadata</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <span className="font-semibold block text-sm text-muted-foreground mb-1">Source</span>
                                <span className="font-medium">{item.source}</span>
                            </div>
                            <Separator />
                            <div>
                                <span className="font-semibold block text-sm text-muted-foreground mb-1">Author</span>
                                <div className="flex items-center gap-2">
                                    <User className="w-4 h-4 text-muted-foreground" />
                                    <span>{item.author.name}</span>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <span className="font-semibold block text-sm text-muted-foreground mb-1">Date Created</span>
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>{item.createdAt.toLocaleDateString()}</span>
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <span className="font-semibold block text-sm text-muted-foreground mb-1">Reference ID</span>
                                <code className="bg-muted px-2 py-1 rounded text-xs">{item.id}</code>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
