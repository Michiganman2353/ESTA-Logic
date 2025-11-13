// src/index.js
import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './components/session/withAuthentication'; // From upgraded session
import { ThemeProvider } from './contexts/ThemeContext'; // Optional – add if dark mode
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { registerSW } from './serviceworker'; // From upgraded SW

// Global Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Global error:', error, errorInfo);
    // Sentry integration (optional)
    // Sentry.captureException(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-900 p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Root render
const container = document.getElementById('root');
const root = createRoot(container);

// Heavy-traffic optimizations: StrictMode, error boundary, providers
root.render(
  <StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  </StrictMode>
);

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
  registerSW({
    onUpdate: (registration) => {
      if (confirm('New version available. Reload?')) {
        registration.update();
        window.location.reload();
      }
    },
    onSuccess: (registration) => {
      console.log('SW registered:', registration.scope);
    },
  });
}

// Report web vitals (heavy-traffic analytics)
reportWebVitals((metric) => {
  console.log(metric);
  // Optional: Send to analytics
  // gtag('event', metric.name, metric);
});

// Offline listener (PWA elite)
window.addEventListener('online', () => {
  console.log('Back online – syncing...');
  // Trigger background sync if queued
  if ('serviceWorker' in navigator && 'sync' in navigator.serviceWorker) {
    navigator.serviceWorker.ready.then((reg) => {
      reg.sync.register('background-sync');
    });
  }
});