/**
 * Utility functions for Vercel cron jobs
 */
import { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Verify that the request is from Vercel Cron
 * Uses the Authorization header with a bearer token
 */
export function verifyCronRequest(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  
  // In production, Vercel sets CRON_SECRET
  const cronSecret = process.env.CRON_SECRET;
  
  // If no secret is set (development), allow the request
  if (!cronSecret) {
    console.warn('CRON_SECRET not set - skipping verification (dev mode)');
    return true;
  }
  
  // Verify the Authorization header
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  
  const token = authHeader.substring(7);
  return token === cronSecret;
}

/**
 * Standard error response for cron jobs
 */
export function sendErrorResponse(
  res: VercelResponse,
  statusCode: number,
  message: string,
  error?: any
): void {
  console.error('Cron job error:', message, error);
  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Standard success response for cron jobs
 */
export function sendSuccessResponse(
  res: VercelResponse,
  message: string,
  data?: any
): void {
  res.status(200).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Log cron job execution to Firestore
 */
export async function logCronExecution(
  db: FirebaseFirestore.Firestore,
  jobName: string,
  success: boolean,
  details?: any
): Promise<void> {
  try {
    await db.collection('cronJobs').add({
      jobName,
      success,
      details,
      executedAt: new Date(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log cron execution:', error);
  }
}
