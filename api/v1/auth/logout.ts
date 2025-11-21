import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCorsHeaders, handlePreflight } from '../../lib/cors';

/**
 * Logout API Endpoint
 * POST /api/v1/auth/logout
 * 
 * Note: Actual logout is handled on the client side by Firebase Auth SDK
 * This endpoint is mainly for consistency and future extensions
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Set CORS headers
  const origin = req.headers.origin || '';
  setCorsHeaders(res, origin);

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return handlePreflight(res, origin);
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Logout is handled client-side with Firebase Auth SDK
  // This endpoint just confirms successful logout
  return res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}
