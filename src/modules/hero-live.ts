/**
 * hero-live.ts — karta hero „żyje”: kokpit floty jedzie (live/flota.ts), a etykiety warstw
 * zapalają się po kolei (eksperyment, DEMO). Z każdą etykietą nad mapą wpada powiadomienie
 * tej warstwy, a starsze przesuwają się w górę i najstarsze gaśnie, więc obraz opowiada,
 * co robi każda warstwa. Poza ekranem wszystko stoi (ScrollTrigger na sekcji).
 * Reduced motion: stan z HTML (bez powiadomień).
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import geom from '../data/live/flota.json';
import { flotaLive } from './live/flota';

gsap.registerPlugin(ScrollTrigger);

// Co ile sekund zapala się kolejna etykieta warstwy
const LAYER_STEP = 2.8;
// Ile powiadomień naraz widać w kanale i odstęp między nimi (px zrzutu)
const FEED_SIZE = 3;
const FEED_STEP = geom.toast.h + 8;

const HeroLive: Module = {
  init(root: HTMLElement) {
    const svg = root.querySelector<SVGSVGElement>('[data-live="flota"]');
    if (!svg) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>('.hero__layer'));
    const toasts = Array.from(svg.querySelectorAll<SVGImageElement>('[data-live-toast]'));
    // Miejsce powiadomienia w kanale: 0 = najnowsze na dole
    const slots = new Map<SVGImageElement, number>();

    const setLayer = (index: number) => {
      layers.forEach((layer, i) => layer.classList.toggle('is-on', i === index));
    };

    const pushToast = (index: number) => {
      const toast = toasts[index];
      if (!toast) return;
      slots.forEach((slot, el) => {
        const next = slot + 1;
        const out = next >= FEED_SIZE;
        gsap.to(el, {
          y: -next * FEED_STEP,
          autoAlpha: out ? 0 : 1,
          duration: 0.6,
          ease: 'power3.out',
          overwrite: true,
        });
        if (out) slots.delete(el);
        else slots.set(el, next);
      });
      gsap.fromTo(
        toast,
        { y: 16, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.6, ease: 'power3.out', overwrite: true }
      );
      slots.set(toast, 0);
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const { animations, reset } = flotaLive(svg);

        if (layers.length) {
          const cycle = gsap.timeline({ repeat: -1 });
          layers.forEach((_, i) =>
            cycle.call(
              () => {
                setLayer(i);
                pushToast(i);
              },
              undefined,
              i * LAYER_STEP
            )
          );
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
          // Tweeny kanału powstają w wywołaniach osi, poza kontekstem, więc sprzątamy je ręcznie
          gsap.killTweensOf(toasts);
          gsap.set(toasts, { clearProps: 'all' });
          slots.clear();
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
