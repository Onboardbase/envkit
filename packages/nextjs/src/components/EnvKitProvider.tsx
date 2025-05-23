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

export type MissingVar = EnvVarInfo;
export type OnFallbackSubmit = () => void;

export interface FallbackUIProps {
  missingVars: MissingVar[];
  isLoading: boolean;
  onSubmit: OnFallbackSubmit;
  /**
   * Optional logo URL to display instead of the default Onboardbase logo
   */
  logoUrl?: string;
  /**
   * Optional title to display at the top of the form
   */
  title?: string;
  /**
   * Optional description text to display below the title
   */
  description?: string;
  /**
   * When true, all environment variables will be masked by default
   * Users can toggle visibility for individual variables
   */
  maskAllEnvs?: boolean;
  /**
   * When true, users cannot add new environment variables
   * Only the required variables will be shown
   */
  disableAddNew?: boolean;
}

interface EnvKitProviderProps {
  /**
   * React children
   */
  children: ReactNode;
  
  /**
   * Environment variables that are required for the application to run
   * This is only needed on the backend side and is optional in the component props
   * @deprecated This prop is only needed on the backend side
   */
  requiredVars?: string[];
  
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
   * Optional URL to a logo to display in the fallback UI
   */
  logoUrl?: string;
  /**
   * Optional title to display at the top of the fallback UI
   */
  title?: string;
  /**
   * Optional description to display below the title in the fallback UI
   */
  description?: string;
  
  /**
   * Custom component to render when environment variables are missing
   * @default DefaultFallbackUI
   */
  customFallbackUI?: React.ComponentType<FallbackUIProps>;
  
  /**
   * Callback when missing vars are detected
   */
  onMissingVars?: (missingVars: string[]) => void;

  /**
   * When true, all environment variables will be masked by default
   * Users can toggle visibility for individual variables
   * @default false
   */
  maskAllEnvs?: boolean;

  /**
   * When true, users cannot add new environment variables
   * Only the required variables will be shown
   * @default false
   */
  disableAddNew?: boolean;
}

/**
 * EnvKitProvider component that wraps the application and handles missing environment variables
 * Compatible with Next.js and App Router
 */
export function EnvKitProvider({
  children,
  requiredVars = [],
  fallbackPath = '/env-setup',
  isProduction = process.env.NODE_ENV === 'production',
  customFallbackUI: CustomFallbackUI,
  logoUrl,
  title,
  description,
  onMissingVars,
  maskAllEnvs = false,
  disableAddNew = false,
}: EnvKitProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [missingVars, setMissingVars] = useState<EnvVarInfo[]>([]);
  const [isReady, setIsReady] = useState(false);
  
  // Use the fallback UI if provided, otherwise use the default
  const FallbackUI = CustomFallbackUI || DefaultFallbackUI;
  
  // Use a ref to track if we've already checked for missing variables
  // This prevents multiple API calls in development mode due to React's StrictMode
  const isFirstRender = React.useRef(true);
  
  useEffect(() => {
    
    const checkEnvironmentVariables = async () => {
      try {
        // Check environment variables on client side with cache control
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
    
    // Only run on first render or when pathname changes
    if (isFirstRender.current || pathname === fallbackPath) {
      isFirstRender.current = false;
      checkEnvironmentVariables();
    }
  }, [pathname, fallbackPath, isProduction, router, onMissingVars]);
  
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
    if (CustomFallbackUI) {
      return (
        <CustomFallbackUI
          missingVars={missingVars}
          isLoading={isLoading}
          onSubmit={handleComplete}
          logoUrl={logoUrl}
          title={title}
          description={description}
          maskAllEnvs={maskAllEnvs}
          disableAddNew={disableAddNew}
        />
      );
    }

    // Otherwise use the default UI
    return (
      <DefaultFallbackUI
        missingVars={missingVars}
        onSubmit={handleComplete}
        logoUrl={logoUrl}
        title={title}
        description={description}
        isLoading={isLoading}
        maskAllEnvs={maskAllEnvs}
        disableAddNew={disableAddNew}
      />
    );
  }
  
  // Otherwise, render the children
  return <>{children}</>;
}

export default EnvKitProvider;
