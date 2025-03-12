/**
 * EnvKit - Environment Variable Management for Next.js
 * 
 * A comprehensive solution for managing environment variables in Next.js applications,
 * with support for development-time configuration, fallback UI, and production safeguards.
 */

// Core components
export { EnvKitProvider, useEnvKit } from './EnvKitProvider';
export { EnvConfigFallbackUI } from './EnvConfigFallbackUI';

// Utilities
export { validateEnv, isDevEnvironment } from './envValidator';
export { readEnvFile, writeEnvFile, updateEnvFile, parseEnvFile } from './fileUtils';

// Types
export type { 
  EnvVarConfig, 
  ValidationResult 
} from './envValidator';
export type { 
  EnvFileOptions 
} from './fileUtils';
