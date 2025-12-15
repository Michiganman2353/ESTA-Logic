# Performance Optimization Guide - ESTA Tracker

This document outlines performance optimization strategies and best practices for the ESTA Tracker application.

## Table of Contents

1. [Frontend Performance](#frontend-performance)
2. [Backend Performance](#backend-performance)
3. [Build Optimization](#build-optimization)
4. [Monitoring & Metrics](#monitoring--metrics)
5. [Best Practices](#best-practices)

## Frontend Performance

### Code Splitting & Lazy Loading

The application uses React lazy loading for optimal bundle sizes:

```typescript
// Eagerly load critical components (Login)
import Login from '@/pages/Login';

// Lazy load other pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Settings = lazy(() => import('@/pages/Settings'));
```

**Benefits:**

- Smaller initial bundle size
- Faster first contentful paint (FCP)
- Better time to interactive (TTI)
- Users only download code they need

**Usage:**

```typescript
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

### Bundle Size Optimization

**Current Strategy:**

- Vite handles tree-shaking automatically
- Production builds are minified
- Source maps are generated for debugging

**Analysis:**

```bash
# Build and analyze bundle
npm run build

# Check bundle sizes
ls -lh apps/frontend/dist/assets/
```

**Target Sizes:**

- Initial JS bundle: < 200KB (gzipped)
- Lazy-loaded chunks: < 50KB each
- CSS: < 50KB (gzipped)

### Image Optimization

**Best Practices:**

1. Use modern formats (WebP, AVIF)
2. Implement lazy loading for images
3. Serve responsive images
4. Use CDN for static assets

```typescript
// Lazy load images
<img
  src={imageSrc}
  loading="lazy"
  alt="Description"
/>

// Responsive images
<img
  srcSet="image-320w.jpg 320w, image-640w.jpg 640w"
  sizes="(max-width: 320px) 280px, 640px"
  src="image-640w.jpg"
  alt="Description"
/>
```

### React Performance

**Memoization:**

```typescript
// Memoize expensive calculations
const expensiveValue = useMemo(() => {
  return calculateExpensiveValue(data);
}, [data]);

// Memoize components
const MemoizedComponent = memo(({ data }) => {
  return <div>{data}</div>;
});

// Memoize callbacks
const handleClick = useCallback(() => {
  doSomething(value);
}, [value]);
```

**Virtual Scrolling:**
For long lists, use virtualization:

```typescript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={400}
  itemCount={1000}
  itemSize={35}
>
  {Row}
</FixedSizeList>
```

### State Management Optimization

**Zustand Best Practices:**

```typescript
// Split stores by concern
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));

const useDataStore = create((set) => ({
  data: [],
  setData: (data) => set({ data }),
}));

// Use selectors to prevent unnecessary re-renders
const user = useAuthStore((state) => state.user);
```

### Network Optimization

**Request Optimization:**

1. Use HTTP/2 multiplexing
2. Implement request caching
3. Batch multiple requests
4. Use compression (gzip/brotli)

```typescript
// Cache API responses
const cache = new Map();

async function fetchWithCache(url: string) {
  if (cache.has(url)) {
    return cache.get(url);
  }

  const response = await fetch(url);
  const data = await response.json();
  cache.set(url, data);
  return data;
}
```

**Firebase Optimization:**

```typescript
// Use onSnapshot for real-time updates efficiently
const unsubscribe = onSnapshot(
  query(collection(db, 'users'), where('active', '==', true)),
  (snapshot) => {
    // Only process changes
    snapshot.docChanges().forEach((change) => {
      if (change.type === 'added') {
        // Handle new data
      }
    });
  }
);

// Remember to unsubscribe
return () => unsubscribe();
```

### CSS Optimization

**Tailwind CSS:**

- Production builds automatically purge unused CSS
- Use JIT mode for optimal performance
- Minimize custom CSS

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
};
```

**Critical CSS:**
Inline critical CSS for faster FCP:

```html
<style>
  /* Critical above-the-fold styles */
  .hero {
    display: flex;
  }
</style>
```

## Backend Performance

### Database Optimization

**Query Optimization:**

```typescript
// ✅ GOOD - Specific fields, indexed columns
const result = await pool.query(
  'SELECT id, name, email FROM users WHERE status = $1',
  ['active']
);

// ❌ BAD - SELECT *, unindexed columns
const result = await pool.query('SELECT * FROM users WHERE random_field = $1', [
  value,
]);
```

**Indexing:**

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_accruals_employee_id ON accruals(employee_id);

-- Composite indexes for complex queries
CREATE INDEX idx_accruals_employee_date
  ON accruals(employee_id, accrual_date);
```

**Connection Pooling:**

```typescript
import { Pool } from 'pg';

const pool = new Pool({
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### Caching Strategies

**In-Memory Caching:**

```typescript
import NodeCache from 'node-cache';

const cache = new NodeCache({
  stdTTL: 600, // 10 minutes
  checkperiod: 120,
});

// Cache expensive calculations
function getEmployerData(employerId: string) {
  const cached = cache.get(employerId);
  if (cached) return cached;

  const data = fetchFromDatabase(employerId);
  cache.set(employerId, data);
  return data;
}
```

**Redis Caching (Optional):**

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
});

// Cache with expiration
await redis.setex('key', 3600, JSON.stringify(data));
const cached = await redis.get('key');
```

### API Response Optimization

**Compression:**

```typescript
import compression from 'compression';

app.use(
  compression({
    threshold: 1024, // Only compress responses > 1KB
    level: 6, // Compression level (0-9)
  })
);
```

**Response Streaming:**

```typescript
// Stream large responses
app.get('/export', (req, res) => {
  res.setHeader('Content-Type', 'text/csv');

  const stream = createDataStream();
  stream.pipe(res);
});
```

**Pagination:**

```typescript
// Always paginate large datasets
app.get('/api/v1/employees', (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const offset = (page - 1) * limit;

  const employees = await getEmployees({ limit, offset });
  res.json({
    data: employees,
    pagination: {
      page,
      limit,
      total,
    },
  });
});
```

### Background Processing

**For CPU-intensive tasks:**

```typescript
import { Worker } from 'worker_threads';

function runWorker(data: any) {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', {
      workerData: data,
    });

    worker.on('message', resolve);
    worker.on('error', reject);
  });
}

