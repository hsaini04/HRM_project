import { Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useMeta } from '../../context/MetaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { competenciesApi, trainingsApi } from '../../services/resources.js';
import { shortDepartment } from '../../utils/format.js';
import { Button, CheckboxList, Modal, SelectInput, TextArea, TextInput } from '../ui/index.js';

const EMPTY = {
  title: '',
  description: '',
  competencies: [],
  targetRoles: [],
  deliveryMode: '',
  durationHours: '',
  level: '',
  status: 'Active',
  provider: 'Internal L&D (proposed)',
};

function validate(values) {
  const errors = {};
  if (values.title.trim().length < 5) errors.title = 'Title must be at least 5 characters';
  if (values.description.trim().length < 20) errors.description = 'Description must be at least 20 characters';
  if (!values.competencies.length) errors.competencies = 'Select at least one competency this programme develops';
  if (!values.deliveryMode) errors.deliveryMode = 'Choose a delivery method';
  if (!values.level) errors.level = 'Choose a level';
  const hours = Number(values.durationHours);
  if (!values.durationHours || Number.isNaN(hours) || hours < 0.5 || hours > 200) errors.durationHours = 'Enter 0.5 to 200 hours';
  return errors;
}

export function TrainingFormModal({ open, onClose, program, onSaved, onDeleted }) {
  const { meta } = useMeta();
  const toast = useToast();
  const isEdit = Boolean(program);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data: competencies } = useApi(() => competenciesApi.list(), [], { enabled: open });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setConfirmDelete(false);
    setValues(
      program
        ? {
            title: program.title,
            description: program.description,
            competencies: program.competencies.map((item) => item._id || item),
            targetRoles: program.targetRoles,
            deliveryMode: program.deliveryMode,
            durationHours: String(program.durationHours),
            level: program.level,
            status: program.status,
            provider: program.provider || '',
          }
        : EMPTY,
    );
  }, [open, program]);

  const competencyOptions = useMemo(
    () => (competencies || []).map((item) => ({ value: item._id, label: item.name, category: item.category })),
    [competencies],
  );
  const roleOptions = useMemo(
    () => (meta?.jobRoles || []).map((role) => ({ value: role.title, label: role.title, department: shortDepartment(role.department) })),
    [meta],
  );

  const set = (field) => (event) => {
    setValues((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    const payload = { ...values, durationHours: Number(values.durationHours) };
    try {
      const saved = isEdit ? await trainingsApi.update(program._id, payload) : await trainingsApi.create(payload);
      toast.success(isEdit ? 'Programme updated' : 'Programme added to catalogue', saved.title);
      onSaved?.(saved);
      onClose();
    } catch (error) {
      setErrors(error.details || {});
      toast.error('Could not save programme', error.details ? 'Check the highlighted fields.' : error.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setSaving(true);
    try {
      await trainingsApi.remove(program._id);
      toast.success('Programme deleted', program.title);
      onDeleted?.();
      onClose();
    } catch (error) {
      toast.error('Could not delete programme', error.message);
      setConfirmDelete(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={isEdit ? 'Edit training programme' : 'Add training programme'}
      description="Programmes link to competencies so they can be recommended for matching skill gaps."
      footer={
        <>
          {isEdit && (
            <Button variant="ghost" icon={Trash2} onClick={remove} className={`mr-auto ${confirmDelete ? 'text-red-700' : ''}`} disabled={saving}>
              {confirmDelete ? 'Click again to delete' : 'Delete'}
            </Button>
          )}
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="training-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add programme'}
          </Button>
        </>
      }
    >
      <form id="training-form" onSubmit={submit} noValidate className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <TextInput label="Programme title" required value={values.title} onChange={set('title')} error={errors.title} data-autofocus />
          <TextArea label="Description" required rows={4} value={values.description} onChange={set('description')} error={errors.description} maxLength={1000} />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectInput label="Delivery method" required value={values.deliveryMode} onChange={set('deliveryMode')} error={errors.deliveryMode} placeholder="Select" options={meta?.deliveryModes || []} />
            <TextInput label="Duration (hours)" required type="number" min={0.5} max={200} step={0.5} value={values.durationHours} onChange={set('durationHours')} error={errors.durationHours} />
            <SelectInput label="Level" required value={values.level} onChange={set('level')} error={errors.level} placeholder="Select" options={meta?.trainingLevels || []} />
            <SelectInput
              label="Status"
              value={values.status}
              onChange={set('status')}
              error={errors.status}
              options={meta?.trainingStatuses || ['Active']}
              hint="Only Active programmes can be assigned."
            />
          </div>
          <TextInput label="Provider" value={values.provider} onChange={set('provider')} error={errors.provider} />
        </div>
        <div className="space-y-4">
          <CheckboxList
            label="Skills / competencies covered"
            required
            options={competencyOptions}
            groupBy="category"
            value={values.competencies}
            onChange={(value) => {
              setValues((current) => ({ ...current, competencies: value }));
              setErrors((current) => ({ ...current, competencies: undefined }));
            }}
            error={errors.competencies}
            height="max-h-52"
          />
          <CheckboxList
            label="Target roles"
            options={roleOptions}
            groupBy="department"
            value={values.targetRoles}
            onChange={(value) => setValues((current) => ({ ...current, targetRoles: value }))}
            error={errors.targetRoles}
            hint="Leave empty if the programme is suitable for all roles."
            height="max-h-52"
          />
        </div>
      </form>
    </Modal>
  );
}
