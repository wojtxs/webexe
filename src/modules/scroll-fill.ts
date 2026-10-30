/**
 * scroll-fill.ts — Manifest: akapity wypełniają się scrollem słowo po słowie
 * (docs/sections/02-manifest.md, ruch #1 i #2).
 *
 * Część: [data-scroll-fill="text"] akapit. Każde słowo ma krycie 0.2 → 1, scrub
 * od wejścia akapitu na 75% wysokości ekranu do jego dołu na 45%.
 * Słowo-akcent (.accent, gradient przez background-clip) nie jest dzielone, wypełnia się w całości.
 * Reduced motion: moduł nic nie robi, tekst jest w pełni widoczny.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import { splitWords } from '@core/split';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const EMPTY_OPACITY = 0.2;

const ScrollFill: Module = {
  init(root: HTMLElement) {
    const texts = root.querySelectorAll<HTMLElement>('[data-scroll-fill="text"]');
    if (!texts.length) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const splits = Array.from(texts).map((text) => {
          const split = splitWords(text, { wordsClass: 'scroll-fill__word', ignore: '.accent' });

          gsap.fromTo(
            split.words,
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

          return split;
        });

        return () => splits.forEach((split) => split.revert());
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default ScrollFill;
