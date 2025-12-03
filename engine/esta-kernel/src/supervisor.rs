//! Supervisor Module for WASM Module Lifecycle Management
//!
//! This module implements an Erlang/OTP-inspired supervision tree for WASM modules.
//! The supervisor monitors running modules and handles:
//! - Crash detection and restart
//! - Escalation when restart limits are exceeded
//! - Linear backoff between restart attempts
//! - Graceful shutdown
//!
//! Reference: docs/abi/kernel_contract.md

use anyhow::{anyhow, Result};
use log::{error, info, warn};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, RwLock};
use tokio::time::{sleep, Instant};

/// Restart strategy for supervised modules
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RestartStrategy {
    /// Always restart on crash
    Permanent,
    /// Never restart on crash
    Temporary,
    /// Restart only on abnormal termination
    Transient,
}

/// Escalation level in the supervision hierarchy
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum EscalationLevel {
    /// Restart with preserved state
    Level1RestartWithState = 1,
    /// Restart with clean state
    Level2RestartClean = 2,
    /// Reload the module
    Level3ReloadModule = 3,
    /// Restart the supervisor
    Level4RestartSupervisor = 4,
    /// System restart required
    Level5SystemRestart = 5,
}

impl EscalationLevel {
    /// Get the next escalation level
    pub fn next(&self) -> Self {
        match self {
            Self::Level1RestartWithState => Self::Level2RestartClean,
            Self::Level2RestartClean => Self::Level3ReloadModule,
            Self::Level3ReloadModule => Self::Level4RestartSupervisor,
            Self::Level4RestartSupervisor => Self::Level5SystemRestart,
            Self::Level5SystemRestart => Self::Level5SystemRestart,
        }
    }
}

/// Configuration for a supervised child module
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChildSpec {
    /// Unique identifier for this child
    pub id: String,
    /// Module manifest path
    pub manifest_path: String,
    /// Restart strategy
    pub restart: RestartStrategy,
    /// Maximum restart attempts within the intensity window
    pub max_restarts: u32,
    /// Time window for counting restarts (seconds)
    pub restart_intensity_window: u32,
    /// Base delay between restarts (milliseconds)
    pub base_restart_delay_ms: u64,
    /// Maximum delay after backoff (milliseconds)
    pub max_restart_delay_ms: u64,
    /// Backoff multiplier for each restart
    pub backoff_factor: f64,
}

impl Default for ChildSpec {
    fn default() -> Self {
        Self {
            id: String::new(),
            manifest_path: String::new(),
            restart: RestartStrategy::Permanent,
            max_restarts: 5,
            restart_intensity_window: 60,
            base_restart_delay_ms: 1000,
            max_restart_delay_ms: 30000,
            backoff_factor: 2.0,
        }
    }
}

/// State of a supervised child
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ChildState {
    /// Child is starting up
    Starting,
    /// Child is running normally
    Running,
    /// Child has crashed and is pending restart
    Crashed { error: String },
    /// Child is in restart delay
    Restarting { attempt: u32 },
    /// Child has exceeded restart limits
    Stopped { reason: String },
    /// Child was gracefully shut down
    Terminated,
}

/// Information about a supervised child
#[derive(Debug, Clone)]
pub struct ChildInfo {
    /// Child specification
    pub spec: ChildSpec,
    /// Current state
    pub state: ChildState,
    /// Number of restarts in current window
    pub restart_count: u32,
    /// Start of current restart window
    pub restart_window_start: Option<Instant>,
    /// Last crash time
    pub last_crash: Option<Instant>,
    /// Current escalation level
    pub escalation_level: EscalationLevel,
    /// Total crashes since start
    pub total_crashes: u64,
}

impl ChildInfo {
    fn new(spec: ChildSpec) -> Self {
        Self {
            spec,
            state: ChildState::Starting,
            restart_count: 0,
            restart_window_start: None,
            last_crash: None,
            escalation_level: EscalationLevel::Level1RestartWithState,
            total_crashes: 0,
        }
    }

    /// Calculate the delay before next restart with exponential backoff
    fn calculate_restart_delay(&self) -> Duration {
        let base = self.spec.base_restart_delay_ms as f64;
        let factor = self.spec.backoff_factor;
        let attempt = self.restart_count as f64;
        
        let delay_ms = base * factor.powf(attempt);
        let delay_ms = delay_ms.min(self.spec.max_restart_delay_ms as f64) as u64;
        
        Duration::from_millis(delay_ms)
    }

