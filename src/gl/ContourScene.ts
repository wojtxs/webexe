/**
 * ContourScene.ts — same poziomice z pola pasm na całym viewporcie (spike /lab/hero-hm).
 * Kursor ugina pasma w ruchu (pace), więc za nim zostaje ślad w tle. Kolory z tokenów.
 */

import { cssColor } from '@core/css';
import { Scene, ShaderMaterial, Vector2, WebGLRenderer, type Color, type IUniform } from 'three';
import { createPixelCamera, fitPixelCamera } from '@gl/Camera';
import { DomPlane } from '@gl/DomPlane';
import type { Mouse } from '@gl/Mouse';
import { heroHmParams as p } from '@gl/params';
import { maxDpr } from '@gl/support';
import noise from '@gl/shaders/noise.glsl?raw';
import bands from '@gl/shaders/bands.glsl?raw';
import bgGlsl from '@gl/shaders/bg.glsl?raw';
import vertex from '@gl/shaders/plane.vert?raw';
import bgOnly from '@gl/shaders/bg-only.frag?raw';

export class ContourScene {
  /** 0–1, front poziomic od dołu (intro) */
  reveal = 1;

  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera = createPixelCamera();
  private plane: DomPlane<ShaderMaterial>;
  private u: Record<string, IUniform>;

  private constructor(
    wrap: HTMLElement,
    readonly mouse: Mouse,
    colors: { bg: Color; ink: Color }
  ) {
    this.renderer = new WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(maxDpr());
    wrap.appendChild(this.renderer.domElement);

    this.u = {
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
      uReveal: { value: 1 },
      uRevealSize: { value: 25 },
      uLineWidth: { value: p.LINE_WIDTH },
      uCell: { value: 16 },
      uMode: { value: 0 },
      uDotMin: { value: 0 },
      uDotMax: { value: 0 },
      uBgColor: { value: colors.bg },
      uBgInk: { value: colors.ink },
      uBgInkAlpha: { value: 1 },
    };
    this.plane = new DomPlane(
      new ShaderMaterial({
        vertexShader: vertex,
        fragmentShader: `${noise}\n${bands}\n${bgGlsl}\n${bgOnly}`,
        uniforms: this.u,
        depthTest: false,
        depthWrite: false,
      })
    );
    this.scene.add(this.plane.mesh);
    this.resize();
  }

  static async create(wrap: HTMLElement, mouse: Mouse): Promise<ContourScene> {
    const [bg, ink] = await Promise.all([cssColor('--c-piana'), cssColor('--c-piana-deep')]);
    return new ContourScene(wrap, mouse, { bg, ink });
  }

  resize(): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setPixelRatio(maxDpr());
    this.renderer.setSize(w, h);
    fitPixelCamera(this.camera, w, h);
    this.u.uViewport!.value.set(w, h);
    this.u.uDpr!.value = this.renderer.getPixelRatio();
  }

  /** dt w sekundach; reduced: statyczna klatka */
  update(dt: number, reduced: boolean): void {
    const w = window.innerWidth;
    const h = window.innerHeight;
    if (!reduced) this.u.uPhase!.value += dt * p.SPEED;
    this.u.uMouse!.value.set(this.mouse.eased.x / h, (h - this.mouse.eased.y) / h);
    this.u.uPace!.value = reduced ? 0 : this.mouse.pace;
    this.u.uReveal!.value = this.reveal;
    this.plane.sync(w, h);
    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    this.plane.destroy();
    this.plane.mesh.material.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
