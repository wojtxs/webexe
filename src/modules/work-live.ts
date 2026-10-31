/**
 * work-live.ts — karty realizacji „ożywają” (docs/INSPIRACJE.md, Realizacje: hover obraz → wideo).
 * Zamiast wideo gra żywa warstwa nad zrzutem (components/live/*, eksperyment, DEMO).
 *
 * Precyzyjny kursor: gra tylko karta pod kursorem, po zjechaniu staje w miejscu.
 * Dotyk: gra karta w środkowej części ekranu. Reduced motion i bez JS: zrzut w stanie z HTML.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { fakturyLive } from './live/faktury';
import { flotaLive } from './live/flota';
import { przeplywyLive } from './live/przeplywy';
import { serwisLive } from './live/serwis';
import type { Live, LiveBuilder } from './live/types';

gsap.registerPlugin(ScrollTrigger);

const BUILDERS: Record<string, LiveBuilder> = {
  flota: flotaLive,
  faktury: fakturyLive,
  przeplywy: przeplywyLive,
  serwis: serwisLive,
};

// Flota w hero jedzie w tempie dyspozytorni; w karcie podgląd ma pokazać ruch od razu
const TIME_SCALE: Record<string, number> = { flota: 4 };

const WorkLive: Module = {
  init(root: HTMLElement) {
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-live-card]'));
    if (!cards.length) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const lives: Live[] = [];
        const cleanups: Array<() => void> = [];

        cards.forEach((card) => {
          const svg = card.querySelector<SVGSVGElement>('svg[data-live]');
          const kind = svg?.dataset.live ?? '';
          const build = BUILDERS[kind];
          if (!svg || !build) return;

          const live = build(svg, TIME_SCALE[kind] ?? 1);
          lives.push(live);
          const play = () => live.animations.forEach((a) => a.resume());
          const pause = () => live.animations.forEach((a) => a.pause());
          pause();

          if (fine) {
            card.addEventListener('pointerenter', play);
            card.addEventListener('pointerleave', pause);
            cleanups.push(() => {
              card.removeEventListener('pointerenter', play);
              card.removeEventListener('pointerleave', pause);
            });
          } else {
            ScrollTrigger.create({
              trigger: card,
              start: 'top 75%',
              end: 'bottom 25%',
              onToggle: (self) => (self.isActive ? play() : pause()),
            });
          }
        });

        return () => {
          cleanups.forEach((cleanup) => cleanup());
          lives.forEach((live) => live.reset());
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default WorkLive;
