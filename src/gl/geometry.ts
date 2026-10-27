/**
 * geometry.ts — wspólne helpery geometrii obiektów hero (okno aplikacji, rdzeń z warstw).
 */

import {
  BufferAttribute,
  CurvePath,
  ExtrudeGeometry,
  LineCurve3,
  Path,
  QuadraticBezierCurve3,
  Shape,
  TubeGeometry,
  type BufferGeometry,
  type Color,
  type Curve,
  type Vector3,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// --- Geometria ---

export function roundedRect<T extends Path>(
  path: T,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  r: number
): T {
  const rr = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  path.moveTo(x0 + rr, y0);
  path.lineTo(x1 - rr, y0);
  path.quadraticCurveTo(x1, y0, x1, y0 + rr);
  path.lineTo(x1, y1 - rr);
  path.quadraticCurveTo(x1, y1, x1 - rr, y1);
  path.lineTo(x0 + rr, y1);
  path.quadraticCurveTo(x0, y1, x0, y1 - rr);
  path.lineTo(x0, y0 + rr);
  path.quadraticCurveTo(x0, y0, x0 + rr, y0);
  return path;
}

/** Płytka o zaokrąglonym obrysie od z0 do z1, z fazą na krawędziach. r ≥ połowy boku daje pigułkę. */
export function slab(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  z0: number,
  z1: number,
  r: number
) {
  const b = Math.min(0.012, (z1 - z0) / 4, (x1 - x0) / 6, (y1 - y0) / 6);
  const shape = roundedRect(new Shape(), x0 + b, y0 + b, x1 - b, y1 - b, r - b);
  const g = new ExtrudeGeometry(shape, {
    depth: z1 - z0 - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 3,
    curveSegments: 10,
  });
  g.translate(0, 0, z0 + b);
  return g;
}

/** Łamana z zaokrąglonymi narożnikami (trasy rur i linia monitoringu). */
export function polyline(points: Vector3[], r: number): CurvePath<Vector3> {
  const path = new CurvePath<Vector3>();
  let from = points[0]!.clone();
  for (let i = 1; i < points.length - 1; i++) {
    const prev = points[i - 1]!;
    const p = points[i]!;
    const next = points[i + 1]!;
    const rr = Math.min(r, p.distanceTo(prev) * 0.45, p.distanceTo(next) * 0.45);
    const c0 = p.clone().addScaledVector(p.clone().sub(prev).normalize(), -rr);
    const c1 = p.clone().addScaledVector(next.clone().sub(p).normalize(), rr);
    path.add(new LineCurve3(from, c0));
    path.add(new QuadraticBezierCurve3(c0, p.clone(), c1));
    from = c1;
  }
  path.add(new LineCurve3(from, points[points.length - 1]!.clone()));
  return path;
}

/** Rura po krzywej. uv.x = długość łuku, żeby impulsy miały równy odstęp na każdej rurze. */
export function tube(curve: Curve<Vector3>, radius: number, segments: number) {
  const g = new TubeGeometry(curve, segments, radius, 8, false);
  const length = curve.getLength();
  const uv = g.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * length);
  return g;
}

/** Wszystko do jednej geometrii: bez indeksów, bez grup, opcjonalnie z kolorem wierzchołków. */
export function merge(parts: { geometry: BufferGeometry; color?: Color }[]) {
  const prepared = parts.map(({ geometry, color }) => {
    const g = geometry.index ? geometry.toNonIndexed() : geometry;
    g.clearGroups();
    if (color) {
      const colors = new Float32Array(g.getAttribute('position').count * 3);
      for (let i = 0; i < colors.length; i += 3) colors.set([color.r, color.g, color.b], i);
      g.setAttribute('color', new BufferAttribute(colors, 3));
    }
    return g;
  });
  const merged = mergeGeometries(prepared);
  prepared.forEach((g) => g.dispose());
  parts.forEach(({ geometry }) => geometry.dispose());
  return merged;
}

/** Gradient Laguna w kolorze wierzchołków (dla materiałów standardowych warstwy A). */
export function paintLaguna(g: BufferGeometry, start: Color, end: Color, diag: number) {
  const pos = g.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  const c = start.clone();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.min(1, Math.max(0, ((-pos.getX(i) + pos.getY(i)) / diag) * 0.5 + 0.5));
    c.copy(end).lerp(start, t);
    colors.set([c.r, c.g, c.b], i * 3);
  }
  g.setAttribute('color', new BufferAttribute(colors, 3));
  return g;
}
