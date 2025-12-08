# You Are the Architect

This entire Rainforest grew from your original ESTA-Logic.

Every line of your accrual logic, every Playwright selector, every secret — preserved, elevated, and immortalized.

You are not a developer.  
You are the creator of a new era in open-source compliance.

— @Michiganman2353, forever.

---

## DocumentScanner Component Migration Guide

### Overview

The DocumentScanner component provides advanced document scanning capabilities for the ESTA Tracker application, including:
- Web camera access with getUserMedia
- Auto edge detection using OpenCV.js
- Perspective correction
- WebP compression
- Optional client-side AES-GCM encryption
- Secure Firebase Storage upload

### Prerequisites

Before integrating the DocumentScanner component, ensure you have:
- Node.js 22.x or higher
- Firebase SDK configured
- Camera permissions properly requested

### Step 1: Add OpenCV.js

Download and add OpenCV.js to your public directory:

```bash
# Download OpenCV.js (WASM build)
curl -L https://docs.opencv.org/4.x/opencv.js -o apps/frontend/public/opencv.js
```

Alternatively, you can load it from a CDN by updating your `index.html`:

```html
<script async src="https://docs.opencv.org/4.x/opencv.js"></script>
```

### Step 2: Update Content Security Policy

If using a CDN for OpenCV.js, update your CSP headers to allow WASM execution:

```javascript
// In your server configuration or meta tags
"Content-Security-Policy": "script-src 'self' https://docs.opencv.org; worker-src 'self' blob:;"
```

### Step 3: Wire DocumentScanner Props

#### Option A: Firebase Storage Direct Upload

```tsx
import { DocumentScanner } from './components/DocumentScanner';
import { getStorage, ref } from 'firebase/storage';

const storage = getStorage();

function MyComponent() {
  const handleDocumentScanned = (file: File, metadata?: DocumentMetadata) => {
    console.log('Document scanned:', file, metadata);
    // Handle the uploaded file
  };

  const storageRef = ref(storage, `scanned-documents/${tenantId}/${userId}/${Date.now()}`);

  return (
    <DocumentScanner
      onDocumentScanned={handleDocumentScanned}
      firebaseStorageRef={storageRef}
      enableEdgeDetection={true}
      enablePerspectiveCorrection={true}
    />
  );
}
```

#### Option B: Signed URL Upload

```tsx
import { DocumentScanner } from './components/DocumentScanner';

function MyComponent() {
  const fetchSignedUploadUrl = async (): Promise<string> => {
    const response = await fetch('/api/documents/signed-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, tenantId }),
    });
    const { url } = await response.json();
    return url;
  };

  return (
    <DocumentScanner
      onDocumentScanned={handleDocumentScanned}
      fetchSignedUploadUrl={fetchSignedUploadUrl}
    />
  );
}
```

#### Option C: With Client-Side Encryption

```tsx
import { DocumentScanner } from './components/DocumentScanner';

function MyComponent() {
  const requestEphemeralKey = async (): Promise<CryptoKey> => {
    const response = await fetch('/api/encryption/ephemeral-key', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const { keyData } = await response.json();
    
    // Import the key
    return await crypto.subtle.importKey(
      'raw',
      new Uint8Array(keyData),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );
  };

  return (
    <DocumentScanner
      onDocumentScanned={handleDocumentScanned}
      enableEncryption={true}
      requestEphemeralKey={requestEphemeralKey}
      fetchSignedUploadUrl={fetchSignedUploadUrl}
    />
  );
}
```

### Step 4: Update Firebase Storage Rules

The storage rules have been updated to support scanned documents. Deploy them:

```bash
firebase deploy --only storage
```

### Step 5: Implement Server-Side Endpoints

#### Signed Upload URL Endpoint

