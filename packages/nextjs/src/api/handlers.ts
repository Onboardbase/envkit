/**
 * EnvKit API route handlers
 * These handlers can be used to quickly set up API routes in Next.js
 * They provide a simple interface for checking environment variable status
 * and updating environment variables from the client.
 * 
 * IMPORTANT: These handlers should only be used in server components or API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { createEnvSchema, validateEnv } from '../schema';

// Mark this file as server-only
if (typeof window !== 'undefined') {
  throw new Error('This module should only be imported in server components or API routes');
}

/**
 * Options for the API route handlers
 */
export interface ApiHandlerOptions {
  /**
   * Whether to allow access in production
   * @default false
   */
  allowInProduction?: boolean;
  
  /**
   * The directory to look for .env files
   * @default process.cwd()
   */
  envDir?: string;
  
  /**
   * The .env file names to look for
   * @default ['.env.local', '.env.development.local', '.env.development', '.env']
   */
  envFiles?: string[];
  
  /**
   * Function to run after updating environment variables
   */
  onUpdate?: (updatedVars: Record<string, string>) => Promise<void>;

  /**
   * List of required environment variables to check
   * This is used when the variables cannot be retrieved from cookies or localStorage
   */
  requiredVars?: string[];
}

/**
 * Load environment variables from .env files
 * This is a server-side only function
 * @deprecated Use direct imports from server module instead: import { loadEnvVars } from 'envkit/server'
 */
export async function loadEnvVars(options: Pick<ApiHandlerOptions, 'envDir' | 'envFiles'> = {}) {
  // Only run on server side
  if (typeof window !== 'undefined') {
    console.warn('loadEnvVars can only be used on the server');
    return process.env;
  }

  try {
    // Dynamically import the server module
    const serverModule = await import('../server');
    // Use the server-side loadEnvVars function
    return await serverModule.loadEnvVars(options);
  } catch (error) {
    console.error('Error loading environment variables:', error);
    return process.env;
  }
}

/**
 * Write environment variables to a .env file
 * This is a server-side only function
 * @deprecated Use direct imports from server module instead: import { writeEnvVars } from 'envkit/server'
 */
export async function writeEnvVars(
  variables: Record<string, string>,
  options: Pick<ApiHandlerOptions, 'envDir'> = {}
) {
  // Only run on server side
  if (typeof window !== 'undefined') {
    console.warn('writeEnvVars can only be used on the server');
    throw new Error('writeEnvVars can only be used on the server');
  }

  try {
    // Dynamically import the server module
    const serverModule = await import('../server');
    // Use the server-side writeEnvVars function
    return await serverModule.writeEnvVars(variables, options);
  } catch (error) {
    console.error('Error writing environment variables:', error);
    throw error;
  }
}

/**
 * Handler for the status API route
 * This should be used in a Route Handler file
 */
export async function statusHandler(
  request: NextRequest,
  options: ApiHandlerOptions = {}
) {
  // Deny access in production by default
  if (process.env.NODE_ENV === 'production' && !options.allowInProduction) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    // Extract required variables from request headers
    // The EnvKitProvider component sets these on the client side via cookies
    let requiredVars: string[] = [];
    
    // Check cookies for required vars (client sends them this way)
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
    
    console.log('Required environment variables:', requiredVars);
    
    // Import the server module to load environment variables
    const serverModule = await import('../server');
    const loadedEnv = await serverModule.loadEnvVars(options);
    
    // For debugging purposes, log the keys we found (not the values for security)
    console.log('Found environment variables:', Object.keys(loadedEnv));
    
    // Directly check which required vars are missing
    const missingVars = requiredVars.filter((key: string) => !loadedEnv[key]);
    console.log('Missing environment variables:', missingVars);
    
    return NextResponse.json({
      success: missingVars.length === 0,
      missingVars: missingVars,
    });
  } catch (error) {
    console.error('Error in env status API:', error);
    return NextResponse.json({ 
      error: 'Failed to check environment status',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Handler for the update API route
 * This should be used in a Route Handler file
 */
export async function updateHandler(
  request: NextRequest,
  options: ApiHandlerOptions = {}
) {
  // Deny access in production by default
  if (process.env.NODE_ENV === 'production' && !options.allowInProduction) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    // Parse the request body
    const body = await request.json();
    
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
    
    try {
      // Dynamically import the server module
      const serverModule = await import('../server');
      
      // Write environment variables using the server module
      const result = await serverModule.writeEnvVars(body, { envDir: options.envDir });
      
      // Call the onUpdate callback if provided
      if (options.onUpdate) {
        await options.onUpdate(body);
      }
      
      return NextResponse.json({
        success: true,
        message: 'Environment variables updated successfully',
        path: result.path
      });
    } catch (fsError) {
      console.error('Error writing to file:', fsError);
      return NextResponse.json({
        error: 'Failed to write environment variables to file',
        details: fsError instanceof Error ? fsError.message : String(fsError)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in env update API:', error);
    return NextResponse.json({ 
      error: 'Failed to update environment variables',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

/**
 * Create API route handlers with custom options
 */
export function createApiHandlers(options: ApiHandlerOptions = {}) {
  return {
    status: (request: NextRequest) => statusHandler(request, options),
    update: (request: NextRequest) => updateHandler(request, options)
  };
}

export default {
  statusHandler,
  updateHandler,
  createApiHandlers,
  loadEnvVars,
  writeEnvVars
};
