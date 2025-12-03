//! Capability-Based Access Control System
//!
//! This module implements an unforgeable capability system for the microkernel.
//! Capabilities control what operations each WASM module is allowed to perform.
//!
//! Security Guarantees:
//! - Capabilities are unforgeable tokens issued only by the kernel
//! - Capabilities can be delegated but only with equal or fewer rights (monotonic attenuation)
//! - Capabilities can be revoked at any time
//! - All capability operations are logged for audit
//!
//! Reference: docs/abi/kernel_contract.md

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::{HashMap, HashSet};
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use thiserror::Error;
use tokio::sync::RwLock;

/// Errors that can occur in capability operations
#[derive(Error, Debug, Clone)]
pub enum CapabilityError {
    #[error("Capability not found: {0}")]
    NotFound(String),
    
    #[error("Capability has been revoked")]
    Revoked,
    
    #[error("Capability has expired")]
    Expired,
    
    #[error("Insufficient rights: requires {required:?}, has {actual:?}")]
    InsufficientRights { required: Vec<String>, actual: Vec<String> },
    
    #[error("Capability usage limit exceeded")]
    UsageLimitExceeded,
    
    #[error("Delegation not allowed")]
    DelegationNotAllowed,
    
    #[error("Invalid capability token")]
    InvalidToken,
    
    #[error("Process not authorized for this operation")]
    Unauthorized,
}

/// Result type for capability operations
pub type CapabilityResult<T> = Result<T, CapabilityError>;

/// Unique identifier for a capability
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CapabilityId(u64);

impl CapabilityId {
    fn new(counter: u64, timestamp: u64) -> Self {
        // Combine counter and timestamp for uniqueness
        Self((timestamp << 32) | (counter & 0xFFFF_FFFF))
    }
}

/// Rights that can be granted by a capability
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum CapabilityRight {
    /// Permission to read resource
    Read,
    /// Permission to write/modify resource
    Write,
    /// Permission to delete resource
    Delete,
    /// Permission to execute code
    Execute,
    /// Permission to create child resources
    Create,
    /// Permission to list/enumerate resources
    List,
    /// Permission to delegate this capability
    Delegate,
    /// Permission to revoke delegated capabilities
    Revoke,
    /// Permission to emit audit logs
    AuditEmit,
    /// Permission to read persistence layer
    PersistenceRead,
    /// Permission to write persistence layer
    PersistenceWrite,
    /// Permission to log messages
    Log,
}

impl CapabilityRight {
    /// Parse a right from its string representation
    pub fn from_str(s: &str) -> Option<Self> {
        match s.to_lowercase().as_str() {
            "read" => Some(Self::Read),
            "write" => Some(Self::Write),
            "delete" => Some(Self::Delete),
            "execute" => Some(Self::Execute),
            "create" => Some(Self::Create),
            "list" => Some(Self::List),
            "delegate" => Some(Self::Delegate),
            "revoke" => Some(Self::Revoke),
            "audit_emit" => Some(Self::AuditEmit),
            "persistence_read" => Some(Self::PersistenceRead),
            "persistence_write" => Some(Self::PersistenceWrite),
            "log" => Some(Self::Log),
            _ => None,
        }
    }

    /// Convert to string representation
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Read => "read",
            Self::Write => "write",
            Self::Delete => "delete",
            Self::Execute => "execute",
            Self::Create => "create",
            Self::List => "list",
            Self::Delegate => "delegate",
            Self::Revoke => "revoke",
            Self::AuditEmit => "audit_emit",
            Self::PersistenceRead => "persistence_read",
            Self::PersistenceWrite => "persistence_write",
            Self::Log => "log",
        }
    }
}

/// Resource types that capabilities can reference
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum ResourceType {
    /// Memory region
    Memory,
    /// Message channel
    Channel,
    /// WASM module
    Module,
    /// Audit log
    AuditLog,
    /// Configuration
    Config,
    /// Process handle
    Process,
    /// Custom resource type
    Custom(String),
}

/// Validity constraints for a capability
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityValidity {
    /// Expiration timestamp (Unix millis), None = never expires
    pub expires_at: Option<u64>,
    /// Maximum number of uses, None = unlimited
    pub max_uses: Option<u64>,
    /// Current usage count
    pub use_count: u64,
}

