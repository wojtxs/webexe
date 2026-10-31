/**
 * loader.ts — wyjście loadera (00) i wejście hero (docs/BRIEF.md, mapa strony).
 *
 * Panel znika, kiedy x jest narysowany (CSS, components/Loader.astro) i gotowe są obrazy
 * z [data-loader-wait] (poster hero), ale najpóźniej tak, żeby zniknął przed 2,5 s od startu
 * nawigacji (docs/ARCHITECTURE.md, Ładowanie). Panel zjeżdża w górę przez clip-path, a spod niego
 * od dołu wchodzą [data-intro] (y + opacity; [data-intro="fade"] tylko opacity, bo karta hero
 * mierzy swoje położenie w card-expand). H1 hero gra split-reveal po finishIntro().
 * Reduced motion: loadera nie ma (CSS), wejście kończy się od razu.
 */

import { finishIntro } from '@core/intro';
import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import { lenisStart, lenisStop } from '@core/scroll';
import gsap from 'gsap';

// Twardy limit od startu nawigacji do zniknięcia panelu (ms)
const LIMIT = 2500;
// Kiedy w wyjściu startuje wejście hero (s): panel jest już w większości w górze
const INTRO_AT = 0.3;
const INTRO_STAGGER = 0.06;

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, Math.max(ms, 0)));

const Loader: Module = {
  init(root: HTMLElement) {
    const html = document.documentElement;
    const mark = root.querySelector('.loader__x');

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        let alive = true;
        const exit = durationToken('--d-default');
        // Kreski: każda --d-default, druga startuje po 0.4 z nich (Loader, components.css)
        const drawn = exit * 1.4 * 1000;

        const ease = easeToken('--ease-default');
        const intro = Array.from(document.querySelectorAll<HTMLElement>('[data-intro]'))
          // Od dołu do góry, w kierunku, w którym odsłania je panel
          .sort((a, b) => b.getBoundingClientRect().top - a.getBoundingClientRect().top);

        // Wstrzymany od razu, żeby był w kontekście (revert go sprząta); [data-intro] chowa pod panelem
        const tl = gsap
          .timeline({ paused: true, onComplete: () => root.classList.add('is-done') })
          .to(mark, { y: -40, autoAlpha: 0, duration: exit * 0.6, ease }, 0)
          .fromTo(
            root,
            { clipPath: 'inset(0% 0% 0% 0%)' },
            { clipPath: 'inset(0% 0% 100% 0%)', duration: exit, ease },
            0
          )
          .call(
            () => {
              lenisStart();
              finishIntro();
            },
            undefined,
            INTRO_AT
          )
          .from(
            intro,
            {
              y: (_: number, el: HTMLElement) => (el.dataset.intro === 'fade' ? 0 : 32),
              autoAlpha: 0,
              duration: durationToken('--d-slow'),
              ease,
              stagger: INTRO_STAGGER,
              clearProps: 'transform,opacity,visibility',
            },
            INTRO_AT
          );

        const leave = () => {
          if (!alive) return;
          // Fallback z Base.astro już zdjął loader: bez wyjścia, od razu stan końcowy
          if (!html.classList.contains('js-motion')) {
            tl.progress(1);
            return;
          }
          root.classList.add('is-leaving');
          tl.play();
        };

        lenisStop();
        const posters = Array.from(
          document.querySelectorAll<HTMLImageElement>('img[data-loader-wait]')
        ).map((img) => img.decode().catch(() => {}));
        const ready = Promise.all([...posters, wait(drawn - performance.now())]);
        void Promise.race([ready, wait(LIMIT - exit * 1000 - performance.now())]).then(leave);

        return () => {
          alive = false;
          root.classList.remove('is-leaving');
          root.classList.add('is-done');
          lenisStart();
          finishIntro();
        };
      });

      ctx.reduced(() => {
        finishIntro();
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default Loader;
