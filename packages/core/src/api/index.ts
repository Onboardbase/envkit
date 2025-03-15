/**
 * EnvKit API client for managing environment variables
 * This module provides a unified API for both client and server-side code
 */

import { createEnvSchema, validateEnv } from '../schema';
import {
  EnvApiHandlerOptions,
  createApiHandlerFactory,
  ApiHandlerFactory,
  CreateEnvApiHandlerType,
  RequestType,
  ResponseType
} from './handlers';

export { createApiHandlerFactory };
export type {
  EnvApiHandlerOptions,
  ApiHandlerFactory,
  CreateEnvApiHandlerType,
  RequestType,
  ResponseType
};

export interface EnvKitApiOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface EnvVarUpdatePayload {
  [key: string]: string;
}

export interface EnvVarStatus {
  success: boolean;
  missingVars: string[];
  error?: string;
}

/**
 * EnvKit API client for managing environment variables
 */
export class EnvKitApi {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(options: EnvKitApiOptions = {}) {
    this.baseUrl = options.baseUrl || '/api/envkit';
    this.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
  }

  /**
   * Check the status of environment variables
   * @returns Promise with the status of environment variables
   */
  async checkStatus(): Promise<EnvVarStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/status`, {
        method: 'GET',
        headers: this.headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to check environment status');
      }

      return await response.json();
    } catch (error) {
      console.error('EnvKit API error:', error);
      return {
        success: false,
        missingVars: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Update environment variables
   * @param variables The environment variables to update
   * @returns Promise with the result of the update
   */
  async updateVariables(variables: EnvVarUpdatePayload): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.baseUrl}/update`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(variables)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update environment variables');
      }

      return await response.json();
    } catch (error) {
      console.error('EnvKit API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

/**
 * API utilities for environment variable management
 */
export const apiUtils = {
  /**
   * Check for missing environment variables on the server
   * @param requiredVars Array of required environment variable keys
   * @param env Environment object to check against
   * @returns Object with success status and missing variables
   */
  checkMissingVars(requiredVars: string[], env: Record<string, string | undefined>): EnvVarStatus {
    try {
      // Create schema for validation
      const schema = createEnvSchema(requiredVars);
      
      // Validate environment
      const validationResult = validateEnv(schema, env);
      
      return {
        success: validationResult.success,
        missingVars: validationResult.missingVars || []
      };
    } catch (error) {
      console.error('Error checking environment variables:', error);
      return {
        success: false,
        missingVars: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
};

// Create a default instance for easy import
export const envKitApi = new EnvKitApi();

export default envKitApi;
