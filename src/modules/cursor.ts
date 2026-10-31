/**
 * cursor.ts — pierścień za kursorem (components/Cursor.astro, docs/INSPIRACJE.md, warstwa globalna).
 *
 * Stan wynika z elementu pod kursorem: [data-cursor] → pigułka z tekstem atrybutu (is-label),
 * pole formularza → pierścień znika (is-field), link albo przycisk → pierścień rośnie (is-link).
 * Wygląd stanów jest w CSS (tempo UI), moduł tylko prowadzi pozycję i przełącza klasy.
 * Tylko precyzyjny kursor i pełny ruch; html.has-cursor chowa systemowy kursor nad [data-cursor].
 */

import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import gsap from 'gsap';

const FIELDS = 'input, textarea, select, [contenteditable]';
const LINKS = 'a, button, [role="button"], label, summary';
const STATES = ['is-active', 'is-out', 'is-label', 'is-field', 'is-link', 'is-down'];

const Cursor: Module = {
  init(root: HTMLElement) {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const label = root.querySelector('.cursor__label');
    const html = document.documentElement;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const duration = durationToken('--d-ui');
        const ease = easeToken('--ease-ui');
        const toX = gsap.quickTo(root, 'x', { duration, ease });
        const toY = gsap.quickTo(root, 'y', { duration, ease });
        // Po wejściu do okna pierścień staje od razu przy kursorze, zamiast dolatywać z rogu
        let placed = false;

        root.classList.add('is-active', 'is-out');
        html.classList.add('has-cursor');

        const setState = (target: Element | null) => {
          const tagged = target?.closest('[data-cursor]');
          const field = !tagged && target?.closest(FIELDS);
          const link = !tagged && !field && target?.closest(LINKS);
          if (tagged && label) label.textContent = tagged.getAttribute('data-cursor');
          root.classList.toggle('is-label', Boolean(tagged));
          root.classList.toggle('is-field', Boolean(field));
          root.classList.toggle('is-link', Boolean(link));
        };

        const move = (event: PointerEvent) => {
          if (event.pointerType === 'touch') return;
          if (placed) {
            toX(event.clientX);
            toY(event.clientY);
          } else {
            toX(event.clientX, event.clientX);
            toY(event.clientY, event.clientY);
            placed = true;
          }
          root.classList.remove('is-out');
        };
        const over = (event: PointerEvent) => setState(event.target as Element);
        const out = (event: PointerEvent) => {
          if (event.relatedTarget) return;
          root.classList.add('is-out');
          placed = false;
        };
        const down = () => root.classList.add('is-down');
        const up = () => root.classList.remove('is-down');

        document.addEventListener('pointermove', move);
        document.addEventListener('pointerover', over);
        document.addEventListener('pointerout', out);
        document.addEventListener('pointerdown', down);
        document.addEventListener('pointerup', up);

        return () => {
          document.removeEventListener('pointermove', move);
          document.removeEventListener('pointerover', over);
          document.removeEventListener('pointerout', out);
          document.removeEventListener('pointerdown', down);
          document.removeEventListener('pointerup', up);
          root.classList.remove(...STATES);
          html.classList.remove('has-cursor');
        };
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default Cursor;
