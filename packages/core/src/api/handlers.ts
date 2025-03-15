/**
 * Framework-agnostic API handlers for EnvKit
 * These handlers can be used to quickly set up API endpoints across frameworks
 */

import { createEnvSchema, validateEnv } from '../schema';

// Core API handler options
export interface EnvApiHandlerOptions {
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
   * This is used when the variables cannot be retrieved from another source
   */
  requiredVars?: string[];

  /**
   * Custom load environment variables function
   * This allows frameworks to provide their own implementation
   */
  loadEnvVars?: (options: Pick<EnvApiHandlerOptions, 'envDir' | 'envFiles'>) => Promise<Record<string, string | undefined>>;

  /**
   * Custom write environment variables function
   * This allows frameworks to provide their own implementation
   */
  writeEnvVars?: (
    variables: Record<string, string>, 
    options: Pick<EnvApiHandlerOptions, 'envDir'>
  ) => Promise<{ path: string }>;
}

// Framework specific request and response types to be provided by framework-specific packages
export interface RequestType {}
export interface ResponseType {}

/**
 * Core handler for the status API endpoint
 * This should be extended by framework-specific implementations
 */
export async function coreStatusHandler(
  requiredVars: string[],
  env: Record<string, string | undefined>
) {
  try {
    // Create schema for validation
    const schema = createEnvSchema(requiredVars);
    
    // Validate environment
    const validationResult = validateEnv(schema, env);
    
    return {
      success: validationResult.success,
      missingVars: validationResult.missingVars || [],
      statusCode: 200
    };
  } catch (error) {
    console.error('Error checking environment variables:', error);
    return {
      success: false,
      missingVars: [],
      error: error instanceof Error ? error.message : String(error),
      statusCode: 500
    };
  }
}

/**
 * Core handler for the update API endpoint
 * This should be extended by framework-specific implementations
 */
export async function coreUpdateHandler(
  variables: Record<string, string>,
  options: EnvApiHandlerOptions,
  writeEnvVars: NonNullable<EnvApiHandlerOptions['writeEnvVars']>
) {
  try {
    // Validate the variables
    if (!variables || typeof variables !== 'object') {
      return {
        success: false,
        error: 'Invalid variables data. Expected object with environment variables.',
        statusCode: 400
      };
    }
    
    // If requiredVars is provided, validate that all required variables are present
    if (options.requiredVars && options.requiredVars.length > 0) {
      const schema = createEnvSchema(options.requiredVars);
      const validationResult = validateEnv(schema, variables);
      
      if (!validationResult.success) {
        return {
          success: false,
          error: 'Missing required environment variables',
          missingVars: validationResult.missingVars,
          statusCode: 400
        };
      }
    }
    
    // Write environment variables
    const result = await writeEnvVars(variables, { envDir: options.envDir });
    
    // Call onUpdate callback if provided
    if (options.onUpdate) {
      await options.onUpdate(variables);
    }
    
    return {
      success: true,
      message: 'Environment variables updated successfully',
      path: result.path,
      statusCode: 200
    };
  } catch (error) {
    console.error('Error updating environment variables:', error);
    return {
      success: false,
      error: 'Failed to update environment variables',
      details: error instanceof Error ? error.message : String(error),
      statusCode: 500
    };
  }
}

/**
 * Create API handler factory
 * This is the main export used by framework-specific packages
 */
export function createApiHandlerFactory<Req extends RequestType, Res extends ResponseType>(
  // These functions are implemented by framework-specific packages
  implementationFunctions: {
    createResponse: (data: any, statusCode: number) => Res;
    getRequiredVarsFromRequest: (req: Req, options: EnvApiHandlerOptions) => Promise<string[]>;
    loadEnvVarsImpl: NonNullable<EnvApiHandlerOptions['loadEnvVars']>;
    writeEnvVarsImpl: NonNullable<EnvApiHandlerOptions['writeEnvVars']>;
    checkProductionAccess: (req: Req, options: EnvApiHandlerOptions) => { allowed: boolean; response?: Res };
    parseRequestBody: (req: Req) => Promise<Record<string, string>>;
  }
) {
  const { 
    createResponse, 
    getRequiredVarsFromRequest, 
    loadEnvVarsImpl, 
    writeEnvVarsImpl, 
    checkProductionAccess,
    parseRequestBody
  } = implementationFunctions;

  return {
    /**
     * Create a status handler for a specific framework
     */
    createStatusHandler: (options: EnvApiHandlerOptions = {}) => {
      return async (request: Req): Promise<Res> => {
        // Check if allowed in production
        const productionCheck = checkProductionAccess(request, options);
        if (!productionCheck.allowed) {
          return productionCheck.response as Res;
        }

        try {
          // Get required vars from request or options
          const requiredVars = await getRequiredVarsFromRequest(request, options);
          
          // Load environment variables
          const loadedEnv = await loadEnvVarsImpl({ 
            envDir: options.envDir, 
            envFiles: options.envFiles 
          });
          
          // Call core handler
          const result = await coreStatusHandler(requiredVars, loadedEnv);
          
          // Return framework-specific response
          return createResponse(
            { 
              success: result.success, 
              missingVars: result.missingVars,
              ...(result.error && { error: result.error })
            }, 
            result.statusCode
          );
        } catch (error) {
          console.error('Error in status handler:', error);
          return createResponse({
            error: 'Failed to check environment status',
            details: error instanceof Error ? error.message : String(error)
          }, 500);
        }
      };
    },

    /**
     * Create an update handler for a specific framework
     */
    createUpdateHandler: (options: EnvApiHandlerOptions = {}) => {
      return async (request: Req): Promise<Res> => {
        // Check if allowed in production
        const productionCheck = checkProductionAccess(request, options);
        if (!productionCheck.allowed) {
          return productionCheck.response as Res;
        }

        try {
          // Parse request body
          const variables = await parseRequestBody(request);
          
          // Call core handler
          const result = await coreUpdateHandler(variables, options, writeEnvVarsImpl);
          
          // Return framework-specific response
          return createResponse(
            { 
              success: result.success, 
              ...(result.message && { message: result.message }),
              ...(result.path && { path: result.path }),
              ...(result.error && { error: result.error }),
              ...(result.details && { details: result.details }),
              ...(result.missingVars && { missingVars: result.missingVars })
            }, 
            result.statusCode
          );
        } catch (error) {
          console.error('Error in update handler:', error);
          return createResponse({
            success: false,
            error: 'Failed to update environment variables',
            details: error instanceof Error ? error.message : String(error)
          }, 500);
        }
      };
    }
  };
}

export type ApiHandlerFactory<Req extends RequestType, Res extends ResponseType> = ReturnType<typeof createApiHandlerFactory<Req, Res>>;

/**
 * Helper type for creating a createEnvApiHandler function
 */
export type CreateEnvApiHandlerType<Req extends RequestType, Res extends ResponseType> = 
  (options?: EnvApiHandlerOptions) => {
    status: (request: Req) => Promise<Res>;
    update: (request: Req) => Promise<Res>;
  };
