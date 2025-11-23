import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  // Map REACT_APP_* environment variables to VITE_* for compatibility
  // This allows Vercel deployments with REACT_APP_* vars to work seamlessly
  const firebaseKeys = [
    'API_KEY',
    'AUTH_DOMAIN',
    'PROJECT_ID',
    'STORAGE_BUCKET',
    'MESSAGING_SENDER_ID',
    'APP_ID',
    'MEASUREMENT_ID'
  ];
  
  const envWithMappedVars: Record<string, string> = { ...env };
  
  firebaseKeys.forEach(key => {
    const reactAppVar = `REACT_APP_FIREBASE_${key}`;
    const viteVar = `VITE_FIREBASE_${key}`;
    
    // If REACT_APP_* exists but VITE_* doesn't, map it
    if (env[reactAppVar] && !env[viteVar]) {
      envWithMappedVars[viteVar] = env[reactAppVar];
      // Also set it in process.env for runtime access
      process.env[viteVar] = env[reactAppVar];
    }
  });
  
  // Validate required environment variables for production builds
  if (mode === 'production') {
    const requiredEnvVars = [
      'VITE_FIREBASE_API_KEY',
      'VITE_FIREBASE_AUTH_DOMAIN',
      'VITE_FIREBASE_PROJECT_ID',
      'VITE_FIREBASE_STORAGE_BUCKET',
      'VITE_FIREBASE_MESSAGING_SENDER_ID',
      'VITE_FIREBASE_APP_ID'
    ]
    
    const missingVars = requiredEnvVars.filter(key => !envWithMappedVars[key])
    if (missingVars.length > 0) {
      console.error('⚠️  Error: Missing required environment variables:', missingVars.join(', '))
      console.error('   Firebase will not initialize correctly in production.')
      console.error('   Set these variables in your Vercel Dashboard or .env file.')
      console.error('   Note: REACT_APP_* prefixed variables are also supported.')
    }
  }
  
  return {
    // Explicitly set root for Vercel/Turborepo compatibility
    // Root must be the directory containing index.html and src/
    root: __dirname,
    plugins: [react()],
    // Define additional env variables to expose to the client
    // This allows REACT_APP_* variables to be accessible via import.meta.env
    define: {
      ...firebaseKeys.reduce((acc, key) => {
        const reactAppVar = `REACT_APP_FIREBASE_${key}`;
        const viteVar = `VITE_FIREBASE_${key}`;
        
        if (env[reactAppVar] && !env[viteVar]) {
          acc[`import.meta.env.${viteVar}`] = JSON.stringify(env[reactAppVar]);
        }
        
        return acc;
      }, {} as Record<string, string>)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // Force optimization of dependencies for monorepo
    // This prevents workspace resolution issues
    optimizeDeps: {
      force: true,
      include: ['react', 'react-dom', 'react-router-dom', 'firebase', 'date-fns', 'zustand'],
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
    build: {
      // Output directory relative to the root (packages/frontend)
      outDir: 'dist',
      sourcemap: true,
      // Performance optimizations
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor code for better caching
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'date-vendor': ['date-fns'],
          },
        },
      },
      // Chunk size warning limit
      chunkSizeWarningLimit: 1000,
    },
  }
})
