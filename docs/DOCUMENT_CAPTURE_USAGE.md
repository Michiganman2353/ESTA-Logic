# Document Capture Feature - Usage Guide

## Overview

The document capture feature provides a unified interface for capturing and uploading documents across desktop and mobile platforms with automatic fallbacks and security features.

## Basic Usage

### Simple Document Capture

```typescript
import { CameraView } from '@/features/document-capture';

function MyComponent() {
  const handleUploadComplete = (result) => {
    if (result.success) {
      console.log('Upload successful:', result.downloadUrl);
    } else {
      console.error('Upload failed:', result.error);
    }
  };

  return (
    <CameraView
      onUploadComplete={handleUploadComplete}
      firebaseStorageRef={storageRef}
      storagePath="documents"
    />
  );
}
```

### Using Signed URLs

For enhanced security, use signed URLs instead of direct Firebase uploads:

```typescript
import { CameraView } from '@/features/document-capture';

function SecureUpload() {
  const authToken = useAuthToken(); // Your auth token

  return (
    <CameraView
      onUploadComplete={handleUploadComplete}
      signedUrlEndpoint="https://your-api.com/api/generate-upload-url"
      authToken={authToken}
      uploadOptions={{
        maxFileSize: 10 * 1024 * 1024,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      }}
    />
  );
}
```

## Advanced Usage

### Custom Camera Controller

For more control over the camera:

```typescript
import { CameraController, processDocument } from '@/features/document-capture';
import { useRef, useEffect } from 'react';

function CustomCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [controller] = useState(() => new CameraController({
    preferredFacingMode: 'environment',
    idealWidth: 1920,
    idealHeight: 1080,
  }));

  useEffect(() => {
    if (videoRef.current) {
      controller.startCamera(videoRef.current);
    }

    return () => {
      controller.stopCamera();
    };
  }, []);

  const handleCapture = async () => {
    const blob = await controller.captureFrame();
    
    // Process with OpenCV
    const processed = await processDocument(blob, {
      enableEdgeDetection: true,
      enableAutoCrop: true,
      enableDeskew: true,
      enableContrast: true,
    });

    console.log('Processed document:', processed);
  };

  return (
    <div>
      <video ref={videoRef} autoPlay playsInline />
      <button onClick={handleCapture}>Capture</button>
    </div>
  );
}
```

### Device Selection

List and switch between available cameras:

```typescript
import { CameraController } from '@/features/document-capture';

async function selectCamera() {
  const controller = new CameraController();
  const devices = await controller.enumerateDevices();

  // Display device list to user
  devices.forEach(device => {
    console.log(`${device.label} (${device.facingMode || 'unknown'})`);
  });

  // Switch to specific device
  if (devices.length > 0) {
    await controller.switchCamera(devices[0].deviceId);
  }
}
```

### Permission Handling

Handle permissions explicitly:

```typescript
import {
  CameraPermissions,
  getPermissionErrorMessage,
} from '@/features/document-capture';

async function checkCameraPermission() {
  const permissions = new CameraPermissions();

  // Check current status
  const status = await permissions.checkPermission();
  
  if (status.denied) {
    alert(getPermissionErrorMessage(status));
    return;
  }

  if (status.prompt) {
    // Request permission
    const newStatus = await permissions.requestPermission();
    
    if (newStatus.granted) {
      console.log('Permission granted!');
    }
  }
}
```

### Mobile Fallback

Handle mobile-specific scenarios:

```typescript
import {
  needsMobileFallback,
  getRecommendedCaptureStrategy,
  processImageFile,
} from '@/features/document-capture';

function MobileCapture() {
  const strategy = getRecommendedCaptureStrategy();

  if (strategy === 'fileInput') {
    // Use file input for iOS Safari
    return (
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            const processed = await processImageFile(file);
            console.log('Processed:', processed);
          }
        }}
      />
    );
  }

  // Use CameraView for other platforms
  return <CameraView {...props} />;
}
```

### Document Processing Pipeline

Process images with OpenCV:

```typescript
import {
  loadOpenCV,
  processDocument,
  isOpenCVReady,
} from '@/features/document-capture';

async function processImage(imageBlob: Blob) {
  // Load OpenCV if not already loaded
  if (!isOpenCVReady()) {
    await loadOpenCV('/opencv.js');
  }

  // Process with full pipeline
  const result = await processDocument(imageBlob, {
    enableEdgeDetection: true,
    enableAutoCrop: true,
    enableDeskew: true,
    enableContrast: true,
    targetWidth: 1920,
    targetHeight: 1080,
  });

  console.log('Processing steps:', result.processingSteps);
  console.log('Detected corners:', result.detectedCorners);

  return result.blob;
}
```

