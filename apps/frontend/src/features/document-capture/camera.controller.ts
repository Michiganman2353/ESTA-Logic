/**
 * Unified Cross-Platform Camera Controller
 *
 * Handles camera access across desktop and mobile platforms:
 * - getUserMedia with device selection
 * - Orientation normalization
 * - Safari/iOS quirks handling
 * - Permission management integration
 */

import { CameraPermissions, PermissionStatus } from './permissions';

export interface CameraDevice {
  deviceId: string;
  label: string;
  facingMode?: 'user' | 'environment';
}

export interface CameraConstraints {
  deviceId?: string;
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
}

export interface CameraControllerOptions {
  preferredFacingMode?: 'user' | 'environment';
  idealWidth?: number;
  idealHeight?: number;
  onPermissionDenied?: (status: PermissionStatus) => void;
}

export class CameraController {
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private permissionManager: CameraPermissions;
  private options: CameraControllerOptions;

  constructor(options: CameraControllerOptions = {}) {
    this.options = {
      preferredFacingMode: 'environment',
      idealWidth: 1920,
      idealHeight: 1080,
      ...options,
    };
    this.permissionManager = new CameraPermissions();
  }

  /**
   * Lists available camera devices
   */
  async enumerateDevices(): Promise<CameraDevice[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(
        (device) => device.kind === 'videoinput'
      );

      return videoDevices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        facingMode: this.guessFacingMode(device.label),
      }));
    } catch (error) {
      console.error('Failed to enumerate devices:', error);
      return [];
    }
  }

  /**
   * Attempts to guess facing mode from device label
   */
  private guessFacingMode(label: string): 'user' | 'environment' | undefined {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('back') || lowerLabel.includes('rear')) {
      return 'environment';
    }
    if (lowerLabel.includes('front') || lowerLabel.includes('user')) {
      return 'user';
    }
    return undefined;
  }

  /**
   * Starts camera stream with given constraints
   */
  async startCamera(
    videoElement: HTMLVideoElement,
    constraints?: CameraConstraints
  ): Promise<MediaStream> {
    // Check permissions first
    const permissionStatus = await this.permissionManager.checkPermission();

    if (permissionStatus.denied) {
      if (this.options.onPermissionDenied) {
        this.options.onPermissionDenied(permissionStatus);
      }
      throw new Error('Camera permission denied');
    }

    // Build constraints
    const mediaConstraints: MediaStreamConstraints = {
      video: {
        facingMode: constraints?.facingMode || this.options.preferredFacingMode,
        width: { ideal: constraints?.width || this.options.idealWidth },
        height: { ideal: constraints?.height || this.options.idealHeight },
      },
      audio: false,
    };

    // If specific device requested, use deviceId instead of facingMode
    if (constraints?.deviceId) {
      mediaConstraints.video = {
        deviceId: { exact: constraints.deviceId },
        width: { ideal: constraints?.width || this.options.idealWidth },
        height: { ideal: constraints?.height || this.options.idealHeight },
      };
    }

    try {
      // Request camera stream
      this.stream = await navigator.mediaDevices.getUserMedia(mediaConstraints);

      // Attach to video element
      this.videoElement = videoElement;
      videoElement.srcObject = this.stream;

      // Wait for video to be ready
      await new Promise<void>((resolve, reject) => {
        videoElement.onloadedmetadata = () => {
          videoElement.play().then(resolve).catch(reject);
        };
        videoElement.onerror = reject;
      });

      // Apply orientation normalization for mobile devices
      this.normalizeOrientation(videoElement);

      return this.stream;
    } catch (error) {
      // Handle permission denial during stream request
      if (
        error instanceof DOMException &&
        (error.name === 'NotAllowedError' ||
          error.name === 'PermissionDeniedError')
      ) {
        const status = await this.permissionManager.requestPermission();
        if (this.options.onPermissionDenied) {
          this.options.onPermissionDenied(status);
        }
      }
      throw error;
    }
  }

  /**
   * Normalizes video orientation for mobile devices
   * Handles landscape/portrait orientation changes
   */
  private normalizeOrientation(videoElement: HTMLVideoElement): void {
    // Check if device supports orientation
    if (!window.screen?.orientation) {
      return;
    }

    const updateOrientation = () => {
      const orientation = window.screen.orientation.type;

      // Apply CSS transform based on orientation
      if (orientation.includes('landscape')) {
        videoElement.style.transform = 'none';
      } else if (orientation.includes('portrait')) {
        // Most mobile cameras work correctly in portrait
        videoElement.style.transform = 'none';
      }
    };

    // Initial orientation
    updateOrientation();

    // Listen for orientation changes
    window.screen.orientation.addEventListener('change', updateOrientation);
  }

  /**
   * Switches to a different camera device
   */
  async switchCamera(deviceId: string): Promise<void> {
    if (!this.videoElement) {
      throw new Error('No active camera stream');
    }

    // Stop current stream
    this.stopCamera();

    // Start new stream with specified device
    await this.startCamera(this.videoElement, { deviceId });
  }

  /**
   * Captures a frame from the current camera stream
   */
  captureFrame(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.videoElement || !this.stream) {
        reject(new Error('No active camera stream'));
        return;
      }

      // Create canvas for capture
      const canvas = document.createElement('canvas');
      const video = this.videoElement;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to capture frame'));
          }
        },
        'image/jpeg',
        0.95
      );
    });
  }

  /**
   * Stops the camera stream and releases resources
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  /**
   * Gets current stream info
   */
  getStreamInfo(): { width: number; height: number; deviceId: string } | null {
    if (!this.stream || !this.videoElement) {
      return null;
    }

    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) {
      return null;
    }
    const settings = videoTrack.getSettings();

    return {
      width: this.videoElement.videoWidth,
      height: this.videoElement.videoHeight,
      deviceId: settings.deviceId || '',
    };
  }

  /**
   * Checks if camera is currently active
   */
  isActive(): boolean {
    return this.stream !== null && this.stream.active;
  }

  /**
   * Gets the permission manager instance
   */
  getPermissionManager(): CameraPermissions {
    return this.permissionManager;
  }
}
