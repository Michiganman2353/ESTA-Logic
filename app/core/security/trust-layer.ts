/**
 * Trust Layer - Security with Psychological Reassurance
 *
 * This module implements security measures that are visible and reassuring to users.
 * Instead of hiding security, we make it transparent to build confidence.
 *
 * Philosophy: "Security that builds comfort, not friction."
 */

/**
 * Trust indicator that can be displayed in UI
 */
export interface TrustIndicator {
  type: 'encrypted' | 'verified' | 'saved' | 'audited' | 'protected';
  message: string;
  details?: string;
  icon: string;
  variant: 'success' | 'info' | 'warning';
  timestamp?: Date;
}

/**
 * Security status for a data item or operation
 */
export interface SecurityStatus {
  isSecure: boolean;
  encryption: {
    enabled: boolean;
    algorithm?: string;
    keyId?: string;
  };
  audit: {
    enabled: boolean;
    logId?: string;
  };
  access: {
    restricted: boolean;
    allowedRoles: string[];
  };
}

/**
 * Audit trail entry for compliance and transparency
 */
export interface AuditEntry {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}

/**
 * Trust Layer class - manages visible security indicators
 */
export class TrustLayer {
  /**
   * Get trust indicator for encrypted data
   */
  static getEncryptionIndicator(encrypted: boolean = true): TrustIndicator {
    return {
      type: 'encrypted',
      message: encrypted
        ? '🔒 Your data is encrypted and secure'
        : '⚠️ Data is not encrypted',
      details: encrypted
        ? 'We use bank-level AES-256 encryption to protect your information'
        : 'This data should be encrypted for security',
      icon: encrypted ? '🔒' : '⚠️',
      variant: encrypted ? 'success' : 'warning',
      timestamp: new Date(),
    };
  }

  /**
   * Get trust indicator for saved data
   */
  static getSavedIndicator(saved: boolean = true): TrustIndicator {
    return {
      type: 'saved',
      message: saved
        ? '✓ Safely saved and backed up'
        : '⚠️ Changes not yet saved',
      details: saved
        ? 'Your progress is automatically saved and securely backed up'
        : 'Please save your changes to continue',
      icon: saved ? '✓' : '⚠️',
      variant: saved ? 'success' : 'warning',
      timestamp: new Date(),
    };
  }

  /**
   * Get trust indicator for verified data
   */
  static getVerifiedIndicator(verified: boolean = true): TrustIndicator {
    return {
      type: 'verified',
      message: verified ? '✓ Verified and validated' : 'Pending verification',
      details: verified
        ? 'This information has been checked and verified'
        : 'Verification in progress',
      icon: verified ? '✓' : '⏳',
      variant: verified ? 'success' : 'info',
      timestamp: new Date(),
    };
  }

  /**
   * Get trust indicator for audited operations
   */
  static getAuditIndicator(audited: boolean = true): TrustIndicator {
    return {
      type: 'audited',
      message: audited ? '📋 Audit trail maintained' : 'Audit trail pending',
      details: audited
        ? 'All changes are logged for compliance and transparency'
        : 'Audit logging will be activated shortly',
      icon: audited ? '📋' : '⏳',
      variant: audited ? 'success' : 'info',
      timestamp: new Date(),
    };
  }

  /**
   * Get trust indicator for protected resources
   */
  static getProtectionIndicator(protected: boolean = true): TrustIndicator {
    return {
      type: 'protected',
      message: protected
        ? '🛡️ Access controlled and monitored'
        : '⚠️ Access control needed',
      details: protected
        ? 'Access to this resource is restricted and monitored for security'
        : 'This resource needs access control',
      icon: protected ? '🛡️' : '⚠️',
      variant: protected ? 'success' : 'warning',
      timestamp: new Date(),
    };
  }

  /**
   * Get comprehensive security status for a resource
   */
  static getSecurityStatus(
    resourceId: string,
    options: {
      encrypted?: boolean;
      audited?: boolean;
      restricted?: boolean;
      allowedRoles?: string[];
    } = {}
  ): SecurityStatus {
    const {
      encrypted = true,
      audited = true,
      restricted = true,
      allowedRoles = [],
    } = options;

    return {
      isSecure: encrypted && audited && restricted,
      encryption: {
        enabled: encrypted,
        algorithm: encrypted ? 'AES-256-GCM' : undefined,
        keyId: encrypted ? `key-${resourceId}` : undefined,
      },
      audit: {
        enabled: audited,
        logId: audited ? `audit-${resourceId}` : undefined,
      },
      access: {
        restricted,
        allowedRoles,
      },
    };
  }

