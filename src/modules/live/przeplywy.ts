/**
 * live/przeplywy.ts — ruch warstwy PrzeplywyLive: pakiety płyną po połączeniach w stronę ERP.
 * Jedna pętla przesuwa wszystkie kropki o całą długość połączenia; pozycja = (t0 + p) mod 1,
 * więc spoczynek (p = 0) to stan z HTML.
 */

import { pointAt, polyline, type Point } from '@core/polyline';
import gsap from 'gsap';
import geom from '../../data/live/przeplywy.json';
import { PACKETS } from './przeplywy-packets';
import type { LiveBuilder } from './types';

// Czas przejścia pakietu przez całe połączenie (s)
const DURATION = 2.8;

export const przeplywyLive: LiveBuilder = (svg, timeScale = 1) => {
  const wires = geom.wires.map((wire) => ({
    line: polyline(wire.points as Point[]),
    dots: Array.from(
      svg.querySelectorAll<SVGCircleElement>(`[data-live-wire="${wire.id}"] circle`)
    ),
  }));
  const state = { p: 0 };

  const draw = () => {
    wires.forEach((wire) =>
      wire.dots.forEach((dot, i) => {
        const [x, y] = pointAt(wire.line, ((PACKETS[i]?.t0 ?? 0) + state.p) % 1);
        dot.setAttribute('cx', String(x));
        dot.setAttribute('cy', String(y));
      })
    );
  };

  const tween = gsap.to(state, {
    p: 1,
    duration: DURATION,
    ease: 'none',
    repeat: -1,
    paused: true,
    onUpdate: draw,
  });
  tween.timeScale(timeScale);

  return {
    animations: [tween],
    reset: () => {
      state.p = 0;
      draw();
    },
  };
};
