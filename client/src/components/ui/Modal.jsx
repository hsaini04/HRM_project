import { X } from 'lucide-react';
import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { usePresence } from '../../animations/index.js';
import { Button } from './Button.jsx';

const SIZES = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

function useDialogBehaviour(open, panelRef, onClose) {
  // Keep the latest onClose without re-running the focus logic on every parent render.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const panel = panelRef.current;
    const focusable = panel?.querySelector('[data-autofocus], input, select, textarea, button:not([data-close])');
    (focusable || panel)?.focus({ preventScroll: true });

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === 'Tab' && panel) {
        const items = [...panel.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')].filter(
          (element) => !element.disabled && element.offsetParent !== null,
        );
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [open, panelRef]);
}

export function Modal({ open, onClose, title, description, size = 'md', footer, children }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const titleId = useId();
  const rendered = usePresence(open, { overlayRef, panelRef, variant: 'modal' });
  useDialogBehaviour(open, panelRef, onClose);

  if (!rendered) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div ref={overlayRef} className="absolute inset-0 bg-scrim backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-clip rounded-t-2xl bg-surface shadow-pop outline-none sm:rounded-2xl ${SIZES[size]}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close dialog" data-close>
            <X className="size-4" />
          </Button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-slate-50/70 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer({ open, onClose, title, description, footer, children, width = 'sm:max-w-xl' }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const titleId = useId();
  const rendered = usePresence(open, { overlayRef, panelRef, variant: 'drawer' });
  useDialogBehaviour(open, panelRef, onClose);

  if (!rendered) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div ref={overlayRef} className="absolute inset-0 bg-scrim backdrop-blur-[2px]" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex h-full w-full flex-col bg-surface shadow-pop outline-none ${width}`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            <h2 id={titleId} className="text-base font-semibold text-slate-900">
              {title}
            </h2>
            {description && <p className="mt-0.5 text-sm text-slate-500">{description}</p>}
          </div>
          <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close panel" data-close>
            <X className="size-4" />
          </Button>
        </div>
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line bg-slate-50/70 px-5 py-3">{footer}</div>}
      </aside>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({ open, onClose, onConfirm, title, description, confirmLabel = 'Confirm', tone = 'danger', loading }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-slate-600">{description}</p>
    </Modal>
  );
}
