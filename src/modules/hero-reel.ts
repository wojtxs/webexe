/**
 * hero-reel.ts — pokaz realizacji na ekranie hero (sections/Hero.astro, docs/sections/01-hero.md).
 *
 * Po loaderze ekran wjeżdża kurtyną od dołu z dojazdem skali 1.12 → 1. Potem co HOLD sekund
 * pokazuje następną realizację: kurtyna w kierunku zmiany, zoom kadru, podmiana nazwy i tagów,
 * a odcinek postępu aktywnego projektu wypełnia się w czasie pokazu. Gra tylko żywa warstwa
 * aktywnego kadru (live/registry).
 * Pokaz stoi, gdy kursor jest nad ekranem albo pokazem, fokus jest w pokazie, hero jest poza
 * ekranem, albo użytkownik go zatrzymał (przycisk pauzy zatrzymuje też żywą warstwę, WCAG 2.2.2).
 * Odcinki to przyciski projektów; wybór ręczny włącza ogłaszanie zmian (aria-live).
 * Reduced motion: bez pokazu, kurtyny i żywych warstw; przyciski przełączają od razu, pauzy nie ma.
 */

import { introDone } from '@core/intro';
import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createLive } from './live/registry';
import type { Live } from './live/types';

gsap.registerPlugin(ScrollTrigger);

// Ile sekund stoi jeden projekt
const HOLD = 6;
// Skala kadru w chwili wejścia na ekran
const ZOOM = 1.12;

// TODO(treść): etykiety przycisku pauzy
const LABEL_PAUSE = 'Zatrzymaj pokaz realizacji';
const LABEL_PLAY = 'Wznów pokaz realizacji';

