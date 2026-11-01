import { useRef } from 'react';
import { useCountUp } from '../../animations/index.js';

const ICON_TONES = {
  brand: 'bg-brand-50 text-brand-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-orange-50 text-orange-700',
  danger: 'bg-red-50 text-red-700',
  neutral: 'bg-slate-100 text-slate-700',
};

export function KpiCard({ label, value, suffix = '', decimals = 0, icon: Icon, tone = 'brand', caption, children }) {
  const valueRef = useRef(null);
  useCountUp(valueRef, value, { decimals, suffix });

  return (
    <div data-kpi className="card flex flex-col gap-3 p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        {Icon && (
          <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${ICON_TONES[tone]}`}>
            <Icon className="size-[18px]" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="text-3xl font-semibold tracking-tight text-slate-900">
        {/* The animated figure is written by useCountUp; screen readers get the final value. */}
        <span ref={valueRef} aria-hidden="true" />
        <span className="sr-only">{typeof value === 'number' ? `${value}${suffix}` : 'Not available'}</span>
      </p>
      {caption && <p className="text-xs text-slate-500">{caption}</p>}
      {children}
    </div>
  );
}
