/**
 * Encryption Middleware
 * 
 * Provides middleware for automatic encryption/decryption of sensitive fields
 * Uses KMS-backed encryption for secure key management
 * 
 * @module encryptionMiddleware
 */

import { Request, Response, NextFunction } from 'express';
import { kmsEncrypt, kmsDecrypt, kmsEncryptBatch, kmsDecryptBatch, KMSEncryptionResult, KMSDecryptionPayload } from '../services/kmsEncryption.js';

/**
 * Fields that should be encrypted in requests/responses
 */
export const SENSITIVE_FIELDS = [
  'ssn',
  'socialSecurityNumber',
  'taxId',
  'ein',
  'bankAccount',
  'routingNumber',
  'address',
  'phone',
  'phoneNumber',
  'medicalInfo',
  'healthInfo',
  'salary',
  'compensation',
  'password',
  'secret',
] as const;

/**
 * Check if a field name should be encrypted
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerFieldName = fieldName.toLowerCase();
  return SENSITIVE_FIELDS.some(sensitive => 
    lowerFieldName.includes(sensitive.toLowerCase())
  );
}

/**
 * Recursively encrypt sensitive fields in an object
 * 
 * @param obj - Object to encrypt
 * @param fieldsToEncrypt - Optional array of specific fields to encrypt
 * @returns Object with encrypted fields
 */
async function encryptObject(
  obj: any,
  fieldsToEncrypt?: string[]
): Promise<any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => encryptObject(item, fieldsToEncrypt)));
  }

  const encrypted: any = { ...obj };
  const fieldsToProcess = fieldsToEncrypt || Object.keys(obj).filter(isSensitiveField);

  for (const field of fieldsToProcess) {
    if (obj[field] !== undefined && obj[field] !== null) {
      const value = obj[field];
      
      // Skip if already encrypted (has wrappedKey property)
      if (typeof value === 'object' && 'wrappedKey' in value) {
        continue;
      }

      // Encrypt the field
      try {
        if (typeof value === 'string') {
          encrypted[field] = await kmsEncrypt(value);
        } else if (typeof value === 'object') {
          // Recursively encrypt nested objects
          encrypted[field] = await encryptObject(value, fieldsToEncrypt);
        }
      } catch (error) {
        console.error(`Failed to encrypt field ${field}:`, error);
        throw new Error(`Encryption failed for field: ${field}`);
      }
    }
  }

  return encrypted;
}

/**
 * Recursively decrypt encrypted fields in an object
 * 
 * @param obj - Object with encrypted fields
 * @param fieldsToDecrypt - Optional array of specific fields to decrypt
 * @returns Object with decrypted fields
 */
async function decryptObject(
  obj: any,
  fieldsToDecrypt?: string[]
): Promise<any> {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return Promise.all(obj.map(item => decryptObject(item, fieldsToDecrypt)));
  }

  const decrypted: any = { ...obj };
  const fieldsToProcess = fieldsToDecrypt || Object.keys(obj);

  for (const field of fieldsToProcess) {
    if (obj[field] !== undefined && obj[field] !== null) {
      const value = obj[field];
      
      // Check if field is encrypted (has wrappedKey property)
      if (typeof value === 'object' && 'wrappedKey' in value) {
        try {
          decrypted[field] = await kmsDecrypt(value as KMSDecryptionPayload);
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          throw new Error(`Decryption failed for field: ${field}`);
        }
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Recursively decrypt nested objects
        decrypted[field] = await decryptObject(value, fieldsToDecrypt);
      }
    }
  }

  return decrypted;
}

/**
 * Middleware to automatically encrypt sensitive fields in request body
 * 
 * Looks for sensitive fields (SSN, tax ID, etc.) and encrypts them
 * before passing to the route handler
 * 
 * @example
 * ```typescript
 * router.post('/employees', 
 *   encryptRequestMiddleware(['ssn', 'address']),
 *   createEmployeeHandler
 * );
 * ```
 */
