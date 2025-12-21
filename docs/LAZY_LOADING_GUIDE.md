# Lazy Loading Implementation Guide

This document describes lazy loading patterns and best practices used in ESTA Tracker.

## Overview

Lazy loading splits code into smaller chunks that are loaded on-demand, improving initial load time and overall performance.

## Current Implementation

### Page-Level Lazy Loading

All non-critical pages are lazy loaded using React's `lazy()` and `Suspense`:

```typescript
// In App.tsx
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Settings = lazy(() => import('@/pages/Settings'));

// Usage with Suspense
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
  </Routes>
</Suspense>
```

**Pages Lazy Loaded:**

- ✅ Landing
- ✅ Dashboard
- ✅ Register (all variants)
- ✅ Employee Dashboard
- ✅ Employer Dashboard
- ✅ Audit Log
- ✅ Settings
- ✅ Pricing
- ✅ UI Showcase
- ✅ Guided Flow
- ✅ Performance Dashboard

**Pages Eagerly Loaded:**

- Login (critical path - always shown first)

### Component-Level Lazy Loading

Heavy components that aren't needed immediately are lazy loaded:

```typescript
import { lazyComponent } from '@/utils/lazyLoading';

// Lazy load CSV importer
const CSVImporter = lazyComponent.CSVImporter;

// Use in component
<Suspense fallback={<div>Loading...</div>}>
  {showImporter && <CSVImporter />}
</Suspense>
```

**Components with Lazy Loading:**

- CSVImporter (large library, only used in specific flows)
- PhotoCapture (camera APIs, only used for document upload)
- Calendar (date picker library, only used in scheduling)

### Firebase Services Lazy Loading

Firebase modules are loaded dynamically to reduce initial bundle size:

```typescript
import { firebaseServices } from '@/utils/lazyLoading';

// Load auth when needed
const getAuth = await firebaseServices.getAuth();
const auth = getAuth(app);

// Load storage when needed
const getStorage = await firebaseServices.getStorage();
const storage = getStorage(app);
```

## Advanced Patterns

### Retry on Failure

Lazy imports automatically retry if chunk loading fails (e.g., network errors):

```typescript
import { lazyWithRetry } from '@/utils/lazyLoading';

const Dashboard = lazyWithRetry(
  () => import('@/pages/Dashboard'),
  3, // retries
  1000 // interval in ms
);
```

### Prefetching

Prefetch components that will likely be needed:

```typescript
import { createPrefetchComponent } from '@/utils/lazyLoading';

const { Component: Settings, prefetch } = createPrefetchComponent(
  () => import('@/pages/Settings')
);

// Prefetch on hover
<button onMouseEnter={prefetch}>
  Settings
</button>
```

### Viewport-Based Lazy Loading

Load components only when they enter the viewport:

```typescript
import { useLazyLoadOnView } from '@/utils/lazyLoading';

function MyComponent() {
  const { Component, ref } = useLazyLoadOnView(
    () => import('@/components/HeavyComponent')
  );

  return (
    <div ref={ref}>
      {Component && (
        <Suspense fallback={<div>Loading...</div>}>
          <Component />
        </Suspense>
      )}
    </div>
  );
}
```

## Bundle Splitting Strategy

### Vendor Chunks

Large third-party libraries are split into separate chunks for better caching:

```typescript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  'date-vendor': ['date-fns'],
  'firebase-vendor': [
    'firebase/app',
    'firebase/auth',
    'firebase/firestore',
    'firebase/storage',
  ],
}
```

### Route-Based Splitting

Each route gets its own chunk automatically through lazy loading:

- `/dashboard` → `page-dashboard-[hash].js`
- `/settings` → `page-settings-[hash].js`
- `/employee` → `page-employee-dashboard-[hash].js`

### Component-Based Splitting

Heavy components get their own chunks:

- CSV Importer → `component-csv-importer-[hash].js`
- Photo Capture → `component-photo-capture-[hash].js`
- Calendar → `component-calendar-[hash].js`

## Performance Targets

### Bundle Size Budgets

- **Initial bundle**: < 200KB (gzipped)
- **Lazy chunks**: < 50KB each (gzipped)
- **Vendor chunks**: < 150KB per vendor (gzipped)

