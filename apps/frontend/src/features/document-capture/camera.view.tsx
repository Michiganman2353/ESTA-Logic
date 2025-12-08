/**
 * Camera View Component
 *
 * UI for document capture with:
 * - Live camera preview
 * - Capture, retake, upload controls
 * - Fallback file input
 * - Permission error handling
 * - Progress indication
 */

import React, { useEffect, useRef, useState } from 'react';
import { CameraController } from './camera.controller';
import {
  needsMobileFallback,
  processImageFile,
  createMobileCaptureInput,
  getRecommendedCaptureStrategy,
} from './mobile-fallback';
import {
  uploadToFirebase,
  uploadWithSignedUrl,
  UploadOptions,
  UploadProgress,
  UploadResult,
} from './secure-uploader';
import { getPermissionErrorMessage } from './permissions';

export interface CameraViewProps {
  onUploadComplete: (result: UploadResult) => void;
  onCancel?: () => void;
  uploadOptions?: UploadOptions;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  firebaseStorageRef?: any; // Firebase storage reference - typed by Firebase SDK
  signedUrlEndpoint?: string;
  authToken?: string;
  storagePath?: string;
}

export const CameraView: React.FC<CameraViewProps> = ({
  onUploadComplete,
  onCancel,
  uploadOptions = {},
  firebaseStorageRef,
  signedUrlEndpoint,
  authToken,
  storagePath = 'documents',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraController] = useState(() => new CameraController());
  const [capturedImage, setCapturedImage] = useState<Blob | null>(null);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(
    null
  );
  const [useFallback] = useState(() => needsMobileFallback());
  const [captureStrategy] = useState(() => getRecommendedCaptureStrategy());

  // Start camera on mount
  useEffect(() => {
    if (useFallback || captureStrategy === 'fileInput') {
      return; // Don't start camera for fallback mode
    }

    const startCamera = async () => {
      if (!videoRef.current) return;

      try {
        setIsLoading(true);
        await cameraController.startCamera(videoRef.current);
        setError(null);
      } catch (err) {
        const permissionManager = cameraController.getPermissionManager();
        const status = permissionManager.currentStatus;

        if (status) {
          setError(getPermissionErrorMessage(status));
        } else {
          setError(
            err instanceof Error ? err.message : 'Failed to start camera'
          );
        }
      } finally {
        setIsLoading(false);
      }
    };

    startCamera();

    return () => {
      cameraController.stopCamera();
    };
  }, [cameraController, useFallback, captureStrategy]);

  // Cleanup captured image URL
  useEffect(() => {
    return () => {
      if (capturedImageUrl) {
        URL.revokeObjectURL(capturedImageUrl);
      }
    };
  }, [capturedImageUrl]);

  const handleCapture = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const blob = await cameraController.captureFrame();
      setCapturedImage(blob);

      const url = URL.createObjectURL(blob);
      setCapturedImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to capture image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    if (capturedImageUrl) {
      URL.revokeObjectURL(capturedImageUrl);
    }
    setCapturedImage(null);
    setCapturedImageUrl(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!capturedImage) return;

    try {
      setIsLoading(true);
      setError(null);

      const fileName = `${Date.now()}.jpg`;
      const file = new File([capturedImage], fileName, { type: 'image/jpeg' });

      const uploadOpts: UploadOptions = {
        ...uploadOptions,
        onProgress: setUploadProgress,
      };

      let result: UploadResult;

      // Use signed URL if provided, otherwise direct Firebase upload
      if (signedUrlEndpoint && authToken) {
        result = await uploadWithSignedUrl(
          file,
          signedUrlEndpoint,
          authToken,
          uploadOpts
        );
      } else if (firebaseStorageRef) {
        result = await uploadToFirebase(
          file,
          `${storagePath}/${fileName}`,
          firebaseStorageRef,
          uploadOpts
        );
      } else {
        throw new Error('No upload endpoint configured');
      }

      if (result.success) {
        onUploadComplete(result);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  };

  const handleFileSelect = async (file: File) => {
    try {
      setIsLoading(true);
      setError(null);

      // Process image with orientation correction
      const processed = await processImageFile(file);
      setCapturedImage(processed.blob);

      const url = URL.createObjectURL(processed.blob);
      setCapturedImageUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFallbackCapture = () => {
    const input = createMobileCaptureInput({
      acceptedTypes: uploadOptions.allowedMimeTypes,
    });

    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      if (file) {
        await handleFileSelect(file);
      }
      document.body.removeChild(input);
    });

    document.body.appendChild(input);
    input.click();
  };

  // Render fallback UI
  if (useFallback || captureStrategy === 'fileInput') {
    return (
      <div className="camera-view-fallback">
        {capturedImageUrl ? (
          <div className="captured-image-preview">
            <img src={capturedImageUrl} alt="Captured document" />
            <div className="button-group">
              <button onClick={handleRetake} disabled={isLoading}>
                Retake
              </button>
              <button onClick={handleUpload} disabled={isLoading}>
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
              {onCancel && (
                <button onClick={onCancel} disabled={isLoading}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="capture-prompt">
            <p>Capture a document using your device camera</p>
            <button onClick={handleFallbackCapture} disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Capture Document'}
            </button>
            {onCancel && (
              <button onClick={onCancel} disabled={isLoading}>
                Cancel
              </button>
            )}
          </div>
        )}
        {error && <div className="error-message">{error}</div>}
        {uploadProgress && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
            <span>{Math.round(uploadProgress.percentage)}%</span>
          </div>
        )}
      </div>
    );
  }

  // Render standard camera UI
  return (
    <div className="camera-view">
      {capturedImageUrl ? (
        <div className="captured-image-preview">
          <img src={capturedImageUrl} alt="Captured document" />
          <div className="button-group">
            <button onClick={handleRetake} disabled={isLoading}>
              Retake
            </button>
            <button onClick={handleUpload} disabled={isLoading}>
              {isLoading ? 'Uploading...' : 'Upload'}
            </button>
            {onCancel && (
              <button onClick={onCancel} disabled={isLoading}>
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="camera-preview">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
          <div className="button-group">
            <button onClick={handleCapture} disabled={isLoading || !!error}>
              {isLoading ? 'Capturing...' : 'Capture'}
            </button>
            {onCancel && (
              <button onClick={onCancel} disabled={isLoading}>
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
      {error && <div className="error-message">{error}</div>}
      {uploadProgress && (
        <div className="upload-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${uploadProgress.percentage}%` }}
            />
          </div>
          <span>
            {uploadProgress.stage === 'validating' && 'Validating...'}
            {uploadProgress.stage === 'uploading' &&
              `Uploading: ${Math.round(uploadProgress.percentage)}%`}
            {uploadProgress.stage === 'complete' && 'Complete!'}
            {uploadProgress.stage === 'error' && 'Upload failed'}
          </span>
        </div>
      )}
    </div>
  );
};
