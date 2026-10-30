/**
 * motion.ts — gsap.matchMedia z kontekstami "full" i "reduced".
 * Animacje rejestruj przez addMotion(), nie przez gsap.matchMedia() bezpośrednio,
 * żeby warunki reduced motion były w jednym miejscu.
 *
 * Każde wywołanie ma własny matchMedia, więc moduł sprząta tylko swoje animacje.
 * Funkcja w full/reduced może zwrócić sprzątanie (klasy, style inline), które
 * wykona się przy revert albo przy zmianie preferencji:
 *   const revert = addMotion((ctx) => {
 *     ctx.full(() => { gsap.to(...) });
 *     ctx.reduced(() => { element.style.opacity = '1'; });
 *   }, root);
 *   // w destroy(): revert();
 */

import gsap from 'gsap';

type MotionFn = () => void | (() => void);

export interface MotionContext {
  /** Animacje dla użytkowników bez prefers-reduced-motion */
  full: (fn: MotionFn) => void;
  /** Uproszczone stany dla prefers-reduced-motion: reduce */
  reduced: (fn: MotionFn) => void;
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
      const cleanups: Array<() => void> = [];
      const run = (active: boolean, fn: MotionFn) => {
        if (!active) return;
        const cleanup = fn();
        if (cleanup) cleanups.push(cleanup);
      };

      register({
        full: (fn) => run(full, fn),
        reduced: (fn) => run(reduced, fn),
      });

      return () => cleanups.forEach((cleanup) => cleanup());
    }
  );

  return () => mm.revert();
}
