/**
 * CodeScene.ts — znak x z kodu (spike /lab/hero-code), wzór mechaniki: endurosat.com/space-service.
 *
 * Jedna scena przez całą stronę. Ekran to siatka znaków (CSS px), z której wyłania się x: komórki
 * w znaku świecą w Bursztynie według cieniowania rury (jak DotScene), reszta to przygaszony kod.
 * Kod (CODE poniżej, nasz własny, dekoracyjny) leży w teksturze, trzy kolumny obok siebie, i przesuwa
 * się o wiersze. Moduł ustawia `state` z klatek kluczowych scrolla: położenie znaku, przelot, chaos,
 * porządek, szkic, budowa, przepływ, puls, przygaszenie. Glify rysuje atlas z canvasa (font z --f-mono).
 */

import {
  BufferGeometry,
  CanvasTexture,
  Color,
  DataTexture,
  Float32BufferAttribute,
  NearestFilter,
  NormalBlending,
  OrthographicCamera,
  Points,
  RedFormat,
  Scene,
  ShaderMaterial,
  LinearFilter,
  Vector2,
  Vector3,
  Vector4,
  WebGLRenderer,
  type IUniform,
} from 'three';
import { cssColor, cssVar } from '@core/css';
import type { Mouse } from '@gl/Mouse';
import { heroCodeParams as p } from '@gl/params';
import { maxDpr } from '@gl/support';
import vert from '@gl/shaders/code.vert?raw';
import frag from '@gl/shaders/code.frag?raw';

/** musi się zgadzać z RIPPLES w code.vert */
const RIPPLES = 4;
/** szerokość kolumny kodu w znakach */
const PANE = 72;

const CODE = `import { schedule, retry } from './runtime'
import { erp, crm, mail } from './integrations'

export async function syncOrders(since: Date) {
  const orders = await erp.orders.list({ since })
  for (const order of orders) {
    const client = await crm.clients.find(order.nip)
    if (!client) {
      await crm.clients.create(fromOrder(order))
      continue
    }
    await crm.notes.add(client.id, summary(order))
  }
  return orders.length
}

schedule('*/15 * * * *', () => retry(syncOrders, { times: 3 }))

export const invoiceFlow = flow('invoice')
  .on('mail.received', extractAttachments)
  .step('read', ai.extract(invoiceSchema))
  .step('check', validateTotals)
  .when((doc) => doc.total > limits.manual)
  .ask('approve', { role: 'office' })
  .step('book', erp.invoices.create)
  .notify(({ doc }) => \`Zaksiegowano \${doc.number}\`)

type Health = { ok: boolean; latency: number; at: Date }

export async function check(): Promise<Health[]> {
  const targets = [db, queue, storage, api]
  return Promise.all(targets.map(async (t) => {
    const start = performance.now()
    const ok = await t.ping().catch(() => false)
    return { ok, latency: performance.now() - start, at: new Date() }
  }))
}

monitor.every('1m', check).alert((h) => !h.ok, oncall)
backup.daily('03:00', { keep: 30, verify: true })

export function report(month: string) {
  const rows = sql\`
    select client, sum(total) as total, count(*) as n
    from invoices where month = \${month}
    group by client order by total desc\`
  return pdf.render('monthly', { rows, month })
}

app.get('/api/orders/:id', auth('staff'), async (req, res) => {
  const order = await db.orders.byId(req.params.id)
  res.json(order ?? notFound())
})

deploy({ env: 'prod', host: 'vps-01', strategy: 'blue-green' })
`;

const clamp01 = (v: number) => Math.min(Math.max(v, 0), 1);

export interface CodeState {
  /** środek znaku (× szerokość, × wysokość od góry) i rozmiar (× wysokość, mobile × szerokość) */
  x: number;
  y: number;
  s: number;
  /** przelot: ile razy znak jest przybliżony */
  zoom: number;
  chaos: number;
  order: number;
  wire: number;
  build: number;
  flow: number;
  beat: number;
  dim: number;
}

export const STATE_KEYS = [
  'x',
  'y',
  's',
  'zoom',
  'chaos',
  'order',
  'wire',
  'build',
  'flow',
  'beat',
  'dim',
] as const;

