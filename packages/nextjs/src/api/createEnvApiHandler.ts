/**
 * EnvKit API handler for Next.js
 * Provides a unified API handler that can be easily imported in Next.js route handlers
 */
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { loadEnvVars, writeEnvVars } from '../server';

// Define the interfaces we need locally to avoid import issues
export interface EnvApiHandlerOptions {
  allowInProduction?: boolean;
  envDir?: string;
  envFiles?: string[];
  onUpdate?: (updatedVars: Record<string, string>) => Promise<void>;
  requiredVars?: string[];
}

/**
 * Result of writing environment variables to a file
 * Defined locally to avoid import cycles
 */
interface WriteEnvResult {
  success: boolean;
  path: string;
  error?: string;
}

// Define the type for our Next.js specific createEnvApiHandler function
export type CreateEnvApiHandlerType = (
  options?: EnvApiHandlerOptions
) => {
  statusHandler: (request: NextRequest) => Promise<NextResponse>;
  updateHandler: (request: NextRequest) => Promise<NextResponse>;
};

interface ApiHandlerFactory<TRequest, TResponse> {
  createStatusHandler: (options?: EnvApiHandlerOptions) => (request: TRequest) => Promise<TResponse>;
  createUpdateHandler: (options?: EnvApiHandlerOptions) => (request: TRequest) => Promise<TResponse>;
}

/**
 * Creates an API handler factory for Next.js
 * This allows easy setup of the API routes for EnvKit in Next.js applications
 */
export const createEnvApiHandler: CreateEnvApiHandlerType = (options = {}) => {
  const createResponse = (data: any, statusCode: number) => {
    const response = NextResponse.json(data, { status: statusCode });
    // Add CORS headers
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
    return response;
  };

  const factory: ApiHandlerFactory<NextRequest, NextResponse> = {
    createStatusHandler: (handlerOptions = {}) => {
      return async (request: NextRequest) => {
        // Check production access
        if (process.env.NODE_ENV === 'production' && !options.allowInProduction) {
          return createResponse({ error: 'Not available in production' }, 404);
        }

        let requiredVars: string[] = [];
        
        // Check cookies for required vars
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
          const cookieItems = cookieHeader.split(';').map(item => item.trim());
          const envkitCookie = cookieItems.find(item => item.startsWith('__ENVKIT_REQUIRED_VARS__='));
          if (envkitCookie) {
            try {
              requiredVars = JSON.parse(decodeURIComponent(envkitCookie.split('=')[1]));
            } catch (e) {
              console.warn('Failed to parse required vars from cookie:', e);
            }
          }
        }
        
        // If requiredVars is still empty, try reading from options
        if (requiredVars.length === 0 && options.requiredVars) {
          requiredVars = options.requiredVars;
        }

        // Load env vars
        const env = await loadEnvVars({ ...options, ...handlerOptions });
        
        // Check for missing variables
        const missingVars = requiredVars.filter(key => !env[key]);
        
        // Return status
        return createResponse({
          success: missingVars.length === 0,
          missingVars
        }, 200);
      };
    },

    createUpdateHandler: (handlerOptions = {}) => {
      return async (request: NextRequest) => {
        // Check production access
        if (process.env.NODE_ENV === 'production' && !options.allowInProduction) {
          return createResponse({ error: 'Not available in production' }, 404);
        }

        // Parse request body
        let body;
        try {
          body = await request.json();
        } catch (error) {
          return createResponse({ 
            error: 'Invalid request body. Expected JSON object.'
          }, 400);
        }

        // Write env vars
        try {
          // Get the raw result from writeEnvVars
          const rawResult = await writeEnvVars(body, { ...options, ...handlerOptions });
          
          // Convert to the expected format
          const result: WriteEnvResult = {
            success: true, // If we got here without an error, consider it successful
            path: rawResult.path,
            // Map any potential error
            error: undefined
          };
          
          // Call onUpdate if provided
          if (options.onUpdate) {
            await options.onUpdate(body);
          }

          // Return response with properties that match WriteEnvResult
          return createResponse({
            success: result.success,
            path: result.path,
            error: result.error
          }, 200);
        } catch (error) {
          return createResponse({ 
            error: error instanceof Error ? error.message : 'Failed to update environment variables'
          }, 500);
        }
      };
    }
  };

  // Return the handlers with the correct names for Next.js App Router
  return {
    statusHandler: factory.createStatusHandler(options),
    updateHandler: factory.createUpdateHandler(options)
  };
};

export default createEnvApiHandler;