// Use for heavy computations
const result = await runWorker(largeDataset);
```

## Build Optimization

### Nx Cache Configuration

Nx caching is configured for optimal performance:

```json
{
  "tasksRunnerOptions": {
    "default": {
      "runner": "nx/tasks-runners/default",
      "options": {
        "cacheableOperations": [
          "build",
          "test",
          "test:coverage",
          "lint",
          "typecheck"
        ]
      }
    }
  }
}
```

**Cache Benefits:**

- Builds are cached based on input files
- Unchanged projects aren't rebuilt
- Tests skip if code hasn't changed
- CI/CD runs faster

**Cache Management:**

```bash
# Clear cache
npx nx reset

# View cache info
npx nx show project <project-name>

# Run with cache
npx nx build frontend  # Uses cache if available

# Force rebuild
npx nx build frontend --skip-nx-cache
```

### Vite Build Optimization

**Configuration:**

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // Code splitting
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
          ],
        },
      },
    },
    // Compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
      },
    },
    // Source maps for debugging
    sourcemap: true,
  },
  // Chunk size warnings
  chunkSizeWarningLimit: 500,
});
```

### TypeScript Performance

**Incremental Builds:**

```json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo"
  }
}
```

**Project References:**
Libraries build independently and in parallel.

## Monitoring & Metrics

### Web Vitals

Track Core Web Vitals:

```typescript
import { onCLS, onFID, onLCP, onFCP, onTTFB } from 'web-vitals';

function sendToAnalytics(metric: Metric) {
  // Send to your analytics endpoint
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric),
  });
}

onCLS(sendToAnalytics);
onFID(sendToAnalytics);
onLCP(sendToAnalytics);
onFCP(sendToAnalytics);
onTTFB(sendToAnalytics);
```

**Target Metrics:**

- LCP (Largest Contentful Paint): < 2.5s
- FID (First Input Delay): < 100ms
- CLS (Cumulative Layout Shift): < 0.1
- FCP (First Contentful Paint): < 1.8s
- TTFB (Time to First Byte): < 600ms

### Performance Monitoring

**Lighthouse CI:**

```bash
# Run Lighthouse
npm install -g lighthouse
lighthouse https://estatracker.com --view

# CI integration
lighthouse https://estatracker.com --output=json --output-path=./report.json
```

**Bundle Analysis:**

```bash
# Analyze Vite build
npx vite-bundle-visualizer

# Check bundle size
npm run build
du -sh apps/frontend/dist/*
```

### Backend Monitoring

**Response Time Tracking:**

```typescript
app.use((req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${duration}ms`);

    if (duration > 1000) {
      console.warn(`Slow request: ${req.method} ${req.path}`);
    }
  });

  next();
});
```

**Memory Monitoring:**

```typescript
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: `${Math.round(usage.rss / 1024 / 1024)}MB`,
    heapTotal: `${Math.round(usage.heapTotal / 1024 / 1024)}MB`,
    heapUsed: `${Math.round(usage.heapUsed / 1024 / 1024)}MB`,
  });
}, 60000); // Log every minute
```

## Best Practices

### Development Workflow

1. **Use Nx affected commands:**

```bash
npx nx affected --target=build
npx nx affected --target=test
```

2. **Enable hot module replacement (HMR):**

```bash
npx nx dev frontend  # Vite HMR enabled by default
```

3. **Profile performance regularly:**

```bash
# React DevTools Profiler
# Chrome DevTools Performance tab
# Lighthouse audits
```

### Production Deployment

**Pre-deployment Checklist:**

- [ ] Run production build locally
- [ ] Analyze bundle sizes
- [ ] Run Lighthouse audit
- [ ] Check Core Web Vitals
- [ ] Test on slow connections (throttling)
- [ ] Verify source maps work
- [ ] Check error tracking is enabled
- [ ] Monitor after deployment

### Performance Budget

Set and enforce performance budgets:

```json
{
  "budget": {
    "initial": {
      "js": "200KB",
      "css": "50KB"
    },
    "lazy": {
      "js": "50KB"
    }
  }
}
```

**Fail builds that exceed budget:**

```yaml
# In CI
- name: Check bundle size
  run: |
    npm run build
    SIZE=$(du -sb apps/frontend/dist/assets/*.js | awk '{sum+=$1} END {print sum}')
    if [ $SIZE -gt 204800 ]; then
      echo "Bundle too large: $SIZE bytes"
      exit 1
    fi
```

## Resources

- [Web Vitals](https://web.dev/vitals/)
- [React Performance](https://react.dev/learn/render-and-commit)
- [Vite Performance](https://vitejs.dev/guide/performance.html)
- [Nx Caching](https://nx.dev/concepts/how-caching-works)
- [PostgreSQL Performance](https://wiki.postgresql.org/wiki/Performance_Optimization)

## Performance Checklist

- [ ] Code splitting implemented
- [ ] Images optimized and lazy loaded
- [ ] Bundle sizes within budget
- [ ] Database queries optimized
- [ ] API responses cached
- [ ] Compression enabled
- [ ] CDN configured
- [ ] Core Web Vitals monitored
- [ ] Error tracking configured
- [ ] Performance budget enforced
