/**
 * Unit tests for secure uploader module
 */

import { describe, it, expect } from 'vitest';
import { validateFile, validateMagicBytes } from '../secure-uploader';

describe('Secure Uploader', () => {
  describe('validateFile', () => {
    it('should accept valid JPEG file', () => {
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG file', () => {
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const result = validateFile(file);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject file that exceeds size limit', () => {
      // Create a file larger than default 10MB
      const largeContent = new Uint8Array(11 * 1024 * 1024); // 11MB
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should reject empty file', () => {
      const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('empty');
    });

    it('should reject disallowed MIME type', () => {
      const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' });
      const result = validateFile(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });

    it('should respect custom max size', () => {
      const file = new File([new Uint8Array(1000)], 'test.jpg', { type: 'image/jpeg' });
      
      const result = validateFile(file, { maxFileSize: 500 });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('should respect custom allowed MIME types', () => {
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      
      const result = validateFile(file, {
        allowedMimeTypes: ['image/jpeg', 'image/png'],
      });

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('validateMagicBytes', () => {
    it('should detect JPEG from magic bytes', async () => {
      const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
      const file = new File([jpegHeader], 'test.jpg', { type: 'image/jpeg' });
      
      const result = await validateMagicBytes(file);

      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/jpeg');
    });

    it('should detect PNG from magic bytes', async () => {
      const pngHeader = new Uint8Array([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      ]);
      const file = new File([pngHeader], 'test.png', { type: 'image/png' });
      
      const result = await validateMagicBytes(file);

      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/png');
    });

    it('should detect WebP from magic bytes', async () => {
      const webpHeader = new Uint8Array([
        0x52, 0x49, 0x46, 0x46, // RIFF
        0x00, 0x00, 0x00, 0x00, // size
        0x57, 0x45, 0x42, 0x50, // WEBP
      ]);
      const file = new File([webpHeader], 'test.webp', { type: 'image/webp' });
      
      const result = await validateMagicBytes(file);

      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('image/webp');
    });

    it('should detect PDF from magic bytes', async () => {
      const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // %PDF
      const file = new File([pdfHeader], 'test.pdf', { type: 'application/pdf' });
      
      const result = await validateMagicBytes(file);

      expect(result.valid).toBe(true);
      expect(result.detectedType).toBe('application/pdf');
    });

    it('should reject unrecognized file type', async () => {
      const unknownHeader = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
      const file = new File([unknownHeader], 'test.bin', { type: 'application/octet-stream' });
      
      const result = await validateMagicBytes(file);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('not recognized');
    });
  });
});
