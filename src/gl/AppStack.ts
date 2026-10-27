/**
 * AppStack.ts — obiekt hero „rentgen aplikacji”: okno aplikacji (warstwa A) i infrastruktura
 * pod nim (warstwa B) w tym samym obrysie. Układ lokalny: środek okna w (0, 0), front w stronę +z.
 *
 * A: matowe panele UI rozsunięte w głębi (baza, karty, treść). Treść abstrakcyjna, bez tekstu.
 * B: skrzynka z maszynownią. Każdy element UI ma pod sobą to, co go obsługuje:
 *    menu → szafa serwerowa, wykres → monitoring, tabela → baza danych, karta statusu → kopie.
 *    Rury z impulsami danych łączą części.
 * Duch: krawędzie maszynowni i osie rur, widoczne zawsze, słabo.
 */

import {
  CatmullRomCurve3,
  CircleGeometry,
  CylinderGeometry,
  EdgesGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Path,
  ShaderMaterial,
  Shape,
  TorusGeometry,
  Vector3,
  BufferGeometry,
  type Color,
} from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { merge, paintLaguna, polyline, roundedRect, slab, tube } from '@gl/geometry';
import lagunaGlsl from '@gl/shaders/laguna.glsl?raw';
import infraVert from '@gl/shaders/infra.vert?raw';
import infraFrag from '@gl/shaders/infra.frag?raw';
import pulseFrag from '@gl/shaders/pulse.frag?raw';
import ledVert from '@gl/shaders/led.vert?raw';
import ledFrag from '@gl/shaders/led.frag?raw';

export const APP_W = 4.2;
export const APP_H = 3.0;
const APP_R = 0.16;
const DIAG = (APP_W + APP_H) / 2;

/** głębokość skrzynki maszynowni (tył na z = −CASE_DEPTH) */
const CASE_DEPTH = 0.72;
const PIPE_Z = -0.5;

export interface AppColors {
  piana: Color;
  pianaLine: Color;
  pianaDeep: Color;
  biel: Color;
  glebia: Color;
  glebiaLine: Color;
  glebiaRaise: Color;
  start: Color;
  end: Color;
}

export interface AppStackOptions {
  gridDensity: number;
  gridAlpha: number;
  rim: number;
  pulseSpacing: number;
  pulseLength: number;
  pulseBase: number;
}

/** Ramka: obrys okna z otworem (ścianki skrzynki, świecąca krawędź). */
function frame(inset: number, z0: number, z1: number) {
  const x = APP_W / 2;
  const y = APP_H / 2;
  const shape = roundedRect(new Shape(), -x, -y, x, y, APP_R);
  shape.holes.push(
    roundedRect(new Path(), -x + inset, -y + inset, x - inset, y - inset, APP_R - inset)
  );
  const g = new ExtrudeGeometry(shape, { depth: z1 - z0, bevelEnabled: false, curveSegments: 12 });
  g.translate(0, 0, z0);
  return g;
}

// --- Obiekt ---

