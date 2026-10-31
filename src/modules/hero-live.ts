/**
 * hero-live.ts — karta hero „żyje”: kokpit floty jedzie (live/flota.ts), a etykiety warstw
 * zapalają się po kolei (eksperyment, DEMO).
 * Poza ekranem wszystko stoi (ScrollTrigger na sekcji). Reduced motion: stan z HTML.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { flotaLive } from './live/flota';

gsap.registerPlugin(ScrollTrigger);

// Co ile sekund zapala się kolejna etykieta warstwy
const LAYER_STEP = 2.8;

const HeroLive: Module = {
  init(root: HTMLElement) {
    const svg = root.querySelector<SVGSVGElement>('[data-live="flota"]');
    if (!svg) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>('.hero__layer'));

    const setLayer = (index: number) => {
      layers.forEach((layer, i) => layer.classList.toggle('is-on', i === index));
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const { animations, reset } = flotaLive(svg);

        if (layers.length) {
          const cycle = gsap.timeline({ repeat: -1 });
          layers.forEach((_, i) => cycle.call(() => setLayer(i), undefined, i * LAYER_STEP));
          cycle.to({}, { duration: LAYER_STEP }, (layers.length - 1) * LAYER_STEP);
          animations.push(cycle);
        }

        ScrollTrigger.create({
          trigger: root.closest('section') ?? root,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => animations.forEach((a) => (self.isActive ? a.resume() : a.pause())),
        });

        return () => {
          reset();
          setLayer(-1);
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default HeroLive;
