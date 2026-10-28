/**
 * ArcScene.ts — grube matowe łuki-wstęgi w gradiencie Laguny (spike /lab/hero-arcs).
 *
 * Każdy łuk to wycinek pierścienia wyciągnięty w głąb (ExtrudeGeometry), więc z kamery widać
 * szeroką wewnętrzną ścianę i cienką przednią krawędź. Wzdłuż krawędzi biegną smugi światła:
 * w spoczynku co kilka sekund, po kliknięciu na wszystkich łukach, przy przytrzymaniu seriami.
 * Stan ruchu (intro, scroll, finał) ustawia moduł, scena tylko go odwzorowuje.
 */

import {
  ExtrudeGeometry,
  Group,
  Mesh,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  Shape,
  WebGLRenderer,
  type Color,
  type IUniform,
} from 'three';
import { cssColor } from '@core/css';
import type { Mouse } from '@gl/Mouse';
import { heroArcsParams as p } from '@gl/params';
import { maxDpr } from '@gl/support';
import vert from '@gl/shaders/arc.vert?raw';
import frag from '@gl/shaders/arc.frag?raw';

/** stopy łuku schodzą trochę poniżej poziomu, żeby nie było widać cięcia */
const FOOT = 0.25;

interface Arc {
  mesh: Mesh<ExtrudeGeometry, ShaderMaterial>;
  u: Record<string, IUniform>;
  streak: number;
  speed: number;
  energy: number;
}

interface Colors {
  bg: Color;
  shadow: Color;
  start: Color;
  end: Color;
  light: Color;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

export class ArcScene {
  /** 0–1: łuki wyrastają z dołu jeden po drugim */
  intro = 1;
  /** 0–1: przejście hero → panel (wzrost, najazd, obrót) */
  scroll = 0;
  /** 0–1: finał przy CTA (inne ujęcie tych samych łuków) */
  outro = 0;
  /** przytrzymanie przycisku myszy */
  hold = false;

  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(p.FOV, 1, 0.1, 60);
  private group = new Group();
  private arcs: Arc[] = [];
  private time = 0;
  private nextIdle = 1.2;
  private nextHold = 0;
  private parallax = { x: 0, y: 0 };

  private constructor(
    wrap: HTMLElement,
    readonly mouse: Mouse,
    colors: Colors
  ) {
    this.renderer = new WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: 'high-performance',
    });
    this.renderer.setPixelRatio(maxDpr());
    this.renderer.setClearColor(colors.bg, 1);
    wrap.appendChild(this.renderer.domElement);
    this.scene.add(this.group);

