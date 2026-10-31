/**
 * odometer.ts — liczby w dowodach przewijają się do wartości jak licznik (docs/INSPIRACJE.md, Dowody).
 *
 * Każda cyfra w [data-odometer] dostaje okno z kolumną 0–9 ×2 i przewija się o 10 + cyfra
 * pozycji przy wejściu na ekran. Inne znaki stoją. Czytnik ekranu dostaje całą wartość w .sr-only.
 * Reduced motion i bez JS: zwykły tekst.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, easeToken } from '@core/motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Czas przewijania pierwszej cyfry (s); każda kolejna o STEP dłużej
const DURATION = 1.6;
const STEP = 0.18;

const Odometer: Module = {
  init(root: HTMLElement) {
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-odometer]'));
    if (!targets.length) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const ease = easeToken('--ease-ui');

        const built = targets.map((el) => {
          const text = el.textContent?.trim() ?? '';
          const sr = document.createElement('span');
          sr.className = 'sr-only';
          sr.textContent = text;
          const visual = document.createElement('span');
          visual.className = 'odo';
          visual.setAttribute('aria-hidden', 'true');

          const columns: Array<{ column: HTMLElement; digit: number }> = [];
          for (const char of text) {
            if (/\d/.test(char)) {
              const window = document.createElement('span');
              window.className = 'odo__window';
              const column = document.createElement('span');
              column.className = 'odo__column';
              column.textContent = '';
              for (let i = 0; i < 20; i++) {
                const d = document.createElement('span');
                d.textContent = String(i % 10);
                column.append(d);
              }
              window.append(column);
              visual.append(window);
              columns.push({ column, digit: Number(char) });
            } else {
              const static_ = document.createElement('span');
              static_.className = 'odo__char';
              static_.textContent = char;
              visual.append(static_);
            }
          }

          el.replaceChildren(sr, visual);

          columns.forEach(({ column, digit }, i) => {
            gsap.fromTo(
              column,
              { yPercent: 0 },
              {
                // 20 cyfr w kolumnie: jedna pozycja to 5% jej wysokości
                yPercent: -(10 + digit) * 5,
                duration: DURATION + i * STEP,
                ease,
                scrollTrigger: { trigger: el, start: 'top 85%', once: true },
              }
            );
          });

          return { el, text };
        });

        return () => built.forEach(({ el, text }) => (el.textContent = text));
      });
    }, root);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default Odometer;
