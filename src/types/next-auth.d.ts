import "next-auth"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface User {
        id: string
        role: string
    }

    interface Session {
        user: {
            id: string
            role: string
        } & DefaultSession["user"]
    }
}
