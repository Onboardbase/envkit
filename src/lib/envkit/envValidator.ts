/**
 * Environment validation utilities for EnvKit
 */
import { getEnvValue } from './fileUtils';

export type EnvVarConfig = {
  name: string;
  required: boolean;
  description?: string;
  defaultValue?: string;
};

export type ValidationResult = {
  isValid: boolean;
  missingVars: EnvVarConfig[];
  allVars: EnvVarConfig[];
};

/**
 * Validate environment variables based on provided configuration
 * Checks both process.env and .env files
 */
export function validateEnv(envVars: EnvVarConfig[]): ValidationResult {
  const missingVars: EnvVarConfig[] = [];

  for (const envVar of envVars) {
    // Check if value exists in process.env or .env files
    const value = getEnvValue(envVar.name);
    
    if (envVar.required && !value && !envVar.defaultValue) {
      missingVars.push(envVar);
    }
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    allVars: envVars,
  };
}

/**
 * Check if we're in development or production environment
 */
export function isDevEnvironment(): boolean {
  return process.env.NODE_ENV === 'development';
}
