/**
 * product-live.ts — produkt na urządzeniach żyje (docs/INSPIRACJE.md, Prezentacja produktu):
 * laptop i telefon grają wspólną pętlę grafiku (live/grafik.ts), tylko gdy są w widoku,
 * a przy scrollu przesuwają się w różnym tempie (lekka paralaksa, ruch tylko za scrollem).
 * Reduced motion i bez JS: zrzuty w stanie „przed”, bez paralaksy.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { grafikLive, grafikMobileLive } from './live/grafik';

gsap.registerPlugin(ScrollTrigger);

// Przesunięcie przy przejściu urządzeń przez ekran (% własnej wysokości): telefon bliżej, więc szybciej
const PARALLAX = { laptop: 4, phone: 14 };

const ProductLive: Module = {
  init(root: HTMLElement) {
    const desktop = root.querySelector<SVGSVGElement>('[data-live="grafik"]');
    const mobile = root.querySelector<SVGSVGElement>('[data-live="grafik-mobile"]');
    const laptop = root.querySelector('.product__laptop');
    const phone = root.querySelector('.product__phone');

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const animations = [
          ...(desktop ? grafikLive(desktop).animations : []),
          ...(mobile ? grafikMobileLive(mobile).animations : []),
        ];

        ScrollTrigger.create({
          trigger: root,
          start: 'top 80%',
          end: 'bottom top',
          onToggle: (self) => animations.forEach((a) => (self.isActive ? a.resume() : a.pause())),
        });

        const scrub = { trigger: root, start: 'top bottom', end: 'bottom top', scrub: true };
        if (laptop) {
          gsap.fromTo(
            laptop,
            { yPercent: PARALLAX.laptop },
            { yPercent: -PARALLAX.laptop, ease: 'none', scrollTrigger: scrub }
          );
        }
        if (phone) {
          gsap.fromTo(
            phone,
            { yPercent: PARALLAX.phone },
            { yPercent: -PARALLAX.phone, ease: 'none', scrollTrigger: { ...scrub } }
          );
        }
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default ProductLive;
