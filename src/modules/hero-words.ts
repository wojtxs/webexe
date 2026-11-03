/**
 * hero-words.ts — hero „Okno ze słowem” (pages/lab/hero.astro, styles/lab/hero-words.css).
 *
 * Wejście po loaderze: okno odsłania się od dołu z dojazdem skali kadru, a litery słowa wjeżdżają
 * spod maski. Słowo stoi w dwóch kopiach ([data-hw-word]: ciemna na Pianie, jasna w karcie);
 * obie animują się razem, więc poza oknem słowo jest ciemne, a w oknie jasne na aplikacji.
 * Co HOLD sekund następna warstwa oferty: litery starego słowa wyjeżdżają w górę, nowe wjeżdżają
 * od dołu, kadr realizacji wchodzi kurtyną, podpis się zmienia. Gra tylko żywa warstwa aktywnego kadru.
 * Pokaz stoi pod kursorem (karta, podpis), przy fokusie, poza ekranem i po pauzie (WCAG 2.2.2).
 * Rozszerzanie okna scrollem i wyjście robi card-expand.
 * Reduced motion: pierwsza warstwa bez pokazu i bez żywej warstwy, pauza ukryta.
 */

import { introDone } from '@core/intro';
import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createLive } from './live/registry';
import type { Live } from './live/types';

gsap.registerPlugin(ScrollTrigger);

// Ile sekund stoi jedna warstwa
const HOLD = 3.2;
// Skala kadru w chwili wejścia
const ZOOM = 1.12;
// Odstęp między literami przy wjeździe i wyjeździe
const STAGGER = 0.022;

// TODO(treść): etykiety przycisku pauzy
const LABEL_PAUSE = 'Zatrzymaj pokaz realizacji';
const LABEL_PLAY = 'Wznów pokaz realizacji';

