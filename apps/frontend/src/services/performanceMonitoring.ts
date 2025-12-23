/**
 * Performance Monitoring Service
 *
 * Collects and reports Web Vitals and custom performance metrics
 * for the ESTA Tracker application.
 *
 * Features:
 * - Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
 * - Custom performance marks and measures
 * - Build metrics reporting
 * - Real-time telemetry dashboard data
 */

import { createLogger } from '@esta-tracker/shared-utils';

const logger = createLogger('PerformanceMonitoring');

// Type for web-vitals metric object
interface WebVitalsMetric {
  value: number;
  delta: number;
  id: string;
  navigationType?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
  timestamp: number;
}

export interface BuildMetrics {
  buildTime: number;
  bundleSize: number;
  chunkCount: number;
  timestamp: number;
}

export interface TelemetryData {
  metrics: PerformanceMetric[];
  buildMetrics?: BuildMetrics;
  userAgent: string;
  url: string;
  timestamp: number;
}

/**
 * Thresholds for Web Vitals based on performance budgets
 */
const WEB_VITALS_THRESHOLDS = {
  LCP: { good: 2500, needsImprovement: 4000 }, // ms
  FID: { good: 100, needsImprovement: 300 }, // ms
  CLS: { good: 0.1, needsImprovement: 0.25 }, // score
  FCP: { good: 1800, needsImprovement: 3000 }, // ms
  TTFB: { good: 600, needsImprovement: 1500 }, // ms
  INP: { good: 200, needsImprovement: 500 }, // ms
};

/**
 * Determine rating based on metric value and thresholds
 */
function getRating(
  metricName: string,
  value: number
): 'good' | 'needs-improvement' | 'poor' {
  const thresholds =
    WEB_VITALS_THRESHOLDS[metricName as keyof typeof WEB_VITALS_THRESHOLDS];
  if (!thresholds) return 'good';

  if (value <= thresholds.good) return 'good';
  if (value <= thresholds.needsImprovement) return 'needs-improvement';
  return 'poor';
}

/**
 * Send metrics to analytics endpoint
 */
async function sendToAnalytics(metric: PerformanceMetric): Promise<void> {
  // In development, log to console
  if (import.meta.env.DEV) {
    logger.debug('Performance metric', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      id: metric.id,
    });
    return;
  }

  // In production, send to analytics endpoint
  try {
    const telemetryData: TelemetryData = {
      metrics: [metric],
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: Date.now(),
    };

    // Use navigator.sendBeacon for reliability
    const blob = new Blob([JSON.stringify(telemetryData)], {
      type: 'application/json',
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/telemetry', blob);
    } else {
      // Fallback to fetch
      await fetch('/api/telemetry', {
        method: 'POST',
        body: blob,
        keepalive: true,
      });
    }
  } catch (error) {
    logger.error('Failed to send performance metric', { error });
  }
}

/**
 * Store metric in local storage for dashboard display
 */
function storeMetricLocally(metric: PerformanceMetric): void {
  try {
    const key = 'esta_performance_metrics';
    const stored = localStorage.getItem(key);
    const metrics: PerformanceMetric[] = stored ? JSON.parse(stored) : [];

    // Keep last 100 metrics
    metrics.push(metric);
    if (metrics.length > 100) {
      metrics.shift();
    }

    localStorage.setItem(key, JSON.stringify(metrics));
  } catch (_error) {
    // Ignore localStorage errors
  }
}

/**
 * Initialize Web Vitals tracking
 * Dynamically imports web-vitals library only when needed
 */
