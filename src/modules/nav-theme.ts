/**
 * nav-theme.ts — kolory stałych elementów w rogach według tła pod nimi.
 *
 * Dwie sondy przy lewej krawędzi, pod rogami: górna (wordmark, CTA) i dolna (mapa rozdziałów).
 * Lewa krawędź, a nie środek: hit-testing kreski x ignoruje jej niedorysowanie. Dla każdej najbliższy
 * [data-nav-theme] pod punktem decyduje o klasie is-top-dark / is-bottom-dark na root.
 * Znak x w x-zoom ma własne data-nav-theme="dark", więc gdy po zoomie zakrywa ekran,
 * rogi przechodzą na ciemny motyw, choć sekcja pod spodem jest jasna.
 * Sprawdzane w gsap.ticker tylko wtedy, gdy zmienił się scroll albo rozmiar okna.
 */

import type { Module } from '@core/lifecycle';
import gsap from 'gsap';

// Odległość sond od krawędzi ekranu (px)
const PROBE_INSET = 40;

const themeAt = (root: HTMLElement, x: number, y: number): string | undefined => {
  for (const el of document.elementsFromPoint(x, y)) {
    if (root.contains(el)) continue;
    const owner = el.closest<HTMLElement>('[data-nav-theme]');
    if (owner) return owner.dataset.navTheme;
  }
  return undefined;
};

const NavTheme: Module = {
  init(root: HTMLElement) {
    let lastKey = '';

    const update = () => {
      const key = `${window.scrollY}|${window.innerWidth}|${window.innerHeight}`;
      if (key === lastKey) return;
      lastKey = key;

      const bottom = window.innerHeight - PROBE_INSET;
      root.classList.toggle('is-top-dark', themeAt(root, PROBE_INSET, PROBE_INSET) === 'dark');
      root.classList.toggle('is-bottom-dark', themeAt(root, PROBE_INSET, bottom) === 'dark');
    };

    gsap.ticker.add(update);
    update();

    this.destroy = () => {
      gsap.ticker.remove(update);
      root.classList.remove('is-top-dark', 'is-bottom-dark');
    };
  },

  destroy() {},
};

export default NavTheme;
