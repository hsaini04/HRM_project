import { Info } from 'lucide-react';
import { Suspense, useCallback, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router';
import { gsap, prefersReducedMotion } from '../../animations/index.js';
import { useDemo } from '../../context/DemoContext.jsx';
import { MetaProvider } from '../../context/MetaContext.jsx';
import { ErrorState, PageSkeleton } from '../ui/index.js';
import { MobileSidebar, Sidebar } from './Sidebar.jsx';
import { Topbar } from './Topbar.jsx';

export function DemoNotice() {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-glow-100 bg-glow-50 px-3 py-2 text-xs text-amber-900 sm:items-center">
      <Info className="mt-px size-3.5 shrink-0 text-glow-600 sm:mt-0" aria-hidden="true" />
      <p>
        <strong className="font-semibold">Demonstration data only — not actual Lutron Electronics HR records.</strong>{' '}
        <span className="text-amber-800/90">All names, ratings, assignments and metrics are fictional (HRM-203 CA-2 prototype).</span>
      </p>
    </div>
  );
}

export function AppLayout() {
  const { session, status, retry } = useDemo();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const mainRef = useRef(null);

  // A new page (or persona) starts at the top instead of inheriting the previous scroll position.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, session?.employeeId]);

  // Subtle fade on every route change; content-level reveals are handled per page.
  useLayoutEffect(() => {
    if (!mainRef.current || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(mainRef.current, { autoAlpha: 0, y: 6, duration: 0.3, clearProps: 'all' });
    }, mainRef);
    return () => ctx.revert();
  }, [pathname, session?.role]);

  // Wait for the persona check so a stale session (e.g. after re-seeding) never hits the API.
  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <PageSkeleton />
      </div>
    );
  }
  if (status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="card max-w-lg">
          <ErrorState
            error={{ message: 'Cannot reach the SkillBridge API. Start the server (npm run dev in /server) and make sure MongoDB is running.' }}
            onRetry={retry}
          />
        </div>
      </div>
    );
  }
  if (!session) return <Navigate to="/demo-access" replace />;

  return (
    <MetaProvider key={session.employeeId}>
      <Sidebar />
      <MobileSidebar open={menuOpen} onClose={closeMenu} />
      <div className="lg:pl-64">
        <Topbar onMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-[1440px] px-4 pt-4 pb-12 sm:px-6 lg:px-8">
          <DemoNotice />
          <div ref={mainRef} key={`${session.employeeId}:${pathname}`} className="pt-6">
            <Suspense fallback={<PageSkeleton />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </MetaProvider>
  );
}

/** Redirects roles that should not see a page (mirrors the API's role checks). */
export function RequirePermission({ permission, children }) {
  const { can } = useDemo();
  if (!can(permission)) return <Navigate to="/dashboard" replace />;
  return children;
}
