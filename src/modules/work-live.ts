/**
 * work-live.ts — karty realizacji „ożywają” (docs/INSPIRACJE.md, Realizacje: hover obraz → wideo).
 * Zamiast wideo gra żywa warstwa nad zrzutem (components/live/*, eksperyment, DEMO).
 *
 * Precyzyjny kursor: gra tylko karta pod kursorem (cały [data-live-host], a bez hosta sam kadr),
 * po zjechaniu wraca toner i ruch staje. Fokus z klawiatury w [data-live-host] (karta z linkiem
 * w tytule) gra jej kadr tak samo. Dotyk: gra karta, która przecina środek ekranu.
 * Reduced motion i bez JS: zrzut w stanie z HTML.
 * [data-live-card="view"] (okładka projektu): gra w widoku jak wideo, bez tonera i kursora.
 *
 * Wejście w kartę zdejmuje z niej toner Głębi skośnym frontem, a zrzut dojeżdża do skali 1
 * (shader obraz → wideo z chipsa-analiza.md, sekcja 5.3, w CSS: work.css, --front i --front-angle).
 * Kierunek frontu losuje się przy każdym wejściu z pełnego spoczynku.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createLive } from './live/registry';
import type { Live } from './live/types';

gsap.registerPlugin(ScrollTrigger);

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
          const live = createLive(card);
          if (!live) return;
          lives.push(live);

          if (card.dataset.liveCard === 'view') {
            ScrollTrigger.create({
              trigger: card,
              start: 'top bottom',
              end: 'bottom top',
              onToggle: (self) =>
                live.animations.forEach((a) => (self.isActive ? a.resume() : a.pause())),
            });
            return;
          }

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

          // Fokus gra kadr na każdym urządzeniu; wyjście fokusu poza host zatrzymuje go
          const host = card.closest<HTMLElement>('[data-live-host]');
          const onFocusOut = (event: FocusEvent) => {
            if (!host?.contains(event.relatedTarget as Node | null)) pause();
          };
          if (host) {
            host.addEventListener('focusin', play);
            host.addEventListener('focusout', onFocusOut);
            cleanups.push(() => {
              host.removeEventListener('focusin', play);
              host.removeEventListener('focusout', onFocusOut);
            });
          }

          if (fine) {
            // Kursor nad całą kartą (tagi, tytuł, opis), nie tylko nad kadrem
            const area = host ?? card;
            area.addEventListener('pointerenter', play);
            area.addEventListener('pointerleave', pause);
            cleanups.push(() => {
              area.removeEventListener('pointerenter', play);
              area.removeEventListener('pointerleave', pause);
            });
          } else {
            // Gra karta, która przecina środek ekranu: zawsze najwyżej jedna w kolumnie
            ScrollTrigger.create({
              trigger: card,
              start: 'top center',
              end: 'bottom center',
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
