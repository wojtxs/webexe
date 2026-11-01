/**
 * media-reveal.ts — media odsłaniają się przy wejściu w widok jak kurtyna zjeżdżająca w dół
 * (docs/INSPIRACJE.md: kurtyny na zdjęciach z Alpanetu), a obraz w środku dojeżdża zoomem.
 *
 * [data-reveal] dostaje clip-path od góry do dołu, a jego [data-reveal-zoom] skalę 1.2 → 1.
 * Do czasu startu modułu media ukrywa html.js-motion (utils.css, fallback 3 s w Base.astro).
 * Reduced motion: moduł nic nie robi, media stoją od razu.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Skala obrazu w chwili odsłonięcia
const ZOOM = 1.2;

const MediaReveal: Module = {
  init(root: HTMLElement) {
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
    if (!targets.length) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const duration = durationToken('--d-enter');
        const ease = easeToken('--ease-enter');

        targets.forEach((el) => {
          const zoom = el.querySelector('[data-reveal-zoom]');
          // Bez once: trigger z once, który startuje już za sekcją (odtworzony scroll), usuwa się
          // w trakcie refreshu innych triggerów i GSAP rzuca błędem. Domyślne toggleActions grają raz.
          const tl = gsap.timeline({
            scrollTrigger: { trigger: el, start: 'top 85%' },
          });
          tl.fromTo(
            el,
            { clipPath: 'inset(0% 0% 100% 0%)' },
            { clipPath: 'inset(0% 0% 0% 0%)', duration, ease }
          );
          if (zoom) tl.fromTo(zoom, { scale: ZOOM }, { scale: 1, duration, ease }, 0);
          // Na koniec inline none, a nie clearProps: do 3 s od startu reguła html.js-motion
          // ukryłaby media z powrotem (miganie na podstronach bez loadera). none nie przycina fokusu.
          tl.set(el, { clipPath: 'none' });
        });
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default MediaReveal;
