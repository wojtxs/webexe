/**
 * chapter-map.ts — bieżący rozdział w pasku systemu (components/Header.astro).
 *
 * Rozdział, którego sekcja przecina środek ekranu, dostaje is-current. CSS stawia go w komórce paska,
 * wcześniejsze wyjeżdżają w górę, a późniejsze czekają pod spodem, więc nazwa przewija się w kierunku
 * scrolla. Postęp przejścia przez sekcję trafia do --progress, a CSS rysuje nim x bieżącego rozdziału.
 * Reduced motion: x pełny (bez --progress), nazwa zmienia się bez ruchu.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ChapterMap: Module = {
  init(root: HTMLElement) {
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-chapter]'));
    const sectionOf = (item: HTMLElement) => document.getElementById(item.dataset.chapter ?? '');

    const setCurrent = (current: HTMLElement) => {
      items.forEach((item) => item.classList.toggle('is-current', item === current));
    };

    const ctx = gsap.context(() => {
      items.forEach((item) => {
        const section = sectionOf(item);
        if (!section) return;

        ScrollTrigger.create({
          trigger: section,
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => {
            if (self.isActive) setCurrent(item);
          },
        });
      });
    });

    const revertMotion = addMotion((motion) => {
      motion.full(() => {
        const triggers = items.map((item) => {
          const section = sectionOf(item);
          if (!section) return null;
          return ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onUpdate: (self) => item.style.setProperty('--progress', self.progress.toFixed(3)),
            onRefresh: (self) => item.style.setProperty('--progress', self.progress.toFixed(3)),
          });
        });
        return () => {
          triggers.forEach((trigger) => trigger?.kill());
          items.forEach((item) => item.style.removeProperty('--progress'));
        };
      });
    }, root);

    this.destroy = () => {
      ctx.revert();
      revertMotion();
      items.forEach((item) => item.classList.remove('is-current'));
    };
  },

  destroy() {},
};

export default ChapterMap;
