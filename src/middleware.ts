import NextAuth from 'next-auth';
import { authConfig } from './auth.config';
import { NextRequest, NextResponse } from 'next/server';

const { auth } = NextAuth(authConfig);

export default async function middleware(req: NextRequest) {
    // 1. Deployment Lockdown (Basic Auth)
    // If DEPLOYMENT_PASSWORD is set, require it before anything else.
    // This allows you to "lock" the Vercel deployment from public view.
    const lockPassword = process.env.DEPLOYMENT_PASSWORD;

    if (lockPassword) {
        const basicAuth = req.headers.get('authorization');
        if (basicAuth) {
            const authValue = basicAuth.split(' ')[1];
            const [, pwd] = atob(authValue).split(':');

            // Check if password matches (username is ignored, can be anything)
            if (pwd !== lockPassword) {
                return new NextResponse('Access Denied', {
                    status: 401,
                    headers: { 'WWW-Authenticate': 'Basic realm="Restricted Deployment"' },
                });
            }
        } else {
            return new NextResponse('Access Denied', {
                status: 401,
                headers: { 'WWW-Authenticate': 'Basic realm="Restricted Deployment"' },
            });
        }
    }

    // 2. Normal NextAuth Authentication
    // If deployment is unlocked (or correct basic auth provided), run normal auth checks.
    // We bind the req object to auth() so it acts as the middleware handler
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await (auth as any)(req);

    // 3. Security Headers
    // Add standard security headers to all responses handled by this middleware
    if (response instanceof NextResponse) {
        response.headers.set('X-DNS-Prefetch-Control', 'on');
        response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
        response.headers.set('X-Frame-Options', 'SAMEORIGIN');
        response.headers.set('X-Content-Type-Options', 'nosniff');
        response.headers.set('X-XSS-Protection', '1; mode=block');
        response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    }

    return response;
}

export const config = {
    // https://nextjs.org/docs/app/building-your-application/routing/middleware#matcher
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
};
