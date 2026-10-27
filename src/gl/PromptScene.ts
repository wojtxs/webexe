/**
 * PromptScene.ts — GL hero „Build” (spike, tylko /lab/hero-build).
 *
 * Jeden renderer, dwie płaszczyzny:
 * - tło na cały viewport: Głębia + poziomice z pola pasm (contour.frag, tryb 0),
 * - obiekt `>_` zsynchronizowany z elementem [data-gl="hero"]: render A i rentgen B przełączane
 *   tymi samymi pasmami, paralaksa z mapy głębi, przebieg skanu z intro (prompt.frag).
 * Docelowa architektura (Experience, render targety) to F4.
 */

import { cssColor } from '@core/css';
import {
  LinearFilter,
  NoColorSpace,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  WebGLRenderer,
  type Color,
  type IUniform,
  type Texture,
} from 'three';
import { createPixelCamera, fitPixelCamera } from '@gl/Camera';
import { DomPlane } from '@gl/DomPlane';
import { Mouse } from '@gl/Mouse';
import { heroBuildParams as p } from '@gl/params';
import { maxDpr } from '@gl/support';
import noise from '@gl/shaders/noise.glsl?raw';
import bands from '@gl/shaders/bands.glsl?raw';
import vertex from '@gl/shaders/plane.vert?raw';
import bgGlsl from '@gl/shaders/bg.glsl?raw';
import bgFrag from '@gl/shaders/prompt-bg.frag?raw';
import promptFrag from '@gl/shaders/prompt.frag?raw';

const TEX = '/gl/textures/hero-prompt';

export class PromptScene {
  /** sterowane z timeline'u intro i ScrollTriggera */
  readonly state = { opacity: 0, scan: 0, bgReveal: 0 };

  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = createPixelCamera();
  private mouse: Mouse;
  private field: Record<string, IUniform>;
  private background: DomPlane<ShaderMaterial>;
  private object: DomPlane<ShaderMaterial>;
  private textures: Texture[] = [];
  private time = 0;
  /** kursor w oknie: plama rentgenu pojawia się i znika */
  private pointerIn = false;
  private xray = 0;
  /** zegar życia w spoczynku: rusza po intro (scan = 1) */
  private cycle = 0;
  private onMove = () => (this.pointerIn = true);
  private onLeave = () => (this.pointerIn = false);

  private constructor(
    wrap: HTMLElement,
    el: HTMLElement,
    colors: { bg: Color; line: Color; edge: Color; pulse: Color }
  ) {
    this.renderer = new WebGLRenderer({ alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(maxDpr());
    wrap.appendChild(this.renderer.domElement);
    this.mouse = new Mouse({ lerp: p.MOUSE_LERP, pacePx: p.PACE_PX, paceLerp: p.PACE_LERP });
    window.addEventListener('pointermove', this.onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', this.onLeave);

    // wspólne uniformy pola pasm: te same obiekty w obu materiałach
    this.field = {
      uViewport: { value: new Vector2() },
      uDpr: { value: 1 },
      uPhase: { value: Math.random() * 100 },
      uScale: { value: p.SCALE },
      uDetail: { value: p.NOISE_DETAIL },
      uDistortScale: { value: p.DISTORT_SCALE },
      uDistortIntensity: { value: p.DISTORT_INTENSITY },
      uMouse: { value: new Vector2() },
      uPace: { value: 0 },
      uCursorScale: { value: p.CURSOR_SCALE },
      uCursorIntensity: { value: p.CURSOR_INTENSITY },
      uCursorBounce: { value: p.CURSOR_BOUNCE },
      uReveal: { value: 0 },
      uRevealSize: { value: 25 },
      uLineWidth: { value: p.LINE_WIDTH },
      uCell: { value: 16 },
      // front fali sygnału: wspólny dla tła i obiektu; daleko poza ekranem = brak fali
      uSweep: { value: -10 },
    };
    const prefix = `${noise}\n${bands}\n`;

    this.background = new DomPlane(
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: prefix + bgGlsl + bgFrag,
        uniforms: {
          ...this.field,
          uBgColor: { value: colors.bg },
          uLineColor: { value: colors.line },
          uPulseColor: { value: colors.pulse },
          uPulseWidth: { value: p.PULSE_WIDTH },
          uPulseGain: { value: p.PULSE_GAIN },
          uMode: { value: 0 },
          uDotMin: { value: 0 },
          uDotMax: { value: 0 },
        },
        depthTest: false,
        depthWrite: false,
      })
    );

    this.object = new DomPlane(
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: prefix + promptFrag,
        uniforms: {
          ...this.field,
          tA: { value: null },
          tB: { value: null },
          tMaps: { value: null },
          uPlaneSize: { value: new Vector2() },
          uTexAspect: { value: 1376 / 768 },
          uParallax: { value: new Vector2() },
          uDepth: { value: p.DEPTH },
          uFloat: { value: 0 },
          uOpacity: { value: 0 },
          uScan: { value: 0 },
          uXrayGain: { value: p.XRAY_GAIN },
          uLineColor: { value: colors.edge },
          uLineAlpha: { value: p.LINE_ALPHA },
          uXray: { value: 0 },
          uXrayRadius: { value: p.XRAY_RADIUS },
          uXrayNoise: { value: p.XRAY_EDGE_NOISE },
          uHalo: { value: p.XRAY_HALO },
          uClearHalo: { value: p.CLEAR_HALO },
          uTime: { value: 0 },
          uSweepWidth: { value: p.SWEEP_WIDTH },
          uSweepNoise: { value: p.SWEEP_NOISE },
          uGlint: { value: -10 },
          uGlintWidth: { value: p.GLINT_WIDTH },
          uGlintGain: { value: p.GLINT_GAIN },
          uShadow: { value: p.SHADOW },
          uShadowSpeed: { value: p.SHADOW_SPEED },
          uBgColor: { value: colors.bg.clone().convertLinearToSRGB() },
        },
        transparent: true,
        premultipliedAlpha: true,
        depthTest: false,
        depthWrite: false,
      }),
      el
    );

