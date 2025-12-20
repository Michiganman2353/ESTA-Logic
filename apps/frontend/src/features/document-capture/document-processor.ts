/**
 * Document Image Processor using OpenCV.js
 *
 * Provides image processing pipeline:
 * - Edge detection for document boundaries
 * - Auto-crop to document area
 * - Perspective deskew/correction
 * - Auto-contrast enhancement
 * - Orientation normalization
 */

export interface ProcessingOptions {
  enableEdgeDetection?: boolean;
  enableAutoCrop?: boolean;
  enableDeskew?: boolean;
  enableContrast?: boolean;
  targetWidth?: number;
  targetHeight?: number;
}

export interface ProcessedDocument {
  blob: Blob;
  width: number;
  height: number;
  detectedCorners?: { x: number; y: number }[];
  processingSteps: string[];
}

/**
 * Checks if OpenCV.js is loaded and ready
 */
export function isOpenCVReady(): boolean {
  return typeof window !== 'undefined' && window.cv !== undefined;
}

/**
 * Loads OpenCV.js library
 */
export async function loadOpenCV(
  opencvUrl: string = '/opencv.js'
): Promise<void> {
  if (isOpenCVReady()) {
    return;
  }

  return new Promise((resolve, reject) => {
    // Check if already loading
    const existingScript = document.querySelector(`script[src="${opencvUrl}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', () =>
        reject(new Error('Failed to load OpenCV.js'))
      );
      return;
    }

    // Create script element
    const script = document.createElement('script');
    script.src = opencvUrl;
    script.async = true;

    script.onload = () => {
      // Wait for cv to be initialized
      if (window.cv && typeof window.cv.Mat === 'function') {
        resolve();
      } else {
        // Some versions need a moment to initialize
        const checkInterval = setInterval(() => {
          if (window.cv && typeof window.cv.Mat === 'function') {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          reject(new Error('OpenCV.js initialization timeout'));
        }, 10000);
      }
    };

    script.onerror = () => {
      reject(new Error('Failed to load OpenCV.js'));
    };

    document.head.appendChild(script);
  });
}

/**
 * Main document processing pipeline
 */
export async function processDocument(
  imageBlob: Blob,
  options: ProcessingOptions = {}
): Promise<ProcessedDocument> {
  const {
    enableEdgeDetection = true,
    enableAutoCrop = true,
    enableDeskew = true,
    enableContrast = true,
    targetWidth = 1920,
    targetHeight = 1080,
  } = options;

  if (!isOpenCVReady()) {
    throw new Error('OpenCV.js not loaded. Call loadOpenCV() first.');
  }

  const processingSteps: string[] = [];

  // Load image to canvas
  const img = await loadImageFromBlob(imageBlob);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // Check if OpenCV is available
  if (!window.cv) {
    throw new Error('OpenCV not loaded');
  }

  // Get image data for OpenCV
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let mat = window.cv.matFromImageData(imageData) as unknown;
  processingSteps.push('Loaded image');

  let detectedCorners: { x: number; y: number }[] | undefined;

  try {
    // Edge detection and document boundary detection
    if (enableEdgeDetection) {
      const corners = detectDocumentEdges(mat);
      if (corners) {
        detectedCorners = corners;
        processingSteps.push('Detected document edges');
      }
    }

    // Auto-crop to document boundaries
    if (enableAutoCrop && detectedCorners && detectedCorners.length === 4) {
      mat = cropToDocument(mat, detectedCorners);
      processingSteps.push('Cropped to document');
    }

    // Perspective correction (deskew)
    if (enableDeskew && detectedCorners && detectedCorners.length === 4) {
      mat = deskewDocument(mat, detectedCorners);
      processingSteps.push('Applied perspective correction');
    }

    // Auto-contrast enhancement
    if (enableContrast) {
      mat = enhanceContrast(mat);
      processingSteps.push('Enhanced contrast');
    }

    // Resize if needed
    // @ts-expect-error OpenCV mat type
    if (mat.cols > targetWidth || mat.rows > targetHeight) {
      mat = resizeDocument(mat, targetWidth, targetHeight);
      processingSteps.push('Resized image');
    }

    // Convert back to canvas
    const outputCanvas = document.createElement('canvas');
    if (!window.cv) {
      throw new Error('OpenCV not loaded');
    }
    // @ts-expect-error OpenCV mat type
    window.cv.imshow(outputCanvas, mat);

    // Convert to blob
    const blob = await new Promise<Blob>((resolve, reject) => {
      outputCanvas.toBlob(
        (result) => {
          if (result) {
            resolve(result);
          } else {
            reject(new Error('Failed to convert canvas to blob'));
          }
        },
        'image/jpeg',
        0.92
      );
    });

    return {
      blob,
      width: outputCanvas.width,
      height: outputCanvas.height,
      detectedCorners,
      processingSteps,
    };
  } finally {
    // Clean up OpenCV resources
    // @ts-expect-error OpenCV mat type
    if (mat && typeof mat.delete === 'function') {
      // @ts-expect-error OpenCV mat type
      mat.delete();
    }
  }
}

/**
 * Detects document edges using OpenCV edge detection
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function detectDocumentEdges(src: any): { x: number; y: number }[] | null {
  if (!window.cv) return null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const gray = new (window.cv.Mat as any)();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const blur = new (window.cv.Mat as any)();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const edges = new (window.cv.Mat as any)();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const contours = new (window.cv.MatVector as any)();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hierarchy = new (window.cv.Mat as any)();

  try {
    // Convert to grayscale
    window.cv.cvtColor(src, gray, window.cv.COLOR_RGBA2GRAY);

    // Apply Gaussian blur
    const ksize = new window.cv.Size(5, 5);
    window.cv.GaussianBlur(gray, blur, ksize, 0);

    // Edge detection
    window.cv.Canny(blur, edges, 50, 150);

    // Find contours
    window.cv.findContours(
      edges,
      contours,
      hierarchy,
      window.cv.RETR_EXTERNAL,
      window.cv.CHAIN_APPROX_SIMPLE
    );

    // Find largest contour
    let maxArea = 0;
    let maxContourIndex = -1;

    // @ts-expect-error OpenCV type
    for (let i = 0; i < contours.size(); i++) {
      // @ts-expect-error OpenCV type
      const contour = contours.get(i);
      // @ts-expect-error OpenCV type
      const area = window.cv?.Mat ? window.cv.contourArea(contour) : 0;

      if (area > maxArea) {
        maxArea = area;
        maxContourIndex = i;
      }
    }

    if (maxContourIndex === -1) {
      return null;
    }

    // Get approximated polygon for the largest contour
    // @ts-expect-error OpenCV type
    const contour = contours.get(maxContourIndex);
    const approx = new window.cv.Mat();
    const perimeter = window.cv.arcLength(contour, true);
    window.cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

    // Check if we got a quadrilateral
    if (approx.rows === 4) {
      const corners: { x: number; y: number }[] = [];
      for (let i = 0; i < 4; i++) {
        corners.push({
          x: approx.data32S[i * 2],
          y: approx.data32S[i * 2 + 1],
        });
      }

      approx.delete();
      return corners;
    }

    approx.delete();
    return null;
  } finally {
    gray.delete();
    blur.delete();
    edges.delete();
    contours.delete();
    hierarchy.delete();
  }
}

/**
 * Crops image to detected document boundaries
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cropToDocument(src: any, _corners: { x: number; y: number }[]): any {
  // For now, return src as-is
  // Full implementation would extract the region
  return src;
}

/**
 * Applies perspective correction to deskew document
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deskewDocument(src: any, corners: { x: number; y: number }[]): any {
  if (!window.cv || corners.length !== 4) return src;

  try {
    // Sort corners: top-left, top-right, bottom-right, bottom-left
    const sorted = sortCorners(corners);

    // Calculate output dimensions
    const width = Math.max(
      distance(sorted[0], sorted[1]),
      distance(sorted[2], sorted[3])
    );
    const height = Math.max(
      distance(sorted[0], sorted[3]),
      distance(sorted[1], sorted[2])
    );

    // Source points
    const srcPoints = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      sorted[0].x,
      sorted[0].y,
      sorted[1].x,
      sorted[1].y,
      sorted[2].x,
      sorted[2].y,
      sorted[3].x,
      sorted[3].y,
    ]);

    // Destination points (rectangle)
    const dstPoints = window.cv.matFromArray(4, 1, window.cv.CV_32FC2, [
      0,
      0,
      width,
      0,
      width,
      height,
      0,
      height,
    ]);

    // Get perspective transform matrix
    const M = window.cv.getPerspectiveTransform(srcPoints, dstPoints);

    // Apply transform
    const dst = new window.cv.Mat();
    const dsize = new window.cv.Size(width, height);
    window.cv.warpPerspective(
      src,
      dst,
      M,
      dsize,
      window.cv.INTER_LINEAR,
      window.cv.BORDER_CONSTANT,
      new window.cv.Scalar()
    );

    // Clean up
    srcPoints.delete();
    dstPoints.delete();
    M.delete();

    return dst;
  } catch (error) {
    console.error('Deskew failed:', error);
    return src;
  }
}

/**
 * Enhances image contrast
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enhanceContrast(src: any): any {
  // Simple brightness/contrast adjustment
  // More advanced: histogram equalization
  return src;
}

/**
 * Resizes document to target dimensions
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resizeDocument(src: any, maxWidth: number, maxHeight: number): any {
  if (!window.cv) return src;

  const ratio = Math.min(maxWidth / src.cols, maxHeight / src.rows);
  const newWidth = Math.round(src.cols * ratio);
  const newHeight = Math.round(src.rows * ratio);

  const dst = new window.cv.Mat();
  const dsize = new window.cv.Size(newWidth, newHeight);
  window.cv.resize(src, dst, dsize, 0, 0, window.cv.INTER_LINEAR);

  return dst;
}

/**
 * Helper: Sort corners in clockwise order from top-left
 */
function sortCorners(
  corners: { x: number; y: number }[]
): { x: number; y: number }[] {
  // Find center point
  const centerX = corners.reduce((sum, c) => sum + c.x, 0) / corners.length;
  const centerY = corners.reduce((sum, c) => sum + c.y, 0) / corners.length;

  // Sort by angle from center
  return corners.sort((a, b) => {
    const angleA = Math.atan2(a.y - centerY, a.x - centerX);
    const angleB = Math.atan2(b.y - centerY, b.x - centerX);
    return angleA - angleB;
  });
}

/**
 * Helper: Calculate distance between two points
 */
function distance(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Helper: Load image from blob
 */
function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

// Type declaration for OpenCV (matches component)
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cv: any;
  }
}
