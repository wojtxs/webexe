/**
 * hero-ribbon.ts — spike hero „wstęga z kodu” (tylko /lab/hero-ribbon).
 *
 * Jeden obiekt w języku OFF+BRAND: wstęga z prawdziwym kodem strony zawiązana w pętlę na Głębi.
 * 1. app:ready: wstęga „drukuje się” od początku i uspokaja skręt,
 * 2. spoczynek: oddycha, skręca się i faluje jak jedwab,
 * 3. kursor ją prasuje: w śladzie fałdy znikają, wstęga obraca się do kamery, kod ostrzeje i jaśnieje,
 *    ślad powoli wraca do fałd,
 * 4. scroll (sticky track): pętla rozwija się w pionową płachtę kodu, pod nią wjeżdża Manifest.
 * Strojenie: ?debug. Podgląd rozwinięcia: ?p=0–1. Minimalny kod, nie produkcja (docelowo F4).
 */

import type { Module } from '@core/lifecycle';
import { cssColor } from '@core/css';
import { on, off } from '@core/events';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Mesh,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { Mouse } from '@gl/Mouse';
import { heroParams, heroRibbonParams, type BackgroundMode } from '@gl/params';
import { createRibbon } from '@gl/Ribbon';
import { loadDebug } from '@gl/debug';
import { easeFromToken } from '@gl/ease';
import { hasWebGL, maxDpr } from '@gl/support';
import noise from '@gl/shaders/noise.glsl?raw';
import bands from '@gl/shaders/bands.glsl?raw';
import bgGlsl from '@gl/shaders/bg.glsl?raw';
import quadVert from '@gl/shaders/quad.vert?raw';
import bgOnlyFrag from '@gl/shaders/bg-only.frag?raw';
// kod na wstędze: prawdziwe źródła tego spike'a
import ribbonSource from '@gl/Ribbon.ts?raw';
import moduleSource from './hero-ribbon.ts?raw';
import fragSource from '@gl/shaders/ribbon.frag?raw';

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

