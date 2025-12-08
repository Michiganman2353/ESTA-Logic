/**
 * Native Camera Capture for Capacitor
 * 
 * This module provides native camera access for mobile apps using Capacitor.
 * It serves as a fallback or enhanced option for native mobile platforms.
 * 
 * Installation required:
 * npm install @capacitor/camera
 * npx cap sync
 */

import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface NativeCaptureOptions {
  /** Quality of the output image (0-100) */
  quality?: number;
  /** Allow editing before returning */
  allowEditing?: boolean;
  /** Result type (uri, base64, or dataUrl) */
  resultType?: CameraResultType;
  /** Source (camera or photos) */
  source?: CameraSource;
  /** Width to resize image to */
  width?: number;
  /** Height to resize image to */
  height?: number;
}

export interface NativeCaptureResult {
  /** Image data as base64, dataUrl, or file URI */
  data: string;
  /** Format of the image */
  format: string;
  /** Whether the result is from native platform */
  isNative: boolean;
}

/**
 * Check if native camera capture is available
 */
export const isNativeCaptureAvailable = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * Capture image using native camera
 * 
 * @param options Capture options
 * @returns Promise with captured image data
 */
export const captureNative = async (
  options: NativeCaptureOptions = {}
): Promise<NativeCaptureResult> => {
  if (!isNativeCaptureAvailable()) {
    throw new Error('Native capture not available on this platform');
  }

  try {
    const image = await Camera.getPhoto({
      quality: options.quality || 90,
      allowEditing: options.allowEditing || false,
      resultType: options.resultType || CameraResultType.DataUrl,
      source: options.source || CameraSource.Camera,
      width: options.width,
      height: options.height,
      saveToGallery: false,
      correctOrientation: true,
    });

    return {
      data: image.dataUrl || image.base64String || image.path || '',
      format: image.format,
      isNative: true,
    };
  } catch (error) {
    console.error('Native capture error:', error);
    throw error;
  }
};

/**
 * Request camera permissions
 * 
 * @returns Promise with permission status
 */
export const requestCameraPermissions = async (): Promise<boolean> => {
  if (!isNativeCaptureAvailable()) {
    return false;
  }

  try {
    const permissions = await Camera.requestPermissions();
    return permissions.camera === 'granted';
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
};

/**
 * Check camera permissions status
 * 
 * @returns Promise with current permission status
 */
export const checkCameraPermissions = async (): Promise<boolean> => {
  if (!isNativeCaptureAvailable()) {
    return false;
  }

  try {
    const permissions = await Camera.checkPermissions();
    return permissions.camera === 'granted';
  } catch (error) {
    console.error('Permission check error:', error);
    return false;
  }
};

/**
 * Convert data URL to Blob
 * 
 * @param dataUrl Data URL string
 * @returns Blob object
 */
export const dataUrlToBlob = (dataUrl: string): Blob => {
  const arr = dataUrl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

/**
 * Convert data URL to File
 * 
 * @param dataUrl Data URL string
 * @param filename Filename for the file
 * @returns File object
 */
export const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename, { type: blob.type });
};

/**
 * Capture document using native camera with document-optimized settings
 * 
 * @returns Promise with captured document as File
 */
export const captureDocument = async (): Promise<File> => {
  const result = await captureNative({
    quality: 95,
    allowEditing: true,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Camera,
    width: 1920,
    height: 1080,
  });

  return dataUrlToFile(result.data, `document-${Date.now()}.${result.format}`);
};

/**
 * Pick document from gallery
 * 
 * @returns Promise with selected document as File
 */
export const pickDocument = async (): Promise<File> => {
  const result = await captureNative({
    quality: 95,
    allowEditing: false,
    resultType: CameraResultType.DataUrl,
    source: CameraSource.Photos,
  });

  return dataUrlToFile(result.data, `document-${Date.now()}.${result.format}`);
};

export default {
  isNativeCaptureAvailable,
  captureNative,
  requestCameraPermissions,
  checkCameraPermissions,
  dataUrlToBlob,
  dataUrlToFile,
  captureDocument,
  pickDocument,
};
