/**
 * Mobile Fallback Mechanisms
 *
 * Provides fallback solutions for browsers that don't support getUserMedia:
 * - Safari/iOS file input with capture="environment"
 * - Android WebView fallbacks
 * - Blob to canvas processing
 * - EXIF-based rotation fix
 * - Feature detection
 */

export interface MobileFallbackOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  acceptedTypes?: string[];
}

export interface ProcessedImage {
  blob: Blob;
  width: number;
  height: number;
  orientation: number;
}

/**
 * Detects if we need to use mobile fallback
 */
export function needsMobileFallback(): boolean {
  // Check for getUserMedia support
  const hasGetUserMedia = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );

  if (hasGetUserMedia) {
    return false;
  }

  // Check for mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return isMobile;
}

/**
 * Creates a file input element with mobile-optimized capture
 */
export function createMobileCaptureInput(
  options: MobileFallbackOptions = {}
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = (
    options.acceptedTypes || ['image/jpeg', 'image/png', 'image/webp']
  ).join(',');

  // Use capture attribute for direct camera access on mobile
  input.setAttribute('capture', 'environment');

  return input;
}

/**
 * Reads EXIF orientation from image file
 */
async function getImageOrientation(file: File): Promise<number> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const view = new DataView(e.target?.result as ArrayBuffer);

      if (view.getUint16(0, false) !== 0xffd8) {
        resolve(1); // Not a JPEG, no EXIF
        return;
      }

      const length = view.byteLength;
      let offset = 2;

      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) {
          resolve(1);
          return;
        }

        const marker = view.getUint16(offset, false);
        offset += 2;

        if (marker === 0xffe1) {
          // EXIF marker found
          const little = view.getUint16((offset += 6), false) === 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;

          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + i * 12, little) === 0x0112) {
              // Orientation tag found
              const orientation = view.getUint16(offset + i * 12 + 8, little);
              resolve(orientation);
              return;
            }
          }
        } else if ((marker & 0xff00) !== 0xff00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }

      resolve(1); // Default orientation
    };

    reader.onerror = () => resolve(1);
    reader.readAsArrayBuffer(file.slice(0, 64 * 1024)); // Read first 64KB for EXIF
  });
}

/**
 * Processes image file with orientation correction
 */
export async function processImageFile(
  file: File,
  options: MobileFallbackOptions = {}
): Promise<ProcessedImage> {
  const { maxWidth = 1920, maxHeight = 1080, quality = 0.92 } = options;

  // Read orientation from EXIF
  const orientation = await getImageOrientation(file);

  // Load image
  const img = await loadImage(file);

  // Create canvas for processing
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  // Calculate dimensions respecting max size
  let { width, height } = img;

  if (width > maxWidth || height > maxHeight) {
    const ratio = Math.min(maxWidth / width, maxHeight / height);
    width *= ratio;
    height *= ratio;
  }

  // Set canvas size based on orientation
  if (orientation >= 5 && orientation <= 8) {
    // Swap dimensions for rotated images
    canvas.width = height;
    canvas.height = width;
  } else {
    canvas.width = width;
    canvas.height = height;
  }

  // Apply orientation transform
  applyOrientation(ctx, orientation, width, height);

  // Draw image
  ctx.drawImage(img, 0, 0, width, height);

  // Convert to blob
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) {
          resolve(result);
        } else {
          reject(new Error('Failed to convert canvas to blob'));
        }
      },
      'image/jpeg',
      quality
    );
  });

  return {
    blob,
    width: canvas.width,
    height: canvas.height,
    orientation,
  };
}

/**
 * Loads an image from a file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

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

/**
 * Applies orientation transform to canvas context
 */
function applyOrientation(
  ctx: CanvasRenderingContext2D,
  orientation: number,
  width: number,
  height: number
): void {
  switch (orientation) {
    case 2:
      // Flip horizontal
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      break;
    case 3:
      // Rotate 180°
      ctx.translate(width, height);
      ctx.rotate(Math.PI);
      break;
    case 4:
      // Flip vertical
      ctx.translate(0, height);
      ctx.scale(1, -1);
      break;
    case 5:
      // Rotate 90° and flip horizontal
      ctx.rotate(0.5 * Math.PI);
      ctx.scale(1, -1);
      break;
    case 6:
      // Rotate 90°
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(0, -height);
      break;
    case 7:
      // Rotate 270° and flip horizontal
      ctx.rotate(0.5 * Math.PI);
      ctx.translate(width, -height);
      ctx.scale(-1, 1);
      break;
    case 8:
      // Rotate 270°
      ctx.rotate(-0.5 * Math.PI);
      ctx.translate(-width, 0);
      break;
    default:
      // No transformation
      break;
  }
}

/**
 * Creates a fallback capture button that triggers file input
 */
export function createFallbackCaptureButton(
  onCapture: (file: File) => void,
  options: MobileFallbackOptions = {}
): HTMLButtonElement {
  const button = document.createElement('button');
  button.textContent = 'Capture Document';
  button.type = 'button';

  const input = createMobileCaptureInput(options);
  input.style.display = 'none';

  input.addEventListener('change', async () => {
    const file = input.files?.[0];
    if (file) {
      onCapture(file);
    }
  });

  button.addEventListener('click', () => {
    input.click();
  });

  // Keep input in DOM for iOS compatibility
  document.body.appendChild(input);

  return button;
}

/**
 * Detects specific mobile browser quirks
 */
export function detectMobileBrowserQuirks(): {
  isIOS: boolean;
  isSafari: boolean;
  isAndroidWebView: boolean;
  isChrome: boolean;
} {
  const ua = navigator.userAgent;

  return {
    isIOS: /iPad|iPhone|iPod/.test(ua),
    isSafari: /^((?!chrome|android).)*safari/i.test(ua),
    isAndroidWebView: /Android.*wv/.test(ua),
    isChrome: /Chrome/.test(ua) && /Google Inc/.test(navigator.vendor),
  };
}

/**
 * Gets recommended capture strategy based on device
 */
export function getRecommendedCaptureStrategy():
  | 'getUserMedia'
  | 'fileInput'
  | 'fallback' {
  const hasGetUserMedia = !!(
    navigator.mediaDevices && navigator.mediaDevices.getUserMedia
  );

  const quirks = detectMobileBrowserQuirks();

  // Modern browsers with full support
  if (hasGetUserMedia && !quirks.isIOS && !quirks.isAndroidWebView) {
    return 'getUserMedia';
  }

  // iOS Safari - getUserMedia supported but file input often better UX
  if (quirks.isIOS && quirks.isSafari) {
    return 'fileInput';
  }

  // Android WebView - may have limited support
  if (quirks.isAndroidWebView) {
    return hasGetUserMedia ? 'getUserMedia' : 'fileInput';
  }

  // Fallback for older browsers
  return 'fallback';
}