export class CodeScene {
  /** 0–1: kod wpisuje się na ekran */
  appear = 0;
  /** przesunięcie kodu w wierszach, dodawane do upływu czasu (scroll) */
  lineShift = 0;
  hold = false;
  readonly state: CodeState = {
    x: 0.7,
    y: 0.45,
    s: 0.7,
    zoom: 1,
    chaos: 0,
    order: 0,
    wire: 0,
    build: 0,
    flow: 0,
    beat: 0,
    dim: 0,
  };

  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private points: Points<BufferGeometry, ShaderMaterial>;
  private u: Record<string, IUniform>;
  private atlas: CanvasTexture;
  private code: DataTexture;
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
    col: Record<'bg' | 'ink' | 'inkHi' | 'start' | 'end', Color>
  ) {
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(maxDpr());
    this.renderer.setClearColor(col.bg, 1);
    wrap.appendChild(this.renderer.domElement);
    this.atlas = CodeScene.buildAtlas(cssVar('--f-mono'));
    this.code = CodeScene.buildCode();
    this.u = {
      uRes: { value: new Vector2(1, 1) },
      uDpr: { value: 1 },
      uCellSize: { value: new Vector2(p.CELL_W, p.CELL_H) },
      uCode: { value: this.code },
      uCodeSize: { value: new Vector2(PANE, this.code.image.height) },
      uPane: { value: PANE },
      uLine: { value: 0 },
      uC: { value: new Vector2() },
      uS: { value: 1 },
      uArm: { value: p.ARM },
      uZoom: { value: 1 },
      uLight: { value: new Vector3() },
      uSweep: { value: -1e4 },
      uBgAlpha: { value: p.BG_ALPHA },
      uBgReach: { value: p.BG_REACH },
      uTime: { value: 0 },
      uAppear: { value: 0 },
      uChaos: { value: 0 },
      uOrder: { value: 0 },
      uWire: { value: 0 },
      uBuild: { value: 0 },
      uFlow: { value: 0 },
      uBeat: { value: 0 },
      uDim: { value: 0 },
      uMouse: { value: new Vector3() },
      uRipples: { value: Array.from({ length: RIPPLES }, () => new Vector4()) },
      uRippleSpeed: { value: p.RIPPLE_SPEED },
      uAtlas: { value: this.atlas },
      uInk: { value: col.ink },
      uInkHi: { value: col.inkHi },
      uStart: { value: col.start },
      uEnd: { value: col.end },
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

  static async create(wrap: HTMLElement, mouse: Mouse): Promise<CodeScene> {
    const tokens = {
      bg: '--c-wegiel',
      ink: '--c-kosc-muted',
      inkHi: '--c-kosc',
      start: '--c-bursztyn-start',
      end: '--c-bursztyn-end',
    } as const;
    const entries = await Promise.all(
      Object.entries(tokens).map(async ([k, t]) => [k, await cssColor(t)] as const)
    );
    await document.fonts.ready;
    return new CodeScene(
      wrap,
      mouse,
      Object.fromEntries(entries) as Record<keyof typeof tokens, Color>
    );
  }

  /** atlas 16 × 6: znaki ASCII 32–126, ostatnia komórka to blok */
  private static buildAtlas(font: string): CanvasTexture {
    const c = p.ATLAS_CELL;
    const canvas = document.createElement('canvas');
    canvas.width = 16 * c;
    canvas.height = 6 * c;
    const ctx = canvas.getContext('2d')!;
    // atlas to maska (kanał R), kolor nadaje code.frag z tokenów
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${Math.round(c * 0.66)}px ${font}`;
    for (let i = 1; i < 95; i++) {
      ctx.fillText(
        String.fromCharCode(32 + i),
        (i % 16) * c + c / 2,
        Math.floor(i / 16) * c + c / 2
      );
    }
    // blok: kwadrat w szerokości znaku
    const bw = c * 0.5;
    ctx.fillRect(15 * c + (c - bw) / 2, 5 * c + (c - bw) / 2, bw, bw);
    const t = new CanvasTexture(canvas);
    t.flipY = false;
    t.minFilter = LinearFilter;
    t.magFilter = LinearFilter;
    t.generateMipmaps = false;
    return t;
  }

  /** kod jako tekstura: wiersz × kolumna → numer glifu (kod ASCII − 32, 0 = pusto) */
  private static buildCode(): DataTexture {
    const lines = CODE.split('\n');
    const data = new Uint8Array(PANE * lines.length);
    lines.forEach((line, y) => {
      for (let x = 0; x < Math.min(line.length, PANE); x++) {
        const k = line.charCodeAt(x) - 32;
        data[y * PANE + x] = k > 0 && k < 95 ? k : 0;
      }
    });
    const t = new DataTexture(data, PANE, lines.length, RedFormat);
    t.magFilter = NearestFilter;
    t.minFilter = NearestFilter;
    t.needsUpdate = true;
    return t;
  }

  /** siatka komórek z zapasem jednej komórki poza ekranem */
  private buildGrid(w: number, h: number, cw: number, ch: number): void {
    const key = `${w}x${h}@${cw}x${ch}`;
    if (key === this.gridKey) return;
    this.gridKey = key;
    const cols = Math.ceil(w / cw) + 1;
    const rows = Math.ceil(h / ch) + 1;
    const n = cols * rows;
    const base = new Float32Array(n * 2);
    const cell = new Float32Array(n * 2);
    const rnd = new Float32Array(n * 3);
    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        base[i * 2] = x * cw + cw / 2;
        base[i * 2 + 1] = y * ch + ch / 2;
        cell[i * 2] = x;
        cell[i * 2 + 1] = y;
        rnd[i * 3] = Math.random();
        rnd[i * 3 + 1] = Math.random();
        rnd[i * 3 + 2] = Math.random();
        i++;
      }
    }
    const g = this.points.geometry;
    g.setAttribute('position', new Float32BufferAttribute(new Float32Array(n * 3), 3));
    g.setAttribute('aBase', new Float32BufferAttribute(base, 2));
    g.setAttribute('aCell', new Float32BufferAttribute(cell, 2));
    g.setAttribute('aRnd', new Float32BufferAttribute(rnd, 3));
    g.setDrawRange(0, n);
  }

  private ripple(amp: number): void {
    if (this.ripples.length >= RIPPLES) this.ripples.shift();
    this.ripples.push({ x: this.mouse.eased.x, y: this.mouse.eased.y, age: 0, amp });
  }

  /** kliknięcie: fala od kursora */
  burst(): void {
    this.ripple(1);
  }

  /** znak na ekranie (CSS px, y w dół) */
  hubScreen(): { x: number; y: number; size: number } {
    return { x: this.mark.x, y: this.mark.y, size: this.mark.s * this.state.zoom };
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    const dpr = maxDpr();
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h);
    (this.u.uRes!.value as Vector2).set(w, h);
    this.u.uDpr!.value = dpr;
    const mobile = w < 768;
    const cw = mobile ? p.CELL_W_M : p.CELL_W;
    const ch = mobile ? p.CELL_H_M : p.CELL_H;
    (this.u.uCellSize!.value as Vector2).set(cw, ch);
    this.buildGrid(w, h, cw, ch);
  }

  update(dt: number, reduced: boolean): void {
    this.time += dt;
    const w = window.innerWidth;
    const h = window.innerHeight;
    const st = this.state;
    const u = this.u;

    const s = (w < 768 ? w : h) * st.s;
    const cx = st.x * w;
    const cy = st.y * h;
    this.mark = { x: cx, y: cy, s };
    (u.uC!.value as Vector2).set(cx, cy);
    u.uS!.value = s;
    u.uZoom!.value = st.zoom;
    u.uChaos!.value = st.chaos;
    u.uOrder!.value = st.order;
    u.uWire!.value = st.wire;
    u.uBuild!.value = st.build;
    u.uFlow!.value = st.flow;
    u.uBeat!.value = st.beat;
    u.uDim!.value = st.dim;
    u.uBgAlpha!.value = p.BG_ALPHA;
    u.uBgReach!.value = p.BG_REACH;

    const t = reduced ? 0 : this.time;
    u.uTime!.value = t;
    u.uLine!.value = (reduced ? 0 : t * p.LINES_PER_S) + this.lineShift;

    // światło z lewej góry, wolno krąży
    const la = p.LIGHT_ANGLE + Math.sin(t * 0.35) * 0.5;
    (u.uLight!.value as Vector3).set(Math.cos(la) * 0.7, Math.sin(la) * 0.7, 0.62);

    // fala światła po przekątnej co kilka sekund
    if (!reduced && this.appear >= 1) {
      this.sweepAge += dt;
      if (this.sweepAge > this.sweepNext) {
        this.sweepAge = 0;
        this.sweepNext = p.SWEEP_EVERY * (0.85 + Math.random() * 0.3);
      }
    }
    const span = s * st.zoom * 1.2;
    u.uSweep!.value = reduced ? -1e4 : cx - 0.6 * cy - span + (this.sweepAge / 1.6) * span * 2;

    // kursor: latarka rośnie, gdy kursor się rusza
    const pace = reduced ? 0 : this.mouse.pace;
    this.presence = clamp01(this.presence + (pace > 0.02 ? dt * 3 : -dt * 0.35));
    const lens = reduced ? 0 : (this.presence * 0.6 + pace * 0.6) * p.LENS_R;
    (u.uMouse!.value as Vector3).set(this.mouse.eased.x, this.mouse.eased.y, lens);

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

    u.uAppear!.value = this.appear;
    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    this.points.geometry.dispose();
    this.points.material.dispose();
    this.atlas.dispose();
    this.code.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