const HeroReel: Module = {
  init(root: HTMLElement) {
    const screen = root.querySelector<HTMLElement>('[data-reel-screen]');
    const shots = Array.from(root.querySelectorAll<HTMLElement>('[data-reel-shot]'));
    const items = Array.from(root.querySelectorAll<HTMLElement>('[data-reel-item]'));
    const segs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-reel-seg]'));
    const fills = segs.map((seg) => seg.querySelector<HTMLElement>('[data-reel-fill]'));
    const count = root.querySelector<HTMLElement>('[data-reel-count]');
    const pause = root.querySelector<HTMLButtonElement>('[data-reel-pause]');
    const live = root.querySelector<HTMLElement>('[data-reel-live]');
    const reel = root.querySelector<HTMLElement>('.hp__reel');
    const card = root.querySelector<HTMLElement>('[data-card-expand="card"]');
    if (!screen || !shots.length || shots.length !== items.length) return;

    let active = 0;

    // Stan widoczny bez ruchu: projekt i, licznik, odcinek
    const mark = (i: number) => {
      shots.forEach((shot, k) => shot.classList.toggle('is-active', k === i));
      items.forEach((item, k) => item.classList.toggle('is-active', k === i));
      segs.forEach((seg, k) => {
        seg.classList.toggle('is-active', k === i);
        if (k === i) seg.setAttribute('aria-current', 'true');
        else seg.removeAttribute('aria-current');
      });
      if (count) count.textContent = String(i + 1).padStart(2, '0');
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const duration = durationToken('--d-enter');
        const ease = easeToken('--ease-enter');
        const cleanups: Array<() => void> = [];
        const on = <K extends keyof HTMLElementEventMap>(
          el: HTMLElement | null,
          type: K,
          fn: (event: HTMLElementEventMap[K]) => void
        ) => {
          if (!el) return;
          el.addEventListener(type, fn);
          cleanups.push(() => el.removeEventListener(type, fn));
        };

        const lives: Array<Live | null> = shots.map((shot) => createLive(shot));
        const playLive = (i: number, play: boolean) =>
          lives[i]?.animations.forEach((a) => (play ? a.resume() : a.pause()));

        // Powody, dla których pokaz stoi; gra, gdy żadnego nie ma
        const holds = new Set<string>(['intro']);
        let timer: gsap.core.Tween | null = null;
        let switching: gsap.core.Timeline | null = null;
        let alive = true;

        const running = () => holds.size === 0;
        const liveOn = () => !holds.has('user') && !holds.has('away') && !holds.has('intro');

        const startTimer = () => {
          timer?.kill();
          fills.forEach((fill) => fill && gsap.set(fill, { scaleX: 0 }));
          const fill = fills[active];
          if (!fill) return;
          timer = gsap.fromTo(
            fill,
            { scaleX: 0 },
            { scaleX: 1, duration: HOLD, ease: 'none', onComplete: () => show(active + 1, 1) }
          );
          if (!running()) timer.pause();
        };

        const sync = () => {
          if (running()) timer?.resume();
          else timer?.pause();
          playLive(active, liveOn());
        };

        const hold = (reason: string, on: boolean) => {
          if (on) holds.add(reason);
          else holds.delete(reason);
          sync();
        };

        const show = (target: number, dir?: 1 | -1) => {
          const i = (target + shots.length) % shots.length;
          if (i === active) return;
          switching?.progress(1);
          const prev = active;
          const forward = dir ? dir > 0 : i > prev;
          active = i;
          mark(i);

          const next = shots[i];
          const old = shots[prev];
          const oldItem = items[prev];
          const nextItem = items[i];
          playLive(i, liveOn());
          old.classList.add('is-leaving');
          oldItem.classList.add('is-leaving');

          const zoom = next.querySelector('[data-reveal-zoom]');
          switching = gsap
            .timeline({
              onComplete: () => {
                old.classList.remove('is-leaving');
                oldItem.classList.remove('is-leaving');
                gsap.set([oldItem, nextItem], { clearProps: 'opacity,transform' });
                playLive(prev, false);
                switching = null;
              },
            })
            // Następny projekt wjeżdża od dołu, poprzedni (wybór wstecz) od góry
            .fromTo(
              next,
              { clipPath: forward ? 'inset(100% 0% 0% 0%)' : 'inset(0% 0% 100% 0%)' },
              { clipPath: 'inset(0% 0% 0% 0%)', duration, ease, clearProps: 'clipPath' },
              0
            )
            .to(oldItem, { yPercent: -40, opacity: 0, duration: duration * 0.5, ease }, 0)
            .fromTo(
              nextItem,
              { yPercent: 40, opacity: 0 },
              { yPercent: 0, opacity: 1, duration, ease },
              duration * 0.15
            );
          if (zoom) {
            switching.fromTo(
              zoom,
              { scale: ZOOM },
              { scale: 1, duration, ease, clearProps: 'scale' },
              0
            );
          }
          startTimer();
        };

        // Wejście po loaderze: kurtyna ekranu i zoom pierwszego kadru, potem pokaz rusza
        const zoom = shots[active].querySelector('[data-reveal-zoom]');
        const intro = gsap.timeline({
          paused: true,
          onComplete: () => {
            // Inline none, a nie clearProps: do 3 s od startu ekran chowa reguła html.js-motion
            screen.style.clipPath = 'none';
            hold('intro', false);
          },
        });
        intro.fromTo(
          screen,
          { clipPath: 'inset(100% 0% 0% 0%)' },
          { clipPath: 'inset(0% 0% 0% 0%)', duration: duration * 1.4, ease }
        );
        if (zoom) {
          intro.fromTo(
            zoom,
            { scale: ZOOM },
            { scale: 1, duration: duration * 1.6, ease, clearProps: 'scale' },
            0
          );
        }
        void introDone.then(() => {
          if (alive) intro.play();
        });
        startTimer();

        // Kursor nad ekranem albo pokazem i fokus w pokazie zatrzymują przełączanie
        [card, reel].forEach((el) => {
          on(el, 'pointerenter', () => hold(`hover-${el === card ? 'card' : 'reel'}`, true));
          on(el, 'pointerleave', () => hold(`hover-${el === card ? 'card' : 'reel'}`, false));
        });
        on(reel, 'focusin', () => hold('focus', true));
        on(reel, 'focusout', (event) => {
          if (!reel?.contains(event.relatedTarget as Node | null)) hold('focus', false);
        });

        // Poza ekranem stoi wszystko
        ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => hold('away', !self.isActive),
        });

        // Wybór projektu: od razu, z ogłoszeniem zmiany
        segs.forEach((seg, i) =>
          on(seg, 'click', () => {
            live?.setAttribute('aria-live', 'polite');
            show(i);
          })
        );

        on(pause, 'click', () => {
          const paused = !holds.has('user');
          pause?.setAttribute('aria-pressed', String(paused));
          pause?.setAttribute('aria-label', paused ? LABEL_PLAY : LABEL_PAUSE);
          live?.setAttribute('aria-live', paused ? 'polite' : 'off');
          hold('user', paused);
        });

        return () => {
          alive = false;
          cleanups.forEach((cleanup) => cleanup());
          switching?.progress(1);
          timer?.kill();
          intro.kill();
          lives.forEach((l) => l?.reset());
          screen.style.clipPath = '';
          gsap.set(fills.filter(Boolean), { clearProps: 'transform' });
          pause?.setAttribute('aria-pressed', 'false');
          pause?.setAttribute('aria-label', LABEL_PAUSE);
          live?.setAttribute('aria-live', 'off');
        };
      });

      ctx.reduced(() => {
        // Bez pokazu: przyciski przełączają od razu, pauza niepotrzebna
        if (pause) pause.hidden = true;
        const handlers = segs.map((seg, i) => {
          const fn = () => {
            active = i;
            mark(i);
          };
          seg.addEventListener('click', fn);
          return () => seg.removeEventListener('click', fn);
        });
        live?.setAttribute('aria-live', 'polite');
        return () => {
          handlers.forEach((off) => off());
          if (pause) pause.hidden = false;
          live?.setAttribute('aria-live', 'off');
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default HeroReel;