  /**
   * Create an audit entry
   */
  static createAuditEntry(
    userId: string,
    action: string,
    resource: string,
    success: boolean = true,
    details?: any
  ): AuditEntry {
    return {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resource,
      timestamp: new Date(),
      success,
      details,
    };
  }

  /**
   * Log an audit entry (in real implementation, saves to database)
   */
  static async logAudit(entry: AuditEntry): Promise<void> {
    // In real implementation, would save to Firestore audit collection
    console.log('Audit logged:', entry);
  }

  /**
   * Get user-friendly security summary
   */
  static getSecuritySummary(status: SecurityStatus): string {
    const features: string[] = [];

    if (status.encryption.enabled) {
      features.push('🔒 Bank-level encryption');
    }

    if (status.audit.enabled) {
      features.push('📋 Complete audit trail');
    }

    if (status.access.restricted) {
      features.push('🛡️ Access controlled');
    }

    if (features.length === 0) {
      return '⚠️ Security features not fully enabled';
    }

    return `Your data is protected with: ${features.join(', ')}`;
  }

  /**
   * Validate access to a resource
   */
  static validateAccess(
    userRole: string,
    allowedRoles: string[]
  ): { allowed: boolean; reason?: string } {
    if (allowedRoles.length === 0) {
      return { allowed: true };
    }

    const allowed = allowedRoles.includes(userRole);

    return {
      allowed,
      reason: allowed
        ? undefined
        : `Access restricted to: ${allowedRoles.join(', ')}`,
    };
  }

  /**
   * Get trust indicators for a complete operation
   */
  static getOperationTrustIndicators(operation: {
    encrypted?: boolean;
    saved?: boolean;
    verified?: boolean;
    audited?: boolean;
    protected?: boolean;
  }): TrustIndicator[] {
    const indicators: TrustIndicator[] = [];

    if (operation.encrypted !== undefined) {
      indicators.push(this.getEncryptionIndicator(operation.encrypted));
    }

    if (operation.saved !== undefined) {
      indicators.push(this.getSavedIndicator(operation.saved));
    }

    if (operation.verified !== undefined) {
      indicators.push(this.getVerifiedIndicator(operation.verified));
    }

    if (operation.audited !== undefined) {
      indicators.push(this.getAuditIndicator(operation.audited));
    }

    if (operation.protected !== undefined) {
      indicators.push(this.getProtectionIndicator(operation.protected));
    }

    return indicators;
  }

  /**
   * Get confidence message based on security status
   */
  static getConfidenceMessage(status: SecurityStatus): string {
    if (status.isSecure) {
      return "✅ You're fully protected. Your data is encrypted, audited, and access-controlled.";
    }

    const missing: string[] = [];

    if (!status.encryption.enabled) {
      missing.push('encryption');
    }

    if (!status.audit.enabled) {
      missing.push('audit logging');
    }

    if (!status.access.restricted) {
      missing.push('access control');
    }

    return `⚠️ Security incomplete. Missing: ${missing.join(', ')}`;
  }
}

/**
 * Helper function to display trust indicators in UI
 */
export function formatTrustIndicator(indicator: TrustIndicator): string {
  return `${indicator.icon} ${indicator.message}${
    indicator.details ? `\n${indicator.details}` : ''
  }`;
}

/**
 * Example usage in a component:
 *
 * ```typescript
 * const securityStatus = TrustLayer.getSecurityStatus('document-123', {
 *   encrypted: true,
 *   audited: true,
 *   restricted: true,
 *   allowedRoles: ['employer', 'admin']
 * });
 *
 * const indicators = TrustLayer.getOperationTrustIndicators({
 *   encrypted: true,
 *   saved: true,
 *   verified: true
 * });
 *
 * // Display in UI
 * indicators.forEach(indicator => {
 *   console.log(formatTrustIndicator(indicator));
 * });
 * ```
 */