const HeroWords: Module = {
  init(root: HTMLElement) {
    const screen = root.querySelector<HTMLElement>('[data-hw-screen]');
    const shots = Array.from(root.querySelectorAll<HTMLElement>('[data-hw-shot]'));
    const copies = Array.from(root.querySelectorAll<HTMLElement>('[data-hw-word]'));
    const metas = Array.from(root.querySelectorAll<HTMLElement>('[data-hw-meta]'));
    const count = root.querySelector<HTMLElement>('[data-hw-count]');
    const pause = root.querySelector<HTMLButtonElement>('[data-hw-pause]');
    const card = root.querySelector<HTMLElement>('[data-card-expand="card"]');
    const meta = root.querySelector<HTMLElement>('.hw__meta');
    if (!screen || !shots.length || !copies.length) return;

    // items[k][i]: słowo i w kopii k; chars(i): litery słowa i we wszystkich kopiach
    const items = copies.map((copy) =>
      Array.from(copy.querySelectorAll<HTMLElement>('[data-hw-item]'))
    );
    const wordsOf = (i: number) => items.map((list) => list[i]).filter(Boolean);
    const charsOf = (i: number) =>
      wordsOf(i).map((word) => Array.from(word.querySelectorAll<HTMLElement>('[data-hw-char]')));

    let active = 0;

    const mark = (i: number) => {
      shots.forEach((el, k) => el.classList.toggle('is-active', k === i));
      items.forEach((list) => list.forEach((el, k) => el.classList.toggle('is-active', k === i)));
      metas.forEach((el, k) => el.classList.toggle('is-active', k === i));
      if (count) count.textContent = String(i + 1).padStart(2, '0');
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const duration = durationToken('--d-enter');
        const ease = easeToken('--ease-enter');
        const cleanups: Array<() => void> = [];
        const listen = <K extends keyof HTMLElementEventMap>(
          el: HTMLElement | null,
          type: K,
          fn: (event: HTMLElementEventMap[K]) => void
        ) => {
          if (!el) return;
          el.addEventListener(type, fn);
          cleanups.push(() => el.removeEventListener(type, fn));
        };

        const lives: Array<Live | null> = shots.map((shot) => createLive(shot));
        const playLive = (i: number, on: boolean) =>
          lives[i]?.animations.forEach((a) => (on ? a.resume() : a.pause()));

        const holds = new Set<string>(['intro']);
        let timer: gsap.core.Tween | null = null;
        let switching: gsap.core.Timeline | null = null;
        let alive = true;

        const running = () => holds.size === 0;
        const liveOn = () => !holds.has('user') && !holds.has('away') && !holds.has('intro');

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

        const startTimer = () => {
          timer?.kill();
          timer = gsap.delayedCall(HOLD, () => show(active + 1));
          if (!running()) timer.pause();
        };

        // Litery słowa i (obie kopie) spod maski: in = wjazd od dołu, out = wyjazd w górę
        const lettersIn = (i: number, tl: gsap.core.Timeline, at: number) =>
          charsOf(i).forEach((chars) =>
            tl.fromTo(
              chars,
              { yPercent: 110 },
              { yPercent: 0, duration, ease, stagger: STAGGER },
              at
            )
          );
        const lettersOut = (i: number, tl: gsap.core.Timeline, at: number) =>
          charsOf(i).forEach((chars) =>
            tl.to(
              chars,
              {
                yPercent: -110,
                duration: duration * 0.6,
                ease: 'power2.in',
                stagger: STAGGER * 0.6,
              },
              at
            )
          );

        const show = (target: number) => {
          const i = (target + shots.length) % shots.length;
          if (i === active) return;
          switching?.progress(1);
          const prev = active;
          active = i;
          playLive(prev, false);
          playLive(i, liveOn());

          const leaving = [shots[prev], metas[prev], ...wordsOf(prev)].filter(Boolean);
          leaving.forEach((el) => el.classList.add('is-leaving'));
          mark(i);

          const zoom = shots[i].querySelector('[data-reveal-zoom]');
          const outEnd = duration * 0.6 + STAGGER * 0.6 * 12;
          switching = gsap.timeline({
            onComplete: () => {
              leaving.forEach((el) => el.classList.remove('is-leaving'));
              charsOf(prev).forEach((chars) => gsap.set(chars, { clearProps: 'transform' }));
              switching = null;
            },
          });
          lettersOut(prev, switching, 0);
          lettersIn(i, switching, outEnd * 0.55);
          switching
            .fromTo(
              shots[i],
              { clipPath: 'inset(100% 0% 0% 0%)' },
              { clipPath: 'inset(0% 0% 0% 0%)', duration, ease, clearProps: 'clipPath' },
              outEnd * 0.35
            )
            .to(metas[prev], { yPercent: -100, opacity: 0, duration: duration * 0.5, ease }, 0)
            .fromTo(
              metas[i],
              { yPercent: 100, opacity: 0 },
              { yPercent: 0, opacity: 1, duration, ease, clearProps: 'transform,opacity' },
              outEnd * 0.5
            );
          if (zoom) {
            switching.fromTo(
              zoom,
              { scale: ZOOM },
              { scale: 1, duration: duration * 1.4, ease, clearProps: 'scale' },
              outEnd * 0.35
            );
          }
          switching.add(() => gsap.set(metas[prev], { clearProps: 'transform,opacity' }));
          startTimer();
        };

        // Stan przed wejściem: okno zakryte, litery pod maską
        gsap.set(screen, { clipPath: 'inset(100% 0% 0% 0%)' });
        charsOf(0).forEach((chars) => gsap.set(chars, { yPercent: 110 }));
        const zoom0 = shots[0].querySelector('[data-reveal-zoom]');

        const intro = gsap.timeline({
          paused: true,
          onComplete: () => hold('intro', false),
        });
        lettersIn(0, intro, 0.1);
        intro.to(screen, { clipPath: 'inset(0% 0% 0% 0%)', duration: duration * 1.4, ease }, 0.35);
        if (zoom0) {
          intro.fromTo(
            zoom0,
            { scale: ZOOM },
            { scale: 1, duration: duration * 1.8, ease, clearProps: 'scale' },
            0.35
          );
        }
        void introDone.then(() => {
          if (alive) intro.play();
        });
        startTimer();

        // Kursor nad kartą albo podpisem i fokus w podpisie zatrzymują pokaz
        [card, meta].forEach((el, k) => {
          listen(el, 'pointerenter', () => hold(`hover-${k}`, true));
          listen(el, 'pointerleave', () => hold(`hover-${k}`, false));
        });
        listen(meta, 'focusin', () => hold('focus', true));
        listen(meta, 'focusout', (event) => {
          if (!meta?.contains(event.relatedTarget as Node | null)) hold('focus', false);
        });

        ScrollTrigger.create({
          trigger: root,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => hold('away', !self.isActive),
        });
        // Przy rozszerzaniu okna pokaz stoi: na pełnej scenie zostaje bieżąca realizacja
        ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => {
            const on = self.progress > 0.01;
            if (on !== holds.has('scroll')) hold('scroll', on);
          },
        });

        listen(pause, 'click', () => {
          const paused = !holds.has('user');
          pause?.setAttribute('aria-pressed', String(paused));
          pause?.setAttribute('aria-label', paused ? LABEL_PLAY : LABEL_PAUSE);
          hold('user', paused);
        });

        return () => {
          alive = false;
          cleanups.forEach((fn) => fn());
          switching?.progress(1);
          timer?.kill();
          intro.kill();
          lives.forEach((l) => l?.reset());
          gsap.set(screen, { clearProps: 'clipPath' });
          items
            .flat()
            .forEach((word) =>
              gsap.set(word.querySelectorAll('[data-hw-char]'), { clearProps: 'transform' })
            );
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

    mark(0);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default HeroWords;
