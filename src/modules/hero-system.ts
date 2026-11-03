/**
 * hero-system.ts — hero „Schemat systemu” (sections/Hero.astro, styles/sections/hero.css).
 *
 * Moduły [data-hs-seg] mają szerokość --w kolumn siatki: aktywny WIDE, pozostałe NARROW (suma 12).
 * Zmiana hierarchii: wagi płyną do nowego układu w tempie zmiany kontekstu, impuls na szynie jedzie
 * od węzła poprzedniego modułu do węzła nowego, aktywny kadr dojeżdża skalą, gra tylko jego żywa
 * warstwa. Hierarchię zmienia kursor (z krótką zwłoką), fokus, dotknięcie nieaktywnego modułu
 * (pierwsze dotknięcie wybiera, drugie prowadzi do realizacji) i pokaz co HOLD sekund.
 * Pokaz stoi pod kursorem, przy fokusie, poza ekranem i po pauzie (WCAG 2.2.2).
 * Wejście po loaderze: szyna rysuje się od lewej, na każdym węźle rysuje się x, etykieta wchodzi,
 * a moduł spada spod szyny kurtyną z dojazdem skali kadru.
 * Kursor nad aktywnym modułem przesuwa kadr o kilka pikseli przeciwnie do ruchu (głębia).
 * Reduced motion: bez wejścia, pokazu, impulsu, paralaksy i żywych warstw; wybór działa od razu.
 */

import { introDone } from '@core/intro';
import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createLive } from './live/registry';
import type { Live } from './live/types';

gsap.registerPlugin(ScrollTrigger);

// Szerokość modułu w kolumnach siatki: aktywny i pozostałe (4 moduły, 12 kolumn)
const WIDE = 6;
const NARROW = 2;
// Ile sekund stoi jeden moduł w pokazie
const HOLD = 5;
// Zwłoka wyboru pod kursorem (s): przejazd kursorem przez moduły nie przełącza hierarchii
const INTENT = 0.12;
// Skala kadru przy wejściu i przy wyborze
const ZOOM_IN = 1.12;
const ZOOM_PICK = 1.05;
// Zasięg paralaksy kadru pod kursorem (px)
const DRIFT_X = 14;
const DRIFT_Y = 10;

// TODO(treść): etykiety przycisku pauzy
const LABEL_PAUSE = 'Zatrzymaj pokaz realizacji';
const LABEL_PLAY = 'Wznów pokaz realizacji';

