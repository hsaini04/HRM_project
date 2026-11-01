export function Card({ className = '', children, ...props }) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon, className = '' }) {
  return (
    <header className={`flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4 ${className}`}>
      <div className="flex min-w-0 flex-1 basis-56 items-start gap-3">
        {Icon && (
          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-600">
            <Icon className="size-4" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
        </div>
      </div>
      {action && <div className="flex max-w-full min-w-0 flex-wrap items-center gap-2">{action}</div>}
    </header>
  );
}
