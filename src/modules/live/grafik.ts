/**
 * live/grafik.ts — ruch warstw GrafikLive i GrafikMobileLive. Obie pętle mają tę samą długość,
 * więc puszczone razem zostają w takt: kierownik wstawia zmianę na laptopie, a chwilę później
 * na telefonie pracownika wpada powiadomienie. Spoczynek (czas 0) = stan „przed” z HTML.
 */

import gsap from 'gsap';
import geom from '../../data/live/grafik.json';
import type { LiveBuilder } from './types';

// Długość pętli (s), wspólna dla laptopa i telefonu
const CYCLE = 7;
// Kliknięcie w lukę i wpadnięcie powiadomienia na telefonie (s od startu pętli)
const CLICK = 1.35;
const NOTIFY = 2.3;
// Skąd wjeżdża kursor (współrzędne zrzutu)
const CURSOR_FROM = { x: 1180, y: 700 };

export const grafikLive: LiveBuilder = (svg, timeScale = 1) => {
  const sprite = (key: string) => svg.querySelector(`[data-live-sprite="${key}"]`);
  const cursor = svg.querySelector('[data-live-cursor]');
  const ripple = svg.querySelector('[data-live-ripple]');
  const ring = svg.querySelector('[data-live-ring]');
  const target = { x: geom.fill.x + geom.fill.w / 2, y: geom.fill.y + geom.fill.h / 2 };
  const changes = [sprite('fill'), sprite('badge'), sprite('row')];

  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.set(cursor, { x: CURSOR_FROM.x, y: CURSOR_FROM.y }, 0)
    .set(ripple, { attr: { cx: target.x, cy: target.y } }, 0)
    .to(cursor, { autoAlpha: 1, duration: 0.3 }, 0)
    .to(cursor, { x: target.x, y: target.y, duration: 1.1, ease: 'power2.inOut' }, 0.2)
    .to(cursor, { scale: 0.85, duration: 0.12, yoyo: true, repeat: 1 }, CLICK)
    .fromTo(
      ripple,
      { attr: { r: 4 }, autoAlpha: 0.7 },
      { attr: { r: 30 }, autoAlpha: 0, duration: 0.6, ease: 'power1.out', immediateRender: false },
      CLICK
    )
    .fromTo(
      sprite('fill'),
      { autoAlpha: 0, scale: 0.85, transformOrigin: '50% 50%' },
      { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'back.out(1.6)', immediateRender: false },
      CLICK + 0.1
    )
    .fromTo(
      ring,
      { autoAlpha: 1 },
      { autoAlpha: 0, duration: 1.4, ease: 'power1.in', immediateRender: false },
      CLICK + 0.2
    )
    .to(
      cursor,
      { x: '+=70', y: '+=46', autoAlpha: 0, duration: 0.6, ease: 'power1.in' },
      CLICK + 0.55
    )
    .to(
      [sprite('badge'), sprite('row')],
      { autoAlpha: 1, duration: 0.4, stagger: 0.15 },
      CLICK + 0.65
    )
    .to(changes, { autoAlpha: 0, duration: 0.5 }, CYCLE - 1.2)
    .to({}, { duration: 0.7 });
  tl.timeScale(timeScale);

  return { animations: [tl], reset: () => {} };
};

export const grafikMobileLive: LiveBuilder = (svg, timeScale = 1) => {
  const notif = svg.querySelector('[data-live-sprite="notif"]');

  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.fromTo(
    notif,
    { autoAlpha: 0, y: -90 },
    { autoAlpha: 1, y: 0, duration: 0.6, ease: 'back.out(1.3)', immediateRender: false },
    NOTIFY
  )
    .to(notif, { autoAlpha: 0, y: -90, duration: 0.5, ease: 'power2.in' }, CYCLE - 1.7)
    .to({}, { duration: CYCLE - tl.duration() });
  tl.timeScale(timeScale);

  return { animations: [tl], reset: () => {} };
};
