/**
 * hero-rentgen.ts — spike hero „rentgen aplikacji” (tylko /lab/hero-rentgen).
 *
 * Mechanika jak w hero x (analiza § 4.2), obiekt inny: na wierzchu okno aplikacji,
 * której używa klient, a ślad kursora prześwietla je do infrastruktury, przy której
 * zostajemy na lata (serwery, baza, kopie, monitoring, przepływ danych). Wariant D2 wprost.
 * - warstwa A: matowe panele UI rozsunięte w głębi,
 * - warstwa B: skrzynka z maszynownią w tym samym obrysie,
 * - duch: krawędzie maszynowni i osie rur, widoczne zawsze, słabo.
 * Pipeline (render targety, ślad ping-pong, kompozycja) jak w hero-x.ts.
 * Strojenie: ?debug. Minimalny kod, nie produkcja (docelowo Experience w F4).
 */

import type { Module } from '@core/lifecycle';
import { cssColor } from '@core/css';
import { on, off } from '@core/events';
import gsap from 'gsap';
import {
  DirectionalLight,
  HalfFloatType,
  LinearFilter,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Mouse } from '@gl/Mouse';
import { heroParams, heroRentgenParams, type BackgroundMode } from '@gl/params';
import { APP_W, createAppStack } from '@gl/AppStack';
import { loadDebug } from '@gl/debug';
import { easeFromToken } from '@gl/ease';
import { hasWebGL, maxDpr } from '@gl/support';
import noise from '@gl/shaders/noise.glsl?raw';
import bands from '@gl/shaders/bands.glsl?raw';
import bgGlsl from '@gl/shaders/bg.glsl?raw';
import quadVert from '@gl/shaders/quad.vert?raw';
import trailFrag from '@gl/shaders/trail.frag?raw';
import compositeFrag from '@gl/shaders/composite.frag?raw';

const CAMERA_Z = 10;
const CAMERA_FOV = 30;
const TRAIL_DOWNSCALE = 4;

let cleanup: (() => void) | null = null;

