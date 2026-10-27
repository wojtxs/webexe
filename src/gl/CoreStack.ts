/**
 * CoreStack.ts — obiekt hero „rdzeń z warstw”: cztery okrągłe moduły ułożone w wieżę,
 * każdy moduł to jedna usługa. Obudowa jest jasna i matowa, z wyciętym klinem, przez który
 * widać ciemne wnętrze: maszynerię i świetlne linie z impulsami danych.
 * Od góry: Aplikacje, Integracje, Automatyzacje, Utrzymanie (podstawa, na której stoi reszta).
 *
 * Układ: oś Y w górę, kąt φ liczony jak w kształtach 2D: kierunek (cos φ, 0, −sin φ).
 * Klin jest wycięty od strony kamery (przód-prawo), obrót całości robi moduł.
 * Każda warstwa ma własną grupę, bo moduł przesuwa je osobno (intro, hover, rozkład przy scrollu).
 */

import {
  CircleGeometry,
  CylinderGeometry,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  ShaderMaterial,
  Shape,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
  type Color,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { merge, paintLaguna, polyline, tube } from '@gl/geometry';
import lagunaGlsl from '@gl/shaders/laguna.glsl?raw';
import infraVert from '@gl/shaders/infra.vert?raw';
import infraFrag from '@gl/shaders/infra.frag?raw';
import pulseFrag from '@gl/shaders/pulse.frag?raw';
import ledVert from '@gl/shaders/led.vert?raw';
import ledFrag from '@gl/shaders/led.frag?raw';

/** Warstwy od góry. Etykiety z BRIEF.md (01 Hero, etykiety warstw). */
export const CORE_LAYERS = [
  { key: 'aplikacje', label: 'Aplikacje', h: 0.56, r: 1.5 },
  { key: 'integracje', label: 'Integracje', h: 0.56, r: 1.5 },
  { key: 'automatyzacje', label: 'Automatyzacje', h: 0.56, r: 1.5 },
  { key: 'utrzymanie', label: 'Utrzymanie', h: 0.74, r: 1.62 },
] as const;

const GAP = 0.08;
const WALL = 0.07;
const LID = 0.05;
const FLOOR = 0.05;
const DIAG = 2;

/** wycięty klin: środek przód-prawo, szerokość ~110° */
const CUT_CENTER = -Math.PI / 4;
const CUT_WIDTH = 1.9;
const SOLID_A0 = CUT_CENTER + CUT_WIDTH / 2;
const SOLID_ARC = Math.PI * 2 - CUT_WIDTH;

export interface CoreColors {
  biel: Color;
  pianaLine: Color;
  glebia: Color;
  glebiaLine: Color;
  glebiaRaise: Color;
  start: Color;
  end: Color;
}

export interface CoreOptions {
  rim: number;
  pulseSpacing: number;
  pulseLength: number;
  pulseBase: number;
}

const polar = (r: number, phi: number, y: number) =>
  new Vector3(r * Math.cos(phi), y, -r * Math.sin(phi));

/** Wycinek pierścienia (rIn > 0) albo koła (rIn = 0) od y0 do y1, z fazą na krawędziach. */
function sector(rOut: number, rIn: number, a0: number, arc: number, y0: number, y1: number) {
  const a1 = a0 + arc;
  const s = new Shape();
  if (rIn <= 0) {
    s.moveTo(0, 0);
    s.lineTo(Math.cos(a0) * rOut, Math.sin(a0) * rOut);
    s.absarc(0, 0, rOut, a0, a1, false);
    s.lineTo(0, 0);
  } else {
    s.moveTo(Math.cos(a0) * rOut, Math.sin(a0) * rOut);
    s.absarc(0, 0, rOut, a0, a1, false);
    s.lineTo(Math.cos(a1) * rIn, Math.sin(a1) * rIn);
    s.absarc(0, 0, rIn, a1, a0, true);
    s.closePath();
  }
  const b = Math.min(0.012, (y1 - y0) / 4);
  const g = new ExtrudeGeometry(s, {
    depth: y1 - y0 - 2 * b,
    bevelEnabled: true,
    bevelThickness: b,
    bevelSize: b,
    bevelSegments: 2,
    curveSegments: 72,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + b, 0);
  return g;
}

/** Łuk świetlny (pierścień) leżący płasko; uv.x = długość łuku dla impulsów. */
function arcRing(r: number, tubeR: number, a0: number, arc: number, y: number) {
  const g = new TorusGeometry(r, tubeR, 8, Math.ceil(arc * 40), arc);
  const uv = g.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * arc * r);
  g.rotateX(-Math.PI / 2);
  g.rotateY(a0);
  g.translate(0, y, 0);
  return g;
}

/** Zaokrąglony klocek ustawiony promieniście: x wzdłuż promienia, środek w polar(r, φ, y). */
function radialBox(w: number, h: number, d: number, r: number, phi: number, y: number) {
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(w, h, d) * 0.2);
  g.rotateY(phi);
  const p = polar(r, phi, y);
  g.translate(p.x, p.y, p.z);
  return g;
}

