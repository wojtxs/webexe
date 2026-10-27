/**
 * hero-portal.ts — spike hero „Przez x” + wejście w Manifest (tylko /lab/hero-portal).
 *
 * 1. Intro (app:ready): litery wordmarku wyjeżdżają spod linii, kreski x się rysują, potem kopia.
 * 2. Kursor ugina pasma tła (jak u Lando) i lekko rozwiera kreski x.
 * 3. Scroll po sticky tracku: kopia znika, litery rozjeżdżają się na boki, x rośnie wokół
 *    wierzchołka górnego klina. Wnętrze klina to portal: tło GL w palecie następnej sekcji.
 *    Klin zjeżdża pod ekran i rośnie, aż zakryje cały kadr, a wtedy jesteśmy w Manifeście.
 * 4. Manifest: słowa odsłaniają się scrollem, na końcu rysuje się znak x.
 * Geometria x w viewBox 100×100: kreski pod kątem X_ANGLE od pionu, grubość 16.
 */

import type { Module } from '@core/lifecycle';
import { cssColor } from '@core/css';
import { on, off } from '@core/events';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { Mouse } from '@gl/Mouse';
import { heroParams, heroPortalParams } from '@gl/params';
import { loadDebug } from '@gl/debug';
import { easeFromToken } from '@gl/ease';
import { hasWebGL, maxDpr } from '@gl/support';
import noise from '@gl/shaders/noise.glsl?raw';
import bands from '@gl/shaders/bands.glsl?raw';
import bgGlsl from '@gl/shaders/bg.glsl?raw';
import quadVert from '@gl/shaders/quad.vert?raw';
import portalFrag from '@gl/shaders/portal.frag?raw';

gsap.registerPlugin(ScrollTrigger);

/** kąt kresek od pionu, jak w znaku x z brand boardu */
const X_ANGLE = 0.56;
/** wierzchołek górnego klina (styk wewnętrznych krawędzi kresek) i końce ramion, ułamek wysokości */
const APEX_V = (50 - 8 / Math.sin(X_ANGLE)) / 100;
const TOP_V = 0.161;
/** długość kreski w viewBox (do rysowania przez stroke-dashoffset) */
const STROKE_LEN = 80;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const range = (v: number, [a, b]: [number, number]) => clamp01((v - a) / (b - a));
const inOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const easeIn = (t: number) => t * t * t;
const frameLerp = (amount: number, dt: number) => 1 - Math.pow(1 - amount, dt * 60);

let cleanup: (() => void) | null = null;