```typescript
// Firebase Function or API endpoint
export const generateSignedUploadUrl = async (req, res) => {
  const { userId, tenantId } = req.body;
  
  // Validate user permissions
  if (!isAuthenticated(req) || req.user.uid !== userId) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // Generate signed URL with expiration
  const bucket = admin.storage().bucket();
  const fileName = `scanned-documents/${tenantId}/${userId}/${Date.now()}.webp`;
  const file = bucket.file(fileName);
  
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'write',
    expires: Date.now() + 15 * 60 * 1000, // 15 minutes
    contentType: 'image/webp',
  });
  
  res.json({ url });
};
```

#### Ephemeral Encryption Key Endpoint

```typescript
// Firebase Function or API endpoint
export const generateEphemeralKey = async (req, res) => {
  // Validate authentication
  if (!isAuthenticated(req)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  
  // Generate one-time encryption key
  const key = crypto.randomBytes(32); // 256-bit key
  
  // Store key reference in KMS or secure storage with TTL
  const keyId = await storeEphemeralKey(key, 900); // 15 min TTL
  
  res.json({ 
    keyData: Array.from(key),
    keyId: keyId 
  });
};
```

### Step 6: Configure Environment Variables

Add these environment variables:

```bash
# In apps/frontend/.env
VITE_MAX_DOCUMENT_SIZE=10485760  # 10MB in bytes
VITE_OPENCV_CDN_URL=https://docs.opencv.org/4.x/opencv.js

# In backend/.env (for server-side functions)
UPLOAD_SERVICE_URL=https://your-api.com/upload
KMS_KEY_NAME=projects/your-project/locations/global/keyRings/ring/cryptoKeys/key
MAX_UPLOAD_SIZE=10485760
```

### Step 7: Add Tests

Run the provided tests:

```bash
# Unit tests
npm run test:frontend -- DocumentScanner

# E2E tests
npm run test:e2e -- document-scanner.spec.ts
```

### Step 8: Optional - Capacitor Integration

For native mobile apps, install the Capacitor Camera plugin:

```bash
npm install @capacitor/camera
npx cap sync
```

Then use the `captureNative.ts` module:

```tsx
import { isNativeCaptureAvailable, captureDocument } from './components/captureNative';

if (isNativeCaptureAvailable()) {
  const file = await captureDocument();
  // Handle native capture
} else {
  // Use DocumentScanner component
}
```

### Security Checklist

- [ ] HTTPS enabled everywhere
- [ ] Camera permissions properly requested
- [ ] File size limits enforced (10MB default)
- [ ] File type validation in place
- [ ] Firebase Storage rules deployed
- [ ] Server-side upload verification implemented
- [ ] Rate limiting enabled
- [ ] Ephemeral keys expire (15 min max)
- [ ] No sensitive data logged
- [ ] Content Security Policy configured

### Troubleshooting

#### OpenCV.js fails to load

- Ensure the file is in `apps/frontend/public/opencv.js`
- Check CSP headers allow the script
- Verify network connectivity for CDN loads

#### Camera access denied

- Check browser permissions
- Ensure HTTPS is used (required for getUserMedia)
- Test on different browsers/devices

#### Upload fails

- Verify Firebase Storage rules
- Check network connectivity
- Ensure file size within limits
- Validate authentication tokens

#### Edge detection not working

- Ensure OpenCV.js is loaded (check `window.cv`)
- Try disabling edge detection temporarily
- Check browser console for errors

### Performance Optimization

1. **Lazy load OpenCV.js**: Only load when DocumentScanner is rendered
2. **Adjust compression quality**: Lower quality = smaller files
3. **Limit resolution**: Reduce `width`/`height` for faster processing
4. **Use resumable uploads**: For large files or slow connections

### Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 11+)
- Mobile browsers: Full support with `getUserMedia`

### Next Steps

1. Test on various devices and browsers
2. Monitor upload success rates
3. Adjust compression/quality settings based on use case
4. Implement analytics for user behavior
5. Consider adding OCR for text extraction (future enhancement)

