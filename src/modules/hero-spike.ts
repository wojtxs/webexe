/**
 * hero-spike.ts — spike F2 maski hero (tylko /lab/hero).
 *
 * Tło z poziomicami (pełny viewport) + płaszczyzna hero zsynchronizowana z [data-gl="hero"].
 * Obie płaszczyzny liczą to samo pole pasm w przestrzeni ekranu. Strojenie: ?debug.
 * Minimalny kod, nie produkcja: docelowa architektura (Experience, render targety) to F4.
 */

import type { Module } from '@core/lifecycle';
import { cssVar, cssColor } from '@core/css';
import { on, off } from '@core/events';
import gsap from 'gsap';
import { CustomEase } from 'gsap/CustomEase';
import { Scene, ShaderMaterial, Vector2, WebGLRenderer, type IUniform } from 'three';
import { createPixelCamera, fitPixelCamera } from '@gl/Camera';
import { DomPlane } from '@gl/DomPlane';
import { Mouse } from '@gl/Mouse';
import { heroColors, heroParams, type HeroVariant } from '@gl/params';
import { createPlaceholderTextures, type HeroTextures } from '@gl/placeholders';
import { loadDebug } from '@gl/debug';
import noise from '@gl/shaders/noise.glsl?raw';
import bands from '@gl/shaders/bands.glsl?raw';
import vertex from '@gl/shaders/plane.vert?raw';
import bandsFrag from '@gl/shaders/bands.frag?raw';
import contourFrag from '@gl/shaders/contour.frag?raw';

gsap.registerPlugin(CustomEase);

let cleanup: (() => void) | null = null;

function hasWebGL(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

/** --ease-default (cubic-bezier) → ease GSAP */
function easeFromToken(token: string): string {
  const nums = cssVar(token).match(/-?[\d.]+/g);
  if (nums?.length !== 4) return 'power3.out';
  const name = token.replace(/^--/, '');
  CustomEase.create(name, nums.join(','));
  return name;
}

function maxDpr(): number {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  return Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.25);
}

