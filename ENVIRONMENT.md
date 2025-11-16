# Environment Variables Setup Guide

This guide explains all environment variables required for the ESTA Tracker application.

## Quick Setup

### Local Development

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Update the `.env` file with your local values:
   - Set `JWT_SECRET` to a secure random string
   - Configure `DATABASE_URL` with your PostgreSQL connection string
   - Adjust `VITE_API_URL` if your backend runs on a different port

### Vercel Deployment

Set these environment variables in your Vercel project settings:

**Go to**: Project Settings → Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Application environment | `production` |
| `VITE_API_URL` | Backend API URL | `https://your-api-domain.com` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate using `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `CORS_ORIGIN` | Allowed CORS origins | `*` in dev |
| `PORT` | Backend server port | `3001` |
| `JWT_EXPIRES_IN` | JWT token expiration | `7d` |
| `LOG_LEVEL` | Logging level | `info` |
| `RATE_LIMIT_MAX` | Max requests per window | `100` |
| `RATE_LIMIT_WINDOW_MS` | Rate limit window | `900000` |

## Environment-Specific Configuration

### Development

```bash
NODE_ENV=development
VITE_API_URL=http://localhost:3001
DATABASE_URL=postgresql://localhost:5432/esta_tracker_dev
JWT_SECRET=dev-secret-key-change-me
DEBUG=true
```

### Staging

```bash
NODE_ENV=staging
VITE_API_URL=https://staging-api.esta-tracker.com
DATABASE_URL=postgresql://user:pass@staging-db:5432/esta_tracker
JWT_SECRET=<secure-random-string>
```

### Production

```bash
NODE_ENV=production
VITE_API_URL=https://api.esta-tracker.com
DATABASE_URL=postgresql://user:pass@production-db:5432/esta_tracker
JWT_SECRET=<secure-random-string>
CORS_ORIGIN=https://esta-tracker.com
RATE_LIMIT_MAX=50
```

## Security Best Practices

1. **Never commit `.env` files** - They are in `.gitignore` for security
2. **Use strong secrets** - Generate with `openssl rand -base64 32` or similar
3. **Rotate secrets regularly** - Especially in production
4. **Limit CORS origins** - Set specific domains in production
5. **Use environment-specific values** - Don't share secrets between environments

## Generating Secure Secrets

### JWT Secret

```bash
# Generate a strong JWT secret
openssl rand -base64 64
```

### Session Secret

```bash
# Generate a strong session secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## Vercel-Specific Notes

1. **Frontend environment variables** must be prefixed with `VITE_`
2. Variables are **built into the frontend bundle** - don't include sensitive data
3. Backend variables are **server-side only** and secure
4. Use **Preview** and **Production** scopes appropriately in Vercel

## Troubleshooting

### Build Failures

- **Missing environment variables**: Check Vercel project settings
- **VITE_ prefix missing**: Frontend variables must start with `VITE_`
- **Wrong Node version**: Ensure `.nvmrc` matches Vercel settings

### Runtime Errors

- **Database connection fails**: Verify `DATABASE_URL` format and credentials
- **CORS errors**: Check `CORS_ORIGIN` matches your frontend domain
- **401 Unauthorized**: Verify `JWT_SECRET` is set and matches between deploys

## Additional Resources

- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
