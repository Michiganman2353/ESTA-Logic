/**
 * Google Cloud KMS Service
 * 
 * Provides secure key management using Google Cloud Key Management Service
 * Implements key lifecycle: generation, storage, rotation, and access control
 * 
 * @module kms
 */

import { KeyManagementServiceClient } from '@google-cloud/kms';
import { google } from '@google-cloud/kms/build/protos/protos';

/**
 * KMS Configuration
 */
export interface KMSConfig {
  projectId: string;
  locationId: string;
  keyRingId: string;
  cryptoKeyId: string;
  keyVersion?: string;
}

/**
 * KMS Key Version Info
 */
export interface KMSKeyVersion {
  name: string;
  state: string;
  createTime: Date;
  protectionLevel: string;
}

/**
 * Google Cloud KMS Service Client
 */
export class KMSService {
  private client: KeyManagementServiceClient;
  private config: KMSConfig;

  constructor(config: KMSConfig) {
    this.config = config;
    
    // Initialize KMS client with application default credentials
    // In production, this uses the service account configured for the GCP project
    this.client = new KeyManagementServiceClient();
  }

  /**
   * Get the full resource name for the crypto key
   */
  private getCryptoKeyName(): string {
    const { projectId, locationId, keyRingId, cryptoKeyId } = this.config;
    return this.client.cryptoKeyPath(projectId, locationId, keyRingId, cryptoKeyId);
  }

  /**
   * Get the full resource name for a specific key version
   */
  private getCryptoKeyVersionName(version?: string): string {
    const keyName = this.getCryptoKeyName();
    const versionToUse = version || this.config.keyVersion || '1';
    return `${keyName}/cryptoKeyVersions/${versionToUse}`;
  }

