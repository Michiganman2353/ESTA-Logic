# Migration Guide: Old Encryption → KMS Integration

This guide helps you migrate from the old RSA-based hybrid encryption to the new KMS-backed encryption system.

## Why Migrate?

### Old System Issues
- ❌ Private keys stored in environment variables
- ❌ Keys exposed in logs and version control
- ❌ No centralized key management
- ❌ Manual key rotation required
- ❌ No audit trail for key usage
- ❌ Private keys transmitted in API requests

### New System Benefits
- ✅ Keys managed by Google Cloud KMS (hardware security)
- ✅ IAM-based access control
- ✅ Automatic key rotation
- ✅ Complete audit logging
- ✅ FIPS 140-2 Level 3 certified
- ✅ Keys never leave secure hardware

## Migration Steps

### Phase 1: Setup KMS (Week 1)

#### 1.1 Enable Cloud KMS API

```bash
gcloud services enable cloudkms.googleapis.com --project=esta-tracker
```

#### 1.2 Create Key Ring and Crypto Key

```bash
# Create key ring
gcloud kms keyrings create esta-tracker-keyring \
  --location=us-central1

# Create crypto key with auto-rotation
gcloud kms keys create esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --purpose=encryption \
  --rotation-period=90d \
  --next-rotation-time=$(date -u -d "+90 days" +%Y-%m-%dT%H:%M:%SZ)
```

#### 1.3 Configure IAM Permissions

```bash
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
```

#### 1.4 Update Environment Variables

Add to Vercel Dashboard → Settings → Environment Variables:

```bash
GCP_PROJECT_ID=esta-tracker
KMS_LOCATION=us-central1
KMS_KEYRING_ID=esta-tracker-keyring
KMS_CRYPTO_KEY_ID=esta-tracker-key
```

### Phase 2: Deploy KMS Integration (Week 1)

#### 2.1 Deploy Updated Code

```bash
# The KMS integration is already in your codebase
# Just deploy to production
vercel --prod
```

#### 2.2 Test KMS Endpoints

```bash
# Test encryption
curl -X POST https://your-app.vercel.app/api/kms/encrypt \
  -H "Content-Type: application/json" \
  -d '{"data": "test data"}'

# Test decryption (requires auth in production)
curl -X POST https://your-app.vercel.app/api/kms/decrypt \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"payload": { ... }}'
```

### Phase 3: Parallel Run (Week 2-3)

Run both systems in parallel to ensure stability.

#### 3.1 Update Application Code

**Old Code**:
```typescript
import { encryptHybrid, decryptHybrid } from './hybridEncryption';

const encrypted = encryptHybrid(data, publicKey);
const decrypted = decryptHybrid(encrypted, privateKey);
```

**New Code**:
```typescript
import { kmsEncrypt, kmsDecrypt } from './services/kmsEncryption';

const encrypted = await kmsEncrypt(data);
const decrypted = await kmsDecrypt(encrypted);
```

#### 3.2 Detect Old vs New Format

```typescript
function isKMSEncrypted(payload: any): boolean {
  // New format has 'wrappedKey', old format has 'encryptedAESKey'
  return 'wrappedKey' in payload;
}

async function decryptData(payload: any) {
  if (isKMSEncrypted(payload)) {
    // Use new KMS decryption
    return await kmsDecrypt(payload);
  } else {
    // Use old RSA decryption
    return decryptHybrid(payload, privateKey);
  }
}
```

#### 3.3 Start Using KMS for New Data

```typescript
// New employee registration
const encrypted = await kmsEncrypt(employee.ssn);
await db.collection('employees').add({
  ...employee,
  ssn: encrypted,
  _encryptionVersion: 'kms-v1' // Mark as KMS encrypted
});
```

### Phase 4: Data Migration (Week 3-4)

Migrate existing encrypted data to KMS.

#### 4.1 Create Migration Script

```typescript
import { initializeKMS } from './services/kms';
import { kmsEncrypt } from './services/kmsEncryption';
import { decryptHybrid } from './utils/encryption/hybridEncryption';
import admin from 'firebase-admin';

const OLD_PRIVATE_KEY = process.env.OLD_RSA_PRIVATE_KEY!;

async function migrateEmployeeData() {
  // Initialize services
  initializeKMS();
  const db = admin.firestore();
  
  // Get all employees
  const employees = await db.collection('employees').get();
  let migrated = 0;
  let failed = 0;
  
  for (const doc of employees.docs) {
    try {
      const data = doc.data();
      
      // Skip if already migrated
      if (data._encryptionVersion === 'kms-v1') {
        console.log(`Skipping ${doc.id} - already migrated`);
        continue;
      }
      
      // Decrypt with old system
      const decryptedSSN = data.ssn?.encryptedData 
        ? decryptHybrid(data.ssn, OLD_PRIVATE_KEY)
        : null;
        
      const decryptedAddress = data.address?.encryptedData
        ? decryptHybrid(data.address, OLD_PRIVATE_KEY)
        : null;
        
      const decryptedPhone = data.phone?.encryptedData
        ? decryptHybrid(data.phone, OLD_PRIVATE_KEY)
        : null;
      
      // Re-encrypt with KMS
      const updates: any = {
        _encryptionVersion: 'kms-v1',
        _migratedAt: admin.firestore.FieldValue.serverTimestamp()
      };
      
      if (decryptedSSN) {
        updates.ssn = await kmsEncrypt(decryptedSSN);
      }
      
      if (decryptedAddress) {
        updates.address = await kmsEncrypt(decryptedAddress);
      }
      
      if (decryptedPhone) {
        updates.phone = await kmsEncrypt(decryptedPhone);
      }
      
      // Update document
      await doc.ref.update(updates);
      migrated++;
      
      console.log(`✓ Migrated employee ${doc.id}`);
      
    } catch (error) {
      failed++;
      console.error(`✗ Failed to migrate ${doc.id}:`, error);
      
      // Log failure to Firestore for retry
      await db.collection('migrationFailures').add({
        employeeId: doc.id,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }
  
  console.log(`\nMigration complete!`);
  console.log(`Migrated: ${migrated}`);
  console.log(`Failed: ${failed}`);
}

// Run migration
migrateEmployeeData()
  .then(() => console.log('Done'))
  .catch(err => console.error('Migration error:', err));
```

