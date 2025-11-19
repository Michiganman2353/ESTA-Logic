# KMS Integration - Production Encryption System

## Overview

ESTA Tracker uses **Google Cloud Key Management Service (KMS)** for production-grade encryption of sensitive data. This document describes the KMS integration architecture, workflows, and usage.

## Why KMS?

Traditional encryption approaches store keys in environment variables or configuration files, which poses security risks:
- ❌ Keys exposed in logs, version control, or backups
- ❌ No centralized access control
- ❌ Manual key rotation required
- ❌ No audit trail for key usage
- ❌ Keys leave the security boundary

**KMS solves these problems:**
- ✅ Centralized key management in secure hardware
- ✅ IAM-based access control
- ✅ Automatic key rotation
- ✅ Complete audit logging
- ✅ Keys never leave KMS (hardware security modules)
- ✅ FIPS 140-2 Level 3 certified (HSM mode)

## Architecture

### Hybrid Encryption Workflow

ESTA Tracker uses **envelope encryption** (hybrid encryption):

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Generate random AES-256 key (DEK)                        │
│    └─> Data Encryption Key for this specific operation      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Encrypt data with AES-256-GCM                            │
│    └─> Fast, hardware-accelerated symmetric encryption     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Wrap DEK using Google Cloud KMS                          │
│    └─> KMS Master Key encrypts the DEK                     │
│    └─> DEK never stored in plaintext                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Store encrypted data + wrapped DEK                       │
│    └─> Both stored in Firestore                            │
└─────────────────────────────────────────────────────────────┘
```

### Benefits of This Approach

1. **Performance**: AES-256-GCM is fast (hardware-accelerated)
2. **Security**: Master keys never leave KMS hardware
3. **Scalability**: Each operation uses a fresh DEK
4. **Key Rotation**: Rotate master key without re-encrypting all data
5. **Compliance**: FIPS 140-2 Level 3 certified (HSM mode)

## Components

### 1. KMS Service (`packages/backend/src/services/kms.ts`)

Core Google Cloud KMS client wrapper:
- `encrypt(data)` - Encrypt data with KMS key
- `decrypt(ciphertext)` - Decrypt data with KMS key
- `getPublicKey()` - Get public key for client-side operations
- `listKeyVersions()` - List all key versions
- `createKeyVersion()` - Create new key version (rotation)
- `setPrimaryKeyVersion()` - Set primary key version
- `destroyKeyVersion()` - Destroy old key version

### 2. KMS Encryption Service (`packages/backend/src/services/kmsEncryption.ts`)

High-level encryption service using KMS:
- `kmsEncrypt(data)` - Hybrid encrypt with KMS-wrapped key
- `kmsDecrypt(payload)` - Hybrid decrypt with KMS
- `kmsEncryptFile(buffer)` - Encrypt file data
- `kmsDecryptFile(payload)` - Decrypt file data
- `kmsEncryptBatch(fields)` - Batch encrypt multiple fields
- `kmsDecryptBatch(fields)` - Batch decrypt multiple fields
- `kmsReencrypt(payload, oldKMS, newKMS)` - Re-encrypt for key rotation

### 3. Encryption Middleware (`packages/backend/src/middleware/encryption.ts`)

Automatic encryption/decryption middleware:
- `encryptRequestMiddleware()` - Auto-encrypt sensitive fields in requests
- `decryptResponseMiddleware()` - Auto-decrypt encrypted fields in responses
- `encryptFieldsMiddleware(fields)` - Encrypt specific fields
- `decryptFieldsMiddleware(fields)` - Decrypt specific fields
- `sanitizeForLogging(data)` - Remove sensitive data for logs

### 4. API Endpoints

- **POST `/api/kms/encrypt`** - Encrypt data using KMS
- **POST `/api/kms/decrypt`** - Decrypt data using KMS (requires auth)

## Usage Examples

### Basic Encryption/Decryption

```typescript
import { kmsEncrypt, kmsDecrypt } from './services/kmsEncryption';

// Encrypt sensitive data
const encrypted = await kmsEncrypt('SSN: 123-45-6789');
console.log(encrypted);
// {
//   encryptedData: "base64...",
//   wrappedKey: "base64...",     // KMS-wrapped AES key
//   iv: "base64...",
//   authTag: "base64..."
// }

// Store in database
await db.collection('employees').doc(id).update({
  ssn: encrypted
});

// Later, decrypt
const decrypted = await kmsDecrypt(encrypted);
console.log(decrypted); // "SSN: 123-45-6789"
```

### Batch Encryption

```typescript
import { kmsEncryptBatch, kmsDecryptBatch } from './services/kmsEncryption';

// Encrypt multiple fields at once
const encrypted = await kmsEncryptBatch({
  ssn: '123-45-6789',
  address: '123 Main St, City, State',
  phone: '555-1234',
  bankAccount: '1234567890'
});

// Store in database
await db.collection('employees').doc(id).update({
  encryptedFields: encrypted
});

