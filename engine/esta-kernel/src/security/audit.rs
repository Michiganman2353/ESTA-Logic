//! Append-Only Tamper-Evident Audit Log
//!
//! This module implements an immutable audit log for all security-relevant
//! kernel operations. The log is designed to be:
//! - Append-only: No entries can be modified or deleted
//! - Tamper-evident: Each entry is cryptographically chained
//! - Queryable: Efficient filtering and search
//!
//! Reference: docs/abi/kernel_contract.md

use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::VecDeque;
use std::sync::Arc;
use tokio::sync::RwLock;

/// Types of audit events
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum AuditEventType {
    // Module lifecycle events
    ModuleLoaded { module_name: String, checksum: String },
    ModuleUnloaded { module_name: String },
    ModuleStarted { module_name: String },
    ModuleStopped { module_name: String, exit_code: i32 },
    ModuleCrashed { module_name: String, error: String },
    ModuleRestarted { module_name: String, attempt: u32 },

    // Capability events
    CapabilityCreated { cap_id: String, owner: String, rights: Vec<String> },
    CapabilityValidated { cap_id: String, operation: String },
    CapabilityDenied { cap_id: String, reason: String },
    CapabilityDelegated { parent_id: String, new_id: String, new_owner: String },
    CapabilityRevoked { cap_id: String, cascade_count: usize },

    // Signature events
    SignatureVerified { module_name: String },
    SignatureFailed { module_name: String, error: String },

    // Execution events
    ExecutionStarted { module_name: String, function: String },
    ExecutionCompleted { module_name: String, function: String, fuel_used: u64 },
    ExecutionFailed { module_name: String, function: String, error: String },
    FuelExhausted { module_name: String, fuel_limit: u64 },
    MemoryLimitExceeded { module_name: String, limit: u64 },

    // System events
    KernelStarted { version: String },
    KernelShutdown { reason: String },
    SupervisorEscalation { module_name: String, level: u32 },

    // Custom events
    Custom { category: String, message: String },
}

/// A single audit log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    /// Sequence number (monotonically increasing)
    pub sequence: u64,
    /// Timestamp in milliseconds since Unix epoch
    pub timestamp: u64,
    /// The event type and data
    pub event: AuditEventType,
    /// Source module or component that generated the event
    pub source: String,
    /// Hash of the previous entry (chain integrity)
    pub prev_hash: String,
    /// Hash of this entry
    pub hash: String,
}

impl AuditEntry {
    /// Compute the hash of this entry
    fn compute_hash(
        sequence: u64,
        timestamp: u64,
        event: &AuditEventType,
        source: &str,
        prev_hash: &str,
    ) -> String {
        let mut hasher = Sha256::new();
        hasher.update(sequence.to_le_bytes());
        hasher.update(timestamp.to_le_bytes());
        hasher.update(serde_json::to_string(event).unwrap_or_default().as_bytes());
        hasher.update(source.as_bytes());
        hasher.update(prev_hash.as_bytes());
        hex::encode(hasher.finalize())
    }

    /// Verify this entry's hash is correct
    pub fn verify(&self) -> bool {
        let computed = Self::compute_hash(
            self.sequence,
            self.timestamp,
            &self.event,
            &self.source,
            &self.prev_hash,
        );
        computed == self.hash
    }
}

/// A single audit event before it's been logged
#[derive(Debug, Clone)]
pub struct AuditEvent {
    pub event_type: AuditEventType,
    pub source: String,
}

impl AuditEvent {
    pub fn new(event_type: AuditEventType, source: impl Into<String>) -> Self {
        Self {
            event_type,
            source: source.into(),
        }
    }
}

/// Configuration for the audit log
#[derive(Debug, Clone)]
pub struct AuditLogConfig {
    /// Maximum number of entries to keep in memory
    pub max_entries: usize,
    /// Whether to enable verbose logging
    pub verbose: bool,
}

impl Default for AuditLogConfig {
    fn default() -> Self {
        Self {
            max_entries: 10_000,
            verbose: false,
        }
    }
}

/// The append-only audit log
pub struct AuditLog {
    /// Log entries stored in memory (bounded)
    entries: Arc<RwLock<VecDeque<AuditEntry>>>,
    /// Current sequence number
    sequence: Arc<RwLock<u64>>,
    /// Hash of the last entry
    last_hash: Arc<RwLock<String>>,
    /// Configuration
    config: AuditLogConfig,
}

impl AuditLog {
    /// Create a new audit log with the given configuration
    pub fn new(config: AuditLogConfig) -> Self {
        // Genesis hash - the starting point of the chain
        let genesis_hash = hex::encode(Sha256::digest(b"ESTA-KERNEL-GENESIS"));

        Self {
            entries: Arc::new(RwLock::new(VecDeque::with_capacity(config.max_entries))),
            sequence: Arc::new(RwLock::new(0)),
            last_hash: Arc::new(RwLock::new(genesis_hash)),
            config,
        }
    }

