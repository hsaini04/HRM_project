import {
  BookPlus,
  CalendarClock,
  CircleCheck,
  ClipboardCheck,
  Gauge,
  PencilLine,
  Route,
  UserPlus,
  UserX,
} from 'lucide-react';
import { Link } from 'react-router';
import { dueLabel, formatShortDate, relativeTime } from '../../utils/format.js';
import { Card, CardHeader } from '../ui/Card.jsx';
import { EmptyState } from '../ui/States.jsx';
import { ProgressBar } from '../ui/Progress.jsx';

const ACTIVITY_ICONS = {
  'employee.created': UserPlus,
  'employee.updated': PencilLine,
  'employee.deleted': UserX,
  'competency.created': ClipboardCheck,
  'competency.updated': ClipboardCheck,
  'assessment.updated': Gauge,
  'training.created': BookPlus,
  'training.updated': BookPlus,
  'enrollment.assigned': CalendarClock,
  'enrollment.progress': Gauge,
  'enrollment.completed': CircleCheck,
  'enrollment.updated': CalendarClock,
  'enrollment.removed': CalendarClock,
  'career.created': Route,
  'career.updated': Route,
};

export function UpcomingDueCard({ items, showEmployee = true, title = 'Upcoming due dates' }) {
  return (
    <Card data-reveal className="flex flex-col">
      <CardHeader
        title={title}
        subtitle="Open assignments with the nearest due dates"
        icon={CalendarClock}
        action={
          <Link to="/assignments" className="text-sm font-medium text-brand-700 hover:underline">
            View all
          </Link>
        }
      />
      {items.length ? (
        <ul className="divide-y divide-line">
          {items.map((item) => (
            <li key={item._id} className="px-5 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{item.program?.title}</p>
                  <p className="truncate text-xs text-slate-500">
                    {showEmployee && item.employee && (
                      <Link to={`/employees/${item.employee._id}`} className="hover:text-brand-700 hover:underline">
                        {item.employee.name}
                      </Link>
                    )}
                    {showEmployee && item.employee && ' · '}
                    {formatShortDate(item.dueDate)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                    item.daysLeft <= 7 ? 'bg-orange-50 text-orange-800' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {dueLabel(item.daysLeft)}
                </span>
              </div>
              <ProgressBar value={item.progress} status={item.status} size="sm" className="mt-2" />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="Nothing due soon" description="There are no open assignments with upcoming due dates." />
      )}
    </Card>
  );
}

export function ActivityCard({ items }) {
  return (
    <Card data-reveal className="flex flex-col">
      <CardHeader title="Recent activity" subtitle="Latest learning and development events" icon={Gauge} />
      {items.length ? (
        <ol className="space-y-0 px-5 py-3">
          {items.map((item, index) => {
            const Icon = ACTIVITY_ICONS[item.type] || Gauge;
            return (
              <li key={item._id} className="relative flex gap-3 pb-4 last:pb-1">
                {index < items.length - 1 && <span className="absolute top-8 bottom-0 left-[15px] w-px bg-line" aria-hidden="true" />}
                <span className="relative grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 pt-0.5">
                  <p className="text-sm text-slate-700">{item.message}</p>
                  <p className="mt-0.5 text-xs text-slate-500">{relativeTime(item.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <EmptyState title="No activity yet" description="Assignments, progress updates and assessments will appear here." />
      )}
    </Card>
  );
}

export function TopGapsCard({ items, title = 'Most frequent skill gaps' }) {
  const max = Math.max(1, ...items.map((item) => item.employeesAffected));
  return (
    <Card data-reveal className="flex flex-col">
      <CardHeader
        title={title}
        subtitle="Competencies where most employees are below the role requirement"
        action={
          <Link to="/skills/gaps" className="text-sm font-medium text-brand-700 hover:underline">
            Analyse
          </Link>
        }
      />
      {items.length ? (
        <ul className="space-y-3.5 px-5 py-4">
          {items.map((item) => (
            <li key={item.competencyId}>
              <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-slate-700">{item.name}</span>
                <span className="tabular shrink-0 text-xs text-slate-500">
                  <span className="font-semibold text-slate-900">{item.employeesAffected}</span> employees
                  {item.priorityCount > 0 && ` · ${item.priorityCount} priority`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-(--chart-sev-2)" style={{ width: `${(item.employeesAffected / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="No skill gaps" description="Everyone in scope meets their role requirements." />
      )}
    </Card>
  );
}