See `performance-budgets.json` for complete budgets.

### Loading Performance

- **Time to Interactive (TTI)**: < 3.5s on 3G
- **Route Change**: < 500ms
- **Component Load**: < 200ms

## Best Practices

### ✅ DO

1. **Lazy load all non-critical routes**

   ```typescript
   const Settings = lazy(() => import('@/pages/Settings'));
   ```

2. **Use meaningful chunk names**

   ```typescript
   lazy(() => import(/* webpackChunkName: "settings" */ '@/pages/Settings'));
   ```

3. **Provide loading states**

   ```typescript
   <Suspense fallback={<PageLoader />}>
     <Settings />
   </Suspense>
   ```

4. **Prefetch likely-needed code**

   ```typescript
   <Link to="/settings" onMouseEnter={prefetchSettings}>
   ```

5. **Monitor bundle sizes**
   ```bash
   npm run build
   npm run perf:check
   ```

### ❌ DON'T

1. **Don't lazy load critical path**

   ```typescript
   // Bad - Login is first page user sees
   const Login = lazy(() => import('@/pages/Login'));

   // Good - Eagerly load
   import Login from '@/pages/Login';
   ```

2. **Don't create too many small chunks**
   - Overhead of HTTP requests > benefits
   - Aim for 20-50KB per chunk minimum

3. **Don't forget error boundaries**

   ```typescript
   <ErrorBoundary fallback={<ErrorPage />}>
     <Suspense fallback={<Loading />}>
       <LazyComponent />
     </Suspense>
   </ErrorBoundary>
   ```

4. **Don't lazy load components used immediately**
   ```typescript
   // Bad - Header is always visible
   const Header = lazy(() => import('@/components/Header'));
   ```

## Testing Lazy Loading

### Manual Testing

1. **Open DevTools Network tab**
2. **Navigate to route**
3. **Verify only necessary chunks load**
4. **Check chunk sizes**

### Automated Testing

```bash
# Build and check bundle sizes
npm run build:frontend
npm run perf:check

# Analyze bundle with visualizer
npx vite-bundle-visualizer
```

### Performance Testing

```bash
# Run performance tests
npm run test:perf

# Check Web Vitals
npm run dev:frontend
# Visit http://localhost:5173/performance
```

## Common Issues

### Chunk Load Errors

**Symptom**: "Loading chunk X failed"

**Solutions**:

1. Use `lazyWithRetry` for automatic retries
2. Check network connectivity
3. Verify build output exists
4. Check CDN/server configuration

### Waterfall Loading

**Symptom**: Chunks load sequentially, not in parallel

**Solutions**:

1. Use `<link rel="prefetch">` for likely routes
2. Implement route prefetching on hover
3. Reduce chunk dependencies

### Large Chunk Sizes

**Symptom**: Lazy chunks exceed budget

**Solutions**:

1. Further split large components
2. Remove unused dependencies
3. Use dynamic imports for libraries
4. Check for duplicate code in chunks

## Monitoring

### Build Time Metrics

Check bundle sizes after each build:

```bash
npm run build:frontend
npm run perf:check
```

### Runtime Metrics

Monitor chunk load times in production:

```typescript
// Performance monitoring automatically tracks lazy load times
import { mark, measure } from '@/services/performanceMonitoring';

const Dashboard = lazy(async () => {
  mark('dashboard_load_start');
  const module = await import('@/pages/Dashboard');
  measure('dashboard_load', 'dashboard_load_start');
  return module;
});
```

### Dashboard

View real-time lazy loading performance at:

- Development: `http://localhost:5173/performance`
- Production: `https://your-domain.com/performance`

## Resources

- [React.lazy() Documentation](https://react.dev/reference/react/lazy)
- [Vite Code Splitting](https://vitejs.dev/guide/features.html#code-splitting)
- [Web.dev Code Splitting Guide](https://web.dev/reduce-javascript-payloads-with-code-splitting/)
- [Performance Budgets](./PERFORMANCE.md)

## Changelog

- **2024-12**: Initial lazy loading implementation
- **2024-12**: Added retry logic and prefetching utilities
- **2024-12**: Implemented Firebase service lazy loading
- **2024-12**: Added performance budgets and monitoring
