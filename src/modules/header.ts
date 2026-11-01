/**
 * header.ts — stany paska systemu (components/Header.astro).
 *
 * is-condensed: strona zjechała ze startu o więcej niż CONDENSE_AT wysokości ekranu. CSS rysuje wtedy
 * powierzchnię paska od lewej i pokazuje bieżący rozdział. Stan działa też przy reduced motion (bez ruchu).
 * Postęp strony (pełny ruch): linia Laguny na dolnej krawędzi paska rośnie ze scrollem, a węzeł x
 * na linii siatki zapala się, gdy linia go minie. Reduced motion: bez linii, węzły przygaszone.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Od jakiego scrolla (część wysokości ekranu) pasek dostaje powierzchnię
const CONDENSE_AT = 0.1;

const Header: Module = {
  init(root: HTMLElement) {
    const bar = root.querySelector<HTMLElement>('[data-header-bar]');
    const track = root.querySelector<HTMLElement>('[data-header-track]');
    const nodes = Array.from(root.querySelectorAll<HTMLElement>('[data-header-node]'));
    if (!bar) return;

    // Przy stronie wczytanej na samym dole onToggle odpala na wyjściu z zakresu, więc stan liczymy ze scrolla
    const sync = (self: ScrollTrigger) =>
      root.classList.toggle('is-condensed', self.scroll() > self.start);

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        start: () => window.innerHeight * CONDENSE_AT,
        end: 'max',
        onToggle: sync,
        onRefresh: sync,
      });
    });

    const revertMotion = addMotion((motion) => {
      motion.full(() => {
        if (!track) return;
        // Położenie węzłów jako część szerokości paska
        let stops: number[] = [];
        const measure = () => {
          const box = bar.getBoundingClientRect();
          stops = nodes.map((node) => {
            const rect = node.getBoundingClientRect();
            // Ukryty węzeł (display: none) ma pusty prostokąt i nigdy się nie zapala
            return rect.width ? (rect.left + rect.width / 2 - box.left) / box.width : Infinity;
          });
        };
        const setScale = gsap.quickSetter(track, 'scaleX');
        const update = (self: ScrollTrigger) => {
          setScale(self.progress);
          nodes.forEach((node, i) => node.classList.toggle('is-on', self.progress >= stops[i]));
        };

        const trigger = ScrollTrigger.create({
          start: 0,
          end: 'max',
          onUpdate: update,
          onRefresh: (self) => {
            measure();
            update(self);
          },
        });

        return () => {
          trigger.kill();
          gsap.set(track, { clearProps: 'transform' });
          nodes.forEach((node) => node.classList.remove('is-on'));
        };
      });
    }, root);

    this.destroy = () => {
      ctx.revert();
      revertMotion();
      root.classList.remove('is-condensed');
    };
  },

  destroy() {},
};

export default Header;
