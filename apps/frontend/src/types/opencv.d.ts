/**
 * OpenCV Type Definitions
 * Shared types for OpenCV.js usage across the application
 */

export interface OpenCVInstance {
  Mat: new () => OpenCVMat;
  matFromImageData: (imageData: ImageData) => OpenCVMat;
  cvtColor: (src: OpenCVMat, dst: OpenCVMat, code: number) => void;
  GaussianBlur: (
    src: OpenCVMat,
    dst: OpenCVMat,
    size: OpenCVSize,
    sigma: number
  ) => void;
  Canny: (
    src: OpenCVMat,
    dst: OpenCVMat,
    threshold1: number,
    threshold2: number
  ) => void;
  findContours: (
    image: OpenCVMat,
    contours: OpenCVMatVector,
    hierarchy: OpenCVMat,
    mode: number,
    method: number
  ) => void;
  contourArea: (contour: OpenCVMat) => number;
  arcLength: (curve: OpenCVMat, closed: boolean) => number;
  approxPolyDP: (
    curve: OpenCVMat,
    approx: OpenCVMat,
    epsilon: number,
    closed: boolean
  ) => void;
  getPerspectiveTransform: (src: OpenCVMat, dst: OpenCVMat) => OpenCVMat;
  warpPerspective: (
    src: OpenCVMat,
    dst: OpenCVMat,
    M: OpenCVMat,
    dsize: OpenCVSize,
    flags: number,
    borderMode: number,
    borderValue: OpenCVScalar
  ) => void;
  imshow: (canvasElement: HTMLCanvasElement, mat: OpenCVMat) => void;
  resize: (
    src: OpenCVMat,
    dst: OpenCVMat,
    dsize: OpenCVSize,
    fx: number,
    fy: number,
    interpolation: number
  ) => void;
  MatVector: new () => OpenCVMatVector;
  Size: new (width: number, height: number) => OpenCVSize;
  Scalar: new () => OpenCVScalar;
  COLOR_RGBA2GRAY: number;
  RETR_EXTERNAL: number;
  CHAIN_APPROX_SIMPLE: number;
  INTER_LINEAR: number;
  BORDER_CONSTANT: number;
  CV_32FC2: number;
  matFromArray: (
    rows: number,
    cols: number,
    type: number,
    data: number[]
  ) => OpenCVMat;
}

export interface OpenCVMat {
  rows: number;
  cols: number;
  delete: () => void;
  data32F: Float32Array;
}

export interface OpenCVMatVector {
  size: () => number;
  get: (index: number) => OpenCVMat;
  delete: () => void;
}

export interface OpenCVSize {
  width: number;
  height: number;
}

export interface OpenCVScalar {
  // Scalar is a simple wrapper, using object as base type
  [key: string]: unknown;
}

declare global {
  interface Window {
    cv: OpenCVInstance | undefined;
  }
}
