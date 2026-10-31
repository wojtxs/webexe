/**
 * work-live.ts — karty realizacji „ożywają” (docs/INSPIRACJE.md, Realizacje: hover obraz → wideo).
 * Zamiast wideo gra żywa warstwa nad zrzutem (components/live/*, eksperyment, DEMO).
 *
 * Precyzyjny kursor: gra tylko karta pod kursorem, po zjechaniu wraca toner i ruch staje.
 * Dotyk: gra karta w środkowej części ekranu. Reduced motion i bez JS: zrzut w stanie z HTML.
 *
 * Wejście w kartę zdejmuje z niej toner Głębi skośnym frontem, a zrzut dojeżdża do skali 1
 * (shader obraz → wideo z chipsa-analiza.md, sekcja 5.3, w CSS: work.css, --front i --front-angle).
 * Kierunek frontu losuje się przy każdym wejściu z pełnego spoczynku.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
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
// Kąty gradientu frontu: od lewej albo od prawej, z lekkim skosem
const ANGLES = ['100deg', '260deg'];

const WorkLive: Module = {
  init(root: HTMLElement) {
    const cards = Array.from(root.querySelectorAll<HTMLElement>('[data-live-card]'));
    if (!cards.length) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        // Front w tempie wejścia treści (jak hover kart u Chipsy)
        const ease = easeToken('--ease-enter');
        const duration = durationToken('--d-enter');
        const lives: Live[] = [];
        const cleanups: Array<() => void> = [];

        cards.forEach((card) => {
          const svg = card.querySelector<SVGSVGElement>('svg[data-live]');
          const kind = svg?.dataset.live ?? '';
          const build = BUILDERS[kind];
          if (!svg || !build) return;

          const live = build(svg, TIME_SCALE[kind] ?? 1);
          lives.push(live);
          live.animations.forEach((a) => a.pause());

          const front = { p: 0 };
          const setFront = () => card.style.setProperty('--front', front.p.toFixed(4));
          card.classList.add('is-front');
          setFront();

          const play = () => {
            if (front.p < 0.01) {
              card.style.setProperty('--front-angle', gsap.utils.random(ANGLES));
            }
            live.animations.forEach((a) => a.resume());
            gsap.to(front, { p: 1, duration, ease, overwrite: true, onUpdate: setFront });
          };
          // Ruch staje dopiero pod pełnym tonerem, żeby nie zamarzał na odsłoniętej części
          const pause = () => {
            gsap.to(front, {
              p: 0,
              duration,
              ease,
              overwrite: true,
              onUpdate: setFront,
              onComplete: () => live.animations.forEach((a) => a.pause()),
            });
          };
          cleanups.push(() => {
            card.classList.remove('is-front');
            card.style.removeProperty('--front');
            card.style.removeProperty('--front-angle');
          });

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
