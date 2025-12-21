# Performance & Scalability Features

This document provides a quick reference for the performance and scalability features added to ESTA Tracker.

## Quick Links

- **[Performance Budgets](#performance-budgets)** - Enforced bundle size limits
- **[Lazy Loading](#lazy-loading)** - Code splitting and on-demand loading
- **[Telemetry Dashboard](#telemetry-dashboard)** - Real-time performance monitoring
- **[Web Vitals](#web-vitals)** - Core Web Vitals tracking

## Performance Budgets

### Overview

Performance budgets ensure bundle sizes stay within acceptable limits for optimal user experience.

### Configuration

Budgets are defined in [`performance-budgets.json`](../performance-budgets.json):

```json
{
  "frontend": {
    "initial": {
      "js": { "limit": "200KB", "warning": "180KB" },
      "css": { "limit": "50KB", "warning": "45KB" }
    },
    "lazy": {
      "js": { "limit": "50KB", "warning": "45KB" }
    }
  }
}
```

### Check Budgets

```bash
# Build first
npm run build:frontend

# Check budgets locally (warnings only)
npm run perf:check

# Check budgets in CI (fails build if exceeded)
npm run perf:check:ci
```

### What Gets Checked

- ✅ Initial JavaScript bundle size
- ✅ Initial CSS bundle size
- ✅ Total initial bundle size
- ✅ React vendor chunk size
- ✅ Firebase vendor chunk size
- ✅ All lazy-loaded chunks
- ✅ Build time (if metrics available)

## Lazy Loading

### Overview

All non-critical code is split into separate chunks and loaded on-demand.

### What's Lazy Loaded

**Pages:**

- Landing, Dashboard, Settings, Employee/Employer Dashboards
- Registration flows, Audit Log, Pricing
- UI Showcase, Guided Flow, Performance Dashboard

**Components:**

- CSV Importer (loaded only when importing data)
- Photo Capture (loaded only when uploading documents)
- Calendar (loaded only when scheduling)

**Services:**

- Firebase Auth (loaded when authenticating)
- Firebase Firestore (loaded when accessing database)
- Firebase Storage (loaded when uploading files)
- Firebase Analytics (loaded when tracking events)

### Usage

```typescript
import { lazyWithRetry } from '@/utils/lazyLoading';

// Automatic retry on chunk load failure
const Dashboard = lazyWithRetry(
  () => import('@/pages/Dashboard'),
  3,    // retries
  1000  // interval
);

// Use with Suspense
<Suspense fallback={<PageLoader />}>
  <Dashboard />
</Suspense>
```

### Complete Guide

See [LAZY_LOADING_GUIDE.md](./LAZY_LOADING_GUIDE.md) for detailed patterns and best practices.

## Telemetry Dashboard

### Overview

Real-time performance monitoring dashboard showing Web Vitals and custom metrics.

### Access

- **Development:** `http://localhost:5173/performance`
- **Production:** `https://your-domain.com/performance`

### Features

- 📊 **Core Web Vitals**: LCP, CLS, FCP, TTFB, INP
- 📈 **Custom Metrics**: Route changes, component renders, custom operations
- 🔄 **Auto-refresh**: Updates every 5 seconds
- 📝 **Recent Logs**: Last 20 metrics recorded
- 🎯 **Budget Targets**: Visual comparison to performance budgets

### Usage

Performance monitoring is automatically initialized in App.tsx:

```typescript
import { initWebVitalsTracking } from '@/services/performanceMonitoring';

// In App component
useEffect(() => {
  initWebVitalsTracking();
}, []);
```

### Custom Metrics

Track custom performance events:

```typescript
import { mark, measure } from '@/services/performanceMonitoring';

// Mark start
mark('data_fetch_start');

// ... perform operation ...

// Measure duration
measure('data_fetch', 'data_fetch_start');
```

## Web Vitals

### Metrics Tracked

| Metric   | Target  | Description                                       |
| -------- | ------- | ------------------------------------------------- |
| **LCP**  | < 2.5s  | Largest Contentful Paint - Main content load time |
| **CLS**  | < 0.1   | Cumulative Layout Shift - Visual stability        |
| **FCP**  | < 1.8s  | First Contentful Paint - First visual render      |
| **TTFB** | < 600ms | Time to First Byte - Server response time         |
| **INP**  | < 200ms | Interaction to Next Paint - Responsiveness        |

### Ratings

- 🟢 **Good**: Within target
- 🟡 **Needs Improvement**: Approaching limit
- 🔴 **Poor**: Exceeds acceptable threshold

### How It Works

1. **Automatic Collection**: Web Vitals are collected automatically on page load
2. **Local Storage**: Metrics stored locally for dashboard display
3. **Telemetry Endpoint**: In production, metrics sent to `/api/telemetry`
4. **Console Logging**: Development mode logs metrics to console

## Build Optimization

### Vite Configuration

Enhanced Vite config includes:

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    chunkSizeWarningLimit: 500, // Reduced from 1000KB
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'firebase-vendor': ['firebase/app', 'firebase/auth', ...],
          'date-vendor': ['date-fns'],
        }
      }
    }
  }
});
```

### Benefits

- ✅ Separate vendor chunks for better caching
- ✅ Route-based code splitting
- ✅ Optimized asset file names
- ✅ Automatic CSS code splitting
- ✅ Compressed output with source maps

## CI/CD Integration

### GitHub Actions

Performance budgets are automatically checked in CI:

```yaml
- name: Build frontend
  run: npm run build:frontend

