/**
 * Guided Session Store - State Management for Guided Journeys
 * 
 * Manages the state of active guided journeys, including progress tracking,
 * auto-save functionality, and resume capability.
 * 
 * Philosophy: "Never lose user progress. Always enable resume."
 */

import type { FlowState, ProgressInfo } from '../core/navigation/GuidedFlowEngine';

/**
 * Session data stored for a guided journey
 */
export interface GuidedSession {
  /** Unique session ID */
  id: string;
  
  /** User ID */
  userId: string;
  
  /** Journey ID */
  journeyId: string;
  
  /** Current flow state */
  state: FlowState;
  
  /** Last save timestamp */
  lastSaved: Date;
  
  /** Auto-save enabled */
  autoSave: boolean;
  
  /** Session metadata */
  metadata: {
    deviceType?: string;
    browser?: string;
    startedFrom?: string;
  };
}

/**
 * Configuration for session store
 */
export interface SessionStoreConfig {
  /** Auto-save interval in milliseconds (default: 2000) */
  autoSaveInterval?: number;
  
  /** Enable local storage backup (default: true) */
  localStorageBackup?: boolean;
  
  /** Enable remote persistence (default: true) */
  remotePersistence?: boolean;
}

/**
 * Guided Session Store - manages journey state with auto-save
 */
export class GuidedSessionStore {
  private sessions: Map<string, GuidedSession>;
  private config: Required<SessionStoreConfig>;
  private autoSaveTimer: NodeJS.Timeout | null;
  private pendingSaves: Set<string>;

  constructor(config: SessionStoreConfig = {}) {
    this.sessions = new Map();
    this.config = {
      autoSaveInterval: config.autoSaveInterval ?? 2000,
      localStorageBackup: config.localStorageBackup ?? true,
      remotePersistence: config.remotePersistence ?? true
    };
    this.autoSaveTimer = null;
    this.pendingSaves = new Set();

    // Start auto-save timer
    this.startAutoSave();

    // Load from local storage on init
    if (this.config.localStorageBackup && typeof window !== 'undefined') {
      this.loadFromLocalStorage();
    }
  }

  /**
   * Create a new guided session
   */
  createSession(
    userId: string,
    journeyId: string,
    initialState: FlowState,
    metadata?: GuidedSession['metadata']
  ): GuidedSession {
    const sessionId = this.generateSessionId();

    const session: GuidedSession = {
      id: sessionId,
      userId,
      journeyId,
      state: initialState,
      lastSaved: new Date(),
      autoSave: true,
      metadata: metadata || {}
    };

    this.sessions.set(sessionId, session);
    this.pendingSaves.add(sessionId);

    return session;
  }

  /**
   * Get a session by ID
   */
  getSession(sessionId: string): GuidedSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * Get active session for a user
   */
  getActiveSession(userId: string): GuidedSession | null {
    for (const session of this.sessions.values()) {
      if (session.userId === userId && session.state.status === 'in-progress') {
        return session;
      }
    }
    return null;
  }

  /**
   * Update session state
   */
  updateSession(sessionId: string, updates: Partial<FlowState>): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.state = {
      ...session.state,
      ...updates,
      lastUpdatedAt: new Date()
    };

