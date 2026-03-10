"use client"

import * as React from "react"
import {
    BookOpen,
    Command,
    Frame,
    LifeBuoy,
    Map,
    PieChart,
    Send,
    SquareTerminal,
    ShieldAlert,
    Radio,
    FileText
} from "lucide-react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar"

const data = {
    user: {
        name: "Officer Smith",
        email: "smith@nctirs.gov",
        avatar: "/avatars/shadcn.jpg",
    },
    navMain: [
        {
            title: "Overview",
            url: "/",
            icon: SquareTerminal,
            isActive: true,
        },
        {
            title: "Incidents",
            url: "/incidents",
            icon: ShieldAlert,
        },
        {
            title: "Intelligence",
            url: "/intelligence",
            icon: BookOpen,
        },
        {
            title: "Surveillance",
            url: "/surveillance",
            icon: Radio,
        },
        {
            title: "Reports",
            url: "/reports",
            icon: FileText
        }
    ],
    navSecondary: [
        {
            title: "Support",
            url: "#",
            icon: LifeBuoy,
        },
        {
            title: "Feedback",
            url: "#",
            icon: Send,
        },
    ],
    projects: [
        {
            name: "Operation Alpha",
            url: "#",
            icon: Frame,
        },
        {
            name: "Grid Monitor",
            url: "#",
            icon: PieChart,
        },
        {
            name: "Field Units",
            url: "#",
            icon: Map,
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    return (
        <Sidebar variant="inset" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <a href="#">
                                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                                    <Command className="size-4" />
                                </div>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-semibold">NSSPIP Platform</span>
                                    <span className="truncate text-xs">v2.0.0</span>
                                </div>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                <NavProjects projects={data.projects} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={data.user} />
            </SidebarFooter>
        </Sidebar>
    )
}
