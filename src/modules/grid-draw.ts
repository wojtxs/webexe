/**
 * grid-draw.ts — węzły siatki rysują się przy wejściu sekcji (docs/DESIGN.md, Motywy, pkt 1).
 *
 * Każda .grid-sys dostaje is-armed (kreski węzłów schowane), a gdy jej sekcja wjeżdża na ekran,
 * is-drawn: CSS rysuje kreski od lewej linii do prawej i puszcza po liniach jednorazowy akcent
 * Laguny od początku sekcji (tempo zmiany kontekstu). Węzeł aktywny (CTA) rysuje się ostatni.
 * Sekcja widoczna od startu czeka na koniec wejścia (introDone), żeby nie rysowała się pod loaderem.
 * Reduced motion i bez JS: węzły pełne, bez akcentu.
 */

import { introDone } from '@core/intro';
import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const GridDraw: Module = {
  init(root: HTMLElement) {
    const grids = Array.from(root.querySelectorAll<HTMLElement>('.grid-sys'));
    if (!grids.length) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        grids.forEach((grid) => {
          grid.classList.add('is-armed');
          ScrollTrigger.create({
            trigger: grid.parentElement ?? grid,
            start: 'top 80%',
            once: true,
            onEnter: () => void introDone.then(() => grid.classList.add('is-drawn')),
          });
        });
        return () => grids.forEach((grid) => grid.classList.remove('is-armed', 'is-drawn'));
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default GridDraw;
