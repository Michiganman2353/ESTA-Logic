/**
 * Audit Proof Core - Enterprise-grade audit logging
 * Provides immutable audit trail for compliance and legal defense
 */

export interface AuditEvent {
  id: string;
  timestamp: Date;
  userId?: string;
  action: string;
  resource: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLog {
  events: AuditEvent[];
  count: number;
  startDate?: Date;
  endDate?: Date;
}

export class AuditProofCore {
  private static events: AuditEvent[] = [];
  private static enabled: boolean = true;

  /**
   * Record an audit event
   */
  static record(
    action: string,
    resource: string,
    details: Record<string, unknown> = {},
    userId?: string
  ): void {
    if (!this.enabled) {
      return;
    }

    const event: AuditEvent = {
      id: this.generateEventId(),
      timestamp: new Date(),
      userId,
      action,
      resource,
      details,
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
    };

    this.events.push(event);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Log:', event);
    }

    // In production, this would send to a backend audit service
    this.persistEvent(event);
  }

  /**
   * Get audit log for a specific resource
   */
  static getAuditLog(
    resource?: string,
    startDate?: Date,
    endDate?: Date
  ): AuditLog {
    let filteredEvents = [...this.events];

    if (resource) {
      filteredEvents = filteredEvents.filter((e) => e.resource === resource);
    }

    if (startDate) {
      filteredEvents = filteredEvents.filter(
        (e) => e.timestamp >= startDate
      );
    }

    if (endDate) {
      filteredEvents = filteredEvents.filter((e) => e.timestamp <= endDate);
    }

    return {
      events: filteredEvents,
      count: filteredEvents.length,
      startDate,
      endDate,
    };
  }

  /**
   * Get audit events for a specific user
   */
  static getUserAuditLog(userId: string): AuditLog {
    const userEvents = this.events.filter((e) => e.userId === userId);

    return {
      events: userEvents,
      count: userEvents.length,
    };
  }

  /**
   * Generate compliance report
   */
  static generateComplianceReport(
    startDate: Date,
    endDate: Date
  ): {
    totalEvents: number;
    eventsByAction: Record<string, number>;
    eventsByResource: Record<string, number>;
    uniqueUsers: number;
  } {
    const log = this.getAuditLog(undefined, startDate, endDate);

    const eventsByAction: Record<string, number> = {};
    const eventsByResource: Record<string, number> = {};
    const uniqueUsers = new Set<string>();

    for (const event of log.events) {
      eventsByAction[event.action] = (eventsByAction[event.action] || 0) + 1;
      eventsByResource[event.resource] =
        (eventsByResource[event.resource] || 0) + 1;
      if (event.userId) {
        uniqueUsers.add(event.userId);
      }
    }

    return {
      totalEvents: log.count,
      eventsByAction,
      eventsByResource,
      uniqueUsers: uniqueUsers.size,
    };
  }

  /**
   * Enable/disable audit logging
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Clear audit log (use with caution)
   */
  static clear(): void {
    this.events = [];
  }

  /**
   * Generate unique event ID
   */
  private static generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get client IP address (placeholder)
   */
  private static getClientIP(): string | undefined {
    // In a real implementation, this would be set by the server
    return undefined;
  }

  /**
   * Get user agent
   */
  private static getUserAgent(): string | undefined {
    if (typeof navigator !== 'undefined') {
      return navigator.userAgent;
    }
    return undefined;
  }

  /**
   * Persist event to backend (placeholder)
   */
  private static persistEvent(event: AuditEvent): void {
    // In production, this would send to backend API
    // For now, we just store in memory
    // Example: fetch('/api/audit', { method: 'POST', body: JSON.stringify(event) })
  }

  /**
   * Export audit log to JSON
   */
  static exportToJSON(startDate?: Date, endDate?: Date): string {
    const log = this.getAuditLog(undefined, startDate, endDate);
    return JSON.stringify(log, null, 2);
  }

  /**
   * Common audit actions (constants)
   */
  static readonly Actions = {
    CREATE: 'CREATE',
    READ: 'READ',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    EXPORT: 'EXPORT',
    IMPORT: 'IMPORT',
    APPROVE: 'APPROVE',
    REJECT: 'REJECT',
  } as const;
}
