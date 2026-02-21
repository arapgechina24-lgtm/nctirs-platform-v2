import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  poweredByHeader: false, // Suppress X-Powered-By: Next.js header
  // cacheComponents: true, // Partial Prerendering (PPR) in Next.js 16
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            // Updated CSP to be stricter: Removing 'unsafe-inline' from script-src where possible (Next.js dev might need it, but production should avoid it).
            // Limiting font and img sources specifically.
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com; style-src 'self' 'unsafe-inline' *.googleapis.com; img-src 'self' data: blob: *.googleapis.com a.tile.openstreetmap.org b.tile.openstreetmap.org c.tile.openstreetmap.org; font-src 'self' data:; connect-src 'self' *.googleapis.com *.ably.io wss://*.ably.io;"
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ]
  }
};

export default nextConfig;
