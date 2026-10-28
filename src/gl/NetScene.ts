/**
 * NetScene.ts — „sieć systemów” (spike /lab/hero-arcs).
 *
 * Moduły to matowe bryły (RoundedBoxGeometry) z ekranem: szkielet interfejsu rysowany na canvasie
 * (wykres, lista, kanban, formularz, licznik), bez tekstu i liczb. Rdzeń to ikona x z logo.
 * Przewody (TubeGeometry, uv.x wzdłuż) łączą moduły z rdzeniem i między sobą. Po przewodach płyną
 * impulsy: moduł wysyła zapytanie do rdzenia, rdzeń błyska i zwykle odpowiada, moduł błyska po
 * odebraniu odpowiedzi. Kliknięcie puszcza zapytania ze wszystkich modułów, przytrzymanie serie.
 */

import {
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DirectionalLight,
  Fog,
  Group,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PerspectiveCamera,
  Quaternion,
  PlaneGeometry,
  PointLight,
  SRGBColorSpace,
  Scene,
  ShaderMaterial,
  TubeGeometry,
  Vector3,
  Vector4,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { cssColor, cssVar } from '@core/css';
import type { Mouse } from '@gl/Mouse';
import { heroNetParams as p } from '@gl/params';
import { maxDpr } from '@gl/support';
import vert from '@gl/shaders/tube.vert?raw';
import frag from '@gl/shaders/tube.frag?raw';

/** musi się zgadzać z PULSES w tube.frag */
const PULSES = 4;

type Kind = 'hub' | 'chart' | 'list' | 'kanban' | 'form' | 'metric';

interface NodeDef {
  kind: Kind;
  pos: [number, number, number];
  size: [number, number];
}

/** układ: rdzeń w środku prawej połowy, moduły nad i za nim, dół z prawej wolny pod lead */
const NODES: NodeDef[] = [
  { kind: 'hub', pos: [2.7, 0.9, 0.6], size: [1.5, 1.5] },
  { kind: 'chart', pos: [5.4, 2.6, -1.4], size: [2.3, 1.5] },
  { kind: 'list', pos: [7.4, 1.0, -2.2], size: [2.0, 1.4] },
  { kind: 'kanban', pos: [0.1, 2.5, -2.4], size: [2.1, 1.35] },
  { kind: 'form', pos: [-0.6, 0.5, -4.2], size: [1.6, 1.15] },
  { kind: 'metric', pos: [8.6, 2.4, -3.6], size: [1.6, 1.05] },
  { kind: 'list', pos: [-3.6, 3.3, -8], size: [2.0, 1.3] },
  { kind: 'chart', pos: [9.8, -0.9, -6.5], size: [2.2, 1.4] },
];

/** przewody: [z, do]; 0 = rdzeń. Impuls „zapytanie” biegnie od z do do. */
const LINKS: [number, number][] = [
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 1],
  [6, 3],
  [7, 2],
  [5, 2],
];

interface Node {
  group: Group;
  face: MeshBasicMaterial;
  flash: number;
  base: Vector3;
  phase: number;
  appear: number;
  scatter: Vector3;
}

interface Link {
  from: number;
  to: number;
  u: Record<string, IUniform>;
  mesh: Mesh<TubeGeometry, ShaderMaterial>;
  pulses: { pos: number; dir: number; energy: number; reply: boolean }[];
}

interface Palette {
  bg: string;
  body: string;
  screen: string;
  sk: string;
  line: string;
  start: string;
  end: string;
  ink: string;
}

