/**
 * PlateStack.ts — obiekt hero „warstwy systemu” (styl z referencji użytkownika, 2026-10-27):
 * kwadratowe płyty ułożone w stos, każda warstwa to jedna usługa. Od góry:
 * - Aplikacje: dwie cienkie szklane płyty z wytrawionym interfejsem,
 * - Integracje: szklana płyta z siecią połączeń, po której płyną impulsy,
 * - Automatyzacje: szklana skrzynka, w środku płytka drukowana ze świecącymi ścieżkami,
 * - Utrzymanie: ciemna metalowa podstawa ze ściętymi narożnikami i zielonymi paskami światła,
 *   pod nią smuga światła.
 *
 * Kształty 2D rysujemy w (x, sy) i kładziemy płasko: punkt (x, sy) trafia do (x, y, −sy).
 * Świecące elementy mają kolor HDR (> 1), więc łapie je bloom w module.
 */

import {
  AdditiveBlending,
  CircleGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  ExtrudeGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  ShaderMaterial,
  Shape,
  ShapeGeometry,
  Vector3,
  type BufferGeometry,
  type Material,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { merge, polyline, roundedRect, tube } from '@gl/geometry';
import lagunaGlsl from '@gl/shaders/laguna.glsl?raw';
import infraVert from '@gl/shaders/infra.vert?raw';
import pulseFrag from '@gl/shaders/pulse.frag?raw';
import beamVert from '@gl/shaders/beam.vert?raw';
import beamFrag from '@gl/shaders/beam.frag?raw';

/** bok płyt */
const W = 3;
const R = 0.16;
const GAP = 0.12;

/** Warstwy od góry. Etykiety z BRIEF.md (01 Hero, etykiety warstw). */
export const PLATE_LAYERS = [
  { key: 'aplikacje', label: 'Aplikacje', h: 0.17 },
  { key: 'integracje', label: 'Integracje', h: 0.08 },
  { key: 'automatyzacje', label: 'Automatyzacje', h: 0.42 },
  { key: 'utrzymanie', label: 'Utrzymanie', h: 0.5 },
] as const;

export interface PlateColors {
  biel: Color;
  pianaLine: Color;
  pianaDeep: Color;
  glebia: Color;
  glebiaLine: Color;
  glebiaRaise: Color;
  start: Color;
  end: Color;
}

export interface PlateOptions {
  glow: number;
  pulseSpacing: number;
  pulseLength: number;
  pulseBase: number;
  pulseGain: number;
  beam: number;
}

// --- Geometria ---

const P = (x: number, sy: number, y: number) => new Vector3(x, y, -sy);

function flat<T extends BufferGeometry>(g: T, y: number): T {
  g.rotateX(-Math.PI / 2);
  g.translate(0, y, 0);
  return g;
}

function extrude(shape: Shape, y0: number, y1: number, bevel = 0.015) {
  const b = Math.min(bevel, (y1 - y0) / 4);
  const g = new ExtrudeGeometry(shape, {
    depth: y1 - y0 - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 3,
    curveSegments: 12,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + b, 0);
  return g;
}

const square = (w: number, r: number) => roundedRect(new Shape(), -w / 2, -w / 2, w / 2, w / 2, r);

/** kwadrat ze ściętymi narożnikami (podstawa) */
function octagon(w: number, c: number) {
  const h = w / 2;
  const s = new Shape();
  s.moveTo(-h + c, -h);
  s.lineTo(h - c, -h);
  s.lineTo(h, -h + c);
  s.lineTo(h, h - c);
  s.lineTo(h - c, h);
  s.lineTo(-h + c, h);
  s.lineTo(-h, h - c);
  s.lineTo(-h, -h + c);
  s.closePath();
  return s;
}

/** obrys kwadratu o zaokrąglonych rogach jako płaska wstęga szerokości lineW */
function outline(w: number, r: number, lineW: number, y: number) {
  const s = square(w, r);
  s.holes.push(
    roundedRect(new Path(), -w / 2 + lineW, -w / 2 + lineW, w / 2 - lineW, w / 2 - lineW, r - lineW)
  );
  return flat(new ShapeGeometry(s, 12), y);
}

function rectOutline(
  x0: number,
  sy0: number,
  x1: number,
  sy1: number,
  lineW: number,
  y: number,
  r = 0.04
) {
  const s = roundedRect(new Shape(), x0, sy0, x1, sy1, r);
  s.holes.push(
    roundedRect(new Path(), x0 + lineW, sy0 + lineW, x1 - lineW, sy1 - lineW, r - lineW)
  );
  return flat(new ShapeGeometry(s, 8), y);
}

function flatRect(x0: number, sy0: number, x1: number, sy1: number, y: number, r = 0) {
  return flat(new ShapeGeometry(roundedRect(new Shape(), x0, sy0, x1, sy1, r), 6), y);
}

function trace(points: [number, number][], y: number, radius: number) {
  const curve = polyline(
    points.map(([x, sy]) => P(x, sy, y)),
    0.05
  );
  return tube(curve, radius, Math.max(12, Math.ceil(curve.getLength() * 50)));
}

function box(w: number, h: number, d: number, x: number, sy: number, y: number) {
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.25);
  g.translate(x, y + h / 2, -sy);
  return g;
}

/** deterministyczny generator, żeby płytka wyglądała tak samo przy każdym wejściu */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Obiekt ---

export function createPlateStack(colors: PlateColors, options: PlateOptions) {
  const { start, end, glebia, glebiaRaise } = colors;
  let power = 0;
  let opts = options;

  // materiały
  const glass = new MeshPhysicalMaterial({
    color: colors.pianaLine,
    transmission: 1,
    roughness: 0.05,
    thickness: 0.3,
    envMapIntensity: 0.7,
    ior: 1.4,
    attenuationColor: start,
    attenuationDistance: 3,
    specularIntensity: 1,
  });
  const metal = new MeshStandardMaterial({ color: glebiaRaise, metalness: 0.85, roughness: 0.36 });
  const metalDark = new MeshStandardMaterial({ color: glebia, metalness: 0.6, roughness: 0.5 });
  const board = new MeshStandardMaterial({ color: glebiaRaise, metalness: 0.3, roughness: 0.55 });
  const chip = new MeshStandardMaterial({ color: glebia, metalness: 0.4, roughness: 0.32 });
  const pin = new MeshStandardMaterial({ color: colors.pianaDeep, metalness: 1, roughness: 0.3 });

  /** świecące materiały: kolor bazowy × wzmocnienie × moc (intro) × oddech */
  const glows: { material: MeshBasicMaterial; base: Color; gain: number; breathe: boolean }[] = [];
  const glow = (base: Color, gain: number, breathe = false) => {
    const material = new MeshBasicMaterial({ color: base.clone(), toneMapped: false });
    glows.push({ material, base, gain, breathe });
    return material;
  };
  const glowCyan = glow(start, 1.6);
  const glowCyanSoft = glow(start, 0.55);
  const glowGreen = glow(end, 3, true);
  const glowEdge = glow(start, 0.8);

  const pulse = new ShaderMaterial({
    vertexShader: infraVert,
    fragmentShader: `${lagunaGlsl}\n${pulseFrag}`,
    uniforms: {
      uStart: { value: start },
      uEnd: { value: end },
      uDiag: { value: W },
      uCore: { value: glebiaRaise },
      uHot: { value: colors.biel },
      uPhase: { value: 0 },
      uSpacing: { value: options.pulseSpacing },
      uLength: { value: options.pulseLength },
      uBase: { value: options.pulseBase },
      uPower: { value: 0 },
      uGain: { value: options.pulseGain },
    },
  });

  const beamMaterial = new ShaderMaterial({
    vertexShader: beamVert,
    fragmentShader: beamFrag,
    uniforms: { uColor: { value: start }, uStrength: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });

  const mesh = (parts: BufferGeometry[], material: Material) =>
    new Mesh(merge(parts.map((geometry) => ({ geometry }))), material);

  const root = new Group();

  // pozycje w złożeniu: od dołu, środek stosu w y = 0
  const total = PLATE_LAYERS.reduce((s, l) => s + l.h, 0) + GAP * (PLATE_LAYERS.length - 1);
  let cursor = -total / 2;
  const baseY = [...PLATE_LAYERS]
    .reverse()
    .map((l) => {
      const y = cursor;
      cursor += l.h + GAP;
      return y;
    })
    .reverse();

  const layers = PLATE_LAYERS.map((def, index) => {
    const { h } = def;
    const group = new Group();
    group.position.y = baseY[index]!;
    const hits: Mesh[] = [];
    const add = (m: Mesh, hit = false) => {
      group.add(m);
      if (hit) {
        m.userData.layer = index;
        hits.push(m);
      }
      return m;
    };

    if (def.key === 'aplikacje') {
      // dwie cienkie płyty, na górnej wytrawiony interfejs
      add(new Mesh(extrude(square(W, R), 0, 0.05), glass), true);
      add(new Mesh(extrude(square(W, R), 0.12, h), glass), true);
      const top = h + 0.002;
      add(mesh([outline(W - 0.02, R, 0.012, top), outline(W - 0.02, R, 0.012, 0.052)], glowEdge));
      add(
        mesh(
          [
            outline(W - 0.36, 0.08, 0.008, top),
            flatRect(-1.18, 0.98, -0.88, 1.06, top, 0.02),
            flatRect(-0.62, -1.18, -0.6, 0.9, top),
            flatRect(-1.18, 0.66, -0.8, 0.7, top),
            flatRect(-1.18, 0.5, -0.9, 0.54, top),
            flatRect(-1.18, 0.34, -0.85, 0.38, top),
            flatRect(-1.18, 0.18, -0.95, 0.22, top),
            flatRect(-0.42, 0.95, 0.4, 1.05, top, 0.03),
            flatRect(0.95, 0.95, 1.18, 1.05, top, 0.05),
            rectOutline(-0.42, -1.12, 0.3, -0.4, 0.008, top),
            rectOutline(0.42, -1.12, 1.18, -0.4, 0.008, top),
            flatRect(-0.32, -0.55, 0.1, -0.5, top, 0.02),
            flatRect(0.52, -0.55, 0.9, -0.5, top, 0.02),
          ],
          glowCyanSoft
        )
      );
      add(
        mesh(
          [
            trace(
              [
                [-0.4, -0.1],
                [-0.05, 0.12],
                [0.25, 0.02],
                [0.55, 0.38],
                [0.85, 0.3],
                [1.15, 0.62],
              ],
              top + 0.004,
              0.007
            ),
            flatRect(-1.18, 0.98, -0.88, 1.06, top + 0.002, 0.02),
          ],
          glowCyan
        )
      );
    }

    if (def.key === 'integracje') {
      // sieć połączeń: węzły na okręgu i w środku, impulsy płyną krawędziami
      add(new Mesh(extrude(square(W, R), 0, h), glass), true);
      const top = h + 0.002;
      add(mesh([outline(W - 0.02, R, 0.012, top)], glowEdge));
      const nodes: [number, number][] = [[0, 0]];
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + 0.3;
        nodes.push([Math.cos(a) * 0.95, Math.sin(a) * 0.95]);
      }
      const edges: BufferGeometry[] = [];
      for (let i = 1; i <= 6; i++) {
        edges.push(trace([nodes[0]!, nodes[i]!], top + 0.004, 0.007));
        edges.push(trace([nodes[i]!, nodes[(i % 6) + 1]!], top + 0.004, 0.006));
      }
      add(mesh(edges, pulse));
      add(
        mesh(
          nodes.map(([x, sy], i) => {
            const c = new CircleGeometry(i === 0 ? 0.09 : 0.055, 24);
            c.translate(x, sy, 0);
            return flat(c, top + 0.006);
          }),
          glowCyan
        )
      );
    }

    if (def.key === 'automatyzacje') {
      // szklana skrzynka z płytką drukowaną
      add(new Mesh(extrude(square(W * 0.97, R), 0, h, 0.03), glass), true);
      add(mesh([outline(W * 0.97 - 0.02, R, 0.012, h + 0.002)], glowEdge));
      const by = 0.12;
      add(new Mesh(extrude(square(W * 0.84, 0.1), 0.08, by, 0.01), board));

      const rand = rng(7);
      const chips: BufferGeometry[] = [box(0.62, 0.08, 0.62, 0, 0, by)];
      const pins: BufferGeometry[] = [];
      for (let k = 0; k < 10; k++) {
        const t = -0.25 + (k / 9) * 0.5;
        pins.push(box(0.02, 0.015, 0.07, t, 0.35, by), box(0.02, 0.015, 0.07, t, -0.35, by));
        pins.push(box(0.07, 0.015, 0.02, 0.35, t, by), box(0.07, 0.015, 0.02, -0.35, t, by));
      }
      const smallChips: [number, number][] = [
        [-0.85, 0.75],
        [0.8, 0.8],
        [-0.9, -0.7],
        [0.85, -0.75],
        [0.0, 0.95],
        [0.0, -0.95],
        [-1.0, 0.05],
        [1.0, 0.0],
      ];
      smallChips.forEach(([x, sy]) => {
        const w = 0.18 + rand() * 0.16;
        const d = 0.12 + rand() * 0.14;
        chips.push(box(w, 0.05, d, x, sy, by));
        for (let k = 0; k < 4; k++) {
          const t = -w / 2 + ((k + 0.5) / 4) * w;
          pins.push(box(0.015, 0.012, 0.04, x + t, sy + d / 2 + 0.02, by));
          pins.push(box(0.015, 0.012, 0.04, x + t, sy - d / 2 - 0.02, by));
        }
      });
      add(mesh(chips, chip));
      add(mesh(pins, pin));
      add(mesh([outline(0.5, 0.04, 0.012, by + 0.082)], glowCyan));

      // ścieżki: z krawędzi środkowego układu na zewnątrz, z jednym lub dwoma zakrętami
      const traces: BufferGeometry[] = [];
      const pads: BufferGeometry[] = [];
      const ty = by + 0.004;
      const edge = 1.18;
      for (let k = 0; k < 36; k++) {
        const side = k % 4;
        const t = -0.27 + ((Math.floor(k / 4) + 0.5) / 9) * 0.54;
        const out = 0.42 + rand() * 0.3;
        const bend = (rand() - 0.5) * 0.9;
        // ścieżka w układzie „na prawo”, obracana na cztery strony
        const local: [number, number][] = [
          [0.31, t],
          [out, t],
          [out + 0.15, t + bend * 0.3],
          [edge, t + bend * 0.3],
        ];
        const rot = (side * Math.PI) / 2;
        const pts = local.map(
          ([x, sy]) =>
            [x * Math.cos(rot) - sy * Math.sin(rot), x * Math.sin(rot) + sy * Math.cos(rot)] as [
              number,
              number,
            ]
        );
        traces.push(trace(pts, ty, 0.007));
        const [px, psy] = pts[pts.length - 1]!;
        pads.push(flatRect(px - 0.025, psy - 0.025, px + 0.025, psy + 0.025, ty + 0.002, 0.008));
      }
      add(mesh(traces, pulse));
      add(mesh(pads, glowCyanSoft));
    }

    if (def.key === 'utrzymanie') {
      // metalowa podstawa w dwóch stopniach, rowek między nimi, zielone paski światła
      add(new Mesh(extrude(octagon(W * 1.05, 0.38), 0, 0.24, 0.025), metal), true);
      add(new Mesh(extrude(octagon(W * 0.97, 0.34), 0.235, 0.27, 0.005), metalDark));
      add(new Mesh(extrude(octagon(W * 0.99, 0.35), 0.27, 0.46, 0.02), metal), true);
      add(new Mesh(extrude(octagon(W * 0.82, 0.28), 0.46, h, 0.01), metalDark));

      const strips: BufferGeometry[] = [];
      const half = (W * 1.05) / 2;
      // paski na bokach dolnego stopnia
      for (let s = 0; s < 4; s++) {
        const g = new RoundedBoxGeometry(1.5, 0.025, 0.02, 1, 0.008);
        g.translate(0, 0.12, half + 0.004);
        g.rotateY((s * Math.PI) / 2);
        strips.push(g);
      }
      // kątowniki przy narożnikach i kreski na środkach krawędzi, na wierzchu
      const top = h + 0.003;
      for (let s = 0; s < 4; s++) {
        const parts = [
          flatRect(0.5, 0.86, 0.89, 0.89, 0),
          flatRect(0.86, 0.5, 0.89, 0.86, 0),
          flatRect(-0.35, 1.02, 0.35, 1.05, 0),
        ];
        parts.forEach((g) => {
          g.rotateY((s * Math.PI) / 2);
          g.translate(0, top, 0);
          strips.push(g);
        });
      }
      add(mesh(strips, glowGreen));

      // smuga światła pod podstawą
      const beam = new CylinderGeometry(1.25, 1.9, 3.2, 48, 1, true);
      beam.translate(0, -1.6, 0);
      const beamMesh = new Mesh(beam, beamMaterial);
      beamMesh.renderOrder = 1;
      group.add(beamMesh);
    }

    root.add(group);
    return { ...def, index, group, hits, baseY: baseY[index]!, mid: h / 2, r: W / 2 };
  });

  return {
    root,
    layers,
    height: total,
    /** promień do wyliczania skali i odsunięcia etykiet (połowa przekątnej) */
    radius: (W * Math.SQRT2) / 2,
    housings: layers.flatMap((l) => l.hits),
    fitSpine() {},
    /** 0 = wyłączone (ciemne), 1 = świeci */
    setPower(v: number) {
      pulse.uniforms.uPower!.value = v;
      beamMaterial.uniforms.uStrength!.value = v * opts.beam;
      power = v;
    },
    update(dt: number, time: number, pulseSpeed: number, o: PlateOptions) {
      opts = o;
      const u = pulse.uniforms;
      u.uPhase!.value += dt * pulseSpeed;
      u.uSpacing!.value = o.pulseSpacing;
      u.uLength!.value = o.pulseLength;
      u.uBase!.value = o.pulseBase;
      u.uGain!.value = o.pulseGain;
      beamMaterial.uniforms.uStrength!.value = power * o.beam;
      const breath = 0.88 + 0.12 * Math.sin(time * 1.7);
      glows.forEach(({ material, base, gain, breathe }) => {
        const level = (0.1 + 0.9 * power) * (breathe ? breath : 1) * gain * o.glow;
        material.color.copy(base).multiplyScalar(level);
      });
    },
    dispose() {
      root.traverse((obj) => {
        if (obj instanceof Mesh) obj.geometry.dispose();
      });
      [
        glass,
        metal,
        metalDark,
        board,
        chip,
        pin,
        pulse,
        beamMaterial,
        ...glows.map((g) => g.material),
      ].forEach((m) => m.dispose());
    },
  };
}

export type PlateStack = ReturnType<typeof createPlateStack>;
