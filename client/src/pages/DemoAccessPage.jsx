import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  GraduationCap,
  LockKeyhole,
  Route,
  ShieldCheck,
  Target,
  UserRound,
  Users,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { gsap, prefersReducedMotion, useReveal } from '../animations/index.js';
import { DemoNotice } from '../components/layout/AppLayout.jsx';
import { LogoMark } from '../components/layout/Logo.jsx';
import { ThemeToggle } from '../components/layout/ThemeToggle.jsx';
import { Button, ErrorState, Skeleton } from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';

const ROLE_DETAILS = {
  hr: {
    icon: ShieldCheck,
    can: ['Add and edit employees and programmes', 'Assess any employee', 'Organisation-wide analytics'],
  },
  manager: {
    icon: Users,
    can: ['Team skill-gap view', 'Assess and assign for direct reports', 'Development plans for the team'],
  },
  employee: {
    icon: UserRound,
    can: ['My competencies against my role', 'Update my training progress', 'Track my career goals'],
  },
};

const HIGHLIGHTS = [
  { icon: Target, title: 'Competency framework', text: 'Core, functional and behavioural skills on a 1–4 scale.' },
  { icon: ChartNoAxesCombined, title: 'Skill-gap analysis', text: 'Required minus current level, priority gaps flagged.' },
  { icon: GraduationCap, title: 'Targeted training', text: 'Programmes linked to gaps and tracked to completion.' },
  { icon: Route, title: 'Career development', text: 'Career tracks and individual development plans.' },
];

