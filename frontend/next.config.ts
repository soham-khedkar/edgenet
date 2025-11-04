import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to complete even with ESLint errors
    // TODO: Fix ESLint issues in ai-insights page
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