const rand = (a: number, b: number) => a + Math.random() * (b - a);
const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);
const easeOutBack = (t: number) => {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

/** ekran modułu: szkielet interfejsu, zaokrąglone rogi, bez tekstu */
function drawFace(kind: Kind, w: number, h: number, c: Palette): HTMLCanvasElement {
  const cv = document.createElement('canvas');
  const W = 512;
  const H = Math.round((W * h) / w);
  cv.width = W;
  cv.height = H;
  const x = cv.getContext('2d')!;
  const grad = x.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, c.start);
  grad.addColorStop(1, c.end);
  const rr = (
    px: number,
    py: number,
    pw: number,
    ph: number,
    r: number,
    fill: string | CanvasGradient
  ) => {
    x.globalAlpha = fill === c.sk ? 0.42 : 1;
    x.beginPath();
    x.roundRect(px, py, pw, ph, r);
    x.fillStyle = fill;
    x.fill();
    x.globalAlpha = 1;
  };

  if (kind === 'hub') {
    rr(0, 0, W, H, W * 0.2, c.screen);
    x.lineCap = 'round';
    x.lineWidth = W * 0.13;
    x.strokeStyle = grad;
    x.beginPath();
    x.moveTo(W * 0.3, H * 0.27);
    x.lineTo(W * 0.7, H * 0.73);
    x.moveTo(W * 0.7, H * 0.27);
    x.quadraticCurveTo(W * 0.52, H * 0.46, W * 0.3, H * 0.73);
    x.stroke();
    return cv;
  }

  rr(0, 0, W, H, 28, c.screen);
  // pasek okna
  [0, 1, 2].forEach((i) => rr(26 + i * 24, 22, 13, 13, 7, c.sk));
  rr(120, 22, W * 0.32, 13, 7, c.line);
  const top = 60;
  const pad = 26;
  const iw = W - pad * 2;
  const ih = H - top - pad;

  if (kind === 'chart') {
    rr(pad, top, iw * 0.35, 14, 7, c.sk);
    const n = 9;
    const bw = (iw / n) * 0.62;
    for (let i = 0; i < n; i++) {
      const k = 0.3 + 0.65 * Math.abs(Math.sin(i * 1.7 + 0.6));
      const bh = (ih - 40) * k;
      rr(pad + (iw / n) * i, top + ih - bh, bw, bh, 6, i === 6 ? grad : c.line);
    }
  } else if (kind === 'list') {
    for (let i = 0; i < 5; i++) {
      const y = top + i * (ih / 5);
      rr(pad, y + 4, 26, 26, 13, i === 1 ? grad : c.line);
      rr(pad + 42, y + 8, iw * (0.45 + 0.25 * Math.sin(i * 2.1) ** 2), 14, 7, c.sk);
    }
  } else if (kind === 'kanban') {
    for (let col = 0; col < 3; col++) {
      const cx = pad + col * (iw / 3);
      const cw = iw / 3 - 14;
      rr(cx, top, cw, ih, 14, c.bg);
      const cards = [3, 2, 3][col]!;
      for (let i = 0; i < cards; i++) {
        rr(cx + 10, top + 12 + i * 52, cw - 20, 40, 10, col === 1 && i === 0 ? grad : c.line);
      }
    }
  } else if (kind === 'form') {
    for (let i = 0; i < 3; i++) {
      rr(pad, top + i * 58, iw * 0.3, 10, 5, c.sk);
      rr(pad, top + 18 + i * 58, iw, 26, 8, c.line);
    }
    rr(W - pad - 130, H - pad - 34, 130, 34, 10, grad);
  } else {
    // licznik: pierścień i dwa paski
    const r = Math.min(ih * 0.42, iw * 0.2);
    x.lineWidth = r * 0.28;
    x.lineCap = 'round';
    x.strokeStyle = c.line;
    x.beginPath();
    x.arc(pad + r + 10, top + ih / 2, r, 0, Math.PI * 2);
    x.stroke();
    x.strokeStyle = grad;
    x.beginPath();
    x.arc(pad + r + 10, top + ih / 2, r, -Math.PI / 2, Math.PI * 0.9);
    x.stroke();
    rr(pad + r * 2 + 50, top + ih * 0.3, iw * 0.4, 16, 8, c.sk);
    rr(pad + r * 2 + 50, top + ih * 0.55, iw * 0.25, 16, 8, c.line);
  }
  return cv;
}

export class NetScene {
  /** 0–1: moduły wskakują, przewody się rysują */
  intro = 1;
  scroll = 0;
  outro = 0;
  hold = false;
  /** 0 = moduły rozproszone, 1 = sieć złożona (finał przy CTA) */
  gather = 1;

  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new PerspectiveCamera(p.FOV, 1, 0.1, 80);
  private group = new Group();
  private nodes: Node[] = [];
  private links: Link[] = [];
  private hubLight: PointLight;
  private time = 0;
  private nextIdle = 0.8;
  private nextHold = 0;
  private parallax = { x: 0, y: 0 };
  private hubW = new Vector3();
  private hubN = new Vector3();
  private camPos = new Vector3();
  private camLook = new Vector3();
  private tmpV = new Vector3();
  private tmpQ = new Quaternion();

