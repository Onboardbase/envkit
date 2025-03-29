# @envkit/nextjs

Environment variable management for Next.js applications, powered by EnvKit and Onboardbase.

## Installation

```bash
npm install @envkit/nextjs
# or
yarn add @envkit/nextjs
# or
pnpm add @envkit/nextjs
```

## Overview

@envkit/nextjs provides a seamless integration with Next.js applications for managing environment variables with type safety, validation, and an elegant fallback UI for missing variables.

### Common Use Cases

1. **Development Environment Setup**
   - Automatically prompt developers for required environment variables
   - Support for different .env files per environment
   - Easy onboarding for new team members

2. **Production Deployment**
   - Validate environment variables before deployment
   - Prevent application startup with missing critical variables
   - Secure handling of sensitive information

3. **Local Development**
   - Interactive UI for managing environment variables
   - Support for uploading .env files
   - Bulk paste functionality for quick setup

Get started quickly with our [starter template](https://github.com/Onboardbase/envkit-nextjs-template)
## Key Features

- **Type-safe environment variables**: Define your environment schema with validation
- **Elegant fallback UI**: Built-in UI for handling missing environment variables
- **Server-side and client-side support**: Access environment variables in both contexts
- **API routes for environment management**: Update environment variables via API routes
- **File uploads**: Support for uploading .env and .json files
- **Bulk paste**: Easily paste multiple environment variables at once

## Usage

### Basic Setup

Wrap your application with `EnvKitProvider` in your Next.js App Router layout or page:

```tsx
// app/layout.tsx
import { EnvKitProvider } from '@envkit/nextjs';
import '@envkit/nextjs/styles.css';

export default function RootLayout({ children }) {

  return (
    <html lang="en">
      <body>
        <EnvKitProvider 
          fallbackPath="/env-setup" // Optional, defaults to '/env-setup'
        >
          {children}
        </EnvKitProvider>
      </body>
    </html>
  );
}
```

### Customizing the UI

You can customize the environment setup UI by providing additional props:

```tsx
<EnvKitProvider 
  logoUrl="https://yourcompany.com/logo.png" 
  title="Environment Setup" 
  fallbackPath="/env-setup"
  isProduction={false}
  description="Please provide the required environment variables"
  disableAddNew={true}
  maskAllEnvs={true} // Mask all environment variable values by default
>
  {children}
</EnvKitProvider>
```

#### Masking Environment Variables

You can choose to mask all environment variable values by default, providing a toggle button for users to show/hide values:

```tsx
<EnvKitProvider 
  requiredVars={requiredVars}
  maskAllEnvs={true} // Enables masking of all environment variable values
>
  {children}
</EnvKitProvider>
```

### Custom Fallback UI

You can also provide a completely custom UI by creating your own component:

```tsx
import { FallbackUIProps } from '@envkit/nextjs';

function MyCustomFallbackUI({
  missingVars,
  isLoading,
  onSubmit,
  logoUrl,
  title,
  description,
  maskAllEnvs
}: FallbackUIProps) {
  // Your custom implementation here
  return (
    <div>
      {logoUrl && <img src={logoUrl} alt="Logo" />}
      <h1>{title || "Environment Setup"}</h1>
      <p>{description || "Please configure your environment variables"}</p>
      
      <form onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}>
        {missingVars.map((variable) => (
          <div key={variable.key}>
            <label>{variable.key}</label>
            <input 
              type={maskAllEnvs ? "password" : "text"} 
              placeholder={variable.placeholder || `Enter ${variable.key}`}
            />
          </div>
        ))}
        <button type="submit" disabled={isLoading}>
          {isLoading ? "Submitting..." : "Submit"}
        </button>
      </form>
    </div>
  );
}

// Then in your layout:
<EnvKitProvider 
  customFallbackUI={MyCustomFallbackUI}
  logoUrl="https://yourcompany.com/logo.png" 
  title="Environment Setup"
  description="Please configure your environment"
>
  {children}
</EnvKitProvider>
```

### Global Paste Functionality

The default fallback UI includes a global paste handler that allows users to paste key-value pairs from their clipboard anywhere on the page. This makes it easy to copy values from a .env file or another source and paste them directly into the form.

Supported formats:
- `.env` format: `KEY=value`
- JSON format: `{"KEY": "value"}`
- CSV format: `KEY,value`

When pasted, EnvKit will automatically parse the key-value pairs and populate the form fields with the corresponding values.

## Advanced Configuration

### API Route for Environment Variable Management

You can create an API route to manage environment variables:

```typescript
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

## Props Reference

### EnvKitProvider Props

| Prop | Type | Description | Default |
|------|------|-------------|---------|
| `children` | `ReactNode` | React children | Required |
| `requiredVars` | `string[]` | List of required environment variables (only needed on the backend side) | Optional |
| `fallbackPath` | `string` | Path to redirect to when environment variables are missing | `/env-setup` |
| `isProduction` | `boolean` | Whether the application is running in production mode | `process.env.NODE_ENV === 'production'` |
| `logoUrl` | `string` | URL to a logo to display in the fallback UI | None |
| `title` | `string` | Title to display at the top of the fallback UI | None |
| `description` | `string` | Description to display below the title | None |
| `customFallbackUI` | `React.ComponentType<FallbackUIProps>` | Custom component to render when environment variables are missing | `DefaultFallbackUI` |
| `onMissingVars` | `(missingVars: string[]) => void` | Callback when missing vars are detected | None |
| `maskAllEnvs` | `boolean` | When true, all environment variables will be masked by default | `false` |
| `disableAddNew` | `boolean` | When true, users cannot add new environment variables and only the required variables will be shown | `false` |

### FallbackUIProps

| Prop | Type | Description |
|------|------|-------------|
| `missingVars` | `MissingVar[]` | Array of missing environment variable objects |
| `isLoading` | `boolean` | Whether the form is currently submitting |
| `onSubmit` | `() => void` | Function to call when the form is submitted |
| `logoUrl` | `string` | Optional logo URL |
| `title` | `string` | Optional title text |
| `description` | `string` | Optional description text |
| `maskAllEnvs` | `boolean` | Whether to mask all environment variables by default |

## License

This project is licensed under the FSL-1.1-MIT License. See the [LICENSE](../../LICENSE) file for details.
