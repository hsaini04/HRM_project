import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMeta } from '../../context/MetaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { competenciesApi } from '../../services/resources.js';
import { LEVEL_LABELS } from '../../utils/constants.js';
import { Button, Modal, SelectInput, TextArea, TextInput } from '../ui/index.js';

const EMPTY = { name: '', category: '', description: '', assessmentMethod: '', roleRequirements: [] };

export function CompetencyFormModal({ open, onClose, competency, defaultRole, onSaved }) {
  const { meta } = useMeta();
  const toast = useToast();
  const isEdit = Boolean(competency);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      competency
        ? {
            name: competency.name,
            category: competency.category,
            description: competency.description,
            assessmentMethod: competency.assessmentMethod || '',
            roleRequirements: competency.roleRequirements.map((item) => ({ ...item })),
          }
        : { ...EMPTY, roleRequirements: defaultRole ? [{ jobTitle: defaultRole, requiredLevel: 3 }] : [] },
    );
  }, [open, competency, defaultRole]);

  const set = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };
  const setRequirement = (index, patch) =>
    setValues((current) => ({
      ...current,
      roleRequirements: current.roleRequirements.map((item, position) => (position === index ? { ...item, ...patch } : item)),
    }));

  const usedRoles = new Set(values.roleRequirements.map((item) => item.jobTitle));
  const roleOptions = (meta?.jobRoles || []).map((role) => ({ value: role.title, label: role.title }));

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (values.name.trim().length < 3) nextErrors.name = 'Name must be at least 3 characters';
    if (!values.category) nextErrors.category = 'Choose Core, Functional or Behavioural';
    if (values.description.trim().length < 10) nextErrors.description = 'Describe what the competency means (10+ characters)';
    if (values.roleRequirements.some((item) => !item.jobTitle)) nextErrors.roleRequirements = 'Select a role for every requirement row';
    else if (usedRoles.size !== values.roleRequirements.length) nextErrors.roleRequirements = 'Each role can only appear once';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    const payload = {
      ...values,
      roleRequirements: values.roleRequirements.map((item) => ({ jobTitle: item.jobTitle, requiredLevel: Number(item.requiredLevel) })),
    };
    try {
      const saved = isEdit ? await competenciesApi.update(competency._id, payload) : await competenciesApi.create(payload);
      toast.success(isEdit ? 'Competency updated' : 'Competency added', `${saved.name} · ${saved.category}`);
      onSaved?.(saved);
      onClose();
    } catch (error) {
      setErrors(error.details || {});
      toast.error('Could not save competency', error.details ? 'Check the highlighted fields.' : error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit competency` : 'Add competency'}
      description="Proposed framework content for the prototype — not Lutron’s official competency framework."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="competency-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add competency'}
          </Button>
        </>
      }
    >
      <form id="competency-form" onSubmit={submit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[1.6fr_1fr]">
          <TextInput label="Competency name" required value={values.name} onChange={set('name')} error={errors.name} data-autofocus />
          <SelectInput label="Category" required value={values.category} onChange={set('category')} error={errors.category} placeholder="Select" options={meta?.competencyCategories || []} />
        </div>
        <TextArea label="What it means in the role" required value={values.description} onChange={set('description')} error={errors.description} maxLength={500} />
        <TextInput
          label="How it can be assessed"
          value={values.assessmentMethod}
          onChange={set('assessmentMethod')}
          error={errors.assessmentMethod}
          placeholder="e.g. Practical task / work sample"
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <p className="label mb-0">Expected level by job role</p>
            <Button
              size="sm"
              variant="subtle"
              icon={Plus}
              onClick={() => setValues((current) => ({ ...current, roleRequirements: [...current.roleRequirements, { jobTitle: '', requiredLevel: 3 }] }))}
            >
              Add role
            </Button>
          </div>
          {values.roleRequirements.length ? (
            <ul className="space-y-2">
              {values.roleRequirements.map((item, index) => (
                <li key={index} className="flex items-center gap-2">
                  <select
                    aria-label="Job role"
                    value={item.jobTitle}
                    onChange={(event) => setRequirement(index, { jobTitle: event.target.value })}
                    className="input flex-1"
                  >
                    <option value="">Select role</option>
                    {roleOptions.map((option) => (
                      <option key={option.value} value={option.value} disabled={usedRoles.has(option.value) && option.value !== item.jobTitle}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label="Required level"
                    value={item.requiredLevel}
                    onChange={(event) => setRequirement(index, { requiredLevel: Number(event.target.value) })}
                    className="input w-40"
                  >
                    {[1, 2, 3, 4].map((level) => (
                      <option key={level} value={level}>
                        L{level} · {LEVEL_LABELS[level]}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove role requirement"
                    onClick={() => setValues((current) => ({ ...current, roleRequirements: current.roleRequirements.filter((_, position) => position !== index) }))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-sm text-slate-500">
              Not linked to any role yet. Add the roles that need this competency and their expected level.
            </p>
          )}
          {errors.roleRequirements && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.roleRequirements}</p>}
          {isEdit && <p className="mt-2 text-xs text-slate-500">Changing expected levels recalculates existing employees’ gaps.</p>}
        </div>
      </form>
    </Modal>
  );
}
