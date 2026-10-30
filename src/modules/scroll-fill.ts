/**
 * scroll-fill.ts — Manifest: akapity wypełniają się scrollem słowo po słowie
 * (docs/sections/02-manifest.md, ruch #1 i #2).
 *
 * Część: [data-scroll-fill="text"] akapit. Każde słowo ma krycie 0.2 → 1, scrub
 * od wejścia akapitu na 75% wysokości ekranu do jego dołu na 45%.
 * Dostępność: aria-label od SplitText na <p> nie jest pewny w czytnikach, więc pełny tekst
 * idzie do .sr-only, a dzielona kopia ma aria-hidden (docs/ARCHITECTURE.md, Tekst).
 * Słowo-akcent (.accent, gradient przez background-clip) nie jest dzielone, wypełnia się w całości.
 * Reduced motion: moduł nic nie robi, tekst jest w pełni widoczny.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, SplitText);

const WORD_CLASS = 'scroll-fill__word';
const ACCENT = '.accent';
const EMPTY_OPACITY = 0.2;

const ScrollFill: Module = {
  init(root: HTMLElement) {
    const texts = root.querySelectorAll<HTMLElement>('[data-scroll-fill="text"]');
    if (!texts.length) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const cleanups = Array.from(texts).map((text) => {
          // Pełny tekst dla czytników, dzielona kopia tylko dla oka
          const label = document.createElement('span');
          label.className = 'sr-only';
          label.textContent = (text.textContent ?? '').replace(/\s+/g, ' ').trim();

          const visual = document.createElement('span');
          visual.setAttribute('aria-hidden', 'true');
          visual.append(...Array.from(text.childNodes));
          text.append(label, visual);

          const split = SplitText.create(visual, {
            type: 'words',
            wordsClass: WORD_CLASS,
            aria: 'none',
            ignore: ACCENT,
          });

          // Słowa i akcent w kolejności czytania
          const words = visual.querySelectorAll<HTMLElement>(`.${WORD_CLASS}, ${ACCENT}`);

          gsap.fromTo(
            words,
            { opacity: EMPTY_OPACITY },
            {
              opacity: 1,
              duration: 1,
              stagger: 0.6,
              ease: 'none',
              scrollTrigger: {
                trigger: text,
                start: 'top 75%',
                end: 'bottom 45%',
                scrub: true,
              },
            }
          );

          return () => {
            split.revert();
            text.append(...Array.from(visual.childNodes));
            visual.remove();
            label.remove();
          };
        });

        return () => cleanups.forEach((cleanup) => cleanup());
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default ScrollFill;
