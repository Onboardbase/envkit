/**
 * Server-only exports for Next.js integration
 * IMPORTANT: This file should only be imported in server components or API routes
 */

// Import server-only package at the top to ensure this file is never included in client bundles
import 'server-only';

// Ensure we're on the server
if (typeof window !== 'undefined') {
  throw new Error('This module should only be imported in server components or API routes');
}

// Export types we need
export interface LoadEnvOptions {
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
}

/**
 * Result of writing environment variables to a file
 */
export interface WriteEnvResult {
  success: boolean;
  path: string;
  error?: string;
}

// Import the API handler to use in the default export
import { createEnvApiHandler } from './api/createEnvApiHandler';

// Export the API handler creator (dynamically imported to prevent bundling)
export { createEnvApiHandler } from './api/createEnvApiHandler';
export type { EnvApiHandlerOptions as ApiHandlerOptions } from './api/createEnvApiHandler';

/**
 * Load environment variables from .env files
 * This is a server-side only function
 */
export async function loadEnvVars(options: LoadEnvOptions = {}): Promise<Record<string, string | undefined>> {
  // Import modules only when the function is called
  const fs = await import('fs');
  const path = await import('path');
  const dotenv = await import('dotenv');
  
  const { 
    envDir = process.cwd(),
    envFiles = ['.env.local', '.env.development.local', '.env.development', '.env']
  } = options;
  
  // Merge the environment variables in reverse priority order
  let merged: Record<string, string | undefined> = { ...process.env };
  
  // Try loading each file in order of priority
  for (const fileName of envFiles) {
    try {
      const filePath = path.resolve(envDir, fileName);
      
      // Check if file exists
      if (fs.existsSync(filePath)) {
        // Parse the file content
        const parsed = dotenv.parse(fs.readFileSync(filePath, 'utf8'));
        
        // Merge variables (existing take precedence)
        merged = { ...parsed, ...merged };
        
        console.log(`Loaded environment variables from ${fileName}`);
      }
    } catch (error) {
      console.warn(`Error loading ${fileName}:`, error);
    }
  }
  
  return merged;
}

/**
 * Write environment variables to a .env.local file
 * This is a server-side only function
 */
export interface WriteEnvOptions extends Pick<LoadEnvOptions, 'envDir'> {
  /**
   * Target .env file to write to
   * @default '.env.local'
   */
  targetEnvFile?: string;
}

export async function writeEnvVars(
  variables: Record<string, string>,
  options: WriteEnvOptions = {}
): Promise<WriteEnvResult> {
  try {
    // Import modules only when the function is called
    const fs = await import('fs');
    const path = await import('path');
    const dotenv = await import('dotenv');
    
    const { envDir = process.cwd(), targetEnvFile = '.env.local' } = options;
    const targetFile = path.resolve(envDir, targetEnvFile);
    
    // Create .env.local content
    let envContent = '';
    
    // Read existing file if it exists
    if (fs.existsSync(targetFile)) {
      const existingContent = fs.readFileSync(targetFile, 'utf8');
      const existing = dotenv.parse(existingContent);
      
      // Merge with new variables, new ones take precedence
      const merged = { ...existing, ...variables };
      
      // Format as KEY=VALUE pairs
      envContent = Object.entries(merged)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    } else {
      // Just format the provided variables
      envContent = Object.entries(variables)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
    }
    
    // Write to file
    fs.writeFileSync(targetFile, envContent);
    
    return {
      success: true,
      path: targetFile
    };
  } catch (error) {
    console.error('Error writing environment variables:', error);
    return {
      success: false,
      path: '',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Default export for convenient importing
export default {
  loadEnvVars,
  writeEnvVars,
  createEnvApiHandler
};
