
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

            // Allow access to public routes (login, register, etc.)
            // But protect dashboard
            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                // Redirect logged-in users to dashboard if they visit login page
                // (This logic is usually handled in the page itself or middleware redirect)
                // Here we just return true to allow access
                return true;
            }

            // API protection
            if (isOnAPI) {
                if (isLoggedIn) return true;
                return Response.json({ error: 'Unauthorized' }, { status: 401 });
            }

            return true;
        },
        async session({ session, token }) {
            if (token.sub && session.user) {
                session.user.id = token.sub;
            }
            if (token.role && session.user) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                session.user.role = token.role as any;
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
