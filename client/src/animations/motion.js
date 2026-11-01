import gsap from 'gsap';

// Shared GSAP defaults: short, calm, never blocking.
gsap.defaults({ ease: 'power2.out', duration: 0.4 });
// Follow wall-clock time even when frames are sparse (busy or throttled tabs), so an
// entrance animation can never leave content half-visible for longer than its duration.
gsap.ticker.lagSmoothing(0);

/**
 * Animations are skipped (content shown immediately) when the user prefers reduced motion,
 * or when the tab is hidden — background tabs pause animation frames, which would otherwise
 * leave content mid-fade until the tab is visible again.
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return true;
  if (document.visibilityState === 'hidden') return true;
  return Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
}

export { gsap };
