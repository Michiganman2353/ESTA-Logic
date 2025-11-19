/**
 * KMS-Backed Encryption Service
 * 
 * Implements hybrid encryption using Google Cloud KMS for key management
 * Combines AES-256-GCM (data encryption) with KMS (key wrapping)
 * 
 * Workflow:
 * 1. Generate random AES-256 key for data encryption
 * 2. Encrypt data with AES-GCM (fast, efficient)
 * 3. Wrap AES key using Google Cloud KMS (secure key management)
 * 4. Store encrypted data + wrapped key
 * 
 * @module kmsEncryption
 */

import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { getKMS, KMSService } from './kms.js';

/**
 * KMS-backed encryption result
 */
export interface KMSEncryptionResult {
  encryptedData: string;      // Base64-encoded AES-GCM encrypted data
  wrappedKey: string;          // Base64-encoded KMS-wrapped AES key
  iv: string;                  // Base64-encoded initialization vector
  authTag: string;             // Base64-encoded authentication tag
  keyVersion?: string;         // KMS key version used for wrapping
}

/**
 * KMS-backed decryption payload
 */
export interface KMSDecryptionPayload {
  encryptedData: string;      // Base64-encoded encrypted data
  wrappedKey: string;          // Base64-encoded KMS-wrapped AES key
  iv: string;                  // Base64-encoded initialization vector
  authTag: string;             // Base64-encoded authentication tag
  keyVersion?: string;         // KMS key version to use for unwrapping
}

/**
 * Encrypt data using KMS-backed hybrid encryption
 * 
 * Process:
 * 1. Generate random AES-256 key (DEK - Data Encryption Key)
 * 2. Encrypt data with AES-256-GCM using DEK
 * 3. Wrap DEK using Google Cloud KMS
 * 4. Return encrypted data + wrapped key + metadata
 * 
 * This ensures:
 * - Fast data encryption (AES-GCM is hardware-accelerated)
 * - Secure key management (keys never stored in plaintext)
 * - Centralized access control (via KMS IAM)
 * - Key rotation support (KMS manages key versions)
 * 
 * @param data - Data to encrypt (string or Buffer)
 * @param kmsService - Optional KMS service instance (uses singleton if not provided)
 * @returns KMS encryption result with all components
 * 
 * @example
 * ```typescript
 * // Encrypt sensitive employee data
 * const encrypted = await kmsEncrypt('SSN: 123-45-6789');
 * 
 * // Store in database
 * await db.collection('employees').doc(employeeId).update({
 *   ssn: encrypted
 * });
 * ```
 */