    this.pendingSaves.add(sessionId);
  }

  /**
   * Update session progress
   */
  updateProgress(
    sessionId: string,
    stepId: string,
    stepData: any,
    completed: boolean = true
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    // Store step data
    session.state.stepData[stepId] = stepData;

    // Mark as completed if specified
    if (completed && !session.state.completedSteps.includes(stepId)) {
      session.state.completedSteps.push(stepId);
    }

    session.state.lastUpdatedAt = new Date();
    this.pendingSaves.add(sessionId);
  }

  /**
   * Pause a session
   */
  pauseSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.state.status = 'paused';
    session.state.lastUpdatedAt = new Date();
    this.pendingSaves.add(sessionId);

    // Force immediate save on pause
    this.saveSession(sessionId);
  }

  /**
   * Resume a session
   */
  resumeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.state.status = 'in-progress';
    session.state.lastUpdatedAt = new Date();
    this.pendingSaves.add(sessionId);
  }

  /**
   * Complete a session
   */
  completeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.state.status = 'completed';
    session.state.lastUpdatedAt = new Date();
    this.pendingSaves.add(sessionId);

    // Force immediate save on completion
    this.saveSession(sessionId);
  }

  /**
   * Delete a session
   */
  deleteSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      // Remove from remote storage
      if (this.config.remotePersistence) {
        this.deleteFromRemote(sessionId);
      }

      // Remove from local storage
      if (this.config.localStorageBackup && typeof window !== 'undefined') {
        this.deleteFromLocalStorage(sessionId);
      }

      // Remove from memory
      this.sessions.delete(sessionId);
      this.pendingSaves.delete(sessionId);
    }
  }

  /**
   * Get progress for a session
   */
  getProgress(sessionId: string): ProgressInfo | null {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    // This would typically call GuidedFlowEngine.getProgress()
    // For now, return basic info
    const completed = session.state.completedSteps.length;
    const total = 10; // Would come from journey definition

    return {
      currentStep: completed + 1,
      totalSteps: total,
      percentComplete: Math.round((completed / total) * 100),
      estimatedTimeRemaining: (total - completed) * 60, // Rough estimate
      completedSteps: [...session.state.completedSteps]
    };
  }

  /**
   * Start auto-save timer
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      return;
    }

    this.autoSaveTimer = setInterval(() => {
      this.autoSaveAll();
    }, this.config.autoSaveInterval);
  }

  /**
   * Stop auto-save timer
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Auto-save all pending sessions
   */
  private async autoSaveAll(): Promise<void> {
    if (this.pendingSaves.size === 0) {
      return;
    }

    const sessionIds = Array.from(this.pendingSaves);
    
    for (const sessionId of sessionIds) {
      await this.saveSession(sessionId);
    }
  }

  /**
   * Save a specific session
   */
  private async saveSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return;
    }

    try {
      // Save to local storage
      if (this.config.localStorageBackup && typeof window !== 'undefined') {
        this.saveToLocalStorage(session);
      }

      // Save to remote persistence
      if (this.config.remotePersistence) {
        await this.saveToRemote(session);
      }

      session.lastSaved = new Date();
      this.pendingSaves.delete(sessionId);

      console.log(`Session saved: ${sessionId}`);
    } catch (error) {
      console.error(`Failed to save session ${sessionId}:`, error);
    }
  }

  /**
   * Save session to local storage
   */
  private saveToLocalStorage(session: GuidedSession): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const key = `guided-session-${session.id}`;
      const data = JSON.stringify(session);
      localStorage.setItem(key, data);
    } catch (error) {
      console.error('Failed to save to local storage:', error);
    }
  }

  /**
   * Save session to remote storage (Firestore)
   */
  private async saveToRemote(session: GuidedSession): Promise<void> {
    // In real implementation, would save to Firestore
    console.log('Saving to remote:', session.id);
  }

  /**
   * Load sessions from local storage
   */
  private loadFromLocalStorage(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('guided-session-')) {
          const data = localStorage.getItem(key);
          if (data) {
            const session: GuidedSession = JSON.parse(data);
            this.sessions.set(session.id, session);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load from local storage:', error);
    }
  }

  /**
   * Delete session from local storage
   */
  private deleteFromLocalStorage(sessionId: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const key = `guided-session-${sessionId}`;
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to delete from local storage:', error);
    }
  }

  /**
   * Delete session from remote storage
   */
  private async deleteFromRemote(sessionId: string): Promise<void> {
    // In real implementation, would delete from Firestore
    console.log('Deleting from remote:', sessionId);
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    this.stopAutoSave();
    
    // Final save of all pending
    this.autoSaveAll();

    this.sessions.clear();
    this.pendingSaves.clear();
  }
}

/**
 * Singleton instance for global access
 */
export const guidedSessionStore = new GuidedSessionStore();

/**
 * Example usage:
 * 
 * ```typescript
 * // Create a new session
 * const session = guidedSessionStore.createSession(
 *   'user-123',
 *   'employer-onboarding',
 *   initialFlowState,
 *   { deviceType: 'desktop', browser: 'chrome' }
 * );
 * 
 * // Update progress
 * guidedSessionStore.updateProgress(
 *   session.id,
 *   'company-info',
 *   { companyName: 'Acme Corp', industry: 'Technology' },
 *   true
 * );
 * 
 * // Get progress
 * const progress = guidedSessionStore.getProgress(session.id);
 * console.log(`${progress.percentComplete}% complete`);
 * 
 * // Pause and resume
 * guidedSessionStore.pauseSession(session.id);
 * guidedSessionStore.resumeSession(session.id);
 * 
 * // Complete
 * guidedSessionStore.completeSession(session.id);
 * ```
 */
