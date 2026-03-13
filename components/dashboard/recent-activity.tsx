import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
// import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ActivityItem {
    id: string
    title: string
    description: string
    createdAt: Date
    user?: {
        name: string | null
        email: string | null
        image: string | null
    } | null
}

interface RecentActivityProps {
    activities: ActivityItem[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
    return (
        <Card className="col-span-4 h-full">
            <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                    Real-time feed of system events and alerts.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full pr-4 overflow-y-auto">
                    <div className="space-y-8">
                        {activities.map((activity) => (
                            <div key={activity.id} className="flex items-center">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={activity.user?.image || "/avatars/01.png"} alt="Avatar" />
                                    <AvatarFallback>{activity.user?.name?.[0] || "U"}</AvatarFallback>
                                </Avatar>
                                <div className="ml-4 space-y-1">
                                    <p className="text-sm font-medium leading-none">{activity.title}</p>
                                    <p className="text-sm text-muted-foreground w-64 truncate">
                                        {activity.description}
                                    </p>
                                </div>
                                <div className="ml-auto font-medium text-xs text-muted-foreground">
                                    {new Date(activity.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
