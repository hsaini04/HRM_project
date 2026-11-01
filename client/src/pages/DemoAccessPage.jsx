import { ArrowRight, BriefcaseBusiness, ShieldCheck, UserRound, Users } from 'lucide-react';
import { useRef } from 'react';
import { useNavigate } from 'react-router';
import { useReveal } from '../animations/index.js';
import { DemoNotice } from '../components/layout/AppLayout.jsx';
import { LogoMark } from '../components/layout/Logo.jsx';
import { Avatar, ErrorState, Skeleton } from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';

const ROLE_DETAILS = {
  hr: {
    icon: ShieldCheck,
    summary: 'Manage the employee directory, competency framework, training catalogue, assignments and reports.',
    can: ['Add / edit employees & programmes', 'Assess any employee', 'Organisation-wide analytics'],
  },
  manager: {
    icon: Users,
    summary: 'Review your team’s skill gaps, assess competencies, assign learning and track progress.',
    can: ['Team skill-gap view', 'Assess & assign for direct reports', 'Development plans for the team'],
  },
  employee: {
    icon: UserRound,
    summary: 'See your own skills, assigned training, due dates, progress and development goals.',
    can: ['My competencies vs role', 'Update my training progress', 'Track my career goals'],
  },
};

export default function DemoAccessPage() {
  const { personas, status, retry, choose, session } = useDemo();
  const navigate = useNavigate();
  const ref = useRef(null);
  useReveal(ref, { ready: status === 'ready', stagger: 0.07 });

  const select = (persona) => {
    choose(persona);
    navigate('/dashboard');
  };

  return (
    <div ref={ref} className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-10 sm:px-6">
        <div data-reveal className="mb-10 flex items-center gap-3">
          <LogoMark className="size-10" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-900">Lutron SkillBridge</p>
            <p className="text-sm text-slate-500">Employee Training & Skill Development System</p>
          </div>
        </div>

        <div data-reveal className="mb-8 max-w-2xl">
          <p className="mb-2 text-xs font-semibold tracking-wide text-brand-700 uppercase">Demo access</p>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">Choose a role to explore the prototype</h1>
          <p className="mt-3 text-slate-600">
            SkillBridge links each role’s competency requirements to skill gaps, targeted training and career development for a
            simulated Lutron Electronics Gurugram office. No password is needed — each role uses a fictional demo persona.
          </p>
        </div>

        {status === 'error' ? (
          <div className="card">
            <ErrorState
              error={{ message: 'The API is not reachable. Start the server and MongoDB, then seed the demo data (npm run seed).' }}
              onRetry={retry}
            />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {status === 'loading'
              ? [0, 1, 2].map((index) => (
                  <div key={index} className="card space-y-4 p-6">
                    <Skeleton className="size-10" />
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))
              : personas.map((persona) => {
                  const details = ROLE_DETAILS[persona.role];
                  const active = session?.role === persona.role;
                  return (
                    <button
                      key={persona.role}
                      data-reveal
                      type="button"
                      disabled={!persona.employee}
                      onClick={() => select(persona)}
                      className={`card group flex flex-col p-6 text-left transition-all hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-pop disabled:opacity-50 ${
                        active ? 'border-brand-400 ring-2 ring-brand-100' : ''
                      }`}
                    >
                      <span className="mb-4 grid size-10 place-items-center rounded-xl bg-brand-50 text-brand-700">
                        <details.icon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-lg font-semibold text-slate-900">{persona.label}</span>
                      <span className="mt-1.5 text-sm text-slate-600">{details.summary}</span>
                      <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                        {details.can.map((item) => (
                          <li key={item} className="flex items-center gap-2">
                            <span className="size-1.5 rounded-full bg-brand-400" aria-hidden="true" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {persona.employee ? (
                        <span className="mt-6 flex items-center gap-3 border-t border-line pt-4">
                          <Avatar name={persona.employee.name} size="sm" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-slate-900">{persona.employee.name}</span>
                            <span className="block truncate text-xs text-slate-500">{persona.employee.jobTitle}</span>
                          </span>
                          <ArrowRight className="size-4 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-brand-600" />
                        </span>
                      ) : (
                        <span className="mt-6 border-t border-line pt-4 text-xs text-red-600">Persona not found — run the seed script.</span>
                      )}
                    </button>
                  );
                })}
          </div>
        )}

        <div data-reveal className="mt-10 grid gap-4 md:grid-cols-[1.4fr_1fr]">
          <div className="card p-5">
            <div className="mb-2 flex items-center gap-2">
              <BriefcaseBusiness className="size-4 text-slate-500" aria-hidden="true" />
              <p className="text-sm font-semibold text-slate-900">Why this prototype — CA-1 context</p>
            </div>
            <p className="text-sm text-slate-600">
              The CA-1 field study identified three HR challenges: retaining specialised talent, hiring for niche technical roles and{' '}
              <strong className="font-semibold text-slate-800">continuous skill development</strong>. SkillBridge primarily addresses the
              third, while career-development visibility and role-wise capability building can support the other two as part of a wider
              HR strategy.
            </p>
          </div>
          <div className="card p-5 text-sm text-slate-600">
            <p className="mb-2 text-sm font-semibold text-slate-900">About the demo roles</p>
            <p>
              Roles are a demonstration convenience, not secure authentication. The API applies the same role rules so each view
              behaves realistically.
            </p>
          </div>
        </div>

        <div className="mt-auto pt-10">
          <DemoNotice />
        </div>
      </div>
    </div>
  );
}
