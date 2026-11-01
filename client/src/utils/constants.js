import { CircleAlert, CircleCheck, CircleDashed, Clock3, TriangleAlert } from 'lucide-react';

// Enrolment status — status colours always ship with an icon and a text label.
export const STATUS_META = {
  'Not Started': { icon: CircleDashed, badge: 'bg-slate-100 text-slate-700 ring-slate-500/15', chart: '#a8a69d' },
  'In Progress': { icon: Clock3, badge: 'bg-brand-50 text-brand-700 ring-brand-600/20', chart: '#2a78d6' },
  Completed: { icon: CircleCheck, badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', chart: '#0ca30c' },
  Overdue: { icon: TriangleAlert, badge: 'bg-red-50 text-red-700 ring-red-600/20', chart: '#d03b3b' },
};

// Gap severity — an ordinal single-hue ramp, validated per theme (see --chart-sev-* in index.css).
export const SEVERITY_META = {
  Moderate: { level: 1, badge: 'bg-orange-50 text-orange-800 ring-orange-600/20', chart: 'var(--chart-sev-1)' },
  High: { level: 2, badge: 'bg-orange-100 text-orange-900 ring-orange-700/25', chart: 'var(--chart-sev-2)' },
  Critical: { level: 3, badge: 'bg-red-100 text-red-900 ring-red-700/25', chart: 'var(--chart-sev-3)' },
};

export const CATEGORY_META = {
  Core: { dot: 'bg-brand-500', badge: 'bg-brand-50 text-brand-700 ring-brand-600/20', description: 'Expected of every role — how work is approached.' },
  Functional: { dot: 'bg-teal-600', badge: 'bg-teal-50 text-teal-800 ring-teal-600/20', description: 'Technical and role-specific know-how.' },
  Behavioural: { dot: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700 ring-violet-600/20', description: 'How people communicate, coordinate and take ownership.' },
};

export const GOAL_STATUS_META = {
  'Not Started': 'bg-slate-100 text-slate-700 ring-slate-500/15',
  'In Progress': 'bg-brand-50 text-brand-700 ring-brand-600/20',
  Achieved: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
};

export const ALERT_ICON = CircleAlert;

export const LEVEL_LABELS = { 1: 'Awareness', 2: 'Working', 3: 'Proficient', 4: 'Advanced' };
