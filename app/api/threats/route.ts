import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : 20;

        // IDE TS Server Cache Workaround
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const threats = await (prisma as any).threat.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ threats, total: threats.length });
    } catch (error) {
        console.error("Error fetching threats:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