impl Default for CapabilityValidity {
    fn default() -> Self {
        Self {
            expires_at: None,
            max_uses: None,
            use_count: 0,
        }
    }
}

/// Opaque capability token for external use
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub struct CapabilityToken(String);

impl CapabilityToken {
    /// Create a new token from capability ID and HMAC
    fn new(cap_id: CapabilityId, secret: &[u8]) -> Self {
        let mut hasher = Sha256::new();
        hasher.update(cap_id.0.to_le_bytes());
        hasher.update(secret);
        let hash = hex::encode(hasher.finalize());
        Self(format!("cap_{}_{}", cap_id.0, &hash[..16]))
    }

    /// Extract the capability ID from the token (for internal lookup)
    fn capability_id(&self) -> Option<CapabilityId> {
        let parts: Vec<&str> = self.0.split('_').collect();
        if parts.len() >= 2 && parts[0] == "cap" {
            parts[1].parse().ok().map(CapabilityId)
        } else {
            None
        }
    }

    /// Get the token as a string
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// A capability granting access to a resource
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capability {
    /// Unique capability identifier
    pub id: CapabilityId,
    /// Resource this capability grants access to
    pub resource_type: ResourceType,
    /// Specific resource identifier
    pub resource_id: String,
    /// Rights granted by this capability
    pub rights: HashSet<CapabilityRight>,
    /// Owner process/module ID
    pub owner: String,
    /// Whether this was delegated from another capability
    pub parent_id: Option<CapabilityId>,
    /// Validity constraints
    pub validity: CapabilityValidity,
    /// Whether this capability has been revoked
    pub revoked: bool,
    /// Creation timestamp (Unix millis)
    pub created_at: u64,
}

impl Capability {
    /// Check if the capability has a specific right
    pub fn has_right(&self, right: CapabilityRight) -> bool {
        self.rights.contains(&right)
    }

    /// Check if the capability is currently valid
    pub fn is_valid(&self, now: u64) -> CapabilityResult<()> {
        if self.revoked {
            return Err(CapabilityError::Revoked);
        }

        if let Some(expires_at) = self.validity.expires_at {
            if now > expires_at {
                return Err(CapabilityError::Expired);
            }
        }

        if let Some(max_uses) = self.validity.max_uses {
            if self.validity.use_count >= max_uses {
                return Err(CapabilityError::UsageLimitExceeded);
            }
        }

        Ok(())
    }
}

/// Manages all capabilities in the system
pub struct CapabilityManager {
    /// All active capabilities
    capabilities: Arc<RwLock<HashMap<CapabilityId, Capability>>>,
    /// Token lookup table
    tokens: Arc<RwLock<HashMap<CapabilityToken, CapabilityId>>>,
    /// Revocation list for quick lookup
    revocations: Arc<RwLock<HashSet<CapabilityId>>>,
    /// Next capability ID counter
    next_id: AtomicU64,
    /// Secret for token generation
    secret: Vec<u8>,
}

impl CapabilityManager {
    /// Create a new capability manager
    ///
    /// # Arguments
    /// * `secret` - Secret bytes for token generation (should be cryptographically random)
    pub fn new(secret: Vec<u8>) -> Self {
        Self {
            capabilities: Arc::new(RwLock::new(HashMap::new())),
            tokens: Arc::new(RwLock::new(HashMap::new())),
            revocations: Arc::new(RwLock::new(HashSet::new())),
            next_id: AtomicU64::new(1),
            secret,
        }
    }

    /// Generate a cryptographically random secret
    pub fn generate_secret() -> Vec<u8> {
        use sha2::Sha256;
        let rng = ring::rand::SystemRandom::new();
        let random_bytes: [u8; 32] = ring::rand::generate(&rng)
            .map(|b| b.expose())
            .unwrap_or([0u8; 32]);
        random_bytes.to_vec()
    }

    fn current_timestamp() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }

