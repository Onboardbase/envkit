/**
 * File utilities for EnvKit
 */
import fs from 'fs';
import path from 'path';

export type EnvFileOptions = {
  encoding?: BufferEncoding;
  envFilePath?: string;
  includeEnvExtensions?: boolean; // Whether to load .env.* files
};

const defaultOptions: EnvFileOptions = {
  encoding: 'utf8',
  envFilePath: '.env',
  includeEnvExtensions: true,
};

/**
 * Get all available .env files in priority order
 * Priority: .env.local > .env.[NODE_ENV].local > .env.[NODE_ENV] > .env
 */
export function getEnvFilePaths(basePath: string = process.cwd(), options: EnvFileOptions = {}): string[] {
  const { includeEnvExtensions } = { ...defaultOptions, ...options };
  const nodeEnv = process.env.NODE_ENV || 'development';
  
  // Define priority order of env files
  const envFiles = ['.env'];
  
  if (includeEnvExtensions) {
    envFiles.unshift(
      `.env.${nodeEnv}`,
      `.env.${nodeEnv}.local`,
      '.env.local'
    );
  }
  
  // Filter to only existing files
  return envFiles
    .map(file => path.resolve(basePath, file))
    .filter(filePath => fs.existsSync(filePath));
}

/**
 * Read environment variables from all .env files
 */
export function readEnvFiles(options: EnvFileOptions = {}): Record<string, string> {
  const { encoding, includeEnvExtensions } = { ...defaultOptions, ...options };
  const envFilePaths = getEnvFilePaths(process.cwd(), { includeEnvExtensions });
  
  let envVars: Record<string, string> = {};
  
  // Read each file in reverse priority order (lowest priority first)
  // This ensures higher priority files override lower priority ones
  [...envFilePaths].reverse().forEach(filePath => {
    try {
      const content = fs.readFileSync(filePath, { encoding });
      const fileVars = parseEnvFile(content.toString());
      envVars = { ...envVars, ...fileVars };
    } catch (error) {
      console.error(`Error reading env file ${filePath}:`, error);
    }
  });
  
  return envVars;
}

/**
 * Read environment variables from a specific .env file
 */
export function readEnvFile(options: EnvFileOptions = {}): Record<string, string> {
  const { encoding, envFilePath } = { ...defaultOptions, ...options };
  const filePath = path.resolve(process.cwd(), envFilePath!);
  
  try {
    if (!fs.existsSync(filePath)) {
      return {};
    }
    
    const content = fs.readFileSync(filePath, { encoding });
    // Fix for the lint error - ensure content is a string
    return parseEnvFile(content.toString());
  } catch (error) {
    console.error('Error reading .env file:', error);
    return {};
  }
}

/**
 * Parse .env file content into key-value pairs
 */
export function parseEnvFile(content: string): Record<string, string> {
  const envVars: Record<string, string> = {};
  
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmedLine = line.trim();
    // Skip comments and empty lines
    if (!trimmedLine || trimmedLine.startsWith('#')) {
      continue;
    }
    
    const match = trimmedLine.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["'](.*)["']$/, '$1');
      envVars[key] = value;
    }
  }
  
  return envVars;
}

/**
 * Get environment variable from all sources (process.env and .env files)
 */
export function getEnvValue(key: string, options: EnvFileOptions = {}): string | undefined {
  // First check process.env (has highest priority)
  if (process.env[key] !== undefined) {
    return process.env[key];
  }
  
  // Then check .env files
  const envVars = readEnvFiles(options);
  return envVars[key];
}

/**
 * Write environment variables to a specific .env file
 */
export function writeEnvFile(
  envVars: Record<string, string>,
  options: EnvFileOptions = {}
): boolean {
  const { encoding, envFilePath } = { ...defaultOptions, ...options };
  const filePath = path.resolve(process.cwd(), envFilePath!);
  
  try {
    const content = Object.entries(envVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');
    
    fs.writeFileSync(filePath, content, { encoding });
    return true;
  } catch (error) {
    console.error('Error writing .env file:', error);
    return false;
  }
}

/**
 * Update environment variables in a .env file
 */
export function updateEnvFile(
  newVars: Record<string, string>,
  options: EnvFileOptions = {}
): boolean {
  const { encoding, envFilePath } = { ...defaultOptions, ...options };
  const filePath = path.resolve(process.cwd(), envFilePath!);
  
  try {
    // Get existing vars or initialize empty object if file doesn't exist
    const existingVars = fs.existsSync(filePath)
      ? readEnvFile(options)
      : {};
    
    // Merge existing and new vars
    const updatedVars = { ...existingVars, ...newVars };
    
    return writeEnvFile(updatedVars, { encoding, envFilePath });
  } catch (error) {
    console.error('Error updating .env file:', error);
    return false;
  }
}