/** Always-dark brand panel shown beside the sign-in form on large screens. */
function BrandPanel() {
  const ref = useRef(null);

  // Two soft lights drift slowly behind the content; skipped for reduced motion.
  useLayoutEffect(() => {
    if (!ref.current || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.to('[data-glow="a"]', { xPercent: 14, yPercent: 10, duration: 9, ease: 'sine.inOut', yoyo: true, repeat: -1 });
      gsap.to('[data-glow="b"]', { xPercent: -12, yPercent: -14, duration: 11, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    }, ref);
    return () => ctx.revert();
  }, []);

  return (
    <aside ref={ref} className="relative hidden overflow-hidden bg-[#0a1930] text-white lg:block">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div data-glow="a" className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-brand-500/35 blur-[110px]" />
        <div data-glow="b" className="absolute -right-24 -bottom-48 size-[30rem] rounded-full bg-glow-400/20 blur-[110px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgb(255_255_255/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(255_255_255/0.05)_1px,transparent_1px)] mask-[radial-gradient(ellipse_70%_60%_at_35%_40%,black,transparent)] bg-size-[48px_48px]" />
        {/* The bridge arc from the SkillBridge mark, drawn large and faint. */}
        <svg className="absolute right-[-12%] bottom-[4%] w-[80%] text-white/10" viewBox="0 0 400 200" fill="none">
          <path d="M10 190C70 70 140 20 200 20s130 50 190 170" stroke="currentColor" strokeWidth="2" />
          <path d="M60 190C105 105 150 70 200 70s95 35 140 120" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 8" />
        </svg>
      </div>

      <div className="relative flex h-full flex-col px-10 py-10 xl:px-14 xl:py-12">
        <div data-reveal className="flex items-center gap-3">
          <LogoMark className="size-9" />
          <div className="leading-tight">
            <p className="font-semibold tracking-tight">Lutron SkillBridge</p>
            <p className="text-xs text-white/60">Training & Skill Development</p>
          </div>
        </div>

        <div className="my-auto max-w-xl py-8">
          <p data-reveal className="text-xs font-semibold tracking-[0.14em] text-[#9cc3f5] uppercase">
            Gurugram office · Simulated environment
          </p>
          <h2 data-reveal className="mt-4 text-4xl leading-[1.1] font-semibold tracking-tight text-balance xl:text-[2.75rem]">
            Close skill gaps. <span className="text-white/55">Grow specialist talent from within.</span>
          </h2>
          <p data-reveal className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
            Connect each role’s competency requirements to skill gaps, targeted training and career development, in one place.
          </p>
          <ul className="mt-10 grid gap-x-8 gap-y-6 xl:grid-cols-2">
            {HIGHLIGHTS.map((item) => (
              <li key={item.title} data-reveal className="flex gap-3.5">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white/7 ring-1 ring-white/10 ring-inset">
                  <item.icon className="size-[18px] text-[#9cc3f5]" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-medium">{item.title}</span>
                  <span className="mt-0.5 block text-[13px] leading-snug text-white/55">{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <figure data-reveal className="rounded-2xl bg-white/5 p-5 ring-1 ring-white/10 ring-inset backdrop-blur-sm">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-glow-400 uppercase">CA-1 focus</p>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            The CA-1 field study found three HR challenges: retaining specialised talent, hiring for niche technical roles and{' '}
            <strong className="font-semibold text-white">continuous skill development</strong>, which this prototype addresses.
          </p>
        </figure>
        <p data-reveal className="mt-6 text-xs text-white/45">
          Independent academic prototype (HRM-203 CA-2). Not an official Lutron Electronics product.
        </p>
      </div>
    </aside>
  );
}

function RoleOption({ persona, checked, current, onSelect }) {
  const Icon = ROLE_DETAILS[persona.role].icon;
  const missing = !persona.employee;
  return (
    <label
      data-option
      className={`group flex items-center gap-4 rounded-xl border p-3.5 pr-4 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-brand-500 ${
        missing
          ? 'cursor-not-allowed border-line opacity-60'
          : checked
            ? 'cursor-pointer border-brand-500 bg-brand-50/70 ring-1 ring-brand-500'
            : 'cursor-pointer border-line hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <input
        type="radio"
        name="demo-role"
        value={persona.role}
        checked={checked}
        disabled={missing}
        onChange={() => onSelect(persona.role)}
        className="sr-only"
      />
      <span
        className={`grid size-10 shrink-0 place-items-center rounded-lg transition-colors ${
          checked ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600'
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[15px] font-semibold text-slate-900">{persona.label}</span>
          {current && (
            <span className="rounded-full bg-emerald-50 px-1.5 py-px text-[10px] font-semibold tracking-wide text-emerald-700 uppercase ring-1 ring-emerald-600/20 ring-inset">
              Current
            </span>
          )}
        </span>
        <span className="mt-0.5 block truncate text-[13px] text-slate-500">
          {missing ? (
            <span className="text-red-700">Persona not found — run the seed script.</span>
          ) : (
            `${persona.employee.name} · ${persona.employee.jobTitle}`
          )}
        </span>
      </span>
      <span
        className={`grid size-5 shrink-0 place-items-center rounded-full border-2 transition-colors ${
          checked ? 'border-brand-600 bg-brand-600' : 'border-slate-300 bg-surface'
        }`}
        aria-hidden="true"
      >
        <span className={`size-2 rounded-full bg-white transition-transform ${checked ? 'scale-100' : 'scale-0'}`} />
      </span>
    </label>
  );
}

export default function DemoAccessPage() {
  const { personas, status, retry, choose, session } = useDemo();
  const navigate = useNavigate();
  const pageRef = useRef(null);
  const formRef = useRef(null);
  const detailsRef = useRef(null);
  const shownRole = useRef(null);
  const [picked, setPicked] = useState(null);

  // Page chrome reveals on mount; the role options follow once the personas have loaded.
  useReveal(pageRef, { stagger: 0.05 });
  useReveal(formRef, { ready: status === 'ready', selector: '[data-option]', stagger: 0.06 });

  useEffect(() => {
    document.title = 'Sign in · Lutron SkillBridge (Demo)';
  }, []);

  const available = personas.filter((persona) => persona.employee);
  // Default to the current demo role (or the first one) until the user picks another.
  const selected =
    available.find((persona) => persona.role === picked) ||
    available.find((persona) => persona.role === session?.role) ||
    available[0] ||
    null;
  const details = selected ? ROLE_DETAILS[selected.role] : null;

  // Fade the role summary in when the selection changes (not on first render).
  useLayoutEffect(() => {
    const previous = shownRole.current;
    shownRole.current = selected?.role || null;
    if (!previous || previous === selected?.role || !detailsRef.current || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(detailsRef.current.querySelectorAll('li'), { autoAlpha: 0, y: 6, duration: 0.3, stagger: 0.04, clearProps: 'opacity,visibility,transform' });
    }, detailsRef);
    return () => ctx.revert();
  }, [selected?.role]);

  const submit = (event) => {
    event.preventDefault();
    if (!selected) return;
    choose(selected);
    navigate('/dashboard');
  };

  return (
    <div ref={pageRef} className="grid min-h-dvh bg-surface lg:grid-cols-2 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <BrandPanel />

      <main className="relative flex min-h-dvh min-w-0 flex-col">
        <header className="flex items-center justify-between gap-4 px-5 pt-5 sm:px-8 sm:pt-6 lg:absolute lg:top-0 lg:right-0">
          <div className="flex items-center gap-2.5 lg:hidden">
            <LogoMark className="size-8" />
            <div className="leading-tight">
              <p className="text-[15px] font-semibold tracking-tight text-slate-900">Lutron SkillBridge</p>
              <p className="text-[11px] font-medium text-slate-500">Training & Skill Development</p>
            </div>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8 lg:py-6">
          <div className="w-full max-w-[27rem]">
            <span
              data-reveal
              className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-600/15 ring-inset"
            >
              <span className="size-1.5 rounded-full bg-brand-500" aria-hidden="true" />
              Demo access
            </span>
            <h1 data-reveal className="mt-4 text-[1.75rem] leading-tight font-semibold tracking-tight text-slate-900 sm:text-3xl">
              Sign in to SkillBridge
            </h1>
            <p data-reveal className="mt-2.5 text-[15px] leading-relaxed text-slate-500">
              Choose a role to explore the prototype as a fictional persona. No password is needed.
            </p>

            {status === 'error' ? (
              <div className="mt-8 rounded-xl border border-line">
                <ErrorState
                  error={{ message: 'The API is not reachable. Start the server and MongoDB, then seed the demo data (npm run seed).' }}
                  onRetry={retry}
                />
              </div>
            ) : (
              <form ref={formRef} onSubmit={submit} className="mt-7">
                <fieldset>
                  <legend className="mb-2.5 text-sm font-medium text-slate-700">Continue as</legend>
                  <div className="space-y-2">
                    {status === 'loading'
                      ? [0, 1, 2].map((index) => (
                          <div key={index} className="flex items-center gap-4 rounded-xl border border-line p-3.5">
                            <Skeleton className="size-10" />
                            <div className="flex-1 space-y-2">
                              <Skeleton className="h-4 w-1/3" />
                              <Skeleton className="h-3 w-2/3" />
                            </div>
                          </div>
                        ))
                      : personas.map((persona) => (
                          <RoleOption
                            key={persona.role}
                            persona={persona}
                            checked={selected?.role === persona.role}
                            current={session?.role === persona.role}
                            onSelect={setPicked}
                          />
                        ))}
                  </div>
                </fieldset>

                {details && (
                  <div data-option ref={detailsRef} className="mt-3 rounded-xl bg-slate-50 px-4 py-3.5 ring-1 ring-line ring-inset">
                    <ul className="space-y-2" aria-label={`What the ${selected.label} role can do`}>
                      {details.can.map((item) => (
                        <li key={item} className="flex items-center gap-2.5 text-sm text-slate-700">
                          <span className="grid size-4 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700" aria-hidden="true">
                            <Check className="size-3" strokeWidth={3} />
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  data-option
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={status !== 'ready' || !selected}
                  className="group mt-5 w-full justify-center"
                >
                  {selected ? `Continue as ${selected.label}` : 'Continue'}
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Button>
              </form>
            )}

            <p data-reveal className="mt-5 flex gap-2 text-xs leading-relaxed text-slate-500">
              <LockKeyhole className="mt-px size-3.5 shrink-0 text-slate-400" aria-hidden="true" />
              Demo roles are a convenience, not secure authentication. The API applies the same role rules, so each view behaves
              realistically.
            </p>

            <div data-reveal className="mt-6 rounded-xl border border-line p-4 lg:hidden">
              <p className="text-[11px] font-semibold tracking-[0.12em] text-amber-800 uppercase">CA-1 focus</p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
                Of the three HR challenges in the CA-1 field study (retaining specialised talent, hiring for niche technical roles and
                continuous skill development), this prototype addresses{' '}
                <strong className="font-semibold text-slate-800">continuous skill development</strong>.
              </p>
            </div>
          </div>
        </div>

        <footer data-reveal className="px-5 pb-5 sm:px-8">
          <DemoNotice />
        </footer>
      </main>
    </div>
  );
}
