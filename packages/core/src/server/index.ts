/**
 * Server-side utilities for EnvKit
 * IMPORTANT: This module should only be imported in server components or API routes
 */

// Ensure this module is only used on the server
if (typeof window !== 'undefined') {
  throw new Error('This module should only be imported in server components or API routes');
}

export interface EnvFileOptions {
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

export interface EnvWriteResult {
  /**
   * The path to the file that was written
   */
  path: string;
  
  /**
   * Whether the file was created (true) or updated (false)
   */
  created: boolean;
}

/**
 * Load environment variables from .env files
 * Platform-specific implementations will be provided by each framework package
 */
export async function loadEnvVars(
  options: EnvFileOptions = {}
): Promise<Record<string, string>> {
  throw new Error('loadEnvVars must be implemented by a framework-specific package');
}

/**
 * Write environment variables to a .env file
 * Platform-specific implementations will be provided by each framework package
 */
export async function writeEnvVars(
  variables: Record<string, string>,
  options: Pick<EnvFileOptions, 'envDir'> = {}
): Promise<EnvWriteResult> {
  throw new Error('writeEnvVars must be implemented by a framework-specific package');
}

/**
 * Parse an .env file content to an object
 * @param content The content of the .env file
 * @returns An object containing the parsed environment variables
 */
export function parseEnvFile(content: string): Record<string, string> {
  const result: Record<string, string> = {};
  
  content.split('\n').forEach(line => {
    // Skip comments and empty lines
    const trimmedLine = line.trim();
    if (trimmedLine.startsWith('#') || !trimmedLine) {
      return;
    }
    
    // Split by first equals sign
    const equalSignIndex = line.indexOf('=');
    if (equalSignIndex > 0) {
      const key = line.substring(0, equalSignIndex).trim();
      let value = line.substring(equalSignIndex + 1).trim();
      
      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || 
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.substring(1, value.length - 1);
      }
      
      result[key] = value;
    }
  });
  
  return result;
}

/**
 * Stringify an object to .env file format
 * @param env The environment variables object
 * @returns A string in .env file format
 */
export function stringifyEnvFile(env: Record<string, string>): string {
  return Object.entries(env)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
}
