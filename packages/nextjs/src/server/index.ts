/**
 * Server-side utilities for EnvKit
 * IMPORTANT: This module should only be imported in server components or API routes
 */
'use server';

// Import server-only to prevent this module from being used in client components
import 'server-only';
import type { NextEnvKitOptions, EnvVarStatus, EnvSetupConfig } from '../types';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as dotenv from 'dotenv';

export class NextEnvKit {
  private envDir: string;
  private envFiles: string[];
  private options: NextEnvKitOptions;

  constructor(options: NextEnvKitOptions = {}) {
    this.options = options;
    this.envDir = options.envDir || process.cwd();
    this.envFiles = options.envFiles || [
      '.env.local',
      '.env.development.local',
      '.env.development',
      '.env'
    ];
  }

  /**
   * Load environment variables from .env files
   * This function only works on the server
   */
  async loadEnvVars(): Promise<Record<string, string | undefined>> {
    if (typeof window !== 'undefined') {
      console.warn('loadEnvVars can only be used on the server. Returning empty object.');
      return process.env;
    }

    // Paths to try for .env files
    const envPaths = this.envFiles.map(file => path.resolve(this.envDir, file));
    let envVars: Record<string, string | undefined> = {};

    for (const envPath of envPaths) {
      try {
        await fs.access(envPath);
        const content = await fs.readFile(envPath, 'utf8');
        const parsed = dotenv.parse(content);
        envVars = { ...envVars, ...parsed };
      } catch (error) {
        continue;
      }
    }

    return { ...envVars, ...process.env };
  }

  /**
   * Write environment variables to a .env file
   * This function only works on the server
   */
  async writeEnvVars(
    variables: Record<string, string>
  ): Promise<{ path: string; variables: Record<string, string> }> {
    if (typeof window !== 'undefined') {
      throw new Error('writeEnvVars cannot be used in browser environment');
    }

    const envPath = path.resolve(this.envDir, '.env.local');
    let existingVars = {};

    try {
      await fs.access(envPath);
      const content = await fs.readFile(envPath, 'utf8');
      existingVars = dotenv.parse(content);
    } catch (error) {
      // File doesn't exist, will create new one
    }

    const mergedVars = { ...existingVars, ...variables };
    const content = Object.entries(mergedVars)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n');

    await fs.writeFile(envPath, content);
    return { path: envPath, variables: mergedVars };
  }

  /**
   * Check for missing environment variables
   */
  async checkEnvVars(config: EnvSetupConfig): Promise<EnvVarStatus> {
    try {
      const env = await this.loadEnvVars();
      const missingVars = config.requiredVars.filter(
        (varName: string) => !env[varName]
      );

      return {
        success: missingVars.length === 0,
        missingVars,
        config
      };
    } catch (error) {
      return {
        success: false,
        missingVars: [],
        error: error instanceof Error ? error.message : String(error),
        config
      };
    }
  }

  /**
   * Get the current environment configuration
   */
  getConfig(): EnvSetupConfig {
    return {
      requiredVars: this.options.requiredVars || [],
      fallbackUI: this.options.fallbackUI,
      customComponents: this.options.customComponents
    };
  }
}

// Export individual functions for backward compatibility
export const loadEnvVars = (options: NextEnvKitOptions = {}) => {
  const instance = new NextEnvKit(options);
  return instance.loadEnvVars();
};

export const writeEnvVars = (
  variables: Record<string, string>,
  options: NextEnvKitOptions = {}
) => {
  const instance = new NextEnvKit(options);
  return instance.writeEnvVars(variables);
};

export const checkEnvVars = (config: EnvSetupConfig) => {
  const instance = new NextEnvKit();
  return instance.checkEnvVars(config);
};

// Create and export a default instance
const defaultInstance = new NextEnvKit();

export default defaultInstance;

// This ensures tree-shaking eliminates this module from client bundles
export const isServerModule = true;
