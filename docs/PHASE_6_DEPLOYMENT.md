# Phase 6: Deployment & Vercel Stability

**Phase:** 6 of 6  
**Status:** 📋 Planning  
**Priority:** Critical  
**Dependencies:** All prior phases  
**Estimated Duration:** 2-3 weeks  
**Lead:** TBD

---

## 🎯 Objective

**Ensure the platform deploys reliably, every time.**

Validate and optimize Vercel configuration, ensure supported runtimes, resolve deployment inconsistencies, strengthen CI/CD pipeline, and guarantee that ESTA-Logic deploys successfully with zero surprises.

---

## 🎭 The Deployment Promise

> **"Every deployment should be boring. Predictable. Reliable. Production deployments should feel exactly like preview deployments — which should feel exactly like local development."**

**Current Pain Points:**
- Intermittent deployment failures
- Runtime version warnings
- Configuration drift between environments
- Unclear error messages
- Manual intervention sometimes required

**Target State:**
- 100% deployment success rate
- Zero runtime warnings
- Identical behavior across all environments
- Self-healing deployments
- Clear error messages with remediation steps

---

## 📊 Current State Analysis

### Vercel Configuration Audit

**Review Existing Configuration:**

```bash
# Validate vercel.json
npm run validate:vercel

# Check current deployments
vercel ls

# Inspect build logs
vercel logs <deployment-url>

# Check environment variables
vercel env ls
```

**Current `vercel.json` Analysis:**

```json
{
  "version": 2,
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "npm ci --prefer-offline",
  "devCommand": "npm run dev:frontend",
  "framework": null,
  "functions": {
    "api/**/*.ts": {
      "runtime": "nodejs22.x",
      "maxDuration": 30,
      "memory": 512
    }
  }
}
```

**Issues to Address:**

1. ✅ Runtime version: `nodejs22.x` is latest (good!)
2. ⚠️ Framework set to `null` — verify this is intentional
3. ⚠️ Function configuration patterns — ensure comprehensive
4. ⚠️ No caching strategy defined
5. ⚠️ No redirect rules
6. ⚠️ Missing regions configuration

### Deployment History Analysis

**Metrics to Collect:**

| Metric | Current | Target |
|--------|---------|--------|
| Deployment Success Rate | ___% | 100% |
| Average Build Time | ___min | <5min |
| Build Failures (last 30 days) | ___ | 0 |
| Runtime Errors (first 24h) | ___ | 0 |
| Cold Start Time | ___ms | <500ms |

---

## 🔧 Deployment Optimization Strategy

### Strategy 1: Vercel Configuration Hardening

**Optimize `vercel.json`:**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  
  "buildCommand": "npm run build:frontend",
  "outputDirectory": "apps/frontend/dist",
  "installCommand": "npm ci --prefer-offline --no-audit",
  "devCommand": "npm run dev:frontend",
  
  "framework": null,
  
  "cleanUrls": true,
  "trailingSlash": false,
  
  "regions": ["iad1"],
  
  "functions": {
    "api/background/*.ts": {
      "maxDuration": 300,
      "memory": 1024,
      "runtime": "nodejs22.x"
    },
    "api/secure/*.ts": {
      "maxDuration": 60,
      "memory": 512,
      "runtime": "nodejs22.x"
    },
    "api/edge/*.ts": {
      "maxDuration": 60,
      "memory": 512,
      "runtime": "nodejs22.x"
    },
    "api/v1/**/*.ts": {
      "maxDuration": 30,
      "memory": 512,
      "runtime": "nodejs22.x"
    },
    "api/*.ts": {
      "maxDuration": 30,
      "memory": 512,
      "runtime": "nodejs22.x"
    }
  },
  
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/$1"
    },
    {
      "source": "/((?!assets/).*)",
      "destination": "/index.html"
    }
  ],
  
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ],
  
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" },
        { "key": "Strict-Transport-Security", "value": "max-age=31536000; includeSubDomains; preload" },
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' https://www.gstatic.com https://firebase.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://firebase.googleapis.com https://firestore.googleapis.com wss://*.firebaseio.com;"
        }
      ]
    }
  ],
  
  "env": {
    "NODE_ENV": "production"
  },
  
  "build": {
    "env": {
      "NODE_OPTIONS": "--max-old-space-size=4096"
    }
  }
}
```

**Validate Configuration:**

```bash
# Automated validation script
node scripts/validate-vercel-config.js

