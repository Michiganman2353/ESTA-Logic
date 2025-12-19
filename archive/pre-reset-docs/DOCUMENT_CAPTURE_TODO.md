# Document Capture Feature - TODO

This file tracks unimplemented features and future improvements for the document capture feature.

## High Priority

### 1. Rate Limiting Implementation

**File**: `functions/src/document-upload-function.ts` (lines 81-82)
**Status**: Commented placeholder
**Required for**: Production security

Implement distributed rate limiting using:

- **Option A**: Redis with sliding window algorithm
- **Option B**: Firestore with timestamp tracking
- **Option C**: Firebase App Check integration

**Example Implementation**:

```typescript
// Redis-based rate limiting
const uploadCount = await redis.incr(`upload:${userId}:${date}`);
await redis.expire(`upload:${userId}:${date}`, 86400); // 24 hours

if (uploadCount > MAX_UPLOADS_PER_DAY) {
  throw new Error('Rate limit exceeded');
}
```

### 2. Post-Upload Processing Pipeline

**File**: `functions/src/document-upload-function.ts` (lines 152-157)
**Status**: TODO comments only
**Required for**: Production security

Implement:

1. Server-side file validation (magic bytes check)
2. Antivirus scanning
3. Firestore metadata updates
4. User notifications
5. Audit logging

**Dependencies**: Needs antivirus integration (see #3)

### 3. Antivirus Integration

**File**: `functions/src/document-upload/antivirus-scan.ts`
**Status**: Placeholder implementations
**Required for**: Production security

**ClamAV Integration**:

- Install ClamAV daemon
- Implement TCP socket communication
- Parse INSTREAM protocol responses
- Handle scan timeouts

**VirusTotal Integration**:

- Implement file upload API
- Poll for scan results
- Parse multi-engine detections
- Handle API rate limits

## Medium Priority

### 4. OpenCV Auto-Crop

**File**: `apps/frontend/src/features/document-capture/document-processor.ts` (line 290)
**Status**: Stub returning original image
**Impact**: Feature advertised but not working

Implement document cropping:

```typescript
function cropToDocument(src: any, corners: { x: number; y: number }[]): any {
  if (!window.cv || corners.length !== 4) return src;

  // Calculate bounding rectangle
  const rect = window.cv.boundingRect(corners);

  // Extract ROI
  const roi = src.roi(rect);

  return roi;
}
```

### 5. Contrast Enhancement

**File**: `apps/frontend/src/features/document-capture/document-processor.ts` (line 373)
**Status**: Stub returning original image
**Impact**: Feature advertised but not working

Implement contrast adjustment:

```typescript
function enhanceContrast(src: any): any {
  if (!window.cv) return src;

  // Convert to grayscale
  const gray = new window.cv.Mat();
  window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);

  // Apply histogram equalization
  const enhanced = new window.cv.Mat();
  window.cv.equalizeHist(gray, enhanced);

  // Convert back to RGBA
  window.cv.cvtColor(enhanced, enhanced, window.cv.COLOR_GRAY2RGBA);

  gray.delete();
  return enhanced;
}
```

### 6. TypeScript Declarations for OpenCV

**File**: `apps/frontend/src/features/document-capture/document-processor.ts`
**Status**: Using `any` types
**Impact**: Poor IntelliSense, type safety

Create `opencv.d.ts` with proper type declarations:

```typescript
declare global {
  interface Window {
    cv: {
      Mat: new () => Mat;
      matFromImageData: (data: ImageData) => Mat;
      // ... etc
    };
  }
}

interface Mat {
  rows: number;
  cols: number;
  delete(): void;
  roi(rect: Rect): Mat;
  // ... etc
}
```

## Low Priority

### 7. Magic Byte Tests in JSDOM

**File**: `apps/frontend/src/features/document-capture/secure-uploader.test.ts`
**Status**: 5 tests skipped
**Impact**: Reduced test coverage

Current issue: `File.prototype.arrayBuffer()` not available in test environment.

**Solutions**:

- Mock arrayBuffer method in test setup
- Use happy-dom instead of jsdom
- Run tests in actual browser (Playwright)

### 8. Enhanced Error Messages

Add user-friendly error messages for:

- Network timeouts during upload
- Storage quota exceeded
- Unsupported file types
- Camera permission denied on specific browsers

### 9. Progress Persistence

Store upload state in localStorage/IndexedDB to:

- Resume interrupted uploads
- Show upload history
- Retry failed uploads

### 10. Compression Options

Add client-side image compression:

- Quality slider
- Resolution options
- Format selection (JPEG vs WebP vs PNG)

## Infrastructure

### 11. E2E Tests

**Status**: Not implemented
**Required for**: Regression prevention

Create E2E tests for:

- Desktop camera capture flow
- iOS Safari file input flow
- Android WebView flow
- Upload with retry
- Permission denial handling

### 12. Performance Monitoring

Add metrics for:

- Camera start time
- Image processing duration
- Upload speed
- Error rates

### 13. Documentation

- Add troubleshooting guide for common issues
- Create video tutorials
- Add accessibility documentation
- Document browser support matrix

## Contributing

To implement any of these features:

1. Check if the feature is already claimed in GitHub Issues
2. Create an issue if it doesn't exist
3. Implement the feature following existing patterns
4. Add tests for the new functionality
5. Update documentation
6. Submit a PR referencing the issue

## Priority Matrix

```
High Impact + High Effort:
- Rate Limiting
- Post-Upload Processing
- Antivirus Integration

High Impact + Low Effort:
- Enhanced Error Messages
- Progress Persistence

Low Impact + High Effort:
- OpenCV Auto-Crop
- TypeScript Declarations

Low Impact + Low Effort:
- Compression Options
- Documentation Updates
```
