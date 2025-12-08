/**
 * Camera Permission Manager
 * 
 * Handles camera permission requests with platform-specific quirks:
 * - Safari/iOS permission prompts
 * - Android WebView permission handling
 * - Permission denial recovery
 * - Feature detection for getUserMedia
 */

export interface PermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
  error?: string;
}

export interface CameraPermissionManager {
  checkPermission(): Promise<PermissionStatus>;
  requestPermission(): Promise<PermissionStatus>;
  hasGetUserMediaSupport(): boolean;
}

/**
 * Checks if getUserMedia is supported in the current browser
 */
export function hasGetUserMediaSupport(): boolean {
  return !!(
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia
  );
}

/**
 * Checks current camera permission state
 * Note: Not all browsers support the Permissions API
 */
export async function checkCameraPermission(): Promise<PermissionStatus> {
  // Feature detection for Permissions API
  if (!navigator.permissions || !navigator.permissions.query) {
    // Fallback: assume prompt state if API not available
    return {
      granted: false,
      denied: false,
      prompt: true,
    };
  }

  try {
    const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
    
    return {
      granted: result.state === 'granted',
      denied: result.state === 'denied',
      prompt: result.state === 'prompt',
    };
  } catch (error) {
    // Safari and some browsers don't support camera permission query
    // Return prompt state as fallback
    return {
      granted: false,
      denied: false,
      prompt: true,
      error: error instanceof Error ? error.message : 'Permission check failed',
    };
  }
}

/**
 * Requests camera permission from the user
 * Handles platform-specific quirks and error cases
 */
export async function requestCameraPermission(): Promise<PermissionStatus> {
  if (!hasGetUserMediaSupport()) {
    return {
      granted: false,
      denied: true,
      prompt: false,
      error: 'getUserMedia not supported in this browser',
    };
  }

  try {
    // Request camera access - this will trigger permission prompt
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment', // Prefer back camera on mobile
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      },
    });

    // Permission granted - stop the stream immediately
    stream.getTracks().forEach(track => track.stop());

    return {
      granted: true,
      denied: false,
      prompt: false,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Check for specific denial errors
    if (
      error instanceof DOMException &&
      (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError')
    ) {
      return {
        granted: false,
        denied: true,
        prompt: false,
        error: 'Camera permission denied by user',
      };
    }

    // Device not found or other errors
    return {
      granted: false,
      denied: false,
      prompt: false,
      error: errorMessage,
    };
  }
}

/**
 * Safari-specific permission handling
 * Safari requires user interaction before requesting permissions
 */
export function requiresUserInteraction(): boolean {
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  
  return isSafari || isIOS;
}

/**
 * Creates a user-friendly error message based on permission state
 */
export function getPermissionErrorMessage(status: PermissionStatus): string {
  if (status.denied) {
    if (requiresUserInteraction()) {
      return 'Camera access denied. Please go to Settings > Safari > Camera and allow access for this website.';
    }
    return 'Camera access denied. Please check your browser settings and allow camera access.';
  }

  if (status.error?.includes('not supported')) {
    return 'Your browser does not support camera access. Please use a modern browser like Chrome, Firefox, or Safari.';
  }

  if (status.error) {
    return `Camera error: ${status.error}`;
  }

  return 'Unable to access camera. Please check your permissions.';
}

/**
 * Complete permission manager with state tracking
 */
export class CameraPermissions implements CameraPermissionManager {
  private _currentStatus: PermissionStatus | null = null;

  async checkPermission(): Promise<PermissionStatus> {
    this._currentStatus = await checkCameraPermission();
    return this._currentStatus;
  }

  async requestPermission(): Promise<PermissionStatus> {
    this._currentStatus = await requestCameraPermission();
    return this._currentStatus;
  }

  hasGetUserMediaSupport(): boolean {
    return hasGetUserMediaSupport();
  }

  get currentStatus(): PermissionStatus | null {
    return this._currentStatus;
  }
}
