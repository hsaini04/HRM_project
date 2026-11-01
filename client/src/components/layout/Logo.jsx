// Generic SkillBridge mark (an arc/bridge with a light point). Not a Lutron brand asset.
export function LogoMark({ className = 'size-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" fill="#256abf" />
      <path d="M7 22c2.5-6 5.5-9 9-9s6.5 3 9 9" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M11 22v-3.5M16 22v-5M21 22v-3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" opacity=".75" />
      <circle cx="16" cy="8.5" r="2.5" fill="#f5b83d" />
    </svg>
  );
}

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <LogoMark />
      <div className="leading-tight">
        <p className="text-[15px] font-semibold tracking-tight text-slate-900">SkillBridge</p>
        <p className="text-[11px] font-medium text-slate-500">Lutron Gurugram · Demo</p>
      </div>
    </div>
  );
}
