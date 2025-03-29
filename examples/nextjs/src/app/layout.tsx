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
          logoUrl='https://onboardbase.com/assets/img/home/github.svg'
          title="Welcome to Github"
          maskAllEnvs={true}
          description="Configure the required envs to run this application."
          fallbackPath="/onboarding"
          customFallbackUI={DefaultFallbackUI}
          disableAddNew={true}
        >
          {children}
        </EnvKitProvider>
      </body>
    </html>
  );
}
