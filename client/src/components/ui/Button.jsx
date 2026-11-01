import { LoaderCircle } from 'lucide-react';
import { forwardRef } from 'react';

const VARIANTS = {
  primary: 'bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 disabled:bg-brand-300',
  secondary:
    'bg-white text-slate-700 shadow-sm ring-1 ring-inset ring-slate-300 hover:bg-slate-50 active:bg-slate-100 disabled:text-slate-400',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 active:bg-slate-200 disabled:text-slate-400',
  subtle: 'bg-brand-50 text-brand-700 hover:bg-brand-100 active:bg-brand-200 disabled:opacity-60',
  danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 disabled:bg-red-300',
};

const SIZES = {
  sm: 'h-8 gap-1.5 rounded-lg px-2.5 text-xs',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-sm',
  icon: 'size-9 justify-center rounded-lg',
  'icon-sm': 'size-8 justify-center rounded-lg',
};

export const Button = forwardRef(function Button(
  { variant = 'secondary', size = 'md', icon: Icon, loading = false, className = '', children, type = 'button', disabled, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        Icon && <Icon className="size-4" aria-hidden="true" />
      )}
      {children}
    </button>
  );
});
