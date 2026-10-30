/**
 * polyline.ts — punkt na łamanej według ułamka długości (0…1).
 * Używane przez żywą warstwę hero: render w Astro (stan początkowy) i moduł hero-live (ruch).
 */

export type Point = [number, number];

export interface Polyline {
  points: Point[];
  /** Długość od początku do każdego punktu */
  lengths: number[];
  total: number;
}

export function polyline(points: Point[]): Polyline {
  const lengths = [0];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i - 1];
    const [x2, y2] = points[i];
    lengths.push(lengths[i - 1] + Math.hypot(x2 - x1, y2 - y1));
  }
  return { points, lengths, total: lengths[lengths.length - 1] };
}

export function pointAt({ points, lengths, total }: Polyline, t: number): Point {
  const target = Math.min(Math.max(t, 0), 1) * total;
  let i = 1;
  while (i < lengths.length - 1 && lengths[i] < target) i++;
  const span = lengths[i] - lengths[i - 1] || 1;
  const k = (target - lengths[i - 1]) / span;
  const [x1, y1] = points[i - 1];
  const [x2, y2] = points[i];
  return [x1 + (x2 - x1) * k, y1 + (y2 - y1) * k];
}

export function pathD(points: Point[]): string {
  return points.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join('');
}
