# EnvKit 🌍

A powerful environment variables management kit for Next.js applications.

EnvKit helps you:
- Validate required environment variables
- Handle missing variables with a beautiful fallback UI in development
- Support multiple .env files
- Provide a seamless developer experience

## Features

✅ **Validate Required Environment Variables**: Define which environment variables are required for your application to function properly.

✅ **Development Fallback UI**: When required variables are missing in development, EnvKit shows a user-friendly UI to add them.

✅ **Environment File Management**: Support for multiple .env files (`.env`, `.env.local`, `.env.development`, etc.) following Next.js conventions.

✅ **Secure by Default**: Prevents the application from starting in production if required variables are missing.

✅ **Fully Typed**: Built with TypeScript for a robust developer experience.

## Installation

```bash
npm install envkit
# or
yarn add envkit
# or
pnpm add envkit
```

## Quick Start

### 1. Wrap your application with EnvKitProvider

Add EnvKitProvider to your Next.js app's layout:

```tsx
// src/app/layout.tsx
import { EnvKitProvider } from '@/lib/envkit';

// Define required environment variables
const requiredEnvVars = [
  {
    name: "API_KEY",
    required: true,
    description: "API key for external service"
  },
  {
    name: "DATABASE_URL",
    required: true,
    description: "Connection URL for the database"
  },
  {
    name: "LOG_LEVEL",
    required: false,
    defaultValue: "info",
    description: "Log level for the application (optional)"
  }
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <EnvKitProvider envVars={requiredEnvVars}>
          {children}
        </EnvKitProvider>
      </body>
    </html>
  );
}
```

### 2. Access Environment Status Anywhere

Use the `useEnvKit` hook to check environment status and refresh when needed:

```tsx
'use client';

import { useEnvKit } from '@/lib/envkit';

export default function MyComponent() {
  const { isValid, missingVars, refreshEnv } = useEnvKit();

  return (
    <div>
      <p>Environment Status: {isValid ? 'Valid' : 'Missing Variables'}</p>
      
      {!isValid && (
        <div>
          <p>Missing Variables:</p>
          <ul>
            {missingVars.map(v => (
              <li key={v.name}>{v.name}: {v.description}</li>
            ))}
          </ul>
        </div>
      )}
      
      <button onClick={refreshEnv}>Refresh Environment</button>
    </div>
  );
}
```

## API Reference

### EnvKitProvider

The main component that provides environment validation and fallback UI.

```tsx
<EnvKitProvider
  envVars={requiredVars}
  fallbackComponent={CustomFallbackUI}
  failInProduction={true}
  showFallbackInDev={true}
>
  {children}
</EnvKitProvider>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `envVars` | `EnvVarConfig[]` | Required | Array of environment variables to validate |
| `fallbackComponent` | `ComponentType<FallbackUIProps>` | Built-in UI | Custom component to render when variables are missing |
| `failInProduction` | `boolean` | `true` | Whether to throw an error in production when variables are missing |
| `showFallbackInDev` | `boolean` | `true` | Whether to show fallback UI in development |

### EnvVarConfig

Configuration for each environment variable.

```typescript
type EnvVarConfig = {
  name: string;          // Environment variable name
  required: boolean;     // Whether the variable is required
  description?: string;  // Description of the variable (used in UI)
  defaultValue?: string; // Default value if not provided
};
```

### useEnvKit Hook

Hook to access environment validation state and functions.

```typescript
const { 
  isValid,        // Whether all required variables are present
  missingVars,    // Array of missing variables
  allVars,        // Array of all variables
  checkEnvironment, // Function to manually validate environment
  refreshEnv      // Function to refresh environment validation
} = useEnvKit();
```

## Environment File Priority

EnvKit follows the Next.js convention for loading environment files, with the following priority (highest to lowest):

1. `process.env` - Environment variables set in the actual environment
2. `.env.local` - Local environment overrides
3. `.env.{NODE_ENV}.local` - Environment-specific local overrides
4. `.env.{NODE_ENV}` - Environment-specific variables
5. `.env` - Default environment variables

## Development vs Production Behavior

### Development Mode

- When required environment variables are missing, shows a fallback UI
- Allows setting variables through a form or uploading a .env file
- Updates .env files in real-time

### Production Mode

- Fails to start if required variables are missing
- No fallback UI is shown
- No ability to modify .env files

## Best Practices

1. **Keep Sensitive Information Safe**
   - Never commit .env files to version control
   - Use .env.example files as templates

2. **Validate Early**
   - Place EnvKitProvider as high as possible in your component tree

3. **Clear Descriptions**
   - Provide clear descriptions for all environment variables
   - Include format details and examples

4. **Use Defaults When Possible**
   - Provide sensible defaults for non-critical variables

## Custom Fallback UI

You can provide a custom fallback UI component:

```tsx
import { FallbackUIProps } from '@/lib/envkit';

function MyCustomFallbackUI({ validationResult }: FallbackUIProps) {
  const { missingVars } = validationResult;
  
  return (
    <div>
      <h1>Custom Environment Configuration Required</h1>
      <ul>
        {missingVars.map(v => (
          <li key={v.name}>{v.name}</li>
        ))}
      </ul>
      {/* Your custom form to handle env vars */}
    </div>
  );
}

// In your layout or provider:
<EnvKitProvider 
  envVars={requiredVars} 
  fallbackComponent={MyCustomFallbackUI}
>
  {children}
</EnvKitProvider>
```

## License

MIT

---

Built with ❤️ by [MahmoudGalal@onboardbase]