export function createAppStack(colors: AppColors, options: AppStackOptions) {
  const { start, end } = colors;

  // ===== Warstwa A: aplikacja =====
  // z: baza 0–0.08, karty od CARD_Z, treść od CONTENT_Z; grupy kart i treści rozsuwa explode
  const CARD_Z = 0.08;
  const CARD_D = 0.06;
  const CONTENT_D = 0.025;
  const c0 = 0; // treść liczona od wierzchu karty, grupa content przesuwa się w z

  type Key = 'base' | 'card' | 'muted' | 'ink' | 'laguna';
  const buckets: Record<'base' | 'card' | 'content', Partial<Record<Key, BufferGeometry[]>>> = {
    base: {},
    card: {},
    content: {},
  };
  const put = (layer: keyof typeof buckets, key: Key, g: BufferGeometry) => {
    (buckets[layer][key] ??= []).push(g);
  };
  const pill = (x0: number, y0: number, x1: number, y1: number, z = c0, d = CONTENT_D) =>
    slab(x0, y0, x1, y1, z, z + d, (y1 - y0) / 2);
  const dot = (x: number, y: number, r: number, z = c0, d = CONTENT_D) =>
    slab(x - r, y - r, x + r, y + r, z, z + d, r);

  // baza okna i pasek górny
  put('base', 'base', slab(-APP_W / 2, -APP_H / 2, APP_W / 2, APP_H / 2, 0, CARD_Z, APP_R));
  put('base', 'ink', pill(-1.95, 1.2, -1.5, 1.32, CARD_Z));
  [-1.05, -0.55, -0.05].forEach((x) => put('base', 'muted', pill(x, 1.21, x + 0.35, 1.31, CARD_Z)));
  put('base', 'muted', dot(1.88, 1.26, 0.08, CARD_Z));

  // karty
  const cards: [number, number, number, number][] = [
    [-1.95, -1.35, -1.2, 1.02], // menu
    [-1.05, 0.0, 1.95, 1.02], // wykres
    [-1.05, -1.35, 0.85, -0.15], // tabela
    [1.0, -1.35, 1.95, -0.15], // status
  ];
  cards.forEach(([x0, y0, x1, y1]) => put('card', 'card', slab(x0, y0, x1, y1, 0, CARD_D, 0.1)));

  // menu
  [0.82, 0.56, 0.3, 0.04, -0.22].forEach((y, i) =>
    put('content', i === 0 ? 'ink' : 'muted', pill(-1.82, y - 0.05, -1.33 - i * 0.04, y + 0.05))
  );
  put('content', 'muted', pill(-1.82, -1.2, -1.55, -1.12));

  // wykres
  put('content', 'ink', pill(-0.9, 0.82, -0.4, 0.91));
  put('content', 'muted', pill(-0.9, 0.7, -0.62, 0.76));
  put('content', 'muted', pill(1.3, 0.83, 1.5, 0.9));
  put('content', 'muted', pill(1.58, 0.83, 1.8, 0.9));
  const chart = new CatmullRomCurve3(
    [
      [-0.9, 0.2],
      [-0.55, 0.3],
      [-0.25, 0.24],
      [0.1, 0.42],
      [0.45, 0.36],
      [0.8, 0.5],
      [1.15, 0.46],
      [1.5, 0.6],
      [1.8, 0.64],
    ].map(([x, y]) => new Vector3(x, y, c0 + 0.03)),
    false,
    'centripetal'
  );
  put('content', 'laguna', paintLaguna(tube(chart, 0.024, 160), start, end, DIAG));
  put('content', 'laguna', paintLaguna(dot(1.8, 0.64, 0.055, c0, 0.06), start, end, DIAG));

  // tabela
  [-0.38, -0.63, -0.88, -1.13].forEach((y, i) => {
    put('content', 'muted', dot(-0.85, y, 0.07));
    put('content', 'muted', pill(-0.68, y - 0.04, -0.05 - (i % 2) * 0.2, y + 0.04));
    put('content', 'muted', pill(0.4, y - 0.05, 0.7, y + 0.05));
  });

  // status: pierścień postępu i przycisk
  const ringBase = new TorusGeometry(0.24, 0.04, 12, 72);
  ringBase.translate(1.475, -0.58, c0 + 0.02);
  put('content', 'muted', ringBase);
  const ring = new TorusGeometry(0.24, 0.046, 12, 72, Math.PI * 2 * 0.72);
  ring.rotateZ(Math.PI / 2);
  ring.translate(1.475, -0.58, c0 + 0.03);
  put('content', 'laguna', paintLaguna(ring, start, end, DIAG));
  put('content', 'ink', pill(1.15, -1.2, 1.8, -1.04));

  const surfaceMaterials: Record<Key, MeshStandardMaterial> = {
    base: new MeshStandardMaterial({ color: colors.pianaLine, roughness: 0.7 }),
    card: new MeshStandardMaterial({ color: colors.biel, roughness: 0.6 }),
    muted: new MeshStandardMaterial({ color: colors.pianaDeep, roughness: 0.7 }),
    ink: new MeshStandardMaterial({ color: colors.glebia, roughness: 0.5 }),
    laguna: new MeshStandardMaterial({ vertexColors: true, roughness: 0.35 }),
  };

  const surface = new Group();
  const layers = { base: new Group(), card: new Group(), content: new Group() };
  (Object.keys(layers) as (keyof typeof layers)[]).forEach((layer) => {
    (Object.entries(buckets[layer]) as [Key, BufferGeometry[]][]).forEach(([key, geoms]) => {
      layers[layer].add(
        new Mesh(merge(geoms.map((geometry) => ({ geometry }))), surfaceMaterials[key])
      );
    });
    surface.add(layers[layer]);
  });

  // ===== Warstwa B: maszynownia =====
  const infraParts: { geometry: BufferGeometry; color: Color }[] = [];
  const ghostSolids: BufferGeometry[] = [];
  const infra = (geometry: BufferGeometry, color: Color, ghost = true) => {
    infraParts.push({ geometry, color });
    if (ghost) ghostSolids.push(geometry.clone());
  };
  const { glebia, glebiaRaise, glebiaLine } = colors;

  // skrzynka: dno z siatką i ścianki
  infra(
    slab(-APP_W / 2, -APP_H / 2, APP_W / 2, APP_H / 2, -CASE_DEPTH, -CASE_DEPTH + 0.08, APP_R),
    glebia,
    false
  );
  infra(frame(0.04, -CASE_DEPTH + 0.04, 0.06), glebiaRaise, false);

  // szafa serwerowa pod menu: 7 serwerów, na froncie kieszeń dysku i diody
  const leds: { x: number; y: number }[] = [];
  for (let i = 0; i < 7; i++) {
    const top = 1.0 - i * 0.33;
    infra(slab(-1.95, top - 0.27, -1.2, top, -0.62, 0.0, 0.04), glebiaRaise);
    infra(pill(-1.86, top - 0.165, -1.58, top - 0.105, 0.0, 0.01), glebiaLine, false);
    [-1.5, -1.42, -1.34].forEach((x) => leds.push({ x, y: top - 0.135 }));
  }

  // monitoring pod wykresem: ekran, progi i linia sygnału
  infra(slab(-1.05, 0.0, 1.95, 1.02, -0.1, -0.04, 0.1), glebiaRaise);
  [0.3, 0.75].forEach((y) =>
    infra(slab(-0.9, y - 0.006, 1.8, y + 0.006, -0.04, -0.034, 0.006), glebiaLine, false)
  );
  const beat = [-0.9, -0.4, -0.3, -0.24, -0.16, -0.08, 0.0, 0.5, 0.6, 0.66, 0.74, 0.82, 0.9, 1.8];
  const beatY = [0.5, 0.5, 0.56, 0.4, 0.86, 0.22, 0.5, 0.5, 0.56, 0.4, 0.86, 0.22, 0.5, 0.5];
  const signal = polyline(
    beat.map((x, i) => new Vector3(x, beatY[i]!, -0.02)),
    0.02
  );

  // baza danych pod tabelą: trzy dyski
  [-0.47, -0.78, -1.09].forEach((y) => {
    const disc = new CylinderGeometry(0.34, 0.34, 0.24, 48, 1);
    disc.translate(-0.1, y, -0.25);
    infra(disc, glebiaRaise);
  });

  // kopie zapasowe pod kartą statusu: ta sama płyta trzy razy, przesunięta w głąb
  for (let i = 0; i < 3; i++) {
    const o = (2 - i) * 0.06;
    infra(
      slab(1.13 - o, -1.17 - o, 1.75 - o, -0.39 - o, -0.55 + i * 0.2, -0.5 + i * 0.2, 0.06),
      glebiaRaise
    );
  }

  // rury: od źródła do odbiorcy, impulsy płyną w tę stronę
  const P = (x: number, y: number) => new Vector3(x, y, PIPE_Z);
  const pipes = [
    polyline([P(0.24, -0.78), P(1.1, -0.78)], 0.1), // baza → kopie
    polyline([P(-0.1, -0.34), P(-0.1, -0.08), P(-1.22, -0.08)], 0.1), // baza → serwery
    polyline([P(-1.22, 0.67), P(-0.7, 0.67), P(-0.7, 0.02)], 0.1), // serwery → monitoring
    polyline([P(-0.1, -0.08), P(1.7, -0.08), P(1.7, 0.02)], 0.1), // baza → monitoring
    polyline([P(-0.1, -1.21), P(-0.1, -1.4), P(1.44, -1.4), P(1.44, -1.2)], 0.1), // baza → kopie, dołem
  ];

  const infraMaterial = new ShaderMaterial({
    vertexShader: infraVert,
    fragmentShader: `${lagunaGlsl}\n${infraFrag}`,
    vertexColors: true,
    uniforms: {
      uStart: { value: start },
      uEnd: { value: end },
      uDiag: { value: DIAG },
      uGridDensity: { value: options.gridDensity },
      uGridAlpha: { value: options.gridAlpha },
      uGridMaxZ: { value: -CASE_DEPTH + 0.1 },
      uRim: { value: options.rim },
    },
  });
  const pulseMaterial = new ShaderMaterial({
    vertexShader: infraVert,
    fragmentShader: `${lagunaGlsl}\n${pulseFrag}`,
    uniforms: {
      uStart: { value: start },
      uEnd: { value: end },
      uDiag: { value: DIAG },
      uCore: { value: glebiaRaise },
      uHot: { value: colors.biel },
      uPhase: { value: 0 },
      uSpacing: { value: options.pulseSpacing },
      uLength: { value: options.pulseLength },
      uBase: { value: options.pulseBase },
      uPower: { value: 1 },
    },
  });

  const ledGeoms = leds.map(({ x, y }, i) => {
    const g = new CircleGeometry(0.022, 16);
    g.translate(x, y, 0.012);
    // co trzecia dioda mruga, reszta świeci stale
    const blink = i % 3 === 1 ? [((i * 0.37) % 1) * 0.8, 0.6 + ((i * 0.53) % 1) * 1.4] : [0.1, 0];
    const flat = g.toNonIndexed();
    g.dispose();
    const data = new Float32Array(flat.getAttribute('position').count * 2);
    for (let k = 0; k < data.length; k += 2) data.set(blink, k);
    flat.setAttribute('aBlink', new Float32BufferAttribute(data, 2));
    return flat;
  });
  const ledMaterial = new ShaderMaterial({
    vertexShader: ledVert,
    fragmentShader: `${lagunaGlsl}\n${ledFrag}`,
    uniforms: {
      uStart: { value: start },
      uEnd: { value: end },
      uDiag: { value: DIAG },
      uTime: { value: 0 },
      uOff: { value: glebiaLine },
      uPower: { value: 1 },
    },
  });

  const rimGeometry = paintLaguna(frame(0.035, 0.06, 0.08), start, end, DIAG);
  const rimMaterial = new MeshBasicMaterial({ vertexColors: true });

  const system = new Group();
  system.add(
    new Mesh(merge(infraParts), infraMaterial),
    new Mesh(
      merge([...pipes, signal].map((c) => ({ geometry: tube(c, 0.018, 160) }))),
      pulseMaterial
    ),
    new Mesh(mergeGeometries(ledGeoms), ledMaterial),
    new Mesh(rimGeometry, rimMaterial)
  );
  ledGeoms.forEach((g) => g.dispose());

  // ===== Duch: krawędzie maszynowni i osie rur =====
  const ghostPositions: number[] = [];
  ghostSolids.forEach((g) => {
    const edges = new EdgesGeometry(g, 25);
    ghostPositions.push(...(edges.getAttribute('position').array as Float32Array));
    edges.dispose();
    g.dispose();
  });
  [...pipes, signal].forEach((c) => {
    const pts = c.getSpacedPoints(80);
    for (let i = 0; i < pts.length - 1; i++)
      ghostPositions.push(...pts[i]!.toArray(), ...pts[i + 1]!.toArray());
  });
  const ghostGeometry = new BufferGeometry();
  ghostGeometry.setAttribute('position', new Float32BufferAttribute(ghostPositions, 3));
  const ghostMaterial = new LineBasicMaterial({ color: start });
  const ghost = new Group().add(new LineSegments(ghostGeometry, ghostMaterial));

  return {
    surface,
    system,
    ghost,
    /** rozsunięcie warstw UI w głębi (0 = karty leżą na bazie) */
    setExplode(e: number) {
      layers.card.position.z = CARD_Z + e;
      layers.content.position.z = CARD_Z + CARD_D + e * 1.8;
    },
    update(dt: number, pulseSpeed: number, o: AppStackOptions) {
      pulseMaterial.uniforms.uPhase!.value += dt * pulseSpeed;
      pulseMaterial.uniforms.uSpacing!.value = o.pulseSpacing;
      pulseMaterial.uniforms.uLength!.value = o.pulseLength;
      pulseMaterial.uniforms.uBase!.value = o.pulseBase;
      ledMaterial.uniforms.uTime!.value += dt;
      infraMaterial.uniforms.uGridDensity!.value = o.gridDensity;
      infraMaterial.uniforms.uGridAlpha!.value = o.gridAlpha;
      infraMaterial.uniforms.uRim!.value = o.rim;
    },
    dispose() {
      [surface, system, ghost].forEach((g) =>
        g.traverse((o) => {
          if (o instanceof Mesh || o instanceof LineSegments) o.geometry.dispose();
        })
      );
      [
        ...Object.values(surfaceMaterials),
        infraMaterial,
        pulseMaterial,
        ledMaterial,
        rimMaterial,
        ghostMaterial,
      ].forEach((m) => m.dispose());
    },
  };
}

export type AppStack = ReturnType<typeof createAppStack>;
