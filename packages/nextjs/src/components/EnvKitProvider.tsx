'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { envKitApi } from '../api';
import { DefaultFallbackUI } from './DefaultFallbackUI';

// Define types for environment variable information
export interface EnvVarInfo {
  key: string;
  value?: string;
  description?: string;
  label?: string;
  secret?: boolean;
  placeholder?: string;
}

export interface FallbackUIProps {
  missingVars: EnvVarInfo[];
  isLoading: boolean;
  onComplete: () => void;
}

interface EnvKitProviderProps {
  /**
   * React children
   */
  children: ReactNode;
  
  /**
   * Environment variables that are required for the application to run
   */
  requiredVars: string[];
  
  /**
   * Path to redirect to when environment variables are missing
   * @default '/env-setup'
   */
  fallbackPath?: string;
  
  /**
   * Whether the application is running in production mode
   * @default process.env.NODE_ENV === 'production'
   */
  isProduction?: boolean;
  
  /**
   * Custom component to render when environment variables are missing
   * @default DefaultFallbackUI
   */
  customFallbackUI?: React.ComponentType<FallbackUIProps>;
  
  /**
   * Callback when missing vars are detected
   */
  onMissingVars?: (missingVars: string[]) => void;
}

/**
 * EnvKitProvider component that wraps the application and handles missing environment variables
 * Compatible with Next.js and App Router
 */
export function EnvKitProvider({
  children,
  requiredVars,
  fallbackPath = '/env-setup',
  isProduction = process.env.NODE_ENV === 'production',
  customFallbackUI: CustomFallbackUI,
  onMissingVars,
}: EnvKitProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [missingVars, setMissingVars] = useState<EnvVarInfo[]>([]);
  const [isReady, setIsReady] = useState(false);
  
  // Use the fallback UI if provided, otherwise use the default
  const FallbackUI = CustomFallbackUI || DefaultFallbackUI;
  
  useEffect(() => {
    const checkEnvironmentVariables = async () => {
      try {
        // Check environment variables on client side
        const result = await envKitApi.checkStatus();
        
        if (!result.success) {
          // If there are missing vars, update state
          const missingEnvVars = result.missingVars.map(key => ({
            key,
            value: '',
            description: `Required environment variable: ${key}`
          }));
          
          setMissingVars(missingEnvVars);
          
          // Call onMissingVars callback if provided
          if (onMissingVars) {
            onMissingVars(result.missingVars);
          }
          
          // If we're not already on the fallback path and we're not in production
          // Redirect to the fallback path
          if (pathname !== fallbackPath && !isProduction) {
            router.push(fallbackPath);
          }
        } else {
          // If all variables are set, mark as ready
          setIsReady(true);
        }
      } catch (error) {
        console.error('Error checking environment variables:', error);
        // If there's an error, we still want to mark as ready to avoid blocking the app
        setIsReady(true);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkEnvironmentVariables();
  }, [requiredVars, fallbackPath, pathname, router, isProduction, onMissingVars]);
  
  // Handle completion of environment variable setup
  const handleComplete = () => {
    // Mark as ready and redirect to the home page
    setIsReady(true);
    if (pathname === fallbackPath) {
      router.push('/');
    }
  };
  
  // If we're loading or on the fallback path with missing vars, show the fallback UI
  if (!isReady && (isLoading || (pathname === fallbackPath && missingVars.length > 0))) {
    return (
      <FallbackUI
        missingVars={missingVars}
        isLoading={isLoading}
        onComplete={handleComplete}
      />
    );
  }
  
  // Otherwise, render the children
  return <>{children}</>;
}

export default EnvKitProvider;
