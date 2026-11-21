import {
  calculateAccrualV2,
  getRulesetVersion,
} from '@esta-tracker/accrual-engine';
import type { ScenarioId } from './content';

export const scenarios: Record<
  ScenarioId,
  {
    title: string;
    context: string;
    question: string;
    answers: { id: string; label: string }[];
    correct: string;
    explanation: string;
  }
> = {
  accrual: {
    title: 'Explore a work period',
    context:
      'Practice only · An illustrative large employer using hourly accrual, with no time accrued earlier in the year. This is not an employee record or a full eligibility decision.',
    question:
      'Which result represents newly accrued time for this work period?',
    answers: [
      { id: 'zero', label: 'No time is earned' },
      { id: 'earned', label: 'engine-result' },
      {
        id: 'annual',
        label: 'The entire annual allocation is earned each period',
      },
    ],
    correct: 'earned',
    explanation:
      'The result comes directly from the repository’s versioned calculation engine. Policy, eligibility, waiting periods, carryover and other facts still need review before a real decision.',
  },
  'import-review': {
    title: 'Find the duplicate',
    context:
      'Practice roster · Two synthetic rows: “Example person, demo@example.test, PAY-01” and “Example person, DEMO@example.test, PAY-01”. No employee information has been loaded.',
    question: 'What should happen before this roster is saved?',
    answers: [
      { id: 'save', label: 'Save both rows as separate employees' },
      {
        id: 'correct',
        label: 'Resolve the duplicate email and payroll ID, then review again',
      },
      { id: 'merge', label: 'Merge accounts automatically without review' },
    ],
    correct: 'correct',
    explanation:
      'Email matching is case-insensitive. Review duplicate identities and incorrect matches before saving. A mapped CSV export is supported in the workspace code; live QuickBooks synchronization is not implemented.',
  },
  'request-status': {
    title: 'Submitted is not approved',
    context:
      'Practice request · An imaginary employee has just submitted a time-off request. Its status reads “Pending”. No real request is being sent.',
    question: 'What does Pending mean?',
    answers: [
      { id: 'approved', label: 'The employer has approved it' },
      {
        id: 'waiting',
        label: 'It is saved as a request and awaits an employer decision',
      },
      { id: 'denied', label: 'It was automatically denied' },
    ],
    correct: 'waiting',
    explanation:
      'The employee can check status and history. The employer’s saved decision records approval or denial and its reason. A pending request is not a guarantee of approval.',
  },
  'audit-review': {
    title: 'Make an adjustment explainable',
    context:
      'Practice history · “Recorded adjustment: +2 hours; actor: example administrator; time: example timestamp; source or reason: blank.” These are invented teaching details, not a company record.',
    question: 'Which missing detail needs attention?',
    answers: [
      { id: 'reason', label: 'The source or reason supporting the adjustment' },
      { id: 'medical', label: 'The employee’s private medical diagnosis' },
      {
        id: 'erase',
        label: 'Erase the history so the new balance stands alone',
      },
    ],
    correct: 'reason',
    explanation:
      'A useful history preserves what changed, who changed it, when and why. Accurate sources and an appropriate retention policy help future reviewers understand the record. Medical details are not needed for this example.',
  },
};

/** Reuses the authoritative engine. The academy contains no ESTA formula or policy constants. */
export function practiceAccrual(hours: number) {
  return {
    ...calculateAccrualV2(hours, 'large', 0, new Date('2026-01-01T00:00:00Z')),
    version: getRulesetVersion(),
  };
}