const HeroPortal: Module = {
  async init(root: HTMLElement) {
    const track = root.querySelector<HTMLElement>('[data-portal-track]');
    const wordmark = root.querySelector<HTMLElement>('[data-portal-wordmark]');
    const xEl = root.querySelector<HTMLElement>('[data-portal-x]');
    const copy = root.querySelector<HTMLElement>('[data-portal-copy]');
    const hint = root.querySelector<HTMLElement>('[data-portal-hint]');
    const lefts = Array.from(root.querySelectorAll<HTMLElement>('[data-portal-letter="left"]'));
    const rights = Array.from(root.querySelectorAll<HTMLElement>('[data-portal-letter="right"]'));
    const strokes = Array.from(root.querySelectorAll<SVGLineElement>('[data-portal-stroke]'));
    const manifest = document.querySelector<HTMLElement>('[data-portal-manifest]');
    const mTrack = manifest?.querySelector<HTMLElement>('[data-manifest-track]');
    const words = Array.from(manifest?.querySelectorAll<HTMLElement>('[data-manifest-word]') ?? []);
    const mX = manifest?.querySelector<SVGSVGElement>('[data-manifest-x]');
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    if (!track || !wordmark || !xEl || !wrap) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const p = heroPortalParams;
    const field = heroParams;
    const state = { p: 0, pTarget: 0, m: 0, mTarget: 0 };

    // --- Pomiary w spoczynku (bez transformów) ---
    const rest = { offX: 0, offY: 0, w: 0, h: 0, lefts: [] as number[], rights: [] as number[] };
    const measure = () => {
      const all = [xEl, ...lefts, ...rights];
      all.forEach((el) => (el.style.transform = ''));
      const wm = wordmark.getBoundingClientRect();
      const xr = xEl.getBoundingClientRect();
      rest.offX = xr.left - wm.left;
      rest.offY = xr.top - wm.top;
      rest.w = xr.width;
      rest.h = xr.height;
      rest.lefts = lefts.map((el) => el.getBoundingClientRect().right);
      rest.rights = rights.map((el) => el.getBoundingClientRect().left);
    };

    // --- GL: tło z pasmami i portalem ---
    const gl = hasWebGL();
    if (!gl) document.documentElement.dataset.glFallback = '';
    let renderer: WebGLRenderer | null = null;
    let material: ShaderMaterial | null = null;
    const quad = new PlaneGeometry(2, 2);
    const scene = new Scene();
    const ortho = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const u: Record<string, IUniform> = {
      uViewport: { value: new Vector2() },
      uDpr: { value: 1 },
      uPhase: { value: Math.random() * 100 },
      uScale: { value: field.SCALE },
      uDetail: { value: field.NOISE_DETAIL },
      uDistortScale: { value: field.DISTORT_SCALE },
      uDistortIntensity: { value: field.DISTORT_INTENSITY },
      uMouse: { value: new Vector2() },
      uPace: { value: 0 },
      uCursorScale: { value: p.CURSOR_SCALE },
      uCursorIntensity: { value: p.CURSOR_INTENSITY },
      uCursorBounce: { value: p.CURSOR_BOUNCE },
      uReveal: { value: 1 },
      uRevealSize: { value: 0 },
      uLineWidth: { value: field.LINE_WIDTH },
      uCell: { value: field.GRID_CELL },
      uMode: { value: field.BACKGROUND_MODE },
      uDotMin: { value: field.DOT_MIN },
      uDotMax: { value: field.DOT_MAX },
      uLightBg: { value: null },
      uLightInk: { value: null },
      uDarkBg: { value: null },
      uDarkInk: { value: null },
      uInkAlphaLight: { value: p.INK_ALPHA_LIGHT },
      uInkAlphaDark: { value: p.INK_ALPHA_DARK },
      uApex: { value: new Vector2() },
      uNormalL: { value: new Vector2(Math.cos(X_ANGLE), Math.sin(X_ANGLE)) },
      uNormalR: { value: new Vector2(-Math.cos(X_ANGLE), Math.sin(X_ANGLE)) },
      uUp: { value: new Vector2(0, 1) },
      uDepth: { value: 0 },
      uPortal: { value: 0 },
      uDark: { value: 0 },
    };

    if (gl) {
      renderer = new WebGLRenderer({ powerPreference: 'high-performance' });
      renderer.setPixelRatio(maxDpr());
      renderer.setSize(window.innerWidth, window.innerHeight);
      wrap.appendChild(renderer.domElement);
      const [piana, pianaDeep, glebia, glebiaLine] = await Promise.all(
        ['--c-piana', '--c-piana-deep', '--c-glebia', '--c-glebia-line'].map((t) => cssColor(t))
      );
      u.uLightBg.value = piana;
      u.uLightInk.value = pianaDeep;
      u.uDarkBg.value = glebia;
      u.uDarkInk.value = glebiaLine;
      material = new ShaderMaterial({
        vertexShader: quadVert,
        fragmentShader: `${noise}\n${bands}\n${bgGlsl}\n${portalFrag}`,
        uniforms: u,
        depthTest: false,
        depthWrite: false,
      });
      scene.add(new Mesh(quad, material));
    }

    const mouse = new Mouse({
      lerp: field.MOUSE_LERP,
      pacePx: field.PACE_PX,
      paceLerp: field.PACE_LERP,
    });

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      measure();
      if (renderer) {
        renderer.setPixelRatio(maxDpr());
        renderer.setSize(w, h);
        u.uViewport.value.set(w, h);
        u.uDpr.value = renderer.getPixelRatio();
      }
    };

    // --- Klatka: wszystko liczone z progresu, bez tweenów (scrub w obie strony) ---
    const place = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const pr = reduced ? 0 : state.p;

      // kopia i podpowiedź
      const c = range(pr, p.COPY_OUT);
      if (copy) {
        copy.style.opacity = String(1 - c);
        copy.style.transform = `translateY(${c * 2}rem)`;
      }
      if (hint) hint.style.opacity = String(1 - c);

      // litery: zewnętrzne wyjeżdżają pierwsze
      const [a, b] = p.LETTERS_OUT;
      lefts.forEach((el, i) => {
        const t = easeIn(clamp01((pr - a - i * 0.03) / (b - a - 0.09)));
        el.style.transform = `translate3d(${-t * (rest.lefts[i]! + 60)}px, 0, 0)`;
      });
      rights.forEach((el, i) => {
        const t = easeIn(clamp01((pr - a - 0.03) / (b - a - 0.03)));
        el.style.transform = `translate3d(${t * (W - rest.rights[i]! + 60)}px, 0, 0)`;
      });

      // x: skala wykładnicza wokół wierzchołka klina, wierzchołek zjeżdża pod ekran
      const wm = wordmark.getBoundingClientRect();
      const ax = rest.w * 0.5;
      const ay = rest.h * APEX_V;
      const restApexX = wm.left + rest.offX + ax;
      const restApexY = wm.top + rest.offY + ay;
      const depthRest = rest.h * (APEX_V - TOP_V);
      // klin (V otwarte w górę) zakrywa ekran, gdy jego boki obejmują dolne rogi:
      // wierzchołek pod ekranem o tyle, żeby szerokość klina na dole ≥ szerokość ekranu
      const apexEndY = H + W / 2 / Math.tan(X_ANGLE) + 40;
      const sEnd = Math.max(1, ((apexEndY + 40) / depthRest) * p.ZOOM_OVERSHOOT);
      const z = inOut(range(pr, p.ZOOM));
      const s = Math.exp(Math.log(sEnd) * z);
      const apexX = restApexX + (W / 2 - restApexX) * z;
      const apexY = restApexY + (apexEndY - restApexY) * z;
      xEl.style.transformOrigin = `${ax}px ${ay}px`;
      xEl.style.transform = `translate3d(${apexX - restApexX}px, ${apexY - restApexY}px, 0) scale(${s})`;

      // kreski rozwierają się za kursorem tylko w spoczynku
      const mx = (mouse.eased.x / W) * 2 - 1;
      const sc = reduced ? 0 : mx * p.SCISSOR * (1 - z);
      strokes[0]?.setAttribute('transform', `rotate(${sc} 50 50)`);
      strokes[1]?.setAttribute('transform', `rotate(${-sc} 50 50)`);

      // portal w GL: wierzchołek w px, y od dołu; klin otwarty w górę aż do krawędzi ekranu
      u.uApex.value.set(apexX, H - apexY);
      u.uDepth.value = 1e6;
      u.uPortal.value = range(pr, p.PORTAL_IN);
      const dark = reduced ? (state.pTarget > 0.5 ? 1 : 0) : range(pr, p.DARK);
      u.uDark.value = dark;
      // po przejściu ramiona x znikają, inaczej po zwolnieniu sticky wjechałyby w kadr
      xEl.style.opacity = String(1 - dark);

      // Manifest: słowo po słowie, na końcu rysuje się x
      const m = reduced ? 1 : state.m;
      const n = words.length;
      words.forEach((el, i) => {
        const t = clamp01(((m - 0.05) / 0.75) * n - i);
        el.style.opacity = String(0.14 + 0.86 * t);
      });
      if (mX) {
        const d = clamp01((m - 0.8) / 0.12);
        mX.querySelectorAll('line').forEach((line) => {
          line.style.strokeDasharray = `${STROKE_LEN}`;
          line.style.strokeDashoffset = `${(1 - d) * STROKE_LEN}`;
        });
      }
    };

    const render = () => {
      place();
      if (renderer) {
        u.uMouse.value.set(
          mouse.eased.x / window.innerHeight,
          (window.innerHeight - mouse.eased.y) / window.innerHeight
        );
        u.uPace.value = reduced ? 0 : mouse.pace;
        renderer.render(scene, ortho);
      }
    };

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      mouse.update(dt);
      // Lenis już wygładza scroll, tu tylko lekki dociąg, żeby skala x nie szarpała
      state.p += (state.pTarget - state.p) * frameLerp(0.35, dt);
      state.m += (state.mTarget - state.m) * frameLerp(0.35, dt);
      u.uPhase.value += dt * field.SPEED;
      render();
    };

    const ease = easeFromToken('--ease-default');
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: track,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => (state.pTarget = self.progress),
      });
      if (mTrack) {
        ScrollTrigger.create({
          trigger: mTrack,
          start: 'top top',
          end: 'bottom bottom',
          onUpdate: (self) => (state.mTarget = self.progress),
        });
      }
    }, root);

    // intro: stan początkowy ustawiony od razu, żeby nic nie mignęło przed app:ready
    const letterInner = Array.from(root.querySelectorAll<HTMLElement>('.px-li'));
    const reveals = Array.from(root.querySelectorAll<HTMLElement>('[data-portal-reveal]'));
    if (!reduced) {
      gsap.set(letterInner, { yPercent: 70, opacity: 0 });
      gsap.set(strokes, { strokeDasharray: STROKE_LEN, strokeDashoffset: STROKE_LEN });
      gsap.set(reveals, { y: '1.5rem', opacity: 0 });
    }
    let introTl: gsap.core.Timeline | null = null;
    const playIntro = () => {
      if (reduced) return;
      introTl?.kill();
      introTl = gsap
        .timeline()
        .to(letterInner.slice(0, 4), {
          yPercent: 0,
          opacity: 1,
          duration: 1.1,
          ease,
          stagger: p.INTRO_STAGGER,
        })
        .to(strokes, { strokeDashoffset: 0, duration: 0.7, ease, stagger: 0.12 }, 0.25)
        .to(letterInner.slice(4), { yPercent: 0, opacity: 1, duration: 1.1, ease }, 0.3)
        .to(reveals, { y: 0, opacity: 1, duration: 0.75, ease, stagger: 0.1 }, 0.6);
    };
    on('app:ready', playIntro);

    resize();
    const onResize = () => {
      resize();
      ScrollTrigger.refresh();
      if (reduced) render();
    };
    window.addEventListener('resize', onResize);
    if (reduced) {
      render();
      window.addEventListener('scroll', render, { passive: true });
      ScrollTrigger.addEventListener('refresh', render);
    } else {
      gsap.ticker.add(tick);
    }

    const gui = await loadDebug('Hero przez x');
    if (gui) {
      if (window.innerWidth < 768) gui.close();
      gui.add({ replay: playIntro }, 'replay').name('powtórz intro');
      gui.add(p, 'ZOOM_OVERSHOOT', 1, 3, 0.05);
      gui.add(p, 'SCISSOR', 0, 15, 0.5).name('rozwarcie x (°)');
      gui
        .add(p, 'INK_ALPHA_LIGHT', 0, 1, 0.01)
        .onChange((v: number) => (u.uInkAlphaLight.value = v));
      gui.add(p, 'INK_ALPHA_DARK', 0, 1, 0.01).onChange((v: number) => (u.uInkAlphaDark.value = v));
      gui
        .add(p, 'CURSOR_INTENSITY', 0, 1, 0.01)
        .onChange((v: number) => (u.uCursorIntensity.value = v));
      gui
        .add(field, 'BACKGROUND_MODE', {
          'poziomice (organiczne)': 0,
          kropki: 1,
          'schodki na siatce': 2,
          kreskowanie: 3,
        })
        .name('wzór tła')
        .onChange((v: number) => (u.uMode.value = v));
    }

    cleanup = () => {
      off('app:ready', playIntro);
      introTl?.kill();
      ctx.revert();
      gsap.ticker.remove(tick);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', render);
      ScrollTrigger.removeEventListener('refresh', render);
      gui?.destroy();
      mouse.destroy();
      [xEl, copy, hint, ...lefts, ...rights, ...words].forEach((el) =>
        el?.removeAttribute('style')
      );
      material?.dispose();
      quad.dispose();
      renderer?.dispose();
      renderer?.domElement.remove();
    };
  },

  destroy() {
    cleanup?.();
    cleanup = null;
  },
};

export default HeroPortal;
