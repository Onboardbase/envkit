import { object, string, optional, ValiError, safeParse } from 'valibot';

/**
 * Creates a validation schema for environment variables
 * @param requiredVars Array of required environment variable names
 * @param optionalVars Array of optional environment variable names
 * @returns A Valibot schema for validating environment variables
 */
export function createEnvSchema(requiredVars: string[], optionalVars: string[] = []) {
  // Create schema properties for required variables
  const requiredProps = requiredVars.reduce((acc, key) => {
    acc[key] = string();
    return acc;
  }, {} as Record<string, any>);

  // Create schema properties for optional variables
  const optionalProps = optionalVars.reduce((acc, key) => {
    acc[key] = optional(string());
    return acc;
  }, {} as Record<string, any>);

  // Combine them into a single schema
  return object({
    ...requiredProps,
    ...optionalProps,
  });
}

/**
 * Validates the environment variables against the schema
 * @param schema The validation schema
 * @param env The environment variables to validate
 * @returns Result object with success flag, parsed values, and missing variables
 */
export function validateEnv(schema: any, env: Record<string, string | undefined>) {
  const result = safeParse(schema, env);
  
  const missingVars: string[] = [];
  
  if (!result.success && result.issues instanceof ValiError) {
    // Extract the missing variable names from the validation error
    result.issues.forEach(issue => {
      if (issue.path && issue.path.length > 0) {
        const path = issue.path[0];
        if (typeof path.key === 'string') {
          missingVars.push(path.key);
        }
      }
    });
  }

  return {
    success: result.success,
    data: result.success ? result.output : null,
    missingVars,
  };
}

/**
 * Gets missing environment variables based on required vars
 * @param requiredVars Array of required environment variable names
 * @param env The environment variables to check
 * @returns Array of missing variable names
 */
export function getMissingEnvVars(requiredVars: string[], env: Record<string, string | undefined>) {
  return requiredVars.filter(key => !env[key]);
}