export async function initWebVitalsTracking(): Promise<void> {
  try {
    // Dynamic import to avoid blocking initial load
    const { onCLS, onLCP, onFCP, onTTFB, onINP } = await import('web-vitals');

    // Track Cumulative Layout Shift
    onCLS((metric: WebVitalsMetric) => {
      const perfMetric: PerformanceMetric = {
        name: 'CLS',
        value: metric.value,
        rating: getRating('CLS', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      };
      sendToAnalytics(perfMetric);
      storeMetricLocally(perfMetric);
    });

    // Track Largest Contentful Paint
    onLCP((metric: WebVitalsMetric) => {
      const perfMetric: PerformanceMetric = {
        name: 'LCP',
        value: metric.value,
        rating: getRating('LCP', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      };
      sendToAnalytics(perfMetric);
      storeMetricLocally(perfMetric);
    });

    // Track First Contentful Paint
    onFCP((metric: WebVitalsMetric) => {
      const perfMetric: PerformanceMetric = {
        name: 'FCP',
        value: metric.value,
        rating: getRating('FCP', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      };
      sendToAnalytics(perfMetric);
      storeMetricLocally(perfMetric);
    });

    // Track Time to First Byte
    onTTFB((metric: WebVitalsMetric) => {
      const perfMetric: PerformanceMetric = {
        name: 'TTFB',
        value: metric.value,
        rating: getRating('TTFB', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      };
      sendToAnalytics(perfMetric);
      storeMetricLocally(perfMetric);
    });

    // Track Interaction to Next Paint
    onINP((metric: WebVitalsMetric) => {
      const perfMetric: PerformanceMetric = {
        name: 'INP',
        value: metric.value,
        rating: getRating('INP', metric.value),
        delta: metric.delta,
        id: metric.id,
        navigationType: metric.navigationType,
        timestamp: Date.now(),
      };
      sendToAnalytics(perfMetric);
      storeMetricLocally(perfMetric);
    });
  } catch (_error) {
    logger.error('Failed to initialize Web Vitals tracking', { error });
  }
}

/**
 * Create custom performance mark
 */
export function mark(name: string): void {
  try {
    performance.mark(name);
  } catch (error) {
    logger.error('Failed to create performance mark', { error, name });
  }
}

/**
 * Create custom performance measure
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string
): number | null {
  try {
    const measureName = `measure_${name}`;
    performance.measure(measureName, startMark, endMark);

    const entries = performance.getEntriesByName(measureName, 'measure');
    if (entries && entries.length > 0) {
      const duration = entries[0]?.duration || 0;

      // Send custom metric
      const metric: PerformanceMetric = {
        name,
        value: duration,
        rating: 'good', // Custom metrics don't have thresholds
        id: crypto.randomUUID(),
        timestamp: Date.now(),
      };

      sendToAnalytics(metric);
      storeMetricLocally(metric);

      return duration;
    }
  } catch (error) {
    logger.error('Failed to create performance measure', {
      error,
      startMark,
      endMark,
    });
  }

  return null;
}

/**
 * Get all stored performance metrics
 */
export function getStoredMetrics(): PerformanceMetric[] {
  try {
    const key = 'esta_performance_metrics';
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch (_error) {
    return [];
  }
}

/**
 * Clear stored performance metrics
 */
export function clearStoredMetrics(): void {
  try {
    const key = 'esta_performance_metrics';
    localStorage.removeItem(key);
  } catch (_error) {
    // Ignore errors
  }
}

/**
 * Get performance summary for dashboard
 */
export function getPerformanceSummary(): {
  [key: string]: {
    average: number;
    min: number;
    max: number;
    count: number;
    rating: 'good' | 'needs-improvement' | 'poor';
  };
} {
  const metrics = getStoredMetrics();
  const summary: Record<
    string,
    {
      average: number;
      min: number;
      max: number;
      count: number;
      rating: 'good' | 'needs-improvement' | 'poor';
    }
  > = {};

  // Group by metric name
  const grouped = metrics.reduce(
    (acc, metric) => {
      if (!acc[metric.name]) {
        acc[metric.name] = [];
      }
      const group = acc[metric.name];
      if (group) {
        group.push(metric);
      }
      return acc;
    },
    {} as Record<string, PerformanceMetric[]>
  );

  // Calculate statistics for each metric
  Object.keys(grouped).forEach((name) => {
    const groupMetrics = grouped[name];
    if (!groupMetrics) return;

    const metricValues = groupMetrics.map((m) => m.value);
    const sum = metricValues.reduce((a, b) => a + b, 0);
    const average = sum / metricValues.length;

    summary[name] = {
      average,
      min: Math.min(...metricValues),
      max: Math.max(...metricValues),
      count: metricValues.length,
      rating: getRating(name, average),
    };
  });

  return summary;
}

/**
 * Track route change performance
 */
export function trackRouteChange(routeName: string): void {
  mark(`route_change_start_${routeName}`);

  // Track when route finishes loading
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => {
      mark(`route_change_end_${routeName}`);
      measure(
        `route_change_${routeName}`,
        `route_change_start_${routeName}`,
        `route_change_end_${routeName}`
      );
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      mark(`route_change_end_${routeName}`);
      measure(
        `route_change_${routeName}`,
        `route_change_start_${routeName}`,
        `route_change_end_${routeName}`
      );
    }, 0);
  }
}

/**
 * Track component render time
 */
export function trackComponentRender(
  componentName: string,
  renderTime: number
): void {
  const metric: PerformanceMetric = {
    name: `component_render_${componentName}`,
    value: renderTime,
    rating:
      renderTime < 16 ? 'good' : renderTime < 50 ? 'needs-improvement' : 'poor',
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  };

  sendToAnalytics(metric);
  storeMetricLocally(metric);
}
