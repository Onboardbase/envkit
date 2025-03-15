import { ReactNode } from 'react';
// Use the direct path to the compiled output for local development
import { EnvKitProvider, DefaultFallbackUI } from '@envkit/nextjs';
// Import the EnvKit styles
import '@envkit/nextjs/styles.css';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  // Define your required environment variables here
  const requiredVars = [
    'DATABASE_URL',
    'API_KEY',
    'SECRET_KEY',
    // Add more as needed
  ];

  return (
    <html lang="en">
      <head>
        <title>Next.js App with EnvKit</title>
        <meta name="description" content="Next.js application with EnvKit for environment variable management" />
      </head>
      <body>
        <EnvKitProvider 
          requiredVars={requiredVars}
          fallbackPath="/onboarding"
          customFallbackUI={DefaultFallbackUI}
        >
          {children}
        </EnvKitProvider>
      </body>
    </html>
  );
}
