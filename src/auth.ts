import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"

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
                if (!credentials?.badgeId || !credentials?.password) return null;

                const email = credentials.badgeId as string;
                const password = credentials.password as string;

                // Find user in database
                const user = await prisma.user.findUnique({
                    where: { email }
                });

                if (!user || !user.password) return null;

                // Compare password
                const isValid = await bcrypt.compare(password, user.password);
                if (!isValid) return null;

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
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
