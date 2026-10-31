/**
 * chapter-map.ts — mapa rozdziałów w lewym dolnym rogu.
 *
 * Bieżący rozdział (sekcja przecinająca środek ekranu) dostaje aria-current="location",
 * co w CSS zostawia go w zwiniętej mapie i pokazuje etykietę. Postęp przejścia przez sekcję
 * trafia do --progress na linku, a CSS rysuje nim kreski x. Reduced motion: x pełny (bez --progress).
 * Klik przewija Lenisem (z zachowaniem sticky torów); bez Lenisa działa zwykła kotwica.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import { getLenis } from '@core/scroll';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const ChapterMap: Module = {
  init(root: HTMLElement) {
    const links = Array.from(root.querySelectorAll<HTMLAnchorElement>('[data-chapter]'));

    const setCurrent = (id: string) => {
      links.forEach((link) => {
        if (link.dataset.chapter === id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    };

    const ctx = gsap.context(() => {
      links.forEach((link) => {
        const id = link.dataset.chapter;
        const section = id ? document.getElementById(id) : null;
        if (!id || !section) return;

        ScrollTrigger.create({
          trigger: section,
          start: 'top center',
          end: 'bottom center',
          onToggle: (self) => {
            if (self.isActive) setCurrent(id);
          },
        });
      });
    });

    const revertMotion = addMotion((motion) => {
      motion.full(() => {
        const triggers = links.map((link) => {
          const section = document.getElementById(link.dataset.chapter ?? '');
          if (!section) return null;
          return ScrollTrigger.create({
            trigger: section,
            start: 'top center',
            end: 'bottom center',
            onUpdate: (self) => link.style.setProperty('--progress', self.progress.toFixed(3)),
            onRefresh: (self) => link.style.setProperty('--progress', self.progress.toFixed(3)),
          });
        });
        return () => {
          triggers.forEach((trigger) => trigger?.kill());
          links.forEach((link) => link.style.removeProperty('--progress'));
        };
      });
    }, root);

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element).closest<HTMLAnchorElement>('[data-chapter]');
      const lenis = getLenis();
      if (!link || !lenis) return;
      e.preventDefault();
      lenis.scrollTo(`#${link.dataset.chapter}`);
    };
    root.addEventListener('click', onClick);

    this.destroy = () => {
      ctx.revert();
      revertMotion();
      root.removeEventListener('click', onClick);
      links.forEach((link) => link.removeAttribute('aria-current'));
    };
  },

  destroy() {},
};

export default ChapterMap;
