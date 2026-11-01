import { Moon, Sun } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../animations/index.js';
import { useTheme } from '../../context/ThemeContext.jsx';

/** Light/dark switch. The icon shows the current theme and turns in when it changes. */
export function ThemeToggle({ className = '' }) {
  const { theme, toggle } = useTheme();
  const iconRef = useRef(null);
  const dark = theme === 'dark';
  const shown = useRef(dark);

  useLayoutEffect(() => {
    // Animate only real changes, not the first render.
    if (shown.current === dark) return undefined;
    shown.current = dark;
    if (!iconRef.current || prefersReducedMotion()) return undefined;
    const ctx = gsap.context(() => {
      gsap.from(iconRef.current, { rotate: dark ? 60 : -60, scale: 0.6, autoAlpha: 0, duration: 0.35, clearProps: 'all' });
    }, iconRef);
    return () => ctx.revert();
  }, [dark]);

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={dark ? 'Switch to light theme' : 'Switch to dark theme'}
      className={`grid size-9 place-items-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 ${className}`}
    >
      <span ref={iconRef} className="grid place-items-center">
        {dark ? <Moon className="size-[18px]" aria-hidden="true" /> : <Sun className="size-[18px]" aria-hidden="true" />}
      </span>
    </button>
  );
}
