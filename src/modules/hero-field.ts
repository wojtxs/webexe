/**
 * hero-field.ts — siatka węzłów x za kursorem w hero (sections/Hero.astro, docs/sections/01-hero.md).
 *
 * Na canvasie pod treścią stoją ukryte węzły na granicach kolumn siatki (co kolumnę, w pionie
 * w tym samym kroku). Węzły w promieniu kursora wyrastają ze środka w znak x w Lagunie: najbliższe
 * w pełnym rozmiarze, dalsze mniejsze i bledsze. Kursor jest wygładzany, a pętla rAF kręci
 * się tylko wtedy, gdy coś się zmienia, i stoi, gdy hero jest poza ekranem.
 * Kolory z tokenów (--c-laguna-start / -end), geometria z --grid-padding, --grid-gap, --grid-cols.
 * Tylko precyzyjny kursor i pełny ruch; dotyk i reduced motion: pusty canvas.
 */

import { cssVar } from '@core/css';
import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Promień zapalania w krokach siatki i część promienia, w której węzeł świeci w pełni
const RADIUS = 2.6;
const CORE = 0.3;
// Wygładzanie kursora i węzłów na klatkę przy 60 fps
const FOLLOW = 0.16;
const EASE = 0.12;
// Pół przekątnej węzła i grubość kreski w rem (węzły siatki mają --s-4)
const NODE = 0.45;
const STROKE = 0.09;

const FINE = '(hover: hover) and (pointer: fine)';

type Node = { x: number; y: number; v: number };

const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const toPx = (value: string) =>
  value.endsWith('rem') ? parseFloat(value) * remPx() : parseFloat(value) || 0;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

const HeroField: Module = {
  init(canvas: HTMLElement) {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const g = canvas.getContext('2d');
    const section = canvas.closest('section');
    if (!g || !section) return;

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        if (!window.matchMedia(FINE).matches) return;

        let nodes: Node[] = [];
        let pitch = 0;
        let dpr = 1;
        let width = 0;
        let height = 0;
        let gradient: CanvasGradient | null = null;
        let raf = 0;
        let last = 0;
        let visible = true;
        // Kursor docelowy, wygładzony i siła (0, gdy kursor poza oknem)
        const target = { x: -1e4, y: -1e4, on: 0 };
        const pos = { x: -1e4, y: -1e4, on: 0 };

        const layout = () => {
          const rect = canvas.getBoundingClientRect();
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          width = rect.width;
          height = rect.height;
          canvas.width = Math.round(width * dpr);
          canvas.height = Math.round(height * dpr);

          const pad = toPx(cssVar('--grid-padding'));
          const gap = toPx(cssVar('--grid-gap'));
          const cols = parseInt(cssVar('--grid-cols'), 10) || 12;
          pitch = (width - 2 * pad + gap) / cols;
          const rows = Math.floor(height / pitch);
          const top = (height - rows * pitch) / 2;
          const prev = new Map(nodes.map((n) => [`${Math.round(n.x)}:${Math.round(n.y)}`, n.v]));
          nodes = [];
          for (let k = 0; k <= cols; k++) {
            for (let j = 0; j <= rows; j++) {
              const x = pad + k * pitch - gap / 2;
              const y = top + j * pitch;
              nodes.push({ x, y, v: prev.get(`${Math.round(x)}:${Math.round(y)}`) ?? 0 });
            }
          }

          gradient = g.createLinearGradient(0, 0, width, height);
          gradient.addColorStop(0, cssVar('--c-laguna-start'));
          gradient.addColorStop(1, cssVar('--c-laguna-end'));
          draw();
        };

        const draw = () => {
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          g.clearRect(0, 0, width, height);
          if (!gradient) return;
          const s = NODE * remPx();
          g.strokeStyle = gradient;
          g.lineWidth = STROKE * remPx();
          g.lineCap = 'round';
          for (const n of nodes) {
            if (n.v < 0.01) continue;
            // Rozmiar rośnie z wygaszeniem (easeOutCubic), kreski od środka na zewnątrz
            const k = s * (1 - Math.pow(1 - n.v, 3));
            g.globalAlpha = Math.min(n.v * 1.4, 1);
            g.beginPath();
            g.moveTo(n.x - k, n.y - k);
            g.lineTo(n.x + k, n.y + k);
            g.moveTo(n.x + k, n.y - k);
            g.lineTo(n.x - k, n.y + k);
            g.stroke();
          }
          g.globalAlpha = 1;
        };

        const tick = (now: number) => {
          raf = 0;
          const dt = last ? Math.min((now - last) / 16.667, 4) : 1;
          last = now;
          const follow = 1 - Math.pow(1 - FOLLOW, dt);
          const ease = 1 - Math.pow(1 - EASE, dt);

          // Pierwsze wejście kursora: bez dojazdu z rogu ekranu
          if (pos.x < -1e3) {
            pos.x = target.x;
            pos.y = target.y;
          }
          pos.x += (target.x - pos.x) * follow;
          pos.y += (target.y - pos.y) * follow;
          pos.on += (target.on - pos.on) * follow;

          const r = RADIUS * pitch;
          let moving = Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5;
          for (const n of nodes) {
            const d = Math.hypot(n.x - pos.x, n.y - pos.y);
            const want = pos.on * (1 - smoothstep(r * CORE, r, d));
            const next = n.v + (want - n.v) * ease;
            if (Math.abs(next - n.v) > 0.002) moving = true;
            n.v = Math.abs(want - next) < 0.002 ? want : next;
          }
          draw();
          if (moving || Math.abs(target.on - pos.on) > 0.01) schedule();
          else last = 0;
        };

        const schedule = () => {
          if (!raf && visible) raf = requestAnimationFrame(tick);
        };

        const onMove = (event: PointerEvent) => {
          if (event.pointerType !== 'mouse') return;
          const rect = canvas.getBoundingClientRect();
          target.x = event.clientX - rect.left;
          target.y = event.clientY - rect.top;
          target.on = 1;
          schedule();
        };
        const onLeave = (event: MouseEvent) => {
          if (event.relatedTarget) return;
          target.on = 0;
          schedule();
        };

        window.addEventListener('pointermove', onMove, { passive: true });
        document.addEventListener('mouseout', onLeave);
        const resize = new ResizeObserver(layout);
        resize.observe(canvas);

        const trigger = ScrollTrigger.create({
          trigger: section,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => {
            visible = self.isActive;
            if (visible) schedule();
            else if (raf) {
              cancelAnimationFrame(raf);
              raf = 0;
              last = 0;
            }
          },
        });

        layout();

        return () => {
          window.removeEventListener('pointermove', onMove);
          document.removeEventListener('mouseout', onLeave);
          resize.disconnect();
          trigger.kill();
          if (raf) cancelAnimationFrame(raf);
          g.setTransform(1, 0, 0, 1, 0, 0);
          g.clearRect(0, 0, canvas.width, canvas.height);
        };
      });
    }, canvas);

    this.destroy = () => {
      revert();
    };
  },

  destroy() {},
};

export default HeroField;
