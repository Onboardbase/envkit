'use client';

/**
 * EnvKit API client for managing environment variables
 * This module provides a client-side API for environment variable management
 * IMPORTANT: This file must not import any server-only modules
 */

// Client-side API interface options
export interface EnvKitApiOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

// Type for environment variable update payload
export type EnvVarUpdatePayload = Record<string, string>;

// Type for status response
export interface EnvVarStatus {
  success: boolean;
  missingVars: string[];
  error?: string;
}

/**
 * EnvKit API client for managing environment variables
 * This is safe to use in client components
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
      const response = await fetch(`${this.baseUrl}`, {
        method: 'GET',
        headers: this.headers,
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          missingVars: [],
          error: `API request failed: ${error}`
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error checking environment variables:', error);
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
      const response = await fetch(`${this.baseUrl}`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(variables),
        cache: 'no-store'
      });
      
      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          error: `API request failed: ${error}`
        };
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error updating environment variables:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
}

// Create a default instance for easy import
export const envKitApi = new EnvKitApi();
