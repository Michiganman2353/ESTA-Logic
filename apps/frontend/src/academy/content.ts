export const CONTENT_VERSION = 'academy-1.0.0';
export type QuestId = 'setup' | 'payroll' | 'employee' | 'records';
export type ScenarioId =
  'accrual' | 'import-review' | 'request-status' | 'audit-review';
export interface Choice {
  label: string;
  next?: string;
  requires?: QuestId[];
  completeQuest?: QuestId;
  scenario?: ScenarioId;
}
export interface DialogueNode {
  id: string;
  title: string;
  text: string;
  choices: Choice[];
}
export interface Guide {
  id: string;
  name: string;
  title: string;
  location: string;
  mark: string;
  x: number;
  y: number;
  building: { x: number; y: number; width: number; height: number };
  nodes: DialogueNode[];
}
export const quests: { id: QuestId; label: string; detail: string }[] = [
  {
    id: 'setup',
    label: 'Plan your workspace',
    detail: 'Explore setup and the calculation example.',
  },
  {
    id: 'payroll',
    label: 'Review before importing',
    detail: 'Catch a duplicate in a practice roster.',
  },
  {
    id: 'employee',
    label: 'Follow a request',
    detail: 'Distinguish submitted from approved.',
  },
  {
    id: 'records',
    label: 'Keep a useful history',
    detail: 'Find what is missing from an adjustment.',
  },
];