export async function kmsEncrypt(
  data: string | Buffer,
  kmsService?: KMSService
): Promise<KMSEncryptionResult> {
  try {
    const kms = kmsService || getKMS();

    // Step 1: Generate random AES-256 key (32 bytes)
    const aesKey = randomBytes(32);

    // Step 2: Generate random IV (12 bytes for GCM)
    const iv = randomBytes(12);

    // Step 3: Convert data to buffer if needed
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;

    // Step 4: Encrypt data with AES-256-GCM
    const cipher = createCipheriv('aes-256-gcm', aesKey, iv);
    const encryptedData = Buffer.concat([
      cipher.update(dataBuffer),
      cipher.final()
    ]);
    const authTag = cipher.getAuthTag();

    // Step 5: Wrap AES key using KMS
    const wrappedKey = await kms.encrypt(aesKey);

    // Step 6: Return all components
    return {
      encryptedData: encryptedData.toString('base64'),
      wrappedKey: wrappedKey, // Already base64 from KMS
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  } catch (error) {
    console.error('KMS encryption error:', error);
    throw new Error(`KMS-backed encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Decrypt data using KMS-backed hybrid decryption
 * 
 * Process:
 * 1. Unwrap AES key using Google Cloud KMS
 * 2. Decrypt data with AES-256-GCM using unwrapped key
 * 3. Verify authentication tag (ensures data integrity)
 * 4. Return decrypted data
 * 
 * @param payload - KMS encryption payload
 * @param kmsService - Optional KMS service instance (uses singleton if not provided)
 * @returns Decrypted data as string
 * 
 * @throws Error if KMS unwrapping fails, authentication fails, or data is corrupted
 * 
 * @example
 * ```typescript
 * // Retrieve from database
 * const encrypted = await db.collection('employees').doc(employeeId).get();
 * 
 * // Decrypt sensitive data
 * const ssn = await kmsDecrypt(encrypted.data().ssn);
 * console.log(ssn); // "SSN: 123-45-6789"
 * ```
 */
export async function kmsDecrypt(
  payload: KMSDecryptionPayload,
  kmsService?: KMSService
): Promise<string> {
  try {
    const kms = kmsService || getKMS();

    // Step 1: Convert base64 strings to buffers
    const encryptedData = Buffer.from(payload.encryptedData, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');

    // Step 2: Unwrap AES key using KMS
    const aesKey = await kms.decrypt(payload.wrappedKey);

    // Step 3: Decrypt data with AES-256-GCM
    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);

    const decryptedData = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    // Step 4: Convert buffer to string and return
    return decryptedData.toString('utf8');
  } catch (error) {
    console.error('KMS decryption error:', error);
    throw new Error(`KMS-backed decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Encrypt file or large binary data using KMS-backed encryption
 * 
 * @param data - Binary data to encrypt
 * @param kmsService - Optional KMS service instance
 * @returns KMS encryption result
 * 
 * @example
 * ```typescript
 * import { readFile } from 'fs/promises';
 * 
 * const fileData = await readFile('sensitive-document.pdf');
 * const encrypted = await kmsEncryptFile(fileData);
 * 
 * // Store encrypted file in Cloud Storage or database
 * ```
 */
export async function kmsEncryptFile(
  data: Buffer,
  kmsService?: KMSService
): Promise<KMSEncryptionResult> {
  return kmsEncrypt(data, kmsService);
}

/**
 * Decrypt file or large binary data using KMS-backed decryption
 * 
 * @param payload - KMS encryption payload
 * @param kmsService - Optional KMS service instance
 * @returns Decrypted binary data
 * 
 * @example
 * ```typescript
 * const decryptedData = await kmsDecryptFile(encrypted);
 * await writeFile('decrypted-document.pdf', decryptedData);
 * ```
 */
export async function kmsDecryptFile(
  payload: KMSDecryptionPayload,
  kmsService?: KMSService
): Promise<Buffer> {
  try {
    const kms = kmsService || getKMS();

    const encryptedData = Buffer.from(payload.encryptedData, 'base64');
    const iv = Buffer.from(payload.iv, 'base64');
    const authTag = Buffer.from(payload.authTag, 'base64');

    const aesKey = await kms.decrypt(payload.wrappedKey);

    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(authTag);

    return Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);
  } catch (error) {
    console.error('KMS file decryption error:', error);
    throw new Error(`KMS-backed file decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Batch encrypt multiple fields
 * 
 * Efficiently encrypts multiple fields with separate keys
 * Useful for encrypting multiple PII fields in a single operation
 * 
 * @param fields - Object with field names and values to encrypt
 * @param kmsService - Optional KMS service instance
 * @returns Object with field names and encrypted values
 * 
 * @example
 * ```typescript
 * const encrypted = await kmsEncryptBatch({
 *   ssn: '123-45-6789',
 *   address: '123 Main St',
 *   phone: '555-1234'
 * });
 * 
 * // Store in database
 * await db.collection('employees').doc(id).update({
 *   encryptedFields: encrypted
 * });
 * ```
 */
export async function kmsEncryptBatch(
  fields: Record<string, string>,
  kmsService?: KMSService
): Promise<Record<string, KMSEncryptionResult>> {
  const kms = kmsService || getKMS();
  const encrypted: Record<string, KMSEncryptionResult> = {};

  for (const [key, value] of Object.entries(fields)) {
    encrypted[key] = await kmsEncrypt(value, kms);
  }

  return encrypted;
}

/**
 * Batch decrypt multiple fields
 * 
 * @param fields - Object with field names and encrypted values
 * @param kmsService - Optional KMS service instance
 * @returns Object with field names and decrypted values
 * 
 * @example
 * ```typescript
 * const encrypted = await db.collection('employees').doc(id).get();
 * const decrypted = await kmsDecryptBatch(encrypted.data().encryptedFields);
 * 
 * console.log(decrypted.ssn);     // '123-45-6789'
 * console.log(decrypted.address); // '123 Main St'
 * console.log(decrypted.phone);   // '555-1234'
 * ```
 */
export async function kmsDecryptBatch(
  fields: Record<string, KMSDecryptionPayload>,
  kmsService?: KMSService
): Promise<Record<string, string>> {
  const kms = kmsService || getKMS();
  const decrypted: Record<string, string> = {};

  for (const [key, value] of Object.entries(fields)) {
    decrypted[key] = await kmsDecrypt(value, kms);
  }

  return decrypted;
}

/**
 * Re-encrypt data with a new KMS key version (key rotation)
 * 
 * Used during key rotation to migrate data to new key versions
 * 
 * @param payload - Existing encrypted payload
 * @param oldKmsService - KMS service configured with old key version
 * @param newKmsService - KMS service configured with new key version
 * @returns New encrypted payload with updated key version
 * 
 * @example
 * ```typescript
 * // During key rotation
 * const oldKMS = new KMSService({ ...config, keyVersion: '1' });
 * const newKMS = new KMSService({ ...config, keyVersion: '2' });
 * 
 * const reEncrypted = await kmsReencrypt(oldPayload, oldKMS, newKMS);
 * 
 * // Update database
 * await db.collection('employees').doc(id).update({ ssn: reEncrypted });
 * ```
 */
export async function kmsReencrypt(
  payload: KMSDecryptionPayload,
  oldKmsService?: KMSService,
  newKmsService?: KMSService
): Promise<KMSEncryptionResult> {
  // Decrypt with old key
  const plaintext = await kmsDecrypt(payload, oldKmsService);
  
  // Re-encrypt with new key
  return kmsEncrypt(plaintext, newKmsService);
}
