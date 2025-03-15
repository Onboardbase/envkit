'use client';

import React, { useState } from 'react';
import { FallbackUIProps, EnvVarInfo } from './EnvKitProvider';
import { envKitApi } from '../api';

/**
 * Default fallback UI for EnvKit
 * This component is used when environment variables are missing
 * Users can customize this or create their own component
 */
export function DefaultFallbackUI({ missingVars, isLoading, onComplete }: FallbackUIProps) {
  const [envVars, setEnvVars] = useState<(EnvVarInfo & { value: string })[]>(
    missingVars.map(v => ({ ...v, value: '' }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (index: number, value: string) => {
    const updatedVars = [...envVars];
    updatedVars[index].value = value;
    setEnvVars(updatedVars);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const content = await readFileContent(file);
      
      if (file.name.endsWith('.env')) {
        // Parse .env file
        const parsedVars = parseEnvFile(content);
        updateEnvVarsFromParsed(parsedVars);
      } else if (file.name.endsWith('.json')) {
        // Parse JSON file
        try {
          const parsedJson = JSON.parse(content);
          updateEnvVarsFromParsed(parsedJson);
        } catch (err) {
          setError('Invalid JSON file format');
        }
      } else {
        setError('Unsupported file format. Please upload a .env or .json file');
      }
    } catch (err) {
      setError('Failed to read the uploaded file');
      console.error(err);
    }
  };

  const updateEnvVarsFromParsed = (parsedVars: Record<string, string>) => {
    // Update only the variables that are in our list
    const updatedVars = [...envVars];
    
    updatedVars.forEach((envVar, index) => {
      if (parsedVars[envVar.key]) {
        updatedVars[index].value = parsedVars[envVar.key];
      }
    });
    
    setEnvVars(updatedVars);
  };

  const parseEnvFile = (content: string): Record<string, string> => {
    const result: Record<string, string> = {};
    
    content.split('\n').forEach(line => {
      // Skip comments and empty lines
      if (line.trim().startsWith('#') || !line.trim()) {
        return;
      }
      
      // Split by first equals sign
      const equalSignIndex = line.indexOf('=');
      if (equalSignIndex > 0) {
        const key = line.substring(0, equalSignIndex).trim();
        let value = line.substring(equalSignIndex + 1).trim();
        
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || 
            (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        
        result[key] = value;
      }
    });
    
    return result;
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Convert to key-value pairs for API
      const variables: Record<string, string> = {};
      envVars.forEach(v => {
        variables[v.key] = v.value;
      });
      
      // Make API call to update variables
      const result = await envKitApi.updateVariables(variables);
      
      if (result.success) {
        setSuccess('Environment variables updated successfully!');
        setTimeout(() => {
          if (onComplete) {
            onComplete();
          }
        }, 1500);
      } else {
        setError(result.error || 'Failed to update environment variables');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // If still loading, show a spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-24">
        <div className="w-16 h-16 border-t-4 border-blue-500 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-xl font-semibold">Loading environment configuration...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gray-50">
      <div className="w-full max-w-xl p-6 rounded-lg shadow-md bg-white">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Environment Setup</h1>
        
        {missingVars.length === 0 ? (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            <p>All required environment variables are set! You can now proceed.</p>
            <button 
              onClick={onComplete} 
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Continue to Application
            </button>
          </div>
        ) : (
          <>
            <p className="mb-6 text-gray-600">
              The following environment variables are required to run the application. 
              Please fill them in below:
            </p>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                <span className="block sm:inline">{error}</span>
              </div>
            )}
            
            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                <span className="block sm:inline">{success}</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                {envVars.map((envVar, index) => (
                  <div key={envVar.key} className="mb-4">
                    <label 
                      htmlFor={`env-${envVar.key}`} 
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      {envVar.label || envVar.key}
                      {envVar.description && (
                        <span className="ml-1 text-xs text-gray-500">({envVar.description})</span>
                      )}
                    </label>
                    <input
                      type={envVar.secret ? "password" : "text"}
                      id={`env-${envVar.key}`}
                      value={envVar.value}
                      onChange={(e) => handleInputChange(index, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={envVar.placeholder || `Enter ${envVar.key}`}
                    />
                  </div>
                ))}
              </div>
              
              <div className="mt-6 flex flex-wrap gap-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Saving...' : 'Save Environment Variables'}
                </button>
                
                <div className="relative">
                  <label 
                    htmlFor="file-upload" 
                    className="cursor-pointer px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                  >
                    Import from File
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".env,.json"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                  />
                </div>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default DefaultFallbackUI;