const HeroSpike: Module = {
  async init(root: HTMLElement) {
    const visual = root.querySelector<HTMLElement>('[data-gl="hero"]');
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    if (!visual || !wrap) return;

    if (!hasWebGL()) {
      root.dataset.glFallback = '';
      return;
    }

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const params = heroParams;
    // ?variant=2 pozwala porównać warianty z samego linku
    if (new URLSearchParams(window.location.search).get('variant') === '2') params.VARIANT = 2;

    const renderer = new WebGLRenderer({ alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(maxDpr());
    renderer.setSize(window.innerWidth, window.innerHeight);
    wrap.appendChild(renderer.domElement);

    const scene = new Scene();
    const camera = createPixelCamera();
    const mouse = new Mouse({
      lerp: params.MOUSE_LERP,
      pacePx: params.PACE_PX,
      paceLerp: params.PACE_LERP,
    });

    const [bg, lineBg, lineObject] = await Promise.all([
      cssColor(heroColors.background),
      cssColor(heroColors.lineBackground),
      cssColor(heroColors.lineObject),
    ]);

    // Wspólne uniformy pola pasm: te same obiekty w obu materiałach
    const field: Record<string, IUniform> = {
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
      uReveal: { value: reduced ? 1 : 0 },
      uRevealSize: { value: 0 },
      uLineWidth: { value: 1 },
    };

    const prefix = `${noise}\n${bands}\n`;

    const background = new DomPlane(
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: prefix + contourFrag,
        uniforms: { ...field, uBgColor: { value: bg }, uLineColor: { value: lineBg } },
        depthTest: false,
        depthWrite: false,
      })
    );

    let textures: Record<HeroVariant, HeroTextures | null> = { 1: null, 2: null };
    const getTextures = (v: HeroVariant) => (textures[v] ??= createPlaceholderTextures(v));
    const initial = getTextures(params.VARIANT);

    const heroMaterial = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: prefix + bandsFrag,
      uniforms: {
        ...field,
        tA: { value: initial.a },
        tB: { value: initial.b },
        tAlpha: { value: initial.alpha },
        uPlaneSize: { value: new Vector2() },
        uTexAspect: { value: initial.aspect },
        uLineColor: { value: lineObject },
        uLineAlpha: { value: params.LINE_ALPHA_OBJECT },
        uDebugMask: { value: 0 },
      },
      transparent: true,
      depthTest: false,
      depthWrite: false,
    });
    const hero = new DomPlane(heroMaterial, visual);

    background.mesh.renderOrder = 0;
    hero.mesh.renderOrder = 1;
    scene.add(background.mesh, hero.mesh);

    const setVariant = (v: HeroVariant) => {
      const t = getTextures(v);
      heroMaterial.uniforms.tA.value = t.a;
      heroMaterial.uniforms.tB.value = t.b;
      heroMaterial.uniforms.tAlpha.value = t.alpha;
      heroMaterial.uniforms.uTexAspect.value = t.aspect;
    };

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      renderer.setPixelRatio(maxDpr());
      renderer.setSize(w, h);
      fitPixelCamera(camera, w, h);
      field.uViewport.value.set(w, h);
      field.uDpr.value = renderer.getPixelRatio();
    };
    resize();

    const render = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;

      field.uScale.value = params.SCALE;
      field.uDetail.value = params.NOISE_DETAIL;
      field.uDistortScale.value = params.DISTORT_SCALE;
      field.uDistortIntensity.value = params.DISTORT_INTENSITY;
      field.uCursorScale.value = params.CURSOR_SCALE;
      field.uCursorIntensity.value = params.CURSOR_INTENSITY;
      field.uCursorBounce.value = params.CURSOR_BOUNCE;
      field.uRevealSize.value = params.REVEAL_SIZE;
      field.uLineWidth.value = params.LINE_WIDTH;
      heroMaterial.uniforms.uLineAlpha.value = params.LINE_ALPHA_OBJECT;

      field.uMouse.value.set(mouse.eased.x / h, (h - mouse.eased.y) / h);
      field.uPace.value = mouse.pace;

      background.mesh.visible = params.BACKGROUND_CONTOURS;
      background.sync(w, h);
      hero.sync(w, h);
      heroMaterial.uniforms.uPlaneSize.value.set(hero.size.width, hero.size.height);

      renderer.render(scene, camera);
    };

    const stats = { fps: 0, smooth: 0 };
    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      stats.smooth += (1 / Math.max(dt, 1e-3) - stats.smooth) * 0.05;
      stats.fps = Math.round(stats.smooth);
      mouse.options.lerp = params.MOUSE_LERP;
      mouse.options.pacePx = params.PACE_PX;
      mouse.options.paceLerp = params.PACE_LERP;
      mouse.update(dt);
      field.uPhase.value += dt * params.SPEED;
      render();
    };

    // Reduced motion: statyczna klatka, odświeżana tylko przy scrollu i resize
    if (reduced) {
      window.addEventListener('scroll', render, { passive: true });
      render();
    } else {
      gsap.ticker.add(tick);
    }

    const onResize = () => {
      resize();
      if (reduced) render();
    };
    window.addEventListener('resize', onResize);

    const ease = easeFromToken('--ease-default');
    const playIntro = () => {
      if (reduced) return;
      gsap.fromTo(
        field.uReveal,
        { value: 0 },
        { value: 1, duration: params.REVEAL_DURATION, ease, overwrite: true }
      );
    };
    on('app:ready', playIntro);

    const gui = await loadDebug('Hero spike (F2)');
    if (gui) {
      if (window.innerWidth < 768) gui.close();
      const state = { debugMask: false };
      gui.add(stats, 'fps').listen().disable();
      gui
        .add(params, 'VARIANT', {
          '1: aplikacja → infrastruktura': 1,
          '2: ręczna robota → system': 2,
        })
        .name('wariant (D2)')
        .onChange((v: HeroVariant) => setVariant(v));
      gui
        .add(state, 'debugMask')
        .name('pokaż maskę')
        .onChange((v: boolean) => {
          heroMaterial.uniforms.uDebugMask.value = v ? 1 : 0;
        });
      gui.add(params, 'BACKGROUND_CONTOURS').name('poziomice w tle');

      const f = gui.addFolder('Pasma');
      f.add(params, 'SPEED', 0, 0.5, 0.005);
      f.add(params, 'SCALE', 0.1, 5, 0.05);
      f.add(params, 'NOISE_DETAIL', 1, 10, 0.1);
      f.add(params, 'DISTORT_SCALE', 0, 5, 0.05);
      f.add(params, 'DISTORT_INTENSITY', 0, 2, 0.01);

      const c = gui.addFolder('Kursor');
      c.add(params, 'CURSOR_SCALE', 0.5, 10, 0.1);
      c.add(params, 'CURSOR_INTENSITY', 0, 1, 0.005);
      c.add(params, 'CURSOR_BOUNCE', -2, 2, 0.05);
      c.add(params, 'MOUSE_LERP', 0.01, 1, 0.01);
      c.add(params, 'PACE_PX', 5, 200, 1);
      c.add(params, 'PACE_LERP', 0.01, 1, 0.01);

      const r = gui.addFolder('Intro i kontury');
      r.add(params, 'REVEAL_DURATION', 0.2, 4, 0.05);
      r.add(params, 'REVEAL_SIZE', 0, 100, 1);
      r.add({ replay: playIntro }, 'replay').name('powtórz intro');
      r.add(params, 'LINE_WIDTH', 0, 4, 0.1);
      r.add(params, 'LINE_ALPHA_OBJECT', 0, 1, 0.01);

      gui
        .add(
          {
            copy: () => {
              const json = JSON.stringify(params, null, 2);
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
      gsap.killTweensOf(field.uReveal);
      window.removeEventListener('scroll', render);
      window.removeEventListener('resize', onResize);
      gui?.destroy();
      mouse.destroy();
      background.destroy();
      hero.destroy();
      background.mesh.material.dispose();
      heroMaterial.dispose();
      Object.values(textures).forEach((t) => t?.dispose());
      textures = { 1: null, 2: null };
      renderer.dispose();
      renderer.domElement.remove();
    };
  },

  destroy() {
    cleanup?.();
    cleanup = null;
  },
};

export default HeroSpike;
