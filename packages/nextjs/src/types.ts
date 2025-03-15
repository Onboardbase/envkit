import type { ReactNode } from 'react';

export interface EnvVarStatus {
  success: boolean;
  missingVars: string[];
  error?: string;
  config?: EnvSetupConfig;
}

export interface EnvSetupConfig {
  requiredVars: string[];
  fallbackUI?: ReactNode;
  customComponents?: {
    EnvSetupForm?: ReactNode;
    EnvVarInput?: ReactNode;
  };
}

export interface NextEnvKitOptions {
  envDir?: string;
  envFiles?: string[];
  requiredVars?: string[];
  fallbackUI?: ReactNode;
  customComponents?: {
    EnvSetupForm?: ReactNode;
    EnvVarInput?: ReactNode;
  };
}