    for (let i = 0; i < p.COUNT; i++) {
      const radius = p.RADIUS + i * p.RADIUS_STEP;
      const depth = p.DEPTH + (i % 3) * p.DEPTH_STEP;
      const shape = new Shape();
      shape.absarc(0, 0, radius + p.THICKNESS, -FOOT, Math.PI + FOOT, false);
      shape.absarc(0, 0, radius, Math.PI + FOOT, -FOOT, true);
      const geo = new ExtrudeGeometry(shape, {
        depth,
        curveSegments: 160,
        bevelEnabled: true,
        bevelThickness: 0.02,
        bevelSize: 0.02,
        bevelSegments: 2,
      });
      const u: Record<string, IUniform> = {
        uBg: { value: colors.bg },
        uShadow: { value: colors.shadow },
        uStart: { value: colors.start },
        uEnd: { value: colors.end },
        uLight: { value: colors.light },
        uKey: { value: [-0.55, 0.3, 0.8] },
        uAlbedo: { value: p.ALBEDO },
        uHue: { value: (i % 2 ? 0.25 : -0.15) + i * 0.04 },
        uDepth: { value: depth },
        uRadius: { value: radius },
        uStreak: { value: -1 },
        uStreakI: { value: 0 },
        uStreakW: { value: p.STREAK_W },
        uTail: { value: p.STREAK_TAIL },
        uGlow: { value: p.STREAK_GLOW },
        uFogNear: { value: p.FOG_NEAR },
        uFogFar: { value: p.FOG_FAR },
        uGrain: { value: p.GRAIN },
        uTime: { value: 0 },
        uFade: { value: 1 },
      };
      const mesh = new Mesh(
        geo,
        new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u })
      );
      this.group.add(mesh);
      this.arcs.push({ mesh, u, streak: -1, speed: 0, energy: 0 });
    }
    this.resize();
  }

  static async create(wrap: HTMLElement, mouse: Mouse): Promise<ArcScene> {
    const [bg, shadow, start, end, light] = await Promise.all([
      cssColor('--c-glebia'),
      cssColor('--c-glebia-line'),
      cssColor('--c-laguna-start'),
      cssColor('--c-laguna-end'),
      cssColor('--c-piana'),
    ]);
    return new ArcScene(wrap, mouse, { bg, shadow, start, end, light });
  }

  /** smuga na jednym łuku; bez indeksu: losowy wolny łuk */
  fire(index?: number, speedMul = 1): void {
    const free = this.arcs.filter((a) => a.streak < 0 || a.streak > 1.15);
    const arc =
      index === undefined ? free[Math.floor(Math.random() * free.length)] : this.arcs[index];
    if (!arc) return;
    arc.streak = -0.15;
    arc.speed = p.STREAK_SPEED * rand(0.85, 1.2) * speedMul;
    arc.energy = rand(0.8, 1);
  }

  /** kliknięcie: fala smug przez wszystkie łuki, od najbliższego */
  burst(speedMul = 1): void {
    this.arcs.forEach((_, i) => window.setTimeout(() => this.fire(i, speedMul), i * 70));
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(maxDpr());
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  /** dt w sekundach; reduced: statyczna klatka bez smug */
  update(dt: number, reduced: boolean): void {
    this.time += dt;
    const mobile = window.innerWidth < 768;

    // smugi: spoczynek, przytrzymanie, przesuwanie
    if (!reduced) {
      this.nextIdle -= dt;
      if (this.nextIdle <= 0 && this.intro >= 1) {
        this.fire();
        this.nextIdle = rand(p.STREAK_GAP_MIN, p.STREAK_GAP_MAX);
      }
      this.nextHold -= dt;
      if (this.hold && this.nextHold <= 0) {
        this.fire(undefined, p.HOLD_SPEED);
        this.nextHold = p.HOLD_GAP;
      }
    }
    for (const a of this.arcs) {
      if (a.streak >= 0 - 0.2 && a.streak <= 1.6) a.streak += dt * a.speed;
      const alive = a.streak > -0.2 && a.streak < 1.6;
      a.u.uStreak!.value = a.streak;
      a.u.uStreakI!.value = reduced || !alive ? 0 : a.energy * (1 - clamp01((a.streak - 1) / 0.5));
      a.u.uTime!.value = this.time;
    }

    // parallaksa za kursorem
    const mx = this.mouse.eased.x / window.innerWidth - 0.5;
    const my = this.mouse.eased.y / window.innerHeight - 0.5;
    const k = reduced ? 1 : 1 - Math.pow(1 - p.MOUSE_LERP, dt * 60);
    this.parallax.x += ((reduced ? 0 : mx) - this.parallax.x) * k;
    this.parallax.y += ((reduced ? 0 : my) - this.parallax.y) * k;

    // intro: łuki wyrastają z dołu kolejno
    const stagger = 0.12;
    this.arcs.forEach((a, i) => {
      const t = easeOut(clamp01((this.intro * (1 + stagger * p.COUNT) - i * stagger) / 1));
      a.mesh.position.set(i * p.X_STEP, (1 - t) * -4.5, i * p.Z_STEP);
      a.u.uFade!.value = clamp01(t * 1.6);
    });

    // ujęcie: baza → scroll (wzrost, najazd) → finał (łuki od drugiej strony)
    // finał zdejmuje najazd ze scrolla i odsuwa łuki w stronę środka
    const o = this.outro;
    const s = this.scroll * (1 - o);
    const g = this.group;
    g.position.set(
      (mobile ? p.X_M : p.X) - o * (mobile ? 0.6 : 1.6),
      (mobile ? p.Y_M : p.Y) + s * p.SCROLL_RISE - o * 0.8,
      0
    );
    g.scale.setScalar(mobile ? p.SCALE_M : 1);
    g.rotation.set(
      p.ROT_X + this.parallax.y * p.PARALLAX_Y - s * 0.1,
      p.ROT_Y + this.parallax.x * p.PARALLAX_X + s * p.SCROLL_ROT + o * 0.45,
      p.ROT_Z - o * 0.1
    );
    this.camera.position.set(0, 0, p.CAM_Z - s * p.SCROLL_DOLLY + o * 1.5);
    this.camera.lookAt(0, 0, -2);

    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    for (const a of this.arcs) {
      a.mesh.geometry.dispose();
      a.mesh.material.dispose();
    }
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
