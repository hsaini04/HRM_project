// Shared enumerations and reference content for the SkillBridge prototype.
// Departments mirror the functional groups described in the CA-1 field study.

export const DEPARTMENTS = [
  'Sales & Business Development',
  'Lighting Design, Applications & Engineering',
  'System Sales Engineering & Field Service',
  'Customer Service & Project Support',
  'IT, HR, Finance & Administration',
  'Management & Functional Leadership',
];

export const EMPLOYMENT_STATUSES = ['Active', 'On Leave', 'Inactive'];

export const COMPETENCY_CATEGORIES = ['Core', 'Functional', 'Behavioural'];

export const PROFICIENCY_SCALE = [
  { level: 1, label: 'Awareness', description: 'Understands basic concepts; needs guidance.' },
  { level: 2, label: 'Working', description: 'Handles routine tasks with some support.' },
  { level: 3, label: 'Proficient', description: 'Works independently on normal role requirements.' },
  { level: 4, label: 'Advanced', description: 'Handles complex work and guides others.' },
];

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 4;

// A gap of this size or larger (requiredLevel - currentLevel) is treated as a priority gap.
export const PRIORITY_GAP_THRESHOLD = 2;

export const DELIVERY_MODES = ['Online', 'Instructor-led', 'On-the-job', 'Workshop'];
export const TRAINING_LEVELS = ['Foundation', 'Intermediate', 'Advanced'];
export const TRAINING_STATUSES = ['Active', 'Draft', 'Archived'];

export const ENROLLMENT_STATUSES = ['Not Started', 'In Progress', 'Completed', 'Overdue'];

export const CAREER_PLAN_STATUSES = ['Active', 'On Hold', 'Completed'];
export const GOAL_STATUSES = ['Not Started', 'In Progress', 'Achieved'];

export const DEMO_ROLES = ['hr', 'manager', 'employee'];
export const DEMO_ROLE_LABELS = { hr: 'HR / Admin', manager: 'Manager', employee: 'Employee' };

// Seeded fictional employees used as the default persona for each demo role.
export const DEMO_PERSONA_CODES = {
  hr: 'DEMO-1003',
  manager: 'DEMO-1001',
  employee: 'DEMO-1007',
};

// Only reserved documentation domains are accepted so that no real personal data is stored.
export const DEMO_EMAIL_PATTERN = /^[a-z0-9._%+-]+@example\.(com|org|net)$/i;

export const DATA_NOTICE =
  'Demonstration data only — not actual Lutron Electronics HR records. All employees, ratings, assignments and metrics are fictional.';

export const CA1_CONTEXT = {
  label: 'CA-1 field-study estimate (indicative, not audited)',
  currentWorkforce: '≈100–105 employees',
  nearTermRequirement: '≈15–25 additional employees',
  planningGap: '≈18–23 employees',
  workingFigure: 102,
  // CA-1 Table "Workforce Profile": approximate share of each employee category. The demo office is
  // sized to the working figure and split by these ranges' mid-points, normalised to 100% (the
  // ranges as printed add up to 87–98%). CA-1 groups field service with customer service.
  workforceMix: [
    { category: 'Sales & Business Development', share: '18–20%', departments: ['Sales & Business Development'] },
    {
      category: 'Lighting Design / Applications / Engineering',
      share: '27–30%',
      departments: ['Lighting Design, Applications & Engineering'],
    },
    {
      category: 'Customer Service / Field / Project Support',
      share: '14–16%',
      departments: ['System Sales Engineering & Field Service', 'Customer Service & Project Support'],
    },
    { category: 'IT / HR / Finance / Administration', share: '18–20%', departments: ['IT, HR, Finance & Administration'] },
    { category: 'Management / Functional Leadership', share: '10–12%', departments: ['Management & Functional Leadership'] },
  ],
};
