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
      <div className="flex min-h-screen flex-col items-center justify-center p-24 bg-black font-normal tracking-[0.6px]">
        <div className="mb-8">
          <div className="w-5 h-5 flex items-center space-x-2 mb-1">
            <svg className="w-full h-full" viewBox="0 0 370 370" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M78.625 37C67.5854 37 56.9979 41.3855 49.1917 49.1917C41.3855 56.9979 37 67.5854 37 78.625V291.375C37 302.415 41.3855 313.002 49.1917 320.808C56.9979 328.615 67.5854 333 78.625 333H291.375C302.415 333 313.002 328.615 320.808 320.808C328.615 313.002 333 302.415 333 291.375V78.625C333 67.5854 328.615 56.9979 320.808 49.1917C313.002 41.3855 302.415 37 291.375 37H78.625ZM153.18 153.18C155.631 150.55 156.965 147.071 156.902 143.476C156.838 139.882 155.382 136.452 152.84 133.91C150.298 131.368 146.868 129.912 143.274 129.848C139.679 129.785 136.2 131.119 133.57 133.57L91.945 175.195C89.3467 177.797 87.8872 181.323 87.8872 185C87.8872 188.677 89.3467 192.203 91.945 194.805L133.57 236.43C136.2 238.881 139.679 240.215 143.274 240.152C146.868 240.088 150.298 238.632 152.84 236.09C155.382 233.548 156.838 230.118 156.902 226.524C156.965 222.929 155.631 219.45 153.18 216.82L121.36 185L153.18 153.18ZM236.43 133.57C235.16 132.207 233.628 131.113 231.926 130.355C230.224 129.597 228.387 129.189 226.524 129.156C224.661 129.123 222.81 129.466 221.082 130.164C219.355 130.862 217.785 131.9 216.468 133.218C215.15 134.535 214.112 136.105 213.414 137.832C212.716 139.56 212.373 141.411 212.406 143.274C212.439 145.137 212.847 146.974 213.605 148.676C214.363 150.378 215.457 151.91 216.82 153.18L248.64 185L216.82 216.82C215.457 218.09 214.363 219.622 213.605 221.324C212.847 223.026 212.439 224.863 212.406 226.726C212.373 228.589 212.716 230.44 213.414 232.168C214.112 233.895 215.15 235.465 216.468 236.782C217.785 238.1 219.355 239.138 221.082 239.836C222.81 240.534 224.661 240.877 226.524 240.844C228.387 240.811 230.224 240.403 231.926 239.645C233.628 238.887 235.16 237.793 236.43 236.43L278.055 194.805C280.653 192.203 282.113 188.677 282.113 185C282.113 181.323 280.653 177.797 278.055 175.195L236.43 133.57Z" fill="white"/>
            </svg>
            <span className="text-xl">EnvKit</span>
          </div>
          <p className="text-ob-gray-color">The world's first Env box.</p>
        </div>
        <p className="mb-4 text-base md:text-lg font-semibold text-white">Loading environment configuration...</p>
        <div className="w-16 h-16 border-t-4 border-blue-300 border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-black">
      <div className="w-full max-w-xl rounded-xl bg-gray-500/10 border-gray-500/15 border relative">
        <div className="w-full p-4 flex items-center space-x-6 border-b border-gray-500/15">
          <a
            href="/"
            className="flex items-center justify-center"
            aria-current="page"
          >
            <div className="w-8 h-8 flex items-center justify-center rounded-sm">
              {/* <img
                className="w-full h-full object-contain rounded-sm"
                src="/assets/img/obb-logo.png"
                alt="Onboardbase logo"
              /> */}
              <svg className="w-full h-full" viewBox="0 0 76 65" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" fill="#ffffff"/>
              </svg>
            </div>
          </a>
          <div>
            <h1 className="font-semibold text-base text-white md:text-lg">Welcome to Vercel</h1>
            <p className="text-[#888F96] text-sm leading-5">
                Configure the required envs to run this application.
              </p>
          </div>
        </div>
        {missingVars.length === 0 ? (
          <div className="bg-green-500/10 border border-green-500/15 text-green-500 px-4 py-3 rounded mb-4">
            <p>All required environment variables are set! You can now proceed.</p>
            <button 
              onClick={onComplete} 
              className="mt-4 w-full md:flex-1 flex justify-center min-w-fit rounded-md cursor-pointer border border-transparent bg-white px-8 py-2 text-sm font-medium leading-6 text-black hover:bg-gray-400 transition-colors"
            >
              Continue to application
            </button>
          </div>
        ) : (
          <>
            <div>
              {/* <p className="mb-6 text-[#888F96] text-xs leading-5 p-4">
                The following environment variables are required to run this application. 
                Please fill them in below:
              </p> */}
              
              {error && (
                <div className="bg-red-500/10 border border-red-500/15 text-red-500 px-4 py-3 rounded mb-4">
                  <span className="block sm:inline">{error}</span>
                </div>
              )}
              
              {success && (
                <div className="bg-green-500/10 border border-green-500/15 text-green-500 px-4 py-3 rounded mb-4">
                  <span className="block sm:inline">{success}</span>
                </div>
              )}
            </div>
            <form onSubmit={handleSubmit}>
              <div className="w-full border-b border-gray-500/15 p-4 py-6">
                <div className="relative w-full grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-6">
                  <div className="">
                    {envVars.map((envVar, index) => (
                      <div key={envVar.key} className="sm:col-span-3">
                        <label 
                          htmlFor={`env-${envVar.key}`} 
                          className="block text-sm font-medium text-white"
                        >
                          {envVar.label || envVar.key}
                          {envVar.description && (
                            <span className="ml-1 text-xs text-white">({envVar.description})</span>
                          )}
                        </label>
                        <div className="mt-2">
                          <input
                            type={envVar.secret ? "password" : "text"}
                            id={`env-${envVar.key}`}
                            value={envVar.value}
                            onChange={(e) => handleInputChange(index, e.target.value)}
                            className="w-full px-3 py-2 font-mono border border-gray-500/15 sm:leading-6 text-white bg-gray-500/5 rounded-md focus:outline-none focus:ring-0 focus:border-gray-500/15"
                            placeholder={envVar.placeholder || `Enter ${envVar.key}`}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="p-4 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                {/* <button
                  type="submit"
                  className="w-full md:flex-1 flex items-center space-x-3 justify-center min-w-fit border border-gray-500/15 rounded-md cursor-pointer bg-transparent px-3 py-2 text-sm font-medium leading-6 text-white hover:bg-gray-500/10 focus:outline-0 order-3 md:order-1"
                >
                    <div className="w-5 h-5 flex items-center justify-center rounded-sm">
                      <svg width="512" height="512" viewBox="0 0 512 512" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g clipPath="url(#clip0_1220_475)">
                        <rect width="512" height="512" rx="40" fill="black"/>
                        <path d="M527.515 29.5133L509.931 41.8258C492.347 53.9539 457.18 78.8557 422.012 76.2272C386.844 73.7831 351.677 44.2699 316.509 46.714C281.341 49.3425 246.174 83.4672 211.006 88.5398C175.838 93.6123 140.671 68.7105 105.503 56.5825C70.3353 44.2699 35.1677 44.2699 17.5838 44.2699H0V3.8147e-05L17.5838 3.8147e-05C35.1677 3.8147e-05 70.3353 3.8147e-05 105.503 3.8147e-05C140.671 3.8147e-05 175.838 3.8147e-05 211.006 3.8147e-05C246.174 3.8147e-05 281.341 3.8147e-05 316.509 3.8147e-05C351.677 3.8147e-05 386.844 3.8147e-05 422.012 3.8147e-05C457.18 3.8147e-05 492.347 3.8147e-05 509.931 3.8147e-05H527.515V29.5133Z" fill="#6772E5"/>
                        <path d="M0 484.727L17.0667 472.752C34.1333 460.957 68.2667 436.739 102.4 439.295C136.533 441.672 170.667 470.375 204.8 467.998C238.933 465.442 273.067 432.254 307.2 427.321C341.333 422.387 375.467 446.606 409.6 458.401C443.733 470.375 477.867 470.375 494.933 470.375H512V513.43H494.933C477.867 513.43 443.733 513.43 409.6 513.43C375.467 513.43 341.333 513.43 307.2 513.43C273.067 513.43 238.933 513.43 204.8 513.43C170.667 513.43 136.533 513.43 102.4 513.43C68.2667 513.43 34.1333 513.43 17.0667 513.43H0V484.727Z" fill="#F5BE58"/>
                        <rect width="34.7108" height="196.795" transform="matrix(0.983621 0.180249 -0.189433 0.981894 132.901 160)" fill="#6772E5"/>
                        <rect width="34.7108" height="196.795" transform="matrix(0.983775 0.179408 -0.190319 0.981722 202.394 165.618)" fill="#F5BE58"/>
                        <path d="M340.4 369.8C388 369.8 430.4 332.6 430.4 268.2C430.4 203 388 165.8 340.4 165.8C292.8 165.8 250.4 203 250.4 268.2C250.4 332.6 292.8 369.8 340.4 369.8ZM340.4 342.6C307.2 342.6 284.4 312.6 284.4 268.2C284.4 223.4 307.2 193 340.4 193C374 193 396.4 223.4 396.4 268.2C396.4 312.6 374 342.6 340.4 342.6Z" fill="white"/>
                        </g>
                        <defs>
                        <clipPath id="clip0_1220_475">
                        <rect width="512" height="512" rx="40" fill="white"/>
                        </clipPath>
                        </defs>
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
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="size-4 text-blue-300">
                      <path fillRule="evenodd" d="M4.78 4.97a.75.75 0 0 1 0 1.06L2.81 8l1.97 1.97a.75.75 0 1 1-1.06 1.06l-2.5-2.5a.75.75 0 0 1 0-1.06l2.5-2.5a.75.75 0 0 1 1.06 0ZM11.22 4.97a.75.75 0 0 0 0 1.06L13.19 8l-1.97 1.97a.75.75 0 1 0 1.06 1.06l2.5-2.5a.75.75 0 0 0 0-1.06l-2.5-2.5a.75.75 0 0 0-1.06 0ZM8.856 2.008a.75.75 0 0 1 .636.848l-1.5 10.5a.75.75 0 0 1-1.484-.212l1.5-10.5a.75.75 0 0 1 .848-.636Z" clip-rule="evenodd" />
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
                  className={`w-full md:flex-1 flex justify-center min-w-fit rounded-md cursor-pointer border border-transparent bg-blue-300 px-8 py-2 text-sm font-medium leading-6 text-black hover:bg-blue-400 focus:outline-0 order-1 md:order-3 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isSubmitting ? 'Saving...' : 'Continue'}
                </button>
              </div>
            </form>
          </>
        )}
        <a
          href="https://onboardbase.com"
          target="_blank"
          className="flex flex-row -rotate-90 translate-y-36 items-center justify-start origin-bottom-left py-1 px-3 gap-1 rounded-b-none border border-gray-500/15 border-b-0 absolute left-0 -ml-[1.2px] top-4 rounded-lg bg-gray-500/10"
        >
          <span className="text-[10px] font-medium text-[#888F96]">Powered by</span>
          <div className="text-blue-300 flex items-center justify-center h-2.5">
            <svg className="w-full h-full" viewBox="0 0 309 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40.068 40.66C46.833 40.66 52.938 35.49 52.938 26.525C52.938 17.505 46.833 12.335 40.068 12.335C33.358 12.335 27.253 17.505 27.253 26.525C27.253 35.49 33.358 40.66 40.068 40.66ZM40.068 35.49C36.108 35.49 33.743 31.915 33.743 26.525C33.743 21.08 36.108 17.505 40.068 17.505C44.028 17.505 46.448 21.08 46.448 26.525C46.448 31.915 44.028 35.49 40.068 35.49ZM56.4486 40H62.7736V21.135C65.0286 18.935 66.5686 17.78 68.9336 17.78C71.9036 17.78 73.1686 19.43 73.1686 23.885V40H79.4936V23.06C79.4936 16.24 76.9636 12.335 71.1886 12.335C67.5036 12.335 64.7536 14.26 62.3336 16.625H62.1136L61.6736 12.995H56.4486V40ZM97.565 40.66C103.56 40.66 109.115 35.325 109.115 26.03C109.115 17.725 105.21 12.335 98.445 12.335C95.695 12.335 92.89 13.71 90.635 15.69L90.8 11.18V1.17H84.475V40H89.48L90.03 37.14H90.195C92.45 39.395 95.09 40.66 97.565 40.66ZM96.245 35.435C94.65 35.435 92.725 34.83 90.8 33.18V20.585C92.89 18.55 94.76 17.56 96.74 17.56C100.81 17.56 102.57 20.75 102.57 26.14C102.57 32.245 99.82 35.435 96.245 35.435ZM123.771 40.66C130.536 40.66 136.641 35.49 136.641 26.525C136.641 17.505 130.536 12.335 123.771 12.335C117.061 12.335 110.956 17.505 110.956 26.525C110.956 35.49 117.061 40.66 123.771 40.66ZM123.771 35.49C119.811 35.49 117.446 31.915 117.446 26.525C117.446 21.08 119.811 17.505 123.771 17.505C127.731 17.505 130.151 21.08 130.151 26.525C130.151 31.915 127.731 35.49 123.771 35.49ZM146.052 40.66C149.242 40.66 151.992 39.065 154.412 37.03H154.632L155.072 40H160.297V23.995C160.297 16.46 156.942 12.335 150.232 12.335C145.942 12.335 142.092 13.985 139.122 15.855L141.432 20.09C143.852 18.66 146.382 17.45 149.022 17.45C152.707 17.45 153.862 19.87 153.972 22.73C142.862 23.94 138.077 26.965 138.077 32.74C138.077 37.47 141.322 40.66 146.052 40.66ZM148.087 35.71C145.832 35.71 144.182 34.665 144.182 32.245C144.182 29.55 146.602 27.625 153.972 26.69V32.74C151.937 34.61 150.287 35.71 148.087 35.71ZM165.117 40H171.442V23.5C173.092 19.43 175.677 17.945 177.822 17.945C178.977 17.945 179.692 18.11 180.627 18.385L181.727 12.885C180.902 12.5 180.022 12.335 178.647 12.335C175.787 12.335 172.927 14.26 171.002 17.78H170.782L170.342 12.995H165.117V40ZM191.807 40.66C194.722 40.66 197.472 39.065 199.452 37.085H199.672L200.112 40H205.337V1.17H199.012V10.96L199.232 15.305C197.142 13.49 195.217 12.335 192.137 12.335C186.252 12.335 180.697 17.725 180.697 26.525C180.697 35.435 185.042 40.66 191.807 40.66ZM193.347 35.435C189.442 35.435 187.242 32.3 187.242 26.47C187.242 20.805 190.047 17.56 193.512 17.56C195.327 17.56 197.142 18.165 199.012 19.815V32.41C197.197 34.5 195.437 35.435 193.347 35.435ZM223.732 40.66C229.727 40.66 235.282 35.325 235.282 26.03C235.282 17.725 231.377 12.335 224.612 12.335C221.862 12.335 219.057 13.71 216.802 15.69L216.967 11.18V1.17H210.642V40H215.647L216.197 37.14H216.362C218.617 39.395 221.257 40.66 223.732 40.66ZM222.412 35.435C220.817 35.435 218.892 34.83 216.967 33.18V20.585C219.057 18.55 220.927 17.56 222.907 17.56C226.977 17.56 228.737 20.75 228.737 26.14C228.737 32.245 225.987 35.435 222.412 35.435ZM244.784 40.66C247.974 40.66 250.724 39.065 253.144 37.03H253.364L253.804 40H259.029V23.995C259.029 16.46 255.674 12.335 248.964 12.335C244.674 12.335 240.824 13.985 237.854 15.855L240.164 20.09C242.584 18.66 245.114 17.45 247.754 17.45C251.439 17.45 252.594 19.87 252.704 22.73C241.594 23.94 236.809 26.965 236.809 32.74C236.809 37.47 240.054 40.66 244.784 40.66ZM246.819 35.71C244.564 35.71 242.914 34.665 242.914 32.245C242.914 29.55 245.334 27.625 252.704 26.69V32.74C250.669 34.61 249.019 35.71 246.819 35.71ZM271.383 40.66C278.203 40.66 281.888 36.92 281.888 32.3C281.888 27.24 277.818 25.48 274.133 24.105C271.218 23.06 268.523 22.235 268.523 20.09C268.523 18.385 269.788 17.12 272.483 17.12C274.628 17.12 276.553 18.055 278.423 19.43L281.338 15.58C279.138 13.875 276.113 12.335 272.373 12.335C266.323 12.335 262.528 15.69 262.528 20.42C262.528 24.93 266.543 26.965 270.118 28.285C272.978 29.385 275.893 30.375 275.893 32.63C275.893 34.5 274.518 35.875 271.603 35.875C268.853 35.875 266.543 34.72 264.123 32.85L261.153 36.92C263.793 39.065 267.698 40.66 271.383 40.66ZM296.335 40.66C299.745 40.66 302.99 39.45 305.575 37.745L303.43 33.785C301.45 35.05 299.47 35.765 297.16 35.765C292.815 35.765 289.735 33.015 289.185 28.23H306.345C306.51 27.57 306.62 26.36 306.62 25.15C306.62 17.615 302.77 12.335 295.455 12.335C289.13 12.335 283.025 17.725 283.025 26.525C283.025 35.435 288.855 40.66 296.335 40.66ZM289.13 23.94C289.68 19.595 292.43 17.23 295.62 17.23C299.305 17.23 301.12 19.76 301.12 23.94H289.13Z" fill="white"/>
              <rect width="5.91623" height="30.9797" transform="matrix(0.986269 0.165144 -0.206585 0.978429 6.40039 9)" fill="#6772E5"/>
              <rect width="5.91623" height="30.9797" transform="matrix(0.986269 0.165144 -0.206585 0.978429 18.2744 9.88159)" fill="#F5BE58"/>
            </svg>
          </div>
        </a>
      </div>
    </div>
  );
}

export default DefaultFallbackUI;