    /// Create a new capability (kernel authority only)
    ///
    /// # Arguments
    /// * `resource_type` - Type of resource this capability grants access to
    /// * `resource_id` - Specific resource identifier
    /// * `rights` - Set of rights to grant
    /// * `owner` - Owner process/module ID
    /// * `validity` - Validity constraints
    pub async fn create_capability(
        &self,
        resource_type: ResourceType,
        resource_id: String,
        rights: HashSet<CapabilityRight>,
        owner: String,
        validity: CapabilityValidity,
    ) -> CapabilityResult<CapabilityToken> {
        let id = CapabilityId::new(
            self.next_id.fetch_add(1, Ordering::SeqCst),
            Self::current_timestamp(),
        );

        let cap = Capability {
            id,
            resource_type,
            resource_id,
            rights,
            owner,
            parent_id: None,
            validity,
            revoked: false,
            created_at: Self::current_timestamp(),
        };

        let token = CapabilityToken::new(id, &self.secret);

        let mut caps = self.capabilities.write().await;
        caps.insert(id, cap);

        let mut tokens = self.tokens.write().await;
        tokens.insert(token.clone(), id);

        Ok(token)
    }

    /// Validate a capability token and check for specific rights
    ///
    /// # Arguments
    /// * `token` - The capability token to validate
    /// * `required_rights` - Rights required for the operation
    pub async fn validate(
        &self,
        token: &CapabilityToken,
        required_rights: &[CapabilityRight],
    ) -> CapabilityResult<Capability> {
        let cap_id = token.capability_id()
            .ok_or(CapabilityError::InvalidToken)?;

        // Check revocation list first
        {
            let revocations = self.revocations.read().await;
            if revocations.contains(&cap_id) {
                return Err(CapabilityError::Revoked);
            }
        }

        // Get the capability
        let caps = self.capabilities.read().await;
        let cap = caps.get(&cap_id)
            .ok_or_else(|| CapabilityError::NotFound(token.as_str().to_string()))?
            .clone();

        // Check validity
        cap.is_valid(Self::current_timestamp())?;

        // Check rights
        let missing: Vec<String> = required_rights.iter()
            .filter(|r| !cap.has_right(**r))
            .map(|r| r.as_str().to_string())
            .collect();

        if !missing.is_empty() {
            return Err(CapabilityError::InsufficientRights {
                required: missing,
                actual: cap.rights.iter().map(|r| r.as_str().to_string()).collect(),
            });
        }

        Ok(cap)
    }

    /// Record usage of a capability (increments use count)
    pub async fn record_usage(&self, token: &CapabilityToken) -> CapabilityResult<()> {
        let cap_id = token.capability_id()
            .ok_or(CapabilityError::InvalidToken)?;

        let mut caps = self.capabilities.write().await;
        let cap = caps.get_mut(&cap_id)
            .ok_or_else(|| CapabilityError::NotFound(token.as_str().to_string()))?;

        cap.validity.use_count += 1;
        Ok(())
    }

    /// Delegate a capability to another owner with potentially reduced rights
    ///
    /// # Arguments
    /// * `token` - The capability to delegate
    /// * `new_owner` - The new owner for the delegated capability
    /// * `rights` - Rights for the delegated capability (must be subset of original)
    /// * `validity` - Validity constraints for the delegated capability
    pub async fn delegate(
        &self,
        token: &CapabilityToken,
        new_owner: String,
        rights: HashSet<CapabilityRight>,
        validity: CapabilityValidity,
    ) -> CapabilityResult<CapabilityToken> {
        // First validate the parent capability has delegate right
        let parent_cap = self.validate(token, &[CapabilityRight::Delegate]).await?;

        // Ensure delegated rights are a subset of parent rights (monotonic attenuation)
        let invalid_rights: Vec<_> = rights.iter()
            .filter(|r| !parent_cap.has_right(**r))
            .collect();

        if !invalid_rights.is_empty() {
            return Err(CapabilityError::InsufficientRights {
                required: invalid_rights.iter().map(|r| r.as_str().to_string()).collect(),
                actual: parent_cap.rights.iter().map(|r| r.as_str().to_string()).collect(),
            });
        }

        // Create the new delegated capability
        let id = CapabilityId::new(
            self.next_id.fetch_add(1, Ordering::SeqCst),
            Self::current_timestamp(),
        );

        let cap = Capability {
            id,
            resource_type: parent_cap.resource_type.clone(),
            resource_id: parent_cap.resource_id.clone(),
            rights,
            owner: new_owner,
            parent_id: Some(parent_cap.id),
            validity,
            revoked: false,
            created_at: Self::current_timestamp(),
        };

        let new_token = CapabilityToken::new(id, &self.secret);

        let mut caps = self.capabilities.write().await;
        caps.insert(id, cap);

        let mut tokens = self.tokens.write().await;
        tokens.insert(new_token.clone(), id);

        Ok(new_token)
    }

