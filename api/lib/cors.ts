import { VercelResponse } from '@vercel/node';

/**
 * Allowed CORS origins for all API endpoints
 */
export const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://estatracker.com',
  'https://www.estatracker.com',
];

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string): boolean {
  return ALLOWED_ORIGINS.includes(origin) || origin.endsWith('.vercel.app');
}

/**
 * Set CORS headers on response
 */
export function setCorsHeaders(res: VercelResponse, origin: string): void {
  if (isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
}

/**
 * Handle preflight OPTIONS request
 */
export function handlePreflight(res: VercelResponse, origin: string): void {
  setCorsHeaders(res, origin);
  res.status(200).end();
}
