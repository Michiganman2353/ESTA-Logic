/**
 * Document Upload Backend Module
 *
 * Export all backend document upload functionality
 */

export {
  validateFile,
  validateFileSize,
  validateExtension,
  validateMimeType,
  detectMimeTypeFromMagicBytes,
  getFileExtension,
} from './file-validation';
export type { ValidationResult, ValidationOptions } from './file-validation';

export {
  scanFile,
  shouldAcceptFile,
  createScanCacheKey,
  scheduleBackgroundScan,
} from './antivirus-scan';
export type { ScanResult, ScanOptions } from './antivirus-scan';

export {
  generateSignedUploadUrl,
  verifyUploadCompleted,
  deleteFile,
  getFileMetadata,
} from './secure-routing';
export type {
  SignedUrlRequest,
  SignedUrlResponse,
  SignedUrlOptions,
} from './secure-routing';

export {
  logAuditEvent,
  logUploadSuccess,
  logUploadFailure,
  logScanResult,
  logDocumentAccess,
  logDocumentDeletion,
  logSecurityEvent,
  queryAuditLogs,
} from './audit-logging';
export type { AuditLogEntry, AuditLogOptions } from './audit-logging';