const HeroRibbon: Module = {
  async init(root: HTMLElement) {
    const track = root.querySelector<HTMLElement>('[data-ribbon-track]');
    const copy = root.querySelector<HTMLElement>('[data-ribbon-copy]');
    const manifest = document.querySelector<HTMLElement>('[data-ribbon-manifest]');
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    if (!track || !wrap) return;

    if (!hasWebGL()) {
      root.dataset.glFallback = '';
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = heroRibbonParams;
    const field = heroParams;
    const query = new URLSearchParams(window.location.search);
    const bgQuery = Number(query.get('bg'));
    if (query.has('bg') && [0, 1, 2, 3].includes(bgQuery)) {
      field.BACKGROUND_MODE = bgQuery as BackgroundMode;
    }
    /** podgląd rozwinięcia bez scrolla (−1 = steruje scroll) */
    const preview = { p: query.has('p') ? clamp01(Number(query.get('p'))) : -1 };

    const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(maxDpr());
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    wrap.appendChild(renderer.domElement);

    const [piana, glebia, glebiaLine, glebiaRaise, start, end] = await Promise.all(
      [
        '--c-piana',
        '--c-glebia',
        '--c-glebia-line',
        '--c-glebia-raise',
        '--c-laguna-start',
        '--c-laguna-end',
      ].map((t) => cssColor(t))
    );

    const ribbon = createRibbon(
      { base: glebiaRaise, start, end, ink: piana },
      [moduleSource, ribbonSource, fragSource],
      { cols: p.CHARS_PER_ROW, maxAnisotropy: renderer.capabilities.getMaxAnisotropy() }
    );
    const u = ribbon.uniforms;

    const scene = new Scene();
    scene.add(ribbon.root);
    const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 100);
    camera.position.z = CAMERA_Z;
    const visibleHeight = 2 * CAMERA_Z * Math.tan(((CAMERA_FOV / 2) * Math.PI) / 180);

    // --- Tło: Głębia + wzór pasm w --c-glebia-line ---
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
        uBgColor: { value: glebia },
        uBgInk: { value: glebiaLine },
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
    // bez ruchu wskaźnika nie prasujemy środka ekranu (Mouse startuje w centrum)
    let pointerSeen = false;
    const onPointer = () => (pointerSeen = true);
    window.addEventListener('pointermove', onPointer, { passive: true });
    const onLeave = () => (pointerSeen = false);
    document.documentElement.addEventListener('pointerleave', onLeave);

    const state = {
      p: 0,
      pTarget: 0,
      q: 0,
      qTarget: 0,
      time: 0,
      draw: reduced ? 1 : 0,
      introTwist: reduced ? 0 : 1,
    };

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

    const place = (dt: number) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mobile = w < 768;
      const worldPerPx = visibleHeight / h;
      const visibleWidth = visibleHeight * (w / h);
      const e = smooth(0.08, 0.85, state.p);

      const size = mobile ? 0.36 : p.OBJECT_SIZE;
      const scale = (size * visibleHeight) / (2 * p.LOOP_RADIUS);
      const cx = mobile ? w * 0.5 : w * (0.5 + p.OBJECT_X);
      const cy = mobile ? h * 0.26 : h * (0.5 + p.OBJECT_Y);
      const mx = (mouse.eased.x / w) * 2 - 1;
      const my = (mouse.eased.y / h) * 2 - 1;
      const calm = reduced ? 0 : 1 - e;

      const g = ribbon.root;
      g.position.set(
        lerp((cx - w / 2) * worldPerPx, 0, e),
        lerp(-(cy - h / 2) * worldPerPx, 0, e),
        0
      );
      g.scale.setScalar(scale);
      g.rotation.set(
        lerp(p.PITCH, 0, e) + my * p.TILT * calm,
        lerp(p.YAW, 0, e) + mx * p.TURN * calm,
        lerp(p.ROLL, 0, e)
      );

      const sheetWidth = ((mobile ? 0.86 : p.SHEET_WIDTH) * visibleWidth) / scale;
      const width = lerp(p.WIDTH, sheetWidth, e);
      u.uWidth.value = width;
      u.uTexLen.value = ribbon.texLen(width);

      ribbon.updateIron(dt, {
        camera,
        x: pointerSeen && !reduced ? mouse.eased.x : null,
        y: mouse.eased.y,
        width: w,
        height: h,
        radius: p.IRON_RADIUS,
        rise: p.IRON_RISE,
        fall: p.IRON_FALL,
        floor: e,
      });
      ribbon.updateCurve(
        state.time,
        {
          loopLength: p.LOOP_LENGTH,
          loopRadius: p.LOOP_RADIUS,
          loopDepth: p.LOOP_DEPTH,
          thetaStart: p.THETA_START,
          thetaEnd: p.THETA_END,
          twist: p.TWIST,
          twistFreq: p.TWIST_FREQ,
          twistSpeed: p.TWIST_SPEED,
          breath: reduced ? 0 : p.BREATH,
          breathSpeed: p.BREATH_SPEED,
          ironLift: p.IRON_LIFT,
          sheet: e,
          sheetLength: (visibleHeight * 3.2) / scale,
          // płachta przesuwa się w górę, gdy wjeżdża Manifest
          sheetOffset: (state.q * visibleHeight * 1.4) / scale,
        },
        state.introTwist
      );
      ribbon.setEchoes(e > 0.9 ? 0 : p.ECHO_COUNT);
      u.uEchoGap.value = p.ECHO_GAP * (1 - e);
      u.uDim.value = 1 - (1 - p.SHEET_DIM) * smooth(0.05, 0.4, state.q);

      // kopia hero znika na początku rozwijania
      if (copy && !reduced) {
        const fade = clamp01(state.p / 0.25);
        copy.style.opacity = String(1 - fade);
        copy.style.transform = `translateY(${-3 * fade}rem)`;
      }
    };

    const applyParams = () => {
      const f = fieldUniforms;
      f.uScale.value = field.SCALE;
      f.uDetail.value = field.NOISE_DETAIL;
      f.uDistortScale.value = field.DISTORT_SCALE;
      f.uDistortIntensity.value = field.DISTORT_INTENSITY;
      f.uCell.value = field.GRID_CELL;
      f.uMode.value = field.BACKGROUND_MODE;
      f.uDotMin.value = field.DOT_MIN;
      f.uDotMax.value = field.DOT_MAX;
      f.uLineWidth.value = field.LINE_WIDTH;
      bgMaterial.uniforms.uBgInkAlpha.value = field.BACKGROUND_CONTOURS ? p.BG_INK_ALPHA : 0;

      u.uTime.value = state.time;
      u.uRipple.value = reduced ? 0 : p.RIPPLE;
      u.uRippleFreq.value = p.RIPPLE_FREQ;
      u.uEchoFan.value = p.ECHO_FAN;
      u.uTint.value = p.TINT;
      u.uSpec.value = p.SPEC;
      u.uGloss.value = p.GLOSS;
      u.uRim.value = p.RIM;
      u.uEdge.value = p.EDGE;
      u.uTextDim.value = p.TEXT_DIM;
      u.uTextGain.value = p.TEXT_GAIN;
      u.uDraw.value = state.draw;
    };

    const render = (dt = 0) => {
      applyParams();
      place(dt);
      renderer.setRenderTarget(null);
      renderer.clear();
      renderer.render(bgScene, ortho);
      renderer.clearDepth();
      renderer.render(scene, camera);
    };

    const stats = { fps: 0, smooth: 60, p: 0 };
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      stats.smooth += (1 / Math.max(dt, 1e-3) - stats.smooth) * 0.05;
      stats.fps = Math.round(stats.smooth);
      mouse.update(dt);

      const target = preview.p >= 0 ? preview.p : state.pTarget;
      state.p += (target - state.p) * frameLerp(0.12, dt);
      state.q += (state.qTarget - state.q) * frameLerp(0.12, dt);
      stats.p = Math.round(state.p * 100) / 100;
      state.time += dt * p.SPEED;
      fieldUniforms.uPhase.value += dt * field.SPEED;
      render(dt);
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
      if (manifest) {
        ScrollTrigger.create({
          trigger: manifest,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            state.qTarget = reduced ? 0 : self.progress;
          },
        });
      }
    }, root);

    const onResize = () => {
      resize();
      if (reduced) render();
    };
    window.addEventListener('resize', onResize);

    if (reduced) {
      render();
    } else {
      gsap.ticker.add(tick);
    }

    const ease = easeFromToken('--ease-default');
    let introTl: gsap.core.Timeline | null = null;
    const playIntro = () => {
      if (reduced) return;
      introTl?.kill();
      introTl = gsap
        .timeline()
        .fromTo(state, { draw: 0 }, { draw: 1, duration: p.INTRO_DURATION, ease }, 0)
        .fromTo(
          state,
          { introTwist: 1 },
          { introTwist: 0, duration: p.INTRO_DURATION * 1.3, ease: 'power2.out' },
          0
        );
    };
    on('app:ready', playIntro);

    const gui = await loadDebug('Hero wstęga');
    if (gui) {
      if (window.innerWidth < 768) gui.close();
      gui.add(stats, 'fps').listen().disable();
      gui.add(stats, 'p').name('progres scrolla').listen().disable();
      gui.add(preview, 'p', -1, 1, 0.01).name('podgląd rozwinięcia (−1 = scroll)');
      gui.add({ replay: playIntro }, 'replay').name('powtórz intro');

      const o = gui.addFolder('Obiekt');
      o.add(p, 'OBJECT_SIZE', 0.2, 1.2, 0.01);
      o.add(p, 'OBJECT_X', -0.5, 0.5, 0.01);
      o.add(p, 'OBJECT_Y', -0.5, 0.5, 0.01);
      o.add(p, 'YAW', -Math.PI, Math.PI, 0.01);
      o.add(p, 'PITCH', -1.2, 1.2, 0.01);
      o.add(p, 'ROLL', -1.2, 1.2, 0.01);
      o.add(p, 'TURN', 0, 1, 0.01).name('obrót za kursorem');
      o.add(p, 'TILT', 0, 0.6, 0.01);

      const c = gui.addFolder('Kształt');
      c.add(p, 'LOOP_LENGTH', 0, 6, 0.01);
      c.add(p, 'LOOP_RADIUS', 0.3, 2, 0.01);
      c.add(p, 'LOOP_DEPTH', 0, 2, 0.01);
      c.add(p, 'THETA_START', -1.5, 1, 0.01).name('początek pętli (×π)');
      c.add(p, 'THETA_END', 1, 4, 0.01).name('koniec pętli (×π)');
      c.add(p, 'WIDTH', 0.1, 1.5, 0.01).name('szerokość wstęgi');
      c.add(p, 'TWIST', 0, 3, 0.01).name('skręt');
      c.add(p, 'TWIST_FREQ', 0, 4, 0.01);
      c.add(p, 'TWIST_SPEED', 0, 2, 0.01);
      c.add(p, 'BREATH', 0, 0.3, 0.005).name('oddech');
      c.add(p, 'BREATH_SPEED', 0, 2, 0.01);
      c.add(p, 'RIPPLE', 0, 0.15, 0.001).name('fala jedwabiu');
      c.add(p, 'RIPPLE_FREQ', 0, 30, 0.1);
      c.add(p, 'SPEED', 0, 3, 0.01).name('tempo ruchu');

      const ec = gui.addFolder('Arkusze echa');
      ec.add(p, 'ECHO_COUNT', 0, 8, 1).name('liczba');
      ec.add(p, 'ECHO_GAP', 0, 0.1, 0.001).name('odstęp');
      ec.add(p, 'ECHO_FAN', 0, 5, 0.01).name('wachlarz');

      const k = gui.addFolder('Kursor: prasowanie');
      k.add(p, 'IRON_RADIUS', 40, 600, 1).name('promień (px)');
      k.add(p, 'IRON_RISE', 0.01, 1, 0.01).name('narastanie');
      k.add(p, 'IRON_FALL', 0.001, 0.2, 0.001).name('powrót fałd');
      k.add(p, 'IRON_LIFT', 0, 0.6, 0.01).name('wysunięcie do kamery');

      const m = gui.addFolder('Materiał');
      m.add(p, 'TINT', 0, 1, 0.01).name('nasycenie Laguną');
      m.add(p, 'SPEC', 0, 2, 0.01).name('połysk');
      m.add(p, 'GLOSS', 2, 200, 1).name('ostrość połysku');
      m.add(p, 'RIM', 0, 3, 0.01).name('fresnel');
      m.add(p, 'EDGE', 0, 2, 0.01).name('krawędź');
      m.add(p, 'TEXT_DIM', 0, 1, 0.01).name('kod w spoczynku');
      m.add(p, 'TEXT_GAIN', 0, 2, 0.01).name('kod: siła');

      const s = gui.addFolder('Scroll: płachta');
      s.add(p, 'SHEET_WIDTH', 0.2, 1, 0.01);
      s.add(p, 'SHEET_DIM', 0, 1, 0.01).name('przygaszenie pod Manifestem');

      const i = gui.addFolder('Intro');
      i.add(p, 'INTRO_DURATION', 0.3, 5, 0.05);
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
              // gotowy blok TS: wklej w miejsce heroRibbonParams w params.ts
              const ts = `export const heroRibbonParams = ${JSON.stringify(p, null, 2)};\n`;
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
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      gui?.destroy();
      mouse.destroy();
      ribbon.dispose();
      bgMaterial.dispose();
      quad.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  },

  destroy() {
    cleanup?.();
    cleanup = null;
  },
};

export default HeroRibbon;
