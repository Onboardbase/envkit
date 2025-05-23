'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MissingVar, OnFallbackSubmit, EnvVarInfo } from './EnvKitProvider';
import { envKitApi } from '../api';

/**
 * Default fallback UI for EnvKit
 * This component is used when environment variables are missing
 * Users can customize this or create their own component
 */
export interface DefaultFallbackUIProps {
  missingVars: MissingVar[];
  onSubmit: OnFallbackSubmit;
  isLoading?: boolean;
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

export function DefaultFallbackUI({ 
  missingVars, 
  onSubmit,
  logoUrl,
  title = 'Welcome to the team',
  description = 'The following environment variables are required for this application to function properly.',
  isLoading,
  maskAllEnvs = false,
  disableAddNew = false
}: DefaultFallbackUIProps) {
  const [envVars, setEnvVars] = useState<(EnvVarInfo & { value: string, masked?: boolean })[]>(
    missingVars.map(v => ({ ...v, value: '', masked: maskAllEnvs || v.secret }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pasteStatus, setPasteStatus] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // Parse env var content from pasted text
  const parseEnvVarContent = (content: string): { key: string; value: string }[] => {
    const result: { key: string; value: string }[] = [];
    
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
        
        result.push({ key, value });
      }
    });
    
    return result;
  };

  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      // Get the clipboard data
      const pastedData = e.clipboardData?.getData('text') || '';
      
      if (!pastedData.trim()) return;
      
