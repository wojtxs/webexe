/**
 * about.ts — 06 Poznaj nas (docs/INSPIRACJE.md, warstwa sekcji z momentem).
 *
 * [data-about="text"]: akapit dzielony na zdania, które podświetlają się scrollem jak reflektor:
 * bieżące pełne, przeczytane przygaszone, przyszłe ciemne; na końcu zakresu cały akapit jest pełny.
 * Inaczej niż w Manifeście (scroll-fill słowo po słowie), żeby sekcje nie powtarzały ruchu.
 * [data-about="photo"]: zdjęcia startują ze wspólnego stosu (przesunięte do siebie i obrócone)
 * i rozjeżdżają się scrollem na swoje kolumny siatki.
 * Reduced motion i bez JS: tekst pełny, zdjęcia na kolumnach.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Krycie zdań przed i po podświetleniu
const FUTURE = 0.2;
const PAST = 0.45;
// Stos zdjęć: przesunięcie w stronę drugiego zdjęcia (% szerokości), obrót, skala
const STACK = [
  { xPercent: 45, yPercent: 20, rotate: -7, scale: 0.88 },
  { xPercent: -55, yPercent: -10, rotate: 6, scale: 0.88 },
];

const About: Module = {
  init(root: HTMLElement) {
    const text = root.querySelector<HTMLElement>('[data-about="text"]');
    const photos = Array.from(root.querySelectorAll<HTMLElement>('[data-about="photo"]'));

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        let original: string | null = null;

        if (text) {
          original = text.textContent;
          const sentences = (original ?? '')
            .replace(/\s+/g, ' ')
            .trim()
            .split(/(?<=[.!?…])\s+/)
            .map((sentence) => {
              const span = document.createElement('span');
              span.className = 'about__sentence';
              span.textContent = sentence;
              return span;
            });
          text.replaceChildren(
            ...sentences.flatMap((span, i) => (i ? [document.createTextNode(' '), span] : [span]))
          );

          // Od razu, nie w osi: oś ze scrubem nie renderuje się przed startem zakresu
          gsap.set(sentences, { opacity: FUTURE });
          const tl = gsap.timeline({
            scrollTrigger: { trigger: text, start: 'top 75%', end: 'bottom 30%', scrub: true },
          });
          sentences.forEach((sentence, i) => {
            tl.to(sentence, { opacity: 1, duration: 1, ease: 'none' }, i);
            if (i) tl.to(sentences[i - 1], { opacity: PAST, duration: 1, ease: 'none' }, i);
          });
          tl.to(sentences, { opacity: 1, duration: 1, ease: 'none' }, sentences.length);
        }

        // Zakres od pierwszego zdjęcia, nie od sekcji: na mobile zdjęcia leżą pod tekstem
        photos.forEach((photo, i) => {
          gsap.from(photo, {
            ...STACK[i % STACK.length],
            ease: 'none',
            scrollTrigger: { trigger: photos[0], start: 'top bottom', end: 'top 35%', scrub: true },
          });
        });

        return () => {
          if (text && original !== null) text.textContent = original;
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default About;
