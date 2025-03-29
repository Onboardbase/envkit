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
Checkout the [starterkit](https://github.com/Onboardbase/envkit-nextjs-template) here
1. First, set up your environment variables in your Next.js app's root layout:

```tsx
// app/layout.tsx
import { EnvKitProvider, DefaultFallbackUI } from '@envkit/nextjs';
import '@envkit/nextjs/styles.css'; // Import the styles

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body>
        <EnvKitProvider 
          fallbackPath="/onboarding" 
          customFallbackUI={DefaultFallbackUI}
          maskAllEnvs={true}
          disableAddNew={true}
          logoUrl="https://yourcompany.com/logo.png" // Optional custom logo
          title="Environment Setup Required" // Optional custom title
          description="Please provide the following variables to continue" // Optional custom description
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
  environments: {
    production: {
      // Specify required variables for production
      requiredVars: ['DATABASE_URL', 'API_KEY'],
    },
    local: {
      // Specify required variables for local development
      targetEnvFile: '.env.local',
      requiredVars: ['DATABASE_URL', 'API_KEY', 'zyx'],
    },
    development: {
      // Specify required variables for development
      targetEnvFile: '.env.development',
      requiredVars: ['DATABASE_URL', 'API_KEY'],
    },
  },
  
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

### Advanced Configuration

#### Custom Fallback UI

EnvKit provides several customization options for the fallback UI:

##### Using Appearance Options

```tsx
// Customize the appearance without creating a custom component
<EnvKitProvider 
  requiredVars={requiredVars}
  fallbackPath="/onboarding"
  logoUrl="https://yourcompany.com/logo.png" // Custom logo URL
  title="Environment Setup" // Custom title
  description="Please enter the required environment variables" // Custom description
  maskAllEnvs={true} // Mask all environment variables by default
  disableAddNew={true} // Only allow configuration of required environment variables
>
  {children}
</EnvKitProvider>
```

##### Restricting to Required Variables Only

The `disableAddNew` property ensures that users can only configure the environment variables that you've specified as required, preventing them from adding any new variables:

```tsx
<EnvKitProvider
  requiredVars={requiredVars}
  disableAddNew={true} // Only show and allow configuration of required variables
>
  {children}
</EnvKitProvider>
```

This is useful when you want to strictly control which environment variables are set in your application.

##### Using a Fully Custom Component

Create a custom fallback UI component:

```tsx
import { FallbackUIProps } from '@envkit/nextjs';

function CustomFallbackUI({ 
  missingVars, 
  isLoading, 
  onSubmit, 
  logoUrl, 
  title, 
  description,
  maskAllEnvs,
  disableAddNew,
}: FallbackUIProps) {
  // Implementation...
  return <div>Your custom UI here</div>;
}

// Then in your layout:
<EnvKitProvider
  fallbackPath="/onboarding"
  customFallbackUI={CustomFallbackUI}
  logoUrl="https://yourcompany.com/logo.png" // These props will be passed to your custom component
  title="Environment Setup"
  maskAllEnvs={true}
  disableAddNew={true}
  description="Please enter the required environment variables"
>
  {children}
</EnvKitProvider>
```

## Documentation

For more detailed documentation, visit:

<!-- - [Core Package Documentation](/packages/envkit-core/README.md)
- [Next.js Integration Documentation](/packages/nextjs/README.md) -->
- [Contributing Guide](CONTRIBUTING.md)
<!-- - [Publishing Guide](PUBLISHING.md) -->

## License

This project is licensed under the FSL-1.1-MIT License. See the [LICENSE](/LICENSE) file for details.
