import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useDemo } from '../../context/DemoContext.jsx';
import { useMeta } from '../../context/MetaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { careerApi, competenciesApi, employeesApi, trainingsApi } from '../../services/resources.js';
import { toDateInput, todayInput } from '../../utils/format.js';
import { Button, CheckboxList, Modal, SelectInput, TextArea } from '../ui/index.js';

const newGoal = () => ({ title: '', competency: '', targetDate: todayInput(60), status: 'Not Started' });

export function CareerPlanFormModal({ open, onClose, plan, excludeEmployeeIds = [], onSaved }) {
  const { role, session } = useDemo();
  const { meta } = useMeta();
  const toast = useToast();
  const isEdit = Boolean(plan);
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const people = useApi((signal) => employeesApi.list({ limit: 100, sort: 'name' }, { signal }), [], { enabled: open });
  const competencies = useApi(() => competenciesApi.list(), [], { enabled: open });
  const programmes = useApi((signal) => trainingsApi.list({ status: 'Active', limit: 100 }, { signal }), [], { enabled: open });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      plan
        ? {
            employeeId: plan.employee._id,
            targetRole: plan.targetRole,
            mentor: plan.mentor?._id || '',
            reviewDate: toDateInput(plan.reviewDate),
            status: plan.status,
            notes: plan.notes || '',
            recommendedTrainings: plan.recommendedTrainings.map((item) => item._id),
            goals: plan.goals.map((goal) => ({
              _id: goal._id,
              title: goal.title,
              competency: goal.competency?._id || '',
              targetDate: toDateInput(goal.targetDate),
              status: goal.status,
            })),
          }
        : { employeeId: '', targetRole: '', mentor: '', reviewDate: todayInput(90), status: 'Active', notes: '', recommendedTrainings: [], goals: [newGoal()] },
    );
  }, [open, plan]);

  const allPeople = useMemo(() => people.data?.data || [], [people.data]);
  const eligible = allPeople.filter(
    (person) =>
      !excludeEmployeeIds.includes(person._id) &&
      (role === 'hr' || String(person.manager?._id || person.manager) === String(session.employeeId)),
  );
  const employee = isEdit ? plan.employee : allPeople.find((person) => person._id === values.employeeId);

  // Suggest the next step on the employee's illustrative career track.
  const suggestedRole = useMemo(() => {
    if (!employee || !meta) return '';
    const current = meta.jobRoles.find((item) => item.title === employee.jobTitle);
    if (!current?.track) return '';
    return meta.jobRoles.find((item) => item.track === current.track && item.trackLevel === current.trackLevel + 1)?.title || '';
  }, [employee, meta]);

  const set = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const setGoal = (index, patch) =>
    setValues((current) => ({ ...current, goals: current.goals.map((goal, position) => (position === index ? { ...goal, ...patch } : goal)) }));

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!isEdit && !values.employeeId) nextErrors.employeeId = 'Select an employee';
    if (!values.targetRole) nextErrors.targetRole = 'Select a target role';
    if (values.goals.some((goal) => goal.title.trim().length < 3)) nextErrors.goals = 'Every goal needs a title (3+ characters)';
    if (values.goals.length > 10) nextErrors.goals = 'Use at most 10 goals';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    const payload = {
      targetRole: values.targetRole,
      mentor: values.mentor || null,
      reviewDate: values.reviewDate || null,
      status: values.status,
      notes: values.notes,
      recommendedTrainings: values.recommendedTrainings,
      goals: values.goals.map((goal) => ({
        ...(goal._id ? { _id: goal._id } : {}),
        title: goal.title.trim(),
        competency: goal.competency || null,
        targetDate: goal.targetDate || null,
        status: goal.status,
      })),
    };
    setSaving(true);
    try {
      const saved = isEdit ? await careerApi.update(plan._id, payload) : await careerApi.create({ ...payload, employeeId: values.employeeId });
      toast.success(isEdit ? 'Development plan updated' : 'Development plan created', `${saved.employee.name} → ${saved.targetRole}`);
      onSaved?.(saved);
      onClose();
    } catch (error) {
      setErrors(error.details || {});
      toast.error('Could not save plan', error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!values.goals) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? `Edit development plan — ${plan.employee.name}` : 'Create development plan'}
      description="Target roles follow the proposed illustrative career paths, not a confirmed promotion policy."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="career-form" loading={saving}>
            {isEdit ? 'Save plan' : 'Create plan'}
          </Button>
        </>
      }
    >
      <form id="career-form" onSubmit={submit} noValidate className="grid gap-5 lg:grid-cols-2">
        <div className="space-y-4">
          {!isEdit && (
            <SelectInput
              label="Employee"
              required
              value={values.employeeId}
              onChange={(event) => {
                set('employeeId')(event);
                setValues((current) => ({ ...current, targetRole: '' }));
              }}
              error={errors.employeeId}
              placeholder={people.loading ? 'Loading…' : 'Select employee'}
              options={eligible.map((person) => ({ value: person._id, label: `${person.name} — ${person.jobTitle}` }))}
              hint={role === 'manager' ? 'Your direct reports without a plan.' : 'Employees without a development plan.'}
              data-autofocus
            />
          )}
          <SelectInput
            label="Target role"
            required
            value={values.targetRole}
            onChange={set('targetRole')}
            error={errors.targetRole}
            placeholder="Select target role"
            options={(meta?.jobRoles || [])
              .filter((item) => item.title !== employee?.jobTitle)
              .map((item) => ({ value: item.title, label: item.title === suggestedRole ? `${item.title} (next step on track)` : item.title }))}
            hint={suggestedRole ? `Suggested next step: ${suggestedRole}` : undefined}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput
              label="Mentor (fictional)"
              value={values.mentor}
              onChange={set('mentor')}
              error={errors.mentor}
              placeholder="No mentor"
              options={allPeople.filter((person) => person._id !== (employee?._id || values.employeeId)).map((person) => ({ value: person._id, label: person.name }))}
            />
            <label className="block">
              <span className="label">Review date</span>
              <input type="date" className="input" value={values.reviewDate} onChange={set('reviewDate')} />
            </label>
            <SelectInput label="Plan status" value={values.status} onChange={set('status')} options={meta?.careerPlanStatuses || ['Active']} />
          </div>
          <TextArea label="Notes" value={values.notes} onChange={set('notes')} maxLength={600} rows={3} />
          <CheckboxList
            label="Recommended training"
            options={(programmes.data?.data || []).map((item) => ({ value: item._id, label: item.title }))}
            value={values.recommendedTrainings}
            onChange={(value) => setValues((current) => ({ ...current, recommendedTrainings: value }))}
            height="max-h-44"
          />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label mb-0">Development goals</p>
            <Button size="sm" variant="subtle" icon={Plus} onClick={() => setValues((current) => ({ ...current, goals: [...current.goals, newGoal()] }))} disabled={values.goals.length >= 10}>
              Add goal
            </Button>
          </div>
          <ul className="space-y-3">
            {values.goals.map((goal, index) => (
              <li key={goal._id || index} className="space-y-2 rounded-lg border border-line p-3">
                <div className="flex gap-2">
                  <input
                    aria-label={`Goal ${index + 1} title`}
                    className="input"
                    placeholder="e.g. Reach Proficient in design estimation"
                    value={goal.title}
                    onChange={(event) => setGoal(index, { title: event.target.value })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Remove goal"
                    onClick={() => setValues((current) => ({ ...current, goals: current.goals.filter((_, position) => position !== index) }))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="grid gap-2 sm:grid-cols-3">
                  <select aria-label="Linked competency" className="input" value={goal.competency} onChange={(event) => setGoal(index, { competency: event.target.value })}>
                    <option value="">No competency</option>
                    {(competencies.data || []).map((item) => (
                      <option key={item._id} value={item._id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                  <input aria-label="Target date" type="date" className="input" value={goal.targetDate} onChange={(event) => setGoal(index, { targetDate: event.target.value })} />
                  <select aria-label="Goal status" className="input" value={goal.status} onChange={(event) => setGoal(index, { status: event.target.value })}>
                    {(meta?.goalStatuses || []).map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
          {errors.goals && <p className="mt-2 text-xs font-medium text-red-700">{errors.goals}</p>}
        </div>
      </form>
    </Modal>
  );
}
