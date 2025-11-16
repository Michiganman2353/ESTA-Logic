# 🚀 Quick Start: Deploy ESTA Tracker to Vercel

This is a quick reference guide to deploy ESTA Tracker to Vercel in under 10 minutes.

## Prerequisites Checklist

Before you begin, ensure you have:

- [ ] GitHub account with access to this repository
- [ ] Vercel account (sign up free at [vercel.com](https://vercel.com))
- [ ] PostgreSQL database ready (Vercel Postgres, Neon, Supabase, etc.)
- [ ] Generated JWT secret (see below)

## 5-Minute Deployment

### Step 1: Generate Secrets (2 minutes)

Open a terminal and generate secure secrets:

```bash
# Generate JWT secret (copy this output)
openssl rand -base64 64

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('base64'))"
```

Save these values - you'll need them in Step 3.

### Step 2: Import to Vercel (1 minute)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click "Import Git Repository"
3. Select: `Michiganman2353/esta-tracker-clean`
4. Click "Import"

### Step 3: Configure Environment (2 minutes)

In the Vercel import screen, add these environment variables:

**Required:**
```
NODE_ENV=production
JWT_SECRET=<paste-the-64-character-secret-you-generated>
DATABASE_URL=postgresql://user:password@host:5432/database
VITE_API_URL=https://your-backend-url.com
CORS_ORIGIN=https://your-frontend.vercel.app
```

**How to get values:**
- `JWT_SECRET`: Use the secret you generated in Step 1
- `DATABASE_URL`: Copy from your database provider (Vercel/Neon/Supabase)
- `VITE_API_URL`: Your backend API URL (update after backend is deployed)
- `CORS_ORIGIN`: Your Vercel app URL (shown after first deploy)

### Step 4: Deploy (< 1 minute)

1. Click **"Deploy"**
2. Wait for build to complete (typically 60-90 seconds)
3. Click the deployment URL to view your app

### Step 5: Update CORS (if needed)

After first deployment:

1. Copy your Vercel app URL (e.g., `https://esta-tracker.vercel.app`)
2. Go to: **Project Settings** → **Environment Variables**
3. Update `CORS_ORIGIN` with your actual URL
4. Update `VITE_API_URL` if needed
5. Click **Redeploy** in Deployments tab

## Post-Deployment

### Test Your Deployment

1. Visit your Vercel URL
2. Check browser console for errors (F12)
3. Try to sign up/login
4. Verify API calls work

### Common Issues

**Issue**: API calls fail with CORS errors
- **Fix**: Update `CORS_ORIGIN` to match your frontend domain

**Issue**: Database connection fails
- **Fix**: Verify `DATABASE_URL` is correct and database is accessible

**Issue**: 500 errors
- **Fix**: Check Vercel logs in Dashboard → Logs section

## Custom Domain Setup (Optional)

1. **Project Settings** → **Domains**
2. Add your custom domain (e.g., `esta-tracker.com`)
3. Update DNS records as instructed
4. Update environment variables:
   - `CORS_ORIGIN=https://esta-tracker.com`
   - `VITE_API_URL=https://api.esta-tracker.com`

## Backend Deployment Options

### Option A: Vercel Functions (Serverless)

Deploy backend to Vercel as serverless functions:
- Create `api/` folder with function files
- Each file becomes an endpoint
- Limited to 10-second execution

### Option B: Dedicated Backend Service

Deploy backend separately to:
- **Railway.app** - Modern, simple
- **Render.com** - Free tier available
- **Heroku** - Classic option
- **Fly.io** - Edge deployment

Then update `VITE_API_URL` to point to backend.

## Database Options

### Recommended: Vercel Postgres

1. In Vercel Dashboard: **Storage** → **Create Database**
2. Select **Postgres**
3. `DATABASE_URL` is automatically set

### Alternative: Neon (Free Tier)

1. Sign up at [neon.tech](https://neon.tech)
2. Create project
3. Copy connection string
4. Add to Vercel environment variables

### Alternative: Supabase

1. Sign up at [supabase.com](https://supabase.com)
2. Create project
3. Get connection string from Project Settings
4. Add to Vercel environment variables

## Monitoring & Maintenance

### Check Deployment Status

- **Dashboard**: [vercel.com/dashboard](https://vercel.com/dashboard)
- **Deployments**: View build logs and history
- **Logs**: Real-time application logs
- **Analytics**: Traffic and performance

### Automatic Deployments

Every push to `main` branch automatically deploys:
- ✅ Production deployment
- ✅ Pull requests get preview URLs
- ✅ Branches get preview deployments

### Rollback if Needed

If something breaks:
1. Go to **Deployments**
2. Find last working version
3. Click **⋯** → **Promote to Production**

## Cost & Limits

### Free Tier Includes:
- ✅ 100 GB bandwidth/month
- ✅ 6,000 build minutes/month
- ✅ Unlimited deployments
- ✅ Preview deployments
- ✅ SSL certificates

**For ESTA Tracker MVP, Free Tier is sufficient.**

## Security Checklist

Before going live:

- [ ] Strong `JWT_SECRET` (64+ random characters)
- [ ] `CORS_ORIGIN` set to your domain (not `*`)
- [ ] `NODE_ENV=production`
- [ ] Database connection uses SSL
- [ ] No sensitive data in frontend env vars (VITE_*)
- [ ] All environment variables set in Vercel
- [ ] HTTPS enabled (automatic with Vercel)

## Need Help?

- 📚 Full Guide: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- 🔧 Troubleshooting: [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md)
- 🔐 Environment Setup: [ENVIRONMENT.md](./ENVIRONMENT.md)
- 📦 Dependencies: [DEPENDENCIES.md](./DEPENDENCIES.md)

## Success Criteria

Your deployment is successful when:
- ✅ Frontend loads without errors
- ✅ Can navigate between pages
- ✅ API calls work (check browser network tab)
- ✅ Database connections succeed
- ✅ No console errors
- ✅ Authentication flow works

---

**Estimated Total Time**: 10 minutes

**Difficulty**: Easy ⭐

**Support**: If you encounter issues, see [BUILD_TROUBLESHOOTING.md](./BUILD_TROUBLESHOOTING.md)
