import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { DocumentScanner } from './DocumentScanner';

// Mock getUserMedia
const mockGetUserMedia = vi.fn();

// Mock canvas methods
const mockToBlob = vi.fn();
const mockGetContext = vi.fn();

// Mock URL methods
global.URL.createObjectURL = vi.fn(() => 'mock-blob-url');
global.URL.revokeObjectURL = vi.fn();

// Mock crypto.subtle
const mockEncrypt = vi.fn();
global.crypto.subtle = {
  encrypt: mockEncrypt,
} as any;

// Mock crypto.getRandomValues
global.crypto.getRandomValues = vi.fn((arr: Uint8Array) => {
  for (let i = 0; i < arr.length; i++) {
    arr[i] = Math.floor(Math.random() * 256);
  }
  return arr;
});

// Mock canvas context
const mockContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn(() => ({
    data: new Uint8ClampedArray(100),
    width: 10,
    height: 10,
  })),
  save: vi.fn(),
  restore: vi.fn(),
  scale: vi.fn(),
};

beforeEach(() => {
  // Reset mocks
  mockGetUserMedia.mockReset();
  mockToBlob.mockReset();
  mockGetContext.mockReset();
  mockEncrypt.mockReset();
  vi.clearAllMocks();

  // Setup navigator.mediaDevices
  Object.defineProperty(global.navigator, 'mediaDevices', {
    writable: true,
    configurable: true,
    value: {
      getUserMedia: mockGetUserMedia,
    },
  });

  // Setup canvas mocks
  mockGetContext.mockReturnValue(mockContext);
  HTMLCanvasElement.prototype.getContext = mockGetContext;
  HTMLCanvasElement.prototype.toBlob = mockToBlob;
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('DocumentScanner Component', () => {
  describe('Initial Render', () => {
    it('should render setup step initially', () => {
      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      expect(screen.getByText('Document Scanner')).toBeInTheDocument();
      expect(screen.getByText('Start Camera')).toBeInTheDocument();
      expect(screen.getByText(/Position document on a flat surface/i)).toBeInTheDocument();
    });

    it('should show edge detection info when enabled', () => {
      const onDocumentScanned = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={onDocumentScanned}
          enableEdgeDetection={true}
        />
      );

      expect(screen.getByText(/Auto edge detection enabled/i)).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      const onCancel = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={vi.fn()}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('Camera Access', () => {
    it('should start camera when button is clicked', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(mockGetUserMedia).toHaveBeenCalledWith({
          video: {
            facingMode: 'environment',
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
      });

      // Should transition to capture step
      await waitFor(() => {
        expect(screen.getByText('Position Document')).toBeInTheDocument();
      });
    });

    it('should show error when camera access fails', async () => {
      mockGetUserMedia.mockRejectedValue(new Error('Permission denied'));

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Unable to access camera/i)).toBeInTheDocument();
      });
    });

    it('should handle camera permissions error gracefully', async () => {
      mockGetUserMedia.mockRejectedValue(new DOMException('NotAllowedError'));

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Unable to access camera/i)).toBeInTheDocument();
      });
    });
  });

  describe('Zoom Control', () => {
    it('should render zoom control in capture step', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText(/Zoom: 1.0x/i)).toBeInTheDocument();
      });
    });

    it('should update zoom value when slider changes', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        const zoomSlider = screen.getByRole('slider');
        expect(zoomSlider).toBeInTheDocument();
      });

      const zoomSlider = screen.getByRole('slider') as HTMLInputElement;
      fireEvent.change(zoomSlider, { target: { value: '2.0' } });

      await waitFor(() => {
        expect(screen.getByText(/Zoom: 2.0x/i)).toBeInTheDocument();
      });
    });
  });

  describe('Document Capture', () => {
    it('should capture document when button is clicked', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const mockBlob = new Blob(['test'], { type: 'image/webp' });
      mockToBlob.mockImplementation((callback) => callback(mockBlob));

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      // Start camera
      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture Document')).toBeInTheDocument();
      });

      // Mock video element
      const video = document.querySelector('video');
      if (video) {
        Object.defineProperty(video, 'videoWidth', { value: 1920 });
        Object.defineProperty(video, 'videoHeight', { value: 1080 });
      }

      // Capture document
      const captureButton = screen.getByText('Capture Document');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(mockToBlob).toHaveBeenCalled();
      });
    });

    it('should show processing state during capture', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      mockToBlob.mockImplementation((callback) => {
        setTimeout(() => callback(new Blob(['test'], { type: 'image/webp' })), 100);
      });

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture Document')).toBeInTheDocument();
      });

      const captureButton = screen.getByText('Capture Document');
      fireEvent.click(captureButton);

      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    it('should show error for file size exceeding limit', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      // Create large blob (11MB)
      const largeBlob = new Blob(['a'.repeat(11 * 1024 * 1024)], { type: 'image/webp' });
      mockToBlob.mockImplementation((callback) => callback(largeBlob));

      const onDocumentScanned = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={onDocumentScanned}
          maxFileSize={10 * 1024 * 1024}
        />
      );

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture Document')).toBeInTheDocument();
      });

      const video = document.querySelector('video');
      if (video) {
        Object.defineProperty(video, 'videoWidth', { value: 1920 });
        Object.defineProperty(video, 'videoHeight', { value: 1080 });
      }

      const captureButton = screen.getByText('Capture Document');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(screen.getByText(/exceeds maximum/i)).toBeInTheDocument();
      });
    });
  });

  describe('Preview and Confirmation', () => {
    it('should show preview after successful capture', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const mockBlob = new Blob(['test'], { type: 'image/webp' });
      mockToBlob.mockImplementation((callback) => callback(mockBlob));

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture Document')).toBeInTheDocument();
      });

      const video = document.querySelector('video');
      if (video) {
        Object.defineProperty(video, 'videoWidth', { value: 1920 });
        Object.defineProperty(video, 'videoHeight', { value: 1080 });
      }

      const captureButton = screen.getByText('Capture Document');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(screen.getByText('Review Document')).toBeInTheDocument();
        expect(screen.getByText('Retake')).toBeInTheDocument();
        expect(screen.getByText('Confirm & Upload')).toBeInTheDocument();
      });
    });

    it('should show metadata in preview', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const mockBlob = new Blob(['test'], { type: 'image/webp' });
      mockToBlob.mockImplementation((callback) => callback(mockBlob));

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture Document')).toBeInTheDocument();
      });

      const video = document.querySelector('video');
      if (video) {
        Object.defineProperty(video, 'videoWidth', { value: 1920 });
        Object.defineProperty(video, 'videoHeight', { value: 1080 });
      }

      const captureButton = screen.getByText('Capture Document');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(screen.getByText(/Format: WEBP/i)).toBeInTheDocument();
        expect(screen.getByText(/File size:/i)).toBeInTheDocument();
      });
    });

    it('should allow retake from preview', async () => {
      const mockStream = {
        getTracks: () => [],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const mockBlob = new Blob(['test'], { type: 'image/webp' });
      mockToBlob.mockImplementation((callback) => callback(mockBlob));

      const onDocumentScanned = vi.fn();
      render(<DocumentScanner onDocumentScanned={onDocumentScanned} />);

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Capture Document')).toBeInTheDocument();
      });

      const video = document.querySelector('video');
      if (video) {
        Object.defineProperty(video, 'videoWidth', { value: 1920 });
        Object.defineProperty(video, 'videoHeight', { value: 1080 });
      }

      const captureButton = screen.getByText('Capture Document');
      fireEvent.click(captureButton);

      await waitFor(() => {
        expect(screen.getByText('Review Document')).toBeInTheDocument();
      });

      // Mock stream again for retake
      mockGetUserMedia.mockResolvedValue(mockStream);

      const retakeButton = screen.getByText('Retake');
      fireEvent.click(retakeButton);

      await waitFor(() => {
        expect(screen.getByText('Position Document')).toBeInTheDocument();
      });
    });
  });

  describe('Cancel Functionality', () => {
    it('should call onCancel when cancel button is clicked', () => {
      const onCancel = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={vi.fn()}
          onCancel={onCancel}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(onCancel).toHaveBeenCalled();
    });

    it('should stop camera stream on cancel', async () => {
      const mockTrack = { stop: vi.fn() };
      const mockStream = {
        getTracks: () => [mockTrack],
      };
      mockGetUserMedia.mockResolvedValue(mockStream);

      const onCancel = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={vi.fn()}
          onCancel={onCancel}
        />
      );

      const startButton = screen.getByText('Start Camera');
      fireEvent.click(startButton);

      await waitFor(() => {
        expect(screen.getByText('Position Document')).toBeInTheDocument();
      });

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(onCancel).toHaveBeenCalled();
    });
  });

  describe('Custom Props', () => {
    it('should accept custom compression quality', () => {
      const onDocumentScanned = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={onDocumentScanned}
          compressionQuality={0.8}
        />
      );

      expect(screen.getByText('Document Scanner')).toBeInTheDocument();
    });

    it('should accept custom max file size', () => {
      const onDocumentScanned = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={onDocumentScanned}
          maxFileSize={5 * 1024 * 1024}
        />
      );

      expect(screen.getByText('Document Scanner')).toBeInTheDocument();
    });

    it('should work with edge detection disabled', () => {
      const onDocumentScanned = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={onDocumentScanned}
          enableEdgeDetection={false}
        />
      );

      expect(screen.queryByText(/Auto edge detection enabled/i)).not.toBeInTheDocument();
    });

    it('should work with perspective correction disabled', () => {
      const onDocumentScanned = vi.fn();
      render(
        <DocumentScanner
          onDocumentScanned={onDocumentScanned}
          enablePerspectiveCorrection={false}
        />
      );

      expect(screen.getByText('Document Scanner')).toBeInTheDocument();
    });
  });
});
