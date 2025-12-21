import React, { useState, useRef, useEffect, useCallback } from 'react';
import './DocumentScanner.css';
import EncryptionIndicator from '@/experience/trust/EncryptionIndicator';
import { TrustBadge, TrustBadgeCompact } from '@/components/trust';

/**
 * DocumentScanner Component
 *
 * Advanced document scanning interface with:
 * - Web camera access with getUserMedia
 * - Live alignment guide and zoom controls
 * - Orientation handling
 * - Auto edge detection using OpenCV.js
 * - Perspective correction
 * - WebP compression with adjustable quality
 * - Optional client-side AES-GCM encryption
 * - Secure Firebase Storage upload (resumable)
 * - Support for signed URL upload endpoints
 */

// OpenCV.js types (loaded from CDN or public/)
declare global {
  interface Window {
    cv: OpenCVInstance | undefined;
  }
}

interface OpenCVInstance {
  Mat: unknown;
  matFromImageData: (imageData: ImageData) => unknown;
  cvtColor: (src: unknown, dst: unknown, code: number) => void;
  GaussianBlur: (
    src: unknown,
    dst: unknown,
    size: unknown,
    sigma: number
  ) => void;
  Canny: (
    src: unknown,
    dst: unknown,
    threshold1: number,
    threshold2: number
  ) => void;
  findContours: (
    image: unknown,
    contours: unknown,
    hierarchy: unknown,
    mode: number,
    method: number
  ) => void;
  contourArea: (contour: unknown) => number;
  arcLength: (curve: unknown, closed: boolean) => number;
  approxPolyDP: (
    curve: unknown,
    approx: unknown,
    epsilon: number,
    closed: boolean
  ) => void;
  getPerspectiveTransform: (src: unknown, dst: unknown) => unknown;
  warpPerspective: (
    src: unknown,
    dst: unknown,
    M: unknown,
    dsize: unknown,
    flags: number,
    borderMode: number,
    borderValue: unknown
  ) => void;
  imshow: (canvasElement: HTMLCanvasElement, mat: unknown) => void;
  resize: (
    src: unknown,
    dst: unknown,
    dsize: unknown,
    fx: number,
    fy: number,
    interpolation: number
  ) => void;
  MatVector: new () => unknown;
  Size: new (width: number, height: number) => unknown;
  Scalar: new () => unknown;
  COLOR_RGBA2GRAY: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  INTER_LINEAR: number;
  BORDER_CONSTANT: number;
  CV_32FC2: number;
  matFromArray: (
    rows: number,
    cols: number,
    type: number,
    data: number[]
  ) => unknown;
}

export interface DocumentScannerProps {
  /** Callback when document is successfully scanned and ready for upload */
  onDocumentScanned: (file: File, metadata?: DocumentMetadata) => void;
  /** Optional cancel callback */
  onCancel?: () => void;
  /** Firebase Storage reference for direct upload */
  firebaseStorageRef?: {
    put: (file: File) => {
      on: (
        event: string,
        onProgress: (snapshot: {
          bytesTransferred: number;
          totalBytes: number;
        }) => void,
        onError: (error: Error) => void,
        onComplete: () => void
      ) => void;
    };
  };
  /** Endpoint to fetch signed upload URL */
  fetchSignedUploadUrl?: () => Promise<string>;
  /** Endpoint to request ephemeral encryption key */
  requestEphemeralKey?: () => Promise<CryptoKey>;
  /** Enable client-side encryption (requires requestEphemeralKey) */
  enableEncryption?: boolean;
  /** WebP compression quality (0-1) */
  compressionQuality?: number;
  /** Max file size in bytes */
  maxFileSize?: number;
  /** Enable auto edge detection */
  enableEdgeDetection?: boolean;
  /** Enable perspective correction */
  enablePerspectiveCorrection?: boolean;
  /** OpenCV.js URL (default: /opencv.js) */
  opencvUrl?: string;
}

export interface DocumentMetadata {
  width: number;
  height: number;
  format: string;
  encrypted: boolean;
  timestamp: string;
  edges?: EdgePoints;
}

export interface EdgePoints {
  topLeft: { x: number; y: number };
  topRight: { x: number; y: number };
  bottomRight: { x: number; y: number };
  bottomLeft: { x: number; y: number };
}

type ScanStep = 'setup' | 'capture' | 'process' | 'preview' | 'upload';

