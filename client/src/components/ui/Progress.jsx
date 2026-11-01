import { useRef } from 'react';
import { useProgressTween } from '../../animations/index.js';
import { LEVEL_LABELS } from '../../utils/constants.js';

const BAR_TONES = {
  Completed: 'bg-emerald-600',
  Overdue: 'bg-red-600',
  'In Progress': 'bg-brand-600',
  'Not Started': 'bg-slate-400',
};

export function ProgressBar({ value = 0, status, showValue = true, size = 'md', className = '' }) {
  const barRef = useRef(null);
  useProgressTween(barRef, value);
  const height = size === 'sm' ? 'h-1.5' : 'h-2';

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div
        className={`relative w-full overflow-hidden rounded-full bg-slate-200/80 ${height}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={`Progress ${value}%`}
      >
        <div ref={barRef} className={`absolute inset-y-0 left-0 rounded-full ${BAR_TONES[status] || 'bg-brand-600'}`} style={{ width: 0 }} />
      </div>
      {showValue && <span className="tabular w-9 shrink-0 text-right text-xs font-medium text-slate-700">{value}%</span>}
    </div>
  );
}

/**
 * Four-step proficiency meter. Filled steps = current level; outlined orange steps = the gap
 * up to the required level; a tick marks the required level.
 */
export function LevelMeter({ current, required, showText = true }) {
  const label =
    current === null || current === undefined
      ? `Not assessed, required level ${required}`
      : `Current level ${current} (${LEVEL_LABELS[current]}), required level ${required} (${LEVEL_LABELS[required]})`;

  return (
    <div className="flex items-center gap-2.5" aria-label={label} role="img">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4].map((step) => {
          const filled = current !== null && current !== undefined && step <= current;
          const missing = !filled && step <= required;
          return (
            <span
              key={step}
              className={`relative h-2.5 w-5 rounded-sm ${
                filled ? (step > required ? 'bg-emerald-500' : 'bg-brand-600') : missing ? 'bg-orange-100 ring-1 ring-orange-400 ring-inset' : 'bg-slate-200'
              }`}
            >
              {step === required && <span className="absolute -top-1 right-[-3px] h-[18px] w-[2px] rounded-full bg-slate-800" />}
            </span>
          );
        })}
      </div>
      {showText && (
        <span className="tabular text-xs font-medium whitespace-nowrap text-slate-600">
          {current ?? '–'} / {required}
        </span>
      )}
    </div>
  );
}
