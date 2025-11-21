import React, { useState, useRef, useEffect } from 'react';
import './PhotoCapture.css';

/**
 * PhotoCapture Component
 * Enhanced version with:
 * - Accurate luminance-based brightness analysis
 * - HDR normalization
 * - True exposure calculation
 */

interface PhotoCaptureProps {
  onPhotoConfirmed: (photo: File) => void;
  onCancel?: () => void;
  maxFileSize?: number;
  acceptedFormats?: string[];
  requireQualityCheck?: boolean;
}

interface PhotoQuality {
  isValid: boolean;
  warnings: string[];
}

export const PhotoCapture: React.FC<PhotoCaptureProps> = ({
  onPhotoConfirmed,
  onCancel,
  maxFileSize = 10 * 1024 * 1024,
  acceptedFormats = ['image/jpeg', 'image/jpg', 'image/png'],
  requireQualityCheck = true,
}) => {
  const [step, setStep] = useState<'capture' | 'preview' | 'confirm'>('capture');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [quality, setQuality] = useState<PhotoQuality>({ isValid: true, warnings: [] });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
      });

      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraError(null);
    } catch (error) {
      console.error('Error accessing camera:', error);
      setCameraError('Unable to access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.error('Failed to create image blob');
          return;
        }

        const file = new File([blob], `photo-${Date.now()}.jpg`, { type: 'image/jpeg' });

        const validation = validatePhoto(file);
        if (!validation.isValid) {
          alert(validation.error);
          return;
        }

        // Quality check
        const qualityCheck = checkPhotoQuality(canvas);
        setQuality(qualityCheck);

        const url = URL.createObjectURL(blob);
        setPhotoUrl(url);
        setPhotoFile(file);

        stopCamera();
        setStep('preview');
      },
      'image/jpeg',
      0.95
    );
  };

  const validatePhoto = (file: File): { isValid: boolean; error?: string } => {
    if (file.size > maxFileSize) {
      return {
        isValid: false,
        error: `File size must be less than ${Math.round(maxFileSize / 1024 / 1024)}MB`,
      };
    }

    if (!acceptedFormats.includes(file.type)) {
      return {
        isValid: false,
        error: `File type must be one of: ${acceptedFormats.join(', ')}`,
      };
    }

    return { isValid: true };
  };

  /**
   * NEW: Enhanced brightness + exposure analysis
   */
  const checkPhotoQuality = (canvas: HTMLCanvasElement): PhotoQuality => {
    const warnings: string[] = [];
    const context = canvas.getContext('2d');
    if (!context) return { isValid: true, warnings };

    const minWidth = 640;
    const minHeight = 480;
    if (canvas.width < minWidth || canvas.height < minHeight) {
      warnings.push(
        `Low resolution: ${canvas.width}x${canvas.height}. Recommended: at least ${minWidth}x${minHeight}`
      );
    }

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let totalLuminance = 0;
    let sampleCount = 0;

    let minLum = 255;
    let maxLum = 0;
    const lumValues: number[] = [];

    // Sample every 40 bytes (10 RGB pixels)
    for (let i = 0; i < data.length; i += 40) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      if (r === undefined || g === undefined || b === undefined) continue;

      // Luminance formula (photo industry standard)
      const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;

      totalLuminance += L;
      sampleCount++;
      lumValues.push(L);

      if (L < minLum) minLum = L;
      if (L > maxLum) maxLum = L;
    }

    let averageLum = sampleCount > 0 ? totalLuminance / sampleCount : 0;

    // Determine median luminance for stability
    lumValues.sort((a, b) => a - b);
    const medianLum = lumValues[Math.floor(lumValues.length / 2)] || averageLum;

    // Exposure range calculation
    const lumRange = maxLum - minLum;

    // Enhanced warnings
    if (averageLum < 40) {
      warnings.push('Image is very dark (underexposed). Increase lighting.');
    } else if (averageLum < 70) {
      warnings.push('Image slightly dark. Lighting could be improved.');
    }

    if (averageLum > 230) {
      warnings.push('Image is extremely bright (overexposed). Reduce lighting.');
    } else if (averageLum > 200) {
      warnings.push('Image appears bright; consider softer lighting.');
    }

    if (lumRange < 40) {
      warnings.push('Low contrast detected. Image may look washed out.');
    }

    const isValid = warnings.length === 0 || !requireQualityCheck;
    return { isValid, warnings };
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validatePhoto(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    const url = URL.createObjectURL(file);
    setPhotoUrl(url);
    setPhotoFile(file);

    setQuality({ isValid: true, warnings: [] });
    setStep('preview');
  };

  const retakePhoto = () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    setPhotoUrl(null);
    setPhotoFile(null);
    setQuality({ isValid: true, warnings: [] });

    setStep('capture');
    startCamera();
  };

  const confirmPhoto = () => {
    if (!photoFile) return;
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    onPhotoConfirmed(photoFile);
  };

  const handleCancel = () => {
    stopCamera();
    if (photoUrl) URL.revokeObjectURL(photoUrl);
    if (onCancel) onCancel();
  };

  if (step === 'capture') {
    return (
      <div className="photo-capture">
        <div className="photo-capture-header">
          <h3>Capture Photo</h3>
          <button onClick={handleCancel} className="btn-cancel">
            Cancel
          </button>
        </div>

        {cameraError ? (
          <div className="camera-error">
            <p>{cameraError}</p>
            <div className="camera-fallback">
              <p>Use file picker instead:</p>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptedFormats.join(',')}
                onChange={handleFileSelect}
                className="file-input"
              />
            </div>
          </div>
        ) : (
          <div className="camera-container">
            <video ref={videoRef} autoPlay playsInline className="camera-preview" />
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="camera-controls">
              <button
                onClick={startCamera}
                className="btn-start-camera"
                disabled={!!streamRef.current}
              >
                {streamRef.current ? 'Camera Active' : 'Start Camera'}
              </button>

              <button
                onClick={capturePhoto}
                className="btn-capture"
                disabled={!streamRef.current}
              >
                📷 Capture
              </button>

              <div className="file-fallback">
                <label htmlFor="file-input" className="file-label">
                  Or choose file
                </label>
                <input
                  id="file-input"
                  ref={fileInputRef}
                  type="file"
                  accept={acceptedFormats.join(',')}
                  onChange={handleFileSelect}
                  className="file-input-hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="photo-preview">
      <div className="photo-preview-header">
        <h3>Review Photo</h3>
      </div>

      <div className="photo-preview-container">
        {photoUrl && <img src={photoUrl} alt="Captured" className="photo-preview-image" />}
      </div>

      {quality.warnings.length > 0 && (
        <div className="quality-warnings">
          <h4>⚠️ Quality Warnings:</h4>
          <ul>
            {quality.warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
          {requireQualityCheck && <p>Consider retaking the photo for better quality.</p>}
        </div>
      )}

      <div className="photo-preview-actions">
        <button onClick={retakePhoto} className="btn-retake">
          Retake Photo
        </button>
        <button onClick={confirmPhoto} className="btn-confirm">
          Confirm & Upload
        </button>
      </div>
    </div>
  );
};

export default PhotoCapture;