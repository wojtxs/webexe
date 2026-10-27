/**
 * hero-core.ts — spike hero „rdzeń z warstw” (tylko /lab/hero-core).
 *
 * Wieża z czterech modułów-usług (CoreStack). Choreografia według opisu użytkownika:
 * 1. app:ready: warstwy spadają po kolei od podstawy i zatrzaskują się w jeden mechanizm,
 * 2. potem mechanizm się włącza: impulsy w liniach, diody, pierścienie automatyzacji,
 * 3. mysz obraca rdzeń, wycięty klin pokazuje wnętrze,
 * 4. hover (tap na dotyku): warstwa się unosi, obok pojawia się etykieta,
 * 5. scroll (sticky track): rdzeń rozkłada się na warstwy z etykietami, czyli wejście w usługi.
 * Strojenie: ?debug. Podgląd rozkładu: ?p=0–1. Minimalny kod, nie produkcja (docelowo F4).
 */

import type { Module } from '@core/lifecycle';
import { cssColor } from '@core/css';
import { on, off } from '@core/events';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  DirectionalLight,
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Raycaster,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { Mouse } from '@gl/Mouse';
import { heroCoreParams, heroParams, type BackgroundMode } from '@gl/params';
import { createCoreStack } from '@gl/CoreStack';
import { loadDebug } from '@gl/debug';
import { easeFromToken } from '@gl/ease';
import { hasWebGL, maxDpr } from '@gl/support';
import noise from '@gl/shaders/noise.glsl?raw';
import bands from '@gl/shaders/bands.glsl?raw';
import bgGlsl from '@gl/shaders/bg.glsl?raw';
import quadVert from '@gl/shaders/quad.vert?raw';
import bgOnlyFrag from '@gl/shaders/bg-only.frag?raw';

gsap.registerPlugin(ScrollTrigger);

const CAMERA_Z = 10;
const CAMERA_FOV = 30;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const smooth = (a: number, b: number, v: number) => {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
};
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const frameLerp = (amount: number, dt: number) => 1 - Math.pow(1 - amount, dt * 60);

let cleanup: (() => void) | null = null;

