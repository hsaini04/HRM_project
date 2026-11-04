// Proposed, illustrative job roles and expected proficiency levels (1–4).
// Requirements use the competency keys from competencies.js, e.g. "ps4" = Problem-Solving at level 4.

const LD = 'Lighting Design, Applications & Engineering';
const SSE = 'System Sales Engineering & Field Service';
const CS = 'Customer Service & Project Support';
const SALES = 'Sales & Business Development';
const SUPPORT = 'IT, HR, Finance & Administration';
const MGMT = 'Management & Functional Leadership';

export const jobRoles = [
  // Lighting Design track
  {
    title: 'Junior Lighting Designer',
    department: LD,
    track: 'Lighting Design',
    trackLevel: 1,
    summary: 'Supports lighting-design work on smaller projects under the guidance of senior designers.',
    requirements: 'ps2 co2 ct3 qd3 tla3 lf3 lcs2 tools3 dwg2 est2 psc2 comm2 stk1 xfc2 tpm2 adapt3 own3',
  },
  {
    title: 'Lighting Design Specialist',
    department: LD,
    track: 'Lighting Design',
    trackLevel: 2,
    isFocusRole: true,
    summary:
      'Understands project and customer lighting requirements, prepares lighting-design concepts, calculations and documentation using relevant design tools, and coordinates with sales, applications and engineering teams to deliver technically appropriate solutions.',
    responsibilities: [
      'Interpret project drawings, specifications and customer requirements',
      'Prepare lighting-design concepts, layouts and calculations',
      'Apply lighting-control and shading concepts to the design intent',
      'Prepare design estimates and technical documentation',
      'Coordinate design inputs with sales, applications and engineering',
      'Present and explain design decisions to stakeholders',
    ],
    requirements: 'ps4 co3 ct3 qd4 tla3 lf4 lcs3 tools3 dwg4 est3 psc3 comm4 stk3 xfc4 tpm3 adapt3 own4',
  },
  {
    title: 'Senior Lighting Design Specialist',
    department: LD,
    track: 'Lighting Design',
    trackLevel: 3,
    summary: 'Leads complex design work, reviews designs prepared by others and mentors junior designers.',
    requirements: 'ps4 co4 ct4 qd4 tla4 lf4 lcs4 tools4 dwg4 est4 psc4 comm4 stk4 xfc4 tpm4 adapt4 own4 lead3',
  },
  {
    title: 'Design Lead',
    department: LD,
    track: 'Lighting Design',
    trackLevel: 4,
    summary: 'Leads the design team’s quality, capacity and capability development across projects.',
    requirements: 'ps4 co4 ct4 qd4 tla3 lf4 lcs4 tools3 dwg4 est4 psc4 comm4 stk4 xfc4 tpm4 adapt4 own4 lead4',
  },

  // Applications Engineering track
  {
    title: 'Associate Applications Engineer',
    department: LD,
    track: 'Applications Engineering',
    trackLevel: 1,
    summary: 'Supports applications engineers with system layouts, documentation and technical queries.',
    requirements: 'ps2 co2 ct3 qd3 tla3 lcs2 cfg2 net2 dwg2 psc2 comm2 xfc2 tpm2 adapt3 own3',
  },
  {
    title: 'Applications Engineer',
    department: LD,
    track: 'Applications Engineering',
    trackLevel: 2,
    summary: 'Turns design intent into workable control-system applications and supports projects technically.',
    requirements: 'ps3 co3 ct3 qd3 tla4 lcs3 cfg3 net3 dwg3 est2 psc3 comm3 stk2 xfc3 tpm3 adapt3 own3',
  },
  {
    title: 'Senior Applications Engineer',
    department: LD,
    track: 'Applications Engineering',
    trackLevel: 3,
    summary: 'Handles complex system applications and integrations and guides other engineers.',
    requirements: 'ps4 co3 ct4 qd4 tla4 lcs4 cfg4 net3 dwg3 est3 psc4 comm4 stk3 xfc4 tpm3 adapt4 own4 lead3',
  },
  {
    title: 'Technical Lead – Applications',
    department: LD,
    track: 'Applications Engineering',
    trackLevel: 4,
    summary: 'Sets technical standards for applications work and develops the team’s capability.',
    requirements: 'ps4 co4 ct4 qd4 tla4 lcs4 cfg4 net4 psc4 comm4 stk4 xfc4 tpm4 adapt4 own4 lead4',
  },

  // System Sales Engineering & Field Service
  {
    title: 'Field Service Engineer',
    department: SSE,
    track: 'System Sales Engineering',
    trackLevel: 1,
    summary: 'Supports installation, commissioning support and service visits for control systems.',
    requirements: 'ps3 co3 ct3 qd3 tla3 cfg3 net2 ts3 svc2 comm2 xfc2 tpm3 adapt3 own3',
  },
  {
    title: 'System Sales Engineer',
    department: SSE,
    track: 'System Sales Engineering',
    trackLevel: 2,
    summary: 'Provides technical sales support, demonstrations and solution guidance to customers.',
    requirements: 'ps3 co4 ct3 qd3 tla3 lcs3 cfg2 net2 demo3 scope3 comm4 stk3 xfc3 tpm3 adapt3 own3',
  },
  {
    title: 'Senior System Sales Engineer',
    department: SSE,
    track: 'System Sales Engineering',
    trackLevel: 3,
    summary: 'Leads technical sales engagements on larger projects and coaches other engineers.',
    requirements: 'ps4 co4 ct4 qd3 tla4 lcs4 cfg3 net3 demo4 scope4 comm4 stk4 xfc4 tpm3 adapt4 own4 lead2',
  },

  // Customer Service & Project Support
  {
    title: 'Customer Support Associate',
    department: CS,
    track: 'Customer Support',
    trackLevel: 1,
    summary: 'Handles customer queries and service requests and routes technical issues correctly.',
    requirements: 'ps2 co3 ct3 qd3 tla2 ts2 svc3 comm3 tpm2 adapt3 own3',
  },
  {
    title: 'Senior Support Specialist',
    department: CS,
    track: 'Customer Support',
    trackLevel: 2,
    summary: 'Resolves more complex service cases and supports associates.',
    requirements: 'ps3 co4 ct3 qd3 tla3 ts3 svc4 net2 comm3 stk3 xfc3 tpm3 adapt3 own4 lead2',
  },
  {
    title: 'Service & Support Lead',
    department: CS,
    track: 'Customer Support',
    trackLevel: 3,
    summary: 'Leads the support team’s service quality, escalations and capability.',
    requirements: 'ps4 co4 ct4 qd4 tla3 ts4 svc4 comm4 stk4 xfc4 tpm4 adapt3 own4 lead4',
  },
  {
    title: 'Project Coordinator',
    department: CS,
    summary: 'Coordinates project schedules, documentation and communication between teams and customers.',
    requirements: 'ps3 co3 ct4 qd3 tla2 dwg2 psc3 svc2 comm3 stk3 xfc4 tpm4 adapt3 own3',
  },

  // Sales & Business Development
  {
    title: 'Business Development Executive',
    department: SALES,
    track: 'Sales',
    trackLevel: 1,
    summary: 'Develops new opportunities and customer relationships with technical support from engineering.',
    requirements: 'ps2 co4 ct3 qd2 tla3 sell2 scope2 demo2 comm3 stk2 xfc2 tpm3 adapt3 own3',
  },
  {
    title: 'Key Account Manager',
    department: SALES,
    track: 'Sales',
    trackLevel: 2,
    summary: 'Manages key customer and specifier relationships and grows account opportunities.',
    requirements: 'ps3 co4 ct3 qd3 tla3 sell4 scope3 demo3 comm4 stk4 xfc3 tpm3 adapt3 own4',
  },
  {
    title: 'Sales Manager – Lighting',
    department: SALES,
    summary: 'Leads a sales team for lighting-control and shading projects, owns its pipeline and coaches account managers.',
    requirements: 'ps4 co4 ct4 qd3 tla3 sell4 scope4 demo3 comm4 stk4 xfc4 tpm4 adapt3 own4 lead3',
  },
  {
    title: 'Sales Coordinator',
    department: SALES,
    summary: 'Coordinates quotations, orders and commercial documentation between customers, sales and project teams.',
    requirements: 'ps3 co3 ct3 qd3 tla3 sell2 proc3 comm3 stk3 xfc4 tpm4 adapt3 own3',
  },

  // IT, HR, Finance & Administration
  {
    title: 'HR Business Partner',
    department: SUPPORT,
    summary: 'Supports workforce planning, recruitment, learning and employee relations for the office.',
    requirements: 'ps3 co3 ct4 qd3 tla2 proc4 comm4 stk4 xfc3 tpm3 adapt3 own4 lead2',
  },
  {
    title: 'Talent Acquisition Specialist',
    department: SUPPORT,
    summary: 'Sources and screens candidates for specialist technical and customer-facing roles and runs the selection process.',
    requirements: 'ps3 co3 ct4 qd3 tla3 proc4 comm4 stk4 xfc3 tpm4 adapt3 own4',
  },
  {
    title: 'IT Support Engineer',
    department: SUPPORT,
    summary: 'Supports laptops, accounts, network access and collaboration tools for office users.',
    requirements: 'ps3 co3 ct3 qd3 tla3 sec3 net3 proc3 comm3 stk2 xfc3 tpm3 adapt3 own3',
  },
  {
    title: 'IT Security Specialist',
    department: SUPPORT,
    summary: 'Maintains secure devices, accounts and access for office systems.',
    requirements: 'ps4 co2 ct3 qd4 tla4 sec4 net4 proc3 comm3 stk2 xfc3 tpm3 adapt4 own4',
  },
  {
    title: 'Finance Executive',
    department: SUPPORT,
    summary: 'Runs accounting, payables and reporting processes accurately and on time.',
    requirements: 'ps3 co2 ct3 qd4 tla2 proc4 comm3 xfc3 tpm4 adapt3 own4',
  },
  {
    title: 'Office Administrator',
    department: SUPPORT,
    summary: 'Coordinates office operations, facilities and administrative support.',
    requirements: 'ps2 co3 ct3 qd3 tla2 proc3 comm3 stk2 xfc3 tpm4 adapt3 own3',
  },

  // Management & Functional Leadership
  {
    title: 'Office Head – Gurugram',
    department: MGMT,
    summary: 'Sets business direction and priorities for the Gurugram office and coordinates with global teams.',
    requirements: 'ps4 co4 ct4 qd4 tla3 sell3 comm4 stk4 xfc4 tpm4 adapt4 own4 lead4',
  },
  {
    title: 'System Sales Engineering Manager',
    department: MGMT,
    summary: 'Leads system sales engineering and field service, including demonstrations and customer technical training.',
    requirements: 'ps4 co4 ct4 qd4 tla4 lcs4 cfg4 demo4 ts3 comm4 stk4 xfc4 tpm4 adapt4 own4 lead4',
  },
  {
    title: 'HR & Talent Acquisition Manager',
    department: MGMT,
    summary: 'Leads workforce planning, recruitment, learning and employee relations for the office.',
    requirements: 'ps4 co4 ct4 qd3 tla3 proc4 comm4 stk4 xfc4 tpm4 adapt4 own4 lead4',
  },
  {
    title: 'IT & Infrastructure Manager',
    department: MGMT,
    summary: 'Leads IT support, security and infrastructure for the office.',
    requirements: 'ps4 co3 ct4 qd4 tla4 sec4 net4 proc4 comm4 stk3 xfc4 tpm4 adapt4 own4 lead4',
  },
  {
    title: 'Finance & Administration Manager',
    department: MGMT,
    summary: 'Leads finance, accounting and office administration.',
    requirements: 'ps4 co3 ct4 qd4 tla3 proc4 comm4 stk3 xfc4 tpm4 adapt3 own4 lead4',
  },
  {
    title: 'Design & Applications Manager',
    department: MGMT,
    summary: 'Leads the lighting-design and applications teams, their capacity and their capability development.',
    requirements: 'ps4 co4 ct4 qd4 tla3 lf4 lcs4 est3 psc4 comm4 stk4 xfc4 tpm4 adapt4 own4 lead4',
  },
  {
    title: 'Regional Sales Manager',
    department: MGMT,
    track: 'Sales',
    trackLevel: 3,
    summary: 'Leads sales and system sales engineering for the region and develops the commercial team.',
    requirements: 'ps4 co4 ct4 qd3 tla3 sell4 scope4 comm4 stk4 xfc4 tpm4 adapt3 own4 lead4',
  },
  {
    title: 'Service & Operations Manager',
    department: MGMT,
    summary: 'Leads customer service, project support and enabling functions for the office.',
    requirements: 'ps4 co4 ct4 qd3 tla3 svc4 proc3 comm4 stk4 xfc4 tpm4 adapt3 own4 lead4',
  },
];

export function parseRequirements(spec) {
  return spec
    .trim()
    .split(/\s+/)
    .map((token) => {
      const match = token.match(/^([a-z]+)(\d)$/);
      if (!match) throw new Error(`Invalid requirement token "${token}"`);
      return { key: match[1], level: Number(match[2]) };
    });
}
