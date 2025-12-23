/**
 * Lazy Loading Utilities
 *
 * Provides helper functions and components for implementing
 * optimized lazy loading throughout the application.
 */

import React, { lazy, ComponentType, LazyExoticComponent } from 'react';
import { createLogger } from '@esta-tracker/shared-utils';

const logger = createLogger('LazyLoading');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyComponentType = ComponentType<any>;

/**
 * Retry wrapper for lazy imports
 * Automatically retries failed chunk loads
 */
export function lazyWithRetry<T extends AnyComponentType>(
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

// React intentionally hides _payload in its public typing, but it is present at runtime.
// We define a constrained structural wrapper so we can safely resolve the lazy module
// without weakening global TypeScript strictness.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type InternalLazyComponent = React.LazyExoticComponent<any> & {
  _payload?: {
    _result?: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      default?: React.ComponentType<any>;
    };
  };
};

export function resolveLazyComponent<T extends AnyComponentType>(
  lazyComponent: React.LazyExoticComponent<T>
): T | null {
  const internal = lazyComponent as InternalLazyComponent;

  const resolved =
    internal._payload?._result?.default ?? internal._payload?._result ?? null;

  return resolved as T | null;
}

/**
 * Preload a lazy component
 * Useful for prefetching components that will likely be needed
 */
export function preloadComponent<T extends AnyComponentType>(
  lazyComponent: LazyExoticComponent<T>
): void {
  const internal = lazyComponent as InternalLazyComponent;
  if (internal._payload && internal._payload._result === null) {
    // Intentionally access _result to potentially trigger React's lazy loading
    void internal._payload._result;
  }
}

/**
 * Create a lazy component with automatic prefetching on hover
 */
export function createPrefetchComponent<T extends AnyComponentType>(
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
export function useLazyLoadOnView<T extends AnyComponentType>(
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
