
import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = nextUrl.pathname.startsWith('/dashboard') || nextUrl.pathname === '/';
            const isOnAPI = nextUrl.pathname.startsWith('/api') && !nextUrl.pathname.startsWith('/api/auth');

            // Protect dashboard routes
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            }

            // API protection (must be checked before general pass-through)
            if (isOnAPI) {
                if (isLoggedIn) return true;
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }

            // All other routes (login, register, public pages)
            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).id = token.sub;
            }
            if (token.role && session.user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (session.user as any).role = token.role as string;
            }
            return session;
        },
        async jwt({ token, user }) {
            if (user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                token.role = (user as any).role;
            }
            return token;
        }
    },
    providers: [], // Configured in auth.ts
} satisfies NextAuthConfig;
