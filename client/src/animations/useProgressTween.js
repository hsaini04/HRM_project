import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from './motion.js';

/**
 * Tweens a progress bar's width to `value` (0–100). When the value changes after the
 * first render, a short brightness pulse confirms the update.
 */
export function useProgressTween(barRef, value) {
  const isFirst = useRef(true);

  useLayoutEffect(() => {
    const bar = barRef.current;
    if (!bar) return undefined;
    const width = `${Math.max(0, Math.min(100, value))}%`;

    if (prefersReducedMotion()) {
      bar.style.width = width;
      return undefined;
    }

    const first = isFirst.current;
    isFirst.current = false;
    const tweens = [gsap.to(bar, { width, duration: first ? 0.8 : 0.6, ease: 'power3.out' })];
    if (!first) {
      tweens.push(gsap.fromTo(bar, { filter: 'brightness(1.3) saturate(1.2)' }, { filter: 'none', duration: 1 }));
    }
    // Kill (not revert) so the bar keeps its current width when the value changes again.
    return () => {
      tweens.forEach((tween) => tween.kill());
      bar.style.width = width;
    };
  }, [barRef, value]);
}
