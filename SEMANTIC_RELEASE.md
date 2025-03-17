# Semantic Release Setup for EnvKit

This project uses semantic-release to automate the versioning and publishing process. Here's what you need to know about how it's set up and how to use it.

## Setup Overview

The following components have been set up for semantic releases:

1. **Semantic Release**: Automated version management and package publishing
2. **Commitizen**: Interactive CLI for creating properly formatted commit messages
3. **Commitlint**: Enforces commit message conventions
4. **Husky**: Git hooks to validate commits
5. **GitHub Actions**: CI/CD pipeline for automated releases

## How to Make Commits

For semantic-release to work correctly, commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

Where `type` is one of:

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation changes
- **style**: Changes that don't affect the meaning of the code (formatting)
- **refactor**: Code changes that neither fix a bug nor add a feature
- **perf**: Performance improvements
- **test**: Adding or fixing tests
- **chore**: Changes to the build process or auxiliary tools
- **ci**: Changes to CI configuration files and scripts
- **build**: Changes that affect the build system
- **revert**: Reverting a previous commit

You can use the provided commit script which will guide you through the process:

```bash
yarn commit
```

## Package Versioning

Based on your commits, semantic-release will:

1. **patch release (0.0.x)**: For `fix`, `perf`, and `refactor` type commits
2. **minor release (0.x.0)**: For `feat` type commits 
3. **major release (x.0.0)**: When there's a breaking change (indicated by `!` or `BREAKING CHANGE:` in the commit message)

## GitHub Actions Workflow

The GitHub Actions workflow will:

1. Run on every push to the main branch
2. Build all packages
3. Run semantic-release for each package
4. Publish packages to npm if there are new versions
5. Create GitHub releases with changelogs

## Required Secrets

For deployment to npm, you'll need to add the following secret to your GitHub repository:

- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Local Development

During local development:

1. Make changes to the codebase
2. Use `yarn commit` to create properly formatted commit messages
3. Push to the main branch
4. The GitHub Actions workflow will handle versioning and publishing

## Important Notes

- Semantic-release uses Git tags to track versions
- Each package has its own versioning (managed independently)
- The changelogs are generated automatically from commit messages
- Always use the commitizen interface (`yarn commit`) or ensure your commit messages follow the conventional commits format
