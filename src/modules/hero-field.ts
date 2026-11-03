/**
 * hero-field.ts — tło hero „Schemat systemu” (sections/Hero.astro, docs/sections/01-hero.md).
 *
 * Canvas pod treścią hero, nad liniami siatki. Trzy warstwy:
 * 1. Sieć: drobne węzły x na granicach kolumn siatki, w pionie co pół kroku kolumny, od szyny
 *    danych w górę (kolor --c-piana-deep). Stoi też przy reduced motion.
 * 2. Pakiety: odcinki z wygasającym ogonem w Lagunie (na zmianę --c-laguna-start i -end) jadą
 *    po liniach sieci, kątem prostym, do węzła aktywnego modułu na szynie i błyskają w nim
 *    znakiem x. Przy zmianie modułu (zdarzenie hs:change z hero-system) wyrusza seria, a w czasie
 *    pokazu pojedyncze pakiety co AMBIENT sekund. Przepływ stoi po pauzie, poza ekranem i do
 *    końca wejścia (zdarzenie hs:flow).
 * 3. Kursor (precyzyjny wskaźnik): węzły w promieniu kursora rosną i przechodzą w gradient Laguny.
 * Pętla rAF kręci się tylko wtedy, gdy coś się rusza. Kolory i geometria z tokenów.
 * Poniżej 992 px (moduły w pionie) pakiety jadą do węzła aktywnego modułu zmierzonego w DOM.
 */

import { cssVar } from '@core/css';
import type { Module } from '@core/lifecycle';
import { addMotion } from '@core/motion';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Krok pionowy sieci jako część kroku kolumny
const ROW = 0.5;
// Węzeł sieci: pół przekątnej i kreska (rem); zapalony pod kursorem rośnie do LIT
const NODE = 0.2;
const LIT = 0.42;
const STROKE = 0.08;
// Kursor: promień w krokach kolumny, wygładzanie na klatkę przy 60 fps
const RADIUS = 2.4;
const FOLLOW = 0.16;
const EASE = 0.12;
// Pakiet: prędkość (krok kolumny na sekundę), ogon (krok kolumny), grubość (rem)
const SPEED = 5.5;
const TAIL = 1.1;
const WIDTH = 0.125;
// Błysk w węźle docelowym (s)
const FLASH = 0.6;
// Odstęp pakietów w czasie pokazu (s, losowo od – do)
const AMBIENT: [number, number] = [0.7, 1.5];
// Seria przy zmianie modułu: liczba pakietów i odstęp (s)
const BURST = 3;
const BURST_GAP = 0.14;

const FINE = '(hover: hover) and (pointer: fine)';

type Point = { x: number; y: number };
type Node = Point & { v: number };
type Packet = { path: Point[]; length: number; t: number; color: string; done: boolean };
type Flash = Point & { t: number; color: string };

const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
const toPx = (value: string) =>
  value.endsWith('rem') ? parseFloat(value) * remPx() : parseFloat(value) || 0;
const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pickInt = (a: number, b: number) => Math.floor(rand(a, b + 1));

/** Punkt na łamanej w odległości s od początku */
const along = (path: Point[], s: number): Point => {
  let left = Math.max(s, 0);
  for (let i = 1; i < path.length; i++) {
    const a = path[i - 1];
    const b = path[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= seg || i === path.length - 1) {
      const k = seg ? Math.min(left / seg, 1) : 0;
      return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
    }
    left -= seg;
  }
  return path[path.length - 1];
};

