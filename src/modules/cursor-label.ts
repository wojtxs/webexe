/**
 * cursor-label.ts — kursor z etykietą (docs/INSPIRACJE.md, warstwa globalna Chipsy).
 * Nad elementem z [data-cursor] przy kursorze pojawia się pigułka z tekstem atrybutu.
 *
 * Etykieta to dodatek dla precyzyjnego kursora: element aria-hidden w body, bez wpływu na układ.
 * Dotyk, reduced motion i bez JS: brak etykiety, zwykły kursor.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, easeToken } from '@core/motion';
import gsap from 'gsap';

// Odsunięcie etykiety od czubka kursora (px), żeby nie zasłaniała wskazanego miejsca
const OFFSET = 16;

const CursorLabel: Module = {
  init(root: HTMLElement) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const ease = easeToken('--ease-out');
        const label = document.createElement('div');
        label.className = 'cursor-label t-label';
        label.setAttribute('aria-hidden', 'true');
        document.body.append(label);

        const toX = gsap.quickTo(label, 'x', { duration: 0.4, ease });
        const toY = gsap.quickTo(label, 'y', { duration: 0.4, ease });
        let current: Element | null = null;

        const move = (event: PointerEvent) => {
          toX(event.clientX + OFFSET);
          toY(event.clientY + OFFSET);
        };

        const over = (event: PointerEvent) => {
          const target = (event.target as Element).closest('[data-cursor]');
          if (target === current) return;
          current = target;
          if (target) {
            label.textContent = target.getAttribute('data-cursor');
            // Ukryta etykieta staje od razu przy kursorze, zamiast dolatywać z poprzedniego miejsca
            if (!gsap.getProperty(label, 'opacity')) {
              toX(event.clientX + OFFSET, event.clientX + OFFSET);
              toY(event.clientY + OFFSET, event.clientY + OFFSET);
            }
          }
          gsap.to(label, {
            autoAlpha: target ? 1 : 0,
            scale: target ? 1 : 0.6,
            duration: 0.3,
            ease,
            overwrite: 'auto',
          });
        };

        const leave = () => {
          current = null;
          gsap.to(label, { autoAlpha: 0, scale: 0.6, duration: 0.3, ease, overwrite: 'auto' });
        };

        root.addEventListener('pointermove', move);
        root.addEventListener('pointerover', over);
        root.addEventListener('pointerleave', leave);

        return () => {
          root.removeEventListener('pointermove', move);
          root.removeEventListener('pointerover', over);
          root.removeEventListener('pointerleave', leave);
          label.remove();
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default CursorLabel;
