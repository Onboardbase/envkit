# @envkit/core

The core framework-agnostic package for EnvKit, a powerful environment variables management solution by Onboardbase.

## Installation

```bash
npm install @envkit/core
# or
yarn add @envkit/core
# or
pnpm add @envkit/core
```

## Overview

@envkit/core provides the fundamental utilities and types for environment variable validation, transformation, and management that powers the framework-specific implementations.

## Key Features

- Type-safe environment variable validation
- Framework-agnostic utilities
- Validation powered by Valibot
- Simple and flexible API

## Usage

### Direct Usage
While the core package is primarily used by framework-specific implementations, you can use it directly in any JavaScript/TypeScript project:

```typescript
import { defineEnv, parseEnv } from '@envkit/core';
import { string, number, boolean, url } from 'valibot';

// Define your environment schema with validation
const envSchema = defineEnv({
  API_KEY: string([minLength(1), startsWith('sk_')]),
  DATABASE_URL: string([url()]),
  PORT: number([minValue(1000), maxValue(9999)]),
  DEBUG: boolean(),
});

// Parse and validate environment variables
const env = parseEnv(envSchema, process.env);

// Type-safe access to environment variables
console.log(env.DATABASE_URL); // string (valid URL)
console.log(env.PORT); // number (between 1000-9999)
console.log(env.DEBUG); // boolean
```

### Common Use Cases

1. **API Configuration**
```typescript
const apiConfig = defineEnv({
  API_KEY: string([minLength(32)]),
  API_BASE_URL: string([url()]),
  API_VERSION: string([regex(/^v\d+$/)])
});
```

2. **Database Configuration**
```typescript
const dbConfig = defineEnv({
  DB_HOST: string(),
  DB_PORT: number([minValue(1024)]),
  DB_USER: string(),
  DB_PASSWORD: string([minLength(8)]),
  DB_SSL: boolean()
});
```

3. **Feature Flags**
```typescript
const featureFlags = defineEnv({
  ENABLE_BETA_FEATURES: boolean(),
  MAX_USERS: number([minValue(1)]),
  MAINTENANCE_MODE: boolean()
});
```

### Framework Integrations

For framework-specific features, consider using our dedicated packages:

- [@envkit/nextjs](https://www.npmjs.com/package/@envkit/nextjs) for Next.js applications

## License

This project is licensed under the FSL-1.1-MIT License. See the [LICENSE](../../LICENSE) file for details.
