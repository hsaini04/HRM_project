import { CATEGORY_META, GOAL_STATUS_META, LEVEL_LABELS, SEVERITY_META, STATUS_META } from '../../utils/constants.js';

const TONES = {
  neutral: 'bg-slate-100 text-slate-700 ring-slate-500/15',
  brand: 'bg-brand-50 text-brand-700 ring-brand-600/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  warning: 'bg-amber-50 text-amber-800 ring-amber-600/25',
  danger: 'bg-red-50 text-red-700 ring-red-600/20',
  glow: 'bg-glow-50 text-glow-700 ring-glow-400/40',
};

export function Badge({ tone = 'neutral', className = '', icon: Icon, children, title }) {
  const toneClass = TONES[tone] || tone;
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset ${toneClass} ${className}`}
    >
      {Icon && <Icon className="size-3.5" aria-hidden="true" />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META['Not Started'];
  return (
    <Badge tone={meta.badge} icon={meta.icon}>
      {status}
    </Badge>
  );
}

export function SeverityBadge({ severity, gap }) {
  const meta = SEVERITY_META[severity];
  if (!meta) return <Badge>{severity}</Badge>;
  return (
    <Badge tone={meta.badge} title={`Gap of ${gap ?? meta.level} level(s)`}>
      <span className="flex items-end gap-px" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`w-[3px] rounded-sm ${bar <= meta.level ? 'bg-current' : 'bg-current/25'}`}
            style={{ height: 3 + bar * 2 }}
          />
        ))}
      </span>
      {severity}
    </Badge>
  );
}

export function CategoryBadge({ category }) {
  return <Badge tone={CATEGORY_META[category]?.badge || TONES.neutral}>{category}</Badge>;
}

export function GoalStatusBadge({ status }) {
  return <Badge tone={GOAL_STATUS_META[status] || TONES.neutral}>{status}</Badge>;
}

export function LevelBadge({ level }) {
  if (!level) return <Badge>Not assessed</Badge>;
  return (
    <Badge tone="brand">
      L{level} · {LEVEL_LABELS[level]}
    </Badge>
  );
}
