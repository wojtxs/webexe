/**
 * hero-build.ts — spike hero „Build” (tylko /lab/hero-build).
 *
 * Bohaterem jest sama strona, bez WebGL:
 * 1. wejście: terminal wpisuje `npm run build`, a blueprint strony (siatka, ramki z tagami, prawdziwe
 *    wymiary z DOM, nagłówek w obrysie) rysuje się na żywo,
 * 2. przebieg renderu: linia skanu zjeżdża w dół i zamienia blueprint w gotowe hero,
 * 3. kursor to rentgen: płynna soczewka odsłania blueprint tej samej strony (clip-path: path()),
 *    rośnie z prędkością ruchu i rozciąga się w kierunku ruchu,
 * 4. scroll: wiersze nagłówka rozjeżdżają się na boki (obie warstwy razem).
 * Klik, scroll albo klawisz przewija intro do końca. Minimalny kod, nie produkcja.
 */

import type { Module } from '@core/lifecycle';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Mouse } from '@gl/Mouse';
import { heroBuildParams as p } from '@gl/params';
import { easeFromToken } from '@gl/ease';

gsap.registerPlugin(ScrollTrigger);

const LENS_POINTS = 40;
const COMMAND = 'npm run build';

const frameLerp = (amount: number, dt: number) => 1 - Math.pow(1 - amount, dt * 60);
const px = (v: number) => `${Math.round(v)}px`;

