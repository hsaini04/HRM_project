import { useEffect, useMemo, useState } from 'react';
import { useMeta } from '../../context/MetaContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { useApi } from '../../hooks/useApi.js';
import { employeesApi } from '../../services/resources.js';
import { toDateInput, todayInput } from '../../utils/format.js';
import { Button, Modal, SelectInput, TextInput } from '../ui/index.js';

const EMPTY = {
  employeeCode: '',
  name: '',
  email: '',
  department: '',
  jobTitle: '',
  manager: '',
  joiningDate: '',
  employmentStatus: 'Active',
};

function validate(values) {
  const errors = {};
  if (!/^[A-Z0-9-]{4,20}$/.test(values.employeeCode.trim().toUpperCase())) errors.employeeCode = 'Use 4–20 letters, numbers or hyphens, e.g. DEMO-1030';
  if (values.name.trim().length < 2) errors.name = 'Enter the employee’s (fictional) name';
  if (!/^[a-z0-9._%+-]+@example\.(com|org|net)$/i.test(values.email.trim())) errors.email = 'Use a demo address ending in @example.com (no real personal data)';
  if (!values.department) errors.department = 'Select a department';
  if (!values.jobTitle) errors.jobTitle = 'Select a job role';
  if (!values.joiningDate) errors.joiningDate = 'Joining date is required';
  else if (values.joiningDate > todayInput()) errors.joiningDate = 'Joining date cannot be in the future';
  return errors;
}

export function EmployeeFormModal({ open, onClose, employee, onSaved }) {
  const { meta } = useMeta();
  const toast = useToast();
  const isEdit = Boolean(employee);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const { data: managersPage } = useApi((signal) => employeesApi.list({ limit: 100, sort: 'name' }, { signal }), [], { enabled: open });

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setValues(
      employee
        ? {
            employeeCode: employee.employeeCode,
            name: employee.name,
            email: employee.email,
            department: employee.department,
            jobTitle: employee.jobTitle,
            manager: employee.manager?._id || employee.manager || '',
            joiningDate: toDateInput(employee.joiningDate),
            employmentStatus: employee.employmentStatus,
          }
        : EMPTY,
    );
  }, [open, employee]);

  const roleOptions = useMemo(
    () => (meta?.jobRoles || []).filter((role) => role.department === values.department).map((role) => role.title),
    [meta, values.department],
  );
  const managerOptions = useMemo(
    () =>
      (managersPage?.data || [])
        .filter((person) => person._id !== employee?._id)
        .map((person) => ({ value: person._id, label: `${person.name} — ${person.jobTitle}` })),
    [managersPage, employee],
  );

  const set = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => ({
      ...current,
      [field]: value,
      // A role belongs to one department, so changing department clears an incompatible role.
      ...(field === 'department' ? { jobTitle: '' } : {}),
    }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    const payload = { ...values, employeeCode: values.employeeCode.trim().toUpperCase(), manager: values.manager || null };
    try {
      const saved = isEdit ? await employeesApi.update(employee._id, payload) : await employeesApi.create(payload);
      toast.success(isEdit ? 'Employee updated' : 'Employee added', `${saved.name} · ${saved.jobTitle}`);
      onSaved?.(saved);
      onClose();
    } catch (error) {
      setErrors(error.details || {});
      toast.error(isEdit ? 'Could not update employee' : 'Could not add employee', error.details ? 'Check the highlighted fields.' : error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${employee?.name}` : 'Add employee'}
      description="Fictional demo records only — use an @example.com address."
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="employee-form" loading={saving}>
            {isEdit ? 'Save changes' : 'Add employee'}
          </Button>
        </>
      }
    >
      <form id="employee-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <TextInput label="Employee code" required value={values.employeeCode} onChange={set('employeeCode')} error={errors.employeeCode} placeholder="DEMO-1030" data-autofocus />
        <TextInput label="Full name" required value={values.name} onChange={set('name')} error={errors.name} placeholder="Fictional name" />
        <TextInput
          label="Demo email"
          required
          type="email"
          value={values.email}
          onChange={set('email')}
          error={errors.email}
          placeholder="first.last@example.com"
          className="sm:col-span-2"
        />
        <SelectInput label="Department" required value={values.department} onChange={set('department')} error={errors.department} placeholder="Select department" options={meta?.departments || []} />
        <SelectInput
          label="Job role"
          required
          value={values.jobTitle}
          onChange={set('jobTitle')}
          error={errors.jobTitle}
          placeholder={values.department ? 'Select role' : 'Choose a department first'}
          options={roleOptions}
          disabled={!values.department}
          hint={isEdit && values.jobTitle !== employee?.jobTitle ? 'Changing role reloads the competency requirements for the new role.' : undefined}
        />
        <SelectInput label="Reporting manager" value={values.manager} onChange={set('manager')} error={errors.manager} placeholder="No manager in dataset" options={managerOptions} />
        <TextInput label="Joining date" required type="date" max={todayInput()} value={values.joiningDate} onChange={set('joiningDate')} error={errors.joiningDate} />
        <SelectInput label="Employment status" value={values.employmentStatus} onChange={set('employmentStatus')} error={errors.employmentStatus} options={meta?.employmentStatuses || ['Active']} />
      </form>
    </Modal>
  );
}
