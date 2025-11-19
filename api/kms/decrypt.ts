/**
 * API Endpoint: KMS-Backed Decryption
 * 
 * Provides secure decryption services using Google Cloud KMS
 * Runtime: Node.js Serverless
 * 
 * SECURITY: This endpoint MUST be protected with authentication and authorization
 * Only authorized users should be able to decrypt sensitive data
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kmsDecrypt, kmsDecryptBatch, KMSDecryptionPayload } from '../../packages/backend/src/services/kmsEncryption';
import { initializeKMS } from '../../packages/backend/src/services/kms';

/**
 * Decrypt data using KMS-backed hybrid decryption
 * 
 * POST /api/kms/decrypt
 * 
 * Request Body:
 * {
 *   payload?: KMSDecryptionPayload;              // Single encrypted payload
 *   fields?: Record<string, KMSDecryptionPayload>; // Multiple encrypted fields
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   decrypted?: string | Record<string, string>;
 *   error?: string;
 * }
 * 
 * IMPORTANT: Add authentication middleware before using in production
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // TODO: Add authentication check here
  // Example:
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // if (!token || !verifyToken(token)) {
  //   return res.status(401).json({ error: 'Unauthorized' });
  // }

  try {
    // Initialize KMS
    initializeKMS();

    const { payload, fields } = req.body;

    // Validate input - must have either payload or fields
    if (!payload && !fields) {
      return res.status(400).json({
        success: false,
        error: 'Either payload or fields parameter is required'
      });
    }

    if (payload && fields) {
      return res.status(400).json({
        success: false,
        error: 'Cannot specify both payload and fields parameters'
      });
    }

    // Single payload decryption
    if (payload) {
      if (typeof payload !== 'object') {
        return res.status(400).json({
          success: false,
          error: 'Payload parameter must be an object'
        });
      }

      // Validate payload structure
      const { encryptedData, wrappedKey, iv, authTag } = payload;
      if (!encryptedData || !wrappedKey || !iv || !authTag) {
        return res.status(400).json({
          success: false,
          error: 'Invalid payload structure. Must have encryptedData, wrappedKey, iv, and authTag'
        });
      }

      const decrypted = await kmsDecrypt(payload as KMSDecryptionPayload);
      
      return res.status(200).json({
        success: true,
        decrypted
      });
    }

    // Batch field decryption
    if (fields) {
      if (typeof fields !== 'object' || Array.isArray(fields)) {
        return res.status(400).json({
          success: false,
          error: 'Fields parameter must be an object'
        });
      }

      const decrypted = await kmsDecryptBatch(fields);
      
      return res.status(200).json({
        success: true,
        decrypted
      });
    }

  } catch (error) {
    console.error('KMS decryption API error:', error);
    
    // Don't leak detailed error messages in production
    return res.status(500).json({
      success: false,
      error: 'Decryption failed',
      message: process.env.NODE_ENV === 'development' 
        ? (error instanceof Error ? error.message : 'Unknown error')
        : 'Internal server error'
    });
  }
}
