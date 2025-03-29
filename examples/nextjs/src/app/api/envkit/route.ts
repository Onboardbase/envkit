// Use the direct path to the compiled output for local development
import { createEnvApiHandler } from '@envkit/nextjs/server';
import { NextRequest } from 'next/server';

// Using dynamic import for server-only code
// This ensures proper separation of client and server code
const handlers = createEnvApiHandler({
  environments: {
    production: {
      // Specify required variables for production
      requiredVars: ['DATABASE_URL', 'API_KEY'],
    },
    local: {
      // Specify required variables for local development
      targetEnvFile: '.env.local',
      requiredVars: ['DATABASE_URL', 'API_KEY', 'zyx'],
    },
    development: {
      // Specify required variables for development
      targetEnvFile: '.env.development',
      requiredVars: ['DATABASE_URL', 'API_KEY'],
    },
  },
  // Optional: Allow access in production (defaults to false)
  allowInProduction: false,
  
  // Optional: Customize the directory for .env files
  envDir: process.cwd(),
});

// Export GET and POST handlers for Next.js App Router
export async function GET(request: NextRequest) {
  return handlers.statusHandler(request);
}

export async function POST(request: NextRequest) {
  return handlers.updateHandler(request);
}