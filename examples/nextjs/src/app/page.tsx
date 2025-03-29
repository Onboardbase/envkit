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
    return (
      <div className="flex min-h-screen antialiased flex-col items-center justify-center p-24 bg-black">
        <div className="mb-5">
          <div className="flex items-center space-x-2">
            <div className='w-5 h-5 flex items-center justify-center text-blue-300'>
              <svg className="w-full h-full" viewBox="0 0 370 370" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M78.625 37C67.5854 37 56.9979 41.3855 49.1917 49.1917C41.3855 56.9979 37 67.5854 37 78.625V291.375C37 302.415 41.3855 313.002 49.1917 320.808C56.9979 328.615 67.5854 333 78.625 333H291.375C302.415 333 313.002 328.615 320.808 320.808C328.615 313.002 333 302.415 333 291.375V78.625C333 67.5854 328.615 56.9979 320.808 49.1917C313.002 41.3855 302.415 37 291.375 37H78.625ZM153.18 153.18C155.631 150.55 156.965 147.071 156.902 143.476C156.838 139.882 155.382 136.452 152.84 133.91C150.298 131.368 146.868 129.912 143.274 129.848C139.679 129.785 136.2 131.119 133.57 133.57L91.945 175.195C89.3467 177.797 87.8872 181.323 87.8872 185C87.8872 188.677 89.3467 192.203 91.945 194.805L133.57 236.43C136.2 238.881 139.679 240.215 143.274 240.152C146.868 240.088 150.298 238.632 152.84 236.09C155.382 233.548 156.838 230.118 156.902 226.524C156.965 222.929 155.631 219.45 153.18 216.82L121.36 185L153.18 153.18ZM236.43 133.57C235.16 132.207 233.628 131.113 231.926 130.355C230.224 129.597 228.387 129.189 226.524 129.156C224.661 129.123 222.81 129.466 221.082 130.164C219.355 130.862 217.785 131.9 216.468 133.218C215.15 134.535 214.112 136.105 213.414 137.832C212.716 139.56 212.373 141.411 212.406 143.274C212.439 145.137 212.847 146.974 213.605 148.676C214.363 150.378 215.457 151.91 216.82 153.18L248.64 185L216.82 216.82C215.457 218.09 214.363 219.622 213.605 221.324C212.847 223.026 212.439 224.863 212.406 226.726C212.373 228.589 212.716 230.44 213.414 232.168C214.112 233.895 215.15 235.465 216.468 236.782C217.785 238.1 219.355 239.138 221.082 239.836C222.81 240.534 224.661 240.877 226.524 240.844C228.387 240.811 230.224 240.403 231.926 239.645C233.628 238.887 235.16 237.793 236.43 236.43L278.055 194.805C280.653 192.203 282.113 188.677 282.113 185C282.113 181.323 280.653 177.797 278.055 175.195L236.43 133.57Z" fill="currentColor"/>
              </svg>
            </div>
            <span className="text-xl font-semibold text-white">EnvKit</span>
          </div>
          <p className="text-[#888F96] text-xs">Onboard new devs faster.</p>
        </div>
        <div className="w-8 h-8 border-t-4 border-blue-300 border-solid rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-white">Loading environment configuration...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen antialiased flex items-center flex-col justify-center text-sm py-32 md:py-52 p-8 font-semibold w-full bg-black">
      <main className="max-w-lg mx-auto">
        <header className="mb-8">
          <div className="flex items-center space-x-1.5 mb-1">
            <svg className="text-blue-300 w-5 h-5" viewBox="0 0 370 370" fill="currentColor" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M78.625 37C67.5854 37 56.9979 41.3855 49.1917 49.1917C41.3855 56.9979 37 67.5854 37 78.625V291.375C37 302.415 41.3855 313.002 49.1917 320.808C56.9979 328.615 67.5854 333 78.625 333H291.375C302.415 333 313.002 328.615 320.808 320.808C328.615 313.002 333 302.415 333 291.375V78.625C333 67.5854 328.615 56.9979 320.808 49.1917C313.002 41.3855 302.415 37 291.375 37H78.625ZM153.18 153.18C155.631 150.55 156.965 147.071 156.902 143.476C156.838 139.882 155.382 136.452 152.84 133.91C150.298 131.368 146.868 129.912 143.274 129.848C139.679 129.785 136.2 131.119 133.57 133.57L91.945 175.195C89.3467 177.797 87.8872 181.323 87.8872 185C87.8872 188.677 89.3467 192.203 91.945 194.805L133.57 236.43C136.2 238.881 139.679 240.215 143.274 240.152C146.868 240.088 150.298 238.632 152.84 236.09C155.382 233.548 156.838 230.118 156.902 226.524C156.965 222.929 155.631 219.45 153.18 216.82L121.36 185L153.18 153.18ZM236.43 133.57C235.16 132.207 233.628 131.113 231.926 130.355C230.224 129.597 228.387 129.189 226.524 129.156C224.661 129.123 222.81 129.466 221.082 130.164C219.355 130.862 217.785 131.9 216.468 133.218C215.15 134.535 214.112 136.105 213.414 137.832C212.716 139.56 212.373 141.411 212.406 143.274C212.439 145.137 212.847 146.974 213.605 148.676C214.363 150.378 215.457 151.91 216.82 153.18L248.64 185L216.82 216.82C215.457 218.09 214.363 219.622 213.605 221.324C212.847 223.026 212.439 224.863 212.406 226.726C212.373 228.589 212.716 230.44 213.414 232.168C214.112 233.895 215.15 235.465 216.468 236.782C217.785 238.1 219.355 239.138 221.082 239.836C222.81 240.534 224.661 240.877 226.524 240.844C228.387 240.811 230.224 240.403 231.926 239.645C233.628 238.887 235.16 237.793 236.43 236.43L278.055 194.805C280.653 192.203 282.113 188.677 282.113 185C282.113 181.323 280.653 177.797 278.055 175.195L236.43 133.57Z" fill="currentColor"/>
            </svg>
            <span className="text-2xl text-white">EnvKit</span>
          </div>
          <p className="mb-3 text-[#888F96]">Onboard new devs faster.</p>
        </header>
        <ol className="list-inside text-sm text-left text-white space-y-4">
          <li className="flex items-start">
            <div className="w-5 h-5 mr-2 flex text-xs flex-none items-center justify-center bg-white/10 rounded-md">
              1
            </div>
            <span className="text-white">
              Your application is now running with all required environment variables.
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-5 h-5 mr-2 flex text-xs flex-none items-center justify-center bg-white/10 rounded-md">
              2
            </div>
            <span className="text-white w-full">
              <h3>Public Environment Variables:</h3>
              {Object.keys(envVars).length > 0 ? (
                <ul className='bg-gray-500/10 border border-[#6a7282] rounded-md p-4 w-full list-border mt-4'>
                  {Object.entries(envVars).map(([key, value]) => (
                    <li key={key}>
                      <span className="text-blue-300 italic">{key}:</span> {value}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No public environment variables available.</p>
              )}
            </span>
          </li>
          <li className="flex items-start">
            <div className="w-5 h-5 mr-2 flex text-xs flex-none items-center justify-center bg-white/10 rounded-md">
              3
            </div>
            <span className="text-white md:-mt-1">
              For security reasons, only environment variables prefixed with 
              <code className="text-blue-300 italic ml-1">NEXT_PUBLIC_</code> are shown here.
            </span>
          </li>
        </ol>
        <div className="text-[#888F96] mt-10 flex items-center gap-6">
          <a className="flex items-center gap-2 hover:text-white text-sm" href="https://envkit.co" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path d="M16.555 5.412a8.028 8.028 0 0 0-3.503-2.81 14.899 14.899 0 0 1 1.663 4.472 8.547 8.547 0 0 0 1.84-1.662ZM13.326 7.825a13.43 13.43 0 0 0-2.413-5.773 8.087 8.087 0 0 0-1.826 0 13.43 13.43 0 0 0-2.413 5.773A8.473 8.473 0 0 0 10 8.5c1.18 0 2.304-.24 3.326-.675ZM6.514 9.376A9.98 9.98 0 0 0 10 10c1.226 0 2.4-.22 3.486-.624a13.54 13.54 0 0 1-.351 3.759A13.54 13.54 0 0 1 10 13.5c-1.079 0-2.128-.127-3.134-.366a13.538 13.538 0 0 1-.352-3.758ZM5.285 7.074a14.9 14.9 0 0 1 1.663-4.471 8.028 8.028 0 0 0-3.503 2.81c.529.638 1.149 1.199 1.84 1.66ZM17.334 6.798a7.973 7.973 0 0 1 .614 4.115 13.47 13.47 0 0 1-3.178 1.72 15.093 15.093 0 0 0 .174-3.939 10.043 10.043 0 0 0 2.39-1.896ZM2.666 6.798a10.042 10.042 0 0 0 2.39 1.896 15.196 15.196 0 0 0 .174 3.94 13.472 13.472 0 0 1-3.178-1.72 7.973 7.973 0 0 1 .615-4.115ZM10 15c.898 0 1.778-.079 2.633-.23a13.473 13.473 0 0 1-1.72 3.178 8.099 8.099 0 0 1-1.826 0 13.47 13.47 0 0 1-1.72-3.178c.855.151 1.735.23 2.633.23ZM14.357 14.357a14.912 14.912 0 0 1-1.305 3.04 8.027 8.027 0 0 0 4.345-4.345c-.953.542-1.971.981-3.04 1.305ZM6.948 17.397a8.027 8.027 0 0 1-4.345-4.345c.953.542 1.971.981 3.04 1.305a14.912 14.912 0 0 0 1.305 3.04Z" />
            </svg>
            Go to envkit.co →
          </a>
          <a href="https://github.com/Onboardbase/envkit" className="flex items-center gap-2 hover:text-white text-sm" target="_blank" rel="noopener noreferrer">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="size-4">
              <path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 0 0 3 3.5v13A1.5 1.5 0 0 0 4.5 18h11a1.5 1.5 0 0 0 1.5-1.5V7.621a1.5 1.5 0 0 0-.44-1.06l-4.12-4.122A1.5 1.5 0 0 0 11.378 2H4.5Zm2.25 8.5a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Zm0 3a.75.75 0 0 0 0 1.5h6.5a.75.75 0 0 0 0-1.5h-6.5Z" clipRule="evenodd" />
            </svg>
            Go to docs →
          </a>
        </div>
      </main>
    </div>
  );
}
