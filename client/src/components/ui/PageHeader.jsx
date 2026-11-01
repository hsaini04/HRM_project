export function PageHeader({ eyebrow, title, description, actions, children }) {
  return (
    <div data-reveal className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-semibold tracking-wide text-brand-700 uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1.5 max-w-3xl text-sm text-slate-600">{description}</p>}
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
