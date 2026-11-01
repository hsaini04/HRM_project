import { useLayoutEffect, useState } from 'react';
import { gsap, prefersReducedMotion } from './motion.js';

const PANEL_OFFSET = {
  modal: { y: 14, scale: 0.98 },
  drawer: { xPercent: 100 },
  'drawer-left': { xPercent: -100 },
};

/**
 * Keeps a modal/drawer mounted while it animates out, then unmounts it.
 * Enter and exit tweens run inside gsap.context() and are reverted on cleanup.
 */
export function usePresence(open, { overlayRef, panelRef, variant = 'modal' }) {
  const [rendered, setRendered] = useState(open);
  if (open && !rendered) setRendered(true);

  useLayoutEffect(() => {
    if (!rendered) return undefined;
    const reduced = prefersReducedMotion();
    const offset = PANEL_OFFSET[variant];

    if (open) {
      if (reduced) return undefined;
      const ctx = gsap.context(() => {
        gsap.fromTo(overlayRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 });
        gsap.fromTo(
          panelRef.current,
          { autoAlpha: 0, ...offset },
          { autoAlpha: 1, y: 0, scale: 1, xPercent: 0, duration: 0.32, ease: 'power3.out', clearProps: 'transform' },
        );
      });
      return () => ctx.revert();
    }

    if (reduced) {
      setRendered(false);
      return undefined;
    }
    const ctx = gsap.context(() => {
      gsap.to(overlayRef.current, { autoAlpha: 0, duration: 0.18 });
      gsap.to(panelRef.current, {
        autoAlpha: 0,
        ...offset,
        duration: 0.2,
        ease: 'power2.in',
        onComplete: () => setRendered(false),
      });
    });
    return () => ctx.revert();
  }, [open, rendered, overlayRef, panelRef, variant]);

  return rendered;
}
