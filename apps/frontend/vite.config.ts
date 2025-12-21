import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  // Validate required environment variables for production builds
  if (mode === 'production') {
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID',
    ];

    const missingVars = requiredEnvVars.filter((key) => !env[key]);
    if (missingVars.length > 0) {
      console.error(
        '⚠️  Error: Missing required environment variables:',
        missingVars.join(', ')
      );
      console.error('   Firebase will not initialize correctly in production.');
      console.error(
        '   Set these variables in your Vercel Dashboard or .env file.'
      );
    }
  }

  return {
    // Explicitly set root for Vercel/Turborepo compatibility
    // Root must be the directory containing index.html and src/
    root: __dirname,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Force optimization of dependencies for monorepo
    // This prevents workspace resolution issues
    // Note: Firebase v12+ uses modular exports, so we include specific subpaths
    // instead of the root 'firebase' package (which has no root export)
    optimizeDeps: {
      force: true,
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'firebase/app',
        'firebase/auth',
        'firebase/firestore',
        'firebase/storage',
        'firebase/analytics',
        'date-fns',
        'zustand',
      ],
      // Exclude packages that should not be pre-bundled for SSR compatibility
      exclude: [],
    },
    // SSR configuration for Vercel compatibility
    ssr: {
      // Do not externalize Firebase packages - they need to be bundled
      noExternal: ['firebase', '@firebase/*', '@esta/firebase'],
    },
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
        },
      },
    },
    // Base public path for assets - ensures correct asset resolution in production
    base: '/',
    build: {
      // Output directory relative to the root (apps/frontend)
      outDir: 'dist',
      // Ensure dist folder is cleaned to prevent stale artifacts
      emptyOutDir: true,
      sourcemap: true,
      // Target modern browsers that support ES modules
      target: 'es2020',
      // Enable CSS code splitting
      cssCodeSplit: true,
      // Performance optimizations
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'date-vendor': ['date-fns'],
            'firebase-vendor': [
              'firebase/app',
              'firebase/auth',
              'firebase/firestore',
              'firebase/storage',
            ],
          },
          // Optimize asset file names for better caching
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name?.split('.') ?? [];
            const ext = info[info.length - 1];
            // Separate CSS and other assets for better caching
            if (ext === 'css') {
              return 'assets/css/[name]-[hash][extname]';
            }
            // Images and other assets
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return 'assets/images/[name]-[hash][extname]';
            }
            // Fonts
            if (/woff2?|eot|ttf|otf/i.test(ext)) {
              return 'assets/fonts/[name]-[hash][extname]';
            }
            // Default
            return 'assets/[name]-[hash][extname]';
          },
          // Optimize chunk file names
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
        },
      },
      // Chunk size warning limit (reduced from 1000 to enforce budgets)
      chunkSizeWarningLimit: 500,
      // Minify settings
      minify: 'esbuild',
      // CSS minify
      cssMinify: true,
      // Report compressed size for performance tracking
      reportCompressedSize: true,
    },
    // Performance budgets enforcement
    // Hook into build end to check bundle sizes against budgets
    ...(mode === 'production' && {
      // This will be called after build completes
      async build() {
        // Budget checking will be done via custom plugin
      },
    }),
  };
});
