/**
 * scroll.ts — Lenis smooth scroll + GSAP ScrollTrigger.
 *
 * Lenis pracuje z autoRaf: false, bo napędza go gsap.ticker.
 * Przy prefers-reduced-motion Lenis się nie startuje — działa natywny scroll.
 * Dotyk zostaje natywny (bez syncTouch), wygładzane jest tylko kółko myszy.
 * LERP 0.1 (domyślny Lenisa) dawał za długi „poślizg” (feedback 2026-10-30).
 *
 * Eksportuje lenisStart / lenisStop do użycia przez nawigację (menu fullscreen).
 */

import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

// Ile pozostałej drogi scroll nadrabia na klatkę (60 fps): więcej = krócej dojeżdża
const LERP = 0.2;

let lenis: Lenis | null = null;

export function initScroll(): void {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) {
    // Natywny scroll — ScrollTrigger działa normalnie, Lenis nie jest potrzebny
    ScrollTrigger.defaults({ scroller: window });
    return;
  }

  lenis = new Lenis({
    autoRaf: false,
    lerp: LERP,
  });

  // Lenis aktualizuje ScrollTrigger przy każdym kroku scrolla
  lenis.on('scroll', ScrollTrigger.update);

  // Jeden ticker dla Lenis + GSAP — bez podwójnych animationFrame
  gsap.ticker.add((time) => {
    lenis?.raf(time * 1000);
  });

  // Zapobiega „stutteringowi" przy spikach wydajności
  gsap.ticker.lagSmoothing(0);
}

export function lenisStart(): void {
  lenis?.start();
}

export function lenisStop(): void {
  lenis?.stop();
}

export function getLenis(): Lenis | null {
  return lenis;
}
