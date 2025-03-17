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

## Key Features

- **Type-safe environment variables**: Define your environment schema with validation
- **Elegant fallback UI**: Built-in UI for handling missing environment variables
- **Server-side and client-side support**: Access environment variables in both contexts
- **API routes for environment management**: Update environment variables via API routes
- **File uploads**: Support for uploading .env and .json files
- **Bulk paste**: Easily paste multiple environment variables at once

## Usage

### 1. Define your environment schema

```typescript
// env.ts
import { createEnvSchema } from '@envkit/nextjs';
import { string, number, boolean } from 'valibot';

export const envSchema = createEnvSchema({
  DATABASE_URL: {
    schema: string(),
    description: 'URL of the database',
    required: true
  },
  API_KEY: {
    schema: string(),
    description: 'API key for external service',
    secret: true,
    required: true
  },
  DEBUG: {
    schema: boolean(),
    description: 'Enable debug mode',
    default: false
  },
  PORT: {
    schema: number(),
    description: 'Port for the server',
    default: 3000
  }
});

// Infer the type from the schema
export type Env = typeof envSchema.type;
```

### 2. Set up the EnvKit provider

```tsx
// app/layout.tsx
import { EnvKitProvider } from '@envkit/nextjs';
import { envSchema } from './env';
import '@envkit/nextjs/styles.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <EnvKitProvider schema={envSchema}>
          {children}
        </EnvKitProvider>
      </body>
    </html>
  );
}
```

### 3. Use environment variables

```tsx
// app/page.tsx
import { getEnv } from '@envkit/nextjs';
import { envSchema } from './env';

export default async function Home() {
  const env = getEnv(envSchema);
  
  return (
    <div>
      <h1>Environment Variables</h1>
      <p>Debug mode: {env.DEBUG ? 'Enabled' : 'Disabled'}</p>
      <p>Port: {env.PORT}</p>
      {/* API_KEY won't be exposed to the client */}
    </div>
  );
}
```

### 4. API route for environment variable management

```typescript
// app/api/env/route.ts
import { createEnvApiHandler } from '@envkit/nextjs/server';
import { envSchema } from '../../env';

const handler = createEnvApiHandler({
  schema: envSchema,
  // Optional custom configuration
  config: {
    storageType: 'file', // 'file' or 'memory'
    filePath: '.env.local'
  },
  // Optional access control
  authorize: async (req) => {
    // Implement your auth logic here
    return true;
  }
});

export { handler as GET, handler as POST };
```

## License

MIT © Onboardbase
