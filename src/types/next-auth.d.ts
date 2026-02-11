import { DefaultSession } from "next-auth"

declare module "next-auth" {
    interface User {
        role?: string | null
        agency?: string | null
    }

    interface Session {
        user: {
            role?: string | null
            agency?: string | null
        } & DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string | null
        agency?: string | null
    }
}
