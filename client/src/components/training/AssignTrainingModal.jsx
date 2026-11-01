import { Sparkles } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDemo } from '../../context/DemoContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { competenciesApi, employeesApi, enrollmentsApi, trainingsApi } from '../../services/resources.js';
import { todayInput } from '../../utils/format.js';
import { Badge, Button, CheckboxList, Modal, SelectInput, TextInput } from '../ui/index.js';

/**
 * Assign one or more active programmes to an employee. Programmes that address the
 * employee's current skill gaps are listed first and marked "Recommended".
 */
export function AssignTrainingModal({ open, onClose, employee: fixedEmployee, defaultProgramIds = [], onAssigned }) {
  const { role, session } = useDemo();
  const toast = useToast();
  const [employeeId, setEmployeeId] = useState('');
  const [programIds, setProgramIds] = useState([]);
  const [assignedAt, setAssignedAt] = useState(todayInput());
  const [dueDate, setDueDate] = useState(todayInput(30));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmployeeId(fixedEmployee?._id || '');
    setProgramIds(defaultProgramIds);
    setAssignedAt(todayInput());
    setDueDate(todayInput(30));
    setErrors({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, fixedEmployee]);

  const people = useApi(
    (signal) => employeesApi.list({ limit: 100, sort: 'name', managerId: role === 'manager' ? session.employeeId : undefined }, { signal }),
    [role],
    { enabled: open && !fixedEmployee },
  );
  const programmes = useApi((signal) => trainingsApi.list({ status: 'Active', limit: 100 }, { signal }), [], { enabled: open });
  const profile = useApi(() => competenciesApi.forEmployee(employeeId), [employeeId], { enabled: open && Boolean(employeeId) });

  const selectedEmployee = fixedEmployee || people.data?.data.find((person) => person._id === employeeId);
  const gapIds = useMemo(
    () => new Set((profile.data?.items || []).filter((item) => item.gap > 0).map((item) => String(item.competency._id))),
    [profile.data],
  );

  const programmeOptions = useMemo(() => {
    const list = programmes.data?.data || [];
    return list
      .map((program) => {
        const addresses = program.competencies.filter((competency) => gapIds.has(String(competency._id)));
        const targeted = !program.targetRoles.length || program.targetRoles.includes(selectedEmployee?.jobTitle);
        return {
          value: program._id,
          label: program.title,
          group: addresses.length ? 'Recommended — addresses current skill gaps' : targeted ? 'Relevant to this role' : 'Other programmes',
          rank: addresses.length ? 0 : targeted ? 1 : 2,
          description: `${program.deliveryMode} · ${program.durationHours} h · ${program.level}${addresses.length ? ` · covers ${addresses.map((item) => item.name).join(', ')}` : ''}`,
        };
      })
      .sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label));
  }, [programmes.data, gapIds, selectedEmployee]);

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!employeeId) nextErrors.employeeId = 'Select an employee';
    if (!programIds.length) nextErrors.programIds = 'Select at least one programme';
    if (!dueDate) nextErrors.dueDate = 'Choose a due date';
    else if (dueDate < assignedAt) nextErrors.dueDate = 'Due date cannot be before the assignment date';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const response = await enrollmentsApi.create({ employeeId, programIds, dueDate, assignedAt });
      const skipped = response.meta.skipped;
      toast.success(
        `Assigned ${response.meta.created} programme${response.meta.created === 1 ? '' : 's'}`,
        `${selectedEmployee?.name || 'Employee'} · due ${dueDate}${skipped.length ? ` · ${skipped.length} skipped (${skipped.map((item) => item.reason).join('; ')})` : ''}`,
      );
      onAssigned?.(response.data);
      onClose();
    } catch (error) {
      const skipped = error.details?.skipped;
      if (skipped) {
        toast.error('Nothing new to assign', skipped.map((item) => `${item.title || 'Programme'}: ${item.reason}`).join(' · '));
      } else {
        setErrors(error.details || {});
        toast.error('Could not assign training', error.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Assign training"
      description="Assign one or more active programmes and set the dates. Progress starts at 0% (Not Started)."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="assign-form" loading={saving} disabled={!programIds.length}>
            Assign {programIds.length > 0 && `(${programIds.length})`}
          </Button>
        </>
      }
    >
      <form id="assign-form" onSubmit={submit} noValidate className="space-y-4">
        {fixedEmployee ? (
          <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5 text-sm">
            <span>
              <span className="font-medium text-slate-900">{fixedEmployee.name}</span>
              <span className="text-slate-500"> · {fixedEmployee.jobTitle}</span>
            </span>
            {profile.data && <Badge tone="warning">{gapIds.size} skill gaps</Badge>}
          </div>
        ) : (
          <SelectInput
            label="Employee"
            required
            value={employeeId}
            onChange={(event) => {
              setEmployeeId(event.target.value);
              setErrors((current) => ({ ...current, employeeId: undefined }));
            }}
            error={errors.employeeId}
            placeholder={people.loading ? 'Loading employees…' : 'Select employee'}
            options={(people.data?.data || []).map((person) => ({ value: person._id, label: `${person.name} — ${person.jobTitle}` }))}
            hint={role === 'manager' ? 'Managers can assign training to their direct reports.' : undefined}
            data-autofocus
          />
        )}

        {employeeId && gapIds.size > 0 && (
          <p className="flex items-center gap-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
            <Sparkles className="size-3.5 shrink-0" aria-hidden="true" />
            Programmes are ordered by relevance to this employee’s current skill gaps.
          </p>
        )}

        <CheckboxList
          label="Programmes"
          required
          options={programmeOptions}
          groupBy="group"
          value={programIds}
          onChange={(value) => {
            setProgramIds(value);
            setErrors((current) => ({ ...current, programIds: undefined }));
          }}
          error={errors.programIds}
          height="max-h-64"
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Assignment date" type="date" value={assignedAt} onChange={(event) => setAssignedAt(event.target.value)} error={errors.assignedAt} />
          <TextInput
            label="Due date"
            required
            type="date"
            min={assignedAt}
            value={dueDate}
            onChange={(event) => {
              setDueDate(event.target.value);
              setErrors((current) => ({ ...current, dueDate: undefined }));
            }}
            error={errors.dueDate}
          />
        </div>
      </form>
    </Modal>
  );
}
