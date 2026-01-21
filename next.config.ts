import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true, // Partial Prerendering (PPR) in Next.js 16
};

export default nextConfig;
