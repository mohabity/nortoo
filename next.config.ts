import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Vercel handles this, but explicit for safety
  serverExternalPackages: ["@neondatabase/serverless"],
};

export default nextConfig;
