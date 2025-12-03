//! Ed25519 Signature Verification for WASM Modules
//!
//! This module implements cryptographic signature verification for WASM modules
//! to ensure only trusted, signed modules can be loaded into the kernel.
//!
//! Security Guarantees:
//! - All modules must be signed with Ed25519 before loading
//! - Signatures are verified against a trusted public key
//! - Invalid or missing signatures result in module rejection
//!
//! Reference: docs/abi/kernel_contract.md

use ring::signature::{Ed25519KeyPair, KeyPair, UnparsedPublicKey, ED25519};
use sha2::{Digest, Sha256};
use std::sync::Arc;
use thiserror::Error;

/// Errors that can occur during signature verification
#[derive(Error, Debug, Clone)]
pub enum SignatureError {
    #[error("Signature verification failed: invalid signature")]
    InvalidSignature,
    
    #[error("No signature provided for module")]
    MissingSignature,
    
    #[error("Invalid public key format")]
    InvalidPublicKey,
    
    #[error("Invalid signature format: {0}")]
    InvalidFormat(String),
    
    #[error("Key generation failed: {0}")]
    KeyGenerationFailed(String),
}

/// Result type for signature operations
pub type SignatureResult<T> = Result<T, SignatureError>;

/// Signature verifier for WASM modules using Ed25519
#[derive(Clone)]
pub struct SignatureVerifier {
    /// Trusted public key for verification (32 bytes)
    public_key: Arc<Vec<u8>>,
}

impl SignatureVerifier {
    /// Create a new signature verifier with the given public key
    ///
    /// # Arguments
    /// * `public_key` - The 32-byte Ed25519 public key (hex-encoded)
    ///
    /// # Returns
    /// A SignatureVerifier configured with the provided public key
    pub fn new(public_key_hex: &str) -> SignatureResult<Self> {
        let public_key = hex::decode(public_key_hex)
            .map_err(|e| SignatureError::InvalidFormat(format!("Invalid hex: {}", e)))?;
        
        if public_key.len() != 32 {
            return Err(SignatureError::InvalidPublicKey);
        }
        
        Ok(Self {
            public_key: Arc::new(public_key),
        })
    }

    /// Create a verifier from raw public key bytes
    pub fn from_bytes(public_key: Vec<u8>) -> SignatureResult<Self> {
        if public_key.len() != 32 {
            return Err(SignatureError::InvalidPublicKey);
        }
        
        Ok(Self {
            public_key: Arc::new(public_key),
        })
    }

    /// Verify an Ed25519 signature over the given data
    ///
    /// # Arguments
    /// * `data` - The data that was signed (typically WASM module bytes)
    /// * `signature_hex` - The Ed25519 signature in hex format (128 chars / 64 bytes)
    ///
    /// # Returns
    /// Ok(()) if signature is valid, Err(SignatureError) otherwise
    pub fn verify(&self, data: &[u8], signature_hex: &str) -> SignatureResult<()> {
        let signature = hex::decode(signature_hex)
            .map_err(|e| SignatureError::InvalidFormat(format!("Invalid signature hex: {}", e)))?;
        
        if signature.len() != 64 {
            return Err(SignatureError::InvalidFormat(
                format!("Expected 64 byte signature, got {} bytes", signature.len())
            ));
        }

        let public_key = UnparsedPublicKey::new(&ED25519, &*self.public_key);
        
        public_key.verify(data, &signature)
            .map_err(|_| SignatureError::InvalidSignature)
    }

    /// Verify signature over a WASM module with its manifest
    ///
    /// The signature should cover: SHA256(checksum || module_bytes)
    /// where checksum is the expected module checksum from the manifest.
    ///
    /// # Arguments
    /// * `module_bytes` - The raw WASM module bytes
    /// * `checksum` - The expected SHA256 checksum of the module (hex)
    /// * `signature_hex` - The Ed25519 signature (hex)
    ///
    /// # Returns
    /// Ok(()) if both checksum and signature are valid
    pub fn verify_module(
        &self,
        module_bytes: &[u8],
        checksum: &str,
        signature_hex: &str,
    ) -> SignatureResult<()> {
        // First verify the checksum
        let mut hasher = Sha256::new();
        hasher.update(module_bytes);
        let actual_checksum = hex::encode(hasher.finalize());
        
        if actual_checksum != checksum {
            return Err(SignatureError::InvalidFormat(
                format!("Checksum mismatch: expected {}, got {}", checksum, actual_checksum)
            ));
        }

        // Create the signed message: checksum || module_bytes
        let mut signed_data = Vec::with_capacity(checksum.len() + module_bytes.len());
        signed_data.extend_from_slice(checksum.as_bytes());
        signed_data.extend_from_slice(module_bytes);

        self.verify(&signed_data, signature_hex)
    }

    /// Get the public key as hex string
    pub fn public_key_hex(&self) -> String {
        hex::encode(&*self.public_key)
    }
}

/// Key pair for signing WASM modules (used by build tools, not runtime)
pub struct ModuleSigner {
    key_pair: Ed25519KeyPair,
}