    /// Check if restart limit has been exceeded
    fn restart_limit_exceeded(&self, now: Instant) -> bool {
        if let Some(window_start) = self.restart_window_start {
            let window_duration = Duration::from_secs(self.spec.restart_intensity_window as u64);
            if now.duration_since(window_start) > window_duration {
                // Window has expired, reset would happen
                false
            } else {
                self.restart_count >= self.spec.max_restarts
            }
        } else {
            false
        }
    }

    /// Reset restart window if expired
    fn reset_window_if_expired(&mut self, now: Instant) {
        if let Some(window_start) = self.restart_window_start {
            let window_duration = Duration::from_secs(self.spec.restart_intensity_window as u64);
            if now.duration_since(window_start) > window_duration {
                self.restart_count = 0;
                self.restart_window_start = Some(now);
                self.escalation_level = EscalationLevel::Level1RestartWithState;
            }
        }
    }
}

/// Supervisor event for the event loop
#[derive(Debug)]
pub enum SupervisorEvent {
    /// A child has crashed
    ChildCrashed { id: String, error: String },
    /// A child has started successfully
    ChildStarted { id: String },
    /// Request to stop a child
    StopChild { id: String },
    /// Request to restart a child
    RestartChild { id: String },
    /// Shutdown the supervisor
    Shutdown,
}

/// Supervisor for managing WASM module lifecycles
pub struct Supervisor {
    /// Children managed by this supervisor
    children: Arc<RwLock<HashMap<String, ChildInfo>>>,
    /// Event sender for supervisor commands
    event_tx: mpsc::Sender<SupervisorEvent>,
    /// Event receiver for supervisor commands
    event_rx: Arc<RwLock<mpsc::Receiver<SupervisorEvent>>>,
    /// Whether supervisor is running
    running: Arc<RwLock<bool>>,
    /// Callback for module restart (actual kernel integration)
    restart_callback: Arc<dyn Fn(&str, &str, EscalationLevel) -> Result<()> + Send + Sync>,
}

impl Supervisor {
    /// Create a new supervisor with a module restart callback
    ///
    /// The callback receives (child_id, manifest_path, escalation_level) and should
    /// start the module in the kernel.
    pub fn new<F>(restart_callback: F) -> Self
    where
        F: Fn(&str, &str, EscalationLevel) -> Result<()> + Send + Sync + 'static,
    {
        let (tx, rx) = mpsc::channel(100);

        Self {
            children: Arc::new(RwLock::new(HashMap::new())),
            event_tx: tx,
            event_rx: Arc::new(RwLock::new(rx)),
            running: Arc::new(RwLock::new(false)),
            restart_callback: Arc::new(restart_callback),
        }
    }

    /// Create a supervisor with a no-op callback (for testing)
    pub fn new_noop() -> Self {
        Self::new(|_, _, _| Ok(()))
    }

    /// Register a child module with the supervisor
    pub async fn register_child(&self, spec: ChildSpec) -> Result<()> {
        let id = spec.id.clone();
        let mut children = self.children.write().await;
        
        if children.contains_key(&id) {
            return Err(anyhow!("Child {} already registered", id));
        }

        children.insert(id.clone(), ChildInfo::new(spec));
        info!("Registered child: {}", id);
        Ok(())
    }

    /// Unregister a child module
    pub async fn unregister_child(&self, id: &str) -> Result<()> {
        let mut children = self.children.write().await;
        children.remove(id).ok_or_else(|| anyhow!("Child {} not found", id))?;
        info!("Unregistered child: {}", id);
        Ok(())
    }

    /// Get the event sender for sending events to the supervisor
    pub fn event_sender(&self) -> mpsc::Sender<SupervisorEvent> {
        self.event_tx.clone()
    }

    /// Report a child as successfully started
    pub async fn report_started(&self, id: &str) -> Result<()> {
        let mut children = self.children.write().await;
        if let Some(child) = children.get_mut(id) {
            child.state = ChildState::Running;
            info!("Child {} started", id);
            Ok(())
        } else {
            Err(anyhow!("Child {} not found", id))
        }
    }