### Secure Upload with Progress

Track upload progress:

```typescript
import { uploadWithSignedUrl } from '@/features/document-capture';

async function uploadWithProgress(file: File) {
  const result = await uploadWithSignedUrl(
    file,
    '/api/generate-upload-url',
    authToken,
    {
      onProgress: (progress) => {
        console.log(`${progress.stage}: ${progress.percentage}%`);
        updateProgressBar(progress.percentage);
      },
      maxRetries: 3,
      retryDelay: 1000,
      metadata: {
        documentType: 'medical-note',
        userId: 'user123',
      },
    }
  );

  if (result.success) {
    console.log('Upload complete:', result.path);
  } else {
    console.error('Upload failed:', result.error);
  }
}
```

### Client-Side Validation

Validate files before upload:

```typescript
import { validateFile, validateMagicBytes } from '@/features/document-capture';

async function validateBeforeUpload(file: File) {
  // Basic validation
  const basicCheck = validateFile(file, {
    maxFileSize: 10 * 1024 * 1024,
    allowedMimeTypes: ['image/jpeg', 'image/png'],
  });

  if (!basicCheck.valid) {
    alert(basicCheck.error);
    return false;
  }

  // Magic byte validation
  const magicByteCheck = await validateMagicBytes(file);

  if (!magicByteCheck.valid) {
    alert('File type verification failed: ' + magicByteCheck.error);
    return false;
  }

  return true;
}
```

## Integration Examples

### With Existing Form

```typescript
function DocumentForm() {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);

  return (
    <form onSubmit={handleSubmit}>
      <label>Upload Document</label>
      
      {documentUrl ? (
        <div>
          <img src={documentUrl} alt="Captured document" />
          <button onClick={() => setDocumentUrl(null)}>Retake</button>
        </div>
      ) : showCamera ? (
        <CameraView
          onUploadComplete={(result) => {
            if (result.success) {
              setDocumentUrl(result.downloadUrl);
              setShowCamera(false);
            }
          }}
          onCancel={() => setShowCamera(false)}
        />
      ) : (
        <button type="button" onClick={() => setShowCamera(true)}>
          Capture Document
        </button>
      )}

      <button type="submit">Submit Form</button>
    </form>
  );
}
```

### With React Hook Form

```typescript
import { useForm } from 'react-hook-form';

function DocumentFormWithValidation() {
  const { register, handleSubmit, setValue } = useForm();

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <CameraView
        onUploadComplete={(result) => {
          setValue('documentUrl', result.downloadUrl);
        }}
      />
      
      <input
        type="hidden"
        {...register('documentUrl', { required: true })}
      />
      
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Platform-Specific Notes

### iOS Safari

- Camera permissions require user interaction before request
- File input with `capture` attribute often provides better UX
- EXIF orientation is automatically corrected

### Android WebView

- Some WebViews have limited getUserMedia support
- Fallback to file input automatically detected
- Test in target WebView environment

### Desktop Chrome/Firefox

- Full getUserMedia support
- Multiple camera selection available
- Best performance for OpenCV processing

## Performance Tips

1. **Lazy load OpenCV.js**: Only load when needed
2. **Resize images**: Use targetWidth/targetHeight options
3. **Disable processing steps**: Turn off features you don't need
4. **Use WebP**: More efficient than JPEG for web
5. **Implement caching**: Cache OpenCV.js and processed results

## Security Best Practices

1. **Always use HTTPS**: Required for getUserMedia
2. **Validate on backend**: Don't trust client-side validation alone
3. **Use signed URLs**: Prevent unauthorized uploads
4. **Implement rate limiting**: Prevent abuse
5. **Scan for viruses**: Use antivirus integration
6. **Audit uploads**: Log all upload events

## Troubleshooting

### Camera not starting

Check:
- HTTPS enabled (required for getUserMedia)
- User granted permission
- Camera not in use by another app
- Browser supports getUserMedia

### Processing too slow

Try:
- Reduce image resolution
- Disable unneeded processing steps
- Use Web Workers for heavy processing
- Consider server-side processing for complex operations

### Upload fails

Check:
- File size within limits
- MIME type allowed
- Network connectivity
- Authentication token valid
- Storage rules configured correctly

## API Reference

See TypeScript types in the module files for complete API documentation:

- `camera.controller.ts` - Camera control
- `camera.view.tsx` - React component
- `document-processor.ts` - Image processing
- `secure-uploader.ts` - Upload functions
- `mobile-fallback.ts` - Mobile utilities
- `permissions.ts` - Permission management
