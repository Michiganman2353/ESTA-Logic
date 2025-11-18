/**
 * Shared types for Vercel API functions
 */

export interface CronJobResult {
  success: boolean;
  message: string;
  itemsProcessed?: number;
  errors?: string[];
  timestamp: string;
}

export interface AccrualUpdate {
  userId: string;
  employerId: string;
  hoursWorked: number;
  accrued: number;
  previousBalance: number;
  newBalance: number;
}

export interface ComplianceIssue {
  employerId: string;
  issueType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedEmployees?: number;
}

export interface BillingReport {
  tenantId: string;
  companyName: string;
  employeeCount: number;
  billingPeriod: string;
  amount: number;
  status: 'generated' | 'sent' | 'paid';
}
