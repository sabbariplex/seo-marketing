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
  // Turbopack configuration (empty to silence the warning)
  // The webpack config above will still be used when webpack is explicitly selected
  turbopack: {},
  // Ensure environment variables are available
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
