/**
 * File Validation Utilities
 * 
 * Backend validation for uploaded files:
 * - Magic byte MIME detection
 * - Allowed extensions check
 * - File size limits
 * - Metadata validation
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  metadata?: {
    detectedMimeType?: string;
    fileSize: number;
    extension?: string;
  };
}

export interface ValidationOptions {
  maxFileSize?: number;
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  requireMagicByteMatch?: boolean;
}

// Default configuration
const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const DEFAULT_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
];
const DEFAULT_ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

/**
 * Magic byte signatures for common file types
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  'image/jpeg': [
    [0xff, 0xd8, 0xff],
  ],
  'image/png': [
    [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  ],
  'image/webp': [
    // RIFF....WEBP
    [0x52, 0x49, 0x46, 0x46, -1, -1, -1, -1, 0x57, 0x45, 0x42, 0x50],
  ],
  'application/pdf': [
    [0x25, 0x50, 0x44, 0x46], // %PDF
  ],
};

/**
 * Detects MIME type from magic bytes
 */
export function detectMimeTypeFromMagicBytes(buffer: Buffer): string | null {
  const bytes = new Uint8Array(buffer);

  for (const [mimeType, signatures] of Object.entries(MAGIC_BYTES)) {
    for (const signature of signatures) {
      if (matchesSignature(bytes, signature)) {
        return mimeType;
      }
    }
  }

  return null;
}

/**
 * Checks if bytes match a signature pattern
 */
function matchesSignature(bytes: Uint8Array, signature: number[]): boolean {
  if (bytes.length < signature.length) {
    return false;
  }

  for (let i = 0; i < signature.length; i++) {
    if (signature[i] !== -1 && bytes[i] !== signature[i]) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) {
    return '';
  }
  return filename.slice(lastDot).toLowerCase();
}

/**
 * Validates file size
 */
export function validateFileSize(
  fileSize: number,
  maxSize: number = DEFAULT_MAX_FILE_SIZE
): ValidationResult {
  if (fileSize > maxSize) {
    return {
      valid: false,
      error: `File size ${formatBytes(fileSize)} exceeds maximum of ${formatBytes(maxSize)}`,
      metadata: { fileSize },
    };
  }

  if (fileSize === 0) {
    return {
      valid: false,
      error: 'File is empty',
      metadata: { fileSize },
    };
  }

  return {
    valid: true,
    metadata: { fileSize },
  };
}

/**
 * Validates file extension
 */
export function validateExtension(
  filename: string,
  allowedExtensions: string[] = DEFAULT_ALLOWED_EXTENSIONS
): ValidationResult {
  const extension = getFileExtension(filename);

  if (!extension) {
    return {
      valid: false,
      error: 'File has no extension',
      metadata: { fileSize: 0, extension: '' },
    };
  }

  if (!allowedExtensions.includes(extension)) {
    return {
      valid: false,
      error: `File extension ${extension} not allowed. Allowed: ${allowedExtensions.join(', ')}`,
      metadata: { fileSize: 0, extension },
    };
  }

  return {
    valid: true,
    metadata: { fileSize: 0, extension },
  };
}

/**
 * Validates MIME type
 */
export function validateMimeType(
  mimeType: string,
  allowedTypes: string[] = DEFAULT_ALLOWED_MIME_TYPES
): ValidationResult {
  if (!allowedTypes.includes(mimeType)) {
    return {
      valid: false,
      error: `MIME type ${mimeType} not allowed. Allowed: ${allowedTypes.join(', ')}`,
      metadata: { fileSize: 0, detectedMimeType: mimeType },
    };
  }

  return {
    valid: true,
    metadata: { fileSize: 0, detectedMimeType: mimeType },
  };
}

/**
 * Comprehensive file validation
 */
export function validateFile(
  filename: string,
  fileBuffer: Buffer,
  declaredMimeType: string,
  options: ValidationOptions = {}
): ValidationResult {
  const {
    maxFileSize = DEFAULT_MAX_FILE_SIZE,
    allowedMimeTypes = DEFAULT_ALLOWED_MIME_TYPES,
    allowedExtensions = DEFAULT_ALLOWED_EXTENSIONS,
    requireMagicByteMatch = true,
  } = options;

  const warnings: string[] = [];

  // Validate file size
  const sizeValidation = validateFileSize(fileBuffer.length, maxFileSize);
  if (!sizeValidation.valid) {
    return sizeValidation;
  }

  // Validate extension
  const extensionValidation = validateExtension(filename, allowedExtensions);
  if (!extensionValidation.valid) {
    return extensionValidation;
  }

  // Validate declared MIME type
  const mimeValidation = validateMimeType(declaredMimeType, allowedMimeTypes);
  if (!mimeValidation.valid) {
    return mimeValidation;
  }

  // Detect actual MIME type from magic bytes
  const detectedMimeType = detectMimeTypeFromMagicBytes(fileBuffer);

  if (!detectedMimeType) {
    if (requireMagicByteMatch) {
      return {
        valid: false,
        error: 'Could not detect file type from magic bytes',
        metadata: {
          fileSize: fileBuffer.length,
          extension: getFileExtension(filename),
        },
      };
    } else {
      warnings.push('Could not detect file type from magic bytes');
    }
  }

  // Verify magic bytes match declared MIME type
  if (detectedMimeType && detectedMimeType !== declaredMimeType) {
    if (requireMagicByteMatch) {
      return {
        valid: false,
        error: `File type mismatch: declared ${declaredMimeType} but detected ${detectedMimeType}`,
        metadata: {
          fileSize: fileBuffer.length,
          extension: getFileExtension(filename),
          detectedMimeType,
        },
      };
    } else {
      warnings.push(
        `MIME type mismatch: declared ${declaredMimeType} but detected ${detectedMimeType}`
      );
    }
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
    metadata: {
      fileSize: fileBuffer.length,
      extension: getFileExtension(filename),
      detectedMimeType: detectedMimeType || undefined,
    },
  };
}

/**
 * Helper: Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
