/**
 * Performance Telemetry Dashboard
 *
 * Displays real-time and historical performance metrics including:
 * - Core Web Vitals (LCP, FID, CLS, FCP, TTFB, INP)
 * - Custom performance metrics
 * - Build metrics
 * - Performance trends
 */

import { useEffect, useState } from 'react';
import {
  getStoredMetrics,
  getPerformanceSummary,
  clearStoredMetrics,
  PerformanceMetric,
} from '@/services/performanceMonitoring';

interface MetricSummary {
  average: number;
  min: number;
  max: number;
  count: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [summary, setSummary] = useState<Record<string, MetricSummary>>({});
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMetrics();

    if (autoRefresh) {
      const interval = setInterval(loadMetrics, 5000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [autoRefresh]);

  const loadMetrics = () => {
    setMetrics(getStoredMetrics());
    setSummary(getPerformanceSummary());
  };

  const handleClearMetrics = () => {
    if (confirm('Are you sure you want to clear all performance metrics?')) {
      clearStoredMetrics();
      loadMetrics();
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'needs-improvement':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'poor':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatValue = (name: string, value: number) => {
    if (name === 'CLS') {
      return value.toFixed(3);
    }
    return Math.round(value) + 'ms';
  };

  const webVitalsOrder = ['LCP', 'FID', 'CLS', 'FCP', 'TTFB', 'INP'];
  const webVitalsSummary = webVitalsOrder
    .filter((name) => summary[name])
    .map((name) => ({ name, ...summary[name] }));

  const customMetrics = Object.keys(summary)
    .filter((name) => !webVitalsOrder.includes(name))
    .map((name) => ({ name, ...summary[name] }));

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Performance Telemetry Dashboard
          </h1>
          <p className="text-gray-600">
            Real-time monitoring of ESTA Tracker performance metrics
          </p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex gap-4">
          <button
            onClick={loadMetrics}
            className="rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Refresh Now
          </button>
          <button
            onClick={handleClearMetrics}
            className="rounded bg-red-600 px-4 py-2 text-white transition hover:bg-red-700"
          >
            Clear Metrics
          </button>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span className="text-gray-700">Auto-refresh (5s)</span>
          </label>
          <div className="ml-auto text-sm text-gray-600">
            {metrics.length} metrics collected
          </div>
        </div>

        {/* Web Vitals Summary */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Core Web Vitals
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {webVitalsSummary.length > 0 ? (
              webVitalsSummary.map((metric) => (
                <div
                  key={metric.name}
                  className={`rounded-lg border-2 p-6 ${getRatingColor(metric.rating || 'good')}`}
                >
                  <div className="mb-2 flex items-start justify-between">
                    <h3 className="text-lg font-semibold">{metric.name}</h3>
                    <span className="text-xs font-bold uppercase">
                      {metric.rating}
                    </span>
                  </div>
                  <div className="mb-3 text-3xl font-bold">
                    {formatValue(metric.name, metric.average || 0)}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Min:</span>
                      <span className="font-medium">
                        {formatValue(metric.name, metric.min || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max:</span>
                      <span className="font-medium">
                        {formatValue(metric.name, metric.max || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Samples:</span>
                      <span className="font-medium">{metric.count}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-12 text-center text-gray-500">
                No Web Vitals data collected yet. Browse the app to generate
                metrics.
              </div>
            )}
          </div>
        </div>

        {/* Custom Metrics */}
        {customMetrics.length > 0 && (
          <div className="mb-8">
            <h2 className="mb-4 text-2xl font-semibold text-gray-800">
              Custom Performance Metrics
            </h2>
            <div className="overflow-hidden rounded-lg bg-white shadow">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Average
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Min
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Max
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Samples
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {customMetrics.map((metric) => (
                    <tr key={metric.name}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                        {metric.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {Math.round(metric.average || 0)}ms
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {Math.round(metric.min || 0)}ms
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {Math.round(metric.max || 0)}ms
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                        {metric.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Performance Budgets Info */}
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-6">
          <h2 className="mb-3 text-xl font-semibold text-blue-900">
            Performance Budget Targets
          </h2>
          <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="font-semibold text-blue-900">LCP</div>
              <div className="text-blue-700">Good: &lt; 2.5s</div>
            </div>
            <div>
              <div className="font-semibold text-blue-900">FID</div>
              <div className="text-blue-700">Good: &lt; 100ms</div>
            </div>
            <div>
              <div className="font-semibold text-blue-900">CLS</div>
              <div className="text-blue-700">Good: &lt; 0.1</div>
            </div>
            <div>
              <div className="font-semibold text-blue-900">FCP</div>
              <div className="text-blue-700">Good: &lt; 1.8s</div>
            </div>
            <div>
              <div className="font-semibold text-blue-900">TTFB</div>
              <div className="text-blue-700">Good: &lt; 600ms</div>
            </div>
            <div>
              <div className="font-semibold text-blue-900">INP</div>
              <div className="text-blue-700">Good: &lt; 200ms</div>
            </div>
          </div>
        </div>

        {/* Recent Metrics Log */}
        <div className="mt-8">
          <h2 className="mb-4 text-2xl font-semibold text-gray-800">
            Recent Metrics (Last 20)
          </h2>
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Metric
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Value
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                      Rating
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {metrics
                    .slice(-20)
                    .reverse()
                    .map((metric, idx) => (
                      <tr key={`${metric.id}-${idx}`}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                          {new Date(metric.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {metric.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          {formatValue(metric.name, metric.value)}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4">
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${getRatingColor(metric.rating)}`}
                          >
                            {metric.rating}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