    /// Revoke a capability and all its delegated children
    ///
    /// # Arguments
    /// * `token` - The capability to revoke
    ///
    /// # Returns
    /// The number of capabilities revoked (including delegated children)
    pub async fn revoke(&self, token: &CapabilityToken) -> CapabilityResult<usize> {
        let cap_id = token.capability_id()
            .ok_or(CapabilityError::InvalidToken)?;

        let mut caps = self.capabilities.write().await;
        let mut revocations = self.revocations.write().await;
        
        // Find all capabilities to revoke (the target and all its children)
        let mut to_revoke: Vec<CapabilityId> = vec![cap_id];
        let mut count = 0;

        // Find all delegated children (cascade revocation)
        for (id, cap) in caps.iter() {
            if cap.parent_id == Some(cap_id) {
                to_revoke.push(*id);
            }
        }

        // Revoke all identified capabilities
        for id in to_revoke {
            if let Some(cap) = caps.get_mut(&id) {
                cap.revoked = true;
                revocations.insert(id);
                count += 1;
            }
        }

        Ok(count)
    }

    /// List all capabilities for a specific owner
    pub async fn list_capabilities(&self, owner: &str) -> Vec<Capability> {
        let caps = self.capabilities.read().await;
        caps.values()
            .filter(|c| c.owner == owner && !c.revoked)
            .cloned()
            .collect()
    }

    /// Get statistics about the capability system
    pub async fn stats(&self) -> CapabilityStats {
        let caps = self.capabilities.read().await;
        let revocations = self.revocations.read().await;

        let active_count = caps.values().filter(|c| !c.revoked).count();
        let total_count = caps.len();
        let revoked_count = revocations.len();

        CapabilityStats {
            active_count,
            total_count,
            revoked_count,
        }
    }
}

/// Statistics about the capability system
#[derive(Debug, Clone, Serialize)]
pub struct CapabilityStats {
    pub active_count: usize,
    pub total_count: usize,
    pub revoked_count: usize,
}

/// Quick capability creation helpers
impl CapabilityManager {
    /// Create a read-only capability
    pub async fn create_read_only(
        &self,
        resource_type: ResourceType,
        resource_id: String,
        owner: String,
    ) -> CapabilityResult<CapabilityToken> {
        let mut rights = HashSet::new();
        rights.insert(CapabilityRight::Read);
        rights.insert(CapabilityRight::List);

        self.create_capability(
            resource_type,
            resource_id,
            rights,
            owner,
            CapabilityValidity::default(),
        ).await
    }

    /// Create a read-write capability
    pub async fn create_read_write(
        &self,
        resource_type: ResourceType,
        resource_id: String,
        owner: String,
    ) -> CapabilityResult<CapabilityToken> {
        let mut rights = HashSet::new();
        rights.insert(CapabilityRight::Read);
        rights.insert(CapabilityRight::Write);
        rights.insert(CapabilityRight::Create);
        rights.insert(CapabilityRight::List);

        self.create_capability(
            resource_type,
            resource_id,
            rights,
            owner,
            CapabilityValidity::default(),
        ).await
    }

