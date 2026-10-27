/**
 * motion.ts — gsap.matchMedia z kontekstami "full" i "reduced".
 * Animacje rejestruj przez addMotion(), nie przez gsap.matchMedia() bezpośrednio,
 * żeby zachować jeden spójny kontekst w całej aplikacji.
 *
 * Użycie:
 *   addMotion((ctx) => {
 *     ctx.full(() => { gsap.to(...) });
 *     ctx.reduced(() => { element.style.opacity = '1'; });
 *   });
 */

import gsap from 'gsap';

const mm = gsap.matchMedia();

export interface MotionContext {
  /** Animacje dla użytkowników bez prefers-reduced-motion */
  full: (fn: () => void) => void;
  /** Uproszczone stany dla prefers-reduced-motion: reduce */
  reduced: (fn: () => void) => void;
}

export function addMotion(register: (ctx: MotionContext) => void): void {
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
}

/** Usuwa wszystkie zarejestrowane animacje matchMedia (np. przy destroy modułu). */
export function revertMotion(): void {
  mm.revert();
}
