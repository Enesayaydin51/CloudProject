# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| latest (main) | ✅ |
| older branches | ❌ |

## Reporting a Vulnerability

**Please do not open a public GitHub Issue for security vulnerabilities.**

Instead, report them privately:

1. Go to the **Security** tab of this repository
2. Click **"Report a vulnerability"**
3. Fill in the details

We will respond within **72 hours** and aim to release a fix within **14 days**
depending on severity.

## What to Include in Your Report

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (optional but appreciated)

## Security Best Practices for Deployment

### Environment Variables

- Never commit `.env` files — only `.env.example` with placeholder values
- Rotate `JWT_SECRET` immediately if compromised

### JWT

- `JWT_SECRET` must be at least 32 random characters in production
- Default expiry is `7d` — adjust via `JWT_EXPIRES_IN` for sensitive deployments

### Database

- Change default `DB_PASSWORD=postgres` before any internet-facing deployment
- Restrict PostgreSQL to the internal Docker network only

### Redis

- Redis is not password-protected by default in development
- Add `REDIS_PASSWORD` and enable `requirepass` in production

### HTTPS

- Place the backend behind an HTTPS reverse proxy in production
  (e.g. Nginx, Caddy, Cloudflare Tunnel)

## Dependency Auditing

```bash
cd gym-app-backend
npm audit

cd ../gym-app-frontend
npm audit
```

Run `npm audit fix` for non-breaking fixes.