// Decrypt all fields
const decrypted = await kmsDecryptBatch(encrypted);
console.log(decrypted);
// {
//   ssn: '123-45-6789',
//   address: '123 Main St, City, State',
//   phone: '555-1234',
//   bankAccount: '1234567890'
// }
```

### Using Middleware

```typescript
import { encryptFieldsMiddleware, decryptFieldsMiddleware } from './middleware/encryption';

// Automatic encryption on save
router.post('/employees',
  authenticate,
  encryptFieldsMiddleware(['ssn', 'address', 'phone']),
  async (req, res) => {
    // req.body.ssn is now encrypted
    await db.collection('employees').add(req.body);
    res.json({ success: true });
  }
);

// Automatic decryption on retrieve
router.get('/employees/:id',
  authenticate,
  async (req, res, next) => {
    const employee = await db.collection('employees').doc(req.params.id).get();
    res.json(employee.data());
    next();
  },
  decryptFieldsMiddleware(['ssn', 'address', 'phone'])
);
```

### File Encryption

```typescript
import { kmsEncryptFile, kmsDecryptFile } from './services/kmsEncryption';
import { readFile, writeFile } from 'fs/promises';

// Encrypt file
const fileData = await readFile('medical-record.pdf');
const encrypted = await kmsEncryptFile(fileData);

// Store encrypted file
await db.collection('documents').add({
  employeeId: 'emp_123',
  type: 'medical',
  encrypted: encrypted,
  createdAt: new Date()
});

// Later, decrypt file
const doc = await db.collection('documents').doc(docId).get();
const decryptedData = await kmsDecryptFile(doc.data().encrypted);
await writeFile('decrypted-medical-record.pdf', decryptedData);
```

## Sensitive Fields

The system automatically encrypts these field types:
- `ssn`, `socialSecurityNumber` - Social Security Numbers
- `taxId`, `ein` - Tax IDs and Employer Identification Numbers
- `bankAccount`, `routingNumber` - Banking information
- `address` - Physical addresses
- `phone`, `phoneNumber` - Phone numbers
- `medicalInfo`, `healthInfo` - Medical information
- `salary`, `compensation` - Salary information
- `password`, `secret` - Credentials

## Key Rotation

### Automatic Rotation

KMS keys are configured to rotate automatically every 90 days:

```bash
gcloud kms keys update esta-tracker-key \
  --keyring=esta-tracker-keyring \
  --location=us-central1 \
  --rotation-period=90d
```

### Manual Rotation

For manual key rotation:

```typescript
import { kmsReencrypt } from './services/kmsEncryption';
import { KMSService } from './services/kms';

// Configure old and new key versions
const oldKMS = new KMSService({ 
  ...config, 
  keyVersion: '1' 
});

const newKMS = new KMSService({ 
  ...config, 
  keyVersion: '2' 
});

// Re-encrypt data
async function rotateEmployeeData() {
  const employees = await db.collection('employees').get();
  
  for (const doc of employees.docs) {
    const data = doc.data();
    
    if (data.encryptedFields) {
      // Re-encrypt each field with new key version
      const reencrypted: any = {};
      
      for (const [field, encrypted] of Object.entries(data.encryptedFields)) {
        reencrypted[field] = await kmsReencrypt(
          encrypted,
          oldKMS,
          newKMS
        );
      }
      
      await doc.ref.update({ encryptedFields: reencrypted });
      console.log(`Rotated keys for employee ${doc.id}`);
    }
  }
}
```

## Security Best Practices

### Key Management

✅ **DO:**
- Store KMS keys in Google Cloud KMS
- Use separate keys per environment (dev/staging/prod)
- Enable automatic key rotation (90 days)
- Use HSM protection level for production
- Monitor key access via Cloud Audit Logs
- Regularly review IAM permissions

❌ **DON'T:**
- Store keys in environment variables
- Store keys in code or configuration files
- Share keys between environments
- Grant broad KMS permissions
- Disable audit logging
- Use software keys for sensitive production data

### Data Protection

✅ **DO:**
- Encrypt all PII (SSN, address, phone, medical info)
- Use batch encryption for multiple fields
- Validate data before encryption
- Use authenticated encryption (AES-GCM)
- Generate new IV for each encryption operation
- Log encryption/decryption operations (not the data!)

❌ **DON'T:**
- Log encrypted or decrypted data
- Reuse initialization vectors (IVs)
- Store plaintext and encrypted versions together
- Encrypt data that doesn't need encryption
- Skip authentication tag validation
- Use deprecated encryption algorithms

### Access Control

✅ **DO:**
- Require authentication for decrypt endpoints
- Use role-based access control (RBAC)
- Implement principle of least privilege
- Audit all decryption operations
- Rate limit encryption/decryption endpoints
- Use service accounts for KMS access

❌ **DON'T:**
- Allow anonymous decryption
- Grant KMS access to client-side code
- Store decryption credentials client-side
- Allow users to decrypt other users' data
- Skip authorization checks
- Use user credentials for KMS operations

## Configuration

### Environment Variables

```bash
# GCP Project (same as Firebase)
GCP_PROJECT_ID=esta-tracker