    /// Report a child as crashed
    pub async fn report_crash(&self, id: &str, error: &str) -> Result<SupervisorAction> {
        let now = Instant::now();
        let mut children = self.children.write().await;
        
        let child = children.get_mut(id)
            .ok_or_else(|| anyhow!("Child {} not found", id))?;

        child.state = ChildState::Crashed { error: error.to_string() };
        child.last_crash = Some(now);
        child.total_crashes += 1;

        // Check restart strategy
        match child.spec.restart {
            RestartStrategy::Temporary => {
                child.state = ChildState::Stopped { 
                    reason: "Temporary strategy - no restart".into() 
                };
                warn!("Child {} crashed (temporary, no restart): {}", id, error);
                return Ok(SupervisorAction::Stop);
            }
            RestartStrategy::Transient => {
                // Only restart on abnormal termination
                if error == "normal" || error == "shutdown" {
                    child.state = ChildState::Terminated;
                    info!("Child {} terminated normally", id);
                    return Ok(SupervisorAction::Stop);
                }
            }
            RestartStrategy::Permanent => {
                // Always restart
            }
        }

        // Reset window if expired
        child.reset_window_if_expired(now);

        // Start window if not started
        if child.restart_window_start.is_none() {
            child.restart_window_start = Some(now);
        }

        // Check restart limit
        if child.restart_limit_exceeded(now) {
            // Escalate
            child.escalation_level = child.escalation_level.next();
            
            if child.escalation_level >= EscalationLevel::Level4RestartSupervisor {
                child.state = ChildState::Stopped { 
                    reason: format!("Restart limit exceeded, escalated to {:?}", child.escalation_level)
                };
                error!("Child {} exceeded restart limit, escalating to {:?}", id, child.escalation_level);
                return Ok(SupervisorAction::Escalate(child.escalation_level));
            }

            // Reset count at higher escalation level
            child.restart_count = 0;
        }

        child.restart_count += 1;
        let delay = child.calculate_restart_delay();
        let escalation = child.escalation_level;
        let manifest_path = child.spec.manifest_path.clone();

        child.state = ChildState::Restarting { attempt: child.restart_count };

        info!(
            "Child {} will restart in {:?} (attempt {}, escalation {:?})",
            id, delay, child.restart_count, escalation
        );

        Ok(SupervisorAction::Restart {
            delay,
            manifest_path,
            escalation,
        })
    }

    /// Execute a restart action for a child
    pub async fn execute_restart(&self, id: &str, action: SupervisorAction) -> Result<()> {
        match action {
            SupervisorAction::Restart { delay, manifest_path, escalation } => {
                // Wait for the delay
                sleep(delay).await;

                // Execute the restart callback
                (self.restart_callback)(id, &manifest_path, escalation)?;

                // Mark as starting
                let mut children = self.children.write().await;
                if let Some(child) = children.get_mut(id) {
                    child.state = ChildState::Starting;
                }

                Ok(())
            }
            SupervisorAction::Stop => Ok(()),
            SupervisorAction::Escalate(_) => {
                // Escalation handling would be done by the parent supervisor
                Ok(())
            }
        }
    }

    /// Get the status of all children
    pub async fn get_status(&self) -> Vec<ChildStatus> {
        let children = self.children.read().await;
        children.values().map(|c| ChildStatus {
            id: c.spec.id.clone(),
            state: format!("{:?}", c.state),
            restart_count: c.restart_count,
            total_crashes: c.total_crashes,
            escalation_level: c.escalation_level,
        }).collect()
    }

    /// Get the status of a specific child
    pub async fn get_child_status(&self, id: &str) -> Option<ChildStatus> {
        let children = self.children.read().await;
        children.get(id).map(|c| ChildStatus {
            id: c.spec.id.clone(),
            state: format!("{:?}", c.state),
            restart_count: c.restart_count,
            total_crashes: c.total_crashes,
            escalation_level: c.escalation_level,
        })
    }

    /// Shutdown all children gracefully
    pub async fn shutdown_all(&self) {
        let mut children = self.children.write().await;
        for (id, child) in children.iter_mut() {
            info!("Shutting down child: {}", id);
            child.state = ChildState::Terminated;
        }
    }
}

/// Action to take after a child crash
#[derive(Debug, Clone)]
pub enum SupervisorAction {
    /// Restart the child after a delay
    Restart {
        delay: Duration,
        manifest_path: String,
        escalation: EscalationLevel,
    },
    /// Stop the child permanently
    Stop,
    /// Escalate to higher level
    Escalate(EscalationLevel),
}

/// Status of a supervised child
#[derive(Debug, Clone, Serialize)]
pub struct ChildStatus {
    pub id: String,
    pub state: String,
    pub restart_count: u32,
    pub total_crashes: u64,
    pub escalation_level: EscalationLevel,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_register_and_start() {
        let supervisor = Supervisor::new_noop();

        let spec = ChildSpec {
            id: "test-module".into(),
            manifest_path: "/path/to/manifest.json".into(),
            ..Default::default()
        };

        supervisor.register_child(spec).await.unwrap();
        supervisor.report_started("test-module").await.unwrap();

        let status = supervisor.get_child_status("test-module").await.unwrap();
        assert!(status.state.contains("Running"));
    }