    this.background.mesh.renderOrder = 0;
    this.object.mesh.renderOrder = 1;
    this.scene.add(this.background.mesh, this.object.mesh);
    this.resize();
  }

  static async create(wrap: HTMLElement, el: HTMLElement): Promise<PromptScene> {
    const [bg, line, edge, pulse] = await Promise.all([
      cssColor('--c-glebia'),
      cssColor('--c-glebia-raise'),
      cssColor('--c-laguna-end'),
      cssColor('--c-laguna-start'),
    ]);
    // kontur obiektu idzie bez konwersji kolorów (prompt.frag pracuje w sRGB)
    edge.convertLinearToSRGB();
    const scene = new PromptScene(wrap, el, { bg, line, edge, pulse });
    await scene.load();
    return scene;
  }

  private async load(): Promise<void> {
    const loader = new TextureLoader();
    const [a, b, maps] = await Promise.all(
      ['prompt-a', 'prompt-b', 'prompt-maps'].map((n) => loader.loadAsync(`${TEX}/${n}.webp`))
    );
    for (const t of [a!, b!, maps!]) {
      t.colorSpace = NoColorSpace;
      t.minFilter = LinearFilter;
      t.generateMipmaps = false;
      this.textures.push(t);
    }
    const u = this.object.mesh.material.uniforms;
    u.tA!.value = a;
    u.tB!.value = b;
    u.tMaps!.value = maps;
    const img = a!.image as { width: number; height: number };
    u.uTexAspect!.value = img.width / img.height;
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(maxDpr());
    this.renderer.setSize(w, h);
    fitPixelCamera(this.camera, w, h);
    this.field.uViewport!.value.set(w, h);
    this.field.uDpr!.value = this.renderer.getPixelRatio();
  }

  /** dt w sekundach; reduced: bez ruchu pasm i unoszenia */
  update(dt: number, reduced: boolean): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.time += dt;
    this.mouse.update(dt);

    const f = this.field;
    if (!reduced) f.uPhase!.value += dt * p.SPEED;
    f.uMouse!.value.set(this.mouse.eased.x / h, (h - this.mouse.eased.y) / h);
    f.uPace!.value = reduced ? 0 : this.mouse.pace;
    f.uReveal!.value = this.state.bgReveal;

    const u = this.object.mesh.material.uniforms;
    u.uOpacity!.value = this.state.opacity;
    u.uScan!.value = this.state.scan;
    // bez kursora obiekt sam lekko dryfuje; z kursorem paralaksa idzie za myszą
    const drift = (1 - this.xray) * p.IDLE_DRIFT;
    u.uParallax!.value.set(
      reduced
        ? 0
        : ((this.mouse.eased.x / w) * 2 - 1) * this.xray + Math.sin(this.time * 0.31) * drift,
      reduced
        ? 0
        : -((this.mouse.eased.y / h) * 2 - 1) * this.xray + Math.cos(this.time * 0.23) * drift
    );
    u.uTime!.value = reduced ? 0 : this.time;

    // fala sygnału i błysk: cykle liczone od końca intro
    if (!reduced && this.state.scan >= 1) this.cycle += dt;
    const period = p.SWEEP_DURATION + p.SWEEP_GAP;
    const ts = this.cycle - p.SWEEP_FIRST_DELAY;
    const phase = ts >= 0 ? ts % period : -1;
    let sweep = -10;
    if (phase >= 0 && phase < p.SWEEP_DURATION) {
      const k = phase / p.SWEEP_DURATION;
      const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
      // przekątna ekranu w st wzdłuż kierunku fali, z zapasem na szerokość pasa
      const from = -0.41 - p.SWEEP_WIDTH - 0.1;
      const to = (w / h) * 0.912 + 0.1;
      sweep = from + (to - from) * e;
    }
    f.uSweep!.value = sweep;
    const tg = (this.cycle + p.GLINT_PERIOD * 0.5) % p.GLINT_PERIOD;
    u.uGlint!.value =
      !reduced && this.cycle > 0 && tg < p.GLINT_DURATION
        ? -0.3 + 1.6 * (tg / p.GLINT_DURATION)
        : -10;
    u.uFloat!.value = reduced ? 0 : Math.sin(this.time * p.FLOAT_SPEED) * p.FLOAT_AMP;
    const target = this.pointerIn ? 1 : 0;
    this.xray += (target - this.xray) * (1 - Math.pow(1 - p.XRAY_LERP, dt * 60));
    u.uXray!.value = this.xray;
    u.uXrayRadius!.value = p.XRAY_RADIUS + p.XRAY_GROW * (reduced ? 0 : this.mouse.pace);

    this.background.sync(w, h);
    this.object.sync(w, h);
    u.uPlaneSize!.value.set(this.object.size.width, this.object.size.height);
    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    window.removeEventListener('pointermove', this.onMove);
    document.documentElement.removeEventListener('pointerleave', this.onLeave);
    this.mouse.destroy();
    this.background.destroy();
    this.object.destroy();
    this.background.mesh.material.dispose();
    this.object.mesh.material.dispose();
    this.textures.forEach((t) => t.dispose());
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