    /// Create with default configuration
    pub fn with_defaults() -> Self {
        Self::new(AuditLogConfig::default())
    }

    fn current_timestamp() -> u64 {
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis() as u64)
            .unwrap_or(0)
    }

    /// Append a new event to the log
    ///
    /// This is the only way to add entries - existing entries cannot be modified.
    pub async fn append(&self, event: AuditEvent) -> AuditEntry {
        let mut entries = self.entries.write().await;
        let mut seq = self.sequence.write().await;
        let mut last_hash = self.last_hash.write().await;

        *seq += 1;
        let sequence = *seq;
        let timestamp = Self::current_timestamp();
        let prev_hash = last_hash.clone();

        let hash = AuditEntry::compute_hash(
            sequence,
            timestamp,
            &event.event_type,
            &event.source,
            &prev_hash,
        );

        let entry = AuditEntry {
            sequence,
            timestamp,
            event: event.event_type,
            source: event.source,
            prev_hash,
            hash: hash.clone(),
        };

        *last_hash = hash;

        // Trim if needed
        if entries.len() >= self.config.max_entries {
            entries.pop_front();
        }

        entries.push_back(entry.clone());

        if self.config.verbose {
            log::info!("Audit: {:?}", entry.event);
        }

        entry
    }

    /// Log a module loaded event
    pub async fn log_module_loaded(&self, module_name: &str, checksum: &str, source: &str) -> AuditEntry {
        self.append(AuditEvent::new(
            AuditEventType::ModuleLoaded {
                module_name: module_name.into(),
                checksum: checksum.into(),
            },
            source,
        )).await
    }

    /// Log a module crashed event
    pub async fn log_module_crashed(&self, module_name: &str, error: &str, source: &str) -> AuditEntry {
        self.append(AuditEvent::new(
            AuditEventType::ModuleCrashed {
                module_name: module_name.into(),
                error: error.into(),
            },
            source,
        )).await
    }

    /// Log a capability created event
    pub async fn log_capability_created(
        &self,
        cap_id: &str,
        owner: &str,
        rights: Vec<String>,
        source: &str,
    ) -> AuditEntry {
        self.append(AuditEvent::new(
            AuditEventType::CapabilityCreated {
                cap_id: cap_id.into(),
                owner: owner.into(),
                rights,
            },
            source,
        )).await
    }

    /// Log a capability denied event
    pub async fn log_capability_denied(&self, cap_id: &str, reason: &str, source: &str) -> AuditEntry {
        self.append(AuditEvent::new(
            AuditEventType::CapabilityDenied {
                cap_id: cap_id.into(),
                reason: reason.into(),
            },
            source,
        )).await
    }

    /// Log a fuel exhausted event
    pub async fn log_fuel_exhausted(&self, module_name: &str, fuel_limit: u64, source: &str) -> AuditEntry {
        self.append(AuditEvent::new(
            AuditEventType::FuelExhausted {
                module_name: module_name.into(),
                fuel_limit,
            },
            source,
        )).await
    }

    /// Log an execution completed event
    pub async fn log_execution_completed(
        &self,
        module_name: &str,
        function: &str,
        fuel_used: u64,
        source: &str,
    ) -> AuditEntry {
        self.append(AuditEvent::new(
            AuditEventType::ExecutionCompleted {
                module_name: module_name.into(),
                function: function.into(),
                fuel_used,
            },
            source,
        )).await
    }

    /// Log a custom event
    pub async fn log_custom(&self, category: &str, message: &str, source: &str) -> AuditEntry {
        self.append(AuditEvent::new(
            AuditEventType::Custom {
                category: category.into(),
                message: message.into(),
            },
            source,
        )).await
    }

    /// Get all entries (for export or analysis)
    pub async fn get_all_entries(&self) -> Vec<AuditEntry> {
        let entries = self.entries.read().await;
        entries.iter().cloned().collect()
    }

    /// Get entries after a specific sequence number
    pub async fn get_entries_after(&self, after_sequence: u64) -> Vec<AuditEntry> {
        let entries = self.entries.read().await;
        entries
            .iter()
            .filter(|e| e.sequence > after_sequence)
            .cloned()
            .collect()
    }

    /// Get entries within a time range
    pub async fn get_entries_in_range(&self, start: u64, end: u64) -> Vec<AuditEntry> {
        let entries = self.entries.read().await;
        entries
            .iter()
            .filter(|e| e.timestamp >= start && e.timestamp <= end)
            .cloned()
            .collect()
    }

    /// Get entries by source
    pub async fn get_entries_by_source(&self, source: &str) -> Vec<AuditEntry> {
        let entries = self.entries.read().await;
        entries
            .iter()
            .filter(|e| e.source == source)
            .cloned()
            .collect()
    }

    /// Verify the integrity of the entire log chain
    pub async fn verify_chain(&self) -> ChainVerification {
        let entries = self.entries.read().await;
        
        if entries.is_empty() {
            return ChainVerification {
                valid: true,
                entries_checked: 0,
                first_invalid: None,
            };
        }

        let genesis_hash = hex::encode(Sha256::digest(b"ESTA-KERNEL-GENESIS"));
        let mut prev_hash = genesis_hash;

        for entry in entries.iter() {
            // Verify this entry's hash
            if !entry.verify() {
                return ChainVerification {
                    valid: false,
                    entries_checked: entry.sequence,
                    first_invalid: Some(entry.sequence),
                };
            }

            // Verify chain continuity
            if entry.prev_hash != prev_hash {
                return ChainVerification {
                    valid: false,
                    entries_checked: entry.sequence,
                    first_invalid: Some(entry.sequence),
                };
            }

            prev_hash = entry.hash.clone();
        }

        ChainVerification {
            valid: true,
            entries_checked: entries.len() as u64,
            first_invalid: None,
        }
    }

    /// Get statistics about the audit log
    pub async fn stats(&self) -> AuditStats {
        let entries = self.entries.read().await;
        let seq = self.sequence.read().await;

        AuditStats {
            total_entries: *seq,
            entries_in_memory: entries.len(),
            max_entries: self.config.max_entries,
        }
    }
}

