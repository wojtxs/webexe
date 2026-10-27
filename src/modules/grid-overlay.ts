/**
 * grid-overlay.ts — overlay siatki dla /lab.
 * Toggle: przycisk lub klawisz 'g'.
 * Siatka: 12 kol. desktop / 8 tablet / 4 mobile — odzwierciedla .container z utils.css.
 */

import type { Module } from '@core/lifecycle';
import gsap from 'gsap';

const STORAGE_KEY = 'wxe-grid-visible';

const GridOverlay: Module = {
  init(root: HTMLElement) {
    const ctx = gsap.context(() => {}, root);

    // Overlay div
    const overlay = document.createElement('div');
    overlay.setAttribute('aria-hidden', 'true');
    overlay.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 9990;
      pointer-events: none;
      display: grid;
      grid-template-columns: repeat(var(--grid-cols), 1fr);
      column-gap: var(--grid-gap);
      padding-inline: var(--grid-padding);
      opacity: 0;
    `;

    // Kolumny
    for (let i = 0; i < 12; i++) {
      const col = document.createElement('div');
      col.style.cssText = `
        background: rgba(8, 145, 178, 0.08);
        border-inline: 1px solid rgba(8, 145, 178, 0.2);
        height: 100%;
      `;
      overlay.appendChild(col);
    }
    document.body.appendChild(overlay);

    // Stan
    const savedVisible = sessionStorage.getItem(STORAGE_KEY) === 'true';
    let visible = savedVisible;
    overlay.style.opacity = visible ? '1' : '0';

    const toggle = () => {
      visible = !visible;
      overlay.style.opacity = visible ? '1' : '0';
      sessionStorage.setItem(STORAGE_KEY, String(visible));

      const btn = root.querySelector<HTMLElement>('[data-grid-toggle]');
      if (btn) btn.textContent = visible ? 'Ukryj siatkę (G)' : 'Pokaż siatkę (G)';
    };

    // Przycisk
    const btn = root.querySelector<HTMLElement>('[data-grid-toggle]');
    if (btn) {
      btn.textContent = visible ? 'Ukryj siatkę (G)' : 'Pokaż siatkę (G)';
      btn.addEventListener('click', toggle);
    }

    // Klawisz g
    const onKey = (e: KeyboardEvent) => {
      if (
        e.key === 'g' &&
        !e.metaKey &&
        !e.ctrlKey &&
        !(e.target instanceof HTMLInputElement) &&
        !(e.target instanceof HTMLTextAreaElement)
      ) {
        toggle();
      }
    };
    document.addEventListener('keydown', onKey);

    // Destroy
    this.destroy = () => {
      ctx.revert();
      document.removeEventListener('keydown', onKey);
      btn?.removeEventListener('click', toggle);
      overlay.remove();
    };
  },

  destroy() {},
};

export default GridOverlay;
