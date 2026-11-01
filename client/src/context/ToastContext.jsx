import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap, prefersReducedMotion } from '../animations/index.js';

const ToastContext = createContext(null);

const TONES = {
  success: { icon: CircleCheck, className: 'text-emerald-600' },
  error: { icon: CircleAlert, className: 'text-red-600' },
  info: { icon: Info, className: 'text-brand-600' },
};

function Toast({ toast, onDismiss }) {
  const ref = useRef(null);
  const { icon: Icon, className } = TONES[toast.tone] || TONES.info;

  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(ref.current, { autoAlpha: 0, x: 24, duration: 0.35, ease: 'power3.out', clearProps: 'transform' });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={ref}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto flex w-full items-start gap-3 rounded-xl border border-line bg-white p-3.5 shadow-pop"
    >
      <Icon className={`mt-0.5 size-5 shrink-0 ${className}`} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-900">{toast.title}</p>
        {toast.description && <p className="mt-0.5 text-sm text-slate-600">{toast.description}</p>}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Dismiss notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((item) => item.id !== id)), []);

  const notify = useCallback(
    ({ title, description, tone = 'info', duration = 4500 }) => {
      counter.current += 1;
      const id = counter.current;
      setToasts((list) => [...list.slice(-3), { id, title, description, tone }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const value = useMemo(
    () => ({
      notify,
      success: (title, description) => notify({ title, description, tone: 'success' }),
      error: (title, description) => notify({ title, description, tone: 'error', duration: 6500 }),
      info: (title, description) => notify({ title, description, tone: 'info' }),
    }),
    [notify],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:inset-x-auto sm:right-6 sm:w-96"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside <ToastProvider>');
  return context;
}
