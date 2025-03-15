# EnvKit by Onboardbase

> A powerful, framework-agnostic environment variable management toolkit for modern JavaScript applications.

[![npm version](https://img.shields.io/npm/v/@envkit/core.svg)](https://www.npmjs.com/package/@envkit/core)
[![npm version](https://img.shields.io/npm/v/@envkit/nextjs.svg)](https://www.npmjs.com/package/@envkit/nextjs)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/FSL-1.1-MIT)

EnvKit provides a seamless way to manage environment variables in your applications with built-in validation, UI fallbacks for missing variables, and cross-framework compatibility.

## Features

- **Framework Agnostic**: Core package works with any JavaScript framework
- **Framework Integrations**: Dedicated packages for Next.js, with more coming soon
- **Type-Safe**: Built-in TypeScript support and runtime validation
- **Developer-Friendly**: Customizable fallback UI for missing environment variables
- **Client-Server Separation**: Clean separation between client and server code
- **Styled with Tailwind CSS**: Beautiful, customizable UI components

## Installation

### Core Package

```bash
npm install @envkit/core
# or
yarn add @envkit/core
# or
pnpm add @envkit/core
```

### Next.js Integration

```bash
npm install @envkit/nextjs
# or
yarn add @envkit/nextjs
# or
pnpm add @envkit/nextjs
```

## Quick Start

### Next.js Example

1. First, set up your environment variables in your Next.js app's root layout:

```tsx
// app/layout.tsx
import { EnvKitProvider, DefaultFallbackUI } from '@envkit/nextjs';
import '@envkit/nextjs/styles.css'; // Import the styles

export default function RootLayout({ children }) {
  // Define required environment variables
  const requiredVars = [
    'DATABASE_URL',
    'API_KEY',
    'SECRET_KEY',
  ];

  return (
    <html lang="en">
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
```

2. Create an onboarding page that will serve as a fallback when env vars are missing:

```tsx
// app/onboarding/page.tsx
export default function OnboardingPage() {
  return null; // EnvKit will handle the UI
}
```

3. Create an API route handler:

```tsx
// app/api/envkit/route.ts
// Use the direct path to the compiled output for local development
import { createEnvApiHandler } from '@envkit/nextjs/server';
import { NextRequest } from 'next/server';

// Using dynamic import for server-only code
// This ensures proper separation of client and server code
const handlers = createEnvApiHandler({
  // Specify your required variables (if not using provider)
  requiredVars: ['DATABASE_URL', 'API_KEY'],
  
  // Optional: Allow access in production (defaults to false)
  allowInProduction: false,
  
  // Optional: Customize the directory for .env files
  envDir: process.cwd(),
});

// Export GET and POST handlers for Next.js App Router
export async function GET(request: NextRequest) {
  return handlers.statusHandler(request);
}

export async function POST(request: NextRequest) {
  return handlers.updateHandler(request);
}
```

## Using Environment Variables

### Accessing Environment Variables

```tsx
import { useEnv } from '@envkit/nextjs';

export default function MyComponent() {
  const { env, isLoading, error } = useEnv();
  
  if (isLoading) return <div>Loading environment variables...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <h1>Environment Variables</h1>
      <p>API Key: {env.API_KEY}</p>
    </div>
  );
}
```

### Advanced Configuration

#### Custom Validation

You can add custom validation rules to your environment variables:

```tsx
import { EnvKitProvider } from '@envkit/nextjs';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <EnvKitProvider 
          requiredVars={[
            { 
              key: 'API_KEY', 
              validation: (value) => value.startsWith('sk_') ? null : 'API key must start with sk_',
              label: 'API Key',
              description: 'Your secret API key',
              secret: true
            },
            // More vars...
          ]}
          fallbackPath="/onboarding"
        >
          {children}
        </EnvKitProvider>
      </body>
    </html>
  );
}
```

#### Custom Fallback UI

Create a custom fallback UI component:

```tsx
import { FallbackUIProps } from '@envkit/nextjs';

function CustomFallbackUI({ missingVars, isLoading, onComplete }: FallbackUIProps) {
  // Implementation...
  return <div>Your custom UI here</div>;
}

// Then in your layout:
<EnvKitProvider 
  requiredVars={requiredVars}
  fallbackPath="/onboarding"
  customFallbackUI={CustomFallbackUI}
>
  {children}
</EnvKitProvider>
```

## Documentation

For more detailed documentation, visit:

- [Core Package Documentation](/packages/envkit-core/README.md)
- [Next.js Integration Documentation](/packages/nextjs/README.md)
- [Contributing Guide](CONTRIBUTING.md)
- [Publishing Guide](PUBLISHING.md)

## License

FSL-1.1-MIT
