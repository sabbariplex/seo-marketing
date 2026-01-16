import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Ensure Prisma Client is properly handled in serverless environments
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize Prisma Client and related packages to prevent bundling issues
      // This is critical for Prisma 7+ to work correctly in serverless environments
      // Prisma Client must NOT be bundled - it needs to be loaded from node_modules at runtime
      config.externals = config.externals || [];
      
      // Add Prisma packages to externals
      if (Array.isArray(config.externals)) {
        config.externals.push('@prisma/client');
        config.externals.push('@prisma/adapter-pg');
      } else if (typeof config.externals === 'object') {
        config.externals['@prisma/client'] = '@prisma/client';
        config.externals['@prisma/adapter-pg'] = '@prisma/adapter-pg';
      }
      
      // Also externalize Prisma's generated files
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      
      // Prevent webpack from resolving Prisma's internal modules
      config.resolve.alias['@prisma/client$'] = require.resolve('@prisma/client');
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