const HeroRentgen: Module = {
  async init(root: HTMLElement) {
    const visual = root.querySelector<HTMLElement>('[data-gl="hero"]');
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    if (!visual || !wrap) return;

    if (!hasWebGL()) {
      root.dataset.glFallback = '';
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = heroRentgenParams;
    const field = heroParams;
    const query = new URLSearchParams(window.location.search);
    const autopilot = query.has('autopilot');
    /** podgląd: cała warstwa B odsłonięta, bez intro */
    const xray = { on: query.has('xray') };
    const bgQuery = Number(query.get('bg'));
    if (query.has('bg') && [0, 1, 2, 3].includes(bgQuery)) {
      field.BACKGROUND_MODE = bgQuery as BackgroundMode;
    }

    const renderer = new WebGLRenderer({ powerPreference: 'high-performance' });
    renderer.setPixelRatio(maxDpr());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearAlpha(0);
    wrap.appendChild(renderer.domElement);

    const [piana, pianaLine, pianaDeep, biel, glebia, glebiaLine, glebiaRaise, start, end] =
      await Promise.all(
        [
          '--c-piana',
          '--c-piana-line',
          '--c-piana-deep',
          '--c-biel',
          '--c-glebia',
          '--c-glebia-line',
          '--c-glebia-raise',
          '--c-laguna-start',
          '--c-laguna-end',
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

    // --- Okno aplikacji i maszynownia: trzy warstwy z tą samą pozą ---
    const stackOptions = () => ({
      gridDensity: p.GRID_DENSITY,
      gridAlpha: p.GRID_ALPHA,
      rim: p.RIM,
      pulseSpacing: p.PULSE_SPACING,
      pulseLength: p.PULSE_LENGTH,
      pulseBase: p.PULSE_BASE,
    });
    const stack = createAppStack(
      { piana, pianaLine, pianaDeep, biel, glebia, glebiaLine, glebiaRaise, start, end },
      stackOptions()
    );

    const pmrem = new PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    const sceneA = new Scene();
    const sceneB = new Scene();
    const sceneGhost = new Scene();
    sceneA.environment = envMap;
    const light = new DirectionalLight(biel, p.LIGHT_INTENSITY);
    light.position.set(-3, 4, 6);
    sceneA.add(light, stack.surface);
    sceneB.add(stack.system);
    sceneGhost.add(stack.ghost);
    const groups = [stack.surface, stack.system, stack.ghost];

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
    const intro = { trail: reduced ? 0 : 1, yaw: reduced ? 0 : 0.5, scale: reduced ? 1 : 0.9 };
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

    const placeStack = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;
      const r = visual.getBoundingClientRect();
      const worldPerPx = visibleHeight / h;
      const width = (mobile ? 0.86 : p.OBJECT_WIDTH) * r.width;
      const cx = r.left + r.width / 2 + (mobile ? 0 : p.OBJECT_X * r.width);
      const cy = mobile ? r.top + r.height * 0.26 : r.top + r.height / 2;

      const mx = (mouse.eased.x / w) * 2 - 1;
      const my = (mouse.eased.y / h) * 2 - 1;
      const idle = reduced ? 0 : Math.sin(time * 0.4) * p.IDLE;
      const yaw = (mobile ? p.YAW * 0.4 : p.YAW) + intro.yaw;

      groups.forEach((g) => {
        g.position.set((cx - w / 2) * worldPerPx, -(cy - h / 2) * worldPerPx, 0);
        g.scale.setScalar(((width * worldPerPx) / APP_W) * intro.scale);
        g.rotation.set(p.PITCH + my * p.TILT * 0.6 + idle * 0.5, yaw + mx * p.TILT + idle, 0);
      });
      stack.setExplode(p.EXPLODE);
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
      u.uCell.value = field.GRID_CELL;
      u.uMode.value = field.BACKGROUND_MODE;
      u.uDotMin.value = field.DOT_MIN;
      u.uDotMax.value = field.DOT_MAX;
      u.uLineWidth.value = p.EDGE_LINE;

      const c = compositeMaterial.uniforms;
      c.uBgInkAlpha.value = field.BACKGROUND_CONTOURS ? p.BG_INK_ALPHA : 0;
      c.uGhostAlpha.value = p.GHOST_ALPHA;
      c.uEdgeNoise.value = p.EDGE_NOISE;
      c.uEdgeScale.value = p.EDGE_SCALE;

      sceneA.environmentIntensity = p.ENV_INTENSITY;
      light.intensity = p.LIGHT_INTENSITY;

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
      t.uStrength.value = reduced ? 0 : Math.min(2.5, Math.sqrt(mouse.pace) * p.TRAIL_STRENGTH);
      t.uDecay.value = Math.pow(p.TRAIL_DECAY, dt * 60);
      t.uIntro.value = xray.on ? 2 : intro.trail;
      renderer.setRenderTarget(trail[1 - trailRead]);
      renderer.render(trailScene, ortho);
      trailRead = 1 - trailRead;
      prevMouse.copy(mouseUv);
      stats.trail = Math.round(t.uStrength.value * 100) / 100;

      // warstwy
      placeStack();
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

    const stats = { fps: 0, smooth: 60, pace: 0, trail: 0 };
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      time += dt;
      if (autopilot) {
        // wirtualny kursor (Lissajous) po oknie: podgląd bez myszy, przyszły dryf na dotyku
        const r = visual.getBoundingClientRect();
        const cx = r.left + r.width * (0.5 + p.OBJECT_X);
        mouse.target.x = cx + Math.sin(time * 1.3) * r.width * p.OBJECT_WIDTH * 0.4;
        mouse.target.y = r.top + r.height * (0.5 + Math.sin(time * 1.9) * 0.22);
      }
      stats.smooth += (1 / Math.max(dt, 1e-3) - stats.smooth) * 0.05;
      stats.fps = Math.round(stats.smooth);
      stats.pace = Math.round(mouse.pace * 100) / 100;
      mouse.update(dt);
      fieldUniforms.uPhase.value += dt * field.SPEED;
      compositeMaterial.uniforms.uEdgePhase.value += dt * p.EDGE_SPEED;
      stack.update(dt, p.PULSE_SPEED, stackOptions());
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
        { trail: 1, yaw: 0.5, scale: 0.9 },
        { trail: 0, yaw: 0, scale: 1, duration: p.INTRO_DURATION, ease, overwrite: true }
      );
    };
    on('app:ready', playIntro);

    const gui = await loadDebug('Hero rentgen');
    if (gui) {
      if (window.innerWidth < 768) gui.close();
      const state = { debugTrail: false };
      gui.add(stats, 'fps').listen().disable();
      gui.add(stats, 'pace').listen().disable();
      gui.add(stats, 'trail').name('siła śladu').listen().disable();
      gui
        .add(state, 'debugTrail')
        .name('pokaż ślad')
        .onChange((v: boolean) => {
          compositeMaterial.uniforms.uDebugTrail.value = v ? 1 : 0;
        });
      gui.add({ replay: playIntro }, 'replay').name('powtórz intro');
      gui.add(xray, 'on').name('cała warstwa B');

      const o = gui.addFolder('Obiekt');
      o.add(p, 'OBJECT_WIDTH', 0.2, 1, 0.01);
      o.add(p, 'OBJECT_X', -0.5, 0.5, 0.01);
      o.add(p, 'YAW', -1, 1, 0.01);
      o.add(p, 'PITCH', -0.6, 0.6, 0.01);
      o.add(p, 'TILT', 0, 1, 0.01);
      o.add(p, 'IDLE', 0, 0.3, 0.005);
      o.add(p, 'EXPLODE', 0, 0.6, 0.01).name('rozsunięcie UI');
      o.add(p, 'ENV_INTENSITY', 0, 3, 0.05).name('światło otoczenia');
      o.add(p, 'LIGHT_INTENSITY', 0, 4, 0.05).name('światło kierunkowe');
      o.add(p, 'INTRO_DURATION', 0.4, 4, 0.05);

      const b = gui.addFolder('Warstwa B (maszynownia)');
      b.add(p, 'GRID_DENSITY', 1, 20, 0.5);
      b.add(p, 'GRID_ALPHA', 0, 1, 0.01);
      b.add(p, 'RIM', 0, 2, 0.01).name('krawędzie');
      b.add(p, 'PULSE_SPEED', 0, 4, 0.05);
      b.add(p, 'PULSE_SPACING', 0.2, 3, 0.05);
      b.add(p, 'PULSE_LENGTH', 0.05, 1, 0.01);
      b.add(p, 'PULSE_BASE', 0, 1, 0.01).name('jasność rur');
      b.add(p, 'GHOST_ALPHA', 0, 1, 0.01).name('duch maszynowni');

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
              // gotowy blok TS: wklej w miejsce heroRentgenParams w params.ts
              const ts = `export const heroRentgenParams = ${JSON.stringify(p, null, 2)};\n`;
              console.log(ts, '\nheroParams (tło):', JSON.stringify(field, null, 2));
              void navigator.clipboard?.writeText(ts);
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
      stack.dispose();
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

export default HeroRentgen;