export const guides: Guide[] = [
  {
    id: 'employer-guide',
    name: 'Morgan',
    title: 'Employer Guide',
    location: 'Employer Office',
    mark: '01',
    x: 160,
    y: 216,
    building: { x: 70, y: 65, width: 180, height: 116 },
    nodes: [
      {
        id: 'start',
        title: 'Build a workable process',
        text: 'Start with your policy, benefit year and workforce count. An employer account creates a company workspace; verifying your email activates access. What would you like to explore?',
        choices: [
          { label: 'Walk me through setup', next: 'setup' },
          { label: 'Accrual or frontloading?', next: 'methods' },
          { label: 'I want to learn the rules first', next: 'rules' },
        ],
      },
      {
        id: 'setup',
        title: 'From account to company',
        text: 'Create your employer account, verify your email, document your program settings and invite employees using your company link. Employees verify their email and request membership; you review and approve them. Record opening balances with their source. Company size needs a careful workforce review, not just a guess from today’s headcount.',
        choices: [
          { label: 'How do the calculation methods differ?', next: 'methods' },
          { label: 'Back to the office introduction', next: 'start' },
        ],
      },
      {
        id: 'methods',
        title: 'Two approaches to learn about',
        text: 'Accrual builds earned time using hours worked. Frontloading records an allocation at the start of the relevant period under the applicable policy and rules. Choosing a method in program settings documents your process; the current workspace still uses employer-maintained balances. Let’s inspect a large-employer work-period example using the existing calculation engine.',
        choices: [
          {
            label: 'Try the accrual example',
            scenario: 'accrual',
            next: 'finished',
          },
        ],
      },
      {
        id: 'rules',
        title: 'Read before deciding',
        text: 'Coverage, company size, permitted uses, waiting periods and recordkeeping can change what applies. The Rules Library links to Michigan’s official guidance. The academy explains the product; it does not certify your policy or replace professional advice.',
        choices: [{ label: 'Return to the setup path', next: 'setup' }],
      },
      {
        id: 'finished',
        title: 'Your setup plan',
        text: 'You explored a calculation, not a personal balance. In the real workspace, confirm your policy and employee records before recording an adjustment. Your next stop can be the Payroll Desk.',
        choices: [
          {
            label: 'Complete the setup lesson',
            completeQuest: 'setup',
            next: 'done',
          },
        ],
      },
      {
        id: 'done',
        title: 'A practical first step',
        text: 'Your learning milestone is complete. You can revisit the lesson or keep exploring. Completing the academy does not approve an account or establish compliance.',
        choices: [{ label: 'Review the setup path', next: 'setup' }],
      },
    ],
  },
  {
    id: 'payroll-specialist',
    name: 'Alex',
    title: 'Payroll Specialist',
    location: 'Payroll Desk',
    mark: '02',
    x: 480,
    y: 216,
    building: { x: 390, y: 65, width: 180, height: 116 },
    nodes: [
      {
        id: 'start',
        title: 'A roster is a starting point',
        text: 'A mapped CSV roster can organize employee names, email addresses and payroll IDs. Review creates, updates and account matches before saving. Hours worked are a separate input to accrual calculations; a roster import does not automatically earn sick time or create employee sign-ins.',
        choices: [
          {
            label: 'Practice reviewing a duplicate',
            scenario: 'import-review',
            next: 'reviewed',
          },
          { label: 'What about QuickBooks?', next: 'quickbooks' },
        ],
      },
      {
        id: 'quickbooks',
        title: 'Be precise about what is connected',
        text: 'This codebase includes reviewed CSV roster imports. A QuickBooks export must be mapped to the supported columns. A live QuickBooks connection, OAuth authorization and ongoing synchronization are future work—not active services. Never import wages, tax identifiers or medical details into a roster file.',
        choices: [
          {
            label: 'Practice the review step',
            scenario: 'import-review',
            next: 'reviewed',
          },
        ],
      },
      {
        id: 'reviewed',
        title: 'Correct first, save second',
        text: 'Correct the source file and review again when a match is wrong. Separate companies need explicit authorization; a bookkeeper’s access to one business does not grant access to another.',
        choices: [
          {
            label: 'Complete the payroll lesson',
            completeQuest: 'payroll',
            next: 'done',
          },
        ],
      },
      {
        id: 'done',
        title: 'Review is part of the work',
        text: 'You practiced spotting a duplicate. In a real import, inspect every row and resolve conflicts before saving.',
        choices: [{ label: 'Review QuickBooks scope', next: 'quickbooks' }],
      },
    ],
  },
  {
    id: 'employee-guide',
    name: 'Sam',
    title: 'Employee Guide',
    location: 'Employee Center',
    mark: '03',
    x: 800,
    y: 216,
    building: { x: 710, y: 65, width: 180, height: 116 },
    nodes: [
      {
        id: 'start',
        title: 'Know where your request stands',
        text: 'After email verification and employer approval, employees can view recorded earned time, send a leave request and review its status and history. An unrecorded balance is shown as missing, not invented as zero. This academy uses only explicitly labeled practice examples.',
        choices: [
          {
            label: 'Follow a practice request',
            scenario: 'request-status',
            next: 'history',
          },
          { label: 'Why am I waiting for access?', next: 'access' },
        ],
      },
      {
        id: 'access',
        title: 'Identity first, membership next',
        text: 'An account is not company membership. Verify your email, then wait for your employer to approve your request to join. Use Check account again after approval. If you forget your password, use the password-reset link on the sign-in page.',
        choices: [
          {
            label: 'Try the request scenario',
            scenario: 'request-status',
            next: 'history',
          },
        ],
      },
      {
        id: 'history',
        title: 'A request has a history',
        text: 'Submitted means the request is awaiting review. A saved employer decision records the result and reason. Approval deducts recorded hours once; denial does not deduct them. Your own history helps explain what changed and when.',
        choices: [
          {
            label: 'Complete the employee lesson',
            completeQuest: 'employee',
            next: 'done',
          },
        ],
      },
      {
        id: 'done',
        title: 'Clear status, clear next step',
        text: 'You can return to the scenario any time. Academy actions never submit a real leave request or change an employee balance.',
        choices: [{ label: 'Review employee access', next: 'access' }],
      },
    ],
  },
  {
    id: 'compliance-inspector',
    name: 'Jordan',
    title: 'Compliance Inspector',
    location: 'Compliance Inspector',
    mark: '04',
    x: 160,
    y: 478,
    building: { x: 70, y: 330, width: 180, height: 112 },
    nodes: [
      {
        id: 'start',
        title: 'Could someone explain this later?',
        text: 'Useful records show who made a decision, when it happened, what changed and why. Accurate hours, source documents, approval history and retention practices support later review. A polished dashboard alone is not proof of compliance.',
        choices: [
          {
            label: 'Inspect a practice adjustment',
            scenario: 'audit-review',
            next: 'reviewed',
          },
          { label: 'How should records be retained?', next: 'retention' },
          {
            label: 'Connect all four lessons',
            requires: ['setup', 'payroll', 'employee', 'records'],
            next: 'connected',
          },
        ],
      },
      {
        id: 'retention',
        title: 'Keep records deliberately',
        text: 'Confirm the current retention requirements with official Michigan guidance and your organization’s policy. Preserve the relevant hours, adjustments, requests, decisions and supporting sources. Do not delete or overwrite history simply because a balance has changed.',
        choices: [
          {
            label: 'Find the missing information',
            scenario: 'audit-review',
            next: 'reviewed',
          },
        ],
      },
      {
        id: 'reviewed',
        title: 'Make the reason recoverable',
        text: 'A source or reason helps a later reviewer understand an adjustment. The real workspace records changes through the authenticated service and checks company membership; these practice examples do neither.',
        choices: [
          {
            label: 'Complete the records lesson',
            completeQuest: 'records',
            next: 'done',
          },
        ],
      },
      {
        id: 'done',
        title: 'Records support people',
        text: 'Your records milestone is complete. Visit the Audit Center to connect the lessons to a real workflow, or review the inspection again.',
        choices: [{ label: 'Return to the inspector', next: 'start' }],
      },
      {
        id: 'connected',
        title: 'From practice to a real process',
        text: 'You have explored all four learning milestones. The next step is to verify your policy, create or sign in to an account, and follow the real workspace’s setup and authorization steps. This is learning progress, not a compliance certification.',
        choices: [{ label: 'Review the inspection lesson', next: 'start' }],
      },
    ],
  },
  {
    id: 'rules-librarian',
    name: 'Casey',
    title: 'Rules Librarian',
    location: 'Rules Library',
    mark: '05',
    x: 480,
    y: 478,
    building: { x: 390, y: 330, width: 180, height: 112 },
    nodes: [
      {
        id: 'start',
        title: 'Keep the source in view',
        text: 'The academy’s dialogue is versioned educational content. The accrual scenario calls the repository’s existing rules engine; it does not create its own rules. Check the official state guidance before using an example to make an employment decision.',
        choices: [{ label: 'Where should I begin?', next: 'begin' }],
      },
      {
        id: 'begin',
        title: 'Choose the path you need',
        text: 'Employers can start at the Employer Office. Employees can start at the Employee Center. Bookkeepers can explore the Payroll Desk and Audit Center. You can use the location list instead of walking; no learning content is locked behind movement.',
        choices: [{ label: 'Return to the library', next: 'start' }],
      },
    ],
  },
  {
    id: 'audit-archivist',
    name: 'Riley',
    title: 'Audit Archivist',
    location: 'Audit Center',
    mark: '06',
    x: 800,
    y: 478,
    building: { x: 710, y: 330, width: 180, height: 112 },
    nodes: [
      {
        id: 'start',
        title: 'Keep practice and records separate',
        text: 'This world keeps only temporary learning progress in this browser visit. It cannot approve memberships, adjust balances, import payroll or sign you in. The existing authenticated application remains responsible for all real records.',
        choices: [
          { label: 'What is the real workflow?', next: 'workflow' },
          {
            label: 'Review my next step',
            requires: ['setup', 'payroll', 'employee', 'records'],
            next: 'ready',
          },
        ],
      },
      {
        id: 'workflow',
        title: 'Follow the evidence',
        text: 'Confirm your policy, set up your company, invite and approve employees, review opening balances, then process requests and retain the resulting history. Bookkeepers work only in companies that explicitly authorize them. Production API configuration and account migration are separate release gates; completing a tour does not fix them.',
        choices: [
          { label: 'Return to the archive introduction', next: 'start' },
        ],
      },
      {
        id: 'ready',
        title: 'Take the next practical step',
        text: 'You completed all four learning milestones. When you are ready, use the links outside this conversation to learn more, set up your company or sign in. Real access still requires verification and the appropriate company membership.',
        choices: [{ label: 'Review the real workflow', next: 'workflow' }],
      },
    ],
  },
];
