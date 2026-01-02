#!/bin/bash
# Runtime Validation Script
# Ensures no unsupported Vercel runtimes are referenced in the codebase

set -e

echo "🔍 Validating Vercel runtime configuration..."

# Check for nodejs22.x references in vercel.json
if grep -r "nodejs22" vercel.json 2>/dev/null; then
  echo "❌ ERROR: Found unsupported runtime 'nodejs22.x' in vercel.json"
  echo "   Vercel does not support nodejs22.x as a serverless runtime."
  echo "   Use 'nodejs20.x' instead."
  exit 1
fi

# Check for unversioned nodejs runtime
if grep -r '"nodejs"' vercel.json 2>/dev/null; then
  echo "❌ ERROR: Found unversioned runtime 'nodejs' in vercel.json"
  echo "   Always specify an explicit version like 'nodejs20.x'"
  exit 1
fi

# Check for deprecated NOW runtime references
if grep -r "NOW_REGION" vercel.json 2>/dev/null; then
  echo "⚠️  WARNING: Found legacy NOW environment variable references"
fi

# Validate that edge functions use 'edge' runtime
EDGE_FUNCTIONS=$(find api/edge -name "*.ts" -o -name "*.js" 2>/dev/null || true)
for func in $EDGE_FUNCTIONS; do
  if [ -f "$func" ]; then
    if grep -q "export const config" "$func"; then
      if ! grep -q "runtime.*:.*['\"]edge['\"]" "$func"; then
        echo "⚠️  WARNING: Edge function $func should use runtime: 'edge'"
      fi
    fi
  fi
done

# Check Node version compatibility
NODE_VERSION=$(node -v)
NODE_MAJOR=$(echo "$NODE_VERSION" | sed 's/v//; s/\..*//')
NODE_MINOR=$(echo "$NODE_VERSION" | sed 's/v[0-9]*\.//; s/\..*//')

if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "❌ ERROR: Node.js version $NODE_VERSION is below minimum required version 20.0.0"
  echo "   Please upgrade to Node.js 20 or higher"
  exit 1
fi

if [ "$NODE_MAJOR" -eq 20 ] && [ "$NODE_MINOR" -lt 0 ]; then
  echo "⚠️  WARNING: Node.js version $NODE_VERSION may have compatibility issues"
  echo "   Recommended: Node.js 20.0.0 or higher"
fi

echo "✅ Runtime validation passed!"
echo "   - No unsupported runtimes found in vercel.json"
echo "   - Node.js version: $NODE_VERSION (major: $NODE_MAJOR, minor: $NODE_MINOR)"
echo "   - Vercel serverless runtime: nodejs20.x"
echo "   - Local development runtime: Node 22.x (per .nvmrc)"

exit 0
