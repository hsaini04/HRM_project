import { Check, Search } from 'lucide-react';
import { useId, useMemo, useState } from 'react';

export function Field({ label, error, hint, required, children, className = '', htmlFor }) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
          {required && <span className="ml-0.5 text-red-700" aria-hidden="true">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-red-700" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}

export function TextInput({ label, error, hint, required, className, ...props }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <input id={id} className="input" aria-invalid={Boolean(error)} required={required} {...props} />
    </Field>
  );
}

export function TextArea({ label, error, hint, required, className, rows = 3, ...props }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <textarea id={id} rows={rows} className="input resize-y" aria-invalid={Boolean(error)} required={required} {...props} />
    </Field>
  );
}

export function SelectInput({ label, error, hint, required, className, options = [], placeholder, ...props }) {
  const id = useId();
  return (
    <Field label={label} error={error} hint={hint} required={required} className={className} htmlFor={id}>
      <select id={id} className="input pr-8" aria-invalid={Boolean(error)} required={required} {...props}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value;
          const text = typeof option === 'string' ? option : option.label;
          return (
            <option key={value} value={value} disabled={option.disabled}>
              {text}
            </option>
          );
        })}
      </select>
    </Field>
  );
}

// Compact select for filter bars (no label row).
export function FilterSelect({ value, onChange, options, placeholder, label, className = '' }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`input h-9 w-auto min-w-0 py-1.5 pr-8 ${className}`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => {
        const optionValue = typeof option === 'string' ? option : option.value;
        const text = typeof option === 'string' ? option : option.label;
        return (
          <option key={optionValue} value={optionValue}>
            {text}
          </option>
        );
      })}
    </select>
  );
}

/** Searchable multi-select rendered as a checkbox list. */
export function CheckboxList({ label, error, hint, required, options, value = [], onChange, groupBy, height = 'max-h-56' }) {
  const [query, setQuery] = useState('');
  const id = useId();
  const filtered = useMemo(
    () => options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase())),
    [options, query],
  );
  const groups = useMemo(() => {
    if (!groupBy) return [['', filtered]];
    const map = new Map();
    for (const option of filtered) {
      const key = option[groupBy] || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(option);
    }
    return [...map.entries()];
  }, [filtered, groupBy]);

  const toggle = (optionValue) =>
    onChange(value.includes(optionValue) ? value.filter((item) => item !== optionValue) : [...value, optionValue]);

  return (
    <Field label={label} error={error} hint={hint} required={required} htmlFor={id}>
      <div className={`overflow-hidden rounded-lg border ${error ? 'border-red-400' : 'border-slate-300'} bg-surface`}>
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <Search className="size-4 text-slate-400" aria-hidden="true" />
          <input
            id={id}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter options…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          <span className="shrink-0 text-xs text-slate-500">{value.length} selected</span>
        </div>
        <div className={`scrollbar-thin overflow-y-auto p-1.5 ${height}`} role="group" aria-label={label}>
          {groups.map(([group, items]) => (
            <div key={group || 'all'}>
              {group && <p className="px-2 pt-2 pb-1 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">{group}</p>}
              {items.map((option) => {
                const checked = value.includes(option.value);
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer items-start gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50 ${checked ? 'text-slate-900' : 'text-slate-700'}`}
                  >
                    <input type="checkbox" className="peer sr-only" checked={checked} onChange={() => toggle(option.value)} />
                    <span
                      className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-brand-300 ${checked ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-surface'}`}
                    >
                      {checked && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0">
                      {option.label}
                      {option.description && <span className="block text-xs text-slate-500">{option.description}</span>}
                    </span>
                  </label>
                );
              })}
            </div>
          ))}
          {!filtered.length && <p className="px-2 py-3 text-sm text-slate-500">No matching options</p>}
        </div>
      </div>
    </Field>
  );
}