#### 4.2 Run Migration

```bash
# Dry run first
DRY_RUN=true npm run migrate:encryption

# Real migration
npm run migrate:encryption
```

#### 4.3 Verify Migration

```typescript
async function verifyMigration() {
  const db = admin.firestore();
  const employees = await db.collection('employees').get();
  
  let kmsCount = 0;
  let oldCount = 0;
  
  for (const doc of employees.docs) {
    const data = doc.data();
    
    if (data._encryptionVersion === 'kms-v1') {
      kmsCount++;
      
      // Verify decryption works
      try {
        if (data.ssn) {
          await kmsDecrypt(data.ssn);
        }
      } catch (error) {
        console.error(`Decryption failed for ${doc.id}`);
      }
    } else {
      oldCount++;
      console.log(`Old format: ${doc.id}`);
    }
  }
  
  console.log(`KMS: ${kmsCount}, Old: ${oldCount}`);
}
```

### Phase 5: Cleanup (Week 5)

Remove old encryption code after successful migration.

#### 5.1 Remove Old Environment Variables

From Vercel Dashboard:
- Remove `RSA_PRIVATE_KEY`
- Remove `RSA_PUBLIC_KEY`

#### 5.2 Remove Old Code

```bash
# Archive old encryption module
git mv packages/backend/src/utils/encryption/hybridEncryption.ts \
  packages/backend/src/utils/encryption/hybridEncryption.legacy.ts

# Update imports to remove references
```

#### 5.3 Update Documentation

- Update README to only reference KMS encryption
- Archive old encryption documentation
- Update API docs

## Rollback Plan

If issues occur, you can rollback:

### Immediate Rollback

1. **Keep old code** during migration period
2. **Keep old private key** in environment variables
3. **Detect encryption version** and use appropriate decryption

```typescript
async function safeDecrypt(payload: any) {
  try {
    // Try KMS first
    if (isKMSEncrypted(payload)) {
      return await kmsDecrypt(payload);
    }
  } catch (error) {
    console.warn('KMS decryption failed, trying legacy');
  }
  
  // Fallback to old system
  return decryptHybrid(payload, OLD_PRIVATE_KEY);
}
```

### Full Rollback

If you need to completely rollback:

1. Revert deployment:
```bash
vercel rollback
```

2. Re-encrypt any KMS data with old system:
```bash
npm run revert:encryption
```

## Testing Checklist

Before going live:

- [ ] KMS API enabled
- [ ] Key ring and crypto key created
- [ ] IAM permissions configured
- [ ] Environment variables set in Vercel
- [ ] KMS endpoints tested
- [ ] New encryption works
- [ ] New decryption works
- [ ] Batch encryption works
- [ ] Batch decryption works
- [ ] Migration script tested on dev data
- [ ] Rollback plan tested
- [ ] Monitoring and alerts configured
- [ ] Audit logging verified

## Monitoring During Migration

### Metrics to Watch

1. **Encryption Operations**
   - Success rate by version (old vs KMS)
   - Error rates
   - Latency comparison

2. **Data Migration**
   - Records migrated per hour
   - Failed migrations
   - Retry success rate

3. **System Health**
   - API response times
   - Database query performance
   - Error logs

### Alerts

Set up alerts for:
- KMS operation failures > 1%
- Migration failures > 5%
- Decryption errors
- Unauthorized KMS access attempts

## Common Issues

### Issue: "Permission denied" on KMS operations

**Solution**: Check IAM permissions:
```bash
gcloud kms keys get-iam-policy esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1
```

### Issue: Migration script timeout

**Solution**: Process in smaller batches:
```typescript
const BATCH_SIZE = 100;
const employees = await db.collection('employees')
  .limit(BATCH_SIZE)
  .get();
```

### Issue: Old data still using RSA

**Solution**: Ensure migration script ran:
```bash
npm run verify:encryption
```

### Issue: Performance degradation

**Solution**: 
1. Use batch operations for multiple fields
2. Implement caching for frequently accessed data
3. Use same region for KMS and application

## Timeline

| Week | Phase | Tasks |
|------|-------|-------|
| 1 | Setup | Enable KMS, create keys, configure IAM, deploy code |
| 2-3 | Parallel | Test both systems, update application code |
| 3-4 | Migration | Run migration script, verify data |
| 5 | Cleanup | Remove old code and environment variables |
| 6 | Monitor | Watch metrics, handle any issues |

## Support

- KMS Setup: [KMS_SETUP.md](./KMS_SETUP.md)
- KMS Integration: [KMS_INTEGRATION.md](./KMS_INTEGRATION.md)
- API Endpoints: [API_ENDPOINTS.md](./API_ENDPOINTS.md)
- GitHub Issues: Report migration problems with `[migration]` tag

## Success Criteria

Migration is complete when:
- ✅ 100% of encrypted data uses KMS
- ✅ All old private keys removed from environment
- ✅ Old encryption code removed or archived
- ✅ No decryption errors in logs
- ✅ Audit logs show only KMS operations
- ✅ Performance within acceptable range
- ✅ All tests passing
