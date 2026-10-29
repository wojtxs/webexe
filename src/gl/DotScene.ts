/**
 * DotScene.ts — znak x jako raster kropek (spike /lab/hero-arcs), zamiast sieci modułów (NetScene).
 *
 * Siatka punktów na cały ekran (CSS px). dot.vert liczy znak x jak bryłę (profil rury, światło)
 * i zamienia jasność na rozmiar kropki, jak druk półtonowy. Poza znakiem drobny raster gaśnie.
 * Światło wolno krąży, co kilka sekund przez znak przechodzi fala. Kursor rozpycha kropki,
 * kliknięcie puszcza falę uderzeniową, przytrzymanie serię. Intro i finał składają kropki
 * z rozsypki, przelot scrollem przybliża raster do środka znaku. Interfejs jak NetScene.
 */

import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  NormalBlending,
  OrthographicCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { cssColor } from '@core/css';
import type { Mouse } from '@gl/Mouse';
import { heroDotParams as p } from '@gl/params';
import { maxDpr } from '@gl/support';
import vert from '@gl/shaders/dot.vert?raw';
import frag from '@gl/shaders/dot.frag?raw';

/** musi się zgadzać z RIPPLES w dot.vert */
const RIPPLES = 4;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

export class DotScene {
  /** 0–1: kropki zlatują się w znak */
  intro = 1;
  scroll = 0;
  outro = 0;
  hold = false;
  /** finał przy CTA: 0 = rozsypka, 1 = znak złożony */
  gather = 1;

  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private points: Points<BufferGeometry, ShaderMaterial>;
  private u: Record<string, IUniform>;
  private ripples: { x: number; y: number; age: number; amp: number }[] = [];
  private time = 0;
  private nextHold = 0;
  private sweepAge = 0;
  private sweepNext = p.SWEEP_EVERY;
  private presence = 0;
  private mark = { x: 0, y: 0, s: 1 };
  private gridKey = '';

  private constructor(
    wrap: HTMLElement,
    readonly mouse: Mouse,
    col: Record<'bg' | 'bgInk' | 'start' | 'end', Color>
  ) {
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(maxDpr());
    this.renderer.setClearColor(col.bg, 1);
    wrap.appendChild(this.renderer.domElement);
    this.u = {
      uRes: { value: new Vector2(1, 1) },
      uDpr: { value: 1 },
      uC: { value: new Vector2() },
      uS: { value: 1 },
      uArm: { value: p.ARM },
      uZoom: { value: 1 },
      uLight: { value: new Vector3() },
      uSweep: { value: -1e4 },
      uGap: { value: p.GAP },
      uBgDot: { value: p.BG_DOT },
      uBgReach: { value: p.BG_REACH },
      uMouse: { value: new Vector3() },
      uMouseR: { value: p.MOUSE_R },
      uRipples: { value: Array.from({ length: RIPPLES }, () => new Vector4()) },
      uRippleSpeed: { value: p.RIPPLE_SPEED },
      uAppear: { value: 0 },
      uScatter: { value: p.SCATTER },
      uBgInk: { value: col.bgInk },
      uStart: { value: col.start },
      uEnd: { value: col.end },
      uBgAlpha: { value: p.BG_ALPHA },
    };
    this.points = new Points(
      new BufferGeometry(),
      new ShaderMaterial({
        vertexShader: vert,
        fragmentShader: frag,
        uniforms: this.u,
        transparent: true,
        depthTest: false,
        depthWrite: false,
        blending: NormalBlending,
      })
    );
    this.points.frustumCulled = false;
    this.scene.add(this.points);
    this.resize();
  }

  static async create(wrap: HTMLElement, mouse: Mouse): Promise<DotScene> {
    const tokens = {
      bg: '--c-wegiel',
      bgInk: '--c-kosc-muted',
      start: '--c-bursztyn-start',
      end: '--c-bursztyn-end',
    } as const;
    const entries = await Promise.all(
      Object.entries(tokens).map(async ([k, t]) => [k, await cssColor(t)] as const)
    );
    return new DotScene(
      wrap,
      mouse,
      Object.fromEntries(entries) as Record<keyof typeof tokens, Color>
    );
  }

