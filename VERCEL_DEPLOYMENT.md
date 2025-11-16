# Vercel Deployment Guide

This guide provides step-by-step instructions for deploying ESTA Tracker to Vercel.

## Prerequisites

- GitHub account with access to the repository
- Vercel account (free tier works)
- PostgreSQL database (Vercel Postgres, Neon, or other provider)

## Step-by-Step Deployment

### 1. Initial Setup

1. **Import Project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your GitHub repository
   - Select the repository: `Michiganman2353/esta-tracker-clean`

2. **Configure Build Settings**
   - Framework Preset: **Other** (or leave blank)
   - Root Directory: Leave as default
   - Build Command: `npm install && npm run build:frontend`
   - Output Directory: `packages/frontend/dist`
   - Install Command: `npm install`

   > ℹ️ These settings are already configured in `vercel.json`

### 2. Environment Variables

Set the following in **Project Settings → Environment Variables**:

#### Required for All Environments

```bash
NODE_ENV=production
```

#### Frontend Variables (VITE_*)

```bash
# Your backend API URL - update after backend deployment
VITE_API_URL=https://your-backend-url.vercel.app
```

#### Backend Variables (if deploying backend to Vercel)

```bash
JWT_SECRET=<generate-secure-random-string>
DATABASE_URL=postgresql://user:pass@host:5432/dbname
CORS_ORIGIN=https://your-frontend-domain.vercel.app
```

**Generate secure JWT secret:**
```bash
openssl rand -base64 64
```

### 3. Node.js Version

The project specifies Node.js 20.x in:
- `.nvmrc` file
- `package.json` engines field
- `vercel.json` functions runtime

Vercel will automatically use Node.js 20.x

### 4. Deploy

1. Click **Deploy**
2. Wait for build to complete (typically 1-2 minutes)
3. Verify deployment at the generated URL

## Project Structure

```
esta-tracker-clean/
├── packages/
│   ├── frontend/          # Vite + React app (deployed to Vercel)
│   │   ├── dist/          # Build output (specified in vercel.json)
│   │   └── src/
│   └── backend/           # Express API (can deploy separately)
├── vercel.json            # Vercel configuration
├── .nvmrc                 # Node version specification
└── .env.example           # Environment variables template
```

## Important Configuration Files

### vercel.json

The `vercel.json` file configures:
- Build command and output directory
- Security headers (CSP, HSTS, etc.)
- Cache control for static assets
- SPA routing (redirects to index.html)
- API function configuration
- CORS headers

### package.json

Specifies:
- Node.js version: `20.x`
- Build scripts for monorepo
- Dependencies

## Backend Deployment Options

### Option 1: Deploy Backend to Vercel (Serverless Functions)

Create API routes in `api/` directory at project root:

```javascript
// api/health.js
export default function handler(req, res) {
  res.status(200).json({ status: 'ok' });
}
```

### Option 2: Deploy Backend Elsewhere

Deploy the Express backend to:
- **Heroku** - Good for persistent backend services
- **Railway** - Modern Heroku alternative
- **Fly.io** - Global edge deployment
- **DigitalOcean App Platform** - Managed containers

Then update `VITE_API_URL` to point to your backend.

### Option 3: Use Existing Backend Services

If using managed services:
- Firebase Functions
- AWS Lambda
- Google Cloud Functions

Update API client in `packages/frontend/src/lib/api.ts` accordingly.

## Database Setup

### Recommended Providers

1. **Vercel Postgres**
   - Integrated with Vercel
   - Set up in Project Settings → Storage
   - Connection string auto-populated in environment variables

2. **Neon**
   - Serverless PostgreSQL
   - Free tier available
   - [neon.tech](https://neon.tech)

3. **Supabase**
   - PostgreSQL with additional features
   - Free tier generous
   - [supabase.com](https://supabase.com)

### Database Configuration

After provisioning, add `DATABASE_URL` to Vercel environment variables:

```bash
DATABASE_URL=postgresql://username:password@host:5432/database
```

## Domain Configuration

### Custom Domain

1. Go to **Project Settings → Domains**
2. Add your custom domain
3. Update DNS records as instructed
4. Update `VITE_API_URL` if needed
5. Update `CORS_ORIGIN` to match domain

## Security Checklist

- [ ] Set strong `JWT_SECRET` (64+ random characters)
- [ ] Configure `CORS_ORIGIN` to your domain (not `*`)
- [ ] Enable HTTPS only (Vercel does this by default)
- [ ] Review CSP headers in `vercel.json`
- [ ] Set `NODE_ENV=production`
- [ ] Don't expose sensitive variables with `VITE_` prefix
- [ ] Rotate secrets regularly

## Monitoring & Debugging

### Vercel Dashboard

- **Deployments**: View build logs and history
- **Logs**: Real-time function logs (for API routes)
- **Analytics**: Traffic and performance metrics
- **Speed Insights**: Core Web Vitals

### Common Issues

#### Build Failures

**Problem**: Missing dependencies
```
Solution: Check package.json and package-lock.json are committed
```

**Problem**: TypeScript errors
```
Solution: Run `npm run typecheck` locally first
```

**Problem**: Environment variables not found
```
Solution: Verify variables are set in Vercel project settings
```

#### Runtime Issues

**Problem**: API calls failing
```
Solution: Check VITE_API_URL is set correctly
```

**Problem**: CORS errors
```
Solution: Verify CORS_ORIGIN matches frontend domain
```

**Problem**: Database connection errors
```
Solution: Check DATABASE_URL format and credentials
```

## Performance Optimization

### Caching

Static assets are cached for 1 year (configured in `vercel.json`):
- JavaScript bundles
- CSS files
- Images
- Fonts

Service worker (`sw.js`) has no cache to ensure updates.

### Code Splitting

Vite automatically code-splits the React app:
- Reduces initial bundle size
- Lazy loads routes
- Better Core Web Vitals

### Image Optimization

Consider using Vercel Image Optimization:
```jsx
import Image from 'next/image'; // If using Next.js
// Or use Vercel's Image API
```

## Continuous Deployment

### Automatic Deployments

Vercel automatically deploys:
- **Production**: Pushes to `main` branch
- **Preview**: Pull requests and other branches

### Preview Deployments

Each PR gets a unique preview URL:
- Test changes before merging
- Share with team for review
- Automatic cleanup after merge

## Rollback

If a deployment has issues:

1. Go to **Deployments** in Vercel dashboard
2. Find previous working deployment
3. Click **⋯** → **Promote to Production**

## Scaling

### Automatic Scaling

Vercel handles:
- Traffic spikes
- Geographic distribution (Edge Network)
- HTTPS/SSL certificates

### Rate Limiting

Configure in backend or use Vercel Rate Limiting:
- Protect against abuse
- Set in `vercel.json` or middleware

## Support & Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite Deployment Guide](https://vitejs.dev/guide/static-deploy.html#vercel)
- [GitHub Issues](https://github.com/Michiganman2353/esta-tracker-clean/issues)

## Cost Estimation

### Free Tier Includes:
- Unlimited deployments
- 100 GB bandwidth/month
- 6,000 build minutes/month
- Preview deployments

### Pro Tier ($20/month):
- 1 TB bandwidth
- 24,000 build minutes
- Team collaboration features
- Advanced analytics

For ESTA Tracker MVP, **Free Tier is sufficient**.
