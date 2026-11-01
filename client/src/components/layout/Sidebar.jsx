import { ArrowLeftRight, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router';
import { usePresence } from '../../animations/index.js';
import { useDemo } from '../../context/DemoContext.jsx';
import { Logo } from './Logo.jsx';
import { getNavigation } from './navigation.js';

function NavList({ onNavigate }) {
  const { role, session } = useDemo();
  const navigation = getNavigation(role, session?.employeeId);

  return (
    <nav aria-label="Main navigation" className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {navigation.map((group) => (
        <div key={group.section}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">{group.section}</p>
          <ul className="space-y-0.5">
            {group.items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive ? 'bg-brand-50 text-brand-800' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full bg-brand-600" aria-hidden="true" />}
                      <item.icon
                        className={`size-[18px] shrink-0 ${isActive ? 'text-brand-700' : 'text-slate-400 group-hover:text-slate-600'}`}
                        aria-hidden="true"
                      />
                      {item.label}
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({ onNavigate }) {
  return (
    <div className="space-y-3 border-t border-line p-4">
      <NavLink
        to="/demo-access"
        onClick={onNavigate}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      >
        <ArrowLeftRight className="size-4 text-slate-400" aria-hidden="true" />
        Switch demo role
      </NavLink>
      <p className="px-2 text-[11px] leading-relaxed text-slate-500">
        Academic prototype for HRM-203 CA-2. Not an official Lutron Electronics system.
      </p>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-surface lg:flex">
      <div className="flex h-16 shrink-0 items-center border-b border-line px-5">
        <Logo />
      </div>
      <NavList />
      <SidebarFooter />
    </aside>
  );
}

export function MobileSidebar({ open, onClose }) {
  const overlayRef = useRef(null);
  const panelRef = useRef(null);
  const rendered = usePresence(open, { overlayRef, panelRef, variant: 'drawer-left' });
  const { pathname } = useLocation();

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    onClose();
    // Close the menu after navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  if (!rendered) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 lg:hidden">
      <div ref={overlayRef} className="absolute inset-0 bg-scrim" onClick={onClose} aria-hidden="true" />
      <aside
        ref={panelRef}
        className="relative flex h-full w-72 max-w-[85vw] flex-col bg-surface shadow-pop"
        aria-label="Navigation menu"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-line px-5">
          <Logo />
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Close menu">
            <X className="size-5" />
          </button>
        </div>
        <NavList onNavigate={onClose} />
        <SidebarFooter onNavigate={onClose} />
      </aside>
    </div>,
    document.body,
  );
}