/** Zamknięta krzywa Catmull-Rom przez punkty jako ścieżka SVG z krzywych Béziera. */
function smoothPath(pts: [number, number][]): string {
  const n = pts.length;
  let d = `M${pts[0]![0].toFixed(1)} ${pts[0]![1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n]!;
    const p1 = pts[i]!;
    const p2 = pts[(i + 1) % n]!;
    const p3 = pts[(i + 2) % n]!;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return `${d}Z`;
}

let cleanup: (() => void) | null = null;

const HeroBuild: Module = {
  init(root: HTMLElement) {
    const stage = root.querySelector<HTMLElement>('[data-build-stage]');
    const final = root.querySelector<HTMLElement>('[data-build-final]');
    const blueprint = root.querySelector<HTMLElement>('[data-build-blueprint]');
    const lensPath = root.querySelector<SVGPathElement>('[data-build-lens-path]');
    const scan = root.querySelector<HTMLElement>('[data-build-scan]');
    const term = root.querySelector<HTMLElement>('[data-build-term]');
    const cmd = root.querySelector<HTMLElement>('[data-build-cmd]');
    const status = root.querySelector<HTMLElement>('[data-build-status]');
    const bar = root.querySelector<HTMLElement>('[data-build-bar]');
    const html = document.documentElement;
    if (!stage || !final || !blueprint || !lensPath || !scan || !term || !cmd || !status || !bar) {
      html.classList.remove('hb-pre');
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = easeFromToken('--ease-default');

    // --- Blueprint = klon warstwy gotowej: identyczna geometria bez liczenia pozycji ---
    const clone = document.createElement('div');
    clone.className = 'hb-bp-content';
    clone.style.display = 'contents';
    final.childNodes.forEach((n) => clone.appendChild(n.cloneNode(true)));
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    clone.querySelectorAll('a').forEach((a) => a.setAttribute('tabindex', '-1'));
    blueprint.appendChild(clone);

    const title = final.querySelector<HTMLElement>('[data-build-title]');
    const bpTitle = clone.querySelector<HTMLElement>('[data-build-title]');
    const lines = Array.from(final.querySelectorAll<HTMLElement>('[data-build-line]'));
    const bpLines = Array.from(clone.querySelectorAll<HTMLElement>('[data-build-line]'));
    const bpEls = Array.from(clone.querySelectorAll<HTMLElement>('[data-build-el]'));
    const cols = Array.from(blueprint.querySelectorAll<HTMLElement>('[data-build-col]'));
    const spec = document.createElement('span');
    spec.className = 'hb-spec';
    bpTitle?.appendChild(spec);

    // --- Rozmiar nagłówka: najdłuższy wiersz = szerokość kontenera (mobile: najdłuższe słowo) ---
    const fit = () => {
      if (!title) return;
      const mobile = window.innerWidth < 768;
      const container = title.parentElement!;
      const cs = getComputedStyle(container);
      const avail =
        container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      title.style.setProperty('--hb-size', '100px');
      const longest = mobile
        ? (lines[1]?.scrollWidth ?? 1)
        : Math.max(...lines.map((l) => l.scrollWidth));
      // limit wysokości: nagłówek + nawigacja + stopka mieszczą się w ekranie
      const lineH = parseFloat(getComputedStyle(title).lineHeight) / 100;
      const reserve = mobile ? 0.42 : 0.36;
      const byHeight =
        (stage.clientHeight * (1 - reserve)) / (lines.length * lineH * (mobile ? 1.4 : 1));
      const size = Math.min((100 * avail) / longest, byHeight) * 0.995;
      title.style.setProperty('--hb-size', px(size));
      bpTitle?.style.setProperty('--hb-size', px(size));
    };

    // --- Etykiety blueprintu: prawdziwe wymiary z DOM ---
    const measure = () => {
      bpEls.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.dataset.tag = el.dataset.buildEl ?? '';
        el.dataset.size = `${Math.round(r.width)} × ${Math.round(r.height)}`;
      });
      const edge = stage.getBoundingClientRect().right - 80;
      bpLines.forEach((el) => {
        const r = el.getBoundingClientRect();
        el.dataset.size = `${Math.round(r.width)}px`;
        el.toggleAttribute('data-edge', r.right > edge);
      });
      if (title) {
        const cs = getComputedStyle(title);
        const ls = parseFloat(cs.letterSpacing) / parseFloat(cs.fontSize);
        spec.textContent = `font-size: ${px(parseFloat(cs.fontSize))};\nletter-spacing: ${ls.toFixed(3)}em;\nfont-weight: ${cs.fontWeight};`;
      }
    };

    const layout = () => {
      fit();
      measure();
    };
    layout();

    // --- Soczewka ---
    const mouse = new Mouse({ lerp: p.LENS_LERP, pacePx: p.PACE_PX, paceLerp: p.PACE_LERP });
    let pointerSeen = false;
    const onPointer = () => (pointerSeen = true);
    const onLeave = () => (pointerSeen = false);
    window.addEventListener('pointermove', onPointer, { passive: true });
    html.addEventListener('pointerleave', onLeave);

    const lens = { r: 0, on: reduced ? 1 : 0, t: 0, vx: 0, vy: 0, lx: 0, ly: 0 };
    const pts: [number, number][] = Array.from({ length: LENS_POINTS }, () => [0, 0]);
    const drawLens = () => {
      if (lens.r < 1) {
        blueprint.style.clipPath = 'circle(0 at 0 0)';
        lensPath.setAttribute('d', '');
        return;
      }
      const rect = stage.getBoundingClientRect();
      const cx = mouse.eased.x - rect.left;
      const cy = mouse.eased.y - rect.top;
      const speed = Math.hypot(lens.vx, lens.vy);
      const dir = Math.atan2(lens.vy, lens.vx);
      const stretch = p.LENS_STRETCH * Math.min(speed / p.PACE_PX, 1);
      for (let i = 0; i < LENS_POINTS; i++) {
        const a = (i / LENS_POINTS) * Math.PI * 2;
        const wobble = reduced
          ? 1
          : 1 +
            p.LENS_WOBBLE * Math.sin(3 * a + lens.t * 1.4) +
            p.LENS_WOBBLE * 0.7 * Math.sin(5 * a - lens.t * 0.9);
        const s = 1 + stretch * Math.cos(a - dir) ** 2;
        const rr = lens.r * wobble * s;
        pts[i]![0] = cx + Math.cos(a) * rr;
        pts[i]![1] = cy + Math.sin(a) * rr;
      }
      const d = smoothPath(pts);
      blueprint.style.clipPath = `path('${d}')`;
      lensPath.setAttribute('d', d);
    };

    const tick = (_time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      mouse.update(dt);
      const frames = Math.max(dt * 60, 1e-3);
      const vx = (mouse.eased.x - lens.lx) / frames;
      const vy = (mouse.eased.y - lens.ly) / frames;
      lens.lx = mouse.eased.x;
      lens.ly = mouse.eased.y;
      lens.vx += (vx - lens.vx) * frameLerp(0.2, dt);
      lens.vy += (vy - lens.vy) * frameLerp(0.2, dt);
      lens.t += dt;
      const target = pointerSeen ? (p.LENS_IDLE + p.LENS_GROW * mouse.pace) * lens.on : 0;
      lens.r += (target - lens.r) * frameLerp(p.LENS_RADIUS_LERP, dt);
      // w trakcie intro clip-path blueprintu należy do timeline'u
      if (introDone) drawLens();
    };

    // --- Intro: build → render ---
    const finalClip = (y: number) => `inset(0 0 ${(1 - y) * 100}% 0)`;
    const bpClip = (y: number) => `inset(${y * 100}% 0 0 0)`;
    let introTl: gsap.core.Timeline | null = null;
    let introDone = reduced;

    const finishIntro = () => {
      introDone = true;
      gsap.set([...bpEls, ...bpLines], { clearProps: 'clipPath' });
      final.style.clipPath = '';
      blueprint.style.clipPath = 'circle(0 at 0 0)';
      gsap.set(scan, { opacity: 0 });
      gsap.to(term, { opacity: 0, y: 8, duration: 0.4, ease: 'power2.out' });
      gsap.to(lens, { on: 1, duration: 0.6, ease: 'power2.out' });
    };

    const ctx = gsap.context(() => {
      if (!reduced) {
        const typed = { n: 0 };
        const progress = { v: 0 };
        html.classList.remove('hb-pre');
        gsap.set(final, { clipPath: finalClip(0) });
        gsap.set(blueprint, { clipPath: 'none' });
        gsap.set(term, { opacity: 1 });
        gsap.set(cols, { scaleY: 0 });
        // wipe od lewej; zapas w em, żeby etykiety nad i obok ramek nie były ucinane
        gsap.set([...bpEls, ...bpLines], { clipPath: 'inset(-2.5em 100% -2.5em -1em)' });
        gsap.set(spec, { opacity: 0 });

        introTl = gsap
          .timeline({ onComplete: finishIntro })
          .to(typed, {
            n: COMMAND.length,
            duration: p.TYPE_DURATION,
            ease: 'none',
            onUpdate: () => {
              cmd.textContent = COMMAND.slice(0, Math.round(typed.n));
            },
          })
          .add(() => {
            status.textContent = '▸ kompiluję moduły…';
          })
          .to(cols, { scaleY: 1, duration: 0.7, ease, stagger: 0.035 }, '<')
          .to(
            bpEls,
            { clipPath: 'inset(-2.5em -8em -2.5em -1em)', duration: 0.6, ease, stagger: 0.08 },
            '<0.15'
          )
          .to(
            bpLines,
            { clipPath: 'inset(-2.5em -8em -2.5em -1em)', duration: 0.7, ease, stagger: 0.09 },
            '<0.1'
          )
          .to(spec, { opacity: 1, duration: 0.3 }, '>-0.2')
          .to(
            progress,
            {
              v: 1,
              duration: p.BUILD_DURATION,
              ease: 'power1.inOut',
              onUpdate: () => {
                bar.style.transform = `scaleX(${progress.v})`;
              },
            },
            0.1 + p.TYPE_DURATION
          )
          .add(() => {
            // prawdziwy czas od wejścia na stronę, nie wymyślona liczba
            const s = (performance.now() / 1000).toFixed(2).replace('.', ',');
            status.textContent = `✓ gotowe w ${s} s`;
          })
          // przebieg renderu: od góry blueprint zamienia się w gotową stronę
          .set(scan, { opacity: 1, y: 0 })
          .to(
            { y: 0 },
            {
              y: 1,
              duration: p.RENDER_DURATION,
              ease: 'power2.inOut',
              onUpdate: function (this: gsap.core.Tween) {
                const y = (this.targets()[0] as { y: number }).y;
                final.style.clipPath = finalClip(y);
                blueprint.style.clipPath = bpClip(y);
                scan.style.transform = `translateY(${y * stage.clientHeight}px)`;
              },
            }
          );
      } else {
        html.classList.remove('hb-pre');
        term.style.display = 'none';
      }

      // scroll: wiersze nagłówka rozjeżdżają się na boki, blueprint razem z nimi
      if (!reduced) {
        ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
          onUpdate: (self) => {
            lines.forEach((line, i) => {
              const x = (i % 2 ? 1 : -1) * self.progress * p.SCROLL_SHIFT * window.innerWidth;
              line.style.transform = `translate3d(${x}px, 0, 0)`;
              const bp = bpLines[i];
              if (bp) bp.style.transform = line.style.transform;
            });
          },
        });
      }
    }, root);

    gsap.ticker.add(tick);

    // pominięcie intro: klik, kółko, klawisz
    const skip = () => {
      if (!introDone && introTl) introTl.progress(1);
    };
    window.addEventListener('wheel', skip, { passive: true });
    window.addEventListener('keydown', skip);
    stage.addEventListener('pointerdown', skip);

    const onResize = () => layout();
    window.addEventListener('resize', onResize);

    cleanup = () => {
      introTl?.kill();
      ctx.revert();
      gsap.ticker.remove(tick);
      window.removeEventListener('pointermove', onPointer);
      html.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('keydown', skip);
      stage.removeEventListener('pointerdown', skip);
      window.removeEventListener('resize', onResize);
      mouse.destroy();
      clone.remove();
      blueprint.style.clipPath = '';
      final.style.clipPath = '';
      lines.forEach((l) => (l.style.transform = ''));
    };
  },

  destroy() {
    cleanup?.();
    cleanup = null;
  },
};

export default HeroBuild;
