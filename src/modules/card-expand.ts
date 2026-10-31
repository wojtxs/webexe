/**
 * card-expand.ts — karta hero rozszerza się scrollem od okna do pełnego kontenera (greybox F3).
 *
 * Części: [data-card-expand="card"] karta, [data-card-expand="window"] okno startowe
 * (prostokąt z siatki CSS), [data-card-expand="fade"] treść, która gaśnie pod kartą.
 * Progres liczy ScrollTrigger ze scrub na torze sticky (root), bez pin.
 * Karta dostaje --expand (0–1) i transform-origin w środku widocznej części, więc przechył
 * za kursorem (tilt) obraca okno wokół jego środka i gaśnie przy rozszerzaniu (hero.css).
 * Reduced motion: moduł nic nie robi, karta stoi w oknie (CSS).
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EXPANDABLE = 'is-expandable';

const CardExpand: Module = {
  init(root: HTMLElement) {
    const card = root.querySelector<HTMLElement>('[data-card-expand="card"]');
    const win = root.querySelector<HTMLElement>('[data-card-expand="window"]');
    const fade = root.querySelectorAll<HTMLElement>('[data-card-expand="fade"]');
    if (!card || !win) return;

    // Wstawki clip-path w px przy p = 0 (karta wygląda jak okno)
    const start = { t: 0, r: 0, b: 0, l: 0, radius: 0, w: 0, h: 0 };
    const state = { p: 0 };

    const measure = () => {
      // Pomiar bez przechyłu, który zmienia prostokąt karty
      card.style.transform = 'none';
      const c = card.getBoundingClientRect();
      const w = win.getBoundingClientRect();
      start.t = w.top - c.top;
      start.r = c.right - w.right;
      start.b = c.bottom - w.bottom;
      start.l = w.left - c.left;
      start.radius = parseFloat(getComputedStyle(win).borderTopLeftRadius) || 0;
      start.w = c.width;
      start.h = c.height;
      card.style.transform = '';
    };

    const apply = () => {
      const k = 1 - state.p;
      card.style.clipPath = `inset(${start.t * k}px ${start.r * k}px ${start.b * k}px ${start.l * k}px round ${start.radius}px)`;
      const ox = (start.l * k + start.w - start.r * k) / 2;
      const oy = (start.t * k + start.h - start.b * k) / 2;
      card.style.transformOrigin = `${ox}px ${oy}px`;
      card.style.setProperty('--expand', state.p.toFixed(4));
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        root.classList.add(EXPANDABLE);
        measure();
        apply();

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top top',
            end: 'bottom bottom',
            scrub: true,
            invalidateOnRefresh: true,
            onRefresh: () => {
              measure();
              apply();
            },
          },
        });

        // 0–0.7 rozszerzenie, 0–0.35 treść gaśnie, 0.7–1 karta stoi na pełnym kontenerze
        tl.to(state, { p: 1, duration: 0.7, ease: 'none', onUpdate: apply }, 0)
          .to(fade, { autoAlpha: 0, duration: 0.35, ease: 'none' }, 0)
          .to({}, { duration: 0.3 });

        return () => {
          root.classList.remove(EXPANDABLE);
          card.style.clipPath = '';
          card.style.transformOrigin = '';
          card.style.removeProperty('--expand');
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default CardExpand;