    #[tokio::test]
    async fn test_crash_and_restart() {
        let supervisor = Supervisor::new_noop();

        let spec = ChildSpec {
            id: "test-module".into(),
            manifest_path: "/path/to/manifest.json".into(),
            max_restarts: 5,
            base_restart_delay_ms: 100,
            ..Default::default()
        };

        supervisor.register_child(spec).await.unwrap();
        supervisor.report_started("test-module").await.unwrap();

        // Simulate crash
        let action = supervisor.report_crash("test-module", "test error").await.unwrap();

        match action {
            SupervisorAction::Restart { delay, .. } => {
                assert!(delay.as_millis() >= 100);
            }
            _ => panic!("Expected Restart action"),
        }
    }

    #[tokio::test]
    async fn test_temporary_no_restart() {
        let supervisor = Supervisor::new_noop();

        let spec = ChildSpec {
            id: "temp-module".into(),
            manifest_path: "/path/to/manifest.json".into(),
            restart: RestartStrategy::Temporary,
            ..Default::default()
        };

        supervisor.register_child(spec).await.unwrap();
        supervisor.report_started("temp-module").await.unwrap();

        let action = supervisor.report_crash("temp-module", "error").await.unwrap();

        assert!(matches!(action, SupervisorAction::Stop));
    }

    #[tokio::test]
    async fn test_transient_normal_exit() {
        let supervisor = Supervisor::new_noop();

        let spec = ChildSpec {
            id: "transient-module".into(),
            manifest_path: "/path/to/manifest.json".into(),
            restart: RestartStrategy::Transient,
            ..Default::default()
        };

        supervisor.register_child(spec).await.unwrap();
        supervisor.report_started("transient-module").await.unwrap();

        // Normal termination should not restart
        let action = supervisor.report_crash("transient-module", "normal").await.unwrap();
        assert!(matches!(action, SupervisorAction::Stop));
    }

    #[tokio::test]
    async fn test_escalation_on_restart_limit() {
        let supervisor = Supervisor::new_noop();

        let spec = ChildSpec {
            id: "crash-module".into(),
            manifest_path: "/path/to/manifest.json".into(),
            max_restarts: 2,
            restart_intensity_window: 60,
            base_restart_delay_ms: 1,
            ..Default::default()
        };

        supervisor.register_child(spec).await.unwrap();
        supervisor.report_started("crash-module").await.unwrap();

        // First crash
        supervisor.report_crash("crash-module", "error").await.unwrap();
        // Second crash
        supervisor.report_crash("crash-module", "error").await.unwrap();
        // Third crash - should trigger escalation
        let action = supervisor.report_crash("crash-module", "error").await.unwrap();

        match action {
            SupervisorAction::Restart { escalation, .. } => {
                assert!(escalation >= EscalationLevel::Level2RestartClean);
            }
            _ => panic!("Expected Restart with escalation"),
        }
    }

    #[tokio::test]
    async fn test_backoff_delay() {
        let supervisor = Supervisor::new_noop();

        let spec = ChildSpec {
            id: "backoff-module".into(),
            manifest_path: "/path/to/manifest.json".into(),
            max_restarts: 10,
            base_restart_delay_ms: 100,
            max_restart_delay_ms: 10000,
            backoff_factor: 2.0,
            ..Default::default()
        };

        supervisor.register_child(spec).await.unwrap();
        supervisor.report_started("backoff-module").await.unwrap();

        // First crash: delay = 100 * 2^0 = 100
        let action1 = supervisor.report_crash("backoff-module", "error").await.unwrap();
        // Second crash: delay = 100 * 2^1 = 200
        let action2 = supervisor.report_crash("backoff-module", "error").await.unwrap();
        // Third crash: delay = 100 * 2^2 = 400
        let action3 = supervisor.report_crash("backoff-module", "error").await.unwrap();

        match (action1, action2, action3) {
            (
                SupervisorAction::Restart { delay: d1, .. },
                SupervisorAction::Restart { delay: d2, .. },
                SupervisorAction::Restart { delay: d3, .. },
            ) => {
                assert!(d2 > d1, "Second delay should be greater");
                assert!(d3 > d2, "Third delay should be greater");
            }
            _ => panic!("Expected all Restart actions"),
        }
    }

    #[tokio::test]
    async fn test_shutdown_all() {
        let supervisor = Supervisor::new_noop();

        for i in 0..3 {
            let spec = ChildSpec {
                id: format!("module-{}", i),
                manifest_path: "/path/to/manifest.json".into(),
                ..Default::default()
            };
            supervisor.register_child(spec).await.unwrap();
            supervisor.report_started(&format!("module-{}", i)).await.unwrap();
        }

        supervisor.shutdown_all().await;

        let status = supervisor.get_status().await;
        for s in status {
            assert!(s.state.contains("Terminated"));
        }
    }
}
