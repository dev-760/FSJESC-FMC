# Contributing

Thank you for your interest in contributing to the FSJESC Financial Markets Club platform. This document outlines the conventions and expectations for contributors.

## Code of Conduct

- Be respectful and inclusive
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/FSJESC-FMC.git`
3. Install dependencies: `pnpm install`
4. Create a branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Commit and push
7. Create a pull request

## Development Workflow

### Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `refactor/` - Code refactoring
- `docs/` - Documentation updates
- `test/` - Test additions

### Commit Messages

Follow conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Maintenance tasks

Examples:

```
feat(competitions): add leaderboard scoring algorithm

fix(auth): resolve session timeout issue
docs(readme): update installation instructions
```

## Code Conventions

### TypeScript

- Use strict mode
- No `any` types
- Explicit return types on functions
- Use interfaces for object shapes
- Prefer `const` over `let`

### React

- Use functional components
- Use hooks for state and side effects
- Prefer server components over client components
- Mark client components with `"use client"`
- Use TypeScript for all components

### Styling

- Use Tailwind CSS utility classes
- Follow the design system in `DESIGN.md`
- No custom CSS unless absolutely necessary
- Use semantic colors from the design tokens

### File Organization

```
src/
├── app/                    # Next.js App Router
├── application/          # Application services
├── components/            # React components
│   ├── ui/                # Primitives
│   ├── financial/         # Financial components
│   └── simulator/         # Simulator components
├── infrastructure/        # Infrastructure
│   ├── auth/              # Auth
│   ├── database/          # Database
│   └── content/           # Content
└── lib/                   # Utilities
```

## Testing

### Unit Tests

Write unit tests for:

- Pure functions (trading engine, market model)
- Utilities (formatting, validation)
- Services (with mocked infrastructure)

Run: `pnpm test:unit`

### Integration Tests

Write integration tests for:

- API routes with test database
- Database operations
- Auth flows

Run: `pnpm test:integration`

### E2E Tests

Write E2E tests for:

- Critical user flows
- Authentication
- Trading operations

Run: `pnpm test:e2e`

### Test Coverage

Aim for >90% coverage on:

- Trading engine
- Market model
- Authentication
- Financial mutations

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass: `pnpm test`
4. Run linting: `pnpm lint`
5. Run type checking: `pnpm typecheck`
6. Update `CHANGELOG.md` if applicable
7. Create PR with descriptive title and description

### PR Description Template

```markdown
## Description

Brief description of changes

## Type of Change

- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] All tests pass

## Checklist

- [ ] Code follows project style
- [ ] Self-reviewed the code
- [ ] Commented complex code
- [ ] Updated documentation
- [ ] No new warnings generated
- [ ] Added tests that fail without the fix
```

## Review Process

1. Maintainer reviews the PR
2. Feedback is provided if changes are needed
3. Address feedback and update PR
4. PR is approved and merged
5. Branch is deleted

## Release Process

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create git tag: `git tag v1.0.0`
4. Push tag: `git push origin v1.0.0`
5. Deploy to production

## Documentation

### Updating Documentation

When adding features:

- Update relevant documentation files
- Add examples in `README.md` if applicable
- Update API documentation if changing routes

### Comments

- Comment complex logic
- Explain "why" not "what"
- Keep comments up to date
- Remove obsolete comments

## Security

### Reporting Vulnerabilities

If you find a security vulnerability:

1. Do not create a public issue
2. Email: security@fsjesc-fmc.local
3. Include details and reproduction steps
4. Allow time to fix before disclosing

### Security Best Practices

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Validate all user input
- Use parameterized queries (Drizzle ORM handles this)
- Follow OWASP guidelines

## Questions?

- Check existing documentation
- Search existing issues
- Ask in discussions
- Contact: contact@fsjesc-fmc.local

## License

By contributing, you agree that your contributions will be licensed under the project's license.
