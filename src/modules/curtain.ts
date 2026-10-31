/**
 * curtain.ts — kurtyna przejścia między stronami (components/Curtain.astro).
 *
 * Klik w link do innej strony tej witryny: kurtyna wjeżdża od dołu (clip-path z zaokrągloną górną
 * krawędzią), flaga w sessionStorage, potem nawigacja. Na nowej stronie Base.astro widzi flagę
 * jeszcze przed malowaniem (html.curtain-in, kurtyna zakrywa od pierwszej klatki), a moduł zdejmuje
 * kurtynę w górę z zaokrągloną dolną krawędzią. Strona z loaderem zdejmuje ją od razu, bo zakrywa
 * ją loader. Oba ruchy razem trwają --d-context (podział COVER / REVEAL).
 * Powrót z bfcache (wstecz): kurtyna odjeżdża tak samo.
 * Reduced motion: zwykła nawigacja, flaga i klasa zdejmowane od razu.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import { cssVar } from '@core/css';
import gsap from 'gsap';

// Ten sam klucz czyta skrypt w <head> (Base.astro)
const CURTAIN_KEY = 'wxe-curtain';
// Podział tempa zmiany kontekstu między zakrycie starej strony i odsłonięcie nowej
const COVER = 0.4;
const REVEAL = 0.6;

const flag = {
  set: () => {
    try {
      sessionStorage.setItem(CURTAIN_KEY, '1');
    } catch {
      // Bez sessionStorage nowa strona po prostu nie ma kurtyny
    }
  },
  clear: () => {
    try {
      sessionStorage.removeItem(CURTAIN_KEY);
    } catch {
      // jw.
    }
  },
};

const Curtain: Module = {
  init(root: HTMLElement) {
    const html = document.documentElement;
    const mark = root.querySelector('.curtain__x');

    const finish = () => {
      html.classList.remove('curtain-in');
      root.classList.remove('is-active');
      gsap.set([root, mark], { clearProps: 'all' });
      flag.clear();
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const duration = durationToken('--d-context');
        const ease = easeToken('--ease-context');
        // Promień zaokrąglenia krawędzi kurtyny: token panelu w px (clip-path tweenuje liczby)
        const rem = parseFloat(getComputedStyle(html).fontSize);
        const r = `${parseFloat(cssVar('--r-panel')) * rem}px`;
        const full = 'inset(0% 0% 0% 0% round 0px 0px 0px 0px)';

        const reveal = () => {
          root.classList.add('is-active');
          gsap
            .timeline({ onComplete: finish })
            .to(mark, { y: -40, autoAlpha: 0, duration: duration * REVEAL * 0.5, ease }, 0)
            .fromTo(
              root,
              { clipPath: full },
              {
                clipPath: `inset(0% 0% 100% 0% round 0px 0px ${r} ${r})`,
                duration: duration * REVEAL,
                ease,
              },
              0
            );
        };

        if (html.classList.contains('curtain-in')) {
          if (document.querySelector('.loader')) finish();
          else reveal();
        }

        const onClick = (event: MouseEvent) => {
          if (event.defaultPrevented || event.button !== 0) return;
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
          const link = (event.target as Element).closest<HTMLAnchorElement>('a[href]');
          if (!link || link.hasAttribute('download')) return;
          if (link.target && link.target !== '_self') return;
          const url = new URL(link.href, location.href);
          if (url.origin !== location.origin || url.pathname === location.pathname) return;

          event.preventDefault();
          flag.set();
          root.classList.add('is-active');
          gsap
            .timeline({ onComplete: () => location.assign(url.href) })
            .fromTo(
              root,
              { clipPath: `inset(100% 0% 0% 0% round ${r} ${r} 0px 0px)` },
              { clipPath: full, duration: duration * COVER, ease },
              0
            )
            .fromTo(
              mark,
              { y: 40, autoAlpha: 0 },
              { y: 0, autoAlpha: 1, duration: duration * COVER, ease },
              0
            );
        };

        const onShow = (event: PageTransitionEvent) => {
          if (event.persisted && root.classList.contains('is-active')) reveal();
        };

        document.addEventListener('click', onClick);
        window.addEventListener('pageshow', onShow);

        return () => {
          document.removeEventListener('click', onClick);
          window.removeEventListener('pageshow', onShow);
          finish();
        };
      });

      ctx.reduced(() => {
        finish();
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default Curtain;
