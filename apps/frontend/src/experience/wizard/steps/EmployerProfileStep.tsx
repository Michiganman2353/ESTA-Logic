/**
 * EmployerProfileStep - Collect employer information
 */

import { useState } from 'react';
import PageTransition from '../../animations/PageTransition';
import { useWizard } from '../core/useWizard';

export default function EmployerProfileStep() {
  const { next, back, setData, getData } = useWizard();
  const [companyName, setCompanyName] = useState(getData('companyName') || '');
  const [employerType, setEmployerType] = useState(
    getData('employerType') || ''
  );

  const handleContinue = () => {
    setData('companyName', companyName);
    setData('employerType', employerType);
    next();
  };

  const isValid = companyName.trim() !== '' && employerType !== '';

  return (
    <PageTransition>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <h1 className="mb-4 text-3xl font-bold text-gray-900">
          Tell Us About Your Business
        </h1>
        <p className="mb-8 text-gray-600">
          This helps us determine which ESTA requirements apply to you.
        </p>

        <div className="mb-8 rounded-xl bg-white p-8 shadow-lg">
          <div className="mb-6">
            <label
              htmlFor="companyName"
              className="mb-2 block font-semibold text-gray-900"
            >
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your company name"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2 block font-semibold text-gray-900">
              Employer Type
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  value: 'small',
                  label: 'Small Business',
                  desc: 'Fewer than 50 employees',
                },
                {
                  value: 'large',
                  label: 'Large Business',
                  desc: '50 or more employees',
                },
                {
                  value: 'municipal',
                  label: 'Municipal',
                  desc: 'Government entity',
                },
                {
                  value: 'nonprofit',
                  label: 'Nonprofit',
                  desc: '501(c)(3) organization',
                },
              ].map((type) => (
                <button
                  key={type.value}
                  onClick={() => setEmployerType(type.value)}
                  className={`rounded-lg border-2 p-4 text-left transition-all ${
                    employerType === type.value
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-300 bg-white hover:border-blue-300'
                  }`}
                >
                  <div className="font-semibold text-gray-900">
                    {type.label}
                  </div>
                  <div className="text-sm text-gray-600">{type.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={back}
            className="rounded-xl border border-gray-300 px-8 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          >
            ← Back
          </button>
          <button
            onClick={handleContinue}
            disabled={!isValid}
            className="rounded-xl bg-blue-600 px-8 py-3 font-semibold text-white shadow-md transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue →
          </button>
        </div>
      </div>
    </PageTransition>
  );
}
