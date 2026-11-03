import { Clock3, GraduationCap, Layers, Library, MonitorPlay, Pencil, Plus, Presentation, Sparkles, Users, Wrench } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router';
import { useReveal } from '../animations/index.js';
import { AssignTrainingModal } from '../components/training/AssignTrainingModal.jsx';
import { TrainingFormModal } from '../components/training/TrainingFormModal.jsx';
import {
  Badge,
  Button,
  Card,
  EmptyState,
  ErrorState,
  FilterSelect,
  PageHeader,
  SearchInput,
  Skeleton,
} from '../components/ui/index.js';
import { useDemo } from '../context/DemoContext.jsx';
import { useMeta } from '../context/MetaContext.jsx';
import { useApi } from '../hooks/useApi.js';
import { useDebouncedValue } from '../hooks/useDebouncedValue.js';
import { competenciesApi, trainingsApi } from '../services/resources.js';
import { CATEGORY_META } from '../utils/constants.js';
import { formatHours } from '../utils/format.js';

const MODE_ICONS = { Online: MonitorPlay, 'Instructor-led': Presentation, 'On-the-job': Wrench, Workshop: Users };

function ProgrammeCard({ program, addressesGap, onEdit, onAssign, canEdit, canAssign }) {
  const ModeIcon = MODE_ICONS[program.deliveryMode] || Library;
  const extraSkills = program.competencies.length - 4;
  return (
    <article data-reveal className="card flex flex-col p-5 transition-shadow hover:shadow-pop">
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
          <ModeIcon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {addressesGap && (
            <Badge tone="glow" icon={Sparkles}>
              Addresses your gap
            </Badge>
          )}
          {program.status !== 'Active' && <Badge tone={program.status === 'Draft' ? 'warning' : 'neutral'}>{program.status}</Badge>}
        </div>
      </div>
      <h3 className="text-[15px] leading-snug font-semibold text-slate-900">{program.title}</h3>
      <p className="mt-1.5 line-clamp-3 text-sm text-slate-600">{program.description}</p>

      <dl className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
        <div className="flex items-center gap-1">
          <dt className="sr-only">Delivery</dt>
          <ModeIcon className="size-3.5 text-slate-400" aria-hidden="true" />
          <dd>{program.deliveryMode}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="sr-only">Duration</dt>
          <Clock3 className="size-3.5 text-slate-400" aria-hidden="true" />
          <dd>{formatHours(program.durationHours)}</dd>
        </div>
        <div className="flex items-center gap-1">
          <dt className="sr-only">Level</dt>
          <Layers className="size-3.5 text-slate-400" aria-hidden="true" />
          <dd>{program.level}</dd>
        </div>
      </dl>

      <div className="mt-4">
        <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-slate-500 uppercase">Skills covered</p>
        <ul className="flex flex-wrap gap-1.5">
          {program.competencies.slice(0, 4).map((competency) => (
            <li key={competency._id} className="flex items-center gap-1.5 rounded-md bg-slate-50 px-2 py-1 text-xs text-slate-700 ring-1 ring-slate-200 ring-inset">
              <span className={`size-1.5 rounded-full ${CATEGORY_META[competency.category]?.dot}`} aria-hidden="true" />
              {competency.name}
            </li>
          ))}
          {extraSkills > 0 && <li className="px-1 py-1 text-xs text-slate-500">+{extraSkills} more</li>}
        </ul>
      </div>
      <p className="mt-3 text-xs text-slate-500">
        <span className="font-medium text-slate-700">Target roles: </span>
        {program.targetRoles.length ? program.targetRoles.join(', ') : 'All roles'}
      </p>

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line pt-4">
        <p className="tabular text-xs text-slate-500">
          <span className="font-semibold text-slate-800">{program.stats.enrollments}</span> enrolled ·{' '}
          <span className="font-semibold text-slate-800">{program.stats.completed}</span> completed
        </p>
        <div className="flex gap-1">
          {canEdit && (
            <Button variant="ghost" size="icon-sm" onClick={() => onEdit(program)} aria-label={`Edit ${program.title}`}>
              <Pencil className="size-4" />
            </Button>
          )}
          {canAssign && program.status === 'Active' && (
            <Button size="sm" variant="subtle" icon={Plus} onClick={() => onAssign(program)}>
              Assign
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}

export default function TrainingCataloguePage() {
  const { can, role, session } = useDemo();
  const { meta } = useMeta();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [deliveryMode, setDeliveryMode] = useState('');
  const [level, setLevel] = useState('');
  const [status, setStatus] = useState(can('training.manage') ? '' : 'Active');
  const [competency, setCompetency] = useState('');
  const [targetRole, setTargetRole] = useState('');
  const [form, setForm] = useState({ open: false, program: null });
  const [assign, setAssign] = useState({ open: false, programIds: [] });
  const term = useDebouncedValue(search, 300);

  const { data, error, loading, reload } = useApi(
    (signal) => trainingsApi.list({ search: term, deliveryMode, level, status, competency, targetRole, limit: 100 }, { signal }),
    [term, deliveryMode, level, status, competency, targetRole],
  );
  const competencies = useApi(() => competenciesApi.list(), []);
  const myProfile = useApi(() => competenciesApi.forEmployee(session.employeeId), [], { enabled: role === 'employee' });
  const ref = useRef(null);
  useReveal(ref, { ready: Boolean(data), stagger: 0.04 });

  const myGapIds = useMemo(
    () => new Set((myProfile.data?.items || []).filter((item) => item.gap > 0).map((item) => String(item.competency._id))),
    [myProfile.data],
  );
  const hasFilters = term || deliveryMode || level || competency || targetRole || (status && can('training.manage'));

  return (
    <div ref={ref}>
      <PageHeader
        eyebrow="Learning"
        title="Training catalogue"
        description="Proposed programmes covering lighting fundamentals, controls and shading, design tools, technical product learning, communication and cross-functional coordination."
        actions={
          can('training.manage') && (
            <Button variant="primary" icon={Plus} onClick={() => setForm({ open: true, program: null })}>
              Add programme
            </Button>
          )
        }
      />

      <Card data-reveal className="mb-6 flex flex-col gap-3 p-4 xl:flex-row xl:items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search programmes…" className="xl:w-72" label="Search programmes" />
        <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
          <FilterSelect label="Delivery method" value={deliveryMode} onChange={setDeliveryMode} placeholder="All delivery methods" options={meta?.deliveryModes || []} />
          <FilterSelect label="Level" value={level} onChange={setLevel} placeholder="All levels" options={meta?.trainingLevels || []} />
          <FilterSelect
            label="Skill"
            value={competency}
            onChange={setCompetency}
            placeholder="All skills"
            options={(competencies.data || []).map((item) => ({ value: item._id, label: item.name }))}
            className="max-w-56"
          />
          <FilterSelect
            label="Target role"
            value={targetRole}
            onChange={setTargetRole}
            placeholder="Any target role"
            options={(meta?.jobRoles || []).map((item) => item.title)}
            className="max-w-56"
          />
          {can('training.manage') && <FilterSelect label="Status" value={status} onChange={setStatus} placeholder="All statuses" options={meta?.trainingStatuses || []} />}
        </div>
      </Card>

      {error && !data ? (
        <Card>
          <ErrorState error={error} onRetry={reload} />
        </Card>
      ) : !data ? (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div key={index} className="card space-y-3 p-5">
              <Skeleton className="size-10 rounded-xl" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      ) : data.data.length === 0 ? (
        <Card>
          <EmptyState
            icon={GraduationCap}
            title={hasFilters ? 'No programmes match these filters' : 'The catalogue is empty'}
            description={hasFilters ? 'Try another search or clear a filter.' : 'Add a programme to start building the catalogue.'}
          />
        </Card>
      ) : (
        <>
          <p className="mb-3 text-sm text-slate-600" aria-live="polite">
            {loading ? 'Updating…' : `${data.meta.total} programme${data.meta.total === 1 ? '' : 's'}`}
          </p>
          <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {data.data.map((program) => (
              <ProgrammeCard
                key={program._id}
                program={program}
                addressesGap={role === 'employee' && program.competencies.some((item) => myGapIds.has(String(item._id)))}
                canEdit={can('training.manage')}
                canAssign={can('assign')}
                onEdit={(item) => setForm({ open: true, program: item })}
                onAssign={(item) => setAssign({ open: true, programIds: [item._id] })}
              />
            ))}
          </div>
        </>
      )}

      <TrainingFormModal
        open={form.open}
        program={form.program}
        onClose={() => setForm((current) => ({ ...current, open: false }))}
        onSaved={reload}
        onDeleted={reload}
      />
      <AssignTrainingModal
        open={assign.open}
        defaultProgramIds={assign.programIds}
        onClose={() => setAssign((current) => ({ ...current, open: false }))}
        onAssigned={reload}
      />
    </div>
  );
}