      // Try to parse the pasted content as key=value pairs
      const newEnvVars = parseEnvVarContent(pastedData);
      if (newEnvVars.length > 0) {
        // If we successfully parsed env vars, update the state
        setEnvVars(prev => {
          // Create a map of existing keys for quick lookup
          const existingKeys = new Map(prev.map(env => [env.key, env]));
          
          // Process new env vars
          newEnvVars.forEach(newVar => {
            // If this key already exists, update its value
            if (existingKeys.has(newVar.key)) {
              const existingVar = existingKeys.get(newVar.key);
              if (existingVar) {
                existingVar.value = newVar.value;
              }
            } else {
              // Otherwise add it to the map
              existingKeys.set(newVar.key, newVar);
            }
          });
          
          // Convert back to array
          return Array.from(existingKeys.values());
        });
        
        setPasteStatus(`Successfully parsed ${newEnvVars.length} environment variables.`);
        setTimeout(() => setPasteStatus(''), 3000);
      }
    };
    
    // Add the global paste event listener
    document.addEventListener('paste', handleGlobalPaste);
    
    // Clean up the event listener when the component unmounts
    return () => {
      document.removeEventListener('paste', handleGlobalPaste);
    };
  }, [parseEnvVarContent]); // Add parseEnvVarContent to dependencies

  const handleInputChange = (index: number, value: string) => {
    const updatedVars = [...envVars];
    updatedVars[index].value = value;
    setEnvVars(updatedVars);
  };

  const handleInputPaste = (e: React.ClipboardEvent<HTMLInputElement>, index: number) => {
    // This now handles individual input field pastes, but the global handler will also fire
    const pastedContent = e.clipboardData.getData('text');
    
    // If the pasted content looks like key=value pairs (contains = or line breaks)
    // let the global paste handler deal with it
    if (pastedContent.includes('=') || pastedContent.includes('\n')) {
      // Don't prevent default as the global handler will process this
      return;
    }
    
    // Otherwise, just update this specific field's value (normal paste behavior)
    const updatedEnvVars = [...envVars];
    updatedEnvVars[index] = { ...updatedEnvVars[index], value: pastedContent };
    setEnvVars(updatedEnvVars);
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

  const updateEnvVarsFromParsed = (parsedVars: Record<string, string>, index?: number) => {
    // Update only the variables that are in our list
    const updatedVars = [...envVars];
    const existingKeys = new Set(updatedVars.map(v => v.key));
    
    // Update existing variables
    updatedVars.forEach((envVar, envVarIndex) => {
      if (parsedVars[envVar.key]) {
        updatedVars[envVarIndex].value = parsedVars[envVar.key];
      }
    });
    
    // Add new variables that don't exist in our list
    Object.entries(parsedVars).forEach(([key, value]) => {
      if (!existingKeys.has(key)) {
        if (index !== undefined) {
          updatedVars.splice(index, 0, {
            key,
            label: key,
            value,
            secret: false,
            description: `Added from paste operation`
          });
        } else {
          updatedVars.push({
            key,
            label: key,
            value,
            secret: false,
            description: `Added from paste operation`
          });
        }
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

  const parseEnvVars = (content: string): Record<string, string> => {
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

  const addNewEnvVar = () => {
    setEnvVars([
      ...envVars,
      {
        key: '',
        value: '',
        secret: false,
      }
    ])
  }

  const handleKeyChange = (index: number, newKey: string) => {
    const updatedEnvVars = [...envVars]
    updatedEnvVars[index] = {
      ...updatedEnvVars[index],
      key: newKey
    }
    setEnvVars(updatedEnvVars)
  }

  const deleteEnvVar = (index: number) => {
    // Check if it's a required field
    const envVar = envVars[index];
    if (missingVars.find(v => v.key === envVar.key)) {
      // Don't allow deletion of required fields
      return;
    }
    
    const updatedEnvVars = [...envVars];
    updatedEnvVars.splice(index, 1);
    setEnvVars(updatedEnvVars);
  }

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
          if (onSubmit) {
            onSubmit();
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

  // Function to toggle masking for a specific environment variable
  const toggleMasking = (index: number) => {
    setEnvVars(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        masked: !updated[index].masked
      };
      return updated;
    });
  };

  // If still loading, show a spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen antialiased flex-col items-center justify-center p-24 bg-black font-normal tracking-[0.6px]">
        <div className="mb-5">
          <div className="flex items-center space-x-2 text-white">
            <div className='w-5 h-5 flex items-center justify-center'>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-5 w-auto" />
              ) : (
                <svg className="text-white w-full h-full" viewBox="0 0 370 370" fill="#ffffff" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M78.625 37C67.5854 37 56.9979 41.3855 49.1917 49.1917C41.3855 56.9979 37 67.5854 37 78.625V291.375C37 302.415 41.3855 313.002 49.1917 320.808C56.9979 328.615 67.5854 333 78.625 333H291.375C302.415 333 313.002 328.615 320.808 320.808C328.615 313.002 333 302.415 333 291.375V78.625C333 67.5854 328.615 56.9979 320.808 49.1917C313.002 41.3855 302.415 37 291.375 37H78.625ZM153.18 153.18C155.631 150.55 156.965 147.071 156.902 143.476C156.838 139.882 155.382 136.452 152.84 133.91C150.298 131.368 146.868 129.912 143.274 129.848C139.679 129.785 136.2 131.119 133.57 133.57L91.945 175.195C89.3467 177.797 87.8872 181.323 87.8872 185C87.8872 188.677 89.3467 192.203 91.945 194.805L133.57 236.43C136.2 238.881 139.679 240.215 143.274 240.152C146.868 240.088 150.298 238.632 152.84 236.09C155.382 233.548 156.838 230.118 156.902 226.524C156.965 222.929 155.631 219.45 153.18 216.82L121.36 185L153.18 153.18ZM236.43 133.57C235.16 132.207 233.628 131.113 231.926 130.355C230.224 129.597 228.387 129.189 226.524 129.156C224.661 129.123 222.81 129.466 221.082 130.164C219.355 130.862 217.785 131.9 216.468 133.218C215.15 134.535 214.112 136.105 213.414 137.832C212.716 139.56 212.373 141.411 212.406 143.274C212.439 145.137 212.847 146.974 213.605 148.676C214.363 150.378 215.457 151.91 216.82 153.18L248.64 185L216.82 216.82C215.457 218.09 214.363 219.622 213.605 221.324C212.847 223.026 212.439 224.863 212.406 226.726C212.373 228.589 212.716 230.44 213.414 232.168C214.112 233.895 215.15 235.465 216.468 236.782C217.785 238.1 219.355 239.138 221.082 239.836C222.81 240.534 224.661 240.877 226.524 240.844C228.387 240.811 230.224 240.403 231.926 239.645C233.628 238.887 235.16 237.793 236.43 236.43L278.055 194.805C280.653 192.203 282.113 188.677 282.113 185C282.113 181.323 280.653 177.797 278.055 175.195L236.43 133.57Z" fill="#ffffff"/>
                </svg>
              )}
            </div>
            <span className="text-xl font-semibold">EnvKit</span>
          </div>
          <p className="text-[#888F96] text-xs">The world's first Env box.</p>
        </div>
        <div className="w-8 h-8 border-t-4 border-blue-300 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-white">Loading environment configuration...</p>
      </div>
    );
  }

  if (missingVars.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/15 text-green-500 px-4 py-3 rounded mb-4">
        <p>All required environment variables are set! You can now proceed.</p>
        <button 
          onClick={onSubmit} 
          className="mt-4 w-full md:flex-1 flex justify-center min-w-fit rounded-md cursor-pointer border border-transparent bg-white px-8 py-2 text-sm font-medium leading-6 text-black hover:bg-gray-400 transition-colors"
        >
          Continue to application
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen antialiased flex-col items-center justify-center p-6 md:p-24 bg-black overflow-hidden relative">
      {/* Moon */}
      <div className="fixed top-12 right-12 pointer-events-none">
        <div className="moon relative w-16 h-16 rounded-full bg-gradient-to-b from-[#ffffff] via-[#f4f4f4] to-[#e8e8e8]">
          {/* Main craters */}
          <div className="absolute top-3 left-3 w-2.5 h-2.5 rounded-full bg-[#00000015]"></div>
          <div className="absolute top-6 right-4 w-3 h-3 rounded-full bg-[#00000010]"></div>
          <div className="absolute bottom-4 left-5 w-2 h-2 rounded-full bg-[#00000015]"></div>
          {/* Secondary craters */}
          <div className="absolute top-4 left-7 w-1.5 h-1.5 rounded-full bg-[#00000008]"></div>
          <div className="absolute top-8 right-7 w-2 h-2 rounded-full bg-[#00000010]"></div>
          <div className="absolute bottom-6 right-3 w-1 h-1 rounded-full bg-[#00000012]"></div>
          <div className="absolute bottom-7 left-8 w-1.5 h-1.5 rounded-full bg-[#00000008]"></div>
          <div className="absolute top-9 left-9 w-2 h-2 rounded-full bg-[#00000010]"></div>
          {/* Texture overlay */}
          <div className="absolute inset-0 rounded-full opacity-20 mix-blend-overlay" style={{
            background: `radial-gradient(circle at 30% 30%, transparent 0%, rgba(0,0,0,0.2) 100%),
                        radial-gradient(circle at 70% 70%, transparent 0%, rgba(0,0,0,0.2) 100%)`
          }}></div>
          {/* Moon glow */}
          <div className="absolute -inset-4 rounded-full opacity-30" style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,0.8) 0%, transparent 70%)'
          }}></div>
          {/* Outer glow */}
          <div className="absolute -inset-6 rounded-full opacity-10" style={{
            background: 'radial-gradient(circle at center, rgba(255,255,255,1) 0%, transparent 70%)'
          }}></div>
        </div>
      </div>

      {/* Stars */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="star-small animate-twinkle-1" style={{ top: '15%', left: '10%' }}></div>
        <div className="star-medium animate-twinkle-2" style={{ top: '25%', left: '85%' }}></div>
        <div className="star-small animate-twinkle-3" style={{ top: '45%', left: '15%' }}></div>
        <div className="star-large animate-twinkle-1" style={{ top: '65%', left: '75%' }}></div>
        <div className="star-medium animate-twinkle-2" style={{ top: '85%', left: '25%' }}></div>
        <div className="star-small animate-twinkle-3" style={{ top: '10%', left: '45%' }}></div>
        <div className="star-large animate-twinkle-2" style={{ top: '35%', left: '65%' }}></div>
        <div className="star-medium animate-twinkle-1" style={{ top: '75%', left: '90%' }}></div>
        <div className="star-small animate-twinkle-2" style={{ top: '55%', left: '5%' }}></div>
        <div className="star-large animate-twinkle-3" style={{ top: '15%', left: '95%' }}></div>
      </div>

      {/* Glowing orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-blue-500/20 blur-[120px] animate-pulse-slow"></div>
        <div className="absolute -bottom-[30%] -right-[20%] w-[75%] h-[75%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse-slower"></div>
        <div className="absolute top-[20%] right-[10%] w-[50%] h-[50%] rounded-full bg-cyan-500/20 blur-[100px] animate-pulse-slowest"></div>
      </div>

      <div className="relative w-full max-w-xl">
        {/* Hero section */}
        <div className="text-white w-full md:w-64 mx-auto text-center mb-10">
          <div className="relative">  
                <div className="font-bold text-6xl text-blue-300">
                  <span className="inline-block">Envkit</span>
            </div>
            
            {/* Decorative line with dots */}
            <div className="flex items-center justify-center gap-2 my-4">
              <div className="w-2 h-2 rounded-full bg-blue-300/20"></div>
              <div className="w-12 h-0.5 bg-blue-300/30 rounded-full"></div>
              <div className="w-2 h-2 rounded-full bg-blue-300/20"></div>
            </div>
            
            <div className="text-[#888F96] mt-2 relative">
              The world's first 
              <span className="font-mono font-semibold text-white relative group inline-flex items-center mx-1">
                <span className="opacity-50">&lt;</span>
                <span className="relative inline-block">Env</span>
                <span className="opacity-50">/&gt;</span>
              </span> 
              box, powered by Onboardbase.
            </div>
          </div>
        </div>

        {/* Content card */}
        <div className="rounded-xl bg-gray-500/10 backdrop-blur-xl border-gray-500/15 border relative">
          <div className="w-full p-4 flex items-center space-x-6 border-b border-gray-500/15">
            <div className="flex items-center justify-center">
              <div className="w-8 h-8 flex items-center justify-center rounded-sm">
                { logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain object-center" />
                ):
                (
                  <svg className="text-white w-full h-full" viewBox="0 0 370 370" fill="#ffffff" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M78.625 37C67.5854 37 56.9979 41.3855 49.1917 49.1917C41.3855 56.9979 37 67.5854 37 78.625V291.375C37 302.415 41.3855 313.002 49.1917 320.808C56.9979 328.615 67.5854 333 78.625 333H291.375C302.415 333 313.002 328.615 320.808 320.808C328.615 313.002 333 302.415 333 291.375V78.625C333 67.5854 328.615 56.9979 320.808 49.1917C313.002 41.3855 302.415 37 291.375 37H78.625ZM153.18 153.18C155.631 150.55 156.965 147.071 156.902 143.476C156.838 139.882 155.382 136.452 152.84 133.91C150.298 131.368 146.868 129.912 143.274 129.848C139.679 129.785 136.2 131.119 133.57 133.57L91.945 175.195C89.3467 177.797 87.8872 181.323 87.8872 185C87.8872 188.677 89.3467 192.203 91.945 194.805L133.57 236.43C136.2 238.881 139.679 240.215 143.274 240.152C146.868 240.088 150.298 238.632 152.84 236.09C155.382 233.548 156.838 230.118 156.902 226.524C156.965 222.929 155.631 219.45 153.18 216.82L121.36 185L153.18 153.18ZM236.43 133.57C235.16 132.207 233.628 131.113 231.926 130.355C230.224 129.597 228.387 129.189 226.524 129.156C224.661 129.123 222.81 129.466 221.082 130.164C219.355 130.862 217.785 131.9 216.468 133.218C215.15 134.535 214.112 136.105 213.414 137.832C212.716 139.56 212.373 141.411 212.406 143.274C212.439 145.137 212.847 146.974 213.605 148.676C214.363 150.378 215.457 151.91 216.82 153.18L248.64 185L216.82 216.82C215.457 218.09 214.363 219.622 213.605 221.324C212.847 223.026 212.439 224.863 212.406 226.726C212.373 228.589 212.716 230.44 213.414 232.168C214.112 233.895 215.15 235.465 216.468 236.782C217.785 238.1 219.355 239.138 221.082 239.836C222.81 240.534 224.661 240.877 226.524 240.844C228.387 240.811 230.224 240.403 231.926 239.645C233.628 238.887 235.16 237.793 236.43 236.43L278.055 194.805C280.653 192.203 282.113 188.677 282.113 185C282.113 181.323 280.653 177.797 278.055 175.195L236.43 133.57Z" fill="#ffffff"/>
                  </svg>
                )}
              </div>
            </div>
            <div>
              <h1 className="font-semibold text-base text-white md:text-lg">{title}</h1>
              <p className="text-[#888F96] text-sm leading-5">
                {description}
              </p>
            </div>
          </div>
          {missingVars.length === 0 ? (
            <div className="bg-green-500/5 border border-green-500/10 text-green-300 px-4 py-3 rounded mb-4">
              <p>All required environment variables are set! You can now proceed.</p>
              <button 
                onClick={onSubmit} 
                className="mt-4 w-full md:flex-1 flex justify-center min-w-fit rounded-md cursor-pointer border border-transparent bg-white px-8 py-2 text-sm font-medium leading-6 text-black hover:bg-gray-400 transition-colors"
              >
                Continue to application
              </button>
            </div>
          ) : (
            <div>
                {/* <p className="mb-6 text-[#888F96] text-xs leading-5 p-4">
                  The following environment variables are required to run this application. 
                  Please fill them in below:
                </p> */}
                
              {error && (
                <div className="bg-red-500/5 border text-xs border-red-500/10 text-red-300 px-4 py-3 rounded mb-4">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              <form onSubmit={handleSubmit} className="w-full flex flex-col">
                <div className={`w-full overflow-hidden border-b border-gray-500/15`}>
                  <div className={`p-4 relative ${envVars.length > 5 ? 'max-h-[400px] overflow-y-auto' : ''}`}>
                    {/* Success message */}
                    {success && (
                      <div className="w-full mb-4 p-2 bg-green-500/5 border border-green-500/10 rounded-md text-center">
                        <p className="text-green-300 text-sm">{success}</p>
                      </div>
                    )}

                    {/* Paste Status */}
                    {pasteStatus && (
                      <div className="w-full mb-4 p-2 bg-blue-500/5 border border-blue-500/10 rounded-md text-center">
                        <p className="text-blue-300 text-sm">{pasteStatus}</p>
                      </div>
                    )}
                    
                    <div className="">
                      {/* Header row */}
                      <div className="header-row grid grid-cols-2 gap-3 items-center w-full text-sm text-white font-medium pb-1">
                        <div>Key</div>
                        <div>Value</div>
                      </div>
                      
                      <div className="space-y-2">
                        {/* Sort to put required vars at the top */}
                        {envVars
                          .map((envVar, index) => ({ envVar, index, isRequired: !!missingVars.find(v => v.key === envVar.key) }))
                          .sort((a, b) => {
                            // Required vars come first
                            if (a.isRequired && !b.isRequired) return -1;
                            if (!a.isRequired && b.isRequired) return 1;
                            // Then sort by original index
                            return a.index - b.index;
                          })
                          .map(({ envVar, index, isRequired }) => (
                          <div key={envVar.key || `new-env-${index}`} className="grid grid-cols-2 gap-3 items-center w-full group">
                            <div className="relative">
                              <input
                                type="text"
                                id={`env-key-${index}`}
                                value={envVar.key}
                                onChange={(e) => handleKeyChange(index, e.target.value)}
                                className={`w-full px-3 py-1.5 font-mono border sm:leading-6 text-xs text-white bg-gray-500/5 placeholder:text-gray-500 rounded-md focus:outline-none focus:ring-0 focus:border-gray-500/15 ${isRequired ? 'border-gray-500/15' : 'border-gray-500/15'}`}
                                placeholder="ENV_KEY"
                                disabled={isRequired}
                              />
                              {isRequired && (
                                <span className="absolute -top-2 right-2 font-medium rounded-full bg-[#152b4e] text-blue-300 px-1.5 py-0.5 text-[8px] uppercase">Required</span>
                              )}
                            </div>
                            <div className="flex items-center w-full">
                              <div className="flex items-center w-full bg-gray-500/5 border-gray-500/15 border rounded-md">
                                <input
                                  type={envVar.masked ? "password" : "text"}
                                  id={`env-${envVar.key || `value-${index}`}`}
                                  value={envVar.value}
                                  onChange={(e) => handleInputChange(index, e.target.value)}
                                  onPaste={(e) => handleInputPaste(e, index)}
                                  className={`w-full px-3 py-1.5 font-mono border sm:leading-6 text-xs text-white bg-transparent placeholder:text-gray-500 border-none focus:outline-none focus:ring-0 focus:border-none ${isRequired ? 'border-gray-500/15' : 'border-gray-500/15'}`}
                                  placeholder={envVar.placeholder || `Enter value`}
                                />
                                {envVar.value && (
                                  <button
                                    type="button"
                                    onClick={() => toggleMasking(index)}
                                    className="p-2.5 bg-transparent text-[#888F96] hover:text-white transition-colors rounded-tr-md rounded-br-md"
                                    aria-label={envVar.masked ? "Show value" : "Hide value"}
                                  >
                                    {envVar.masked ? (
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" />
                                        <path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 7.893 2.66 9.336 6.41.147.381.146.804 0 1.186A10.004 10.004 0 0110 17c-4.257 0-7.893-2.66-9.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                      </svg>
                                    ) : (
                                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                                        <path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-4.38 1.651 1.651 0 000-1.185A10.004 10.004 0 009.999 3a9.956 9.956 0 00-4.744 1.194L3.28 2.22zM7.752 6.69l1.092 1.092a2.5 2.5 0 013.374 3.373l1.091 1.092a4 4 0 00-5.557-5.557z" clipRule="evenodd" />
                                        <path d="M10.748 13.93l2.523 2.523a9.987 9.987 0 01-3.27.547c-4.258 0-7.894-2.66-9.337-6.41a1.651 1.651 0 010-1.186A10.007 10.007 0 012.839 6.02L6.07 9.252a4 4 0 004.678 4.678z" />
                                      </svg>
                                    )}
                                  </button>
                                )}
                              </div>
                              {!isRequired && (
                                <button
                                  type="button"
                                  onClick={() => deleteEnvVar(index)}
                                  className="ml-2 p-1 rounded-md text-[#888F96] hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                  aria-label="Delete"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
                                    <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 0 0 6 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 1 0 .23 1.482l.149-.022.841 10.518A2.75 2.75 0 0 0 7.596 19h4.807a2.75 2.75 0 0 0 2.742-2.53l.841-10.52.149.023a.75.75 0 0 0 .23-1.482A41.03 41.03 0 0 0 14 4.193V3.75A2.75 2.75 0 0 0 11.25 1h-2.5ZM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4ZM8.58 7.72a.75.75 0 0 0-1.5.06l.3 7.5a.75.75 0 1 0 1.5-.06l-.3-7.5Zm4.34.06a.75.75 0 1 0-1.5-.06l-.3 7.5a.75.75 0 1 0 1.5.06l.3-7.5Z" clipRule="evenodd" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {!disableAddNew && (
                    <div className="mt-4">
                      
                        <button
                          type="button"
                          onClick={addNewEnvVar}
                          className="flex font-medium items-center space-x-2 text-sm text-[#888F96] hover:text-white"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                            <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
                          </svg>
                          <span>Add another</span>
                        </button>
                    </div>
                    )}
                  </div>
                </div>
                <div className="p-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* <button
                    type="submit"
                    className="w-full md:flex-1 flex items-center justify-center min-w-fit border border-gray-500/15 rounded-md cursor-pointer bg-transparent px-3 py-2 text-sm font-medium leading-6 text-white hover:bg-gray-500/10 focus:outline-0 order-3 md:order-1"
                  >
                    <div className="w-5 h-5 flex items-center justify-center rounded-sm">
                      <svg className="text-white w-full h-full" viewBox="0 0 370 370" fill="#ffffff" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" clipRule="evenodd" d="M527.515 29.5133L509.931 41.8258C492.347 53.9539 457.18 78.8557 422.012 76.2272C386.844 73.7831 351.677 44.2699 316.509 46.714C281.341 49.3425 246.174 83.4672 211.006 88.5398C175.838 93.6123 140.671 68.7105 105.503 56.5825C70.3353 44.2699 35.1677 44.2699 17.5838 44.2699H0V3.8147e-05L17.5838 3.8147e-05C35.1677 3.8147e-05 70.3353 3.8147e-05 105.503 3.8147e-05C140.671 3.8147e-05 175.838 3.8147e-05 211.006 3.8147e-05C246.174 3.8147e-05 281.341 3.8147e-05 316.509 3.8147e-05C351.677 3.8147e-05 386.844 3.8147e-05 422.012 3.8147e-05C457.18 3.8147e-05 492.347 3.8147e-05 509.931 3.8147e-05H527.515V29.5133Z" fill="#6772E5"/>
                        <path d="M0 484.727L17.0667 472.752C34.1333 460.957 68.2667 436.739 102.4 439.295C136.533 441.672 170.667 470.375 204.8 467.998C238.933 465.442 273.067 432.254 307.2 427.321C341.333 422.387 375.467 446.606 409.6 458.401C443.733 470.375 477.867 470.375 494.933 470.375H512V513.43H494.933C477.867 513.43 443.733 513.43 409.6 513.43C375.467 513.43 341.333 513.43 307.2 513.43C273.067 513.43 238.933 513.43 204.8 513.43C170.667 513.43 136.533 513.43 102.4 513.43C68.2667 513.43 34.1333 513.43 17.0667 513.43H0V484.727Z" fill="#F5BE58"/>
                        <rect width="34.7108" height="196.795" transform="matrix(0.983621 0.180249 -0.189433 0.981894 132.901 160)" fill="#6772E5"/>
                        <rect width="34.7108" height="196.795" transform="matrix(0.983775 0.179408 -0.190319 0.981722 202.394 165.618)" fill="#F5BE58"/>
                        <path d="M340.4 369.8C388 369.8 430.4 332.6 430.4 268.2C430.4 203 388 165.8 340.4 165.8C292.8 165.8 250.4 203 250.4 268.2C250.4 332.6 292.8 369.8 340.4 369.8ZM340.4 342.6C307.2 342.6 284.4 312.6 284.4 268.2C284.4 223.4 307.2 193 340.4 193C374 193 396.4 223.4 396.4 268.2C396.4 312.6 374 342.6 340.4 342.6Z" fill="white"/>
                      </svg>
                  </div>
                <span>
                  Import from Onboardbase
                </span>
              </button> */}
                  <div className="relative w-full md:flex-1 flex items-center justify-center min-w-fit border border-gray-500/15 rounded-md cursor-pointer bg-transparent px-3 py-2 text-sm font-medium leading-6 text-white hover:bg-gray-500/10 focus:outline-0 order-3 md:order-1">
                    <label 
                      htmlFor="file-upload" 
                      className="w-full flex items-center justify-center space-x-3"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4 text-blue-300">
                        <path fillRule="evenodd" d="M6.28 5.22a.75.75 0 0 1 0 1.06L2.56 10l3.72 3.72a.75.75 0 0 1-1.06 1.06L.97 10.53a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Zm7.44 0a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L17.44 10l-3.72-3.72a.75.75 0 0 1 0-1.06ZM11.377 2.011a.75.75 0 0 1 .612.867l-2.5 14.5a.75.75 0 0 1-1.478-.255l2.5-14.5a.75.75 0 0 1 .866-.612Z" clipRule="evenodd" />
                      </svg>
                      <span>Import from .env</span>
                    </label>
                    <input
                      id="file-upload"
                      type="file"
                      accept=".env,.json"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleFileUpload}
                    />
                  </div>
                  <div className="text-gray-400/50 font-medium text-xs my-2 md:my-0 shrink-0 order-2 md:order-2">OR</div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full md:flex-1 flex items-center space-x-3 justify-center min-w-fit rounded-md cursor-pointer border border-transparent bg-blue-300 px-8 py-2 text-sm font-medium leading-6 text-black hover:bg-blue-400 focus:outline-0 order-1 md:order-3 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {isSubmitting ? 'Saving...' : 'Continue'}
                  </button>
                </div>
              </form>
            </div>
          )}
          <a
            href="https://onboardbase.com"
            target="_blank"
            className="flex flex-row -rotate-90 translate-y-40 items-center justify-start origin-bottom-left py-1.5 px-3 gap-1 rounded-b-none border border-gray-500/15 border-b-0 absolute left-0 -ml-[1.2px] top-4 rounded-lg bg-gray-500/10"
          >
            <span className="text-[10px] font-semibold text-[#888F96]">Powered by</span>
            <div className="text-blue-300 flex items-center justify-center h-[11px]">
              <svg className="w-full h-full" viewBox="0 0 309 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                 <path d="M40.068 40.66C46.833 40.66 52.938 35.49 52.938 26.525C52.938 17.505 46.833 12.335 40.068 12.335C33.358 12.335 27.253 17.505 27.253 26.525C27.253 35.49 33.358 40.66 40.068 40.66ZM40.068 35.49C36.108 35.49 33.743 31.915 33.743 26.525C33.743 21.08 36.108 17.505 40.068 17.505C44.028 17.505 46.448 21.08 46.448 26.525C46.448 31.915 44.028 35.49 40.068 35.49ZM56.4486 40H62.7736V21.135C65.0286 18.935 66.5686 17.78 68.9336 17.78C71.9036 17.78 73.1686 19.43 73.1686 23.885V40H79.4936V23.06C79.4936 16.24 76.9636 12.335 71.1886 12.335C67.5036 12.335 64.7536 14.26 62.3336 16.625H62.1136L61.6736 12.995H56.4486V40ZM97.565 40.66C103.56 40.66 109.115 35.325 109.115 26.03C109.115 17.725 105.21 12.335 98.445 12.335C95.695 12.335 92.89 13.71 90.635 15.69L90.8 11.18V1.17H84.475V40H89.48L90.03 37.14H90.195C92.45 39.395 95.09 40.66 97.565 40.66ZM96.245 35.435C94.65 35.435 92.725 34.83 90.8 33.18V20.585C92.89 18.55 94.76 17.56 96.74 17.56C100.81 17.56 102.57 20.75 102.57 26.14C102.57 32.245 99.82 35.435 96.245 35.435ZM123.771 40.66C130.536 40.66 136.641 35.49 136.641 26.525C136.641 17.505 130.536 12.335 123.771 12.335C117.061 12.335 110.956 17.505 110.956 26.525C110.956 35.49 117.061 40.66 123.771 40.66ZM123.771 35.49C119.811 35.49 117.446 31.915 117.446 26.525C117.446 21.08 119.811 17.505 123.771 17.505C127.731 17.505 130.151 21.08 130.151 26.525C130.151 31.915 127.731 35.49 123.771 35.49ZM146.052 40.66C149.242 40.66 151.992 39.065 154.412 37.03H154.632L155.072 40H160.297V23.995C160.297 16.46 156.942 12.335 150.232 12.335C145.942 12.335 142.092 13.985 139.122 15.855L141.432 20.09C143.852 18.66 146.382 17.45 149.022 17.45C152.707 17.45 153.862 19.87 153.972 22.73C142.862 23.94 138.077 26.965 138.077 32.74C138.077 37.47 141.322 40.66 146.052 40.66ZM148.087 35.71C145.832 35.71 144.182 34.665 144.182 32.245C144.182 29.55 146.602 27.625 153.972 26.69V32.74C151.937 34.61 150.287 35.71 148.087 35.71ZM165.117 40H171.442V23.5C173.092 19.43 175.677 17.945 177.822 17.945C178.977 17.945 179.692 18.11 180.627 18.385L181.727 12.885C180.902 12.5 180.022 12.335 178.647 12.335C175.787 12.335 172.927 14.26 171.002 17.78H170.782L170.342 12.995H165.117V40ZM191.807 40.66C194.722 40.66 197.472 39.065 199.452 37.085H199.672L200.112 40H205.337V1.17H199.012V10.96L199.232 15.305C197.142 13.49 195.217 12.335 192.137 12.335C186.252 12.335 180.697 17.725 180.697 26.525C180.697 35.435 185.042 40.66 191.807 40.66ZM193.347 35.435C189.442 35.435 187.242 32.3 187.242 26.47C187.242 20.805 190.047 17.56 193.512 17.56C195.327 17.56 197.142 18.165 199.012 19.815V32.41C197.197 34.5 195.437 35.435 193.347 35.435ZM223.732 40.66C229.727 40.66 235.282 35.325 235.282 26.03C235.282 17.725 231.377 12.335 224.612 12.335C221.862 12.335 219.057 13.71 216.802 15.69L216.967 11.18V1.17H210.642V40H215.647L216.197 37.14H216.362C218.617 39.395 221.257 40.66 223.732 40.66ZM222.412 35.435C220.817 35.435 218.892 34.83 216.967 33.18V20.585C219.057 18.55 220.927 17.56 222.907 17.56C226.977 17.56 228.737 20.75 228.737 26.14C228.737 32.245 225.987 35.435 222.412 35.435ZM244.784 40.66C247.974 40.66 250.724 39.065 253.144 37.03H253.364L253.804 40H259.029V23.995C259.029 16.46 255.674 12.335 248.964 12.335C244.674 12.335 240.824 13.985 237.854 15.855L240.164 20.09C242.584 18.66 245.114 17.45 247.754 17.45C251.439 17.45 252.594 19.87 252.704 22.73C241.594 23.94 236.809 26.965 236.809 32.74C236.809 37.47 240.054 40.66 244.784 40.66ZM246.819 35.71C244.564 35.71 242.914 34.665 242.914 32.245C242.914 29.55 245.334 27.625 252.704 26.69V32.74C250.669 34.61 249.019 35.71 246.819 35.71ZM271.383 40.66C278.203 40.66 281.888 36.92 281.888 32.3C281.888 27.24 277.818 25.48 274.133 24.105C271.218 23.06 268.523 22.235 268.523 20.09C268.523 18.385 269.788 17.12 272.483 17.12C274.628 17.12 276.553 18.055 278.423 19.43L281.338 15.58C279.138 13.875 276.113 12.335 272.373 12.335C266.323 12.335 262.528 15.69 262.528 20.42C262.528 24.93 266.543 26.965 270.118 28.285C272.978 29.385 275.893 30.375 275.893 32.63C275.893 34.5 274.518 35.875 271.603 35.875C268.853 35.875 266.543 34.72 264.123 32.85L261.153 36.92C263.793 39.065 267.698 40.66 271.383 40.66ZM296.335 40.66C299.745 40.66 302.99 39.45 305.575 37.745L303.43 33.785C301.45 35.05 299.47 35.765 297.16 35.765C292.815 35.765 289.735 33.015 289.185 28.23H306.345C306.51 27.57 306.62 26.36 306.62 25.15C306.62 17.615 302.77 12.335 295.455 12.335C289.13 12.335 283.025 17.725 283.025 26.525C283.025 35.435 288.855 40.66 296.335 40.66ZM289.13 23.94C289.68 19.595 292.43 17.23 295.62 17.23C299.305 17.23 301.12 19.76 301.12 23.94H289.13Z" fill="white"/>
                 <rect width="5.91623" height="30.9797" transform="matrix(0.986269 0.165144 -0.206585 0.978429 6.40039 9)" fill="#6772E5"/>
                 <rect width="5.91623" height="30.9797" transform="matrix(0.986269 0.165144 -0.206585 0.978429 18.2744 9.88159)" fill="#F5BE58"/>
               </svg>
            </div>
          </a>
        </div>

        <footer className="row-start-3 flex gap-8 flex-wrap items-center justify-center mt-10">
          {/* <a className="flex items-center gap-1 text-[#888F96] text-sm hover:text-white" href="https://github.com/Onboardbase/envkit" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
            </svg>
            Learn
          </a> */}
          <a className="flex items-center gap-1 text-[#888F96] text-sm hover:text-white" href="https://envkit.co" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path d="M16.555 5.412a8.028 8.028 0 0 0-3.503-2.81 14.899 14.899 0 0 1 1.663 4.472 8.547 8.547 0 0 0 1.84-1.662ZM13.326 7.825a13.43 13.43 0 0 0-2.413-5.773 8.087 8.087 0 0 0-1.826 0 13.43 13.43 0 0 0-2.413 5.773A8.473 8.473 0 0 0 10 8.5c1.18 0 2.304-.24 3.326-.675ZM6.514 9.376A9.98 9.98 0 0 0 10 10c1.226 0 2.4-.22 3.486-.624a13.54 13.54 0 0 1-.351 3.759A13.54 13.54 0 0 1 10 13.5c-1.079 0-2.128-.127-3.134-.366a13.538 13.538 0 0 1-.352-3.758ZM5.285 7.074a14.9 14.9 0 0 1 1.663-4.471 8.028 8.028 0 0 0-3.503 2.81c.529.638 1.149 1.199 1.84 1.66ZM17.334 6.798a7.973 7.973 0 0 1 .614 4.115 13.47 13.47 0 0 1-3.178 1.72 15.093 15.093 0 0 0 .174-3.939 10.043 10.043 0 0 0 2.39-1.896ZM2.666 6.798a10.042 10.042 0 0 0 2.39 1.896 15.196 15.196 0 0 0 .174 3.94 13.472 13.472 0 0 1-3.178-1.72 7.973 7.973 0 0 1 .615-4.115ZM10 15c.898 0 1.778-.079 2.633-.23a13.473 13.473 0 0 1-1.72 3.178 8.099 8.099 0 0 1-1.826 0 13.47 13.47 0 0 1-1.72-3.178c.855.151 1.735.23 2.633.23ZM14.357 14.357a14.912 14.912 0 0 1-1.305 3.04 8.027 8.027 0 0 0 4.345-4.345c-.953.542-1.971.981-3.04 1.305ZM6.948 17.397a8.027 8.027 0 0 1-4.345-4.345c.953.542 1.971.981 3.04 1.305a14.912 14.912 0 0 0 1.305 3.04Z" />
            </svg>
            Go to envkit.co →
          </a>
        </footer>
      </div>
    </div>
  );
}

export default DefaultFallbackUI;

// Add these styles to your globals.css or equivalent
const styles = `
@keyframes pulse-slow {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

@keyframes pulse-slower {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.6; }
}

@keyframes pulse-slowest {
  0%, 100% { opacity: 0.2; }
  50% { opacity: 0.5; }
}

@keyframes twinkle-1 {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

@keyframes twinkle-2 {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

@keyframes twinkle-3 {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 0.1; }
}

.moon {
  box-shadow: inset -10px -10px 50px rgba(0,0,0,0.15),
              inset 5px 5px 30px rgba(255,255,255,0.1),
              0 0 50px rgba(255,255,255,0.2);
  transform: rotate(25deg);
  backdrop-filter: blur(4px);
}

.animate-pulse-slow {
  animation: pulse-slow 6s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-pulse-slower {
  animation: pulse-slower 8s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-pulse-slowest {
  animation: pulse-slowest 10s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.animate-twinkle-1 {
  animation: twinkle-1 4s ease-in-out infinite;
}

.animate-twinkle-2 {
  animation: twinkle-2 5s ease-in-out infinite;
}

.animate-twinkle-3 {
  animation: twinkle-3 6s ease-in-out infinite;
}

.star-small {
  position: absolute;
  width: 2px;
  height: 2px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 2px 1px rgba(255, 255, 255, 0.3);
}

.star-medium {
  position: absolute;
  width: 3px;
  height: 3px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 3px 1px rgba(255, 255, 255, 0.4);
}

.star-large {
  position: absolute;
  width: 4px;
  height: 4px;
  background: white;
  border-radius: 50%;
  box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.5);
}

/* Custom scrollbar styles */
.space-y-2::-webkit-scrollbar {
  width: 6px;
}

.space-y-2::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.space-y-2::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  transition: background 0.2s ease;
}

.space-y-2::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}
