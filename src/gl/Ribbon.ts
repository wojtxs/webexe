/**
 * Ribbon.ts — wstęga z kodu (spike hero „wstęga”, /lab/hero-ribbon).
 *
 * Środek wstęgi liczy CPU: SAMPLES próbek z pozycją, osią szerokości, normalną, długością łuku
 * i „prasowaniem” (ślad kursora). Vertex shader czyta je z tekstury danych i tylko rozpina pasek
 * oraz dokłada falowanie. Dzięki temu morph pętla → płachta, skręt i ślad kursora są w jednym miejscu.
 * Kod na wstędze to tekstura z canvasu (prawdziwe źródła strony), wiersze biegną w poprzek wstęgi.
 */

import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DataTexture,
  DoubleSide,
  FloatType,
  Group,
  Mesh,
  NearestFilter,
  RGBAFormat,
  RepeatWrapping,
  ShaderMaterial,
  Vector3,
  type Camera,
  type Color,
  type IUniform,
} from 'three';
import vert from './shaders/ribbon.vert?raw';
import frag from './shaders/ribbon.frag?raw';

/** musi się zgadzać z SAMPLES w ribbon.vert */
const SAMPLES = 512;
const SEG_U = 720;
const SEG_V = 18;
const MAX_ECHO = 8;

// tekstura kodu: kafel 1024 × 4096, wiersze w poprzek wstęgi
const TEX_W = 1024;
const TEX_H = 4096;
const LINE_H = 44;

export interface RibbonColors {
  base: Color;
  start: Color;
  end: Color;
  ink: Color;
}

export interface RibbonShape {
  loopLength: number;
  loopRadius: number;
  loopDepth: number;
  /** kąt pętli na początku i końcu wstęgi, w wielokrotnościach π */
  thetaStart: number;
  thetaEnd: number;
  twist: number;
  twistFreq: number;
  twistSpeed: number;
  breath: number;
  breathSpeed: number;
  /** wysunięcie prasowanego fragmentu do kamery */
  ironLift: number;
  /** 0 = pętla, 1 = płaska pionowa płachta */
  sheet: number;
  sheetLength: number;
  /** przesunięcie płachty w górę (jednostki lokalne) */
  sheetOffset: number;
}

export interface IronInput {
  camera: Camera;
  /** kursor w CSS px; null = brak wskaźnika, ślad tylko wygasa */
  x: number | null;
  y: number;
  width: number;
  height: number;
  radius: number;
  rise: number;
  fall: number;
  /** minimalne prasowanie całej wstęgi (płachta = 1) */
  floor: number;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const frameLerp = (amount: number, dt: number) => 1 - Math.pow(1 - amount, dt * 60);

/** Wiersze kodu do tekstury: bez pustych na początku, przycięte do szerokości wstęgi. */
function codeLines(sources: string[], cols: number): string[] {
  const lines = sources
    .join('\n\n')
    .replace(/\r/g, '')
    .split('\n')
    .map((l) => l.replace(/\t/g, '  '))
    .map((l) => (l.length > cols ? `${l.slice(0, cols - 1)}…` : l));
  while (lines[0]?.trim() === '') lines.shift();
  return lines;
}

function createCodeTexture(sources: string[], cols: number, maxAnisotropy: number): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext('2d')!;
  const advance = (TEX_W - 48) / cols;
  const size = Math.round(advance / 0.6);
  ctx.font = `500 ${size}px ui-monospace, "Cascadia Code", Consolas, Menlo, monospace`;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'white';

