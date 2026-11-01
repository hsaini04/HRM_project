import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { initials } from '../../utils/format.js';
import { Button } from './Button.jsx';

export function SearchInput({ value, onChange, placeholder = 'Search…', className = '', label = 'Search' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input h-9 py-1.5 pr-8 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute top-1/2 right-2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
          aria-label="Clear search"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}

export function SegmentedControl({ options, value, onChange, label, className = '' }) {
  return (
    <div role="tablist" aria-label={label} className={`scrollbar-thin inline-flex max-w-full overflow-x-auto rounded-lg bg-slate-100 p-1 ${className}`}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
              active ? 'bg-raised text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {option.label}
            {option.count !== undefined && (
              <span className={`tabular rounded-full px-1.5 text-xs ${active ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600'}`}>
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function Pagination({ page, totalPages, total, limit, onChange, noun = 'records' }) {
  if (!total) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(total, page * limit);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm text-slate-600">
      <p>
        Showing <span className="tabular font-medium text-slate-900">{from}–{to}</span> of{' '}
        <span className="tabular font-medium text-slate-900">{total}</span> {noun}
      </p>
      <div className="flex items-center gap-2">
        <Button size="sm" icon={ChevronLeft} disabled={page <= 1} onClick={() => onChange(page - 1)} aria-label="Previous page">
          Prev
        </Button>
        <span className="tabular text-xs text-slate-500">
          Page {page} of {totalPages}
        </span>
        <Button size="sm" disabled={page >= totalPages} onClick={() => onChange(page + 1)} aria-label="Next page">
          Next
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

const AVATAR_TONES = [
  'bg-brand-100 text-brand-800',
  'bg-teal-100 text-teal-800',
  'bg-violet-100 text-violet-800',
  'bg-amber-100 text-amber-900',
  'bg-rose-100 text-rose-800',
  'bg-slate-200 text-slate-700',
];

export function Avatar({ name = '', size = 'md' }) {
  const hash = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const sizes = { sm: 'size-7 text-[11px]', md: 'size-9 text-xs', lg: 'size-14 text-lg' };
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-semibold ${sizes[size]} ${AVATAR_TONES[hash % AVATAR_TONES.length]}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function PersonCell({ name, subtitle, size = 'md' }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar name={name} size={size} />
      <div className="min-w-0">
        <p className="truncate font-medium text-slate-900">{name}</p>
        {subtitle && <p className="truncate text-xs text-slate-500" title={typeof subtitle === 'string' ? subtitle : undefined}>{subtitle}</p>}
      </div>
    </div>
  );
}
