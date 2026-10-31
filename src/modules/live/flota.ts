/**
 * live/flota.ts — ruch warstwy FlotaLive: pojazdy jadą po trasach, paski postępu rosną razem z nimi,
 * wybrany pojazd pulsuje. Każda trasa to pętla: pojawienie się na starcie → przejazd → zniknięcie
 * u celu. Pętla startuje w punkcie t0 ze zrzutu, więc pierwsza klatka jest identyczna z HTML.
 * Animacje tworzy wywołujący moduł w swoim kontekście (addMotion), więc revert je sprząta.
 */

import { pointAt, polyline, type Point } from '@core/polyline';
import gsap from 'gsap';
import geom from '../../data/live/flota.json';
import type { LiveBuilder } from './types';

// Czas przejazdu całej trasy (s), różny dla każdej, żeby pojazdy nie jechały w takt
const SPANS: Record<string, number> = { wz: 48, po: 62, sk: 70, wa: 40, zs: 55 };
// Pojawienie się i zniknięcie pojazdu na końcach trasy (s)
const FADE = 0.6;

export const flotaLive: LiveBuilder = (svg, timeScale = 1) => {
  const routes = geom.routes.map((route) => {
    const group = svg.querySelector<SVGGElement>(`[data-live-route="${route.id}"]`);
    return {
      ...route,
      line: polyline(route.points as Point[]),
      group,
      trail: group?.querySelector('.live-flota__trail'),
      dots: Array.from(group?.querySelectorAll('circle') ?? []),
      pulse: group?.querySelector('.live-flota__pulse'),
      tip: group?.querySelector('.live-flota__tip'),
      bar: svg.querySelector<SVGRectElement>(`[data-live-bar="${route.id}"]`),
      barWidth: geom.bars.find((bar) => bar.id === route.id)?.w ?? 0,
    };
  });

  const draw = (route: (typeof routes)[number], p: number) => {
    const [x, y] = pointAt(route.line, p);
    route.trail?.setAttribute('stroke-dasharray', `${p} 1`);
    route.dots.forEach((dot) => {
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(y));
    });
    route.tip?.setAttribute('transform', `translate(${x} ${y})`);
    route.bar?.setAttribute('width', String(route.barWidth * p));
  };

  const animations: gsap.core.Animation[] = routes.map((route) => {
    const span = SPANS[route.id] ?? 50;
    const state = { p: 0 };
    const targets = [route.group, route.bar];
    const tl = gsap
      .timeline({ repeat: -1 })
      .fromTo(targets, { autoAlpha: 0 }, { autoAlpha: 1, duration: FADE })
      .to(state, { p: 1, duration: span, ease: 'none', onUpdate: () => draw(route, state.p) })
      .to(targets, { autoAlpha: 0, duration: FADE });
    tl.time(FADE + route.t0 * span);
    tl.timeScale(timeScale);
    return tl;
  });

  routes.forEach((route) => {
    if (!route.pulse) return;
    const r = Number(route.pulse.getAttribute('r'));
    animations.push(
      gsap.fromTo(
        route.pulse,
        { attr: { r }, opacity: 0.7 },
        { attr: { r: r * 3.2 }, opacity: 0, duration: 1.8, ease: 'power1.out', repeat: -1 }
      )
    );
  });

  return { animations, reset: () => routes.forEach((route) => draw(route, route.t0)) };
};
