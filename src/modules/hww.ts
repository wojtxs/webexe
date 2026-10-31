/**
 * hww.ts — podglądy etapów w 05 Jak pracujemy (eksperyment).
 *
 * Każdy podgląd [data-hww-viz] dostaje pętlę zbudowaną z atrybutów (HwwViz.astro):
 *   in → wejście z dołu, draw → rysowanie kreski, type → pisanie linii kodu,
 *   bars → słupki rosną po kolei, press → wciśnięcie przycisku; data-viz-at = start w s.
 * Desktop: gra tylko otwarta kolumna (hover, focus, domyślnie pierwsza) i zaczyna od początku
 * przy każdym otwarciu. Poniżej 992 px gra każdy panel widoczny na ekranie.
 * Reduced motion: brak pętli, widać stan końcowy z HTML.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, easeToken } from '@core/motion';
import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger, DrawSVGPlugin);

// Ile stan końcowy stoi przed kolejnym przebiegiem pętli (s)
const HOLD = 3.5;
// Czas pisania jednego znaku w linii kodu (s)
const CHAR = 0.018;

const build = (viz: HTMLElement): gsap.core.Timeline => {
  const ease = easeToken('--ease-ui');
  const tl = gsap.timeline({ paused: true, repeat: -1 });

  viz.querySelectorAll<HTMLElement | SVGElement>('[data-viz]').forEach((el) => {
    const at = parseFloat(el.dataset.vizAt ?? '0');
    switch (el.dataset.viz) {
      case 'in':
        tl.from(el, { autoAlpha: 0, y: 8, duration: 0.5, ease }, at);
        break;
      case 'draw':
        // Jawnie 0 → 100%: DrawSVG czyta istniejący stroke-dasharray jako widoczny odcinek
        tl.fromTo(el, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.7, ease }, at);
        break;
      case 'type':
        tl.from(
          el,
          {
            clipPath: 'inset(0 100% 0 0)',
            duration: Math.max(el.textContent?.length ?? 0, 1) * CHAR,
            ease: `steps(${Math.max(el.textContent?.length ?? 1, 1)})`,
          },
          at
        );
        break;
      case 'bars':
        tl.from(
          el.children,
          { scaleY: 0, transformOrigin: '50% 100%', duration: 0.4, ease, stagger: 0.015 },
          at
        );
        break;
      case 'press':
        tl.to(el, { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1 }, at);
        break;
    }
  });

  const body = viz.querySelector('.viz__body');
  tl.to(body, { autoAlpha: 0, duration: 0.4 }, `+=${HOLD}`);
  return tl;
};

const Hww: Module = {
  init(root: HTMLElement) {
    const steps = Array.from(root.querySelectorAll<HTMLElement>('[data-hww-step]'));
    const desktop = window.matchMedia('(min-width: 992px)');

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const items = steps.map((step) => {
          const viz = step.querySelector<HTMLElement>('[data-hww-viz]');
          return { step, tl: viz ? build(viz) : null, inView: false, playing: false };
        });
        let active = 0;

        const sync = () => {
          items.forEach((item, i) => {
            const play = item.inView && (!desktop.matches || i === active);
            if (play && !item.playing) item.tl?.restart();
            if (!play && item.playing) item.tl?.pause(0);
            item.playing = play;
          });
        };

        const setActive = (i: number) => {
          if (i === active) return;
          active = i;
          items[i].playing = false;
          sync();
        };

        const focusedIndex = () => steps.findIndex((step) => step.matches(':focus-within'));

        const onEnter = (e: Event) => setActive(steps.indexOf(e.currentTarget as HTMLElement));
        // Po wyjściu z kroku sprawdzamy w następnej klatce, czy kursor nie wszedł w sąsiedni
        const onLeave = () =>
          requestAnimationFrame(() => {
            if (!steps.some((step) => step.matches(':hover')))
              setActive(Math.max(focusedIndex(), 0));
          });
        const onFocus = () => setActive(Math.max(focusedIndex(), 0));

        steps.forEach((step, i) => {
          step.addEventListener('pointerenter', onEnter);
          step.addEventListener('pointerleave', onLeave);
          ScrollTrigger.create({
            trigger: step,
            start: 'top bottom',
            end: 'bottom top',
            onToggle: (self) => {
              items[i].inView = self.isActive;
              sync();
            },
          });
        });
        root.addEventListener('focusin', onFocus);
        desktop.addEventListener('change', sync);

        return () => {
          steps.forEach((step) => {
            step.removeEventListener('pointerenter', onEnter);
            step.removeEventListener('pointerleave', onLeave);
          });
          root.removeEventListener('focusin', onFocus);
          desktop.removeEventListener('change', sync);
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default Hww;
