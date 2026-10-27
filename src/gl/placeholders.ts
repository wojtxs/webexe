/**
 * placeholders.ts — tymczasowe tekstury HERO-A / HERO-B / HERO-ALPHA dla spike F2.
 * Rysowane w canvasie z tokenów kolorów, z identyczną sylwetką A i B (warunek z ASSETS.md).
 * Do usunięcia, gdy w public/gl/textures/hero/ będą prawdziwe assety.
 */

import { CanvasTexture, LinearFilter, NoColorSpace, SRGBColorSpace } from 'three';
import { cssVar } from '@core/css';
import type { HeroVariant } from './params';

const W = 1024;
const H = 1280;
export const PLACEHOLDER_ASPECT = W / H;

type Kind =
  | 'dashboard'
  | 'table'
  | 'form'
  | 'phone'
  | 'sheet'
  | 'binder'
  | 'clipboard'
  | 'receipt'
  | 'sticky';

interface Shape {
  kind: Kind;
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
  rot: number;
}

const s = (kind: Kind, x: number, y: number, w: number, h: number, r: number, rot = 0): Shape => ({
  kind,
  x,
  y,
  w,
  h,
  r,
  rot,
});

// Wariant 1: klaster paneli aplikacji (od tyłu do przodu)
const APP: Shape[] = [
  s('dashboard', 110, 300, 600, 420, 36, -0.04),
  s('phone', 650, 200, 250, 470, 44, 0.05),
  s('table', 330, 600, 580, 380, 32, 0.03),
  s('form', 110, 800, 420, 330, 32, -0.05),
];

// Wariant 2: stos papierów (od tyłu do przodu)
const PAPER: Shape[] = [
  s('binder', 120, 330, 160, 560, 18, -0.06),
  s('binder', 250, 300, 150, 580, 18, 0.03),
  s('sheet', 330, 260, 440, 580, 6, 0.08),
  s('sheet', 360, 420, 460, 600, 6, -0.05),
  s('sticky', 640, 300, 120, 120, 6, 0.12),
  s('sheet', 300, 560, 480, 560, 6, 0.03),
  s('receipt', 700, 860, 150, 300, 4, 0.35),
  s('clipboard', 200, 700, 380, 470, 24, -0.1),
  s('sticky', 250, 950, 110, 110, 6, -0.2),
];

interface Palette {
  piana: string;
  biel: string;
  deep: string;
  glebia: string;
  raise: string;
  start: string;
  end: string;
  ink: string;
}

const palette = (): Palette => ({
  piana: cssVar('--c-piana'),
  biel: cssVar('--c-biel'),
  deep: cssVar('--c-piana-deep'),
  glebia: cssVar('--c-glebia'),
  raise: cssVar('--c-glebia-raise'),
  start: cssVar('--c-laguna-start'),
  end: cssVar('--c-laguna-end'),
  ink: cssVar('--c-ink-muted'),
});

