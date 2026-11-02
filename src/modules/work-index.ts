/**
 * work-index.ts — indeks realizacji z żywym ekranem (components/WorkIndex.astro,
 * docs/sections/03-realizacje.md, widoki A i B).
 *
 * Aktywny jest wiersz, który przecina linię aktywności: środek okna na desktopie, a na mobile
 * miejsce pod przyklejonym ekranem. Kursor nad wierszem, fokus i klik też go aktywują
 * (klik od razu, żeby morf w okładkę leciał z widocznego kadru, curtain.ts). Fokus z klawiatury
 * trzyma swój wiersz do pierwszego przewinięcia kółkiem, dotykiem albo klawiszem.
 * Zmiana aktywnego: tytuł jaśnieje, węzeł x rysuje się w Lagunie (CSS), podpis się podmienia,
 * a nowy kadr wjeżdża na ekran kurtyną w kierunku scrolla, z dojazdem skali 1.12 → 1
 * (--d-enter, --ease-enter). Gra tylko żywa warstwa aktywnego kadru.
 * Filtr (data-filter): wiersze spoza typu znikają, reszta przestawia się przez Flip.
 * Reduced motion: te same stany bez kurtyny, Flipa i żywych warstw.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createLive } from './live/registry';
import type { Live } from './live/types';

gsap.registerPlugin(ScrollTrigger, Flip);

const MOBILE = '(max-width: 991px)';
// Mobile: linia aktywności w tej części wolnego miejsca pod przyklejonym ekranem
const MOBILE_LINE = 0.35;
// Skala kadru w chwili wejścia na ekran
const ZOOM = 1.12;

const WorkIndex: Module = {
  init(root: HTMLElement) {
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-index-row]'));
    const shots = Array.from(root.querySelectorAll<HTMLElement>('[data-index-shot]'));
    const list = root.querySelector<HTMLElement>('[data-index-list]');
    const aside = root.querySelector<HTMLElement>('[data-index-aside]');
    const caption = root.querySelector<HTMLElement>('[data-index-caption]');
    const filters = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-filter]'));
    if (!rows.length || rows.length !== shots.length || !list) return;
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    let active = Math.max(
      0,
      rows.findIndex((row) => row.classList.contains('is-active'))
    );

    const revert = addMotion((ctx) => {
      const setup = (motion: boolean) => {
        const duration = durationToken('--d-enter');
        const ease = easeToken('--ease-enter');
        const cleanups: Array<() => void> = [];
        const on = <K extends keyof HTMLElementEventMap>(
          el: HTMLElement,
          type: K,
          fn: (event: HTMLElementEventMap[K]) => void
        ) => {
          el.addEventListener(type, fn);
          cleanups.push(() => el.removeEventListener(type, fn));
        };

        const lives: Array<Live | null> = shots.map((shot) => (motion ? createLive(shot) : null));
        const playLive = (i: number, play: boolean) =>
          lives[i]?.animations.forEach((a) => (play ? a.resume() : a.pause()));
        playLive(active, true);

        let switching: gsap.core.Timeline | null = null;

        const show = (i: number, instant = false) => {
          if (i === active) return;
          switching?.progress(1);
          const prev = active;
          active = i;
          rows.forEach((row, k) => row.classList.toggle('is-active', k === i));
          if (caption) caption.textContent = rows[i].dataset.summary ?? '';

          const next = shots[i];
          const old = shots[prev];
          old.classList.remove('is-active');
          next.classList.add('is-active');
          playLive(i, true);
          const done = () => {
            old.classList.remove('is-leaving');
            playLive(prev, false);
            switching = null;
          };
          if (!motion || instant) {
            done();
            return;
          }

          // Kurtyna w kierunku scrolla: następny projekt wjeżdża od dołu, poprzedni od góry
          old.classList.add('is-leaving');
          const from = i > prev ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)';
          const zoom = next.querySelector('[data-reveal-zoom]');
          switching = gsap
            .timeline({ onComplete: done })
            .fromTo(
              next,
              { clipPath: from },
              { clipPath: 'inset(0% 0% 0% 0%)', duration, ease, clearProps: 'clipPath' }
            );
          if (zoom) {
            switching.fromTo(
              zoom,
              { scale: ZOOM },
              { scale: 1, duration, ease, clearProps: 'scale' },
              0
            );
          }
        };

        // Linia aktywności (px od góry okna)
        const line = () => {
          if (!window.matchMedia(MOBILE).matches || !aside) return window.innerHeight / 2;
          const covered = aside.offsetHeight;
          return covered + (window.innerHeight - covered) * MOBILE_LINE;
        };
        // Klawiatura: fokus trzyma swój wiersz, dopóki użytkownik sam nie przewinie. Przeglądarka
        // stawia fokus w okolicy środka okna, a na mobile to tuż pod linią aktywności, więc bez
        // tego scroll oddawałby ekran poprzedniemu wierszowi.
        let held = false;
        const triggers = rows.map((row, i) =>
          ScrollTrigger.create({
            trigger: row,
            start: () => `top ${line()}px`,
            end: () => `bottom ${line()}px`,
            onToggle: (self) => {
              if (self.isActive && !held) show(i);
            },
          })
        );
        const release = () => {
          if (!held) return;
          held = false;
          const current = triggers.findIndex((trigger) => trigger.isActive);
          if (current >= 0) show(current);
        };
        rows.forEach((row, i) => {
          if (fine) on(row, 'pointerenter', () => show(i));
          on(row, 'focusin', () => {
            held = true;
            show(i);
          });
        });
        on(list, 'focusout', (event) => {
          if (!list.contains(event.relatedTarget as Node | null)) release();
        });
        const SCROLL_KEYS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '];
        const onKey = (event: KeyboardEvent) => {
          if (SCROLL_KEYS.includes(event.key)) release();
        };
        const intents = ['wheel', 'touchstart', 'pointerdown'] as const;
        intents.forEach((type) => window.addEventListener(type, release, { passive: true }));
        window.addEventListener('keydown', onKey);
        cleanups.push(() => {
          intents.forEach((type) => window.removeEventListener(type, release));
          window.removeEventListener('keydown', onKey);
        });

        // Klik w wiersz: kadr od razu widoczny, zanim curtain.ts nada mu nazwę przejścia
        on(list, 'click', (event) => {
          const row = (event.target as Element).closest<HTMLElement>('[data-index-row]');
          if (row) show(rows.indexOf(row), true);
        });

        // Filtr typów
        const applyFilter = (tag: string) => {
          filters.forEach((button) =>
            button.setAttribute('aria-pressed', String((button.dataset.filter ?? '') === tag))
          );
          const state = Flip.getState(rows);
          rows.forEach((row) => {
            row.hidden = tag !== '' && !(row.dataset.tags ?? '').split('|').includes(tag);
          });
          const after = () => {
            ScrollTrigger.refresh();
            const first = rows.findIndex((row) => !row.hidden);
            if (rows[active].hidden && first >= 0) show(first, !motion);
          };
          if (!motion) {
            after();
            return;
          }
          Flip.from(state, {
            duration: durationToken('--d-ui') * 2,
            ease,
            absolute: true,
            onEnter: (els) =>
              gsap.fromTo(
                els,
                { opacity: 0 },
                { opacity: 1, duration, ease, clearProps: 'opacity' }
              ),
            onLeave: (els) => gsap.to(els, { opacity: 0, duration: durationToken('--d-ui') }),
            onComplete: after,
          });
        };
        filters.forEach((button) =>
          on(button, 'click', () => applyFilter(button.dataset.filter ?? ''))
        );

        return () => {
          cleanups.forEach((cleanup) => cleanup());
          switching?.progress(1);
          lives.forEach((live) => live?.reset());
        };
      };

      ctx.full(() => setup(true));
      ctx.reduced(() => setup(false));
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default WorkIndex;