  const rows = Math.floor(TEX_H / LINE_H);
  const lines = codeLines(sources, cols);
  for (let r = 0; r < rows; r++) {
    const line = lines[r % lines.length] ?? '';
    const trimmed = line.trim();
    // komentarze ciszej, reszta pełnym kryciem: odrobina „składni” bez kolorów
    const comment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*');
    ctx.globalAlpha = comment ? 0.45 : 0.92;
    ctx.fillText(line, 24, r * LINE_H + LINE_H / 2);
  }

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

function createStrip(): BufferGeometry {
  const geo = new BufferGeometry();
  const count = (SEG_U + 1) * (SEG_V + 1);
  const pos = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  for (let i = 0; i <= SEG_U; i++) {
    for (let j = 0; j <= SEG_V; j++) {
      const k = i * (SEG_V + 1) + j;
      uv[k * 2] = i / SEG_U;
      uv[k * 2 + 1] = j / SEG_V;
      // pozycję liczy shader, tu tylko placeholder
      pos[k * 3] = i / SEG_U;
      pos[k * 3 + 1] = j / SEG_V;
    }
  }
  const index: number[] = [];
  for (let i = 0; i < SEG_U; i++) {
    for (let j = 0; j < SEG_V; j++) {
      const a = i * (SEG_V + 1) + j;
      const b = a + SEG_V + 1;
      index.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  geo.setAttribute('position', new BufferAttribute(pos, 3));
  geo.setAttribute('uv', new BufferAttribute(uv, 2));
  geo.setIndex(index);
  return geo;
}

export function createRibbon(
  colors: RibbonColors,
  sources: string[],
  options: { cols: number; maxAnisotropy: number }
) {
  const root = new Group();
  const data = new Float32Array(SAMPLES * 3 * 4);
  const curveTex = new DataTexture(data, SAMPLES, 3, RGBAFormat, FloatType);
  curveTex.minFilter = NearestFilter;
  curveTex.magFilter = NearestFilter;
  curveTex.needsUpdate = true;
  const codeTex = createCodeTexture(sources, options.cols, options.maxAnisotropy);

  const uniforms: Record<string, IUniform> = {
    uCurve: { value: curveTex },
    uCode: { value: codeTex },
    uTexLen: { value: 1 },
    uWidth: { value: 0.6 },
    uTime: { value: 0 },
    uRipple: { value: 0 },
    uRippleFreq: { value: 8 },
    uEchoGap: { value: 0.02 },
    uEchoFan: { value: 1 },
    uBase: { value: colors.base },
    uStart: { value: colors.start },
    uEnd: { value: colors.end },
    uInk: { value: colors.ink },
    uTint: { value: 0.5 },
    uSpec: { value: 0.5 },
    uGloss: { value: 40 },
    uRim: { value: 0.8 },
    uEdge: { value: 0.5 },
    uTextDim: { value: 0.35 },
    uTextGain: { value: 1 },
    uDraw: { value: 1 },
    uDim: { value: 1 },
  };

  const geometry = createStrip();
  const meshes: Mesh[] = [];
  for (let k = 0; k <= MAX_ECHO; k++) {
    // wspólne obiekty uniformów, osobny tylko numer warstwy
    const material = new ShaderMaterial({
      vertexShader: vert,
      fragmentShader: frag,
      uniforms: { ...uniforms, uLayer: { value: k } },
      side: DoubleSide,
    });
    const mesh = new Mesh(geometry, material);
    mesh.frustumCulled = false;
    root.add(mesh);
    meshes.push(mesh);
  }

  const iron = new Float32Array(SAMPLES);
  const blur = new Float32Array(SAMPLES);
  const pts = Array.from({ length: SAMPLES }, () => new Vector3());
  const tmp = new Vector3();
  const tangent = new Vector3();
  const side = new Vector3();
  const normal = new Vector3();
  const zAxis = new Vector3(0, 0, 1);

  /** Ślad kursora: próbki blisko wskaźnika (na ekranie) szybko się prasują, potem powoli wracają. */
  function updateIron(dt: number, input: IronInput) {
    root.updateMatrixWorld(true);
    const rise = frameLerp(input.rise, dt);
    const fall = frameLerp(input.fall, dt);
    for (let i = 0; i < SAMPLES; i++) {
      let target = 0;
      if (input.x !== null) {
        tmp.copy(pts[i]!).applyMatrix4(root.matrixWorld).project(input.camera);
        const sx = (tmp.x * 0.5 + 0.5) * input.width;
        const sy = (-tmp.y * 0.5 + 0.5) * input.height;
        const d = Math.hypot(sx - input.x, sy - input.y) / input.radius;
        target = d < 1 ? 1 - d * d * (3 - 2 * d) : 0;
      }
      const v = iron[i]!;
      iron[i] = v + (target - v) * (target > v ? rise : fall);
    }
    // wygładzenie wzdłuż wstęgi, żeby ślad nie łamał paska
    for (let i = 0; i < SAMPLES; i++) {
      const a = iron[Math.max(i - 1, 0)]!;
      const b = iron[Math.min(i + 1, SAMPLES - 1)]!;
      blur[i] = Math.max(input.floor, a * 0.25 + iron[i]! * 0.5 + b * 0.25);
    }
  }

  function updateCurve(time: number, s: RibbonShape, introTwist: number) {
    const sheet = s.sheet;
    for (let i = 0; i < SAMPLES; i++) {
      const t = i / (SAMPLES - 1);
      const th = Math.PI * lerp(s.thetaStart, s.thetaEnd, t);
      const lx = s.loopLength * (t - 0.5) + s.loopRadius * Math.sin(th);
      const ly = -s.loopRadius * Math.cos(th) + s.breath * Math.sin(time * s.breathSpeed + t * 5);
      const lz =
        s.loopDepth * Math.sin(th) +
        s.breath * Math.cos(time * s.breathSpeed * 0.8 + t * 4) +
        s.ironLift * blur[i]!;
      const sy = (0.5 - t) * s.sheetLength + s.sheetOffset;
      pts[i]!.set(lerp(lx, 0, sheet), lerp(ly, sy, sheet), lerp(lz, 0, sheet));
    }

    let arc = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const prev = pts[Math.max(i - 1, 0)]!;
      const next = pts[Math.min(i + 1, SAMPLES - 1)]!;
      tangent.subVectors(next, prev).normalize();
      // szerokość prostopadle do osi widoku: wstęga domyślnie patrzy w kamerę
      side.crossVectors(zAxis, tangent).normalize();
      normal.crossVectors(tangent, side);

      const t = i / (SAMPLES - 1);
      const calm = (1 - sheet) * (1 - blur[i]!);
      const phi =
        s.twist *
        (1 + 2 * introTwist) *
        Math.sin(2 * Math.PI * t * s.twistFreq + time * s.twistSpeed) *
        calm;
      const c = Math.cos(phi);
      const sn = Math.sin(phi);
      if (i > 0) arc += pts[i]!.distanceTo(pts[i - 1]!);

      const o = i * 4;
      const p = pts[i]!;
      data[o] = p.x;
      data[o + 1] = p.y;
      data[o + 2] = p.z;
      data[o + 3] = blur[i]!;
      const o1 = (SAMPLES + i) * 4;
      data[o1] = side.x * c + normal.x * sn;
      data[o1 + 1] = side.y * c + normal.y * sn;
      data[o1 + 2] = side.z * c + normal.z * sn;
      data[o1 + 3] = arc;
      const o2 = (2 * SAMPLES + i) * 4;
      data[o2] = normal.x * c - side.x * sn;
      data[o2 + 1] = normal.y * c - side.y * sn;
      data[o2 + 2] = normal.z * c - side.z * sn;
    }
    curveTex.needsUpdate = true;
  }

  return {
    root,
    uniforms,
    updateIron,
    updateCurve,
    /** długość łuku kafla kodu dla danej szerokości: znaki zachowują proporcje */
    texLen: (width: number) => (TEX_H / TEX_W) * width,
    setEchoes(count: number) {
      meshes.forEach((m, k) => (m.visible = k <= Math.min(count, MAX_ECHO)));
    },
    dispose() {
      geometry.dispose();
      meshes.forEach((m) => (m.material as ShaderMaterial).dispose());
      curveTex.dispose();
      codeTex.dispose();
    },
  };
}

export type Ribbon = ReturnType<typeof createRibbon>;