# Manual checks
- ✅ All runtimes are supported versions
- ✅ All paths match actual file structure
- ✅ All environment variables are defined
- ✅ All functions have appropriate timeouts
- ✅ Headers are comprehensive and correct
- ✅ Rewrites don't conflict
```

### Strategy 2: Build Process Optimization

**Optimize Build Performance:**

```javascript
// apps/frontend/vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Optimize chunking
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
          'ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
          ],
        },
      },
    },
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
      },
    },
    
    // Source maps only for errors
    sourcemap: 'hidden',
    
    // Report compressed size
    reportCompressedSize: true,
    
    // Chunk size warning limit
    chunkSizeWarningLimit: 500,
  },
  
  // Optimize dependency pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['@firebase/firestore'],
  },
  
  // Server configuration for preview
  preview: {
    port: 3000,
    strictPort: true,
  },
});
```

**Build Caching Strategy:**

```yaml
# .github/workflows/ci.yml (excerpt)

- name: Cache Nx
  uses: actions/cache@v4
  with:
    path: |
      .nx/cache
      node_modules/.cache
    key: ${{ runner.os }}-nx-${{ hashFiles('**/package-lock.json') }}-${{ hashFiles('**/*.ts', '**/*.tsx') }}
    restore-keys: |
      ${{ runner.os }}-nx-${{ hashFiles('**/package-lock.json') }}-
      ${{ runner.os }}-nx-

- name: Cache Vite Build
  uses: actions/cache@v4
  with:
    path: apps/frontend/node_modules/.vite
    key: ${{ runner.os }}-vite-${{ hashFiles('apps/frontend/**/*.ts', 'apps/frontend/**/*.tsx') }}
```

### Strategy 3: Environment Variable Management

**Standardize Environment Variables:**

```bash
# .env.example (complete reference)

# Application
NODE_ENV=production
VITE_APP_NAME=ESTA Tracker
VITE_APP_VERSION=2.0.0

# Firebase Configuration (required)
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=

# API Configuration
VITE_API_BASE_URL=https://esta-tracker.vercel.app/api

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_TRACKING=true

# Vercel (for CI/CD)
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```

**Environment Validation:**

```typescript
// scripts/validate-environment.ts

import { z } from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  
  // Firebase (required in production)
  VITE_FIREBASE_API_KEY: z.string().min(1),
  VITE_FIREBASE_AUTH_DOMAIN: z.string().min(1),
  VITE_FIREBASE_PROJECT_ID: z.string().min(1),
  VITE_FIREBASE_STORAGE_BUCKET: z.string().min(1),
  VITE_FIREBASE_MESSAGING_SENDER_ID: z.string().min(1),
  VITE_FIREBASE_APP_ID: z.string().min(1),
  
  // Optional
  VITE_FIREBASE_MEASUREMENT_ID: z.string().optional(),
  VITE_API_BASE_URL: z.string().url().optional(),
});

export function validateEnvironment(): void {
  const result = EnvSchema.safeParse(process.env);
  
  if (!result.success) {
    console.error('❌ Environment validation failed:');
    console.error(result.error.issues);
    process.exit(1);
  }
  
  console.log('✅ Environment validated successfully');
}

validateEnvironment();
```

### Strategy 4: Deployment Health Checks

**Pre-Deployment Checks:**

```bash
#!/bin/bash
# scripts/pre-deploy-checks.sh

set -e

echo "🔍 Running pre-deployment checks..."

# 1. Verify package-lock.json is in sync
echo "📦 Checking package-lock.json..."
npm ci --dry-run

# 2. Validate configuration files
echo "⚙️  Validating configurations..."
node scripts/validate-vercel-config.js
node scripts/validate-tsconfig-paths.js

# 3. Run linting
echo "🧹 Linting code..."
npm run lint

# 4. Run type checking
echo "🔢 Type checking..."
npm run typecheck

# 5. Run tests
echo "🧪 Running tests..."
npm run test -- --coverage

# 6. Build the application
echo "🏗️  Building application..."
npm run build

# 7. Validate build output
echo "✅ Validating build output..."
if [ ! -d "apps/frontend/dist" ]; then
  echo "❌ Build output directory not found!"
  exit 1
fi

if [ ! -f "apps/frontend/dist/index.html" ]; then
  echo "❌ index.html not found in build output!"
  exit 1
fi

echo "✅ All pre-deployment checks passed!"
```

**Post-Deployment Checks:**

```typescript
// scripts/post-deploy-checks.ts

