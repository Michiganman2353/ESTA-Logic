/**
 * Integrity Ledger - Immutable record verification
 * Provides cryptographic verification for data integrity
 */

export interface LedgerEntry {
  id: string;
  timestamp: Date;
  data: Record<string, unknown>;
  hash: string;
  previousHash?: string;
  signature?: string;
}

export interface VerificationResult {
  valid: boolean;
  entry?: LedgerEntry;
  errors?: string[];
}

export class IntegrityLedger {
  private static entries: LedgerEntry[] = [];
  private static enabled: boolean = true;

  /**
   * Add entry to ledger
   */
  static addEntry(data: Record<string, unknown>): LedgerEntry {
    if (!this.enabled) {
      throw new Error('Integrity Ledger is disabled');
    }

    const entry: LedgerEntry = {
      id: this.generateEntryId(),
      timestamp: new Date(),
      data,
      hash: this.generateHash(data),
      previousHash: this.getLastHash(),
    };

    this.entries.push(entry);
    return entry;
  }

  /**
   * Verify integrity of an entry
   */
  static verifyEntry(entryId: string): VerificationResult {
    const entry = this.entries.find((e) => e.id === entryId);

    if (!entry) {
      return {
        valid: false,
        errors: ['Entry not found'],
      };
    }

    const errors: string[] = [];

    // Verify hash
    const expectedHash = this.generateHash(entry.data);
    if (entry.hash !== expectedHash) {
      errors.push('Hash mismatch - data may have been tampered with');
    }

    // Verify chain
    const entryIndex = this.entries.indexOf(entry);
    if (entryIndex > 0) {
      const previousEntry = this.entries[entryIndex - 1];
      if (entry.previousHash !== previousEntry.hash) {
        errors.push('Chain broken - previous hash mismatch');
      }
    }

    return {
      valid: errors.length === 0,
      entry,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  /**
   * Verify entire ledger integrity
   */
  static verifyLedger(): {
    valid: boolean;
    totalEntries: number;
    verifiedEntries: number;
    errors: string[];
  } {
    const errors: string[] = [];
    let verifiedCount = 0;

    for (const entry of this.entries) {
      const result = this.verifyEntry(entry.id);
      if (result.valid) {
        verifiedCount++;
      } else {
        errors.push(`Entry ${entry.id}: ${result.errors?.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      totalEntries: this.entries.length,
      verifiedEntries: verifiedCount,
      errors,
    };
  }

  /**
   * Get entry by ID
   */
  static getEntry(entryId: string): LedgerEntry | undefined {
    return this.entries.find((e) => e.id === entryId);
  }

  /**
   * Get all entries
   */
  static getAllEntries(): LedgerEntry[] {
    return [...this.entries];
  }

  /**
   * Get entries within date range
   */
  static getEntriesByDateRange(
    startDate: Date,
    endDate: Date
  ): LedgerEntry[] {
    return this.entries.filter(
      (e) => e.timestamp >= startDate && e.timestamp <= endDate
    );
  }

  /**
   * Generate hash for data (simple implementation)
   */
  private static generateHash(data: Record<string, unknown>): string {
    // In production, use a proper cryptographic hash function
    const json = JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < json.length; i++) {
      const char = json.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get hash of last entry
   */
  private static getLastHash(): string | undefined {
    if (this.entries.length === 0) {
      return undefined;
    }
    return this.entries[this.entries.length - 1].hash;
  }

  /**
   * Generate unique entry ID
   */
  private static generateEntryId(): string {
    return `ledger-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Enable/disable ledger
   */
  static setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Clear ledger (use with extreme caution)
   */
  static clear(): void {
    this.entries = [];
  }

  /**
   * Export ledger to JSON
   */
  static exportToJSON(): string {
    return JSON.stringify(
      {
        entries: this.entries,
        verification: this.verifyLedger(),
      },
      null,
      2
    );
  }

  /**
   * Get ledger statistics
   */
  static getStatistics(): {
    totalEntries: number;
    oldestEntry?: Date;
    newestEntry?: Date;
    isValid: boolean;
  } {
    const verification = this.verifyLedger();

    return {
      totalEntries: this.entries.length,
      oldestEntry: this.entries[0]?.timestamp,
      newestEntry: this.entries[this.entries.length - 1]?.timestamp,
      isValid: verification.valid,
    };
  }
}
