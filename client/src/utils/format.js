// Date-only fields (due dates, joining dates) are stored as UTC midnight, so they are
// formatted in UTC to show the same calendar day everywhere.
export function formatDate(value, options = {}) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC', ...options });
}

export const formatShortDate = (value) => formatDate(value, { year: undefined });

export function toDateInput(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
}

export function todayInput(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

export function relativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} d ago`;
  return formatDate(value);
}

export function dueLabel(daysLeft) {
  if (daysLeft === null || daysLeft === undefined) return '';
  if (daysLeft < 0) return `${Math.abs(daysLeft)} d overdue`;
  if (daysLeft === 0) return 'Due today';
  if (daysLeft === 1) return 'Due tomorrow';
  return `Due in ${daysLeft} d`;
}

export const formatPercent = (value, decimals = 0) =>
  typeof value === 'number' ? `${value.toFixed(decimals)}%` : '—';

export const formatHours = (value) => (typeof value === 'number' ? `${value % 1 ? value.toFixed(1) : value} h` : '—');

export const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');

export const pluralise = (count, word, plural = `${word}s`) => `${count} ${count === 1 ? word : plural}`;

export const shortDepartment = (department = '') =>
  ({
    'Sales & Business Development': 'Sales & BD',
    'Lighting Design, Applications & Engineering': 'Lighting Design & Apps',
    'System Sales Engineering & Field Service': 'System Sales Eng.',
    'Customer Service & Project Support': 'Customer Service',
    'IT, HR, Finance & Administration': 'IT, HR & Finance',
    'Management & Functional Leadership': 'Management',
  })[department] || department;
