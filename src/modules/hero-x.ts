/**
 * hero-x.ts — spike hero z wielkim znakiem x w 3D (tylko /lab/hero-x).
 *
 * Mechanika jak w hero oryginału (analiza § 4.2), obiekt nasz:
 * - warstwa A: szklisty x z gradientem Laguna (MeshPhysicalMaterial + RoomEnvironment),
 * - warstwa B: „system”: ciemny rdzeń z siatką i świecącą krawędzią + siatkowa klatka,
 * - duch: klatka widoczna zawsze, słabo,
 * - ślad kursora (ping-pong w niskiej rozdzielczości) odsłania B z poszarpaną krawędzią.
 * Każda warstwa renderuje się do własnego render targetu, kompozycja na pełnoekranowym quadzie.
 * Strojenie: ?debug. Minimalny kod, nie produkcja (docelowo Experience w F4).
 */

import type { Module } from '@core/lifecycle';
import { cssColor } from '@core/css';
import { on, off } from '@core/events';
import gsap from 'gsap';
import {
  Box3,
  DirectionalLight,
  Group,
  HalfFloatType,
  LineBasicMaterial,
  LineSegments,
  LinearFilter,
  Mesh,
  MeshPhysicalMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  Vector3,
  WebGLRenderTarget,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Mouse } from '@gl/Mouse';
import { heroParams, heroXParams, type BackgroundMode } from '@gl/params';
import { cageScale, createXStrokes } from '@gl/XMark';
import { loadDebug } from '@gl/debug';
import { easeFromToken } from '@gl/ease';
import { hasWebGL, maxDpr } from '@gl/support';
import noise from '@gl/shaders/noise.glsl?raw';
import bands from '@gl/shaders/bands.glsl?raw';
import bgGlsl from '@gl/shaders/bg.glsl?raw';
import quadVert from '@gl/shaders/quad.vert?raw';
import trailFrag from '@gl/shaders/trail.frag?raw';
import systemVert from '@gl/shaders/system.vert?raw';
import systemFrag from '@gl/shaders/system.frag?raw';
import compositeFrag from '@gl/shaders/composite.frag?raw';

const CAMERA_Z = 10;
const CAMERA_FOV = 30;
const TRAIL_DOWNSCALE = 4;

let cleanup: (() => void) | null = null;

