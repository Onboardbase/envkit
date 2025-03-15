/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React Strict Mode for development best practices
  reactStrictMode: true,
  
  // Configure webpack to handle server-only modules
  webpack: (config, { isServer }) => {
    // If we're on the client side and importing a module that uses Node.js 'fs'
    if (!isServer) {
      // Replace modules that should only run on server with empty objects
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
      };
    }
    
    return config;
  },
  
  // Transpile our local packages (needed for development)
  transpilePackages: ['@envkit/nextjs', '@envkit/core'],
};

module.exports = nextConfig;
