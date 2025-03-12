'use client';

import { useEnvKit } from '@/lib/envkit';
import { useState } from 'react';

export default function Home() {
  const { isValid, missingVars, refreshEnv } = useEnvKit();
  const [refreshing, setRefreshing] = useState(false);

  // Handler for manual refresh of environment variables
  const handleRefresh = () => {
    setRefreshing(true);
    refreshEnv();
    // Reset refreshing state after a short delay
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-12">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <div className="flex flex-col gap-6">
          <h1 className="text-3xl font-bold mb-4">EnvKit Demo</h1>
          
          <div className="bg-white border rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-3">Environment Status</h2>
            
            <div className="flex items-center gap-3 mb-4">
              <div 
                className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`} 
                aria-hidden="true"
              />
              <span className="font-medium">
                {isValid ? 'All required environment variables are set' : 'Missing required environment variables'}
              </span>
            </div>
            
            <button
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium transition-colors flex items-center gap-2"
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh Environment
                </>
              )}
            </button>
          </div>
          
          {isValid ? (
            <div className="bg-white border rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Your Application Content</h2>
              <p className="text-gray-700 mb-4">
                This content is visible because all required environment variables are properly configured.
              </p>
              
              <div className="bg-gray-50 p-4 rounded-md">
                <h3 className="text-md font-medium mb-2">Environment Variables:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {/* We don't show actual environment values for security reasons */}
                  {/* Instead, just show which ones are configured */}
                  {process.env.API_KEY && <li>API_KEY: <span className="font-mono bg-gray-100 px-1 rounded">●●●●●●●●</span></li>}
                  {process.env.DATABASE_URL && <li>DATABASE_URL: <span className="font-mono bg-gray-100 px-1 rounded">●●●●●●●●</span></li>}
                  {process.env.NEXT_PUBLIC_APP_URL && <li>NEXT_PUBLIC_APP_URL: <span className="font-mono bg-gray-100 px-1 rounded">●●●●●●●●</span></li>}
                  {process.env.LOG_LEVEL && <li>LOG_LEVEL: <span className="font-mono bg-gray-100 px-1 rounded">{process.env.LOG_LEVEL}</span></li>}
                </ul>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border rounded-lg border-yellow-200 shadow p-6">
              <h2 className="text-xl font-semibold text-yellow-800 mb-2">Missing Environment Variables</h2>
              <p className="text-yellow-700 mb-4">
                In development mode, you&apos;ll see the fallback UI allowing you to set these values.
                In production, the application would fail to build/start if missing required env vars.
              </p>
              
              <div className="bg-white p-4 rounded-md border border-yellow-200">
                <h3 className="text-md font-medium mb-2">Missing Variables:</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {missingVars.map((v, index) => (
                    <li key={index} className="text-gray-700">
                      <span className="font-mono">{v.name}</span>
                      {v.description && <span className="text-sm text-gray-500 ml-2">({v.description})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="bg-white border rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">How EnvKit Works</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium mb-1">Development Mode</h3>
                <p className="text-gray-700">
                  When required environment variables are missing, EnvKit displays a fallback UI
                  allowing you to fill in missing values or upload a .env file.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-1">Production Mode</h3>
                <p className="text-gray-700">
                  In production, if required environment variables are missing, the build will fail
                  to prevent deploying an application with incomplete configuration.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-1">Multiple .env Files</h3>
                <p className="text-gray-700">
                  EnvKit supports multiple .env files with the following priority order:
                  <code className="bg-gray-100 px-1 rounded ml-1 text-sm">.env.local</code> →
                  <code className="bg-gray-100 px-1 rounded ml-1 text-sm">.env.[NODE_ENV].local</code> →
                  <code className="bg-gray-100 px-1 rounded ml-1 text-sm">.env.[NODE_ENV]</code> →
                  <code className="bg-gray-100 px-1 rounded ml-1 text-sm">.env</code>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
