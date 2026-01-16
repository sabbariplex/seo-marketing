import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Prisma Client is properly handled in serverless environments
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Prisma Client and related packages to prevent bundling issues
      // This is critical for Prisma 7+ to work correctly in serverless environments
      // Prisma Client must NOT be bundled - it needs to be loaded from node_modules at runtime
      
      // Use function-based externalization for more control
      const originalExternals = config.externals;
      config.externals = [
        ...(Array.isArray(originalExternals) ? originalExternals : [originalExternals].filter(Boolean)),
        ({ request }: any, callback: any) => {
          // Externalize all Prisma-related packages and their subpaths
          // This prevents webpack from bundling Prisma, which breaks model methods
          if (
            request === '@prisma/client' ||
            request?.startsWith('@prisma/client/') ||
            request === '@prisma/adapter-pg' ||
            request?.includes('.prisma/') ||
            (request?.includes('prisma') && !request?.includes('prismjs')) || // Exclude prismjs
            request?.includes('@prisma')
          ) {
            return callback(null, `commonjs ${request}`);
          }
          // Let webpack handle other externals
          if (typeof originalExternals === 'function') {
            return originalExternals({ request }, callback);
          }
          callback();
        },
      ];
    }
    return config;
  },
  // Ensure environment variables are available
  env: {
    DATABASE_URL: process.env.DATABASE_URL,
  },
};

export default nextConfig;
