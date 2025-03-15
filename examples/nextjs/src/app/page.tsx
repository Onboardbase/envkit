'use client';

import { useEffect, useState } from 'react';

export default function HomePage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // For demonstration purposes only - would normally fetch this from server
    const vars = {
      NODE_ENV: process.env.NODE_ENV || '',
      // Only expose public env vars (those prefixed with NEXT_PUBLIC_)
      ...Object.entries(process.env)
        .filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
        .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    };
    
    setEnvVars(vars);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return <div>Loading environment information...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem' }}>
      <h1 style={{ textAlign: 'center' }}>Next.js 15 App with EnvKit</h1>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Application Environment</h2>
        <p>Your application is now running with all required environment variables.</p>
        
        <div style={{ 
          backgroundColor: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '4px',
          marginTop: '1rem'
        }}>
          <h3>Public Environment Variables:</h3>
          
          {Object.keys(envVars).length > 0 ? (
            <ul>
              {Object.entries(envVars).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value}
                </li>
              ))}
            </ul>
          ) : (
            <p>No public environment variables available.</p>
          )}
          
          <p style={{ marginTop: '1rem', fontStyle: 'italic' }}>
            Note: For security reasons, only environment variables prefixed with 
            NEXT_PUBLIC_ are shown here.
          </p>
        </div>
      </div>
    </div>
  );
}
