// Client-side exports
// =================

// Export components
export { default as EnvKitProvider } from './components/EnvKitProvider';
export { default as DefaultFallbackUI } from './components/DefaultFallbackUI';
export type { EnvVarInfo, FallbackUIProps } from './components/EnvKitProvider';

// Export utilities
export { createEnvSchema, validateEnv, getMissingEnvVars } from './schema';
export { createEnvKit, EnvKit } from './client';
export type { EnvKitConfig } from './client';

// Export client-side API utilities
export { envKitApi, EnvKitApi } from './api';
export type { EnvKitApiOptions, EnvVarUpdatePayload, EnvVarStatus } from './api';

// Note: Server-side code is exported from './server' and should only be imported
// in server components or API routes using dynamic imports
