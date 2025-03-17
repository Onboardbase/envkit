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

The core package is typically used by framework-specific implementations rather than directly by end users. If you're integrating with a specific framework, consider using one of our framework-specific packages:

- [@envkit/nextjs](https://www.npmjs.com/package/@envkit/nextjs) for Next.js applications

If you need to use the core package directly:

```typescript
import { defineEnv, parseEnv } from '@envkit/core';
import { string, number, boolean } from 'valibot';

// Define your environment schema
const envSchema = defineEnv({
  DATABASE_URL: string(),
  PORT: number(),
  DEBUG: boolean(),
});

// Parse and validate environment variables
const env = parseEnv(envSchema, process.env);

// Type-safe access to environment variables
console.log(env.DATABASE_URL); // string
console.log(env.PORT); // number
console.log(env.DEBUG); // boolean
```

## License

MIT © Onboardbase
