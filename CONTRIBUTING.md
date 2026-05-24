# Contributing to Gym App

Thank you for considering contributing to Gym App! This document outlines
the process for contributing to this project.

## Getting Started

1. Fork the repository
2. Clone your fork:
```bash
   git clone https://github.com/<your-username>/CloudProject.git
   cd CloudProject
```
3. Create a feature branch:
```bash
   git checkout -b feature/your-feature-name
```

## Branch Naming Convention

| Prefix | Purpose | Example |
|--------|---------|---------|
| `feature/` | New feature | `feature/step-goal-setting` |
| `fix/` | Bug fix | `fix/water-tracker-reset` |
| `docs/` | Documentation only | `docs/api-endpoints` |
| `refactor/` | Code refactor | `refactor/auth-middleware` |
| `chore/` | Build, CI, config | `chore/update-node-version` |

## Development Workflow

### Backend

```bash
cd gym-app-backend
npm install
npm run dev
npm test
npm run migrate
```

### Frontend

```bash
cd gym-app-frontend
npm install
npx expo start
```

## Commit Message Format


**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`

**Examples:**


## Pull Request Checklist

- [ ] `npm test` passes locally
- [ ] No secrets or `.env` files are committed
- [ ] PR description explains what changed and why

## Reporting Bugs

Open a GitHub Issue and include:
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs (`docker compose logs backend`)

