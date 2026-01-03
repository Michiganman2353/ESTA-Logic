/**
 * EmployeeCountStep - Employee count collection with compliance tier determination
 *
 * Purpose: Collect employee count and explain which ESTA tier applies
 * Tone: Educational, reassuring, clear about implications
 */

import React, { useState } from 'react';

export interface EmployeeCountData {
  employeeCount: number;
  fullTimeCount?: number;
  partTimeCount?: number;
}

export interface EmployeeCountStepProps {
  /** Initial data if returning to this step */
  initialData?: Partial<EmployeeCountData>;

  /** Callback when user proceeds */
  onNext: (data: EmployeeCountData) => void;

  /** Callback to go back */
  onBack: () => void;
}

/**
 * Employee Count Step Component
 *
 * Implements guided employee count collection with:
 * - Clear explanation of why this matters
 * - Real-time tier preview
 * - Legal context in plain language
 * - Examples for clarity
 */
export const EmployeeCountStep: React.FC<EmployeeCountStepProps> = ({
  initialData = {},
  onNext,
  onBack,
}) => {
  const [formData, setFormData] = useState<EmployeeCountData>({
    employeeCount: initialData.employeeCount || 0,
    fullTimeCount: initialData.fullTimeCount,
    partTimeCount: initialData.partTimeCount,
  });

  const [showBreakdown, setShowBreakdown] = useState(false);

  const handleChange = (field: keyof EmployeeCountData, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData((prev) => ({
      ...prev,
      [field]: numValue,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.employeeCount < 1) {
      return;
    }

    onNext(formData);
  };

  // Determine compliance tier
  const isSmallEmployer = formData.employeeCount < 10;
  const tier = isSmallEmployer ? 'small' : 'large';
  const accrualCap = isSmallEmployer ? 40 : 72;

  return (
    <div className="employee-count-step">
      {/* Step Header */}
      <div className="step-header">
        <h2 className="step-title">How many employees do you have?</h2>
        <p className="step-description">
          This determines your compliance tier under Michigan ESTA law.
          Different rules apply for small and large employers.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="step-form">
        {/* Total Employee Count */}
        <div className="form-field primary-field">
          <label htmlFor="employeeCount" className="field-label">
            Total Number of Employees *
          </label>
          <input
            id="employeeCount"
            type="number"
            min="1"
            className="field-input large-input"
            value={formData.employeeCount || ''}
            onChange={(e) => handleChange('employeeCount', e.target.value)}
            placeholder="Enter number"
            required
          />
          <div className="field-help">
            Include all full-time and part-time employees in Michigan.
          </div>
        </div>

        {/* Optional Breakdown */}
        <div className="optional-breakdown">
          <button
            type="button"
            className="breakdown-toggle"
            onClick={() => setShowBreakdown(!showBreakdown)}
          >
            {showBreakdown ? '−' : '+'} Add full-time / part-time breakdown
            (optional)
          </button>

          {showBreakdown && (
            <div className="breakdown-fields">
              <div className="form-field breakdown-field">
                <label htmlFor="fullTimeCount" className="field-label">
                  Full-Time Employees
                </label>
                <input
                  id="fullTimeCount"
                  type="number"
                  min="0"
                  className="field-input"
                  value={formData.fullTimeCount || ''}
                  onChange={(e) =>
                    handleChange('fullTimeCount', e.target.value)
                  }
                  placeholder="0"
                />
              </div>

              <div className="form-field breakdown-field">
                <label htmlFor="partTimeCount" className="field-label">
                  Part-Time Employees
                </label>
                <input
                  id="partTimeCount"
                  type="number"
                  min="0"
                  className="field-input"
                  value={formData.partTimeCount || ''}
                  onChange={(e) =>
                    handleChange('partTimeCount', e.target.value)
                  }
                  placeholder="0"
                />
              </div>
            </div>
          )}
        </div>

        {/* Live Tier Preview */}
        {formData.employeeCount > 0 && (
          <div className={`tier-preview ${tier}`}>
            <div className="tier-icon">{isSmallEmployer ? '🏢' : '🏗️'}</div>
            <div className="tier-content">
              <div className="tier-category">
                {isSmallEmployer ? 'Small Employer' : 'Large Employer'}
              </div>
              <div className="tier-description">
                With {formData.employeeCount} employee
                {formData.employeeCount !== 1 ? 's' : ''}, you fall under
                Michigan's {isSmallEmployer ? 'small' : 'large'} employer rules.
              </div>
              <div className="tier-details">
                <div className="tier-detail-item">
                  <span className="detail-label">Accrual Rate:</span>
                  <span className="detail-value">
                    1 hour per 30 hours worked
                  </span>
                </div>
                <div className="tier-detail-item">
                  <span className="detail-label">Annual Cap:</span>
                  <span className="detail-value">{accrualCap} hours</span>
                </div>
                <div className="tier-detail-item">
                  <span className="detail-label">Carryover:</span>
                  <span className="detail-value">Up to {accrualCap} hours</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legal Context */}
        <div className="guidance-box">
          <div className="guidance-icon">💡</div>
          <div className="guidance-content">
            <div className="guidance-title">Why this matters</div>
            <div className="guidance-text">
              Michigan ESTA has different requirements based on employer size:
            </div>
            <ul className="guidance-list">
              <li>
                <strong>Small employers (&lt;10 employees):</strong> 40-hour
                annual accrual cap
              </li>
              <li>
                <strong>Large employers (≥10 employees):</strong> 72-hour annual
                accrual cap
              </li>
            </ul>
            <div className="guidance-note">
              We automatically configure the correct rules for you based on your
              employee count.
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="step-navigation">
          <button type="button" className="btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={formData.employeeCount < 1}
          >
            Continue →
          </button>
        </div>
      </form>

      {/* Progress Reassurance */}
      <div className="step-footer">
        <div className="reassurance-message">
          <span className="reassurance-icon">⚙️</span>
          <span className="reassurance-text">
            Based on your employee count, we'll automatically set up the right
            compliance policy.
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 *
 * .employee-count-step {
 *   max-width: 700px;
 *   margin: 0 auto;
 *   padding: 32px 24px;
 * }
 *
 * .primary-field .large-input {
 *   font-size: 1.5rem;
 *   padding: 16px;
 *   text-align: center;
 *   font-weight: 500;
 * }
 *
 * .tier-preview {
 *   display: flex;
 *   gap: 20px;
 *   padding: 24px;
 *   margin: 32px 0;
 *   border-radius: 12px;
 *   border: 2px solid;
 *   background: white;
 * }
 *
 * .tier-preview.small {
 *   border-color: #3b82f6;
 *   background: #eff6ff;
 * }
 *
 * .tier-preview.large {
 *   border-color: #8b5cf6;
 *   background: #f5f3ff;
 * }
 *
 * .tier-icon {
 *   font-size: 3rem;
 *   line-height: 1;
 * }
 *
 * .tier-category {
 *   font-size: 1.25rem;
 *   font-weight: 600;
 *   color: #1a1a1a;
 *   margin-bottom: 8px;
 * }
 *
 * .tier-description {
 *   font-size: 1rem;
 *   color: #4a4a4a;
 *   margin-bottom: 16px;
 * }
 *
 * .tier-details {
 *   display: flex;
 *   flex-direction: column;
 *   gap: 8px;
 * }
 *
 * .tier-detail-item {
 *   display: flex;
 *   justify-content: space-between;
 *   padding: 8px 12px;
 *   background: white;
 *   border-radius: 6px;
 *   font-size: 0.875rem;
 * }
 *
 * .detail-label {
 *   color: #6a6a6a;
 * }
 *
 * .detail-value {
 *   font-weight: 500;
 *   color: #1a1a1a;
 * }
 *
 * .breakdown-toggle {
 *   background: none;
 *   border: none;
 *   color: #2563eb;
 *   font-size: 0.875rem;
 *   cursor: pointer;
 *   padding: 8px 0;
 *   text-align: left;
 * }
 *
 * .breakdown-fields {
 *   display: grid;
 *   grid-template-columns: 1fr 1fr;
 *   gap: 16px;
 *   margin-top: 16px;
 * }
 *
 * .guidance-list {
 *   margin: 12px 0;
 *   padding-left: 20px;
 * }
 *
 * .guidance-list li {
 *   margin-bottom: 8px;
 *   color: #4a4a4a;
 * }
 *
 * .guidance-note {
 *   margin-top: 12px;
 *   padding: 12px;
 *   background: #f0f9ff;
 *   border-radius: 6px;
 *   font-size: 0.875rem;
 *   color: #1e40af;
 * }
 */

export default EmployeeCountStep;