- name: Check performance budgets
  run: npm run perf:check:ci
```

Builds fail if budgets are exceeded, ensuring performance doesn't regress.

## Performance Testing

### Commands

```bash
# Build and check budgets
npm run build:frontend
npm run perf:check

# Run performance tests
npm run test:perf

# Development with monitoring
npm run dev:frontend
# Then visit http://localhost:5173/performance
```

### Load Testing

Performance tests are available in `test/performance/`:

```bash
npm run test:perf
```

## Monitoring Best Practices

### Development

1. **Check Dashboard Regularly**: Visit `/performance` during development
2. **Monitor Bundle Sizes**: Run `perf:check` after adding dependencies
3. **Track Custom Metrics**: Use `mark()` and `measure()` for key operations
4. **Review Lazy Loading**: Ensure heavy components are lazy loaded

### Production

1. **Monitor Web Vitals**: Track metrics in telemetry endpoint
2. **Set Up Alerts**: Alert on poor Web Vitals ratings
3. **Review Trends**: Look for performance degradation over time
4. **Budget Compliance**: Ensure budgets remain appropriate

## Troubleshooting

### Bundle Too Large

1. Check which chunks are large: `npm run build:frontend`
2. Analyze with visualizer: `npx vite-bundle-visualizer`
3. Split large components further
4. Remove unused dependencies

### Slow Page Loads

1. Check LCP and TTFB in dashboard
2. Review lazy loading implementation
3. Ensure proper code splitting
4. Check network waterfall in DevTools

### Chunk Load Errors

1. Uses automatic retry (up to 3 times)
2. Check network connectivity
3. Verify build artifacts exist
4. Check CDN/server configuration

## Resources

- [Performance Guide](./PERFORMANCE.md) - Complete performance documentation
- [Lazy Loading Guide](./LAZY_LOADING_GUIDE.md) - Lazy loading patterns
- [Performance Budgets](../performance-budgets.json) - Budget configuration
- [Web Vitals](https://web.dev/vitals/) - Official Web Vitals documentation

## Next Steps

### Immediate

- [x] Performance budgets configured
- [x] Lazy loading implemented
- [x] Telemetry dashboard created
- [x] Web Vitals tracking active

### Future Enhancements

- [ ] Real-time monitoring dashboard (external service)
- [ ] Historical performance trends
- [ ] A/B testing framework for performance
- [ ] Service worker for offline support
- [ ] Advanced caching strategies
- [ ] CDN integration
- [ ] Image optimization pipeline
- [ ] Font optimization

## Support

For issues or questions:

- Check existing documentation
- Review [PERFORMANCE.md](./PERFORMANCE.md)
- Open GitHub issue with performance label
