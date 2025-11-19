/**
 * API Endpoint: KMS-Backed Encryption
 * 
 * Provides secure encryption services using Google Cloud KMS
 * Runtime: Node.js Serverless
 * 
 * SECURITY: This endpoint should be protected with authentication
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kmsEncrypt, kmsEncryptBatch } from '../../packages/backend/src/services/kmsEncryption';
import { initializeKMS } from '../../packages/backend/src/services/kms';

/**
 * Encrypt data using KMS-backed hybrid encryption
 * 
 * POST /api/kms/encrypt
 * 
 * Request Body:
 * {
 *   data?: string;              // Single data string to encrypt
 *   fields?: Record<string, string>; // Multiple fields to encrypt
 * }
 * 
 * Response:
 * {
 *   success: boolean;
 *   encrypted?: KMSEncryptionResult | Record<string, KMSEncryptionResult>;
 *   error?: string;
 * }
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Initialize KMS
    initializeKMS();

    const { data, fields } = req.body;

    // Validate input - must have either data or fields
    if (!data && !fields) {
      return res.status(400).json({
        success: false,
        error: 'Either data or fields parameter is required'
      });
    }

    if (data && fields) {
      return res.status(400).json({
        success: false,
        error: 'Cannot specify both data and fields parameters'
      });
    }

    // Single data encryption
    if (data) {
      if (typeof data !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Data parameter must be a string'
        });
      }

      const encrypted = await kmsEncrypt(data);
      
      return res.status(200).json({
        success: true,
        encrypted
      });
    }

    // Batch field encryption
    if (fields) {
      if (typeof fields !== 'object' || Array.isArray(fields)) {
        return res.status(400).json({
          success: false,
          error: 'Fields parameter must be an object'
        });
      }

      const encrypted = await kmsEncryptBatch(fields);
      
      return res.status(200).json({
        success: true,
        encrypted
      });
    }

  } catch (error) {
    console.error('KMS encryption API error:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Encryption failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
