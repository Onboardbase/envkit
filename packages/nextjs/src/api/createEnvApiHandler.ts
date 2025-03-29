/**
 * EnvKit API handler for Next.js
 * Provides a unified API handler that can be easily imported in Next.js route handlers
 */
'use server';

import { NextRequest, NextResponse } from 'next/server';
import { loadEnvVars, writeEnvVars } from '../server';

// Define the interfaces we need locally to avoid import issues

/**
 * Configuration for a specific environment
 */
export interface EnvConfig {
  /**
   * Required environment variables for this environment
   */
  requiredVars?: string[];
  
  /**
   * Target .env file for this environment
   * @default '.env.local'
   */
  targetEnvFile?: string;
}

/**
 * Options for the EnvKit API handler
 */
export interface EnvApiHandlerOptions {
  /**
   * Allow access in production environment
   * @default false
   */
  allowInProduction?: boolean;
  
  /**
   * The directory to look for .env files
   * @default process.cwd()
   */
  envDir?: string;
  
  /**
   * The .env file names to look for when loading variables
   * @default ['.env.local', '.env.development.local', '.env.development', '.env']
   */
  envFiles?: string[];
  
  /**
   * Callback function to run after environment variables are updated
   */
  onUpdate?: (updatedVars: Record<string, string>) => Promise<void>;
  
  /**
   * Required environment variables (legacy approach)
   * @deprecated Use environments object instead
   */
  requiredVars?: string[];
  
  /**
   * Environment-specific configurations
   * Keys are environment names (e.g., 'development', 'production')
   * Values are environment-specific configurations
   */
  environments?: Record<string, EnvConfig>;
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
        let currentEnv = process.env.NODE_ENV || 'development';
        
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
        
        // If requiredVars is still empty, check environment-specific config
        if (requiredVars.length === 0 && options.environments && options.environments[currentEnv]) {
          requiredVars = options.environments[currentEnv].requiredVars || [];
        }
        
        // If still empty, fall back to legacy requiredVars
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
          missingVars,
          environment: currentEnv
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
        let targetEnv;
        try {
          const requestData = await request.json();
          
          // Check if the request includes a target environment
          if (requestData._targetEnv) {
            targetEnv = requestData._targetEnv;
            // Remove the _targetEnv property from the body
            const { _targetEnv, ...envVars } = requestData;
            body = envVars;
          } else {
            body = requestData;
          }
        } catch (error) {
          return createResponse({ 
            error: 'Invalid request body. Expected JSON object.'
          }, 400);
        }

        // Write env vars
        try {
          const currentEnv = targetEnv || process.env.NODE_ENV || 'development';
          let targetEnvFile = '.env.local';
          
          // Check if we have environment-specific configuration
          if (options.environments && options.environments[currentEnv] && options.environments[currentEnv].targetEnvFile) {
            targetEnvFile = options.environments[currentEnv].targetEnvFile;
          }
          
          // Get the raw result from writeEnvVars
          const rawResult = await writeEnvVars(body, { 
            ...options, 
            ...handlerOptions,
            targetEnvFile
          });
          
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
            environment: currentEnv,
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
