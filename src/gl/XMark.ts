/**
 * XMark.ts — geometria znaku x z wordmarku: dwie kapsuły (kreski z zaokrąglonymi końcami).
 * Kolor wierzchołków = gradient Laguna po przekątnej całego znaku (start u góry z lewej,
 * koniec u dołu z prawej, jak w logo). Klatka = siatka większych kapsuł („kask” warstwy B).
 */

import {
  BufferAttribute,
  CapsuleGeometry,
  Color,
  Vector3,
  WireframeGeometry,
  type BufferGeometry,
} from 'three';

/** Proporcje z brand boardu: kreska ~6× dłuższa niż gruba, ~32° od pionu */
export const X_RADIUS = 0.34;
export const X_LENGTH = 3.4;
export const X_ANGLE = 0.56;
/** kreski rozsunięte w głębi: skrzyżowanie czyta się jako jedna kreska przed drugą */
export const X_DEPTH = X_RADIUS * 1.1;

export interface XStroke {
  geometry: BufferGeometry;
  cage: BufferGeometry;
  angle: number;
  z: number;
}

export function createXStrokes(start: Color, end: Color): XStroke[] {
  const strokes = [X_ANGLE, -X_ANGLE].map((angle, i) => ({
    geometry: new CapsuleGeometry(X_RADIUS, X_LENGTH, 24, 64) as BufferGeometry,
    cage: new WireframeGeometry(new CapsuleGeometry(X_RADIUS, X_LENGTH, 4, 14, 6)),
    angle,
    z: i === 0 ? X_DEPTH : -X_DEPTH,
  }));

  // przekątna (−x + y) w układzie znaku, znormalizowana na oba kreski razem
  const v = new Vector3();
  const diag = strokes.map(({ geometry, angle }) => {
    const pos = geometry.getAttribute('position');
    const values = new Float32Array(pos.count);
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i).applyAxisAngle(new Vector3(0, 0, 1), angle);
      values[i] = -v.x + v.y;
    }
    return values;
  });
  const all = diag.flatMap((d) => Array.from(d));
  const min = Math.min(...all);
  const max = Math.max(...all);

  const c = new Color();
  strokes.forEach(({ geometry }, s) => {
    const d = diag[s];
    const colors = new Float32Array(d.length * 3);
    for (let i = 0; i < d.length; i++) {
      c.copy(end).lerp(start, (d[i] - min) / (max - min));
      colors.set([c.r, c.g, c.b], i * 3);
    }
    geometry.setAttribute('color', new BufferAttribute(colors, 3));
  });

  return strokes;
}

/** Skala klatki w lokalnym układzie kapsuły: promień × s, długość rośnie o tyle samo. */
export function cageScale(s: number): [number, number, number] {
  const total = X_LENGTH + 2 * X_RADIUS;
  return [s, (total + 2 * X_RADIUS * (s - 1)) / total, s];
}