/** Tokeny są w formacie #rrggbb; canvas potrzebuje przezroczystości do cieni. */
function withAlpha(color: string, alpha: number): string {
  const n = parseInt(color.replace('#', ''), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function canvas(fill: string | null) {
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const ctx = c.getContext('2d');
  if (!ctx) throw new Error('placeholders: brak 2D context');
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fillRect(0, 0, W, H);
  }
  return { c, ctx };
}

/** Ustawia transformację kształtu i ścieżkę obrysu. Rysowanie w lokalnych współrzędnych (0,0)–(w,h). */
function inShape(ctx: CanvasRenderingContext2D, sh: Shape, draw: () => void) {
  ctx.save();
  ctx.translate(sh.x + sh.w / 2, sh.y + sh.h / 2);
  ctx.rotate(sh.rot);
  ctx.translate(-sh.w / 2, -sh.h / 2);
  ctx.beginPath();
  ctx.roundRect(0, 0, sh.w, sh.h, sh.r);
  draw();
  ctx.restore();
}

function rows(
  ctx: CanvasRenderingContext2D,
  sh: Shape,
  color: string,
  from: number,
  gap: number,
  thick: number
) {
  ctx.fillStyle = color;
  for (let y = from, i = 0; y < sh.h - gap / 2; y += gap, i++) {
    const len = (sh.w - 60) * (0.55 + 0.4 * (((i * 37) % 10) / 10));
    ctx.beginPath();
    ctx.roundRect(30, y, len, thick, thick / 2);
    ctx.fill();
  }
}

function drawA(ctx: CanvasRenderingContext2D, sh: Shape, p: Palette) {
  inShape(ctx, sh, () => {
    const grad = ctx.createLinearGradient(0, 0, sh.w, sh.h);
    grad.addColorStop(0, p.start);
    grad.addColorStop(1, p.end);

    ctx.shadowColor = withAlpha(p.glebia, 0.16);
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle =
      sh.kind === 'binder'
        ? p.raise
        : sh.kind === 'clipboard'
          ? p.deep
          : sh.kind === 'sticky'
            ? p.end
            : p.biel;
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2;
    ctx.strokeStyle = p.deep;
    ctx.stroke();
    ctx.clip();

    switch (sh.kind) {
      case 'dashboard': {
        ctx.fillStyle = p.piana;
        ctx.fillRect(0, 0, sh.w, 44);
        ctx.fillStyle = grad;
        [0.45, 0.7, 0.55, 0.85, 0.6, 0.95].forEach((v, i) => {
          const bh = v * 220;
          ctx.beginPath();
          ctx.roundRect(40 + i * 56, 360 - bh, 34, bh, 8);
          ctx.fill();
        });
        ctx.strokeStyle = p.start;
        ctx.lineWidth = 4;
        ctx.beginPath();
        [140, 110, 125, 80, 95, 60].forEach((y, i) => ctx.lineTo(400 + i * 34, y + 60));
        ctx.stroke();
        break;
      }
      case 'table':
        ctx.fillStyle = p.piana;
        ctx.fillRect(0, 0, sh.w, 54);
        for (let y = 90; y < sh.h; y += 48) {
          ctx.fillStyle = p.deep;
          ctx.fillRect(24, y + 34, sh.w - 48, 2);
          ctx.fillStyle = p.piana;
          ctx.fillRect(30, y + 8, 140, 16);
          ctx.fillRect(220, y + 8, 200, 16);
        }
        break;
      case 'form':
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = p.piana;
          ctx.beginPath();
          ctx.roundRect(36, 40 + i * 74, sh.w - 72, 50, 12);
          ctx.fill();
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(36, 262, 170, 46, 23);
        ctx.fill();
        break;
      case 'phone':
        ctx.fillStyle = p.deep;
        ctx.beginPath();
        ctx.roundRect(sh.w / 2 - 40, 16, 80, 16, 8);
        ctx.fill();
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = i === 0 ? grad : p.piana;
          ctx.beginPath();
          ctx.roundRect(24, 60 + i * 130, sh.w - 48, 110, 18);
          ctx.fill();
        }
        break;
      case 'binder':
        ctx.fillStyle = p.biel;
        ctx.beginPath();
        ctx.roundRect(24, 60, sh.w - 48, 90, 6);
        ctx.fill();
        ctx.fillStyle = p.deep;
        ctx.beginPath();
        ctx.arc(sh.w / 2, sh.h - 90, 22, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'clipboard':
        ctx.fillStyle = p.biel;
        ctx.fillRect(24, 50, sh.w - 48, sh.h - 74);
        ctx.fillStyle = p.raise;
        ctx.beginPath();
        ctx.roundRect(sh.w / 2 - 70, 14, 140, 40, 10);
        ctx.fill();
        rows(ctx, { ...sh, h: sh.h - 20 }, withAlpha(p.ink, 0.4), 90, 34, 8);
        break;
      case 'sheet':
      case 'receipt':
        rows(ctx, sh, withAlpha(p.ink, 0.35), 50, sh.kind === 'receipt' ? 24 : 32, 7);
        break;
      case 'sticky':
        rows(ctx, sh, withAlpha(p.glebia, 0.3), 30, 22, 5);
        break;
    }
  });
}

function drawB(ctx: CanvasRenderingContext2D, sh: Shape, p: Palette) {
  inShape(ctx, sh, () => {
    const grad = ctx.createLinearGradient(0, 0, sh.w, sh.h);
    grad.addColorStop(0, p.start);
    grad.addColorStop(1, p.end);

    ctx.fillStyle = p.glebia;
    ctx.fill();
    ctx.save();
    ctx.clip();

    ctx.strokeStyle = grad;
    ctx.fillStyle = p.raise;
    ctx.lineWidth = 3;

    switch (sh.kind) {
      case 'dashboard': {
        // monitoring: siatka + heartbeat
        ctx.strokeStyle = p.raise;
        ctx.lineWidth = 1;
        for (let x = 40; x < sh.w; x += 40) ctx.strokeRect(x, 0, 0, sh.h);
        for (let y = 40; y < sh.h; y += 40) ctx.strokeRect(0, y, sh.w, 0);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 4;
        ctx.beginPath();
        const pts = [0, 0, 0, -60, 70, -110, 30, 0, 0, -40, 50, 0, 0, 0, -80, 90, 0, 0];
        pts.forEach((dy, i) => ctx.lineTo(20 + i * 33, 230 + dy));
        ctx.stroke();
        break;
      }
      case 'table':
        // serwerownia: szafy rack z diodami
        for (let i = 0; i < 6; i++) {
          ctx.fillStyle = p.raise;
          ctx.beginPath();
          ctx.roundRect(30, 30 + i * 56, sh.w - 60, 42, 6);
          ctx.fill();
          ctx.fillStyle = i % 2 ? p.end : p.start;
          ctx.beginPath();
          ctx.arc(sh.w - 60, 51 + i * 56, 6, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      case 'form':
      case 'binder': {
        // bazy danych / kopie zapasowe: cylindry
        const count = sh.kind === 'form' ? 2 : 1;
        const cw = sh.kind === 'form' ? 130 : sh.w - 50;
        for (let i = 0; i < count; i++) {
          const cx = sh.kind === 'form' ? 50 + i * 180 : 25;
          const top = 60;
          const bottom = sh.h - 70;
          ctx.beginPath();
          ctx.ellipse(cx + cw / 2, top, cw / 2, 22, 0, 0, Math.PI * 2);
          ctx.moveTo(cx, top);
          ctx.lineTo(cx, bottom);
          ctx.ellipse(cx + cw / 2, bottom, cw / 2, 22, 0, Math.PI, 0, true);
          ctx.lineTo(cx + cw, top);
          ctx.stroke();
          for (let y = top + 70; y < bottom; y += 70) {
            ctx.beginPath();
            ctx.ellipse(cx + cw / 2, y, cw / 2, 22, 0, 0, Math.PI);
            ctx.stroke();
          }
        }
        break;
      }
      case 'phone': {
        // pipeline deployu: węzły połączone linią
        ctx.beginPath();
        ctx.moveTo(sh.w / 2, 50);
        ctx.lineTo(sh.w / 2, sh.h - 50);
        ctx.stroke();
        for (let i = 0; i < 5; i++) {
          ctx.fillStyle = i < 3 ? grad : p.raise;
          ctx.beginPath();
          ctx.arc(sh.w / 2, 60 + i * 88, 18, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        }
        break;
      }
      case 'sticky':
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(20, sh.h / 2 - 18, sh.w - 40, 36, 18);
        ctx.fill();
        break;
      default:
        // arkusze → panele interfejsu z wierszami danych
        rows(ctx, sh, p.raise, 40, 34, 14);
        ctx.fillStyle = grad;
        ctx.fillRect(30, 20, 120, 6);
    }

    ctx.restore();
    ctx.shadowColor = withAlpha(p.start, 0.6);
    ctx.shadowBlur = 18;
    ctx.strokeStyle = grad;
    ctx.lineWidth = 3;
    ctx.stroke();
  });
}

function flowLines(ctx: CanvasRenderingContext2D, shapes: Shape[], p: Palette) {
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, p.start);
  grad.addColorStop(1, p.end);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.7;
  for (let i = 0; i < shapes.length - 1; i++) {
    const a = shapes[i];
    const b = shapes[i + 1];
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h / 2;
    const bx = b.x + b.w / 2;
    const by = b.y + b.h / 2;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.bezierCurveTo(ax, by, bx, ay, bx, by);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function texture(c: HTMLCanvasElement, srgb: boolean): CanvasTexture {
  const t = new CanvasTexture(c);
  t.colorSpace = srgb ? SRGBColorSpace : NoColorSpace;
  t.generateMipmaps = false;
  t.minFilter = LinearFilter;
  t.magFilter = LinearFilter;
  return t;
}

export interface HeroTextures {
  a: CanvasTexture;
  b: CanvasTexture;
  alpha: CanvasTexture;
  aspect: number;
  dispose(): void;
}

export function createPlaceholderTextures(variant: HeroVariant): HeroTextures {
  const p = palette();
  const shapes = variant === 1 ? APP : PAPER;

  // A i B mają tło (jak prawdziwe assety przed wycięciem), krawędź robi wyłącznie HERO-ALPHA.
  const a = canvas(p.piana);
  shapes.forEach((sh) => drawA(a.ctx, sh, p));

  const b = canvas(p.glebia);
  shapes.forEach((sh) => drawB(b.ctx, sh, p));
  flowLines(b.ctx, shapes, p);

  const alpha = canvas('black');
  alpha.ctx.fillStyle = 'white';
  shapes.forEach((sh) => inShape(alpha.ctx, sh, () => alpha.ctx.fill()));

  const textures = {
    a: texture(a.c, true),
    b: texture(b.c, true),
    alpha: texture(alpha.c, false),
  };

  return {
    ...textures,
    aspect: PLACEHOLDER_ASPECT,
    dispose() {
      Object.values(textures).forEach((t) => t.dispose());
    },
  };
}
