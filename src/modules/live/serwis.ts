/**
 * live/serwis.ts — ruch warstwy SerwisLive: zgłoszenie znika, wpada z góry na swoje miejsce
 * w kolumnie „Nowe”, a ramka w gradiencie błyska i gaśnie. Spoczynek (czas 0) = stan z HTML.
 */

import gsap from 'gsap';
import type { LiveBuilder } from './types';

// Długość całej pętli (s)
const CYCLE = 5;

export const serwisLive: LiveBuilder = (svg, timeScale = 1) => {
  const ticket = svg.querySelector('[data-live-ticket]');
  const ring = svg.querySelector('[data-live-ring]');

  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.to(ticket, { autoAlpha: 0, y: -12, duration: 0.3 }, 0)
    .fromTo(
      ticket,
      { autoAlpha: 0, y: -48 },
      { autoAlpha: 1, y: 0, duration: 0.7, ease: 'back.out(1.4)', immediateRender: false },
      0.8
    )
    .fromTo(
      ring,
      { autoAlpha: 1 },
      { autoAlpha: 0, duration: 1.4, ease: 'power1.in', immediateRender: false },
      1.4
    );

  tl.to({}, { duration: Math.max(CYCLE - tl.duration(), 0.5) });
  tl.timeScale(timeScale);

  return { animations: [tl], reset: () => {} };
};
