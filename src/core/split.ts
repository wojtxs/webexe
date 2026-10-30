/**
 * split.ts — dostępny podział tekstu na słowa (SplitText).
 *
 * aria-label od SplitText na <p> czy <h2> nie jest pewny w czytnikach, więc pełny tekst idzie
 * do .sr-only, a dzielona kopia ma aria-hidden (docs/ARCHITECTURE.md, Tekst).
 * revert() przywraca oryginalne węzły w elemencie.
 */

import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(SplitText);

export interface WordsSplit {
  /** Słowa (i elementy z `ignore`) w kolejności czytania */
  words: HTMLElement[];
  revert: () => void;
}

export function splitWords(
  el: HTMLElement,
  { wordsClass, mask = false, ignore }: { wordsClass: string; mask?: boolean; ignore?: string }
): WordsSplit {
  const label = document.createElement('span');
  label.className = 'sr-only';
  label.textContent = (el.textContent ?? '').replace(/\s+/g, ' ').trim();

  const visual = document.createElement('span');
  visual.setAttribute('aria-hidden', 'true');
  visual.append(...Array.from(el.childNodes));
  el.append(label, visual);

  const split = SplitText.create(visual, {
    type: 'words',
    wordsClass,
    aria: 'none',
    ...(mask && { mask: 'words' as const }),
    ...(ignore && { ignore }),
  });

  const selector = ignore ? `.${wordsClass}, ${ignore}` : `.${wordsClass}`;
  const words = Array.from(visual.querySelectorAll<HTMLElement>(selector));

  return {
    words,
    revert: () => {
      split.revert();
      el.append(...Array.from(visual.childNodes));
      visual.remove();
      label.remove();
    },
  };
}
