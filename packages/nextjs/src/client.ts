import { createEnvSchema, validateEnv } from './schema';

/**
 * Configuration options for EnvKit
 */
export interface EnvKitConfig {
  /**
   * List of required environment variables
   */
  requiredVars: string[];
  
  /**
   * List of optional environment variables
   */
  optionalVars?: string[];
  
  /**
   * Path to redirect to when environment variables are missing
   * @default '/env-setup'
   */
  fallbackPath?: string;
  
  /**
   * Force production mode behavior (stricter validation)
   */
  isProduction?: boolean;
}

/**
 * EnvKit client for environment variable management
 */
export class EnvKit {
  private config: EnvKitConfig;
  
  /**
   * Create a new EnvKit client
   * @param config Configuration options
   */
  constructor(config: EnvKitConfig) {
    this.config = {
      fallbackPath: '/env-setup',
      isProduction: process.env.NODE_ENV === 'production',
      ...config
    };
    
    // Validate config
    if (!Array.isArray(this.config.requiredVars)) {
      throw new Error('requiredVars must be an array of strings');
    }
  }
  
  /**
   * Validate environment variables based on the current configuration
   * @param env Environment variables to validate
   * @returns Validation result with success flag and missing variables
   */
  validateEnvironment(env: Record<string, string | undefined>) {
    const schema = createEnvSchema(
      this.config.requiredVars,
      this.config.optionalVars
    );
    
    return validateEnv(schema, env);
  }
  
  /**
   * Get the configuration for EnvKitProvider
   * @returns Provider configuration object
   */
  getProviderConfig() {
    return {
      requiredVars: this.config.requiredVars,
      fallbackPath: this.config.fallbackPath,
      isProduction: this.config.isProduction,
    };
  }
}

/**
 * Create a new EnvKit client with the specified configuration
 * @param config Configuration options
 * @returns EnvKit client instance
 */
export function createEnvKit(config: EnvKitConfig) {
  return new EnvKit(config);
}
