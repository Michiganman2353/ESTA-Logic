/**
 * Risk Interpreter - Plain English risk translation
 * Translates complex compliance risks into understandable language
 */

export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'none';

export interface RiskAssessment {
  level: RiskLevel;
  title: string;
  description: string;
  plainEnglish: string;
  actions: string[];
  legalContext?: string;
}

export class RiskInterpreter {
  /**
   * Interpret compliance risk in plain English
   */
  static interpretRisk(
    riskType: string,
    details?: Record<string, unknown>
  ): RiskAssessment {
    switch (riskType) {
      case 'missingPolicy':
        return this.getMissingPolicyRisk();
      case 'incorrectAccrual':
        return this.getIncorrectAccrualRisk(details);
      case 'recordkeepingGap':
        return this.getRecordkeepingGapRisk();
      case 'noEmployeeAccess':
        return this.getNoEmployeeAccessRisk();
      default:
        return this.getDefaultRisk();
    }
  }

  /**
   * Get risk level for missing policy
   */
  private static getMissingPolicyRisk(): RiskAssessment {
    return {
      level: 'critical',
      title: 'No Sick Time Policy Detected',
      description: 'Your organization does not have a documented sick time policy.',
      plainEnglish:
        'Michigan law requires all employers to have a written sick time policy. Without one, you could face penalties and legal challenges.',
      actions: [
        'Create a compliant sick time policy',
        'Distribute policy to all employees',
        'Keep signed acknowledgments on file',
      ],
      legalContext:
        'Michigan ESTA requires written policies to be provided to employees at hire and upon request.',
    };
  }

  /**
   * Get risk level for incorrect accrual
   */
  private static getIncorrectAccrualRisk(details?: Record<string, unknown>): RiskAssessment {
    const currentRate = details?.currentRate as string | undefined;
    
    return {
      level: 'high',
      title: 'Accrual Rate May Be Incorrect',
      description: currentRate
        ? `Your current accrual rate of ${currentRate} may not meet Michigan requirements.`
        : 'Your sick time accrual rate needs review.',
      plainEnglish:
        'If employees are not accruing sick time at the legally required rate, you could owe them back time and face compliance issues.',
      actions: [
        'Review your current accrual calculation',
        'Compare against Michigan ESTA requirements',
        'Update payroll system if needed',
        'Calculate any owed back time',
      ],
      legalContext:
        'Michigan ESTA requires specific accrual rates based on employer size and hours worked.',
    };
  }

  /**
   * Get risk level for recordkeeping gap
   */
  private static getRecordkeepingGapRisk(): RiskAssessment {
    return {
      level: 'medium',
      title: 'Recordkeeping Gaps Detected',
      description: 'Some sick time records are incomplete or missing.',
      plainEnglish:
        'If audited, you need to prove compliance. Missing records make that difficult and could result in penalties.',
      actions: [
        'Implement systematic record tracking',
        'Fill in missing historical data',
        'Set up automatic recordkeeping',
        'Establish backup procedures',
      ],
      legalContext:
        'Michigan ESTA requires employers to maintain records for at least 3 years.',
    };
  }

  /**
   * Get risk level for no employee access
   */
  private static getNoEmployeeAccessRisk(): RiskAssessment {
    return {
      level: 'medium',
      title: 'Employees Cannot Access Their Balances',
      description: 'Employees do not have a way to view their sick time balances.',
      plainEnglish:
        'Michigan law requires that employees can access their sick time information. Not providing this access could lead to complaints and penalties.',
      actions: [
        'Set up employee self-service portal',
        'Provide balance statements regularly',
        'Ensure balances are on pay stubs',
      ],
      legalContext:
        'Employees must have access to their sick time balances upon request.',
    };
  }

  /**
   * Get default risk assessment
   */
  private static getDefaultRisk(): RiskAssessment {
    return {
      level: 'low',
      title: 'Potential Compliance Issue',
      description: 'A potential compliance issue has been identified.',
      plainEnglish:
        'This is a minor issue that should be addressed to maintain full compliance.',
      actions: ['Review the specific concern', 'Take corrective action if needed'],
    };
  }

  /**
   * Get overall compliance risk score
   */
  static getComplianceScore(risks: RiskLevel[]): number {
    if (risks.includes('critical')) return 0;
    if (risks.includes('high')) return 50;
    if (risks.includes('medium')) return 75;
    if (risks.includes('low')) return 90;
    return 100;
  }

  /**
   * Get risk color for UI
   */
  static getRiskColor(level: RiskLevel): string {
    switch (level) {
      case 'critical':
        return 'red';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'blue';
      case 'none':
        return 'green';
      default:
        return 'gray';
    }
  }
}