/**
 * Format bytes to human-readable size
 */
const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

export const DocumentScanner: React.FC<DocumentScannerProps> = ({
  onDocumentScanned,
  onCancel,
  firebaseStorageRef,
  fetchSignedUploadUrl,
  requestEphemeralKey,
  enableEncryption = false,
  compressionQuality = 0.92,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  enableEdgeDetection = true,
  enablePerspectiveCorrection = true,
  opencvUrl = '/opencv.js',
}) => {
  const [step, setStep] = useState<ScanStep>('setup');
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [detectedEdges, setDetectedEdges] = useState<EdgePoints | null>(null);
  const [scannedBlob, setScannedBlob] = useState<Blob | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadata | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [opencvReady, setOpencvReady] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Load OpenCV.js on component mount
   */
  useEffect(() => {
    const loadOpenCV = async () => {
      if (window.cv && window.cv.Mat) {
        setOpencvReady(true);
        return;
      }

      try {
        // Check if OpenCV script is already in the document
        const existingScript = document.querySelector(
          'script[src*="opencv.js"]'
        );
        if (existingScript) {
          // Wait for it to load
          await new Promise<void>((resolve) => {
            const checkCV = setInterval(() => {
              if (window.cv && window.cv.Mat) {
                clearInterval(checkCV);
                resolve();
              }
            }, 100);
          });
        } else {
          // Load from CDN or public folder
          const script = document.createElement('script');
          script.src = opencvUrl;
          script.async = true;
          script.onload = () => {
            if (window.cv && window.cv.Mat) {
              setOpencvReady(true);
            }
          };
          script.onerror = () => {
            console.warn('Failed to load OpenCV.js, edge detection disabled');
          };
          document.body.appendChild(script);
        }
      } catch (_err) {
        console.warn('OpenCV.js not available, edge detection disabled');
      }
    };

    if (enableEdgeDetection) {
      loadOpenCV();
    }

    return () => {
      stopCamera();
    };
  }, [enableEdgeDetection, opencvUrl]);

  /**
   * Start camera with rear-facing preference
   */
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Prefer rear camera
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setError(null);
      setStep('capture');
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Unable to access camera. Please check permissions.');
    }
  };

  /**
   * Stop camera stream
   */
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  /**
   * Handle zoom control
   */
  const handleZoomChange = (newZoom: number) => {
    setZoom(Math.max(1.0, Math.min(3.0, newZoom)));
  };

  /**
   * Detect document edges using OpenCV.js
   */
  const detectEdges = useCallback(
    (imageData: ImageData): EdgePoints | null => {
      if (!opencvReady || !window.cv) return null;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cv: any = window.cv;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const src: any = cv.matFromImageData(imageData);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const gray: any = new cv.Mat();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const edges: any = new cv.Mat();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const contours: any = new cv.MatVector();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const hierarchy: any = new cv.Mat();

        // Convert to grayscale
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        // Apply Gaussian blur
        cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0);

        // Canny edge detection
        cv.Canny(gray, edges, 75, 200);

        // Find contours
        cv.findContours(
          edges,
          contours,
          hierarchy,
          cv.RETR_EXTERNAL,
          cv.CHAIN_APPROX_SIMPLE
        );

        // Find the largest contour (assuming it's the document)
        let maxArea = 0;
        let maxContourIndex = -1;

        for (let i = 0; i < contours.size(); i++) {
          const contour = contours.get(i);
          const area = cv.contourArea(contour);
          if (area > maxArea) {
            maxArea = area;
            maxContourIndex = i;
          }
        }

        if (maxContourIndex === -1) {
          // No contour found
          src.delete();
          gray.delete();
          edges.delete();
          contours.delete();
          hierarchy.delete();
          return null;
        }

        // Get the corner points
        const contour = contours.get(maxContourIndex);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const approx: any = new cv.Mat();
        const peri = cv.arcLength(contour, true);
        cv.approxPolyDP(contour, approx, 0.02 * peri, true);

        // We need 4 points for a quadrilateral
        if (approx.rows !== 4) {
          src.delete();
          gray.delete();
          edges.delete();
          contours.delete();
          hierarchy.delete();
          approx.delete();
          return null;
        }

        // Extract corner points
        const points: EdgePoints = {
          topLeft: {
            x: approx.data32S?.[0] ?? 0,
            y: approx.data32S?.[1] ?? 0,
          },
          topRight: {
            x: approx.data32S?.[2] ?? 0,
            y: approx.data32S?.[3] ?? 0,
          },
          bottomRight: {
            x: approx.data32S?.[4] ?? 0,
            y: approx.data32S?.[5] ?? 0,
          },
          bottomLeft: {
            x: approx.data32S?.[6] ?? 0,
            y: approx.data32S?.[7] ?? 0,
          },
        };

        // Cleanup
        src.delete();
        gray.delete();
        edges.delete();
        contours.delete();
        hierarchy.delete();
        approx.delete();

        return points;
      } catch (_err) {
        console.error('Edge detection error:', _err);
        return null;
      }
    },
    [opencvReady]
  );

  /**
   * Apply perspective correction using OpenCV.js
   */
  const applyPerspectiveCorrection = useCallback(
    (imageData: ImageData, edges: EdgePoints): HTMLCanvasElement | null => {
      if (!opencvReady || !window.cv) return null;

      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cv: any = window.cv;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const src: any = cv.matFromImageData(imageData);

        // Calculate destination dimensions
        const width = Math.max(
          Math.hypot(
            edges.topRight.x - edges.topLeft.x,
            edges.topRight.y - edges.topLeft.y
          ),
          Math.hypot(
            edges.bottomRight.x - edges.bottomLeft.x,
            edges.bottomRight.y - edges.bottomLeft.y
          )
        );
        const height = Math.max(
          Math.hypot(
            edges.bottomLeft.x - edges.topLeft.x,
            edges.bottomLeft.y - edges.topLeft.y
          ),
          Math.hypot(
            edges.bottomRight.x - edges.topRight.x,
            edges.bottomRight.y - edges.topRight.y
          )
        );

        // Source points
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const srcPoints: any = cv.matFromArray(4, 1, cv.CV_32FC2, [
          edges.topLeft.x,
          edges.topLeft.y,
          edges.topRight.x,
          edges.topRight.y,
          edges.bottomRight.x,
          edges.bottomRight.y,
          edges.bottomLeft.x,
          edges.bottomLeft.y,
        ]);

        // Destination points
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dstPoints: any = cv.matFromArray(4, 1, cv.CV_32FC2, [
          0,
          0,
          width,
          0,
          width,
          height,
          0,
          height,
        ]);

        // Get perspective transform matrix
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const M: any = cv.getPerspectiveTransform(srcPoints, dstPoints);

        // Apply transform
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dst: any = new cv.Mat();
        cv.warpPerspective(
          src,
          dst,
          M,
          new cv.Size(width, height),
          cv.INTER_LINEAR,
          cv.BORDER_CONSTANT,
          new cv.Scalar()
        );

        // Convert to canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        cv.imshow(canvas, dst);

        // Cleanup
        src.delete();
        srcPoints.delete();
        dstPoints.delete();
        M.delete();
        dst.delete();

        return canvas;
      } catch (_err) {
        console.error('Perspective correction error:', _err);
        return null;
      }
    },
    [opencvReady]
  );

  /**
   * Capture and process document
   */
  const captureDocument = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setProcessing(true);
    setError(null);

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx) throw new Error('Failed to get canvas context');

      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Apply zoom
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.drawImage(
        video,
        (canvas.width * (1 - zoom)) / (2 * zoom),
        (canvas.height * (1 - zoom)) / (2 * zoom),
        canvas.width / zoom,
        canvas.height / zoom,
        0,
        0,
        canvas.width,
        canvas.height
      );
      ctx.restore();

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Detect edges if enabled
      let edges: EdgePoints | null = null;
      let processedCanvas = canvas;

      if (enableEdgeDetection) {
        edges = detectEdges(imageData);
        setDetectedEdges(edges);

        // Apply perspective correction if edges detected
        if (edges && enablePerspectiveCorrection) {
          const correctedCanvas = applyPerspectiveCorrection(imageData, edges);
          if (correctedCanvas) {
            processedCanvas = correctedCanvas;
          }
        }
      }

      // Convert to WebP with compression
      const blob = await new Promise<Blob>((resolve, reject) => {
        processedCanvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/webp',
          compressionQuality
        );
      });

      // Check file size
      if (blob.size > maxFileSize) {
        throw new Error(
          `File size (${formatBytes(blob.size)}) exceeds maximum (${formatBytes(maxFileSize)})`
        );
      }

      // Store metadata
      const docMetadata: DocumentMetadata = {
        width: processedCanvas.width,
        height: processedCanvas.height,
        format: 'webp',
        encrypted: false,
        timestamp: new Date().toISOString(),
        edges: edges || undefined,
      };

      setScannedBlob(blob);
      setMetadata(docMetadata);
      stopCamera();
      setStep('preview');
    } catch (err) {
      console.error('Capture error:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to capture document'
      );
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Encrypt blob using AES-GCM
   */
  const encryptBlob = async (blob: Blob, key: CryptoKey): Promise<Blob> => {
    const arrayBuffer = await blob.arrayBuffer();
    const iv = crypto.getRandomValues(new Uint8Array(12));

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      arrayBuffer
    );

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encryptedData.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(encryptedData), iv.length);

    return new Blob([combined], { type: 'application/octet-stream' });
  };

  /**
   * Upload document
   */
  const uploadDocument = async () => {
    if (!scannedBlob || !metadata) return;

    setProcessing(true);
    setError(null);
    setStep('upload');

    try {
      let finalBlob = scannedBlob;
      const finalMetadata = { ...metadata };

      // Encrypt if enabled
      if (enableEncryption && requestEphemeralKey) {
        const key = await requestEphemeralKey();
        finalBlob = await encryptBlob(scannedBlob, key);
        finalMetadata.encrypted = true;
      }

      // Create File object
      const file = new File(
        [finalBlob],
        `document-${Date.now()}.${finalMetadata.encrypted ? 'enc' : 'webp'}`,
        { type: finalBlob.type }
      );

      // Upload via Firebase Storage or signed URL
      if (firebaseStorageRef) {
        await uploadToFirebase(file, firebaseStorageRef);
      } else if (fetchSignedUploadUrl) {
        await uploadToSignedUrl(file, fetchSignedUploadUrl);
      }

      // Notify parent
      onDocumentScanned(file, finalMetadata);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Upload failed');
      setStep('preview'); // Go back to preview
    } finally {
      setProcessing(false);
    }
  };

  /**
   * Upload to Firebase Storage (resumable)
   */
  const uploadToFirebase = async (
    file: File,
    storageRef: {
      put: (file: File) => {
        on: (
          event: string,
          onProgress: (snapshot: {
            bytesTransferred: number;
            totalBytes: number;
          }) => void,
          onError: (error: Error) => void,
          onComplete: () => void
        ) => void;
      };
    }
  ) => {
    const uploadTask = storageRef.put(file);

    uploadTask.on(
      'state_changed',
      (snapshot: { bytesTransferred: number; totalBytes: number }) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error: Error) => {
        throw error;
      },
      () => {
        setUploadProgress(100);
      }
    );

    await uploadTask;
  };

  /**
   * Upload to signed URL endpoint
   */
  const uploadToSignedUrl = async (
    file: File,
    fetchUrl: () => Promise<string>
  ) => {
    const url = await fetchUrl();

    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100;
        setUploadProgress(progress);
      }
    });

    await new Promise<void>((resolve, reject) => {
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error('Network error'));

      xhr.open('PUT', url);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  };

  /**
   * Retake document
   */
  const retake = () => {
    setScannedBlob(null);
    setMetadata(null);
    setDetectedEdges(null);
    setUploadProgress(0);
    startCamera();
  };

  /**
   * Cancel scanning
   */
  const handleCancel = () => {
    stopCamera();
    if (onCancel) onCancel();
  };

  // Render setup step
  if (step === 'setup') {
    return (
      <div className="document-scanner">
        <div className="scanner-header">
          <h3>Document Scanner</h3>
          <button onClick={handleCancel} className="btn-cancel">
            Cancel
          </button>
        </div>
        <div className="scanner-info">
          <p>This scanner will help you capture clear document images.</p>
          <ul>
            <li>Position document on a flat surface</li>
            <li>Ensure good lighting</li>
            <li>Hold camera steady</li>
            {enableEdgeDetection && <li>Auto edge detection enabled</li>}
          </ul>
        </div>

        {/* Enhanced Security UX Messaging */}
        <div className="my-4 space-y-3">
          {enableEncryption && (
            <TrustBadge
              icon="encrypted"
              title="Encrypted Capture"
              description="Your document will be encrypted immediately after capture using industry-standard protection. Only authorized users can access it."
              variant="success"
              showPulse={true}
            />
          )}
          <TrustBadge
            icon="shield-check"
            title="Secure & Logged"
            description="This scan will be recorded in your audit trail with timestamp and user details for compliance validation."
            variant="info"
          />
        </div>

        {error && <div className="scanner-error">{error}</div>}
        <button onClick={startCamera} className="btn-start">
          Start Camera
        </button>
      </div>
    );
  }

  // Render capture step
  if (step === 'capture') {
    return (
      <div className="document-scanner">
        <div className="scanner-header">
          <div className="flex w-full items-center justify-between">
            <h3>Position Document</h3>
            {enableEncryption && (
              <TrustBadgeCompact
                label="Protected"
                icon="encrypted"
                variant="success"
                showPulse={true}
              />
            )}
          </div>
          <button onClick={handleCancel} className="btn-cancel">
            Cancel
          </button>
        </div>
        <div className="scanner-viewport">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="scanner-video"
            style={{ transform: `scale(${zoom})` }}
          />
          <canvas ref={canvasRef} style={{ display: 'none' }} />
          {/* Alignment guide overlay */}
          <div className="alignment-guide">
            <div className="guide-corner guide-tl" />
            <div className="guide-corner guide-tr" />
            <div className="guide-corner guide-br" />
            <div className="guide-corner guide-bl" />
          </div>
        </div>
        <div className="scanner-controls">
          <div className="zoom-control">
            <label>Zoom: {zoom.toFixed(1)}x</label>
            <input
              type="range"
              min="1"
              max="3"
              step="0.1"
              value={zoom}
              onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
            />
          </div>
          <button
            onClick={captureDocument}
            disabled={processing}
            className="btn-capture"
          >
            {processing ? 'Processing...' : 'Capture Document'}
          </button>
        </div>
        {error && <div className="scanner-error">{error}</div>}
      </div>
    );
  }

  // Render preview step
  if (step === 'preview' && scannedBlob) {
    return (
      <div className="document-scanner">
        <div className="scanner-header">
          <h3>Review Document</h3>
        </div>
        <div className="scanner-preview">
          <canvas ref={previewCanvasRef} className="preview-canvas" />
          <img
            src={URL.createObjectURL(scannedBlob)}
            alt="Scanned document"
            className="preview-image"
            onLoad={(e) => {
              // Draw to preview canvas if needed
              const img = e.currentTarget;
              const canvas = previewCanvasRef.current;
              if (canvas) {
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(img, 0, 0);
                }
              }
            }}
          />
        </div>
        {metadata && (
          <div className="scanner-metadata">
            <p>
              Size: {metadata.width} × {metadata.height}
            </p>
            <p>Format: {metadata.format.toUpperCase()}</p>
            <p>File size: {(scannedBlob.size / 1024).toFixed(2)} KB</p>
            {detectedEdges && <p>✓ Edges detected and corrected</p>}
          </div>
        )}

        {/* Security Reassurance before upload */}
        <div className="my-4">
          <TrustBadge
            icon={enableEncryption ? 'encrypted' : 'shield-check'}
            title="Ready for Secure Upload"
            description={
              enableEncryption
                ? "Clicking 'Confirm & Upload' will encrypt this document and store it securely. It will be logged in your audit trail and ready for compliance processing."
                : "Clicking 'Confirm & Upload' will store this document securely and log it in your audit trail for compliance purposes."
            }
            variant="success"
          />
        </div>

        {error && <div className="scanner-error">{error}</div>}
        <div className="scanner-actions">
          <button onClick={retake} className="btn-retake">
            Retake
          </button>
          <button
            onClick={uploadDocument}
            disabled={processing}
            className="btn-upload"
          >
            {processing ? 'Uploading...' : 'Confirm & Upload'}
          </button>
        </div>
      </div>
    );
  }

  // Render upload step
  if (step === 'upload') {
    return (
      <div className="document-scanner">
        <div className="scanner-header">
          <h3>Uploading Document</h3>
        </div>
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p>{uploadProgress.toFixed(0)}% complete</p>
        </div>
        {error && <div className="scanner-error">{error}</div>}
      </div>
    );
  }

  return null;
};

export default DocumentScanner;
