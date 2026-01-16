import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Prisma Client is properly handled in serverless environments
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Prisma Client to prevent bundling issues
      config.externals = config.externals || [];
      config.externals.push({
        '@prisma/client': '@prisma/client',
      });
    }
    return config;
  },
  // Ensure environment variables are available
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
