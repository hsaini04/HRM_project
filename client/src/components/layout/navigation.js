import {
  ChartColumnBig,
  ClipboardList,
  LayoutDashboard,
  LayoutGrid,
  Library,
  Route,
  Target,
  UserRound,
  Users,
} from 'lucide-react';

/** Sidebar structure per demo role. Employees see a personal "My …" experience. */
export function getNavigation(role, employeeId) {
  const isEmployee = role === 'employee';
  return [
    {
      section: 'Overview',
      items: [{ to: '/dashboard', label: isEmployee ? 'My Dashboard' : 'Dashboard', icon: LayoutDashboard }],
    },
    {
      section: 'People',
      items: isEmployee
        ? [{ to: `/employees/${employeeId}`, label: 'My Profile', icon: UserRound }]
        : [{ to: '/employees', label: 'Employees', icon: Users }],
    },
    {
      section: 'Skills',
      items: [
        { to: '/skills', label: 'Competency Matrix', icon: LayoutGrid, end: true },
        { to: '/skills/gaps', label: isEmployee ? 'My Skill Gaps' : 'Skill Gap Analysis', icon: Target },
      ],
    },
    {
      section: 'Learning',
      items: [
        { to: '/training', label: 'Training Catalogue', icon: Library },
        { to: '/assignments', label: isEmployee ? 'My Training' : 'Training Assignments', icon: ClipboardList },
        ...(isEmployee ? [] : [{ to: '/analytics', label: 'Learning Analytics', icon: ChartColumnBig }]),
      ],
    },
    {
      section: 'Growth',
      items: [{ to: '/career-paths', label: 'Career Development', icon: Route }],
    },
  ];
}

const TITLES = [
  [/^\/dashboard/, 'Dashboard'],
  [/^\/employees\/[^/]+/, 'Employee Profile'],
  [/^\/employees/, 'Employee Management'],
  [/^\/skills\/gaps/, 'Skill Gap Analysis'],
  [/^\/skills/, 'Competency Matrix'],
  [/^\/training/, 'Training Catalogue'],
  [/^\/assignments/, 'Training Assignments'],
  [/^\/analytics/, 'Learning Analytics'],
  [/^\/career-paths/, 'Career Development'],
];

export const pageTitle = (pathname) => TITLES.find(([pattern]) => pattern.test(pathname))?.[1] || 'SkillBridge';
