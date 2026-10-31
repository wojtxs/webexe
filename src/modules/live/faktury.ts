/**
 * live/faktury.ts — ruch warstwy FakturyLive: ramki gasną, skaner przesuwa się po kartce i zapala
 * każdą ramkę w chwili, gdy ją mija, potem chwila spoczynku. Spoczynek (czas 0) = stan z HTML.
 */

import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import geom from '../../data/live/faktury.json';
import type { LiveBuilder } from './types';

gsap.registerPlugin(DrawSVGPlugin);

// Start skanu po zgaszeniu ramek, przejazd przez kartkę i długość całej pętli (s)
const START = 0.5;
const SCAN = 2.4;
const CYCLE = 6;

export const fakturyLive: LiveBuilder = (svg, timeScale = 1) => {
  const hits = Array.from(svg.querySelectorAll<SVGGElement>('[data-live-hit]'));
  const scan = svg.querySelector<SVGGElement>('[data-live-scan]');
  const { paper } = geom;

  const tl = gsap.timeline({ repeat: -1, paused: true });
  tl.to(hits, { autoAlpha: 0, duration: 0.3 }, 0);

  if (scan) {
    tl.fromTo(
      scan,
      { autoAlpha: 0, y: 0 },
      { autoAlpha: 1, duration: 0.2, immediateRender: false },
      START
    )
      .fromTo(
        scan,
        { y: 0 },
        { y: paper.h + 2, duration: SCAN, ease: 'none', immediateRender: false },
        START
      )
      .to(scan, { autoAlpha: 0, duration: 0.3 }, START + SCAN);
  }

  hits.forEach((hit, i) => {
    const box = geom.hits[i];
    if (!box) return;
    const at = START + ((box.y + box.h / 2 - paper.y) / paper.h) * SCAN;
    tl.to(hit, { autoAlpha: 1, duration: 0.25 }, at).fromTo(
      hit.querySelector('.live-faktury__box'),
      { drawSVG: '0%' },
      { drawSVG: '100%', duration: 0.5, immediateRender: false },
      at
    );
  });

  tl.to({}, { duration: Math.max(CYCLE - tl.duration(), 0.5) });
  tl.timeScale(timeScale);

  return { animations: [tl], reset: () => {} };
};