const HeroX: Module = {
  async init(root: HTMLElement) {
    const visual = root.querySelector<HTMLElement>('[data-gl="hero"]');
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    if (!visual || !wrap) return;

    if (!hasWebGL()) {
      root.dataset.glFallback = '';
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = heroXParams;
    const field = heroParams;
    const query = new URLSearchParams(window.location.search);
    const autopilot = query.has('autopilot');
    const bgQuery = Number(query.get('bg'));
    if (query.has('bg') && [0, 1, 2, 3].includes(bgQuery)) {
      field.BACKGROUND_MODE = bgQuery as BackgroundMode;
    }

    const renderer = new WebGLRenderer({ powerPreference: 'high-performance' });
    renderer.setPixelRatio(maxDpr());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearAlpha(0);
    wrap.appendChild(renderer.domElement);

    const [piana, pianaLine, pianaDeep, glebia, start, end, biel] = await Promise.all(
      [
        '--c-piana',
        '--c-piana-line',
        '--c-piana-deep',
        '--c-glebia',
        '--c-laguna-start',
        '--c-laguna-end',
        '--c-biel',
      ].map((t) => cssColor(t))
    );

    // --- Render targety ---
    const floatOk = renderer.extensions.has('EXT_color_buffer_float');
    const rtType = floatOk ? HalfFloatType : UnsignedByteType;
    const layerTarget = () => new WebGLRenderTarget(1, 1, { samples: 4, type: rtType });
    const rtA = layerTarget();
    const rtB = layerTarget();
    const rtGhost = layerTarget();
    const trailTarget = () =>
      new WebGLRenderTarget(1, 1, {
        type: rtType,
        minFilter: LinearFilter,
        magFilter: LinearFilter,
        depthBuffer: false,
      });
    const trail = [trailTarget(), trailTarget()];
    let trailRead = 0;

    // --- Znak x: trzy warstwy z tą samą pozą ---
    const strokes = createXStrokes(start, end);
    const pmrem = new PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const surfaceMaterial = new MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.22,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
    });
    const systemMaterial = new ShaderMaterial({
      vertexShader: systemVert,
      fragmentShader: systemFrag,
      vertexColors: true,
      uniforms: {
        uCore: { value: glebia },
        uGridRings: { value: p.GRID_RINGS },
        uGridSeams: { value: p.GRID_SEAMS },
        uGridAlpha: { value: p.GRID_ALPHA },
        uPhase: { value: 0 },
      },
    });
    const cageMaterial = new LineBasicMaterial({ color: start });
    const ghostMaterial = new LineBasicMaterial({ color: start });

    const sceneA = new Scene();
    const sceneB = new Scene();
    const sceneGhost = new Scene();
    sceneA.environment = envMap;
    const light = new DirectionalLight(biel, 1.4);
    light.position.set(-3, 4, 6);
    sceneA.add(light);

    const groupA = new Group();
    const groupB = new Group();
    const groupGhost = new Group();
    const cages: LineSegments[] = [];
    strokes.forEach(({ geometry, cage, angle, z }) => {
      const a = new Mesh(geometry, surfaceMaterial);
      const b = new Mesh(geometry, systemMaterial);
      const cb = new LineSegments(cage, cageMaterial);
      const cg = new LineSegments(cage, ghostMaterial);
      [a, b, cb, cg].forEach((o) => {
        o.rotation.z = angle;
        o.position.z = z;
      });
      cages.push(cb, cg);
      groupA.add(a);
      groupB.add(b, cb);
      groupGhost.add(cg);
    });
    sceneA.add(groupA);
    sceneB.add(groupB);
    sceneGhost.add(groupGhost);

    const xHeight = new Box3().setFromObject(groupA).getSize(new Vector3()).y;

    const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    camera.position.z = CAMERA_Z;
    const visibleHeight = 2 * CAMERA_Z * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);

    // --- Pełnoekranowe passy ---
    const quad = new PlaneGeometry(2, 2);
    const ortho = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

    const trailMaterial = new ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: trailFrag,
      uniforms: {
        tPrev: { value: trail[0].texture },
        uMouse: { value: new Vector2(0.5, 0.5) },
        uPrevMouse: { value: new Vector2(0.5, 0.5) },
        uAspect: { value: 1 },
        uStrength: { value: 0 },
        uRadius: { value: p.TRAIL_RADIUS },
        uDecay: { value: p.TRAIL_DECAY },
        uIntro: { value: reduced ? 0 : 1 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const trailScene = new Scene().add(new Mesh(quad, trailMaterial));

    const fieldUniforms: Record<string, IUniform> = {
      uViewport: { value: new Vector2() },
      uDpr: { value: 1 },
      uPhase: { value: Math.random() * 100 },
      uScale: { value: 0 },
      uDetail: { value: 0 },
      uDistortScale: { value: 0 },
      uDistortIntensity: { value: 0 },
      uMouse: { value: new Vector2() },
      uPace: { value: 0 },
      uCursorScale: { value: 0 },
      uCursorIntensity: { value: 0 },
      uCursorBounce: { value: 0 },
      uReveal: { value: 1 },
      uRevealSize: { value: 0 },
      uLineWidth: { value: 1 },
      uCell: { value: 16 },
      uMode: { value: 0 },
      uDotMin: { value: 0 },
      uDotMax: { value: 0 },
    };

    const compositeMaterial = new ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: `${noise}\n${bands}\n${bgGlsl}\n${compositeFrag}`,
      uniforms: {
        ...fieldUniforms,
        tA: { value: rtA.texture },
        tB: { value: rtB.texture },
        tGhost: { value: rtGhost.texture },
        tTrail: { value: trail[0].texture },
        uBgColor: { value: piana },
        uBgInk: { value: pianaDeep },
        uBgInkAlpha: { value: p.BG_INK_ALPHA },
        uTrailBg: { value: pianaLine },
        uGhostColor: { value: start },
        uGhostAlpha: { value: p.GHOST_ALPHA },
        uLineObject: { value: start },
        uLineBg: { value: pianaDeep },
        uEdgeNoise: { value: p.EDGE_NOISE },
        uEdgeScale: { value: p.EDGE_SCALE },
        uEdgePhase: { value: 0 },
        uDebugTrail: { value: 0 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const compositeScene = new Scene().add(new Mesh(quad, compositeMaterial));

    const mouse = new Mouse({
      lerp: field.MOUSE_LERP,
      pacePx: field.PACE_PX,
      paceLerp: field.PACE_LERP,
    });
    const prevMouse = new Vector2(0.5, 0.5);
    const mouseUv = new Vector2(0.5, 0.5);
    const intro = { trail: reduced ? 0 : 1, spin: reduced ? 0 : -0.9, scale: reduced ? 1 : 0.86 };
    let time = 0;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setPixelRatio(maxDpr());
      renderer.setSize(w, h);
      const dpr = renderer.getPixelRatio();
      [rtA, rtB, rtGhost].forEach((rt) => rt.setSize(w * dpr, h * dpr));
      trail.forEach((rt) => rt.setSize((w * dpr) / TRAIL_DOWNSCALE, (h * dpr) / TRAIL_DOWNSCALE));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fieldUniforms.uViewport.value.set(w, h);
      fieldUniforms.uDpr.value = dpr;
      trailMaterial.uniforms.uAspect.value = w / h;
    };
    resize();

    const placeX = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;
      const r = visual.getBoundingClientRect();
      const worldPerPx = visibleHeight / h;
      const size = (mobile ? 0.38 : p.OBJECT_SIZE) * r.height;
      const cx = r.left + r.width / 2 + (mobile ? 0 : p.OBJECT_X * r.width);
      const cy = mobile ? r.top + r.height * 0.24 : r.top + r.height / 2;

      const mx = (mouse.eased.x / w) * 2 - 1;
      const my = (mouse.eased.y / h) * 2 - 1;
      const idle = reduced ? 0 : Math.sin(time * 0.4) * p.IDLE;

      [groupA, groupB, groupGhost].forEach((g) => {
        g.position.set((cx - w / 2) * worldPerPx, -(cy - h / 2) * worldPerPx, 0);
        g.scale.setScalar(((size * worldPerPx) / xHeight) * intro.scale);
        g.rotation.set(my * p.TILT * 0.6 + idle * 0.5, mx * p.TILT + intro.spin + idle, 0);
      });
      const [sx, sy, sz] = cageScale(p.CAGE_SCALE);
      cages.forEach((c) => c.scale.set(sx, sy, sz));
    };

    const applyParams = () => {
      const u = fieldUniforms;
      u.uScale.value = field.SCALE;
      u.uDetail.value = field.NOISE_DETAIL;
      u.uDistortScale.value = field.DISTORT_SCALE;
      u.uDistortIntensity.value = field.DISTORT_INTENSITY;
      u.uCursorScale.value = field.CURSOR_SCALE;
      u.uCursorIntensity.value = field.CURSOR_INTENSITY;
      u.uCursorBounce.value = field.CURSOR_BOUNCE;
      u.uLineWidth.value = field.LINE_WIDTH;
      u.uCell.value = field.GRID_CELL;
      u.uMode.value = field.BACKGROUND_MODE;
      u.uDotMin.value = field.DOT_MIN;
      u.uDotMax.value = field.DOT_MAX;

      const c = compositeMaterial.uniforms;
      c.uBgInkAlpha.value = field.BACKGROUND_CONTOURS ? p.BG_INK_ALPHA : 0;
      c.uGhostAlpha.value = p.GHOST_ALPHA;
      c.uEdgeNoise.value = p.EDGE_NOISE;
      c.uEdgeScale.value = p.EDGE_SCALE;
      u.uLineWidth.value = p.EDGE_LINE;

      const s = systemMaterial.uniforms;
      s.uGridRings.value = p.GRID_RINGS;
      s.uGridSeams.value = p.GRID_SEAMS;
      s.uGridAlpha.value = p.GRID_ALPHA;

      trailMaterial.uniforms.uRadius.value = p.TRAIL_RADIUS;
      mouse.options.lerp = field.MOUSE_LERP;
      mouse.options.pacePx = field.PACE_PX;
      mouse.options.paceLerp = field.PACE_LERP;
    };

    const renderLayer = (scene: Scene, target: WebGLRenderTarget) => {
      renderer.setRenderTarget(target);
      renderer.clear();
      renderer.render(scene, camera);
    };

    const render = (dt: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      applyParams();

      // ślad kursora
      const t = trailMaterial.uniforms;
      mouseUv.set(mouse.eased.x / w, 1 - mouse.eased.y / h);
      t.tPrev.value = trail[trailRead].texture;
      t.uMouse.value.copy(mouseUv);
      t.uPrevMouse.value.copy(prevMouse);
      t.uStrength.value = reduced ? 0 : Math.min(1, mouse.pace * p.TRAIL_STRENGTH);
      t.uDecay.value = Math.pow(p.TRAIL_DECAY, dt * 60);
      t.uIntro.value = intro.trail;
      renderer.setRenderTarget(trail[1 - trailRead]);
      renderer.render(trailScene, ortho);
      trailRead = 1 - trailRead;
      prevMouse.copy(mouseUv);

      // warstwy
      placeX();
      renderLayer(sceneA, rtA);
      renderLayer(sceneB, rtB);
      renderLayer(sceneGhost, rtGhost);

      // kompozycja
      fieldUniforms.uMouse.value.set(mouse.eased.x / h, (h - mouse.eased.y) / h);
      fieldUniforms.uPace.value = mouse.pace;
      compositeMaterial.uniforms.tTrail.value = trail[trailRead].texture;
      renderer.setRenderTarget(null);
      renderer.render(compositeScene, ortho);
    };

    const stats = { fps: 0, smooth: 60 };
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      time += dt;
      if (autopilot) {
        // wirtualny kursor (Lissajous) wokół znaku: podgląd bez myszy, przyszły dryf na dotyku
        const r = visual.getBoundingClientRect();
        const cx = r.left + r.width * (0.5 + p.OBJECT_X);
        mouse.target.x = cx + Math.sin(time * 1.3) * r.height * 0.3;
        mouse.target.y = r.top + r.height * (0.5 + Math.sin(time * 1.9) * 0.3);
      }
      stats.smooth += (1 / Math.max(dt, 1e-3) - stats.smooth) * 0.05;
      stats.fps = Math.round(stats.smooth);
      mouse.update(dt);
      fieldUniforms.uPhase.value += dt * field.SPEED;
      compositeMaterial.uniforms.uEdgePhase.value += dt * p.EDGE_SPEED;
      systemMaterial.uniforms.uPhase.value += dt * p.FLOW_SPEED;
      render(dt);
    };

    const renderStatic = () => render(1 / 60);
    if (reduced) {
      window.addEventListener('scroll', renderStatic, { passive: true });
      renderStatic();
    } else {
      gsap.ticker.add(tick);
    }

    const onResize = () => {
      resize();
      if (reduced) renderStatic();
    };
    window.addEventListener('resize', onResize);

    const ease = easeFromToken('--ease-default');
    const playIntro = () => {
      if (reduced) return;
      gsap.fromTo(
        intro,
        { trail: 1, spin: -0.9, scale: 0.86 },
        { trail: 0, spin: 0, scale: 1, duration: p.INTRO_DURATION, ease, overwrite: true }
      );
    };
    on('app:ready', playIntro);

    const gui = await loadDebug('Hero x');
    if (gui) {
      if (window.innerWidth < 768) gui.close();
      const state = { debugTrail: false };
      gui.add(stats, 'fps').listen().disable();
      gui
        .add(state, 'debugTrail')
        .name('pokaż ślad')
        .onChange((v: boolean) => {
          compositeMaterial.uniforms.uDebugTrail.value = v ? 1 : 0;
        });
      gui.add({ replay: playIntro }, 'replay').name('powtórz intro');

      const o = gui.addFolder('Obiekt');
      o.add(p, 'OBJECT_SIZE', 0.3, 1.4, 0.01);
      o.add(p, 'OBJECT_X', -0.5, 0.5, 0.01);
      o.add(p, 'TILT', 0, 1, 0.01);
      o.add(p, 'IDLE', 0, 0.3, 0.005);
      o.add(p, 'CAGE_SCALE', 1, 1.8, 0.01);
      o.add(p, 'INTRO_DURATION', 0.4, 4, 0.05);

      const b = gui.addFolder('Warstwa B (system)');
      b.add(p, 'GRID_RINGS', 0, 10, 0.1);
      b.add(p, 'GRID_SEAMS', 0, 48, 1);
      b.add(p, 'GRID_ALPHA', 0, 1, 0.01);
      b.add(p, 'FLOW_SPEED', 0, 4, 0.05);
      b.add(p, 'GHOST_ALPHA', 0, 1, 0.01).name('duch klatki');

      const t = gui.addFolder('Ślad kursora');
      t.add(p, 'TRAIL_RADIUS', 0.02, 0.5, 0.005);
      t.add(p, 'TRAIL_DECAY', 0.9, 0.999, 0.001);
      t.add(p, 'TRAIL_STRENGTH', 0, 5, 0.05);
      t.add(p, 'EDGE_NOISE', 0, 1, 0.01);
      t.add(p, 'EDGE_SCALE', 0.5, 20, 0.1);
      t.add(p, 'EDGE_SPEED', 0, 2, 0.01);
      t.add(p, 'EDGE_LINE', 0, 4, 0.1).name('kontur krawędzi');
      t.add(field, 'MOUSE_LERP', 0.01, 1, 0.01);
      t.add(field, 'PACE_PX', 5, 200, 1);

      const g = gui.addFolder('Tło');
      g.add(field, 'BACKGROUND_CONTOURS').name('wzór tła');
      g.add(field, 'BACKGROUND_MODE', {
        'poziomice (organiczne)': 0,
        kropki: 1,
        'schodki na siatce': 2,
        kreskowanie: 3,
      }).name('tryb');
      g.add(p, 'BG_INK_ALPHA', 0, 1, 0.01).name('krycie wzoru');
      g.add(field, 'GRID_CELL', 4, 64, 1).name('komórka (px)');
      g.add(field, 'SCALE', 0.1, 5, 0.05);
      g.add(field, 'NOISE_DETAIL', 1, 10, 0.1);
      g.add(field, 'SPEED', 0, 0.5, 0.005);
      g.close();

      gui
        .add(
          {
            copy: () => {
              const json = JSON.stringify({ heroXParams: p, heroParams: field }, null, 2);
              console.log(json);
              void navigator.clipboard?.writeText(json);
            },
          },
          'copy'
        )
        .name('kopiuj parametry (do params.ts)');
    }

    cleanup = () => {
      off('app:ready', playIntro);
      gsap.ticker.remove(tick);
      gsap.killTweensOf(intro);
      window.removeEventListener('scroll', renderStatic);
      window.removeEventListener('resize', onResize);
      gui?.destroy();
      mouse.destroy();
      strokes.forEach(({ geometry, cage }) => {
        geometry.dispose();
        cage.dispose();
      });
      [surfaceMaterial, systemMaterial, cageMaterial, ghostMaterial].forEach((m) => m.dispose());
      [trailMaterial, compositeMaterial].forEach((m) => m.dispose());
      [rtA, rtB, rtGhost, ...trail].forEach((rt) => rt.dispose());
      quad.dispose();
      envMap.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  },

  destroy() {
    cleanup?.();
    cleanup = null;
  },
};

export default HeroX;
