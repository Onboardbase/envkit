# Publishing Guide for EnvKit

This guide provides step-by-step instructions for building and publishing the EnvKit packages to npm under the `@envkit` scope.

## Prerequisites

- Node.js (v18 or later)
- Yarn (v1.22 or later)
- npm account with access to the `@envkit` organization

## Setup

1. Ensure you're logged in to npm with appropriate permissions:

```bash
npm login
```

2. Make sure your git working directory is clean:

```bash
git status
```

## Building Packages

Before publishing, you need to build all packages to ensure they're ready for distribution.

### Building the Core Package

```bash
cd packages/envkit-core
yarn build
```

The build process for the core package:
1. Compiles TypeScript files to JavaScript
2. Generates type declarations
3. Creates CommonJS and ESM outputs

### Building the Next.js Package

```bash
cd packages/nextjs
yarn build
```

The Next.js package build process:
1. Compiles TypeScript files to JavaScript
2. Generates type declarations
3. Processes Tailwind CSS styles
4. Creates a properly separated client/server architecture

## Testing Before Publishing

Always test your packages before publishing:

```bash
# Test the monorepo setup
yarn test

# Run the demo app to verify everything works
cd packages/nextjs-demo
yarn dev
```

Ensure that:
- All tests are passing
- The demo application works as expected
- Client and server code are properly separated

## Version Management

1. Update package versions following semantic versioning:

```bash
cd packages/envkit-core
yarn version --new-version x.y.z

cd ../nextjs
yarn version --new-version x.y.z
```

2. Update cross-dependencies between packages:

If `nextjs` depends on `envkit-core`, make sure the version reference in its `package.json` is updated:

```json
{
  "dependencies": {
    "@envkit/core": "^x.y.z"
  }
}
```

## Publishing to npm

### Publishing the Core Package

```bash
cd packages/envkit-core
npm publish --access public
```

### Publishing the Next.js Package

```bash
cd packages/nextjs
npm publish --access public
```

## Important Publishing Considerations

### Ensuring Proper Client/Server Separation

The Next.js package uses a specific architecture to separate client and server code:

1. The `package.json` has specific exports configuration:
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "default": "./dist/index.js"
  },
  "./server": {
    "types": "./dist/server.d.ts",
    "default": "./dist/server.js"
  },
  "./client": {
    "types": "./dist/client.d.ts",
    "default": "./dist/client.js"
  },
  "./styles.css": "./dist/styles.css"
}
```

2. Verify that:
   - Server-only code uses the `server-only` package
   - Node.js built-in modules are dynamically imported
   - No server code leaks into client bundles

### CSS/Tailwind Bundling

For the Next.js package:

1. The build process includes running the Tailwind CLI to generate the CSS output:
```bash
tailwindcss -i ./src/styles/tailwind.css -o ./dist/styles.css
```

2. Ensure the CSS file is properly exported and consumable by users with:
```tsx
import '@envkit/nextjs/styles.css';
```

### TypeScript Declarations

Ensure typings are correctly generated and exported:

```bash
# Check that type declarations are properly generated
ls packages/nextjs/dist/*.d.ts
ls packages/envkit-core/dist/*.d.ts
```

## Post-Publishing

After publishing, tag the release in git:

```bash
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

Update the demo app to use the published versions:

```json
{
  "dependencies": {
    "@envkit/core": "^1.0.0",
    "@envkit/nextjs": "^1.0.0"
  }
}
```

## Troubleshooting

### Package Not Found After Publishing

If your package isn't immediately available:
- npm registry might be syncing; wait 5-10 minutes
- Verify the package was published: `npm view @envkit/nextjs`

### Client/Server Code Separation Issues

If you encounter "Cannot use import statement outside a module" errors:
- Check the import paths and exports in package.json
- Ensure dynamic imports are used for Node.js built-in modules
- Verify the `server-only` package is used correctly

## Support

For publishing issues, contact the EnvKit maintainers:
- [Open an issue](https://github.com/onboardbase/envkit/issues)
- Join our Discord community for real-time support
