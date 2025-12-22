/**
 * Lazy Loading Utilities
 *
 * Provides helper functions and components for implementing
 * optimized lazy loading throughout the application.
 */

import { lazy, ComponentType, LazyExoticComponent } from 'react';
import { createLogger } from '@esta-tracker/shared-utils';

const logger = createLogger('LazyLoading');

/**
 * Retry wrapper for lazy imports
 * Automatically retries failed chunk loads
 */
// TODO: ESTA-Logic Architecture Note - ComponentType<any> is intentional here
// to accept any React component regardless of props. Consider constraining to
// ComponentType<Record<string, unknown>> for stricter typing if needed.
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 3,
  interval = 1000
): LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attemptLoad = (retriesLeft: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }

            logger.warn('Failed to load component, retrying', {
              retriesLeft,
            });

            setTimeout(() => {
              attemptLoad(retriesLeft - 1);
            }, interval);
          });
      };

      attemptLoad(retries);
    });
  });
}

/**
 * Preload a lazy component
 * Useful for prefetching components that will likely be needed
 */
// TODO: ESTA-Logic Architecture Note - ComponentType<any> is intentional here
// to accept any React component regardless of props.
export function preloadComponent<T extends ComponentType<any>>(
  lazyComponent: LazyExoticComponent<T>
): void {
  // @ts-expect-error - accessing internal React lazy component payload for preloading
  if (lazyComponent._payload && lazyComponent._payload._result === null) {
    // @ts-expect-error - triggering lazy load by accessing internal result
    void lazyComponent._payload._result;
  }
}

/**
 * Create a lazy component with automatic prefetching on hover
 */
// TODO: ESTA-Logic Architecture Note - ComponentType<any> is intentional here
// to accept any React component regardless of props.
export function createPrefetchComponent<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): {
  Component: LazyExoticComponent<T>;
  prefetch: () => void;
} {
  let importPromise: Promise<{ default: T }> | null = null;

  const prefetch = () => {
    if (!importPromise) {
      importPromise = componentImport();
    }
    return importPromise;
  };

  const Component = lazy(() => {
    return prefetch();
  });

  return { Component, prefetch };
}

/**
 * Named chunk imports for better debugging
 * Use webpackChunkName to give meaningful names to chunks
 */
export const lazyPage = {
  Dashboard: lazyWithRetry(
    () => import(/* webpackChunkName: "page-dashboard" */ '@/pages/Dashboard')
  ),
  Settings: lazyWithRetry(
    () => import(/* webpackChunkName: "page-settings" */ '@/pages/Settings')
  ),
  EmployeeDashboard: lazyWithRetry(
    () =>
      import(
        /* webpackChunkName: "page-employee-dashboard" */ '@/pages/EmployeeDashboard'
      )
  ),
  EmployerDashboard: lazyWithRetry(
    () =>
      import(
        /* webpackChunkName: "page-employer-dashboard" */ '@/pages/EmployerDashboard'
      )
  ),
  AuditLog: lazyWithRetry(
    () => import(/* webpackChunkName: "page-audit-log" */ '@/pages/AuditLog')
  ),
};

/**
 * Lazy load heavy components
 */
export const lazyComponent = {
  CSVImporter: lazyWithRetry(
    () =>
      import(
        /* webpackChunkName: "component-csv-importer" */ '@/components/CSVImporter'
      )
  ),
  PhotoCapture: lazyWithRetry(
    () =>
      import(
        /* webpackChunkName: "component-photo-capture" */ '@/components/PhotoCapture'
      )
  ),
  Calendar: lazyWithRetry(
    () =>
      import(
        /* webpackChunkName: "component-calendar" */ '@/components/Calendar'
      )
  ),
};

/**
 * Firebase services lazy loading
 * Load Firebase services only when needed
 */
export const firebaseServices = {
  async getAuth() {
    const { getAuth } = await import('firebase/auth');
    return getAuth;
  },

  async getFirestore() {
    const { getFirestore } = await import('firebase/firestore');
    return getFirestore;
  },

  async getStorage() {
    const { getStorage } = await import('firebase/storage');
    return getStorage;
  },

  async getAnalytics() {
    const { getAnalytics } = await import('firebase/analytics');
    return getAnalytics;
  },
};

/**
 * Intersection Observer based lazy loading
 * Load components when they enter the viewport
 */
// TODO: ESTA-Logic Architecture Note - ComponentType<any> is intentional here
// to accept any React component regardless of props.
export function useLazyLoadOnView<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
): {
  Component: LazyExoticComponent<T> | null;
  ref: (node: HTMLElement | null) => void;
} {
  const [Component, setComponent] =
    React.useState<LazyExoticComponent<T> | null>(null);
  const [shouldLoad, setShouldLoad] = React.useState(false);

  React.useEffect(() => {
    if (shouldLoad && !Component) {
      setComponent(lazy(() => componentImport()));
    }
  }, [shouldLoad, Component, componentImport]);

  const ref = React.useCallback(
    (node: HTMLElement | null) => {
      if (node && !shouldLoad) {
        const observer = new IntersectionObserver(
          (entries) => {
            if (entries[0]?.isIntersecting) {
              setShouldLoad(true);
              observer.disconnect();
            }
          },
          { rootMargin: '50px' } // Start loading 50px before entering viewport
        );

        observer.observe(node);

        return () => observer.disconnect();
      }
      return undefined;
    },
    [shouldLoad]
  );

  return { Component, ref };
}

// Add React import for useLazyLoadOnView
import React from 'react';