# KMS Location (region)
KMS_LOCATION=us-central1

# KMS Key Ring (logical grouping)
KMS_KEYRING_ID=esta-tracker-keyring

# KMS Crypto Key (encryption key)
KMS_CRYPTO_KEY_ID=esta-tracker-key

# Key Version (optional, defaults to primary)
KMS_KEY_VERSION=
```

### IAM Roles Required

Service account needs these roles:
- `roles/cloudkms.cryptoKeyEncrypter` - Encrypt with KMS
- `roles/cloudkms.cryptoKeyDecrypter` - Decrypt with KMS
- `roles/cloudkms.viewer` - View key metadata

## Monitoring & Audit

### Cloud Audit Logs

All KMS operations are logged:
- Key access (encrypt/decrypt)
- Key creation/rotation
- IAM permission changes
- Key destruction

View logs in Google Cloud Console:
```
Logging → Logs Explorer → Filter: resource.type="cloudkms_cryptokey"
```

### Metrics to Monitor

1. **Encryption Operations** - Track volume and latency
2. **Decryption Operations** - Monitor for unusual patterns
3. **Key Access** - Alert on unauthorized access attempts
4. **Key Rotation** - Ensure automatic rotation is working
5. **Error Rates** - Track failed operations

### Alerting

Set up alerts for:
- Unauthorized KMS access attempts
- Sudden spike in decryption operations
- Key rotation failures
- IAM permission changes
- Error rate exceeding threshold

## Compliance

This KMS integration supports:

### HIPAA (Health Insurance Portability and Accountability Act)
- ✅ Encryption of PHI (Protected Health Information)
- ✅ Access controls and audit logging
- ✅ Secure key management
- ✅ Administrative safeguards

### SOC 2 Type II
- ✅ Data encryption at rest
- ✅ Key rotation capabilities
- ✅ Access controls and logging
- ✅ Security monitoring

### GDPR (General Data Protection Regulation)
- ✅ Encryption by design and default
- ✅ Right to be forgotten (destroy keys)
- ✅ Data minimization
- ✅ Pseudonymization through encryption

### Michigan ESTA
- ✅ Secure storage of employee medical records
- ✅ Audit trail for data access
- ✅ 3-year retention with secure disposal

## Performance

### Benchmarks

Approximate performance (on Cloud Run with 1 vCPU):
- Encryption (small data <1KB): 15-30ms
- Decryption (small data <1KB): 20-40ms
- Batch encrypt (10 fields): 100-150ms
- File encryption (1MB): 200-400ms

### Optimization Tips

1. **Batch Operations**: Encrypt multiple fields in one request
2. **Caching**: Cache public keys (don't fetch every time)
3. **Connection Pooling**: Reuse KMS client connections
4. **Regional Deployment**: Use KMS in same region as app
5. **Async Operations**: Use async/await for concurrent operations

## Cost

Google Cloud KMS Pricing:
- **Key Storage**: $0.06 per key version per month
- **Operations**: 
  - First 20,000 operations/month: FREE
  - Additional: $0.03 per 10,000 operations
  
**Estimated monthly cost** (for ESTA Tracker):
- 3 key versions (dev/staging/prod): $0.18/month
- 50,000 operations: $0.09
- **Total**: ~$0.30/month

HSM keys cost more:
- Key Storage: $1.00 per key version per month
- Operations: $0.12 per 10,000 operations

## Troubleshooting

See [KMS_SETUP.md](./KMS_SETUP.md) for detailed troubleshooting guide.

Common issues:
1. **Permission Denied**: Check IAM roles
2. **Key Not Found**: Verify key ring and key names
3. **API Not Enabled**: Enable Cloud KMS API
4. **Slow Performance**: Use same region for KMS and app

## Setup Instructions

See [KMS_SETUP.md](./KMS_SETUP.md) for complete setup guide.

Quick start:
1. Enable Cloud KMS API
2. Create key ring and crypto key
3. Configure IAM permissions
4. Set environment variables
5. Test with sample data

## Migration from Old Encryption

If migrating from the previous hybrid encryption (RSA-OAEP):

1. Keep old system running
2. Deploy KMS integration
3. Encrypt new data with KMS
4. Background job to re-encrypt old data
5. Phase out old system after migration complete

See migration script in `scripts/migrate-to-kms.ts` (to be created).

## Support

For KMS-related issues:
1. Check [KMS_SETUP.md](./KMS_SETUP.md) troubleshooting
2. Review [Google Cloud KMS docs](https://cloud.google.com/kms/docs)
3. Check [Cloud Status](https://status.cloud.google.com/)
4. File issue in repository with logs (sanitize sensitive data!)

## Additional Resources

- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)
- [Envelope Encryption Pattern](https://cloud.google.com/kms/docs/envelope-encryption)
- [Key Management Best Practices](https://cloud.google.com/kms/docs/key-management-best-practices)
- [NIST Cryptographic Standards](https://csrc.nist.gov/)
