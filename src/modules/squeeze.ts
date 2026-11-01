/**
 * squeeze.ts — karty realizacji lekko się ściskają przy szybkim scrollu
 * (docs/INSPIRACJE.md, wiersz Realizacje; technika z chipsa-analiza.md, sekcja 11).
 *
 * Prędkość Lenisa w gsap.ticker → wygładzona wartość --squeeze na root (0…MAX).
 * CSS skaluje media kart: scale(1 - var(--squeeze)).
 * Bez Lenisa (reduced motion, dotyk bez Lenisa) moduł nic nie robi.
 */

import type { Module } from '@core/lifecycle';
import { getLenis } from '@core/scroll';
import gsap from 'gsap';

// Prędkość (px na klatkę) / szerokość okna × GAIN, z górnym limitem MAX
const GAIN = 1.8;
const MAX = 0.08;
// Wygładzanie na klatkę (0–1): im mniej, tym wolniej karta wraca
const SMOOTHING = 0.08;

const Squeeze: Module = {
  init(root: HTMLElement) {
    const lenis = getLenis();
    if (!lenis) return;

    let squeeze = 0;
    let written = '';

    const tick = () => {
      const target = Math.min((Math.abs(lenis.velocity) / window.innerWidth) * GAIN, MAX);
      squeeze += (target - squeeze) * SMOOTHING;
      if (squeeze < 0.0005 && target === 0) squeeze = 0;
      // Zapis tylko przy zmianie: w spoczynku lista nie przelicza stylów w każdej klatce
      const value = squeeze.toFixed(4);
      if (value === written) return;
      written = value;
      root.style.setProperty('--squeeze', value);
    };

    gsap.ticker.add(tick);

    this.destroy = () => {
      gsap.ticker.remove(tick);
      root.style.removeProperty('--squeeze');
    };
  },

  destroy() {},
};

export default Squeeze;
