/**
 * proof.ts — dowody jak „Achievements” u Chipsy (docs/reference/chipsa-analiza.md, sekcja 4).
 *
 * Logotypy stoją w CSS (sticky), a karta z liczbami wjeżdża na nie zwykłym scrollem.
 * Moduł dokłada tylko scrub: im bliżej karta, tym logotypy są ciemniejsze i lekko mniejsze,
 * więc karta wyraźnie przykrywa siatkę. Liczniki prowadzi odometer.ts (start, gdy karta wjeżdża).
 * Reduced motion i bez JS: logotypy bez zmian, sama karta wjeżdża scrollem.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Stan logotypów pod kartą
const COVERED = { opacity: 0.2, scale: 0.94 };

const Proof: Module = {
  init(root: HTMLElement) {
    const clients = root.querySelector<HTMLElement>('.proof__clients');
    const card = root.querySelector<HTMLElement>('.proof__card');
    if (!clients || !card) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        gsap.to(clients, {
          ...COVERED,
          ease: 'none',
          scrollTrigger: {
            trigger: card,
            start: 'top bottom',
            // Koniec, gdy karta dojeżdża do górnej krawędzi przyklejonych logotypów
            end: () => `top ${parseFloat(getComputedStyle(clients).top)}px`,
            scrub: true,
            invalidateOnRefresh: true,
          },
        });
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default Proof;
