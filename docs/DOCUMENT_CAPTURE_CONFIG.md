# Document Capture Feature - Configuration Guide

## Overview

The document capture feature provides production-grade document scanning and upload capabilities with security hardening, mobile fallbacks, and comprehensive validation.

## Client-Side Configuration

### Environment Variables

Add these to your `.env` file or Vercel environment variables:

```bash
# Document upload endpoint (optional)
VITE_DOCUMENT_UPLOAD_ENDPOINT=https://your-api.com/api/generate-upload-url

# OpenCV.js URL (default: /opencv.js)
VITE_OPENCV_URL=/opencv.js
```

### OpenCV.js Setup

1. Download OpenCV.js from: https://docs.opencv.org/4.x/opencv.js
2. Place `opencv.js` in your `public/` directory
3. Alternatively, use a CDN:

```typescript
import { loadOpenCV } from '@/features/document-capture';

await loadOpenCV('https://docs.opencv.org/4.x/opencv.js');
```

### Firebase Storage Setup

Ensure Firebase is initialized in your app:

```typescript
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
```

## Backend Configuration

### Environment Variables

Add to your Cloud Functions environment:

```bash
# Signed URL secret (32+ bytes)
DOCUMENT_UPLOAD_SIGNING_SECRET=your-32-byte-secret-here

# Antivirus scanner: 'mock', 'clamav', or 'virustotal'
ANTIVIRUS_SCANNER=mock

# VirusTotal API key (if using virustotal)
VIRUSTOTAL_API_KEY=your-api-key

# ClamAV settings (if using clamav)
CLAMAV_HOST=localhost
CLAMAV_PORT=3310

# Upload limits
DOCUMENT_MAX_FILE_SIZE=10485760  # 10MB
DOCUMENT_ALLOWED_MIME_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Signed URL TTL (minutes)
DOCUMENT_SIGNED_URL_TTL=15

# Audit logging
DOCUMENT_ENABLE_AUDIT_LOG=true
DOCUMENT_AUDIT_LOG_COLLECTION=audit_logs
```

### Generate Signing Secret

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Firebase Storage Rules

The storage rules have been updated to include a new `/documents/{tenantId}/{userId}/` path with:
- Content type restrictions (JPEG, PNG, WebP, PDF only)
- Size limit (10MB max)
- Authentication required
- Owner-only write access
- Employer read access for their tenant

## Cloud Functions Setup

### Deploy Upload Function

1. The `generateUploadUrl` function is defined in `functions/src/document-upload-function.ts`
2. Export it from `functions/src/index.ts`:

```typescript
export { generateUploadUrl, onDocumentUploaded } from './document-upload-function';
```

3. Deploy:

```bash
firebase deploy --only functions:generateUploadUrl,functions:onDocumentUploaded
```

### Configure CORS

The function includes CORS headers for cross-origin requests. Adjust as needed:

```typescript
res.set('Access-Control-Allow-Origin', 'https://your-domain.com');
```

## Antivirus Integration

### Option 1: Mock Scanner (Development)

Default configuration. No additional setup needed.

```bash
ANTIVIRUS_SCANNER=mock
```

### Option 2: ClamAV (Self-Hosted)

1. Install ClamAV:
```bash
# Ubuntu/Debian
sudo apt-get install clamav clamav-daemon

# macOS
brew install clamav
```

2. Start ClamAV daemon:
```bash
sudo systemctl start clamav-daemon
```

3. Configure:
```bash
ANTIVIRUS_SCANNER=clamav
CLAMAV_HOST=localhost
CLAMAV_PORT=3310
```

### Option 3: VirusTotal (Cloud)

1. Get API key: https://www.virustotal.com/gui/my-apikey
2. Configure:
```bash
ANTIVIRUS_SCANNER=virustotal
VIRUSTOTAL_API_KEY=your-api-key-here
```

Note: VirusTotal has rate limits on free tier.

## Rate Limiting

Implement rate limiting in your Cloud Function or use Firebase App Check:

### Firebase App Check

1. Enable in Firebase Console
2. Add to your app:

```typescript
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
  isTokenAutoRefreshEnabled: true,
});
```

### Custom Rate Limiting

Use Redis or Firestore to track upload attempts:

```typescript
// In Cloud Function
const uploadCount = await redis.incr(`upload:${userId}:${date}`);
if (uploadCount > MAX_UPLOADS_PER_DAY) {
  throw new Error('Rate limit exceeded');
}
```

## Monitoring

### Audit Logs

Query audit logs from Firestore:

```typescript
import { queryAuditLogs } from './document-upload';

const logs = await queryAuditLogs({
  userId: 'user123',
  eventType: 'upload',
  startTime: Date.now() - 24 * 60 * 60 * 1000, // Last 24 hours
  limit: 100,
});
```

### Cloud Monitoring

Set up alerts for:
- Failed uploads
- Virus detections
- Rate limit violations
- Authentication failures

## Security Checklist

- [ ] Generated and configured signing secret
- [ ] Updated Firebase Storage rules
- [ ] Configured CORS restrictions
- [ ] Enabled antivirus scanning
- [ ] Implemented rate limiting
- [ ] Set up audit logging
- [ ] Configured monitoring alerts
- [ ] Tested on all target platforms (desktop, iOS, Android)
- [ ] Reviewed and tested permission handling
- [ ] Verified HTTPS enforcement

## Troubleshooting

### Camera Permission Denied

Safari/iOS: Users must manually enable camera in Settings > Safari > Camera

Chrome: Check site settings in chrome://settings/content/camera

### Upload Fails with 413 (Payload Too Large)

Increase Cloud Function or Cloud Run memory limits:

```json
{
  "functions": {
    "generateUploadUrl": {
      "memory": "512MB"
    }
  }
}
```

### OpenCV.js Not Loading

1. Verify `opencv.js` is in `public/` directory
2. Check browser console for 404 errors
3. Try using CDN URL instead
4. Ensure WASM is supported in browser

### Antivirus Scan Timeouts

Increase Cloud Function timeout:

```json
{
  "functions": {
    "onDocumentUploaded": {
      "timeout": "300s"
    }
  }
}
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Firebase documentation
3. Check OpenCV.js documentation
4. Review security best practices in SECURITY.md