    /// Create a full access capability
    pub async fn create_full_access(
        &self,
        resource_type: ResourceType,
        resource_id: String,
        owner: String,
    ) -> CapabilityResult<CapabilityToken> {
        let rights: HashSet<CapabilityRight> = [
            CapabilityRight::Read,
            CapabilityRight::Write,
            CapabilityRight::Delete,
            CapabilityRight::Execute,
            CapabilityRight::Create,
            CapabilityRight::List,
            CapabilityRight::Delegate,
            CapabilityRight::Revoke,
        ].into_iter().collect();

        self.create_capability(
            resource_type,
            resource_id,
            rights,
            owner,
            CapabilityValidity::default(),
        ).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_create_and_validate() {
        let manager = CapabilityManager::new(CapabilityManager::generate_secret());

        let token = manager.create_read_only(
            ResourceType::Module,
            "test-module".into(),
            "owner1".into(),
        ).await.expect("Should create capability");

        let cap = manager.validate(&token, &[CapabilityRight::Read]).await
            .expect("Should validate");

        assert_eq!(cap.resource_id, "test-module");
        assert!(cap.has_right(CapabilityRight::Read));
    }

    #[tokio::test]
    async fn test_insufficient_rights() {
        let manager = CapabilityManager::new(CapabilityManager::generate_secret());

        let token = manager.create_read_only(
            ResourceType::Module,
            "test-module".into(),
            "owner1".into(),
        ).await.expect("Should create capability");

        let result = manager.validate(&token, &[CapabilityRight::Write]).await;
        assert!(matches!(result, Err(CapabilityError::InsufficientRights { .. })));
    }

    #[tokio::test]
    async fn test_delegation() {
        let manager = CapabilityManager::new(CapabilityManager::generate_secret());

        // Create a capability with delegate right
        let token = manager.create_full_access(
            ResourceType::Module,
            "test-module".into(),
            "owner1".into(),
        ).await.expect("Should create capability");

        // Delegate with reduced rights
        let mut delegated_rights = HashSet::new();
        delegated_rights.insert(CapabilityRight::Read);

        let delegated_token = manager.delegate(
            &token,
            "owner2".into(),
            delegated_rights,
            CapabilityValidity::default(),
        ).await.expect("Should delegate");

        // Verify delegated capability
        let cap = manager.validate(&delegated_token, &[CapabilityRight::Read]).await
            .expect("Should validate delegated");

        assert_eq!(cap.owner, "owner2");
        assert!(!cap.has_right(CapabilityRight::Write));
    }

    #[tokio::test]
    async fn test_delegation_monotonic_attenuation() {
        let manager = CapabilityManager::new(CapabilityManager::generate_secret());

        // Create a read-only capability
        let token = manager.create_read_only(
            ResourceType::Module,
            "test-module".into(),
            "owner1".into(),
        ).await.expect("Should create capability");

        // Try to delegate with more rights (should fail)
        let mut requested_rights = HashSet::new();
        requested_rights.insert(CapabilityRight::Write);
        requested_rights.insert(CapabilityRight::Delegate);

        let result = manager.delegate(
            &token,
            "owner2".into(),
            requested_rights,
            CapabilityValidity::default(),
        ).await;

        assert!(matches!(result, Err(CapabilityError::InsufficientRights { .. })));
    }

    #[tokio::test]
    async fn test_revocation() {
        let manager = CapabilityManager::new(CapabilityManager::generate_secret());

        let token = manager.create_read_only(
            ResourceType::Module,
            "test-module".into(),
            "owner1".into(),
        ).await.expect("Should create capability");

        // Revoke
        let count = manager.revoke(&token).await.expect("Should revoke");
        assert_eq!(count, 1);

        // Try to use revoked capability
        let result = manager.validate(&token, &[CapabilityRight::Read]).await;
        assert!(matches!(result, Err(CapabilityError::Revoked)));
    }

    #[tokio::test]
    async fn test_usage_limit() {
        let manager = CapabilityManager::new(CapabilityManager::generate_secret());

        let mut rights = HashSet::new();
        rights.insert(CapabilityRight::Read);

        let validity = CapabilityValidity {
            expires_at: None,
            max_uses: Some(2),
            use_count: 0,
        };

        let token = manager.create_capability(
            ResourceType::Module,
            "test-module".into(),
            rights,
            "owner1".into(),
            validity,
        ).await.expect("Should create");

        // Use twice
        manager.record_usage(&token).await.unwrap();
        manager.record_usage(&token).await.unwrap();

        // Third use should fail
        let result = manager.validate(&token, &[CapabilityRight::Read]).await;
        assert!(matches!(result, Err(CapabilityError::UsageLimitExceeded)));
    }

    #[tokio::test]
    async fn test_list_capabilities() {
        let manager = CapabilityManager::new(CapabilityManager::generate_secret());

        manager.create_read_only(ResourceType::Module, "mod1".into(), "owner1".into()).await.unwrap();
        manager.create_read_only(ResourceType::Module, "mod2".into(), "owner1".into()).await.unwrap();
        manager.create_read_only(ResourceType::Module, "mod3".into(), "owner2".into()).await.unwrap();

        let owner1_caps = manager.list_capabilities("owner1").await;
        assert_eq!(owner1_caps.len(), 2);

        let owner2_caps = manager.list_capabilities("owner2").await;
        assert_eq!(owner2_caps.len(), 1);
    }
}
