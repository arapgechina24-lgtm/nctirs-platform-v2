import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import CredentialsProvider from "next-auth/providers/credentials"

export const { handlers, auth, signIn, signOut } = NextAuth({
    // @ts-expect-error - NextAuth PrismaAdapter beta type mismatch
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
        maxAge: 15 * 60, // 15 mins for CJIS compliance (Criminal Justice Information Services)
    },
    providers: [
        CredentialsProvider({
            name: "Security Clearance",
            credentials: {
                badgeId: { label: "Badge ID / Email", type: "text", placeholder: "admin@nctirs.gov.ke" },
                password: { label: "Passcode", type: "password" }
            },
            async authorize(credentials) {
                // Mock authorization for prototyping & $1M SaaS pitch
                if (!credentials?.badgeId || !credentials?.password) return null;

                const badgeId = credentials.badgeId as string;
                const password = credentials.password as string;

                // Simple mock logic for demonstration
                // In production, use bcrypt.compare against db hash
                if (password !== "nctirs2024") return null;

                let role = "OFFICER";
                if (badgeId.includes("admin")) role = "ADMIN";
                else if (badgeId.includes("commander")) role = "COMMANDER";
                else if (badgeId.includes("analyst")) role = "ANALYST";

                return {
                    id: badgeId, // using badgeId as mock ID
                    email: badgeId,
                    name: badgeId.split('@')[0].toUpperCase(),
                    role: role,
                }
            }
        })
    ],
    callbacks: {
        async jwt({ token, user }) {
            // Add role to token right after sign in
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            // Expose role and id to client sessions
            if (session.user) {
                session.user.role = token.role as string;
                session.user.id = token.id as string;
            }
            return session;
        }
    },
    pages: {
        signIn: "/login",
    }
})