  /** siatka punktów z zapasem poza ekranem (rozpychanie i przelot nie odsłaniają krawędzi) */
  private buildGrid(w: number, h: number, gap: number): void {
    const key = `${w}x${h}@${gap}`;
    if (key === this.gridKey) return;
    this.gridKey = key;
    const pad = gap * 4;
    const cols = Math.ceil((w + pad * 2) / gap);
    const rows = Math.ceil((h + pad * 2) / gap);
    const base = new Float32Array(cols * rows * 2);
    const rnd = new Float32Array(cols * rows * 3);
    const pos = new Float32Array(cols * rows * 3);
    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        base[i * 2] = -pad + x * gap + (y % 2) * gap * 0.5;
        base[i * 2 + 1] = -pad + y * gap;
        rnd[i * 3] = Math.random();
        rnd[i * 3 + 1] = Math.random();
        rnd[i * 3 + 2] = Math.random();
        i++;
      }
    }
    const g = this.points.geometry;
    g.setAttribute('position', new Float32BufferAttribute(pos, 3));
    g.setAttribute('aBase', new Float32BufferAttribute(base, 2));
    g.setAttribute('aRnd', new Float32BufferAttribute(rnd, 3));
    g.setDrawRange(0, cols * rows);
  }

  private ripple(amp: number): void {
    if (this.ripples.length >= RIPPLES) this.ripples.shift();
    this.ripples.push({ x: this.mouse.eased.x, y: this.mouse.eased.y, age: 0, amp });
  }

  /** kliknięcie: fala uderzeniowa od kursora */
  burst(): void {
    this.ripple(1);
  }

  /** szybki scroll: fala światła przez znak, jeśli poprzednia już przeszła */
  fire(): void {
    if (this.sweepAge > 1.6) this.sweepAge = 0;
  }

  /** znak na ekranie (CSS px, y w dół): środek i rozmiar jak w masce x modułu */
  hubScreen(): { x: number; y: number; size: number } {
    return { x: this.mark.x, y: this.mark.y, size: this.mark.s * (this.u.uZoom!.value as number) };
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = maxDpr();
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    (this.u.uRes!.value as Vector2).set(w, h);
    this.u.uDpr!.value = dpr;
    const gap = w < 768 ? p.GAP_M : p.GAP;
    this.u.uGap!.value = gap;
    this.buildGrid(w, h, gap);
  }

  update(dt: number, reduced: boolean): void {
    this.time += dt;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const mobile = w < 768;
    const u = this.u;

    // znak: prawa część hero (mobile: góra, nad nagłówkiem)
    const fly = this.scroll * (1 - this.outro);
    const sf = fly * fly * (3 - 2 * fly);
    const s = mobile ? p.SIZE_M * w : p.SIZE * h;
    const cx = (mobile ? p.CX_M : p.CX) * w;
    const cy = (mobile ? p.CY_M : p.CY) * h;
    this.mark = { x: cx, y: cy, s };
    (u.uC!.value as Vector2).set(cx, cy);
    u.uS!.value = s;
    u.uZoom!.value = 1 + sf * p.FLY_ZOOM;

    // światło z lewej góry, wolno krąży
    const t = reduced ? 0 : this.time;
    const la = p.LIGHT_ANGLE + Math.sin(t * 0.35) * 0.5;
    (u.uLight!.value as Vector3).set(Math.cos(la) * 0.7, Math.sin(la) * 0.7, 0.62);

    // fala światła po przekątnej
    if (!reduced && this.intro >= 1) {
      this.sweepAge += dt;
      if (this.sweepAge > this.sweepNext) {
        this.sweepAge = 0;
        this.sweepNext = p.SWEEP_EVERY * rand(0.85, 1.15);
      }
    }
    const span = s * 1.2;
    u.uSweep!.value = reduced ? -1e4 : cx - 0.6 * cy - span + (this.sweepAge / 1.6) * span * 2;

    // kursor
    const pace = reduced ? 0 : this.mouse.pace;
    this.presence = clamp01(this.presence + (pace > 0.02 ? dt * 3 : -dt * 0.2));
    const amp = reduced ? 0 : (this.presence * p.MOUSE_AMP + pace * p.MOUSE_PACE_AMP) * (1 - sf);
    (u.uMouse!.value as Vector3).set(this.mouse.eased.x, this.mouse.eased.y, amp);

    // fale: przytrzymanie puszcza serię
    if (!reduced) {
      this.nextHold -= dt;
      if (this.hold && this.nextHold <= 0) {
        this.ripple(0.6);
        this.nextHold = p.HOLD_GAP;
      }
    }
    for (let i = this.ripples.length - 1; i >= 0; i--) {
      const r = this.ripples[i]!;
      r.age += dt;
      if (r.age > 3) this.ripples.splice(i, 1);
    }
    const arr = u.uRipples!.value as Vector4[];
    for (let i = 0; i < RIPPLES; i++) {
      const r = this.ripples[i];
      if (r && !reduced) arr[i]!.set(r.x, r.y, r.age, r.amp);
      else arr[i]!.set(0, 0, 0, 0);
    }

    u.uAppear!.value = Math.min(this.intro, clamp01(this.gather));

    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    this.points.geometry.dispose();
    this.points.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
