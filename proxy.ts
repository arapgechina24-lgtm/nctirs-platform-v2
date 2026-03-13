import { auth } from "@/auth"
import { NextRequest } from "next/server"

export default auth(async function proxy(req) {
    const isLoggedIn = !!req.auth;
    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
    const isPublicRoute = req.nextUrl.pathname === '/login';

    if (isApiAuthRoute) return;

    if (!isLoggedIn && !isPublicRoute) {
        let callbackUrl = req.nextUrl.pathname;
        if (req.nextUrl.search) callbackUrl += req.nextUrl.search;

        const encodedCallbackUrl = encodeURIComponent(callbackUrl);
        return Response.redirect(new URL(`/login?callbackUrl=${encodedCallbackUrl}`, req.nextUrl));
    }
})
export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