const HeroCore: Module = {
  async init(root: HTMLElement) {
    const visual = root.querySelector<HTMLElement>('[data-gl="hero"]');
    const track = root.querySelector<HTMLElement>('[data-core-track]');
    const copy = root.querySelector<HTMLElement>('[data-core-copy]');
    const labels = Array.from(root.querySelectorAll<HTMLElement>('[data-core-label]'));
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    if (!visual || !track || !wrap) return;

    if (!hasWebGL()) {
      root.dataset.glFallback = '';
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = heroCoreParams;
    const field = heroParams;
    const query = new URLSearchParams(window.location.search);
    const bgQuery = Number(query.get('bg'));
    if (query.has('bg') && [0, 1, 2, 3].includes(bgQuery)) {
      field.BACKGROUND_MODE = bgQuery as BackgroundMode;
    }
    /** podgląd rozkładu bez scrolla (−1 = steruje scroll) */
    const preview = { p: query.has('p') ? clamp01(Number(query.get('p'))) : -1 };

    const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(maxDpr());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
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

    const coreOptions = () => ({
      rim: p.RIM,
      pulseSpacing: p.PULSE_SPACING,
      pulseLength: p.PULSE_LENGTH,
      pulseBase: p.PULSE_BASE,
    });
    const stack = createCoreStack(
      { biel, pianaLine, glebia, glebiaLine, glebiaRaise, start, end },
      coreOptions()
    );
    const n = stack.layers.length;

    // --- Sceny: tło ze wzorem pasm + rdzeń ---
    const pmrem = new PMREMGenerator(renderer);
    const envMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    const scene = new Scene();
    scene.environment = envMap;
    const light = new DirectionalLight(biel, p.LIGHT_INTENSITY);
    light.position.set(-3, 6, 5);
    scene.add(light, stack.root);

    const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    camera.position.z = CAMERA_Z;
    const visibleHeight = 2 * CAMERA_Z * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);

    const quad = new PlaneGeometry(2, 2);
    const ortho = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
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
    const bgMaterial = new ShaderMaterial({
      vertexShader: quadVert,
      fragmentShader: `${noise}\n${bands}\n${bgGlsl}\n${bgOnlyFrag}`,
      uniforms: {
        ...fieldUniforms,
        uBgColor: { value: piana },
        uBgInk: { value: pianaDeep },
        uBgInkAlpha: { value: p.BG_INK_ALPHA },
      },
      depthTest: false,
      depthWrite: false,
    });
    const bgScene = new Scene().add(new Mesh(quad, bgMaterial));

    // --- Stan ---
    const mouse = new Mouse({
      lerp: field.MOUSE_LERP,
      pacePx: field.PACE_PX,
      paceLerp: field.PACE_LERP,
    });
    const state = { p: 0, pTarget: 0, hover: -1, power: reduced ? 1 : 0 };
    const lifts = new Array<number>(n).fill(0);
    // intro: warstwy zaczynają nad kadrem, podstawa spada pierwsza
    const intro = stack.layers.map(() => ({
      y: reduced ? 0 : p.INTRO_DROP,
      spin: reduced ? 0 : -0.9,
    }));

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setPixelRatio(maxDpr());
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      fieldUniforms.uViewport.value.set(w, h);
      fieldUniforms.uDpr.value = renderer.getPixelRatio();
    };
    resize();

    const anchor = new Vector3();
    const place = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;
      const r = visual.getBoundingClientRect();
      const worldPerPx = visibleHeight / h;
      const e = smooth(0.12, 0.7, state.p);

      // rozkład: dodatkowy odstęp między warstwami, środek wieży zostaje na miejscu
      stack.layers.forEach((layer, i) => {
        const spread = ((n - 1) / 2 - i) * p.EXPLODE_GAP * e;
        layer.group.position.y = layer.baseY + spread + intro[i]!.y + lifts[i]!;
        layer.group.rotation.y = intro[i]!.spin;
      });
      stack.fitSpine();

      const size = mobile ? lerp(0.34, 0.5, e) : lerp(p.OBJECT_SIZE, p.EXPLODE_SIZE, e);
      const towerH = stack.height + (n - 1) * p.EXPLODE_GAP * e;
      // limit szerokości: rozłożona wieża zostawia miejsce na etykiety obok
      const maxWidth = (mobile ? lerp(0.78, 0.5, e) : 0.42) * r.width;
      const scale =
        Math.min(size * r.height, (maxWidth * towerH) / (2 * stack.radius)) * (worldPerPx / towerH);
      const cx = mobile
        ? r.left + r.width * (0.5 - 0.18 * e)
        : r.left + r.width * (0.5 + lerp(p.OBJECT_X, p.EXPLODE_X, e));
      const cy = mobile
        ? r.top + r.height * lerp(0.25, 0.42, e)
        : r.top + r.height * (0.5 + p.OBJECT_Y);

      const mx = (mouse.eased.x / w) * 2 - 1;
      const my = (mouse.eased.y / h) * 2 - 1;
      const g = stack.root;
      g.position.set((cx - w / 2) * worldPerPx, -(cy - h / 2) * worldPerPx, 0);
      g.scale.setScalar(scale);
      g.rotation.set(
        p.PITCH + (reduced ? 0 : my * p.TILT),
        lerp(p.YAW, p.EXPLODE_YAW, e) + (reduced ? 0 : mx * p.TURN * (1 - 0.6 * e)),
        0
      );
      g.updateMatrixWorld(true);

      // etykiety: na prawo od krawędzi warstwy, na wysokości jej środka
      const pxPerWorld = 1 / worldPerPx;
      labels.forEach((el) => {
        const i = Number(el.dataset.coreLabel);
        const layer = stack.layers[i];
        if (!layer) return;
        anchor.set(0, layer.mid, 0);
        layer.group.localToWorld(anchor);
        anchor.project(camera);
        const cxPx = (anchor.x * 0.5 + 0.5) * w;
        const edge = layer.r * scale * pxPerWorld + 16;
        // brak miejsca po prawej: etykieta po lewej stronie warstwy, a jeśli i tam się nie mieści, przy krawędzi
        const overflow = cxPx + edge + el.offsetWidth > w - 16;
        const left = overflow && cxPx - edge - el.offsetWidth >= 16;
        const x = left
          ? cxPx - edge - el.offsetWidth
          : Math.min(cxPx + edge, w - 16 - el.offsetWidth);
        el.classList.toggle('is-left', left);
        const y = (-anchor.y * 0.5 + 0.5) * h;
        el.style.transform = `translate3d(${x}px, ${y}px, 0) translateY(-50%)`;
        el.classList.toggle('is-on', reduced || state.hover === i || e > 0.6);
      });
      root.classList.toggle('is-exploded', e > 0.6);

      // kopia hero znika na początku rozkładu
      if (copy && !reduced) {
        const fade = clamp01(state.p / 0.22);
        copy.style.opacity = String(1 - fade);
        copy.style.transform = `translateY(${-3 * fade}rem)`;
      }
    };

    const applyParams = () => {
      const u = fieldUniforms;
      u.uScale.value = field.SCALE;
      u.uDetail.value = field.NOISE_DETAIL;
      u.uDistortScale.value = field.DISTORT_SCALE;
      u.uDistortIntensity.value = field.DISTORT_INTENSITY;
      u.uCell.value = field.GRID_CELL;
      u.uMode.value = field.BACKGROUND_MODE;
      u.uDotMin.value = field.DOT_MIN;
      u.uDotMax.value = field.DOT_MAX;
      u.uLineWidth.value = field.LINE_WIDTH;
      bgMaterial.uniforms.uBgInkAlpha.value = field.BACKGROUND_CONTOURS ? p.BG_INK_ALPHA : 0;
      scene.environmentIntensity = p.ENV_INTENSITY;
      light.intensity = p.LIGHT_INTENSITY;
      stack.setPower(state.power);
    };

    const render = () => {
      applyParams();
      place();
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(bgScene, ortho);
      renderer.clearDepth();
      renderer.render(scene, camera);
    };

    // --- Hover / tap: która warstwa jest pod wskaźnikiem ---
    const raycaster = new Raycaster();
    const ndc = new Vector2();
    const pick = (x: number, y: number) => {
      ndc.set((x / window.innerWidth) * 2 - 1, -(y / window.innerHeight) * 2 + 1);
      raycaster.setFromCamera(ndc, camera);
      const hit = raycaster.intersectObjects(stack.housings, false)[0];
      const layer = hit ? (hit.object.userData.layer as number) : -1;
      if (layer !== state.hover) {
        state.hover = layer;
        if (reduced) render();
      }
    };
    const onPointer = (e: PointerEvent) => pick(e.clientX, e.clientY);
    window.addEventListener('pointermove', onPointer, { passive: true });
    window.addEventListener('pointerdown', onPointer, { passive: true });

    const stats = { fps: 0, smooth: 60, p: 0 };
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      stats.smooth += (1 / Math.max(dt, 1e-3) - stats.smooth) * 0.05;
      stats.fps = Math.round(stats.smooth);
      mouse.update(dt);

      const target = preview.p >= 0 ? preview.p : state.pTarget;
      state.p += (target - state.p) * frameLerp(0.12, dt);
      stats.p = Math.round(state.p * 100) / 100;
      lifts.forEach((v, i) => {
        const goal = state.hover === i && state.p < 0.4 ? p.HOVER_LIFT : 0;
        lifts[i] = v + (goal - v) * frameLerp(0.15, dt);
      });

      fieldUniforms.uPhase.value += dt * field.SPEED;
      stack.update(dt, p.PULSE_SPEED, p.SPIN * state.power, coreOptions());
      render();
    };

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          state.pTarget = reduced ? 0 : self.progress;
        },
      });
    }, root);

    if (reduced) {
      render();
      window.addEventListener('scroll', render, { passive: true });
    } else {
      gsap.ticker.add(tick);
    }

    const onResize = () => {
      resize();
      if (reduced) render();
    };
    window.addEventListener('resize', onResize);

    const ease = easeFromToken('--ease-default');
    let introTl: gsap.core.Timeline | null = null;
    const playIntro = () => {
      if (reduced) return;
      introTl?.kill();
      state.power = 0;
      introTl = gsap.timeline();
      // od podstawy w górę: każda warstwa spada i dokręca się do pozycji
      for (let k = 0; k < n; k++) {
        const i = n - 1 - k;
        introTl.fromTo(
          intro[i]!,
          { y: p.INTRO_DROP + k * 0.4, spin: -0.9 },
          { y: 0, spin: 0, duration: p.INTRO_DURATION, ease },
          k * p.INTRO_STAGGER
        );
      }
      // mechanizm się włącza, gdy ostatnia warstwa siądzie
      introTl.to(state, { power: 1, duration: 0.6, ease: 'power2.out' }, '-=0.25');
    };
    on('app:ready', playIntro);

    const gui = await loadDebug('Hero rdzeń');
    if (gui) {
      if (window.innerWidth < 768) gui.close();
      gui.add(stats, 'fps').listen().disable();
      gui.add(stats, 'p').name('progres scrolla').listen().disable();
      gui.add(preview, 'p', -1, 1, 0.01).name('podgląd rozkładu (−1 = scroll)');
      gui.add({ replay: playIntro }, 'replay').name('powtórz intro');

      const o = gui.addFolder('Obiekt');
      o.add(p, 'OBJECT_SIZE', 0.2, 1.2, 0.01);
      o.add(p, 'OBJECT_X', -0.5, 0.5, 0.01);
      o.add(p, 'OBJECT_Y', -0.5, 0.5, 0.01);
      o.add(p, 'YAW', -Math.PI, Math.PI, 0.01);
      o.add(p, 'PITCH', -0.2, 1.2, 0.01);
      o.add(p, 'TURN', 0, 1.5, 0.01).name('obrót za kursorem');
      o.add(p, 'TILT', 0, 0.6, 0.01);
      o.add(p, 'HOVER_LIFT', 0, 0.4, 0.01);
      o.add(p, 'ENV_INTENSITY', 0, 3, 0.05).name('światło otoczenia');
      o.add(p, 'LIGHT_INTENSITY', 0, 4, 0.05).name('światło kierunkowe');

      const m = gui.addFolder('Wnętrze');
      m.add(p, 'RIM', 0, 2, 0.01).name('krawędzie');
      m.add(p, 'PULSE_SPEED', 0, 4, 0.05);
      m.add(p, 'PULSE_SPACING', 0.2, 3, 0.05);
      m.add(p, 'PULSE_LENGTH', 0.05, 1, 0.01);
      m.add(p, 'PULSE_BASE', 0, 1, 0.01).name('jasność linii');
      m.add(p, 'SPIN', 0, 4, 0.05).name('pierścienie');

      const s = gui.addFolder('Scroll: rozkład');
      s.add(p, 'EXPLODE_GAP', 0, 1.5, 0.01);
      s.add(p, 'EXPLODE_X', -0.5, 0.5, 0.01);
      s.add(p, 'EXPLODE_SIZE', 0.2, 1.2, 0.01);
      s.add(p, 'EXPLODE_YAW', -Math.PI, Math.PI, 0.01);

      const i = gui.addFolder('Intro');
      i.add(p, 'INTRO_DURATION', 0.3, 3, 0.05);
      i.add(p, 'INTRO_STAGGER', 0, 0.6, 0.01);
      i.add(p, 'INTRO_DROP', 0.5, 10, 0.1);
      i.close();

      const g = gui.addFolder('Tło');
      g.add(field, 'BACKGROUND_CONTOURS').name('wzór tła');
      g.add(field, 'BACKGROUND_MODE', {
        'poziomice (organiczne)': 0,
        kropki: 1,
        'schodki na siatce': 2,
        kreskowanie: 3,
      }).name('tryb');
      g.add(p, 'BG_INK_ALPHA', 0, 1, 0.01).name('krycie wzoru');
      g.close();

      gui
        .add(
          {
            copy: () => {
              // gotowy blok TS: wklej w miejsce heroCoreParams w params.ts
              const ts = `export const heroCoreParams = ${JSON.stringify(p, null, 2)};\n`;
              console.log(ts);
              void navigator.clipboard?.writeText(ts);
            },
          },
          'copy'
        )
        .name('kopiuj parametry (do params.ts)');
    }

    cleanup = () => {
      off('app:ready', playIntro);
      introTl?.kill();
      ctx.revert();
      gsap.ticker.remove(tick);
      window.removeEventListener('scroll', render);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      window.removeEventListener('pointerdown', onPointer);
      gui?.destroy();
      mouse.destroy();
      stack.dispose();
      bgMaterial.dispose();
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

export default HeroCore;
