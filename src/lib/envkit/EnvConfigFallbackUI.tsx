'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { FallbackUIProps } from './EnvKitProvider';
import { getEnvFilePaths } from './fileUtils';

export interface EnvConfigFallbackUIProps extends FallbackUIProps {
  onEnvSaved?: () => void;
}

export function EnvConfigFallbackUI({ validationResult, onEnvSaved }: EnvConfigFallbackUIProps) {
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitResult, setSubmitResult] = useState<{ success: boolean; message: string } | null>(null);
  const [selectedEnvFile, setSelectedEnvFile] = useState('.env');
  const [availableEnvFiles, setAvailableEnvFiles] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form values from missing variables
  useEffect(() => {
    // Pre-populate form with any default values if available
    const initialValues: Record<string, string> = {};
    validationResult.missingVars.forEach(variable => {
      if (variable.defaultValue) {
        initialValues[variable.name] = variable.defaultValue;
      }
    });
    
    if (Object.keys(initialValues).length > 0) {
      setFormValues(initialValues);
    }
  }, [validationResult.missingVars]);

  // Get available .env files
  useEffect(() => {
    const envFiles = getEnvFilePaths();
    setAvailableEnvFiles(envFiles.map(path => {
      const parts = path.split('/');
      return parts[parts.length - 1];
    }));
    
    if (envFiles.length > 0) {
      const defaultFile = envFiles.find(f => f.endsWith('/.env')) || envFiles[0];
      const parts = defaultFile.split('/');
      setSelectedEnvFile(parts[parts.length - 1]);
    }
  }, []);

  const handleInputChange = useCallback((name: string, value: string) => {
    setFormValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const response = await fetch('/api/envkit/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          envVars: formValues,
          envFile: selectedEnvFile 
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitResult({ success: true, message: 'Environment variables saved. Restarting application...' });
        // Call onEnvSaved callback to refresh env validation
        setTimeout(() => {
          onEnvSaved?.();
          window.location.reload();
        }, 2000);
      } else {
        setSubmitResult({ success: false, message: result.error || 'Failed to save environment variables' });
      }
    } catch (error) {
      setSubmitResult({ success: false, message: 'An error occurred while saving environment variables' });
      console.error('Error saving environment variables:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    setSubmitResult(null);

    try {
      const formData = new FormData();
      formData.append('envFile', file);
      formData.append('targetEnvFile', selectedEnvFile);

      const response = await fetch('/api/envkit/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitResult({ success: true, message: 'Environment file uploaded. Restarting application...' });
        // Call onEnvSaved callback to refresh env validation
        setTimeout(() => {
          onEnvSaved?.();
          window.location.reload();
        }, 2000);
      } else {
        setSubmitResult({ success: false, message: result.error || 'Failed to upload environment file' });
      }
    } catch (error) {
      setSubmitResult({ success: false, message: 'An error occurred while uploading environment file' });
      console.error('Error uploading environment file:', error);
    } finally {
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Environment Configuration Required
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Missing required environment variables. Please provide the values below or upload a .env file.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="mb-6">
            <label htmlFor="env-file-selector" className="block text-sm font-medium text-gray-700 mb-2">
              Target Environment File
            </label>
            <div className="mt-1 flex items-center">
              <select
                id="env-file-selector"
                value={selectedEnvFile}
                onChange={(e) => setSelectedEnvFile(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                disabled={isSubmitting}
              >
                {availableEnvFiles.length > 0 ? (
                  availableEnvFiles.map(file => (
                    <option key={file} value={file}>{file}</option>
                  ))
                ) : (
                  <option value=".env">.env (will be created)</option>
                )}
                {!availableEnvFiles.includes('.env') && (
                  <option value=".env">.env (will be created)</option>
                )}
                {!availableEnvFiles.includes('.env.local') && (
                  <option value=".env.local">.env.local (will be created)</option>
                )}
                {!availableEnvFiles.includes('.env.development') && (
                  <option value=".env.development">.env.development (will be created)</option>
                )}
                {!availableEnvFiles.includes('.env.production') && (
                  <option value=".env.production">.env.production (will be created)</option>
                )}
              </select>
            </div>
            <p className="mt-1 text-xs text-gray-500">
              In a real application, env files are loaded in the following priority order: .env.local, .env.[NODE_ENV].local, .env.[NODE_ENV], .env
            </p>
          </div>

          <div className="mb-6">
            <label htmlFor="file-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Upload .env File
            </label>
            <div className="mt-1 flex items-center">
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".env,.env.*,text/plain"
                className="w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                onChange={handleFileUpload}
                ref={fileInputRef}
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or enter values manually</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              {validationResult.missingVars.map((envVar) => (
                <div key={envVar.name}>
                  <label htmlFor={envVar.name} className="block text-sm font-medium text-gray-700">
                    {envVar.name}
                    {envVar.description && (
                      <span className="ml-1 text-xs text-gray-500">({envVar.description})</span>
                    )}
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      name={envVar.name}
                      id={envVar.name}
                      value={formValues[envVar.name] || ''}
                      onChange={(e) => handleInputChange(envVar.name, e.target.value)}
                      className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder={`Enter ${envVar.name}`}
                      required
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              ))}
            </div>

            {submitResult && (
              <div className={`mt-4 p-3 rounded-md ${submitResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                {submitResult.message}
              </div>
            )}

            <div className="mt-6">
              <button
                type="submit"
                disabled={isSubmitting || validationResult.missingVars.length === 0}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Environment Variables'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
