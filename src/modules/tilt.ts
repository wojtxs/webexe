/**
 * tilt.ts — element przechyla się za kursorem (docs/INSPIRACJE.md, Ruch i interakcje: tilt do ok. 6°).
 *
 * [data-tilt="6"] to maksymalny kąt w stopniach. Moduł ustawia --tilt-x / --tilt-y (deg),
 * a CSS elementu wpina je w transform razem z resztą (np. ściskanie kart).
 * [data-tilt-area="selektor"] liczy położenie kursora względem innego prostokąta
 * (karta hero: widoczne okno, a nie cała przycięta karta).
 * Tylko precyzyjny kursor i pełny ruch; dotyk i reduced motion: brak przechyłu.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, easeToken } from '@core/motion';
import gsap from 'gsap';

// Czas dojścia do kąta za kursorem (s): miękko, ale bez pływania
const FOLLOW = 0.6;

const Tilt: Module = {
  init(root: HTMLElement) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-tilt]'));
    if (!targets.length) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const ease = easeToken('--ease-ui');
        const cleanups = targets.map((el) => {
          const max = parseFloat(el.dataset.tilt ?? '') || 6;
          const areaSelector = el.dataset.tiltArea;
          const area = (areaSelector && document.querySelector(areaSelector)) || el;
          const state = { x: 0, y: 0 };
          const apply = () => {
            el.style.setProperty('--tilt-x', `${state.x.toFixed(3)}deg`);
            el.style.setProperty('--tilt-y', `${state.y.toFixed(3)}deg`);
          };
          const toX = gsap.quickTo(state, 'x', { duration: FOLLOW, ease, onUpdate: apply });
          const toY = gsap.quickTo(state, 'y', { duration: FOLLOW, ease, onUpdate: apply });

          const move = (event: PointerEvent) => {
            const rect = area.getBoundingClientRect();
            const nx = gsap.utils.clamp(-1, 1, ((event.clientX - rect.left) / rect.width) * 2 - 1);
            const ny = gsap.utils.clamp(-1, 1, ((event.clientY - rect.top) / rect.height) * 2 - 1);
            // Kursor w górnej części odchyla górę od patrzącego, w prawej: prawą krawędź
            toX(-ny * max);
            toY(nx * max);
          };
          const leave = () => {
            toX(0);
            toY(0);
          };

          el.addEventListener('pointermove', move);
          el.addEventListener('pointerleave', leave);
          return () => {
            el.removeEventListener('pointermove', move);
            el.removeEventListener('pointerleave', leave);
            el.style.removeProperty('--tilt-x');
            el.style.removeProperty('--tilt-y');
          };
        });

        return () => cleanups.forEach((cleanup) => cleanup());
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default Tilt;
