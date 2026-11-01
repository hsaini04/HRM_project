import { Bell, BookOpen, Check, ChevronDown, Menu, Search, TriangleAlert, UserRound, CalendarClock } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useDemo } from '../../context/DemoContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { useClickOutside } from '../../hooks/useClickOutside.js';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { DATA_CHANGED_EVENT } from '../../services/api.js';
import { dashboardApi, employeesApi, trainingsApi } from '../../services/resources.js';
import { dueLabel, formatShortDate } from '../../utils/format.js';
import { Avatar } from '../ui/Controls.jsx';
import { pageTitle } from './navigation.js';

function GlobalSearch() {
  const { can } = useDemo();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const term = useDebouncedValue(query.trim(), 250);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const { data, loading } = useApi(
    async (signal) => {
      const [people, programmes] = await Promise.all([
        can('employees.view') ? employeesApi.list({ search: term, limit: 5 }, { signal }) : { data: [] },
        trainingsApi.list({ search: term, limit: 5 }, { signal }),
      ]);
      return { people: people.data, programmes: programmes.data };
    },
    [term],
    { enabled: term.length >= 2 },
  );

  const results = term.length >= 2 && data ? [...data.people.map((item) => ({ type: 'person', item })), ...data.programmes.map((item) => ({ type: 'programme', item }))] : [];

  const go = (result) => {
    setOpen(false);
    setQuery('');
    if (result.type === 'person') navigate(`/employees/${result.item._id}`);
    else navigate(`/training?search=${encodeURIComponent(result.item.title)}`);
  };

  return (
    <div ref={ref} className="relative hidden shrink md:block md:w-52 xl:w-80">
      <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input
        type="search"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && results[0]) go(results[0]);
        }}
        placeholder={can('employees.view') ? 'Search employees or programmes…' : 'Search training programmes…'}
        aria-label="Global search"
        className="input h-9 bg-slate-50 py-1.5 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {open && term.length >= 2 && (
        <div className="absolute top-11 right-0 left-0 z-40 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
          {loading && !results.length ? (
            <p className="px-4 py-3 text-sm text-slate-500">Searching…</p>
          ) : results.length ? (
            <ul className="max-h-80 overflow-y-auto py-1.5">
              {results.map((result) => (
                <li key={`${result.type}-${result.item._id}`}>
                  <button
                    type="button"
                    onClick={() => go(result)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50"
                  >
                    {result.type === 'person' ? (
                      <Avatar name={result.item.name} size="sm" />
                    ) : (
                      <span className="grid size-7 place-items-center rounded-full bg-slate-100 text-slate-500">
                        <BookOpen className="size-3.5" />
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{result.item.name || result.item.title}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {result.type === 'person' ? result.item.jobTitle : `${result.item.deliveryMode} · ${result.item.level}`}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-3 text-sm text-slate-500">No matches for “{term}”</p>
          )}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const { role, session } = useDemo();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const params = role === 'manager' ? { managerId: session.employeeId } : {};
  const { data: alerts = [], reload } = useApi((signal) => dashboardApi.alerts(params, { signal }), [role, pathname]);
  useEffect(() => {
    window.addEventListener(DATA_CHANGED_EVENT, reload);
    return () => window.removeEventListener(DATA_CHANGED_EVENT, reload);
  }, [reload]);
  const overdue = alerts.filter((item) => item.type === 'overdue').length;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800"
        aria-label={`Learning alerts: ${alerts.length}`}
        aria-expanded={open}
      >
        <Bell className="size-5" />
        {alerts.length > 0 && (
          <span className="tabular absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {alerts.length}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute top-11 right-0 z-40 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-line bg-white shadow-pop">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">Learning alerts</p>
            <p className="text-xs text-slate-500">
              {overdue} overdue · {alerts.length - overdue} due within 7 days
              {role === 'manager' ? ' · your team' : role === 'employee' ? ' · your training' : ''}
            </p>
          </div>
          {alerts.length ? (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {alerts.map((alert) => (
                <li key={alert._id}>
                  <Link
                    to={`/assignments?status=${alert.type === 'overdue' ? 'Overdue' : ''}`}
                    onClick={close}
                    className="flex gap-3 px-4 py-3 hover:bg-slate-50"
                  >
                    {alert.type === 'overdue' ? (
                      <TriangleAlert className="mt-0.5 size-4 shrink-0 text-red-600" aria-hidden="true" />
                    ) : (
                      <CalendarClock className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                    )}
                    <span className="min-w-0 text-sm">
                      <span className="block truncate font-medium text-slate-900">{alert.program?.title}</span>
                      <span className="block text-xs text-slate-500">
                        {role !== 'employee' && `${alert.employee?.name} · `}
                        {dueLabel(alert.daysLeft)} ({formatShortDate(alert.dueDate)}) · {alert.progress}%
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-4 py-6 text-center text-sm text-slate-500">Nothing overdue or due this week.</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProfileMenu() {
  const { session, roleLabel, personas, choose } = useDemo();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useClickOutside(ref, close, open);

  const switchTo = (persona) => {
    setOpen(false);
    if (persona.role !== session.role) {
      choose(persona);
      navigate('/dashboard');
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded-lg py-1 pr-2 pl-1 hover:bg-slate-100"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        <Avatar name={session.name} size="sm" />
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-medium text-slate-900">{session.name}</span>
          <span className="block text-xs text-slate-500">{roleLabel} · demo</span>
        </span>
        <ChevronDown className="size-4 text-slate-400" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute top-12 right-0 z-40 w-72 overflow-hidden rounded-xl border border-line bg-white shadow-pop">
          <div className="border-b border-line px-4 py-3">
            <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">Demo role</p>
            <p className="mt-0.5 text-xs text-slate-500">Switch persona to see each user’s view.</p>
          </div>
          <ul className="py-1.5">
            {personas
              .filter((persona) => persona.employee)
              .map((persona) => (
                <li key={persona.role}>
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={persona.role === session.role}
                    onClick={() => switchTo(persona)}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left hover:bg-slate-50"
                  >
                    <Avatar name={persona.employee.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-slate-900">{persona.label}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {persona.employee.name} · {persona.employee.jobTitle}
                      </span>
                    </span>
                    {persona.role === session.role && <Check className="size-4 text-brand-600" aria-hidden="true" />}
                  </button>
                </li>
              ))}
          </ul>
          <div className="border-t border-line p-1.5">
            <Link
              to={`/employees/${session.employeeId}`}
              onClick={close}
              className="flex items-center gap-2 rounded-md px-2.5 py-2 text-sm text-slate-700 hover:bg-slate-50"
            >
              <UserRound className="size-4 text-slate-400" aria-hidden="true" />
              View my profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export function Topbar({ onMenu }) {
  const { pathname } = useLocation();
  const title = pageTitle(pathname);

  useEffect(() => {
    document.title = `${title} · Lutron SkillBridge (Demo)`;
  }, [title]);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-white/90 px-4 backdrop-blur sm:px-6">
      <button
        type="button"
        onClick={onMenu}
        className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="size-5" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-semibold text-slate-900">{title}</p>
        <p className="hidden truncate text-xs text-slate-500 sm:block">Lutron Electronics (India) · Gurugram office — simulated environment</p>
      </div>
      <GlobalSearch />
      <Notifications />
      <ProfileMenu />
    </header>
  );
}
