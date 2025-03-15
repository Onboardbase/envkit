/**
 * @envkit/core
 * Framework-agnostic core functionality for EnvKit
 */

// Export API modules
export * from './api';

// Export schema utilities
export * from './schema';

// Export server utilities
export * from './server';

// Export client utilities
export * from './client';

// Direct export of specific APIs that might be imported directly
// This ensures backward compatibility with code that imports directly from '@envkit/core'
export { createApiHandlerFactory } from './api';

