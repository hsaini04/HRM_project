import { Inbox, ServerCrash } from 'lucide-react';
import { Button } from './Button.jsx';

export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} aria-hidden="true" />;
}

export function SkeletonRows({ rows = 5, className = '' }) {
  return (
    <div className={`space-y-4 p-5 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center gap-4">
          <Skeleton className="size-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="hidden h-6 w-20 sm:block" />
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({ cards = 4 }) {
  return (
    <div role="status" aria-label="Loading page">
      <Skeleton className="mb-2 h-7 w-64" />
      <Skeleton className="mb-8 h-4 w-96 max-w-full" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: cards }, (_, index) => (
          <div key={index} className="card space-y-4 p-5">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-8 w-1/3" />
          </div>
        ))}
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card h-72 p-5">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="card h-72 p-5">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon = Inbox, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <span className="mb-3 grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-900">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, className = '' }) {
  return (
    <div role="alert" className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}>
      <span className="mb-3 grid size-11 place-items-center rounded-full bg-red-50 text-red-700">
        <ServerCrash className="size-5" aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold text-slate-900">Couldn’t load this data</p>
      <p className="mt-1 max-w-md text-sm text-slate-500">{error?.message || 'Something went wrong.'}</p>
      {onRetry && (
        <Button className="mt-4" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
