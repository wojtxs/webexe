/**
 * hero-live.ts — karta hero „żyje”: pojazdy jadą po trasach na mapie, paski postępu
 * rosną razem z nimi, a etykiety warstw zapalają się po kolei (eksperyment, DEMO).
 *
 * Każda trasa to pętla: pojawienie się na starcie → przejazd → zniknięcie u celu.
 * Pętla startuje w punkcie t0 ze zrzutu, więc pierwsza klatka jest identyczna z HTML.
 * Poza ekranem wszystko stoi (ScrollTrigger na sekcji). Reduced motion: stan z HTML.
 */

import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import { pointAt, polyline, type Point } from '@core/polyline';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import geom from '../data/hero-live.json';

gsap.registerPlugin(ScrollTrigger);

// Czas przejazdu całej trasy (s), różny dla każdej, żeby pojazdy nie jechały w takt
const SPANS: Record<string, number> = { wz: 48, po: 62, sk: 70, wa: 40, zs: 55 };
// Pojawienie się i zniknięcie pojazdu na końcach trasy (s)
const FADE = 0.6;
// Co ile sekund zapala się kolejna etykieta warstwy
const LAYER_STEP = 2.8;

const HeroLive: Module = {
  init(root: HTMLElement) {
    const svg = root.querySelector<SVGSVGElement>('[data-hero-live]');
    if (!svg) return;
    const layers = Array.from(root.querySelectorAll<HTMLElement>('.hero__layer'));

    const routes = geom.routes.map((route) => {
      const group = svg.querySelector<SVGGElement>(`[data-live-route="${route.id}"]`);
      return {
        ...route,
        line: polyline(route.points as Point[]),
        group,
        trail: group?.querySelector('.hero-live__trail'),
        dots: Array.from(group?.querySelectorAll('circle') ?? []),
        pulse: group?.querySelector('.hero-live__pulse'),
        tip: group?.querySelector('.hero-live__tip'),
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

    const setLayer = (index: number) => {
      layers.forEach((layer, i) => layer.classList.toggle('is-on', i === index));
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
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

        if (layers.length) {
          const cycle = gsap.timeline({ repeat: -1 });
          layers.forEach((_, i) => cycle.call(() => setLayer(i), undefined, i * LAYER_STEP));
          cycle.to({}, { duration: LAYER_STEP }, (layers.length - 1) * LAYER_STEP);
          animations.push(cycle);
        }

        ScrollTrigger.create({
          trigger: root.closest('section') ?? root,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => animations.forEach((a) => (self.isActive ? a.resume() : a.pause())),
        });

        return () => {
          routes.forEach((route) => draw(route, route.t0));
          setLayer(-1);
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default HeroLive;