const HeroField: Module = {
  init(canvas: HTMLElement) {
    if (!(canvas instanceof HTMLCanvasElement)) return;
    const g = canvas.getContext('2d');
    const section = canvas.closest('section');
    if (!g || !section) return;
    const bus = section.querySelector<HTMLElement>('[data-hs-bus]');
    const strip = section.querySelector<HTMLElement>('[data-hs-strip]');

    let nodes: Node[] = [];
    let cols = 12;
    let pitch = 0;
    let pad = 0;
    let gap = 0;
    let busY = 0;
    let rowsUp = 0;
    let dpr = 1;
    let width = 0;
    let height = 0;
    let base = '';
    let colors: string[] = [];
    let gradient: CanvasGradient | null = null;

    // Siatka węzłów od szyny (albo od góry modułów poniżej 992 px) w górę
    const layout = () => {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);

      pad = toPx(cssVar('--grid-padding'));
      gap = toPx(cssVar('--grid-gap'));
      cols = parseInt(cssVar('--grid-cols'), 10) || 12;
      pitch = (width - 2 * pad + gap) / cols;
      const anchor = bus && bus.offsetParent ? bus : strip;
      busY = anchor ? anchor.getBoundingClientRect().top - rect.top : height;
      const step = pitch * ROW;
      // Bez rzędu tuż pod paskiem nawigacji
      rowsUp = Math.max(Math.floor((busY - step * 1.5) / step), 0);

      const prev = new Map(nodes.map((n) => [`${Math.round(n.x)}:${Math.round(n.y)}`, n.v]));
      nodes = [];
      for (let k = 0; k <= cols; k++) {
        for (let j = 1; j <= rowsUp; j++) {
          const x = pad - gap / 2 + k * pitch;
          const y = busY - j * step;
          nodes.push({ x, y, v: prev.get(`${Math.round(x)}:${Math.round(y)}`) ?? 0 });
        }
      }

      base = cssVar('--c-piana-deep');
      colors = [cssVar('--c-laguna-start'), cssVar('--c-laguna-end')];
      gradient = g.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, colors[0]);
      gradient.addColorStop(1, colors[1]);
    };

    const cross = (x: number, y: number, s: number) => {
      g.moveTo(x - s, y - s);
      g.lineTo(x + s, y + s);
      g.moveTo(x + s, y - s);
      g.lineTo(x - s, y + s);
    };

    const packets: Packet[] = [];
    const flashes: Flash[] = [];

    const drawNodes = () => {
      const r = remPx();
      g.lineCap = 'round';
      g.lineWidth = STROKE * r;
      // Sieć: węzły w spoczynku (zapalone rysuje druga pętla)
      g.strokeStyle = base;
      g.beginPath();
      for (const n of nodes) if (n.v < 0.98) cross(n.x, n.y, NODE * r);
      g.stroke();
      if (!gradient) return;
      g.strokeStyle = gradient;
      for (const n of nodes) {
        if (n.v < 0.01) continue;
        const s = (NODE + (LIT - NODE) * (1 - Math.pow(1 - n.v, 3))) * r;
        g.globalAlpha = Math.min(n.v * 1.3, 1);
        g.beginPath();
        cross(n.x, n.y, s);
        g.stroke();
      }
      g.globalAlpha = 1;
    };

    const drawPackets = () => {
      const r = remPx();
      const tail = TAIL * pitch;
      g.lineCap = 'butt';
      g.lineWidth = WIDTH * r;
      for (const p of packets) {
        const head = Math.min(p.t, p.length);
        // Ogon z wygasaniem: krótkie odcinki od głowy w tył
        const steps = 14;
        g.strokeStyle = p.color;
        for (let i = 0; i < steps; i++) {
          const s0 = head - (tail * i) / steps;
          const s1 = head - (tail * (i + 1)) / steps;
          if (s0 <= 0) break;
          const a = along(p.path, s0);
          const b = along(p.path, Math.max(s1, 0));
          g.globalAlpha = (1 - i / steps) * (p.t > p.length ? 1 - (p.t - p.length) / tail : 1);
          g.beginPath();
          g.moveTo(a.x, a.y);
          g.lineTo(b.x, b.y);
          g.stroke();
        }
      }
      g.lineCap = 'round';
      for (const f of flashes) {
        const k = f.t / FLASH;
        g.globalAlpha = 1 - k;
        g.strokeStyle = f.color;
        g.lineWidth = STROKE * 1.4 * r;
        g.beginPath();
        cross(f.x, f.y, (0.3 + 0.5 * Math.sin(Math.min(k * 2, 1) * Math.PI * 0.5)) * r);
        g.stroke();
      }
      g.globalAlpha = 1;
    };

    const draw = () => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, width, height);
      drawNodes();
      drawPackets();
    };

    const revert = addMotion((ctx) => {
      ctx.full(() => {
        const fine = window.matchMedia(FINE).matches;
        const vertical = window.matchMedia('(max-width: 991px)');
        let raf = 0;
        let last = 0;
        let visible = true;
        let flow = false;
        let ambient = 0;
        let colorTurn = 0;
        const target = { x: -1e4, y: -1e4, on: 0 };
        const pos = { x: -1e4, y: -1e4, on: 0 };
        const timers: number[] = [];

        // Węzeł docelowy: na szynie w kolumnie column; w pionie zmierzony węzeł aktywnego modułu
        const goal = (column: number | null): Point | null => {
          if (column !== null && !vertical.matches) {
            return { x: pad - gap / 2 + column * pitch, y: busY };
          }
          const node = section.querySelector('.hs__seg.is-active .hs__node');
          if (!node) return null;
          const a = node.getBoundingClientRect();
          const b = canvas.getBoundingClientRect();
          return { x: a.left + a.width / 2 - b.left, y: a.top + a.height / 2 - b.top };
        };

        // Trasa po liniach sieci: w dół z losowego węzła, w bok na losowym rzędzie, w dół do celu
        const launch = (column: number | null) => {
          const end = goal(column);
          if (!end || rowsUp < 2) return;
          const step = pitch * ROW;
          const c = pickInt(0, cols);
          const startRow = pickInt(Math.ceil(rowsUp / 2), rowsUp);
          const midRow = pickInt(1, startRow);
          const x0 = pad - gap / 2 + c * pitch;
          const yStart = busY - startRow * step;
          const yMid = Math.min(busY - midRow * step, end.y - step * 0.5);
          const path: Point[] = [
            { x: x0, y: yStart },
            { x: x0, y: yMid },
            { x: end.x, y: yMid },
            { x: end.x, y: end.y },
          ];
          let length = 0;
          for (let i = 1; i < path.length; i++) {
            length += Math.abs(path[i].x - path[i - 1].x) + Math.abs(path[i].y - path[i - 1].y);
          }
          packets.push({ path, length, t: 0, color: colors[colorTurn++ % 2], done: false });
          schedule();
        };

        const tick = (now: number) => {
          raf = 0;
          const dt = last ? Math.min((now - last) / 1000, 0.05) : 1 / 60;
          last = now;
          const f60 = dt * 60;
          let busy = false;

          // Kursor i węzły
          if (fine) {
            const follow = 1 - Math.pow(1 - FOLLOW, f60);
            const ease = 1 - Math.pow(1 - EASE, f60);
            if (pos.x < -1e3) {
              pos.x = target.x;
              pos.y = target.y;
            }
            pos.x += (target.x - pos.x) * follow;
            pos.y += (target.y - pos.y) * follow;
            pos.on += (target.on - pos.on) * follow;
            const radius = RADIUS * pitch;
            if (Math.abs(target.x - pos.x) + Math.abs(target.y - pos.y) > 0.5) busy = true;
            if (Math.abs(target.on - pos.on) > 0.01) busy = true;
            for (const n of nodes) {
              const d = Math.hypot(n.x - pos.x, n.y - pos.y);
              const want = pos.on * (1 - smoothstep(radius * 0.25, radius, d));
              const next = n.v + (want - n.v) * ease;
              if (Math.abs(next - n.v) > 0.002) busy = true;
              n.v = Math.abs(want - next) < 0.002 ? want : next;
            }
          }

          // Pakiety, błyski, pakiety w czasie pokazu
          const speed = SPEED * pitch;
          for (const p of packets) {
            const before = p.t;
            p.t += speed * dt;
            if (before < p.length && p.t >= p.length) {
              const end = p.path[p.path.length - 1];
              flashes.push({ x: end.x, y: end.y, t: 0, color: p.color });
            }
            if (p.t > p.length + TAIL * pitch) p.done = true;
          }
          for (let i = packets.length - 1; i >= 0; i--) if (packets[i].done) packets.splice(i, 1);
          for (const fl of flashes) fl.t += dt;
          for (let i = flashes.length - 1; i >= 0; i--)
            if (flashes[i].t >= FLASH) flashes.splice(i, 1);
          if (packets.length || flashes.length) busy = true;

          if (flow) {
            ambient -= dt;
            if (ambient <= 0) {
              ambient = rand(...AMBIENT);
              launch(null);
            }
            busy = true;
          }

          draw();
          if (busy) schedule();
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
        const onFlow = (event: Event) => {
          flow = Boolean((event as CustomEvent<{ on: boolean }>).detail?.on);
          if (flow) {
            ambient = Math.min(ambient, AMBIENT[0]);
            schedule();
          }
        };
        const onChange = (event: Event) => {
          if (!flow) return;
          const column = (event as CustomEvent<{ column: number | null }>).detail?.column ?? null;
          for (let i = 0; i < BURST; i++) {
            timers.push(window.setTimeout(() => launch(column), i * BURST_GAP * 1000));
          }
          ambient = AMBIENT[1];
        };

        if (fine) {
          window.addEventListener('pointermove', onMove, { passive: true });
          document.addEventListener('mouseout', onLeave);
        }
        section.addEventListener('hs:flow', onFlow);
        section.addEventListener('hs:change', onChange);
        const resize = new ResizeObserver(() => {
          layout();
          draw();
        });
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
        draw();

        return () => {
          window.removeEventListener('pointermove', onMove);
          document.removeEventListener('mouseout', onLeave);
          section.removeEventListener('hs:flow', onFlow);
          section.removeEventListener('hs:change', onChange);
          timers.forEach((id) => window.clearTimeout(id));
          resize.disconnect();
          trigger.kill();
          if (raf) cancelAnimationFrame(raf);
          packets.length = 0;
          flashes.length = 0;
          nodes.forEach((n) => (n.v = 0));
        };
      });

      // Reduced motion: sama sieć, bez ruchu
      ctx.reduced(() => {
        const resize = new ResizeObserver(() => {
          layout();
          draw();
        });
        resize.observe(canvas);
        layout();
        draw();
        return () => resize.disconnect();
      });
    }, canvas);

    this.destroy = () => {
      revert();
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, canvas.width, canvas.height);
    };
  },

  destroy() {},
};

export default HeroField;
