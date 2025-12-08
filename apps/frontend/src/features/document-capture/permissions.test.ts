/**
 * Unit tests for camera permissions module
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  hasGetUserMediaSupport,
  checkCameraPermission,
  requestCameraPermission,
  requiresUserInteraction,
  getPermissionErrorMessage,
  CameraPermissions,
} from './permissions';

describe('Camera Permissions', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();
  });

  describe('hasGetUserMediaSupport', () => {
    it('should return true when getUserMedia is supported', () => {
      const mockGetUserMedia = vi.fn();
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      expect(hasGetUserMediaSupport()).toBe(true);
    });

    it('should return false when getUserMedia is not supported', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      expect(hasGetUserMediaSupport()).toBe(false);
    });
  });

  describe('checkCameraPermission', () => {
    it('should return prompt state when Permissions API is not available', async () => {
      Object.defineProperty(navigator, 'permissions', {
        value: undefined,
        writable: true,
      });

      const result = await checkCameraPermission();

      expect(result.granted).toBe(false);
      expect(result.denied).toBe(false);
      expect(result.prompt).toBe(true);
    });

    it('should return granted state when permission is granted', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' });
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true,
      });

      const result = await checkCameraPermission();

      expect(result.granted).toBe(true);
      expect(result.denied).toBe(false);
      expect(result.prompt).toBe(false);
    });

    it('should return denied state when permission is denied', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ state: 'denied' });
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true,
      });

      const result = await checkCameraPermission();

      expect(result.granted).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.prompt).toBe(false);
    });
  });

  describe('requestCameraPermission', () => {
    it('should return denied when getUserMedia is not supported', async () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: undefined,
        writable: true,
      });

      const result = await requestCameraPermission();

      expect(result.granted).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.error).toContain('not supported');
    });

    it('should return granted when permission is allowed', async () => {
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: vi.fn().mockReturnValue([mockTrack]),
      };
      const mockGetUserMedia = vi.fn().mockResolvedValue(mockStream);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      const result = await requestCameraPermission();

      expect(result.granted).toBe(true);
      expect(result.denied).toBe(false);
      expect(mockTrack.stop).toHaveBeenCalled();
    });

    it('should return denied when permission is denied by user', async () => {
      const error = new DOMException('Permission denied', 'NotAllowedError');
      const mockGetUserMedia = vi.fn().mockRejectedValue(error);

      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: mockGetUserMedia },
        writable: true,
      });

      const result = await requestCameraPermission();

      expect(result.granted).toBe(false);
      expect(result.denied).toBe(true);
      expect(result.error).toContain('denied');
    });
  });

  describe('requiresUserInteraction', () => {
    it('should return true for Safari', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15',
        writable: true,
      });

      expect(requiresUserInteraction()).toBe(true);
    });

    it('should return true for iOS', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
        writable: true,
      });

      expect(requiresUserInteraction()).toBe(true);
    });

    it('should return false for Chrome', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        writable: true,
      });

      expect(requiresUserInteraction()).toBe(false);
    });
  });

  describe('getPermissionErrorMessage', () => {
    it('should return Safari-specific message for denied permission on Safari', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Safari/605.1.15',
        writable: true,
      });

      const message = getPermissionErrorMessage({
        granted: false,
        denied: true,
        prompt: false,
      });

      expect(message).toContain('Settings');
      expect(message).toContain('Safari');
    });

    it('should return generic message for denied permission on other browsers', () => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Chrome/120.0.0.0',
        writable: true,
      });

      const message = getPermissionErrorMessage({
        granted: false,
        denied: true,
        prompt: false,
      });

      expect(message).toContain('browser settings');
    });

    it('should return not supported message when error indicates lack of support', () => {
      const message = getPermissionErrorMessage({
        granted: false,
        denied: false,
        prompt: false,
        error: 'getUserMedia not supported',
      });

      expect(message).toContain('not support');
      expect(message).toContain('modern browser');
    });
  });

  describe('CameraPermissions class', () => {
    it('should track permission status', async () => {
      const mockQuery = vi.fn().mockResolvedValue({ state: 'granted' });
      Object.defineProperty(navigator, 'permissions', {
        value: { query: mockQuery },
        writable: true,
      });

      const manager = new CameraPermissions();
      await manager.checkPermission();

      expect(manager.currentStatus?.granted).toBe(true);
    });

    it('should return getUserMedia support status', () => {
      Object.defineProperty(navigator, 'mediaDevices', {
        value: { getUserMedia: vi.fn() },
        writable: true,
      });

      const manager = new CameraPermissions();
      expect(manager.hasGetUserMediaSupport()).toBe(true);
    });
  });
});
