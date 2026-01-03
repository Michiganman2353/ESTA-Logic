/**
 * CompanyInfoStep - Company information collection step
 *
 * Purpose: Collect basic company information needed for compliance setup
 * Tone: Supportive, clear about why we need information
 */

import React, { useState } from 'react';

export interface CompanyInfoData {
  companyName: string;
  industry: string;
  address?: string;
  contactEmail?: string;
}

export interface CompanyInfoStepProps {
  /** Initial data if returning to this step */
  initialData?: Partial<CompanyInfoData>;

  /** Callback when user proceeds */
  onNext: (data: CompanyInfoData) => void;

  /** Callback to go back */
  onBack: () => void;

  /** Validation errors from parent */
  errors?: Record<string, string>;
}

/**
 * Company Info Step Component
 *
 * Implements guided data collection:
 * - Clear field labels with contextual help
 * - Supportive validation messages
 * - Progress indication
 * - Easy navigation
 */
export const CompanyInfoStep: React.FC<CompanyInfoStepProps> = ({
  initialData = {},
  onNext,
  onBack,
  errors = {},
}) => {
  const [formData, setFormData] = useState<CompanyInfoData>({
    companyName: initialData.companyName || '',
    industry: initialData.industry || '',
    address: initialData.address || '',
    contactEmail: initialData.contactEmail || '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const handleChange = (field: keyof CompanyInfoData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleBlur = (field: keyof CompanyInfoData) => {
    setTouched((prev) => ({
      ...prev,
      [field]: true,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      companyName: true,
      industry: true,
      address: true,
      contactEmail: true,
    });

    // Basic validation
    if (!formData.companyName || !formData.industry) {
      return;
    }

    onNext(formData);
  };

  const showError = (field: keyof CompanyInfoData) => {
    return touched[field] && !formData[field];
  };

  return (
    <div className="company-info-step">
      {/* Step Header */}
      <div className="step-header">
        <h2 className="step-title">Tell us about your company</h2>
        <p className="step-description">
          This helps us customize your compliance requirements. We only collect
          what's needed for compliance.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="step-form">
        {/* Company Name */}
        <div className="form-field">
          <label htmlFor="companyName" className="field-label">
            Company Name *
          </label>
          <input
            id="companyName"
            type="text"
            className={`field-input ${showError('companyName') ? 'error' : ''}`}
            value={formData.companyName}
            onChange={(e) => handleChange('companyName', e.target.value)}
            onBlur={() => handleBlur('companyName')}
            placeholder="Acme Corporation"
            required
          />
          {showError('companyName') && (
            <div className="field-error">
              <span className="error-icon">ℹ️</span>
              <span className="error-text">
                Company name is needed. This helps us ensure you're compliant
                with Michigan law.
              </span>
            </div>
          )}
          <div className="field-help">
            Use your legal business name as registered with the state.
          </div>
        </div>

        {/* Industry */}
        <div className="form-field">
          <label htmlFor="industry" className="field-label">
            Industry *
          </label>
          <select
            id="industry"
            className={`field-input ${showError('industry') ? 'error' : ''}`}
            value={formData.industry}
            onChange={(e) => handleChange('industry', e.target.value)}
            onBlur={() => handleBlur('industry')}
            required
          >
            <option value="">Select your industry</option>
            <option value="technology">Technology</option>
            <option value="healthcare">Healthcare</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="hospitality">Hospitality</option>
            <option value="construction">Construction</option>
            <option value="professional-services">Professional Services</option>
            <option value="other">Other</option>
          </select>
          {showError('industry') && (
            <div className="field-error">
              <span className="error-icon">ℹ️</span>
              <span className="error-text">
                Please select your industry. This helps us understand your
                business context.
              </span>
            </div>
          )}
        </div>

        {/* Address (Optional) */}
        <div className="form-field">
          <label htmlFor="address" className="field-label">
            Business Address <span className="optional-label">(Optional)</span>
          </label>
          <input
            id="address"
            type="text"
            className="field-input"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Main St, Detroit, MI 48201"
          />
          <div className="field-help">
            Your primary business location in Michigan.
          </div>
        </div>

        {/* Contact Email (Optional) */}
        <div className="form-field">
          <label htmlFor="contactEmail" className="field-label">
            Contact Email <span className="optional-label">(Optional)</span>
          </label>
          <input
            id="contactEmail"
            type="email"
            className="field-input"
            value={formData.contactEmail}
            onChange={(e) => handleChange('contactEmail', e.target.value)}
            placeholder="contact@company.com"
          />
          <div className="field-help">
            We'll send important compliance updates here.
          </div>
        </div>

        {/* Guidance Box */}
        <div className="guidance-box">
          <div className="guidance-icon">💡</div>
          <div className="guidance-content">
            <div className="guidance-title">Why do we ask?</div>
            <div className="guidance-text">
              This information helps us configure the right compliance settings
              for your business. Everything is encrypted and stored securely.
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="step-navigation">
          <button type="button" className="btn-secondary" onClick={onBack}>
            ← Back
          </button>
          <button type="submit" className="btn-primary">
            Continue →
          </button>
        </div>
      </form>

      {/* Progress Reassurance */}
      <div className="step-footer">
        <div className="reassurance-message">
          <span className="reassurance-icon">💾</span>
          <span className="reassurance-text">
            Your progress is automatically saved. You can pause anytime.
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Example CSS (to be implemented in actual stylesheet):
 *
 * .company-info-step {
 *   max-width: 600px;
 *   margin: 0 auto;
 *   padding: 32px 24px;
 * }
 *
 * .step-header {
 *   margin-bottom: 32px;
 * }
 *
 * .step-title {
 *   font-size: 1.875rem;
 *   font-weight: 600;
 *   color: #1a1a1a;
 *   margin-bottom: 12px;
 * }
 *
 * .step-description {
 *   font-size: 1rem;
 *   color: #6a6a6a;
 *   line-height: 1.6;
 * }
 *
 * .form-field {
 *   margin-bottom: 24px;
 * }
 *
 * .field-label {
 *   display: block;
 *   font-weight: 500;
 *   margin-bottom: 8px;
 *   color: #2a2a2a;
 * }
 *
 * .field-input {
 *   width: 100%;
 *   padding: 12px;
 *   font-size: 1rem;
 *   border: 1px solid #d1d5db;
 *   border-radius: 6px;
 *   transition: border-color 0.2s ease;
 * }
 *
 * .field-input:focus {
 *   outline: none;
 *   border-color: #2563eb;
 *   box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
 * }
 *
 * .field-input.error {
 *   border-color: #dc2626;
 * }
 *
 * .field-error {
 *   display: flex;
 *   align-items: start;
 *   gap: 8px;
 *   margin-top: 8px;
 *   padding: 12px;
 *   background: #fef2f2;
 *   border-radius: 6px;
 * }
 *
 * .error-text {
 *   font-size: 0.875rem;
 *   color: #991b1b;
 * }
 *
 * .field-help {
 *   margin-top: 6px;
 *   font-size: 0.875rem;
 *   color: #6a6a6a;
 * }
 *
 * .guidance-box {
 *   display: flex;
 *   gap: 16px;
 *   padding: 20px;
 *   background: #f0f9ff;
 *   border-radius: 8px;
 *   margin: 32px 0;
 * }
 *
 * .step-navigation {
 *   display: flex;
 *   justify-content: space-between;
 *   margin-top: 32px;
 * }
 *
 * .btn-primary, .btn-secondary {
 *   padding: 12px 32px;
 *   font-size: 1rem;
 *   font-weight: 500;
 *   border-radius: 6px;
 *   cursor: pointer;
 *   transition: all 0.2s ease;
 * }
 *
 * .btn-primary {
 *   background: #2563eb;
 *   color: white;
 *   border: none;
 * }
 *
 * .btn-secondary {
 *   background: white;
 *   color: #4a4a4a;
 *   border: 1px solid #d1d5db;
 * }
 */

export default CompanyInfoStep;
