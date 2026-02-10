import type { NextConfig } from "next";


const nextConfig: NextConfig = {
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
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' *.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: *.googleapis.com; font-src 'self'; connect-src 'self' *.googleapis.com *.ably.io wss://*.ably.io;"
          }
        ]
      }
    ]
  }
};

export default nextConfig;
