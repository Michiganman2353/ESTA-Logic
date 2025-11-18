#!/bin/bash
#
# validate-secrets.sh
# 
# This script validates that all required secrets are configured for deployment.
# Usage: ./scripts/validate-secrets.sh
#

set -e

echo "🔍 Validating deployment secrets..."
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track if all secrets are present
ALL_SECRETS_PRESENT=true

# Function to check if a secret is set
check_secret() {
    local secret_name=$1
    local secret_value=$2
    local source=$3
    
    if [ -z "$secret_value" ]; then
        echo -e "${RED}❌ $secret_name${NC} is NOT set (checked: $source)"
        ALL_SECRETS_PRESENT=false
        return 1
    else
        echo -e "${GREEN}✅ $secret_name${NC} is set (source: $source)"
        return 0
    fi
}

echo "Checking for secrets in environment and .env.local..."
echo ""

# Load .env.local if it exists (for local development)
if [ -f ".env.local" ]; then
    echo -e "${GREEN}Found .env.local file${NC}"
    # Export variables from .env.local without overwriting existing env vars
    set -a
    source .env.local
    set +a
else
    echo -e "${YELLOW}⚠️  .env.local not found (this is OK for GitHub Actions)${NC}"
fi

echo ""
echo "--- Required Secrets ---"
echo ""

# Check VERCEL_TOKEN
check_secret "VERCEL_TOKEN" "$VERCEL_TOKEN" ".env.local or environment"

# Check VERCEL_ORG_ID
check_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID" ".env.local or environment"

# Check VERCEL_PROJECT_ID
check_secret "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID" ".env.local or environment"

echo ""
echo "--- Summary ---"
echo ""

if [ "$ALL_SECRETS_PRESENT" = true ]; then
    echo -e "${GREEN}✅ All required secrets are configured!${NC}"
    echo ""
    echo "You can now deploy:"
    echo "  - Locally: vercel --prod"
    echo "  - Preview: vercel"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Some secrets are missing!${NC}"
    echo ""
    echo "For local development:"
    echo "  1. Copy .env.example to .env.local"
    echo "  2. Fill in the missing values"
    echo ""
    echo "For GitHub Actions:"
    echo "  1. See GITHUB_SECRETS_SETUP.md for instructions"
    echo "  2. Add secrets at: https://github.com/Michiganman2353/esta-tracker-clean/settings/secrets/actions"
    echo ""
    echo "To get Vercel IDs:"
    echo "  1. Run: vercel link"
    echo "  2. Check: .vercel/project.json"
    echo ""
    exit 1
fi
