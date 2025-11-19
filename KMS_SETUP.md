# Google Cloud KMS Setup Guide

This guide walks you through setting up Google Cloud Key Management Service (KMS) for the ESTA Tracker application.

## Table of Contents
- [Prerequisites](#prerequisites)
- [Step 1: Enable Cloud KMS API](#step-1-enable-cloud-kms-api)
- [Step 2: Create Key Ring](#step-2-create-key-ring)
- [Step 3: Create Crypto Key](#step-3-create-crypto-key)
- [Step 4: Configure IAM Permissions](#step-4-configure-iam-permissions)
- [Step 5: Configure Environment Variables](#step-5-configure-environment-variables)
- [Step 6: Test KMS Integration](#step-6-test-kms-integration)
- [Key Rotation](#key-rotation)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Google Cloud Platform (GCP) account
- Firebase project (already set up for ESTA Tracker)
- `gcloud` CLI installed and authenticated
- Appropriate permissions to create KMS resources

## Step 1: Enable Cloud KMS API

### Via Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (`esta-tracker`)
3. Navigate to **APIs & Services** → **Library**
4. Search for "Cloud Key Management Service (KMS) API"
5. Click **Enable**

### Via gcloud CLI

```bash
gcloud services enable cloudkms.googleapis.com --project=esta-tracker
```

## Step 2: Create Key Ring

A key ring is a logical grouping of keys in a specific location.

### Via gcloud CLI

```bash
# Set your project
gcloud config set project esta-tracker

# Create key ring in us-central1
gcloud kms keyrings create esta-tracker-keyring \
  --location=us-central1

# Verify creation
gcloud kms keyrings list --location=us-central1
```

### Via Google Cloud Console

1. Navigate to **Security** → **Key Management**
2. Click **Create Key Ring**
3. Set **Key ring name**: `esta-tracker-keyring`
4. Set **Location type**: `Region`
5. Set **Region**: `us-central1` (or your preferred region)
6. Click **Create**

### Location Considerations

Choose a location based on:
- **Performance**: Closest to your primary users
- **Compliance**: Data residency requirements
- **Availability**: Multi-region for high availability

Recommended locations:
- `us-central1` - Iowa, USA
- `us-east1` - South Carolina, USA
- `europe-west1` - Belgium, Europe
- `asia-east1` - Taiwan, Asia

## Step 3: Create Crypto Key

Create a symmetric encryption key for wrapping data encryption keys.

### Via gcloud CLI

```bash
# Create symmetric encryption key
gcloud kms keys create esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)

# Verify creation
gcloud kms keys list \
  --keyring=esta-tracker-keyring \
  --location=us-central1
```

### Via Google Cloud Console

1. In **Key Management**, click on `esta-tracker-keyring`
2. Click **Create Key**
3. Set **Key name**: `esta-tracker-key`
4. Set **Protection level**: `Software` (or `HSM` for enhanced security)
5. Set **Purpose**: `Symmetric encrypt/decrypt`
6. Set **Key rotation period**: `90 days`
7. Click **Create**

### Key Protection Levels

- **Software**: Keys stored in Google's software-based key management
  - Lower cost
  - Suitable for most applications
  
- **HSM** (Hardware Security Module): Keys stored in FIPS 140-2 Level 3 certified HSMs
  - Higher cost
  - Required for compliance (HIPAA, PCI-DSS)
  - Recommended for production

## Step 4: Configure IAM Permissions

Grant the service account appropriate KMS permissions.

### Required IAM Roles

Your service account needs these roles:
- `roles/cloudkms.cryptoKeyEncrypter` - Encrypt data with KMS
- `roles/cloudkms.cryptoKeyDecrypter` - Decrypt data with KMS
- `roles/cloudkms.viewer` - List keys and view metadata

### Via gcloud CLI

```bash
# Get your service account email
SERVICE_ACCOUNT="your-service-account@esta-tracker.iam.gserviceaccount.com"

# Grant encrypter role
gcloud kms keys add-iam-policy-binding esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudkms.cryptoKeyEncrypter"

# Grant decrypter role
gcloud kms keys add-iam-policy-binding esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudkms.cryptoKeyDecrypter"

# Grant viewer role (for key listing)
gcloud kms keyrings add-iam-policy-binding esta-tracker-keyring \
  --location=us-central1 \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudkms.viewer"
```

### Via Google Cloud Console

1. Navigate to **IAM & Admin** → **IAM**
2. Find your service account
3. Click **Edit** (pencil icon)
4. Click **Add Another Role**
5. Add the following roles:
   - `Cloud KMS CryptoKey Encrypter`
   - `Cloud KMS CryptoKey Decrypter`
   - `Cloud KMS Viewer`
6. Click **Save**

## Step 5: Configure Environment Variables

### Local Development

Create `.env.local`:

```bash
# Copy from .env.example
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Add KMS configuration:

```bash
GCP_PROJECT_ID=esta-tracker
KMS_LOCATION=us-central1
KMS_KEYRING_ID=esta-tracker-keyring
KMS_CRYPTO_KEY_ID=esta-tracker-key
KMS_KEY_VERSION=  # Leave blank for primary version
```

For local development, also set:

```bash
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

### Vercel Production

Add environment variables in Vercel Dashboard:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

```
GCP_PROJECT_ID=esta-tracker
KMS_LOCATION=us-central1
KMS_KEYRING_ID=esta-tracker-keyring
KMS_CRYPTO_KEY_ID=esta-tracker-key
```

**Note**: The `FIREBASE_SERVICE_ACCOUNT` variable should already have KMS permissions if you've configured IAM correctly.

## Step 6: Test KMS Integration

### Test Encryption

```bash
# Start backend server
npm run dev:backend

# Test encryption endpoint
curl -X POST http://localhost:3001/api/kms/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data": "sensitive information"}'
```

Expected response:
```json
{
  "success": true,
  "encrypted": {
    "encryptedData": "base64...",
    "wrappedKey": "base64...",
    "iv": "base64...",
    "authTag": "base64..."
  }
}
```

### Test Decryption

```bash
# Use the encrypted payload from above
curl -X POST http://localhost:3001/api/kms/decrypt \
  -H "Content-Type: application/json" \
  -d '{
    "payload": {
      "encryptedData": "base64...",
      "wrappedKey": "base64...",
      "iv": "base64...",
      "authTag": "base64..."
    }
  }'
```

Expected response:
```json
{
  "success": true,
  "decrypted": "sensitive information"
}
```

### Run Integration Tests

```bash
# Run KMS service tests
npm run test:backend -- kms

# Run encryption service tests
npm run test:backend -- kmsEncryption
```

## Key Rotation

Google Cloud KMS supports automatic key rotation.

### Enable Automatic Rotation

Rotation is already enabled if you created the key with `--rotation-period`:

```bash
gcloud kms keys update esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --rotation-period=90d \
  --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)
```

### Manual Key Rotation

1. Create a new key version:
```bash
gcloud kms keys versions create \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --key=esta-tracker-key
```

2. Set as primary version:
```bash
gcloud kms keys set-primary-version esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --version=2
```

3. Re-encrypt existing data (background job):
```typescript
import { kmsReencrypt } from './services/kmsEncryption';

async function rotateKeys() {
  const employees = await db.collection('employees').get();
  
  for (const doc of employees.docs) {
    const data = doc.data();
    if (data.encryptedSSN) {
      const reencrypted = await kmsReencrypt(
        data.encryptedSSN,
        oldKMS,  // Version 1
        newKMS   // Version 2
      );
      
      await doc.ref.update({ encryptedSSN: reencrypted });
    }
  }
}
```

### Key Rotation Best Practices

- Rotate keys every 90 days
- Keep old versions for 1 year (to decrypt old data)
- Test rotation in staging first
- Monitor key usage metrics
- Document rotation schedule

## Troubleshooting

### Error: "Permission denied"

**Cause**: Service account lacks KMS permissions

**Solution**:
```bash
# Check current IAM policy
gcloud kms keys get-iam-policy esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1

# Grant missing permissions (see Step 4)
```

### Error: "Key ring not found"

**Cause**: Key ring doesn't exist or wrong location

**Solution**:
```bash
# List all key rings
gcloud kms keyrings list --location=us-central1

# Create if missing (see Step 2)
```

### Error: "API not enabled"

**Cause**: Cloud KMS API not enabled

**Solution**:
```bash
gcloud services enable cloudkms.googleapis.com --project=esta-tracker
```

### Error: "Invalid key version"

**Cause**: Specified key version doesn't exist

**Solution**:
```bash
# List key versions
gcloud kms keys versions list \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --key=esta-tracker-key

# Remove KMS_KEY_VERSION from .env to use primary
```

### Error: "Decryption failed"

**Possible causes**:
1. Wrong key version
2. Corrupted data
3. Modified ciphertext

**Solution**:
```bash
# Verify key state
gcloud kms keys versions describe 1 \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --key=esta-tracker-key

# Check key is ENABLED
# Re-encrypt data if corrupted
```

### Performance Issues

**Symptoms**: Slow encryption/decryption operations

**Solutions**:
1. Use KMS in same region as application
2. Cache public keys (don't fetch on every request)
3. Use batch encryption for multiple fields
4. Consider connection pooling

### Cost Optimization

KMS pricing:
- First 20,000 operations/month: Free
- Additional operations: $0.03 per 10,000 operations

**Cost reduction strategies**:
1. Batch encrypt multiple fields in single operation
2. Cache decrypted data temporarily (with caution)
3. Use symmetric keys (cheaper than asymmetric)
4. Monitor usage in GCP Console → Billing

## Security Best Practices

### Key Management
- ✅ Never store private keys in code
- ✅ Never store private keys in environment variables
- ✅ Use separate keys per environment (dev/staging/prod)
- ✅ Enable automatic key rotation
- ✅ Use HSM protection for production
- ✅ Monitor key access via Cloud Audit Logs

### Access Control
- ✅ Use least privilege principle
- ✅ Grant key access only to service accounts
- ✅ Never grant key access to users directly
- ✅ Use separate keys for different data types
- ✅ Regularly audit IAM permissions

### Data Protection
- ✅ Always use authenticated encryption (AES-GCM)
- ✅ Never reuse initialization vectors (IVs)
- ✅ Validate all inputs before encryption
- ✅ Log encryption/decryption operations (not the data!)
- ✅ Use separate DEKs per encrypted field

## Additional Resources

- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)
- [KMS Pricing](https://cloud.google.com/kms/pricing)
- [KMS Best Practices](https://cloud.google.com/kms/docs/best-practices)
- [Envelope Encryption](https://cloud.google.com/kms/docs/envelope-encryption)
- [Key Management Best Practices](https://cloud.google.com/kms/docs/key-management-best-practices)

## Support

For issues with KMS integration:
1. Check this troubleshooting guide
2. Review [Google Cloud KMS Status](https://status.cloud.google.com/)
3. Contact your GCP support representative
4. File an issue in the ESTA Tracker repository