  private constructor(
    wrap: HTMLElement,
    readonly mouse: Mouse,
    c: Palette,
    col: Record<'bg' | 'body' | 'tube' | 'start' | 'end' | 'light' | 'shadow', Color>
  ) {
    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(maxDpr());
    this.renderer.setClearColor(col.bg, 1);
    wrap.appendChild(this.renderer.domElement);
    this.scene.fog = new Fog(col.bg, p.FOG_NEAR, p.FOG_FAR);
    this.scene.add(this.group);

    this.scene.add(new HemisphereLight(col.light, col.bg, 1.5));
    const key = new DirectionalLight(col.light, 2.4);
    key.position.set(-4, 5, 8);
    this.scene.add(key);
    this.hubLight = new PointLight(col.end, 6, 9, 1.6);
    this.group.add(this.hubLight);

    const bodyMat = new MeshStandardMaterial({ color: col.body, roughness: 0.92, metalness: 0 });
    NODES.forEach((d, i) => {
      const hub = d.kind === 'hub';
      const [w, h] = d.size;
      const depth = hub ? 0.42 : 0.2;
      const g = new Group();
      const body = new Mesh(new RoundedBoxGeometry(w, h, depth, 4, hub ? 0.26 : 0.09), bodyMat);
      g.add(body);
      const tex = new CanvasTexture(drawFace(d.kind, w, h, c));
      tex.colorSpace = SRGBColorSpace;
      tex.anisotropy = 4;
      const face = new MeshBasicMaterial({ map: tex, transparent: true, fog: true });
      const inset = hub ? 0.1 : 0.07;
      const screen = new Mesh(new PlaneGeometry(w - inset * 2, h - inset * 2), face);
      screen.position.z = depth / 2 + 0.002;
      g.add(screen);
      g.position.set(...d.pos);
      this.group.add(g);
      this.nodes.push({
        group: g,
        face,
        flash: 0,
        base: new Vector3(...d.pos),
        phase: i * 1.7,
        appear: 0,
        scatter: new Vector3(rand(-1, 1) * 8, rand(-1, 1) * 5, rand(3, 9)).multiplyScalar(
          i === 0 ? 0.4 : 1
        ),
      });
      if (hub) this.hubLight.position.set(d.pos[0], d.pos[1], d.pos[2] + 1.4);
    });

    LINKS.forEach(([from, to]) => {
      const a = new Vector3(...NODES[from]!.pos);
      const b = new Vector3(...NODES[to]!.pos);
      a.z -= 0.12;
      b.z -= 0.12;
      const bend = new Vector3(0, (b.x - a.x) * 0.12 + 0.4, -0.9);
      const curve = new CatmullRomCurve3([
        a,
        a.clone().lerp(b, 0.3).add(bend),
        a.clone().lerp(b, 0.7).add(bend.clone().multiplyScalar(0.6)),
        b,
      ]);
      const u: Record<string, IUniform> = {
        uBg: { value: col.bg },
        uBase: { value: col.tube },
        uShadow: { value: col.shadow },
        uStart: { value: col.start },
        uEnd: { value: col.end },
        uKey: { value: new Vector3(-0.5, 0.6, 0.8) },
        uPulses: { value: Array.from({ length: PULSES }, () => new Vector4(-1, 1, 0, 0)) },
        uDraw: { value: 1 },
        uWidth: { value: p.PULSE_W },
        uTail: { value: p.PULSE_TAIL },
        uFogNear: { value: p.FOG_NEAR },
        uFogFar: { value: p.FOG_FAR },
        uGrain: { value: p.GRAIN },
        uTime: { value: 0 },
      };
      const mesh = new Mesh(
        new TubeGeometry(curve, 160, p.TUBE_RADIUS, 12, false),
        new ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms: u })
      );
      this.group.add(mesh);
      this.links.push({ from, to, u, mesh, pulses: [] });
    });
    this.resize();
  }

  static async create(wrap: HTMLElement, mouse: Mouse): Promise<NetScene> {
    const tokens = {
      bg: '--c-wegiel',
      body: '--c-kawa-raise',
      tube: '--c-kawa-raise',
      start: '--c-bursztyn-start',
      end: '--c-bursztyn-end',
      light: '--c-kosc',
      shadow: '--c-kawa-line',
    } as const;
    const entries = await Promise.all(
      Object.entries(tokens).map(async ([k, t]) => [k, await cssColor(t)] as const)
    );
    const col = Object.fromEntries(entries) as Record<keyof typeof tokens, Color>;
    const palette: Palette = {
      bg: cssVar('--c-kawa'),
      body: cssVar('--c-kawa'),
      screen: cssVar('--c-wegiel'),
      sk: cssVar('--c-kosc-muted'),
      line: cssVar('--c-kawa-raise'),
      start: cssVar('--c-bursztyn-start'),
      end: cssVar('--c-bursztyn-end'),
      ink: cssVar('--c-kosc'),
    };
    return new NetScene(wrap, mouse, palette, col);
  }

  private send(link: Link, dir: number, speedMul = 1, reply = false): void {
    if (link.pulses.length >= PULSES) return;
    link.pulses.push({
      pos: dir > 0 ? -0.05 : 1.05,
      dir,
      energy: rand(0.8, 1) * (reply ? 0.85 : 1),
      reply,
    });
    // jedna prędkość na przewód (ostatni impuls ją ustawia)
    link.mesh.userData.speed = p.PULSE_SPEED * rand(0.9, 1.15) * speedMul;
  }

  /** zapytanie z losowego przewodu */
  fire(speedMul = 1): void {
    const link = this.links[Math.floor(Math.random() * this.links.length)];
    if (link) this.send(link, 1, speedMul);
  }

  /** kliknięcie: zapytania ze wszystkich modułów naraz */
  burst(speedMul = 1.3): void {
    this.links.forEach((l, i) => window.setTimeout(() => this.send(l, 1, speedMul), i * 45));
  }

  /** rdzeń na ekranie (CSS px): środek i szerokość ekranu ikony; do maski x w module */
  hubScreen(): { x: number; y: number; size: number } {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const hub = this.nodes[0]!.group;
    const c = this.tmpV.copy(this.hubW).project(this.camera);
    const x = (c.x * 0.5 + 0.5) * w;
    const y = (0.5 - c.y * 0.5) * h;
    const half = (NODES[0]!.size[0] - 0.2) / 2;
    const e = hub.localToWorld(new Vector3(half, 0, 0.21)).project(this.camera);
    const ex = (e.x * 0.5 + 0.5) * w;
    const ey = (0.5 - e.y * 0.5) * h;
    return { x, y, size: 2 * Math.hypot(ex - x, ey - y) };
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(maxDpr());
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  update(dt: number, reduced: boolean): void {
    this.time += dt;
    const mobile = window.innerWidth < 768;
    const t = this.time;

    // ruch danych
    if (!reduced && this.intro >= 1) {
      this.nextIdle -= dt;
      if (this.nextIdle <= 0) {
        this.fire();
        this.nextIdle = rand(p.PULSE_GAP_MIN, p.PULSE_GAP_MAX);
      }
      this.nextHold -= dt;
      if (this.hold && this.nextHold <= 0) {
        this.fire(p.HOLD_SPEED);
        this.nextHold = p.HOLD_GAP;
      }
    }
    for (const l of this.links) {
      const speed = (l.mesh.userData.speed as number | undefined) ?? p.PULSE_SPEED;
      for (let i = l.pulses.length - 1; i >= 0; i--) {
        const q = l.pulses[i]!;
        q.pos += q.dir * speed * dt;
        if (q.pos > 1.08 || q.pos < -0.08) {
          l.pulses.splice(i, 1);
          const target = this.nodes[q.dir > 0 ? l.to : l.from];
          if (target) target.flash = 1;
          // rdzeń (i moduły pośrednie) zwykle odpowiadają
          if (q.dir > 0 && !q.reply && Math.random() < p.REPLY) {
            window.setTimeout(() => this.send(l, -1, 1, true), rand(120, 380));
          }
        }
      }
      const arr = l.u.uPulses!.value as Vector4[];
      for (let i = 0; i < PULSES; i++) {
        const q = l.pulses[i];
        if (q && !reduced) arr[i]!.set(q.pos, q.dir, q.energy, 0);
        else arr[i]!.set(-1, 1, 0, 0);
      }
      l.u.uTime!.value = t;
    }

    // intro: najpierw rdzeń, potem moduły, na końcu przewody
    const n = this.nodes.length;
    this.nodes.forEach((nd, i) => {
      const k = clamp01((this.intro * 1.6 - (i / n) * 0.7) / 0.5);
      nd.appear = k;
      const s = k <= 0 ? 0.0001 : easeOutBack(k);
      nd.group.scale.setScalar(s);
      const f = reduced ? 0 : p.FLOAT;
      // finał: moduł wraca z rozproszenia, kolejno od rdzenia
      const gk = 1 - Math.pow(1 - clamp01((this.gather - (i / n) * 0.3) / 0.7), 3);
      const off = 1 - gk;
      nd.group.position.set(
        nd.base.x + nd.scatter.x * off,
        nd.base.y + nd.scatter.y * off + Math.sin(t * 0.6 + nd.phase) * f,
        nd.base.z + nd.scatter.z * off + Math.cos(t * 0.45 + nd.phase) * f * 0.6
      );
      nd.group.rotation.set(
        Math.sin(t * 0.4 + nd.phase) * f * 0.25 + off * nd.phase * 0.6,
        Math.cos(t * 0.35 + nd.phase) * f * 0.35 + off * 1.2,
        off * 0.8
      );
      nd.flash = Math.max(0, nd.flash - dt * 2.2);
      nd.face.color.setScalar(1 + nd.flash * (i === 0 ? 0.9 : 0.45));
    });
    const draw = Math.min(
      clamp01((this.intro - 0.45) / 0.55),
      clamp01((this.gather - 0.75) / 0.25)
    );
    this.links.forEach((l) => (l.u.uDraw!.value = draw * 1.02));
    this.hubLight.intensity = 4 + (this.nodes[0]?.flash ?? 0) * 10;

    // parallaksa
    const mx = this.mouse.eased.x / window.innerWidth - 0.5;
    const my = this.mouse.eased.y / window.innerHeight - 0.5;
    const k = reduced ? 1 : 1 - Math.pow(1 - p.MOUSE_LERP, dt * 60);
    this.parallax.x += ((reduced ? 0 : mx) - this.parallax.x) * k;
    this.parallax.y += ((reduced ? 0 : my) - this.parallax.y) * k;

    // ujęcie: baza → scroll (przelot kamery w rdzeń) → finał (sieć z prawej, za CTA)
    const o = this.outro;
    const fly = this.scroll * (1 - o);
    const sf = fly * fly * (3 - 2 * fly);
    const scale = mobile ? p.SCALE_M : 1;
    const g = this.group;
    const calm = 1 - sf;
    g.scale.setScalar(scale);
    g.position.set(
      (mobile ? p.X_M : p.X) + o * (mobile ? 0.6 : 2.6),
      (mobile ? p.Y_M : p.Y) + o * (mobile ? 1.2 : 0.5),
      0
    );
    g.rotation.set(
      p.ROT_X + this.parallax.y * p.PARALLAX_Y * calm,
      p.ROT_Y + this.parallax.x * p.PARALLAX_X * calm - o * 0.2,
      0
    );
    g.updateMatrixWorld(true);

    // cel przelotu: przed ekranem rdzenia, na jego osi
    const hub = this.nodes[0]!.group;
    hub.getWorldPosition(this.hubW);
    this.hubN.set(0, 0, 1).applyQuaternion(hub.getWorldQuaternion(this.tmpQ));
    this.camPos
      .set(0, 0, p.CAM_Z + o * 1.5)
      .lerp(this.tmpV.copy(this.hubW).addScaledVector(this.hubN, p.FLY_DIST * scale), sf);
    this.camera.position.copy(this.camPos);
    this.camLook.set(0, 0, -2).lerp(this.hubW, sf);
    this.camera.lookAt(this.camLook);
    this.camera.updateMatrixWorld();

    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    this.scene.traverse((o) => {
      if (o instanceof Mesh) {
        o.geometry.dispose();
        const m = o.material as MeshBasicMaterial;
        m.map?.dispose();
        m.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