/// Result of chain verification
#[derive(Debug, Clone, Serialize)]
pub struct ChainVerification {
    pub valid: bool,
    pub entries_checked: u64,
    pub first_invalid: Option<u64>,
}

/// Statistics about the audit log
#[derive(Debug, Clone, Serialize)]
pub struct AuditStats {
    pub total_entries: u64,
    pub entries_in_memory: usize,
    pub max_entries: usize,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_append_and_retrieve() {
        let log = AuditLog::with_defaults();

        let entry = log.log_module_loaded("test-module", "abc123", "kernel").await;

        assert_eq!(entry.sequence, 1);
        assert!(entry.verify());

        let all = log.get_all_entries().await;
        assert_eq!(all.len(), 1);
    }

    #[tokio::test]
    async fn test_chain_integrity() {
        let log = AuditLog::with_defaults();

        log.log_module_loaded("mod1", "hash1", "kernel").await;
        log.log_module_loaded("mod2", "hash2", "kernel").await;
        log.log_module_loaded("mod3", "hash3", "kernel").await;

        let verification = log.verify_chain().await;
        assert!(verification.valid);
        assert_eq!(verification.entries_checked, 3);
    }

    #[tokio::test]
    async fn test_tamper_detection() {
        let log = AuditLog::with_defaults();

        log.log_module_loaded("mod1", "hash1", "kernel").await;

        // Tamper with the entry (this shouldn't be possible in normal use)
        {
            let mut entries = log.entries.write().await;
            if let Some(entry) = entries.front_mut() {
                entry.source = "tampered".into();
            }
        }

        let verification = log.verify_chain().await;
        assert!(!verification.valid);
    }

    #[tokio::test]
    async fn test_query_by_source() {
        let log = AuditLog::with_defaults();

        log.log_module_loaded("mod1", "hash1", "kernel").await;
        log.log_module_loaded("mod2", "hash2", "supervisor").await;
        log.log_module_loaded("mod3", "hash3", "kernel").await;

        let kernel_entries = log.get_entries_by_source("kernel").await;
        assert_eq!(kernel_entries.len(), 2);

        let supervisor_entries = log.get_entries_by_source("supervisor").await;
        assert_eq!(supervisor_entries.len(), 1);
    }

    #[tokio::test]
    async fn test_sequence_monotonic() {
        let log = AuditLog::with_defaults();

        let e1 = log.log_module_loaded("mod1", "hash1", "kernel").await;
        let e2 = log.log_module_loaded("mod2", "hash2", "kernel").await;
        let e3 = log.log_module_loaded("mod3", "hash3", "kernel").await;

        assert_eq!(e1.sequence, 1);
        assert_eq!(e2.sequence, 2);
        assert_eq!(e3.sequence, 3);
    }

    #[tokio::test]
    async fn test_bounded_size() {
        let config = AuditLogConfig {
            max_entries: 5,
            verbose: false,
        };
        let log = AuditLog::new(config);

        for i in 0..10 {
            log.log_module_loaded(&format!("mod{}", i), "hash", "kernel").await;
        }

        let entries = log.get_all_entries().await;
        assert_eq!(entries.len(), 5);
        // Should have entries 6-10 (most recent 5)
        assert_eq!(entries[0].sequence, 6);
    }

    #[tokio::test]
    async fn test_various_event_types() {
        let log = AuditLog::with_defaults();

        log.log_capability_created("cap1", "owner1", vec!["read".into()], "kernel").await;
        log.log_capability_denied("cap2", "insufficient rights", "kernel").await;
        log.log_fuel_exhausted("module1", 1000000, "supervisor").await;
        log.log_execution_completed("module2", "_start", 500000, "kernel").await;
        log.log_custom("test", "custom message", "test-source").await;

        let entries = log.get_all_entries().await;
        assert_eq!(entries.len(), 5);

        // Verify chain is still valid
        let verification = log.verify_chain().await;
        assert!(verification.valid);
    }
}
