# Contributing to NCTIRS Dashboard

Thank you for your interest in contributing to the National Counter-Terrorism Intelligence Response System (NCTIRS) Dashboard! This document provides guidelines and instructions for contributing.

## Table of Contents
- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Pull Request Process](#pull-request-process)
- [Security Considerations](#security-considerations)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before contributing.

## Getting Started

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Git

### Local Development Setup

1. **Fork the repository**
   ```bash
   # Clone your fork
   git clone https://github.com/YOUR_USERNAME/nctirs-dashboard.git
   cd nctirs-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open the dashboard**
   Navigate to `http://localhost:3000` in your browser.

## Development Workflow

### Branch Naming Convention
- `feature/` - New features (e.g., `feature/add-threat-heatmap`)
- `fix/` - Bug fixes (e.g., `fix/incident-list-overflow`)
- `docs/` - Documentation changes
- `refactor/` - Code refactoring
- `test/` - Test additions or modifications

### Commit Messages
We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Code style (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(dashboard): add real-time threat level indicator
fix(surveillance): resolve camera feed truncation issue
docs(readme): update installation instructions
```

## Coding Standards

### TypeScript
- Use TypeScript for all new code
- Enable strict mode
- Define explicit types; avoid `any`

### React Components
- Use functional components with hooks
- Keep components focused and reusable
- Follow the existing component structure

### Styling
- Use Tailwind CSS utility classes
- Follow the design system in `globals.css`
- Maintain responsive design patterns

### Code Quality
```bash
# Run linting
npm run lint

# Build for production (catches type errors)
npm run build
```

## Pull Request Process

1. **Create a feature branch** from `main`
2. **Make your changes** following the coding standards
3. **Test thoroughly** - ensure the build passes
4. **Update documentation** if needed
5. **Submit pull request** with a clear description

### PR Requirements
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Build passes without errors
- [ ] Related issue linked (if applicable)
- [ ] Screenshots provided for UI changes

### Review Process
- PRs require at least one maintainer approval
- Address all review comments
- Keep PRs focused and reasonably sized

## Security Considerations

This is a national security application. Please note:

- **Never commit sensitive data** (API keys, credentials, PII)
- **Report security issues privately** - see [SECURITY.md](SECURITY.md)
- **Follow security best practices** in all contributions
- **Mock data only** - no real intelligence data in the repository

## Questions?

If you have questions about contributing, please:
1. Check existing issues and discussions
2. Open a new issue with the "question" label
3. Contact the maintainers

---

Thank you for contributing to Kenya's national security infrastructure! 🇰🇪