export function encryptRequestMiddleware(fieldsToEncrypt?: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (req.body && Object.keys(req.body).length > 0) {
        req.body = await encryptObject(req.body, fieldsToEncrypt);
      }
      next();
    } catch (error) {
      console.error('Request encryption middleware error:', error);
      res.status(500).json({
        error: 'Failed to encrypt request data',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Middleware to automatically decrypt sensitive fields in response data
 * 
 * Intercepts response and decrypts encrypted fields before sending to client
 * Only decrypts for authorized users
 * 
 * @example
 * ```typescript
 * router.get('/employees/:id', 
 *   authenticate,
 *   getEmployeeHandler,
 *   decryptResponseMiddleware(['ssn', 'address'])
 * );
 * ```
 */
export function decryptResponseMiddleware(fieldsToDecrypt?: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json method to decrypt before sending
    res.json = function(data: any) {
      // Decrypt data asynchronously
      decryptObject(data, fieldsToDecrypt)
        .then(decrypted => originalJson(decrypted))
        .catch(error => {
          console.error('Response decryption middleware error:', error);
          res.status(500).json({
            error: 'Failed to decrypt response data',
            message: error instanceof Error ? error.message : 'Unknown error'
          });
        });
      
      return res;
    };

    next();
  };
}

/**
 * Middleware to encrypt specific fields in request
 * 
 * More granular control than automatic encryption
 * Only encrypts explicitly specified fields
 * 
 * @example
 * ```typescript
 * router.post('/employee-pii',
 *   encryptFieldsMiddleware(['ssn', 'taxId', 'bankAccount']),
 *   savePIIHandler
 * );
 * ```
 */
export function encryptFieldsMiddleware(fields: string[]) {
  return encryptRequestMiddleware(fields);
}

/**
 * Middleware to decrypt specific fields in response
 * 
 * More granular control than automatic decryption
 * Only decrypts explicitly specified fields
 * 
 * @example
 * ```typescript
 * router.get('/employee-pii/:id',
 *   authenticate,
 *   authorize(['admin', 'employer']),
 *   getPIIHandler,
 *   decryptFieldsMiddleware(['ssn', 'taxId'])
 * );
 * ```
 */
export function decryptFieldsMiddleware(fields: string[]) {
  return decryptResponseMiddleware(fields);
}

/**
 * Utility function to encrypt a batch of fields
 * 
 * Use in route handlers for manual encryption
 * 
 * @param data - Object with fields to encrypt
 * @param fields - Array of field names to encrypt
 * @returns Object with encrypted fields
 * 
 * @example
 * ```typescript
 * const encrypted = await encryptFields(employeeData, ['ssn', 'address']);
 * await db.collection('employees').doc(id).set(encrypted);
 * ```
 */
export async function encryptFields(
  data: Record<string, any>,
  fields: string[]
): Promise<Record<string, any>> {
  const result = { ...data };
  
  for (const field of fields) {
    if (result[field] !== undefined && result[field] !== null) {
      result[field] = await kmsEncrypt(result[field]);
    }
  }
  
  return result;
}

/**
 * Utility function to decrypt a batch of fields
 * 
 * Use in route handlers for manual decryption
 * 
 * @param data - Object with encrypted fields
 * @param fields - Array of field names to decrypt
 * @returns Object with decrypted fields
 * 
 * @example
 * ```typescript
 * const employee = await db.collection('employees').doc(id).get();
 * const decrypted = await decryptFields(employee.data(), ['ssn', 'address']);
 * res.json(decrypted);
 * ```
 */
export async function decryptFields(
  data: Record<string, any>,
  fields: string[]
): Promise<Record<string, any>> {
  const result = { ...data };
  
  for (const field of fields) {
    if (result[field] && typeof result[field] === 'object' && 'wrappedKey' in result[field]) {
      result[field] = await kmsDecrypt(result[field] as KMSDecryptionPayload);
    }
  }
  
  return result;
}

/**
 * Check if data contains encrypted fields
 * 
 * @param data - Data to check
 * @returns True if data contains encrypted fields
 */
export function hasEncryptedFields(data: any): boolean {
  if (!data || typeof data !== 'object') {
    return false;
  }

  if (Array.isArray(data)) {
    return data.some(hasEncryptedFields);
  }

  for (const value of Object.values(data)) {
    if (typeof value === 'object' && value !== null) {
      if ('wrappedKey' in value && 'encryptedData' in value && 'iv' in value) {
        return true;
      }
      if (hasEncryptedFields(value)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Sanitize object by removing sensitive fields for logging
 * 
 * @param data - Data to sanitize
 * @returns Sanitized data safe for logging
 */
export function sanitizeForLogging(data: any): any {
  if (!data || typeof data !== 'object') {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeForLogging);
  }

  const sanitized: any = {};
  
  for (const [key, value] of Object.entries(data)) {
    if (isSensitiveField(key)) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      if ('wrappedKey' in value) {
        sanitized[key] = '[ENCRYPTED]';
      } else {
        sanitized[key] = sanitizeForLogging(value);
      }
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
