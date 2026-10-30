/**
 * motion.ts — gsap.matchMedia z kontekstami "full" i "reduced".
 * Animacje rejestruj przez addMotion(), nie przez gsap.matchMedia() bezpośrednio,
 * żeby warunki reduced motion były w jednym miejscu.
 *
 * Każde wywołanie ma własny matchMedia, więc moduł sprząta tylko swoje animacje:
 *   const revert = addMotion((ctx) => {
 *     ctx.full(() => { gsap.to(...) });
 *     ctx.reduced(() => { element.style.opacity = '1'; });
 *   }, root);
 *   // w destroy(): revert();
 */

import gsap from 'gsap';

export interface MotionContext {
  /** Animacje dla użytkowników bez prefers-reduced-motion */
  full: (fn: () => void) => void;
  /** Uproszczone stany dla prefers-reduced-motion: reduce */
  reduced: (fn: () => void) => void;
}

export function addMotion(register: (ctx: MotionContext) => void, scope?: Element): () => void {
  const mm = gsap.matchMedia(scope);

  mm.add(
    {
      full: '(prefers-reduced-motion: no-preference)',
      reduced: '(prefers-reduced-motion: reduce)',
    },
    (context) => {
      const { full, reduced } = context.conditions as { full: boolean; reduced: boolean };

      register({
        full: (fn) => {
          if (full) fn();
        },
        reduced: (fn) => {
          if (reduced) fn();
        },
      });
    }
  );

  return () => mm.revert();
}