/** Dioda na zewnętrznej ścianie klocka, zwrócona na zewnątrz. */
function led(r: number, phi: number, y: number, blink: [number, number]) {
  const c = new CircleGeometry(0.022, 14);
  c.rotateY(phi + Math.PI / 2);
  const p = polar(r, phi, y);
  c.translate(p.x, p.y, p.z);
  const g = c.toNonIndexed();
  c.dispose();
  const data = new Float32Array(g.getAttribute('position').count * 2);
  for (let k = 0; k < data.length; k += 2) data.set(blink, k);
  g.setAttribute('aBlink', new Float32BufferAttribute(data, 2));
  return g;
}

export function createCoreStack(colors: CoreColors, options: CoreOptions) {
  const { start, end, glebia, glebiaRaise, glebiaLine } = colors;
  const laguna = { uStart: { value: start }, uEnd: { value: end }, uDiag: { value: DIAG } };

  const housingMaterial = new MeshStandardMaterial({ color: colors.biel, roughness: 0.62 });
  const infraMaterial = new ShaderMaterial({
    vertexShader: infraVert,
    fragmentShader: `${lagunaGlsl}\n${infraFrag}`,
    vertexColors: true,
    uniforms: {
      ...laguna,
      uGridDensity: { value: 1 },
      uGridAlpha: { value: 0 },
      uGridMaxZ: { value: -100 },
      uRim: { value: options.rim },
    },
  });
  const pulseMaterial = new ShaderMaterial({
    vertexShader: infraVert,
    fragmentShader: `${lagunaGlsl}\n${pulseFrag}`,
    uniforms: {
      ...laguna,
      uCore: { value: glebiaRaise },
      uHot: { value: colors.biel },
      uPhase: { value: 0 },
      uSpacing: { value: options.pulseSpacing },
      uLength: { value: options.pulseLength },
      uBase: { value: options.pulseBase },
      uPower: { value: 0 },
    },
  });
  const ledMaterial = new ShaderMaterial({
    vertexShader: ledVert,
    fragmentShader: `${lagunaGlsl}\n${ledFrag}`,
    uniforms: { ...laguna, uTime: { value: 0 }, uOff: { value: glebiaLine }, uPower: { value: 0 } },
  });
  const glowMaterial = new MeshBasicMaterial({ vertexColors: true });
  // krawędź pokrywy leży na jasnej obudowie: rura w kolorze Bieli, impulsy w Lagunie
  const rimMaterial = pulseMaterial.clone();
  rimMaterial.uniforms.uCore!.value = colors.biel;
  rimMaterial.uniforms.uBase!.value = 0.75;
  const pulseMaterials = [pulseMaterial, rimMaterial];

  const root = new Group();
  const spinners: { group: Group; speed: number }[] = [];

  // pozycje w złożeniu: od dołu, środek wieży w y = 0
  const total = CORE_LAYERS.reduce((s, l) => s + l.h, 0) + GAP * (CORE_LAYERS.length - 1);
  let cursor = -total / 2;
  const bottomUp = [...CORE_LAYERS].reverse().map((l) => {
    const y = cursor;
    cursor += l.h + GAP;
    return y;
  });
  const baseY = bottomUp.reverse();

  const layers = CORE_LAYERS.map((def, index) => {
    const { h, r } = def;
    const top = h - LID;
    const mid = FLOOR + (top - FLOOR) / 2;
    const ih = top - FLOOR;

    const group = new Group();
    group.position.y = baseY[index]!;

    // obudowa: ścianka i pokrywa z wyciętym klinem
    const housing = new Mesh(
      merge([
        { geometry: sector(r, r - WALL, SOLID_A0, SOLID_ARC, 0, h) },
        { geometry: sector(r - WALL * 0.5, 0, SOLID_A0, SOLID_ARC, top, h) },
      ]),
      housingMaterial
    );
    housing.userData.layer = index;

    // wnętrze
    const solids: { geometry: BufferGeometry; color: Color }[] = [];
    const lines: BufferGeometry[] = [];
    const glows: BufferGeometry[] = [];
    const leds: BufferGeometry[] = [];

    const floor = new CylinderGeometry(r - WALL, r - WALL, FLOOR, 96);
    floor.translate(0, FLOOR / 2, 0);
    solids.push({ geometry: floor, color: glebia });
    const spine = new CylinderGeometry(0.1, 0.1, ih, 24);
    spine.translate(0, mid, 0);
    solids.push({ geometry: spine, color: glebiaRaise });

    // świetlna krawędź pokrywy, impulsy krążą po obwodzie
    const rim = new Mesh(arcRing(r - 0.012, 0.016, SOLID_A0, SOLID_ARC, h + 0.002), rimMaterial);

    // ścieżki na podłodze: od osi do ścianki, impulsy płyną na zewnątrz
    for (let i = 0; i < 6; i++) {
      const phi = (i / 6) * Math.PI * 2 + index * 0.4;
      const y = FLOOR + 0.012;
      lines.push(
        tube(polyline([polar(0.12, phi, y), polar(r - WALL - 0.04, phi, y)], 0), 0.012, 24)
      );
    }

    if (def.key === 'aplikacje') {
      // ekrany zwrócone na zewnątrz, na każdym świetlny pasek treści
      for (let i = 0; i < 9; i++) {
        const phi = (i / 9) * Math.PI * 2;
        solids.push({
          geometry: radialBox(0.04, ih * 0.62, 0.46, 1.02, phi, mid),
          color: glebiaRaise,
        });
        const bar = radialBox(0.012, 0.035, 0.3, 1.045, phi, mid + 0.04);
        glows.push(paintLaguna(bar, start, end, DIAG));
        const bar2 = radialBox(0.012, 0.03, 0.18, 1.045, phi, mid - 0.04);
        glows.push(paintLaguna(bar2, start, end, DIAG));
      }
      lines.push(arcRing(0.55, 0.02, 0, Math.PI * 2, FLOOR + 0.02));
    }

    if (def.key === 'integracje') {
      // piasta i rury do złączy na ściance
      const hub = new CylinderGeometry(0.3, 0.3, ih * 0.7, 48);
      hub.translate(0, mid, 0);
      solids.push({ geometry: hub, color: glebiaRaise });
      for (let i = 0; i < 8; i++) {
        const phi = (i / 8) * Math.PI * 2 + 0.2;
        const y = mid + (i % 2 ? 0.06 : -0.06);
        lines.push(
          tube(polyline([polar(0.3, phi, y), polar(r - WALL - 0.1, phi, y)], 0), 0.022, 24)
        );
        solids.push({
          geometry: radialBox(0.14, 0.16, 0.16, r - WALL - 0.08, phi, y),
          color: glebiaRaise,
        });
      }
    }

    if (def.key === 'automatyzacje') {
      // dwa pierścienie z zębami, obracają się w przeciwne strony
      [
        { radius: 0.62, teeth: 8, speed: 0.35 },
        { radius: 1.05, teeth: 14, speed: -0.22 },
      ].forEach(({ radius, teeth, speed }) => {
        const ring = new TorusGeometry(radius, 0.05, 12, 96);
        ring.rotateX(-Math.PI / 2);
        ring.translate(0, mid, 0);
        const parts = [{ geometry: ring as BufferGeometry, color: glebiaRaise }];
        for (let i = 0; i < teeth; i++) {
          parts.push({
            geometry: radialBox(0.14, 0.1, 0.08, radius, (i / teeth) * Math.PI * 2, mid),
            color: glebiaLine,
          });
        }
        const spinner = new Group().add(new Mesh(merge(parts), infraMaterial));
        spinner.add(new Mesh(arcRing(radius, 0.016, 0, Math.PI * 2, mid + 0.06), pulseMaterial));
        spinners.push({ group: spinner, speed });
        group.add(spinner);
      });
      for (let i = 0; i < 3; i++) {
        const phi = (i / 3) * Math.PI * 2;
        lines.push(tube(polyline([polar(0.12, phi, mid), polar(0.56, phi, mid)], 0), 0.02, 16));
      }
    }

    if (def.key === 'utrzymanie') {
      // serwery w pierścieniu, diody na froncie
      for (let i = 0; i < 12; i++) {
        const phi = (i / 12) * Math.PI * 2;
        solids.push({
          geometry: radialBox(0.5, ih - 0.08, 0.17, 1.08, phi, mid),
          color: glebiaRaise,
        });
        [0.08, 0, -0.08].forEach((dy, k) => {
          const blinking = (i + k) % 4 === 1;
          leds.push(
            led(
              1.335,
              phi,
              mid + dy,
              blinking ? [(i * 0.37 + k * 0.21) % 1, 0.7 + k * 0.5] : [0.1, 0]
            )
          );
        });
      }
      lines.push(arcRing(0.6, 0.022, 0, Math.PI * 2, FLOOR + 0.02));
    }

    group.add(housing, rim, new Mesh(merge(solids), infraMaterial));
    if (lines.length)
      group.add(new Mesh(merge(lines.map((geometry) => ({ geometry }))), pulseMaterial));
    if (glows.length)
      group.add(new Mesh(merge(glows.map((geometry) => ({ geometry }))), glowMaterial));
    if (leds.length) {
      group.add(new Mesh(mergeGeometries(leds), ledMaterial));
      leds.forEach((g) => g.dispose());
    }
    root.add(group);

    return { ...def, index, group, housing, baseY: baseY[index]!, mid: h / 2 };
  });

  // oś danych przez całą wieżę: geometria wysokości 1, moduł rozciąga ją między warstwami
  const spineGeometry = tube(polyline([new Vector3(0, 0, 0), new Vector3(0, 1, 0)], 0), 0.045, 8);
  const spine = new Mesh(spineGeometry, pulseMaterial);
  root.add(spine);

  return {
    root,
    layers,
    /** wysokość wieży w złożeniu */
    height: total,
    radius: CORE_LAYERS[CORE_LAYERS.length - 1]!.r,
    housings: layers.map((l) => l.housing),
    /** oś od spodu najniższej do wierzchu najwyższej warstwy (po przesunięciach warstw) */
    fitSpine() {
      const bottom = layers[layers.length - 1]!.group.position.y;
      const topLayer = layers[0]!;
      const top = topLayer.group.position.y + topLayer.h;
      spine.position.y = bottom;
      spine.scale.y = Math.max(top - bottom, 0.001);
    },
    /** 0 = mechanizm wyłączony (bez impulsów i diod), 1 = działa */
    setPower(v: number) {
      pulseMaterials.forEach((m) => (m.uniforms.uPower!.value = v));
      ledMaterial.uniforms.uPower!.value = v;
    },
    update(dt: number, pulseSpeed: number, spin: number, o: CoreOptions) {
      pulseMaterials.forEach((m) => {
        m.uniforms.uPhase!.value += dt * pulseSpeed;
        m.uniforms.uSpacing!.value = o.pulseSpacing;
        m.uniforms.uLength!.value = o.pulseLength;
      });
      pulseMaterial.uniforms.uBase!.value = o.pulseBase;
      ledMaterial.uniforms.uTime!.value += dt;
      infraMaterial.uniforms.uRim!.value = o.rim;
      spinners.forEach(({ group, speed }) => (group.rotation.y += dt * speed * spin));
    },
    dispose() {
      root.traverse((obj) => {
        if (obj instanceof Mesh) obj.geometry.dispose();
      });
      [housingMaterial, infraMaterial, ...pulseMaterials, ledMaterial, glowMaterial].forEach((m) =>
        m.dispose()
      );
    },
  };
}

export type CoreStack = ReturnType<typeof createCoreStack>;