  /**
   * Encrypt data using KMS
   * 
   * This wraps a symmetric data encryption key (DEK) with the KMS key.
   * The DEK is used to encrypt the actual data.
   * 
   * @param plaintext - Data to encrypt (typically an AES key)
   * @returns Base64-encoded encrypted data
   */
  async encrypt(plaintext: Buffer): Promise<string> {
    try {
      const keyName = this.getCryptoKeyName();

      const [result] = await this.client.encrypt({
        name: keyName,
        plaintext: plaintext,
      });

      if (!result.ciphertext) {
        throw new Error('KMS encryption returned no ciphertext');
      }

      // Convert to base64 for storage
      return Buffer.from(result.ciphertext).toString('base64');
    } catch (error) {
      console.error('KMS encryption error:', error);
      throw new Error(`KMS encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Decrypt data using KMS
   * 
   * This unwraps a symmetric data encryption key (DEK) that was encrypted with KMS.
   * 
   * @param ciphertext - Base64-encoded encrypted data
   * @returns Decrypted plaintext as Buffer
   */
  async decrypt(ciphertext: string): Promise<Buffer> {
    try {
      const keyName = this.getCryptoKeyName();
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

      const [result] = await this.client.decrypt({
        name: keyName,
        ciphertext: ciphertextBuffer,
      });

      if (!result.plaintext) {
        throw new Error('KMS decryption returned no plaintext');
      }

      return Buffer.from(result.plaintext);
    } catch (error) {
      console.error('KMS decryption error:', error);
      throw new Error(`KMS decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the public key for asymmetric encryption
   * 
   * Note: For symmetric encrypt/decrypt, use encrypt() and decrypt() methods
   * For asymmetric operations, use getPublicKey() to get the public key,
   * then perform encryption client-side, and use asymmetricDecrypt() server-side
   * 
   * @returns Public key in PEM format
   */
  async getPublicKeyForAsymmetric(): Promise<string> {
    return this.getPublicKey();
  }

  /**
   * Asymmetric decrypt using KMS private key
   * 
   * Uses the private portion of an asymmetric key pair stored in KMS
   * The private key never leaves KMS
   * 
   * @param ciphertext - Base64-encoded encrypted data
   * @returns Decrypted plaintext as Buffer
   */
  async asymmetricDecrypt(ciphertext: string): Promise<Buffer> {
    try {
      const versionName = this.getCryptoKeyVersionName();
      const ciphertextBuffer = Buffer.from(ciphertext, 'base64');

      const [result] = await this.client.asymmetricDecrypt({
        name: versionName,
        ciphertext: ciphertextBuffer,
      });

      if (!result.plaintext) {
        throw new Error('KMS asymmetric decryption returned no plaintext');
      }

      return Buffer.from(result.plaintext);
    } catch (error) {
      console.error('KMS asymmetric decryption error:', error);
      throw new Error(`KMS asymmetric decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get the public key from KMS
   * 
   * Retrieves the public portion of an asymmetric key pair
   * This can be distributed to clients for encryption
   * 
   * @returns PEM-formatted public key
   */
  async getPublicKey(): Promise<string> {
    try {
      const versionName = this.getCryptoKeyVersionName();

      const [publicKey] = await this.client.getPublicKey({
        name: versionName,
      });

      if (!publicKey.pem) {
        throw new Error('KMS returned no public key');
      }

      return publicKey.pem;
    } catch (error) {
      console.error('KMS get public key error:', error);
      throw new Error(`Failed to get KMS public key: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * List all versions of the crypto key
   * 
   * Useful for key rotation and version management
   * 
   * @returns Array of key version information
   */
  async listKeyVersions(): Promise<KMSKeyVersion[]> {
    try {
      const keyName = this.getCryptoKeyName();

      const [versions] = await this.client.listCryptoKeyVersions({
        parent: keyName,
      });

      return versions.map(version => ({
        name: version.name || '',
        state: version.state?.toString() || 'UNKNOWN',
        createTime: version.createTime 
          ? new Date(Number(version.createTime.seconds || 0) * 1000)
          : new Date(),
        protectionLevel: version.protectionLevel?.toString() || 'UNKNOWN',
      }));
    } catch (error) {
      console.error('KMS list key versions error:', error);
      throw new Error(`Failed to list KMS key versions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new key version (key rotation)
   * 
   * Creates a new version of the crypto key for key rotation
   * Old versions remain available for decryption of existing data
   * 
   * @returns Name of the new key version
   */
  async createKeyVersion(): Promise<string> {
    try {
      const keyName = this.getCryptoKeyName();

      const [version] = await this.client.createCryptoKeyVersion({
        parent: keyName,
      });

      if (!version.name) {
        throw new Error('Failed to create key version');
      }

      console.log(`✅ Created new KMS key version: ${version.name}`);
      return version.name;
    } catch (error) {
      console.error('KMS create key version error:', error);
      throw new Error(`Failed to create KMS key version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set a key version as primary
   * 
   * Makes a specific key version the default for new encryption operations
   * 
   * @param versionId - The version ID to set as primary
   */
  async setPrimaryKeyVersion(versionId: string): Promise<void> {
    try {
      const keyName = this.getCryptoKeyName();

      await this.client.updateCryptoKeyPrimaryVersion({
        name: keyName,
        cryptoKeyVersionId: versionId,
      });

      console.log(`✅ Set KMS key version ${versionId} as primary`);
    } catch (error) {
      console.error('KMS set primary version error:', error);
      throw new Error(`Failed to set primary KMS key version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Destroy a key version (makes it unusable)
   * 
   * WARNING: This operation is irreversible
   * Data encrypted with this version will be permanently inaccessible
   * 
   * @param versionId - The version ID to destroy
   */
  async destroyKeyVersion(versionId: string): Promise<void> {
    try {
      const versionName = `${this.getCryptoKeyName()}/cryptoKeyVersions/${versionId}`;

      await this.client.destroyCryptoKeyVersion({
        name: versionName,
      });

      console.warn(`⚠️  Destroyed KMS key version ${versionId}`);
    } catch (error) {
      console.error('KMS destroy key version error:', error);
      throw new Error(`Failed to destroy KMS key version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get information about a specific key version
   * 
   * @param versionId - The version ID to query
   * @returns Key version information
   */
  async getKeyVersion(versionId?: string): Promise<KMSKeyVersion> {
    try {
      const versionName = this.getCryptoKeyVersionName(versionId);

      const [version] = await this.client.getCryptoKeyVersion({
        name: versionName,
      });

      return {
        name: version.name || '',
        state: version.state?.toString() || 'UNKNOWN',
        createTime: version.createTime 
          ? new Date(Number(version.createTime.seconds || 0) * 1000)
          : new Date(),
        protectionLevel: version.protectionLevel?.toString() || 'UNKNOWN',
      };
    } catch (error) {
      console.error('KMS get key version error:', error);
      throw new Error(`Failed to get KMS key version: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Singleton KMS service instance
 */
let kmsServiceInstance: KMSService | null = null;

/**
 * Initialize KMS service with configuration
 * 
 * @param config - KMS configuration
 * @returns KMS service instance
 */
export function initializeKMS(config?: KMSConfig): KMSService {
  if (kmsServiceInstance && !config) {
    return kmsServiceInstance;
  }

  const kmsConfig: KMSConfig = config || {
    projectId: process.env.GCP_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '',
    locationId: process.env.KMS_LOCATION || 'us-central1',
    keyRingId: process.env.KMS_KEYRING_ID || 'esta-tracker-keyring',
    cryptoKeyId: process.env.KMS_CRYPTO_KEY_ID || 'esta-tracker-key',
    keyVersion: process.env.KMS_KEY_VERSION,
  };

  // Validate configuration
  if (!kmsConfig.projectId) {
    throw new Error('KMS configuration error: GCP_PROJECT_ID or FIREBASE_PROJECT_ID is required');
  }

  kmsServiceInstance = new KMSService(kmsConfig);
  console.log('✅ KMS Service initialized');
  return kmsServiceInstance;
}

/**
 * Get KMS service instance
 * 
 * @returns KMS service instance
 * @throws Error if KMS is not initialized
 */
export function getKMS(): KMSService {
  if (!kmsServiceInstance) {
    return initializeKMS();
  }
  return kmsServiceInstance;
}

export default KMSService;
