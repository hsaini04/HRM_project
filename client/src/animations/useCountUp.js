import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from './motion.js';

const formatNumber = (value, decimals) =>
  value.toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

/** Animates a number from its previous value to the new one (e.g. KPI refresh after an update). */
export function useCountUp(ref, value, { decimals = 0, suffix = '' } = {}) {
  const previous = useRef(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const render = (number) => {
      element.textContent = `${formatNumber(number, decimals)}${suffix}`;
    };

    if (typeof value !== 'number' || Number.isNaN(value)) {
      element.textContent = '—';
      return undefined;
    }
    if (prefersReducedMotion()) {
      render(value);
      previous.current = value;
      return undefined;
    }

    const state = { current: previous.current };
    const ctx = gsap.context(() => {
      gsap.to(state, {
        current: value,
        duration: 0.9,
        ease: 'power3.out',
        onUpdate: () => render(state.current),
        onComplete: () => render(value),
      });
    });
    return () => {
      previous.current = state.current;
      ctx.revert();
      render(value);
    };
  }, [ref, value, decimals, suffix]);
}
