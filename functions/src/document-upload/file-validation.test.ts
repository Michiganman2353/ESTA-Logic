/**
 * Unit tests for file validation module
 */

import { describe, it, expect } from 'vitest';
import {
  detectMimeTypeFromMagicBytes,
  getFileExtension,
  validateFileSize,
  validateExtension,
  validateMimeType,
  validateFile,
} from '../file-validation';

describe('File Validation', () => {
  describe('detectMimeTypeFromMagicBytes', () => {
    it('should detect JPEG from magic bytes', () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      const mimeType = detectMimeTypeFromMagicBytes(buffer);

      expect(mimeType).toBe('image/jpeg');
    });

    it('should detect PNG from magic bytes', () => {
      const buffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const mimeType = detectMimeTypeFromMagicBytes(buffer);

      expect(mimeType).toBe('image/png');
    });

    it('should detect WebP from magic bytes', () => {
      const buffer = Buffer.from([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // size (wildcards)
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      const mimeType = detectMimeTypeFromMagicBytes(buffer);

      expect(mimeType).toBe('image/webp');
    });

    it('should detect PDF from magic bytes', () => {
      const buffer = Buffer.from([0x25, 0x50, 0x44, 0x46]); // %PDF
      const mimeType = detectMimeTypeFromMagicBytes(buffer);

      expect(mimeType).toBe('application/pdf');
    });

    it('should return null for unrecognized file type', () => {
      const buffer = Buffer.from([0x00, 0x00, 0x00, 0x00]);
      const mimeType = detectMimeTypeFromMagicBytes(buffer);

      expect(mimeType).toBeNull();
    });
  });

  describe('getFileExtension', () => {
    it('should extract extension from filename', () => {
      expect(getFileExtension('test.jpg')).toBe('.jpg');
      expect(getFileExtension('document.pdf')).toBe('.pdf');
      expect(getFileExtension('image.PNG')).toBe('.png');
    });

    it('should handle files with multiple dots', () => {
      expect(getFileExtension('my.file.name.jpg')).toBe('.jpg');
    });

    it('should return empty string for files without extension', () => {
      expect(getFileExtension('noextension')).toBe('');
    });
  });

  describe('validateFileSize', () => {
    it('should accept valid file size', () => {
      const result = validateFileSize(1024 * 1024); // 1MB
      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding max size', () => {
      const result = validateFileSize(11 * 1024 * 1024); // 11MB (default max is 10MB)
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject empty file', () => {
      const result = validateFileSize(0);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should respect custom max size', () => {
      const result = validateFileSize(1000, 500);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateExtension', () => {
    it('should accept allowed extensions', () => {
      expect(validateExtension('test.jpg').valid).toBe(true);
      expect(validateExtension('test.png').valid).toBe(true);
      expect(validateExtension('test.pdf').valid).toBe(true);
    });

    it('should reject disallowed extensions', () => {
      const result = validateExtension('malware.exe');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should reject files without extension', () => {
      const result = validateExtension('noextension');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('no extension');
    });

    it('should respect custom allowed extensions', () => {
      const result = validateExtension('test.pdf', ['.jpg', '.png']);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateMimeType', () => {
    it('should accept allowed MIME types', () => {
      expect(validateMimeType('image/jpeg').valid).toBe(true);
      expect(validateMimeType('image/png').valid).toBe(true);
      expect(validateMimeType('application/pdf').valid).toBe(true);
    });

    it('should reject disallowed MIME types', () => {
      const result = validateMimeType('application/x-msdownload');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should respect custom allowed MIME types', () => {
      const result = validateMimeType('image/jpeg', ['application/pdf']);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should accept valid JPEG file', () => {
      const buffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0,
        ...Array(1000).fill(0x00),
      ]);
      
      const result = validateFile(
        'test.jpg',
        buffer,
        'image/jpeg'
      );

      expect(result.valid).toBe(true);
    });

    it('should detect MIME type mismatch', () => {
      // PNG magic bytes but declared as JPEG
      const buffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ...Array(1000).fill(0x00),
      ]);
      
      const result = validateFile(
        'fake.jpg',
        buffer,
        'image/jpeg',
        { requireMagicByteMatch: true }
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('mismatch');
    });

    it('should warn about MIME type mismatch when not required', () => {
      const buffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        ...Array(1000).fill(0x00),
      ]);
      
      const result = validateFile(
        'fake.jpg',
        buffer,
        'image/jpeg',
        { requireMagicByteMatch: false }
      );

      expect(result.valid).toBe(true);
      expect(result.warnings).toBeDefined();
      expect(result.warnings?.[0]).toContain('mismatch');
    });

    it('should validate all constraints together', () => {
      const buffer = Buffer.from([
        0xff, 0xd8, 0xff, 0xe0,
        ...Array(1000).fill(0x00),
      ]);
      
      const result = validateFile(
        'test.jpg',
        buffer,
        'image/jpeg',
        {
          maxFileSize: 2000,
          allowedExtensions: ['.jpg', '.png'],
          allowedMimeTypes: ['image/jpeg', 'image/png'],
        }
      );

      expect(result.valid).toBe(true);
      expect(result.metadata?.fileSize).toBe(buffer.length);
      expect(result.metadata?.extension).toBe('.jpg');
      expect(result.metadata?.detectedMimeType).toBe('image/jpeg');
    });

    it('should reject file with invalid extension', () => {
      const buffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);
      
      const result = validateFile(
        'test.exe',
        buffer,
        'image/jpeg'
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('extension');
    });
  });
});