interface HealthCheck {
  name: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

const healthChecks: HealthCheck[] = [
  {
    name: 'Homepage loads',
    check: async () => {
      const response = await fetch(process.env.DEPLOYMENT_URL);
      return response.status === 200;
    },
    critical: true,
  },
  {
    name: 'API health endpoint',
    check: async () => {
      const response = await fetch(`${process.env.DEPLOYMENT_URL}/api/health`);
      return response.status === 200;
    },
    critical: true,
  },
  {
    name: 'Firebase connection',
    check: async () => {
      // Test Firebase initialization
      return true; // Implement actual check
    },
    critical: true,
  },
  {
    name: 'Assets load correctly',
    check: async () => {
      const response = await fetch(`${process.env.DEPLOYMENT_URL}/assets/logo.png`);
      return response.status === 200;
    },
    critical: false,
  },
];

async function runHealthChecks(): Promise<void> {
  console.log('🏥 Running post-deployment health checks...\n');
  
  let failures = 0;
  let criticalFailures = 0;
  
  for (const check of healthChecks) {
    try {
      const result = await check.check();
      if (result) {
        console.log(`✅ ${check.name}`);
      } else {
        console.log(`❌ ${check.name}`);
        failures++;
        if (check.critical) criticalFailures++;
      }
    } catch (error) {
      console.log(`❌ ${check.name} (error: ${error.message})`);
      failures++;
      if (check.critical) criticalFailures++;
    }
  }
  
  console.log(`\n📊 Results: ${healthChecks.length - failures}/${healthChecks.length} passed`);
  
  if (criticalFailures > 0) {
    console.error(`\n🚨 ${criticalFailures} critical health checks failed!`);
    process.exit(1);
  }
  
  if (failures > 0) {
    console.warn(`\n⚠️  ${failures} non-critical health checks failed`);
  } else {
    console.log('\n✅ All health checks passed!');
  }
}

runHealthChecks();
```

### Strategy 5: Monitoring & Alerting

**Deployment Monitoring:**

```typescript
// platform/vercel/monitoring.ts

export interface DeploymentMetrics {
  buildTime: number;
  buildSize: number;
  functionCount: number;
  coldStartTime: number;
  errorRate: number;
  successRate: number;
}

export async function collectDeploymentMetrics(
  deploymentId: string
): Promise<DeploymentMetrics> {
  // Collect metrics from Vercel API
  const deployment = await fetch(
    `https://api.vercel.com/v13/deployments/${deploymentId}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
      },
    }
  ).then(r => r.json());
  
  return {
    buildTime: deployment.buildTime,
    buildSize: deployment.size,
    functionCount: deployment.functions?.length || 0,
    coldStartTime: await measureColdStart(deployment.url),
    errorRate: await getErrorRate(deployment.url),
    successRate: deployment.state === 'READY' ? 100 : 0,
  };
}

// Alert on anomalies
export async function checkDeploymentHealth(
  metrics: DeploymentMetrics
): Promise<void> {
  const alerts = [];
  
  if (metrics.buildTime > 5 * 60 * 1000) {
    alerts.push('⚠️ Build time exceeded 5 minutes');
  }
  
  if (metrics.buildSize > 10 * 1024 * 1024) {
    alerts.push('⚠️ Build size exceeded 10MB');
  }
  
  if (metrics.coldStartTime > 1000) {
    alerts.push('⚠️ Cold start time exceeded 1 second');
  }
  
  if (metrics.errorRate > 5) {
    alerts.push('🚨 Error rate exceeded 5%');
  }
  
  if (alerts.length > 0) {
    await sendAlerts(alerts);
  }
}
```

---

## 📋 Implementation Roadmap

### Week 1: Configuration Audit & Hardening
- [ ] Audit current vercel.json
- [ ] Optimize configuration
- [ ] Validate all environment variables
- [ ] Update .vercelignore
- [ ] Test configuration changes

### Week 2: Build Optimization
- [ ] Optimize Vite configuration
- [ ] Implement build caching
- [ ] Add bundle analysis
- [ ] Optimize chunk splitting
- [ ] Reduce build time

### Week 3: CI/CD Enhancement
- [ ] Add pre-deployment checks
- [ ] Add post-deployment checks
- [ ] Implement health monitoring
- [ ] Set up alerting
- [ ] Document deployment process

---

## ✅ Acceptance Criteria

### Deployment Success

- [ ] 3 consecutive successful deployments
- [ ] Zero runtime warnings
- [ ] Zero configuration errors
- [ ] Build time < 5 minutes
- [ ] Cold start < 500ms

### Configuration Quality

- [ ] vercel.json validated
- [ ] All env vars documented
- [ ] All runtimes supported
- [ ] Caching optimized
- [ ] Headers configured

### CI/CD Reliability

- [ ] Pre-deploy checks automated
- [ ] Post-deploy checks automated
- [ ] Health monitoring active
- [ ] Alerts configured
- [ ] Rollback procedure documented

---

## 🎯 Definition of Done

Phase 6 is complete when:

1. ✅ 3 consecutive clean deployments
2. ✅ Zero deployment failures
3. ✅ All acceptance criteria met
4. ✅ Monitoring dashboards live
5. ✅ Team trained
6. ✅ Documentation complete
7. ✅ Retrospective completed

---

**Related Documents:**
- [Modernization Charter](./MODERNIZATION_CHARTER.md)
- [Metrics Tracking](./METRICS_TRACKING.md)
- [Vercel Configuration Guide](../VERCEL_FIX_SUMMARY.md)
