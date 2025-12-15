/**
 * Document Capture Feature
 *
 * Production-grade document capture with:
 * - Unified camera abstraction (desktop/mobile)
 * - Image quality processing (OpenCV.js)
 * - Secure upload pipeline
 * - Mobile fallbacks (Safari/Android)
 */

export { CameraController } from './camera.controller';
export type {
  CameraDevice,
  CameraConstraints,
  CameraControllerOptions,
} from './camera.controller';

export { CameraView } from './camera.view';
export type { CameraViewProps } from './camera.view';

export {
  processDocument,
  loadOpenCV,
  isOpenCVReady,
} from './document-processor';
export type {
  ProcessingOptions,
  ProcessedDocument,
} from './document-processor';

export {
  validateFile,
  validateMagicBytes,
  uploadToFirebase,
  uploadWithSignedUrl,
} from './secure-uploader';
export type {
  UploadOptions,
  UploadProgress,
  UploadResult,
  SignedUrlResponse,
} from './secure-uploader';

export {
  needsMobileFallback,
  processImageFile,
  createMobileCaptureInput,
  createFallbackCaptureButton,
  detectMobileBrowserQuirks,
  getRecommendedCaptureStrategy,
} from './mobile-fallback';
export type { MobileFallbackOptions, ProcessedImage } from './mobile-fallback';

export {
  CameraPermissions,
  checkCameraPermission,
  requestCameraPermission,
  hasGetUserMediaSupport,
  requiresUserInteraction,
  getPermissionErrorMessage,
} from './permissions';
export type { PermissionStatus, CameraPermissionManager } from './permissions';
