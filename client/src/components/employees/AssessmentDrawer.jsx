import { useEffect, useMemo, useState } from 'react';
import { useToast } from '../../context/ToastContext.jsx';
import { competenciesApi } from '../../services/resources.js';
import { LEVEL_LABELS } from '../../utils/constants.js';
import { Button, CategoryBadge, Drawer } from '../ui/index.js';

const CATEGORIES = ['Core', 'Functional', 'Behavioural'];

/** Record current proficiency (1–4) for each competency in the employee's role framework. */
export function AssessmentDrawer({ open, onClose, employee, items = [], onSaved }) {
  const toast = useToast();
  const [levels, setLevels] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setLevels(Object.fromEntries(items.map((item) => [item.competency._id, item.currentLevel])));
  }, [open, items]);

  const changed = useMemo(
    () => items.filter((item) => levels[item.competency._id] && levels[item.competency._id] !== item.currentLevel),
    [items, levels],
  );

  const save = async () => {
    if (!changed.length) {
      toast.info('No changes to save');
      return;
    }
    setSaving(true);
    try {
      const data = await competenciesApi.assess(
        employee._id,
        changed.map((item) => ({ competencyId: item.competency._id, currentLevel: levels[item.competency._id], notes: item.notes })),
      );
      toast.success('Assessment saved', `${changed.length} rating${changed.length === 1 ? '' : 's'} updated · gaps recalculated`);
      onSaved?.(data);
      onClose();
    } catch (error) {
      toast.error('Could not save assessment', error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={`Assess competencies — ${employee?.name || ''}`}
      description={`Rate current proficiency against the ${employee?.jobTitle} framework (1 Awareness → 4 Advanced).`}
      footer={
        <>
          <span className="mr-auto text-xs text-slate-500">{changed.length} change{changed.length === 1 ? '' : 's'}</span>
          <Button onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save} loading={saving}>
            Save assessment
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {CATEGORIES.map((category) => {
          const group = items.filter((item) => item.competency.category === category);
          if (!group.length) return null;
          return (
            <section key={category}>
              <div className="mb-2 flex items-center gap-2">
                <CategoryBadge category={category} />
                <span className="text-xs text-slate-500">{group.length} competencies</span>
              </div>
              <ul className="divide-y divide-line rounded-lg border border-line">
                {group.map((item) => {
                  const value = levels[item.competency._id];
                  const gap = value ? Math.max(0, item.requiredLevel - value) : null;
                  return (
                    <li key={item.competency._id} className="p-3">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-800">{item.competency.name}</p>
                        <span className="shrink-0 text-xs text-slate-500">
                          Required <span className="font-semibold text-slate-800">L{item.requiredLevel}</span>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="inline-flex rounded-lg bg-slate-100 p-0.5" role="radiogroup" aria-label={`${item.competency.name} current level`}>
                          {[1, 2, 3, 4].map((level) => (
                            <button
                              key={level}
                              type="button"
                              role="radio"
                              aria-checked={value === level}
                              title={LEVEL_LABELS[level]}
                              onClick={() => setLevels((current) => ({ ...current, [item.competency._id]: level }))}
                              className={`h-7 min-w-9 rounded-md px-2 text-xs font-semibold transition-colors ${
                                value === level ? 'bg-raised text-brand-700 shadow-sm ring-1 ring-brand-200 dark:bg-brand-100 dark:ring-brand-500/60' : 'text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                        <span className="text-xs text-slate-500">{value ? LEVEL_LABELS[value] : 'Not assessed'}</span>
                        {gap > 0 && <span className="ml-auto rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-800">Gap {gap}</span>}
                        {gap === 0 && <span className="ml-auto rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">Meets</span>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </Drawer>
  );
}
