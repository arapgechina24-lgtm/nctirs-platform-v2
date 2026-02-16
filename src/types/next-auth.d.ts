import "next-auth"
import "next-auth/jwt"

declare module "next-auth" {
    interface User {
        role?: string | null
        agency?: string | null
    }

    interface Session {
        user: {
            role?: string | null
            agency?: string | null
            id?: string
        } & import("next-auth").DefaultSession["user"]
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string | null
        agency?: string | null
    }
}