impl ModuleSigner {
    /// Generate a new key pair for module signing
    ///
    /// # Security Note
    /// The private key should be stored securely and never exposed.
    /// In production, use a key management system or HSM.
    pub fn generate() -> SignatureResult<Self> {
        // Generate 32 random bytes for the seed
        let rng = ring::rand::SystemRandom::new();
        let seed: [u8; 32] = ring::rand::generate(&rng)
            .map_err(|_| SignatureError::KeyGenerationFailed("RNG failure".into()))?
            .expose();

        let key_pair = Ed25519KeyPair::from_seed_unchecked(&seed)
            .map_err(|e| SignatureError::KeyGenerationFailed(format!("{}", e)))?;

        Ok(Self { key_pair })
    }

    /// Create a signer from an existing seed
    ///
    /// # Arguments
    /// * `seed` - 32-byte seed for the key pair
    pub fn from_seed(seed: &[u8; 32]) -> SignatureResult<Self> {
        let key_pair = Ed25519KeyPair::from_seed_unchecked(seed)
            .map_err(|e| SignatureError::KeyGenerationFailed(format!("{}", e)))?;

        Ok(Self { key_pair })
    }

    /// Sign data and return the signature as hex
    pub fn sign(&self, data: &[u8]) -> String {
        let signature = self.key_pair.sign(data);
        hex::encode(signature.as_ref())
    }

    /// Sign a WASM module with its checksum
    ///
    /// Returns the signature over: checksum || module_bytes
    pub fn sign_module(&self, module_bytes: &[u8], checksum: &str) -> String {
        let mut signed_data = Vec::with_capacity(checksum.len() + module_bytes.len());
        signed_data.extend_from_slice(checksum.as_bytes());
        signed_data.extend_from_slice(module_bytes);
        
        self.sign(&signed_data)
    }

    /// Get the public key as hex string for distribution
    pub fn public_key_hex(&self) -> String {
        hex::encode(self.key_pair.public_key().as_ref())
    }

    /// Get the public key bytes
    pub fn public_key_bytes(&self) -> Vec<u8> {
        self.key_pair.public_key().as_ref().to_vec()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_key_generation_and_verification() {
        let signer = ModuleSigner::generate().expect("Key generation should succeed");
        let verifier = SignatureVerifier::from_bytes(signer.public_key_bytes())
            .expect("Verifier creation should succeed");

        let data = b"test module data";
        let signature = signer.sign(data);

        assert!(verifier.verify(data, &signature).is_ok());
    }

    #[test]
    fn test_invalid_signature() {
        let signer = ModuleSigner::generate().expect("Key generation should succeed");
        let verifier = SignatureVerifier::from_bytes(signer.public_key_bytes())
            .expect("Verifier creation should succeed");

        let data = b"test module data";
        let signature = signer.sign(data);

        // Modify the signature
        let mut bad_sig = hex::decode(&signature).unwrap();
        bad_sig[0] ^= 0xff;
        let bad_sig_hex = hex::encode(bad_sig);

        assert!(matches!(
            verifier.verify(data, &bad_sig_hex),
            Err(SignatureError::InvalidSignature)
        ));
    }

    #[test]
    fn test_module_verification() {
        let signer = ModuleSigner::generate().expect("Key generation should succeed");
        let verifier = SignatureVerifier::from_bytes(signer.public_key_bytes())
            .expect("Verifier creation should succeed");

        let module_bytes = b"(module)"; // Minimal WASM-like content
        
        // Calculate checksum
        let mut hasher = Sha256::new();
        hasher.update(module_bytes);
        let checksum = hex::encode(hasher.finalize());

        // Sign the module
        let signature = signer.sign_module(module_bytes, &checksum);

        // Verify
        assert!(verifier.verify_module(module_bytes, &checksum, &signature).is_ok());
    }

    #[test]
    fn test_checksum_mismatch() {
        let signer = ModuleSigner::generate().expect("Key generation should succeed");
        let verifier = SignatureVerifier::from_bytes(signer.public_key_bytes())
            .expect("Verifier creation should succeed");

        let module_bytes = b"(module)";
        let wrong_checksum = "0".repeat(64);
        let signature = signer.sign_module(module_bytes, &wrong_checksum);

        let result = verifier.verify_module(module_bytes, &wrong_checksum, &signature);
        assert!(matches!(result, Err(SignatureError::InvalidFormat(_))));
    }

    #[test]
    fn test_invalid_public_key_length() {
        let result = SignatureVerifier::new("abcd"); // Too short
        assert!(matches!(result, Err(SignatureError::InvalidPublicKey)));
    }

    #[test]
    fn test_deterministic_signing() {
        let seed = [0u8; 32];
        let signer1 = ModuleSigner::from_seed(&seed).expect("Should create signer");
        let signer2 = ModuleSigner::from_seed(&seed).expect("Should create signer");

        let data = b"test data";
        let sig1 = signer1.sign(data);
        let sig2 = signer2.sign(data);

        // Same seed should produce same key pair and same signatures
        assert_eq!(sig1, sig2);
        assert_eq!(signer1.public_key_hex(), signer2.public_key_hex());
    }
}
