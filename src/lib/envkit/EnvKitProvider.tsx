'use client';

import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { EnvVarConfig, ValidationResult, validateEnv, isDevEnvironment } from './envValidator';

// Define the FallbackUIProps type that will be exported for use in EnvConfigFallbackUI
export interface FallbackUIProps {
  validationResult: ValidationResult;
}

interface EnvKitContextType {
  isValid: boolean;
  missingVars: EnvVarConfig[];
  allVars: EnvVarConfig[];
  checkEnvironment: () => ValidationResult;
  refreshEnv: () => void;
}

const EnvKitContext = createContext<EnvKitContextType | undefined>(undefined);

export function useEnvKit() {
  const context = useContext(EnvKitContext);
  if (!context) {
    throw new Error('useEnvKit must be used within an EnvKitProvider');
  }
  return context;
}

export interface EnvKitProviderProps {
  children: React.ReactNode;
  envVars: EnvVarConfig[];
  fallbackComponent?: React.ComponentType<FallbackUIProps>;
  /**
   * Whether to fail in production when missing environment variables.
   * Default: true
   */
  failInProduction?: boolean;
  /**
   * Whether to show fallback UI in development mode when missing variables.
   * Default: true
   */
  showFallbackInDev?: boolean;
}

// Default fallback component
function DefaultFallback({ validationResult }: FallbackUIProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-red-600 mb-4">Missing Environment Variables</h2>
        <p className="mb-4">The following environment variables are required but missing:</p>
        <ul className="list-disc pl-5 mb-4">
          {validationResult.missingVars.map((v: EnvVarConfig) => (
            <li key={v.name} className="mb-1">
              {v.name} {v.description ? `- ${v.description}` : ''}
            </li>
          ))}
        </ul>
        <p className="text-sm text-gray-500">
          Please add these variables to your .env file or configure them in your environment.
        </p>
      </div>
    </div>
  );
}

export function EnvKitProvider({
  children,
  envVars,
  fallbackComponent: FallbackComponent = DefaultFallback,
  failInProduction = true,
  showFallbackInDev = true,
}: EnvKitProviderProps) {
  const [validationResult, setValidationResult] = useState<ValidationResult>({
    isValid: true,
    missingVars: [],
    allVars: envVars,
  });
  const [isInitialized, setIsInitialized] = useState(false);
  const [refreshCounter, setRefreshCounter] = useState(0);

  // Use useCallback to prevent recreation of this function on every render
  const checkEnvironment = useCallback(() => {
    // Validate env vars from both process.env and .env files
    const result = validateEnv(envVars);
    setValidationResult(result);
    return result;
  }, [envVars]);

  // Function to force a refresh of environment validation
  const refreshEnv = useCallback(() => {
    setRefreshCounter(prev => prev + 1);
  }, []);

  useEffect(() => {
    // Validate environment variables on mount and when refresh is triggered
    const result = checkEnvironment();
    setIsInitialized(true);

    // In production, we want to throw an error if env is invalid and failInProduction is true
    if (!result.isValid && !isDevEnvironment() && failInProduction && typeof window !== 'undefined') {
      throw new Error(
        `Missing required environment variables: ${result.missingVars.map(v => v.name).join(', ')}`
      );
    }
  }, [checkEnvironment, failInProduction, refreshCounter]); // Added refreshCounter dependency

  const value = {
    ...validationResult,
    checkEnvironment,
    refreshEnv
  };

  if (!isInitialized) {
    return null; // Initial loading state
  }

  // In development, show fallback UI if environment is invalid and showFallbackInDev is true
  if (!validationResult.isValid && isDevEnvironment() && showFallbackInDev) {
    return <FallbackComponent validationResult={validationResult} />;
  }

  return (
    <EnvKitContext.Provider value={value}>
      {children}
    </EnvKitContext.Provider>
  );
}
