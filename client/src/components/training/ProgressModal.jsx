import { useEffect, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { enrollmentsApi } from '../../services/resources.js';
import { formatDate } from '../../utils/format.js';
import { Button, Modal, ProgressBar, StatusBadge, TextArea, TextInput } from '../ui/index.js';

// Mirrors the server rule so the user sees the resulting status before saving.
function previewStatus(progress, dueDate) {
  if (progress >= 100) return 'Completed';
  const today = new Date();
  const todayUTC = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (dueDate && new Date(dueDate).getTime() < todayUTC) return 'Overdue';
  return progress > 0 ? 'In Progress' : 'Not Started';
}

export function ProgressModal({ enrollment, open, onClose, onSaved }) {
  const toast = useToast();
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState('');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && enrollment) {
      setProgress(enrollment.progress);
      setFeedback(enrollment.feedback || '');
      setScore(enrollment.assessmentScore ?? '');
      setErrors({});
    }
  }, [open, enrollment]);

  if (!enrollment) return null;
  const nextStatus = previewStatus(progress, enrollment.dueDate);

  const submit = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    if (!Number.isInteger(progress) || progress < 0 || progress > 100) nextErrors.progress = 'Enter a whole number from 0 to 100';
    if (score !== '' && (Number(score) < 0 || Number(score) > 100)) nextErrors.assessmentScore = 'Score must be between 0 and 100';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    setSaving(true);
    try {
      const updated = await enrollmentsApi.updateProgress(enrollment._id, {
        progress,
        feedback,
        ...(score !== '' ? { assessmentScore: Number(score) } : {}),
      });
      toast.success(
        updated.status === 'Completed' && enrollment.status !== 'Completed' ? 'Training completed' : 'Progress updated',
        `${updated.program.title} is now ${updated.progress}% · ${updated.status}`,
      );
      onSaved?.(updated);
      onClose();
    } catch (error) {
      setErrors(error.details || {});
      toast.error('Could not update progress', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Update training progress"
      description={`${enrollment.program?.title} · ${enrollment.employee?.name}`}
      footer={
        <>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="progress-form" loading={saving}>
            Save progress
          </Button>
        </>
      }
    >
      <form id="progress-form" onSubmit={submit} className="space-y-5" noValidate>
        <div className="grid grid-cols-2 gap-3 rounded-lg bg-slate-50 p-3 text-sm">
          <div>
            <p className="text-xs text-slate-500">Due date</p>
            <p className="font-medium text-slate-900">{formatDate(enrollment.dueDate)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Current status</p>
            <StatusBadge status={enrollment.status} />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <label htmlFor="progress-range" className="label mb-0">
              Progress
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(event) => setProgress(Math.round(Number(event.target.value)))}
                className="input h-8 w-20 py-1 text-right"
                aria-label="Progress percentage"
                aria-invalid={Boolean(errors.progress)}
              />
              <span className="text-sm text-slate-500">%</span>
            </div>
          </div>
          <input
            id="progress-range"
            data-autofocus
            type="range"
            min={0}
            max={100}
            step={5}
            value={progress}
            onChange={(event) => setProgress(Number(event.target.value))}
            className="w-full accent-brand-600"
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {[0, 25, 50, 75, 100].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setProgress(value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium ring-1 ring-inset transition-colors ${
                  progress === value ? 'bg-brand-600 text-white ring-brand-600' : 'bg-white text-slate-600 ring-slate-300 hover:bg-slate-50'
                }`}
              >
                {value}%
              </button>
            ))}
          </div>
          {errors.progress && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.progress}</p>}
        </div>

        <div className="rounded-lg border border-line p-3">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-slate-600">Status after saving</span>
            <StatusBadge status={nextStatus} />
          </div>
          <ProgressBar value={progress} status={nextStatus} />
          <p className="mt-2 text-xs text-slate-500">
            Status is set automatically: 100% = Completed, past the due date = Overdue, otherwise In Progress / Not Started.
          </p>
        </div>

        {progress === 100 && (
          <TextInput
            label="Assessment score (optional)"
            type="number"
            min={0}
            max={100}
            value={score}
            onChange={(event) => setScore(event.target.value)}
            error={errors.assessmentScore}
            hint="Post-training assessment result, 0–100 (demo field)"
          />
        )}
        <TextArea
          label="Notes / feedback (optional)"
          value={feedback}
          maxLength={500}
          onChange={(event) => setFeedback(event.target.value)}
          error={errors.feedback}
          placeholder="e.g. Applied the module on a live project"
        />
      </form>
    </Modal>
  );
}