const HeroSystem: Module = {
  init(root: HTMLElement) {
    const segs = Array.from(root.querySelectorAll<HTMLElement>('[data-hs-seg]'));
    const panels = segs.map((seg) => seg.querySelector<HTMLAnchorElement>('[data-hs-panel]'));
    const canvases = segs.map((seg) => seg.querySelector<HTMLElement>('[data-hs-canvas]'));
    const nodes = segs.map((seg) => seg.querySelector<SVGSVGElement>('.hs__node'));
    const labels = segs.map((seg) => seg.querySelector<HTMLElement>('[data-hs-label]'));
    const strip = root.querySelector<HTMLElement>('[data-hs-strip]');
    const bus = root.querySelector<HTMLElement>('[data-hs-bus]');
    const pulse = root.querySelector<HTMLElement>('[data-hs-pulse]');
    const pause = root.querySelector<HTMLButtonElement>('[data-hs-pause]');
    if (segs.length < 2 || !strip) return;

    const count = segs.length;
    const vertical = window.matchMedia('(max-width: 991px)');
    const cleanups: Array<() => void> = [];
    const listen = <K extends keyof HTMLElementEventMap>(
      el: HTMLElement | null,
      type: K,
      fn: (event: HTMLElementEventMap[K]) => void,
      opts?: AddEventListenerOptions
    ) => {
      if (!el) return;
      el.addEventListener(type, fn, opts);
      cleanups.push(() => el.removeEventListener(type, fn, opts));
    };

    let active = Math.max(
      0,
      segs.findIndex((seg) => seg.classList.contains('is-active'))
    );
    // Wagi modułów (kolumny); suma zawsze count * NARROW + (WIDE - NARROW)
    const weights: number[] = segs.map((_, k) => (k === active ? WIDE : NARROW));

    const applyWeights = () =>
      segs.forEach((seg, k) => seg.style.setProperty('--w', weights[k].toFixed(4)));

    const mark = (i: number) => {
      segs.forEach((seg, k) => seg.classList.toggle('is-active', k === i));
      nodes.forEach((node, k) => node?.classList.toggle('xmark--active', k === i));
    };

    // Wybór bez ruchu (reduced motion, brak pełnego trybu); pełny tryb podmienia go na animowany
    const pickInstant = (i: number) => {
      active = i;
      weights.forEach((_, k) => (weights[k] = k === i ? WIDE : NARROW));
      applyWeights();
      mark(i);
    };
    let pick: (i: number) => void = pickInstant;
    let hold: (reason: string, on: boolean) => void = () => {};

    // --- Wybór kursorem (z intencją), fokusem i dotknięciem: w obu trybach ruchu ---
    let intent: gsap.core.Tween | null = null;
    let lastPointer = 'mouse';
    listen(strip, 'pointerdown', (event) => (lastPointer = event.pointerType), { passive: true });
    segs.forEach((seg, k) => {
      listen(seg, 'pointerenter', (event) => {
        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        intent?.kill();
        intent = gsap.delayedCall(INTENT, () => pick(k));
      });
      listen(seg, 'pointerleave', () => intent?.kill());
      listen(seg, 'focusin', () => pick(k));
      // Dotyk: pierwsze dotknięcie nieaktywnego modułu wybiera go, drugie prowadzi do realizacji
      listen(panels[k], 'click', (event) => {
        if (k === active || lastPointer === 'mouse') return;
        event.preventDefault();
        pick(k);
      });
    });

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const duration = durationToken('--d-enter');
        const ease = easeToken('--ease-enter');
        const ctxDuration = durationToken('--d-context');
        const ctxEase = easeToken('--ease-context');
        const draw = easeToken('--ease-draw');

        const lives: Array<Live | null> = canvases.map((canvas) =>
          canvas ? createLive(canvas) : null
        );
        const playLive = (i: number, on: boolean) =>
          lives[i]?.animations.forEach((a) => (on ? a.resume() : a.pause()));

        const holds = new Set<string>(['intro']);
        let timer: gsap.core.Tween | null = null;
        let shift: gsap.core.Tween | null = null;
        let alive = true;

        const running = () => holds.size === 0;
        // Żywa warstwa gra pod kursorem i przy fokusie; stoi po pauzie, poza ekranem i do końca wejścia
        const liveOn = () => !holds.has('user') && !holds.has('away') && !holds.has('intro');

        const sync = () => {
          if (running()) timer?.resume();
          else timer?.pause();
          playLive(active, liveOn());
        };

        hold = (reason, on) => {
          if (on) holds.add(reason);
          else holds.delete(reason);
          sync();
        };

        const startTimer = () => {
          timer?.kill();
          timer = gsap.delayedCall(HOLD, () => pick((active + 1) % count));
          if (!running()) timer.pause();
        };

        // Położenie węzła modułu k na szynie (px od jej początku) przy danych wagach:
        // przed modułem stoi sum(wagi) kolumn z rynnami, a każda kolumna z rynną to (W + gap) / total
        const nodeX = (k: number, w: number[]) => {
          const gap = parseFloat(getComputedStyle(strip).columnGap) || 0;
          const total = w.reduce((sum, v) => sum + v, 0);
          const step = (strip.clientWidth + gap) / total;
          return w.slice(0, k).reduce((sum, v) => sum + v, 0) * step;
        };

        // Paralaksa kadru pod kursorem (tylko precyzyjny wskaźnik)
        const fine = window.matchMedia('(pointer: fine)').matches;
        const drift = canvases.map((canvas) =>
          canvas
            ? {
                x: gsap.quickTo(canvas, 'x', { duration: 0.6, ease: 'power3.out' }),
                y: gsap.quickTo(canvas, 'y', { duration: 0.6, ease: 'power3.out' }),
              }
            : null
        );
        const settle = (k: number) => {
          drift[k]?.x(0);
          drift[k]?.y(0);
        };

        pick = (target) => {
          const i = ((target % count) + count) % count;
          if (i === active) return;
          const prev = active;
          active = i;
          mark(i);
          playLive(prev, false);
          playLive(i, liveOn());
          settle(prev);

          const from = weights.slice();
          const to = segs.map((_, k) => (k === i ? WIDE : NARROW));
          const state = { p: 0 };
          const showPulse = !vertical.matches && pulse;
          shift?.kill();
          shift = gsap.to(state, {
            p: 1,
            duration: ctxDuration,
            ease: ctxEase,
            onUpdate: () => {
              to.forEach((v, k) => (weights[k] = from[k] + (v - from[k]) * state.p));
              applyWeights();
              if (showPulse) {
                const a = nodeX(prev, weights);
                const b = nodeX(i, weights);
                // Środek impulsu jedzie od węzła do węzła, impuls gaśnie na obu końcach
                gsap.set(pulse, {
                  x: a + (b - a) * state.p - pulse.offsetWidth / 2,
                  opacity: Math.sin(Math.PI * state.p),
                });
              }
            },
          });

          const canvas = canvases[i];
          if (canvas) {
            gsap.fromTo(
              canvas,
              { scale: ZOOM_PICK },
              { scale: 1, duration: ctxDuration * 1.2, ease, overwrite: 'auto' }
            );
          }
          startTimer();
        };

        // --- Wejście ---
        const intro = gsap.timeline({ paused: true, onComplete: () => hold('intro', false) });
        const busTime = duration * 1.6;
        const start = 0.15;
        intro.fromTo(bus, { scaleX: 0 }, { scaleX: 1, duration: busTime, ease: draw }, start);
        const width = strip.clientWidth || 1;
        segs.forEach((_, k) => {
          const at = vertical.matches
            ? start + (k / count) * busTime
            : start + (nodeX(k, weights) / width) * busTime;
          const paths = nodes[k]?.querySelectorAll('path');
          if (paths?.length) {
            intro.fromTo(
              paths,
              { strokeDashoffset: 1 },
              { strokeDashoffset: 0, duration: duration * 0.6, ease: draw, stagger: 0.12 },
              at
            );
          }
          if (labels[k]) {
            intro.fromTo(
              labels[k],
              { opacity: 0, y: 8 },
              { opacity: 1, y: 0, duration, ease },
              at + 0.08
            );
          }
          if (panels[k]) {
            intro.fromTo(
              panels[k],
              { clipPath: 'inset(0% 0% 100% 0%)' },
              { clipPath: 'inset(0% 0% 0% 0%)', duration: duration * 1.3, ease },
              at + 0.12
            );
          }
          if (canvases[k]) {
            intro.fromTo(
              canvases[k],
              { scale: ZOOM_IN },
              { scale: 1, duration: duration * 1.9, ease },
              at + 0.12
            );
          }
        });
        void introDone.then(() => {
          if (alive) intro.play();
        });
        startTimer();

        // --- Pokaz stoi pod kursorem nad schematem, przy fokusie, poza ekranem, po pauzie ---
        const local: Array<() => void> = [];
        const on = <K extends keyof HTMLElementEventMap>(
          el: HTMLElement | null,
          type: K,
          fn: (event: HTMLElementEventMap[K]) => void
        ) => {
          if (!el) return;
          el.addEventListener(type, fn);
          local.push(() => el.removeEventListener(type, fn));
        };
        on(strip, 'pointerenter', (event) => {
          if (event.pointerType === 'mouse' || event.pointerType === 'pen') hold('hover', true);
        });
        on(strip, 'pointerleave', () => {
          hold('hover', false);
          settle(active);
        });
        on(strip, 'focusin', () => hold('focus', true));
        on(strip, 'focusout', (event) => {
          if (!strip.contains(event.relatedTarget as Node | null)) hold('focus', false);
        });
        if (fine) {
          on(strip, 'pointermove', (event) => {
            const panel = panels[active];
            if (!panel || !panel.contains(event.target as Node)) return;
            const rect = panel.getBoundingClientRect();
            const nx = (event.clientX - rect.left) / rect.width - 0.5;
            const ny = (event.clientY - rect.top) / rect.height - 0.5;
            drift[active]?.x(-nx * DRIFT_X * 2);
            drift[active]?.y(-ny * DRIFT_Y * 2);
          });
        }
        on(pause, 'click', () => {
          const paused = !holds.has('user');
          pause?.setAttribute('aria-pressed', String(paused));
          pause?.setAttribute('aria-label', paused ? LABEL_PLAY : LABEL_PAUSE);
          hold('user', paused);
        });

        ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => hold('away', !self.isActive),
        });

        return () => {
          alive = false;
          local.forEach((fn) => fn());
          intro.kill();
          shift?.kill();
          timer?.kill();
          lives.forEach((live) => live?.reset());
          pick = pickInstant;
          hold = () => {};
          pickInstant(active);
          gsap.set([bus, pulse, ...labels, ...panels, ...canvases].filter(Boolean), {
            clearProps: 'all',
          });
          nodes.forEach((node) => {
            const paths = node?.querySelectorAll('path');
            if (paths?.length) gsap.set(paths, { clearProps: 'strokeDashoffset' });
          });
          pause?.setAttribute('aria-pressed', 'false');
          pause?.setAttribute('aria-label', LABEL_PAUSE);
        };
      });

      ctx.reduced(() => {
        if (pause) pause.hidden = true;
        return () => {
          if (pause) pause.hidden = false;
        };
      });
    }, root);

    applyWeights();

    this.destroy = () => {
      intent?.kill();
      cleanups.forEach((fn) => fn());
      revert();
    };
  },

  destroy() {},
};

export default HeroSystem;
