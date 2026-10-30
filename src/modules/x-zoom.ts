/**
 * x-zoom.ts — koniec Manifestu (greybox F3): znak x rysuje się od środka dwiema kreskami,
 * potem zoom przez punkt przecięcia, aż kreski w Głębi zakryją cały ekran.
 *
 * Część: [data-x-zoom="mark"] opakowanie znaku (skalowane), w środku XMark.
 * Progres: ScrollTrigger ze scrub na torze sticky (root), bez pin.
 * Reduced motion: moduł nic nie robi, x stoi narysowany, bez zoomu (CSS).
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

// Grubość kreski XMark w jednostkach viewBox (stroke-width 3 na 24)
const STROKE_RATIO = 3 / 24;
// Zapas, żeby krawędzie kresek wyszły poza ekran
const COVER_MARGIN = 1.2;

const XZoom: Module = {
  init(root: HTMLElement) {
    const mark = root.querySelector<HTMLElement>('[data-x-zoom="mark"]');
    const strokes = mark?.querySelectorAll('path');
    if (!mark || !strokes?.length) return;

    // Skala, przy której przecięcie kresek zakrywa viewport: kreska ≥ max(w, h) / √2
    const coverScale = () => {
      const stroke = mark.clientWidth * STROKE_RATIO;
      const needed = Math.max(window.innerWidth, window.innerHeight) / Math.SQRT2;
      return (needed / stroke) * COVER_MARGIN;
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        // Stan startowy jawnie: from() ze staggerem nie renderuje od razu drugiej kreski
        gsap.set(strokes, { drawSVG: '50% 50%' });

        gsap
          .timeline({
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: 'bottom bottom',
              scrub: true,
              invalidateOnRefresh: true,
            },
          })
          // 0–0.3 dwie kreski od środka, 0.3–0.4 pauza, 0.4–0.95 zoom, 0.95–1 Głębia
          .to(strokes, { drawSVG: '0% 100%', duration: 0.2, stagger: 0.1, ease: 'none' }, 0)
          .to(mark, { scale: coverScale, duration: 0.55, ease: 'power2.in' }, 0.4)
          .to({}, { duration: 0.05 });
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default XZoom;
