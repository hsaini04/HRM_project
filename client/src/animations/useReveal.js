import { useLayoutEffect } from 'react';
import { gsap, prefersReducedMotion } from './motion.js';

/**
 * Staggered entrance for elements marked with `data-reveal` inside `scopeRef`.
 * Pass `ready` so the reveal runs once real content (not the skeleton) is on screen.
 * The animation is scoped with gsap.context() and reverted on cleanup, and inline
 * styles are cleared on completion so transforms never affect layout or stacking.
 */
export function useReveal(scopeRef, { ready = true, selector = '[data-reveal]', y = 14, stagger = 0.05, delay = 0 } = {}) {
  useLayoutEffect(() => {
    const scope = scopeRef.current;
    if (!ready || !scope || prefersReducedMotion()) return undefined;
    const targets = scope.querySelectorAll(selector);
    if (!targets.length) return undefined;

    const ctx = gsap.context(() => {
      gsap.from(targets, {
        autoAlpha: 0,
        y,
        duration: 0.45,
        stagger,
        delay,
        clearProps: 'opacity,visibility,transform',
      });
    }, scope);
    return () => ctx.revert();
  }, [ready, scopeRef, selector, y, stagger, delay]);
}
