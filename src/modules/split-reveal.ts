/**
 * split-reveal.ts — reveal słów w nagłówkach (docs/INSPIRACJE.md, Ruch i interakcje).
 *
 * Każdy [data-split="words"] w root dzieli się na słowa w maskach; słowo wjeżdża spod maski
 * raz, przy wejściu nagłówka na 85% wysokości ekranu. [data-split-delay] w sekundach.
 * [data-split-intro] (H1 hero) gra bez ScrollTriggera, po wejściu strony (core/intro.ts, loader).
 * Czas i krzywa z tokenów: --d-slow, --ease-default.
 * Do czasu podziału nagłówek ukrywa klasa html.js-motion (Base.astro, fallback 3 s).
 * Reduced motion: moduł nic nie robi, tekst stoi od razu.
 */

import { introDone } from '@core/intro';
import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import { splitWords } from '@core/split';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const WORD_STAGGER = 0.04;

const SplitReveal: Module = {
  init(root: HTMLElement) {
    const targets = root.querySelectorAll<HTMLElement>('[data-split="words"]');
    if (!targets.length) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const duration = durationToken('--d-slow');
        const ease = easeToken('--ease-default');

        let alive = true;

        const splits = Array.from(targets).map((el) => {
          const split = splitWords(el, { wordsClass: 'split-word', mask: true });
          const intro = el.hasAttribute('data-split-intro');
          gsap.set(el, { opacity: 1 });

          const tween = gsap.from(split.words, {
            yPercent: 110,
            duration,
            ease,
            stagger: WORD_STAGGER,
            delay: parseFloat(el.dataset.splitDelay ?? '0'),
            ...(intro
              ? { paused: true }
              : { scrollTrigger: { trigger: el, start: 'top 85%', once: true } }),
          });
          if (intro) {
            void introDone.then(() => {
              if (alive) tween.play();
            });
          }

          return split;
        });

        return () => {
          alive = false;
          splits.forEach((split) => split.revert());
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default SplitReveal;
