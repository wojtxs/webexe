/**
 * menu.ts — menu wyrastające z przycisku (components/Corners.astro, docs/INSPIRACJE.md, warstwa globalna).
 *
 * Panel otwiera się z prostokąta przycisku (clip-path od przycisku do pełnego panelu, tempo wejścia
 * treści), a pozycje wchodzą po kolei, gdy panel jest już w większości otwarty. Na mobile panel
 * zajmuje cały ekran (CSS), mechanika ta sama.
 * Otwarte menu: reszta strony inert, Lenis stoi, Esc albo klik poza panelem zamyka, fokus wraca
 * na przycisk. Klik w pozycję zamyka menu i przewija do rozdziału.
 * Reduced motion: panel pojawia się i znika bez ruchu. Bez JS przycisk zostaje ukryty.
 */

import type { Module } from '@core/lifecycle';
import { addMotion, durationToken, easeToken } from '@core/motion';
import { getLenis, lenisStart, lenisStop } from '@core/scroll';
import gsap from 'gsap';

// Kiedy w otwieraniu panelu startują pozycje (część czasu panelu) i odstęp między nimi (s)
const ITEMS_AT = 0.45;
const ITEMS_STAGGER = 0.05;
// Zamykanie jest szybsze niż otwieranie
const CLOSE_SPEED = 1.6;

const Menu: Module = {
  init(root: HTMLElement) {
    const toggle = root.querySelector<HTMLButtonElement>('[data-menu-toggle]');
    const panel = root.querySelector<HTMLElement>('[data-menu-panel]');
    if (!toggle || !panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>('[data-menu-item]'));

    // Wszystko poza przyciskiem i panelem (treść i pozostałe rogi): przy otwartym menu niedostępne
    const keep = [toggle, panel];
    const outside: HTMLElement[] = [];
    const main = document.getElementById('main-content');
    if (main) outside.push(main);
    const collect = (parent: Element) => {
      for (const el of Array.from(parent.children)) {
        if (keep.some((k) => k === el)) continue;
        if (keep.some((k) => el.contains(k))) collect(el);
        else if (el instanceof HTMLElement) outside.push(el);
      }
    };
    collect(root);

    let open = false;
    let full = false;
    let tl: gsap.core.Timeline | null = null;

    // Prostokąt przycisku względem panelu jako clip-path inset (panel ma już stan otwarty w CSS)
    const fromButton = () => {
      const p = panel.getBoundingClientRect();
      const b = toggle.getBoundingClientRect();
      const r = b.height / 2;
      return `inset(${b.top - p.top}px ${p.right - b.right}px ${p.bottom - b.bottom}px ${b.left - p.left}px round ${r}px)`;
    };

    const revertMotion = addMotion((ctx) => {
      ctx.full(() => {
        full = true;
        return () => {
          full = false;
        };
      });
    }, root);

    const animate = (next: boolean) => {
      tl?.kill();
      if (!full) {
        panel.classList.toggle('is-open', next);
        gsap.set(panel, { clearProps: 'clipPath' });
        gsap.set(items, { clearProps: 'all' });
        return;
      }
      const duration = durationToken('--d-enter');
      const ease = easeToken('--ease-enter');
      const radius = getComputedStyle(panel).borderTopLeftRadius;
      if (next) {
        panel.classList.add('is-open');
        tl = gsap
          .timeline()
          .fromTo(
            panel,
            { clipPath: fromButton() },
            { clipPath: `inset(0px 0px 0px 0px round ${radius})`, duration, ease },
            0
          )
          .fromTo(
            items,
            // Samo opacity, bez visibility: pierwsza pozycja dostaje fokus od razu po otwarciu
            { y: 24, opacity: 0 },
            { y: 0, opacity: 1, duration: duration * 0.6, ease, stagger: ITEMS_STAGGER },
            duration * ITEMS_AT
          );
      } else {
        tl = gsap
          .timeline({
            onComplete: () => {
              panel.classList.remove('is-open');
              gsap.set(panel, { clearProps: 'clipPath' });
              gsap.set(items, { clearProps: 'all' });
            },
          })
          .to(items, { opacity: 0, duration: duration * 0.3, ease }, 0)
          .to(panel, { clipPath: fromButton(), duration, ease }, 0)
          .timeScale(CLOSE_SPEED);
      }
    };

    const setOpen = (next: boolean, returnFocus = true) => {
      if (next === open) return;
      open = next;
      toggle.setAttribute('aria-expanded', String(next));
      root.classList.toggle('is-menu-open', next);
      panel.inert = !next;
      outside.forEach((el) => (el.inert = next));
      if (next) lenisStop();
      else lenisStart();
      animate(next);
      if (next) panel.querySelector<HTMLElement>('a')?.focus({ preventScroll: true });
      else if (returnFocus) toggle.focus({ preventScroll: true });
    };

    const onToggle = () => setOpen(!open);
    const onKey = (event: KeyboardEvent) => {
      if (open && event.key === 'Escape') setOpen(false);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (open && !panel.contains(target) && !toggle.contains(target)) setOpen(false, false);
    };
    const onLink = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!link) return;
      const hash = link.getAttribute('href') ?? '';
      setOpen(false, false);
      const lenis = getLenis();
      if (!lenis) return;
      event.preventDefault();
      lenis.scrollTo(hash);
    };

    toggle.hidden = false;
    toggle.addEventListener('click', onToggle);
    panel.addEventListener('click', onLink);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);

    this.destroy = () => {
      setOpen(false, false);
      tl?.kill();
      revertMotion();
      toggle.hidden = true;
      toggle.removeEventListener('click', onToggle);
      panel.removeEventListener('click', onLink);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
    };
  },

  destroy() {},
};

export default Menu;
