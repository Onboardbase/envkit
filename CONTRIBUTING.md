# Contributing to EnvKit

Thank you for your interest in contributing to EnvKit! This document provides guidelines and instructions for contributing to this project.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct. Please be respectful and considerate of others.

## Development Setup

### Prerequisites

- Node.js (v18 or later)
- Yarn (v1.22 or later)

### Getting Started

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/your-username/envkit.git
cd envkit
```

3. Install dependencies:

```bash
yarn install
```

4. Start the development environment:

```bash
# Run the demo app
yarn workspace @envkit/nextjs-demo dev
```

## Project Structure

EnvKit is organized as a monorepo with the following packages:

- `packages/envkit-core` - Framework-agnostic core functionality
- `packages/nextjs` - Next.js integration
- `packages/nextjs-demo` - Demo Next.js application showcasing EnvKit

## Important Architectural Decisions

### Client/Server Separation

One of the most critical aspects of EnvKit is the proper separation of client and server code, especially for the Next.js package:

1. Use the `server-only` package to mark files that should never be imported on the client
2. Make dynamic imports for Node.js built-in modules within function bodies
3. Create separate client and server entry points
4. Configure package.json exports field to properly map imports
5. Avoid direct dependencies between client and server code

This approach ensures Next.js client components don't bundle server-side code that uses Node.js built-in modules.

### CSS/Tailwind Integration

EnvKit uses Tailwind CSS for styling components:

1. Styles are defined in `src/styles/tailwind.css`
2. The build process compiles these styles to `dist/styles.css`
3. Components use either direct Tailwind utility classes or custom EnvKit component classes

## Development Workflow

### Creating a Feature

1. Create a new branch from `main`:

```bash
git checkout -b feature/your-feature-name
```

2. Implement your changes
3. Write tests for your changes
4. Ensure all tests pass:

```bash
yarn test
```

5. Build the packages to verify your changes work in a production environment:

```bash
yarn build
```

### Commit Guidelines

We follow conventional commits for our commit messages:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code changes that neither fix bugs nor add features
- `test:` - Adding or modifying tests
- `chore:` - Changes to the build process or auxiliary tools

Example:
```
feat(nextjs): add support for custom validation functions
```

### Pull Request Process

1. Update the README.md or other documentation with details of your changes, if appropriate
2. Make sure your code passes all tests and linting rules
3. Submit your pull request against the `main` branch
4. Request a review from a maintainer
5. Address any feedback from the code review

## Testing

We use Jest for testing. Run the test suite with:

```bash
yarn test
```

When adding new features, please add appropriate tests:

- Unit tests for utility functions
- Integration tests for API functionality
- Component tests for UI components

## Documentation

Documentation is a crucial part of EnvKit. When adding new features, please update:

1. Code comments using JSDoc format
2. README.md files in the relevant packages
3. The main README.md if your change affects the public API

## TypeScript

EnvKit is written in TypeScript. Please:

- Maintain type safety throughout the codebase
- Use explicit types rather than `any`
- Export public types for library consumers

## Styling Guidelines

For components:

- Use Tailwind CSS for styling
- Maintain responsive designs that work on various screen sizes
- Ensure accessibility (appropriate contrast, semantic HTML, etc.)

## Releasing

See [PUBLISHING.md](./PUBLISHING.md) for details on the release process.

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## Contact

If you have questions about contributing, open an issue or reach out to the maintainers:

- GitHub Issues: [envkit/issues](https://github.com/onboardbase/envkit/issues)

Thank you for contributing to EnvKit!
