# ESTA Tracker API Endpoints

Comprehensive documentation for all API endpoints in the ESTA Tracker application.

## Table of Contents

- [Encryption Endpoints](#encryption-endpoints)
  - [KMS Encrypt](#kms-encrypt)
  - [KMS Decrypt](#kms-decrypt)
  - [Secure Decrypt (Legacy)](#secure-decrypt-legacy)
  - [Edge Encrypt](#edge-encrypt)
- [Background Functions](#background-functions)
- [Security](#security)
- [Rate Limiting](#rate-limiting)

## Encryption Endpoints

### KMS Encrypt

Encrypt data using Google Cloud KMS-backed hybrid encryption.

**Endpoint**: `POST /api/kms/encrypt`  
**Runtime**: Node.js Serverless  
**Authentication**: Optional (recommended for production)

**Request Body**:

```json
{
  "data": "sensitive information"
}
```

Or for batch encryption:

```json
{
  "fields": {
    "ssn": "123-45-6789",
    "address": "123 Main St",
    "phone": "555-1234"
  }
}
```

**Response**:

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

For batch:

```json
{
  "success": true,
  "encrypted": {
    "ssn": {
      "encryptedData": "base64...",
      "wrappedKey": "base64...",
      "iv": "base64...",
      "authTag": "base64..."
    },
    "address": { ... },
    "phone": { ... }
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": "Encryption failed",
  "message": "Error details"
}
```

**Security Notes**:
- Uses AES-256-GCM for data encryption
- AES key wrapped with Google Cloud KMS
- Each encryption generates unique IV
- Authentication tag ensures data integrity
- Keys never stored in plaintext

**Example Usage**:

```typescript
// Encrypt employee SSN
const response = await fetch('/api/kms/encrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ data: '123-45-6789' })
});

const { encrypted } = await response.json();

// Store in database
await db.collection('employees').doc(id).update({ ssn: encrypted });
```

---

### KMS Decrypt

Decrypt data encrypted with KMS-backed encryption.

**Endpoint**: `POST /api/kms/decrypt`  
**Runtime**: Node.js Serverless  
**Authentication**: **REQUIRED** (must implement)

**Request Body**:

```json
{
  "payload": {
    "encryptedData": "base64...",
    "wrappedKey": "base64...",
    "iv": "base64...",
    "authTag": "base64..."
  }
}
```

Or for batch decryption:

```json
{
  "fields": {
    "ssn": {
      "encryptedData": "base64...",
      "wrappedKey": "base64...",
      "iv": "base64...",
      "authTag": "base64..."
    },
    "address": { ... }
  }
}
```

**Response**:

```json
{
  "success": true,
  "decrypted": "123-45-6789"
}
```

For batch:

```json
{
  "success": true,
  "decrypted": {
    "ssn": "123-45-6789",
    "address": "123 Main St"
  }
}
```

**Error Response**:

```json
{
  "success": false,
  "error": "Decryption failed",
  "message": "Error details (development only)"
}
```

**Security Notes**:
- **MUST** add authentication before production use
- AES key unwrapped using Google Cloud KMS
- Private keys never leave KMS hardware
- All operations logged in Cloud Audit Logs
- Supports role-based access control via IAM

**Example Usage**:

```typescript
// Retrieve encrypted data
const employee = await db.collection('employees').doc(id).get();

// Decrypt SSN
const response = await fetch('/api/kms/decrypt', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`
  },
  body: JSON.stringify({ payload: employee.data().ssn })
});

const { decrypted } = await response.json();
console.log(decrypted); // "123-45-6789"
```

---

### Secure Decrypt (Legacy)

**UPDATED**: Now uses KMS instead of accepting private keys.

**Endpoint**: `POST /api/secure/decrypt`  
**Runtime**: Node.js Serverless  
**Authentication**: **REQUIRED**

**Migration Note**: This endpoint previously accepted a `privateKey` parameter. It now uses KMS for secure key unwrapping. Update your code to remove `privateKey` from requests.

**Old Format** (deprecated):
```json
{
  "payload": { ... },
  "privateKey": "-----BEGIN PRIVATE KEY-----..."  // ❌ NO LONGER ACCEPTED
}
```

**New Format**:
```json
{
  "payload": {
    "encryptedData": "base64...",
    "wrappedKey": "base64...",      // or "encryptedAESKey" for backward compatibility
    "iv": "base64...",
    "authTag": "base64..."
  }
}
```

**Backward Compatibility**: Supports both `wrappedKey` (new) and `encryptedAESKey` (old) field names during migration period.

---

### Edge Encrypt

Client-side hybrid encryption using Web Crypto API.

**Endpoint**: `POST /api/edge/encrypt`  
**Runtime**: Edge (Vercel Edge Functions)  
**Authentication**: Not required

**Request Body**:

```json
{
  "data": "sensitive information",
  "publicKey": {
    "kty": "RSA",
    "n": "...",
    "e": "AQAB"
  }
}
```

**Response**:

```json
{
  "success": true,
  "encrypted": {
    "encryptedData": "base64...",
    "encryptedAESKey": "base64...",
    "iv": "base64..."
  }
}
```

**Health Check**: `GET /api/edge/encrypt`

```json
{
  "status": "ok",
  "runtime": "edge",
  "service": "encryption",
  "timestamp": "2025-01-01T00:00:00.000Z"
}
```

**Security Notes**:
- Runs on Edge network for low latency
- Uses Web Crypto API (browser-standard)
- Client provides public key
- No private keys on server
- Rate limited to prevent abuse

---

## Background Functions

See [Background Functions README](./README.md) for details on:
- CSV Import
- Accrual Recalculation
- Bulk Employee Update
- PTO Validation

---

## Security

### Authentication

**Production Requirements**:
1. All decrypt endpoints MUST require authentication
2. Implement JWT token validation
3. Use Firebase Auth for user authentication
4. Check user roles before allowing decryption

**Example Middleware**:

```typescript
async function authenticate(req: VercelRequest, res: VercelResponse, next: () => void) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

### Authorization

**Role-Based Access**:
- **Employers**: Can decrypt all employee data in their tenant
- **Managers**: Can decrypt data for their team members
- **Employees**: Can decrypt only their own data
- **Admins**: Can decrypt all data (with audit logging)

**Example Authorization**:

```typescript
function authorize(roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: () => void) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
router.post('/decrypt', 
  authenticate,
  authorize(['employer', 'admin']),
  decryptHandler
);
```

### Audit Logging

All encryption/decryption operations should be logged:

```typescript
await db.collection('auditLogs').add({
  action: 'decrypt',
  userId: user.uid,
  tenantId: user.tenantId,
  resourceType: 'employee',
  resourceId: employeeId,
  fieldName: 'ssn',
  timestamp: admin.firestore.FieldValue.serverTimestamp(),
  ipAddress: req.ip,
  userAgent: req.headers['user-agent']
});
```

### Data Protection

**Sensitive Fields** (always encrypt):
- Social Security Numbers (SSN)
- Tax IDs (EIN)
- Bank account numbers
- Addresses (if required)
- Phone numbers (if required)
- Medical information
- Salary/compensation data

**Non-Sensitive Fields** (don't encrypt):
- Firebase Auth emails
- Employee names (for search)
- Company names
- Timestamps
- Document IDs
- Status fields

---

## Rate Limiting

### Recommended Limits

**Encryption Endpoints**:
- Public encrypt: 100 requests/minute per IP
- Authenticated encrypt: 500 requests/minute per user

**Decryption Endpoints**:
- Authenticated decrypt: 100 requests/minute per user
- Admin decrypt: 1000 requests/minute per user

### Implementation

```typescript
import rateLimit from 'express-rate-limit';

const encryptLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: 'Too many encryption requests, please try again later',
});

router.post('/kms/encrypt', encryptLimiter, encryptHandler);
```

---

## KMS Configuration

### Required Environment Variables

```bash
# Google Cloud Project
GCP_PROJECT_ID=esta-tracker

# KMS Location (region)
KMS_LOCATION=us-central1

# KMS Key Ring
KMS_KEYRING_ID=esta-tracker-keyring

# KMS Crypto Key
KMS_CRYPTO_KEY_ID=esta-tracker-key

# Optional: Specific key version
KMS_KEY_VERSION=
```

### IAM Permissions

Service account needs:
- `roles/cloudkms.cryptoKeyEncrypter`
- `roles/cloudkms.cryptoKeyDecrypter`
- `roles/cloudkms.viewer`

### Setup

See [KMS_SETUP.md](../KMS_SETUP.md) for complete setup instructions.

---

## Integration Examples

### Employee Registration with Encrypted PII

```typescript
// Frontend: Encrypt sensitive data
const encryptResponse = await fetch('/api/kms/encrypt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fields: {
      ssn: employee.ssn,
      address: employee.address,
      phone: employee.phone
    }
  })
});

const { encrypted } = await encryptResponse.json();

// Store in Firestore
await db.collection('employees').add({
  firstName: employee.firstName,
  lastName: employee.lastName,
  email: employee.email,
  // Encrypted fields
  encryptedFields: encrypted,
  createdAt: new Date()
});
```

### Retrieving and Decrypting Employee Data

```typescript
// Backend: Get employee with decryption
router.get('/employees/:id', 
  authenticate,
  authorize(['employer', 'admin']),
  async (req, res) => {
    const employee = await db.collection('employees').doc(req.params.id).get();
    const data = employee.data();
    
    // Decrypt sensitive fields
    const decryptResponse = await fetch('/api/kms/decrypt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: data.encryptedFields })
    });
    
    const { decrypted } = await decryptResponse.json();
    
    // Merge with non-sensitive data
    res.json({
      ...data,
      ...decrypted
    });
  }
);
```

### Using Middleware for Automatic Encryption

```typescript
import { encryptFieldsMiddleware, decryptFieldsMiddleware } from './middleware/encryption';

// Auto-encrypt on POST
router.post('/employees',
  authenticate,
  encryptFieldsMiddleware(['ssn', 'address', 'phone']),
  async (req, res) => {
    await db.collection('employees').add(req.body);
    res.json({ success: true });
  }
);

// Auto-decrypt on GET
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

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 403 | Forbidden - Insufficient permissions |
| 405 | Method Not Allowed - Wrong HTTP method |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error - Encryption/decryption failure |

---

## Monitoring

### Metrics to Track

1. **Encryption Operations**
   - Total count
   - Success rate
   - Average latency
   - Error types

2. **Decryption Operations**
   - Total count
   - Success rate
   - Average latency
   - Unauthorized attempts

3. **KMS Operations**
   - Key wrap/unwrap count
   - KMS API latency
   - KMS errors
   - Key version usage

### Logging

```typescript
// Example structured logging
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  action: 'kms_encrypt',
  userId: user.uid,
  tenantId: user.tenantId,
  duration: endTime - startTime,
  success: true,
  // Never log sensitive data or encryption keys!
}));
```

---

## Support

- [KMS Integration Documentation](../KMS_INTEGRATION.md)
- [KMS Setup Guide](../KMS_SETUP.md)
- [Hybrid Encryption Implementation](../HYBRID_ENCRYPTION_IMPLEMENTATION.md)
- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)
