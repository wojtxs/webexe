/**
 * hero-build.ts — spike hero „Build” (tylko /lab/hero-build).
 *
 * Mechanika hero z landonorris.com, nasza treść:
 * 1. wejście: terminal wpisuje `npm run build`, a blueprint strony (siatka, ramki z tagami, prawdziwe
 *    wymiary z DOM, nagłówek w obrysie) i rentgen obiektu `>_` rysują się na żywo,
 * 2. przebieg renderu: linia skanu zjeżdża w dół i zamienia blueprint w gotowe hero, a rentgen
 *    obiektu w render,
 * 3. obiekt `>_` to zdjęcie z mapami w GL (PromptScene): pasma szumu odsłaniają rentgen pod
 *    renderem, kursor ugina pasma i porusza obiekt paralaksą z mapy głębi, ten sam szum rysuje
 *    poziomice w tle,
 * 4. scroll (sticky 2 × vh): wiersze nagłówka rozjeżdżają się na boki, obiekt odjeżdża w górę,
 *    potem Manifest odsłania się linia po linii i kończy blokiem kursora.
 * Klik, scroll albo klawisz przewija intro do końca. Minimalny kod, nie produkcja.
 */

import type { Module } from '@core/lifecycle';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { PromptScene } from '@gl/PromptScene';
import { heroBuildParams as p } from '@gl/params';
import { easeFromToken } from '@gl/ease';
import { hasWebGL } from '@gl/support';

gsap.registerPlugin(ScrollTrigger, SplitText);

const COMMAND = 'npm run build';

const px = (v: number) => `${Math.round(v)}px`;

let cleanup: (() => void) | null = null;

const HeroBuild: Module = {
  init(root: HTMLElement) {
    const stage = root.querySelector<HTMLElement>('[data-build-stage]');
    const final = root.querySelector<HTMLElement>('[data-build-final]');
    const blueprint = root.querySelector<HTMLElement>('[data-build-blueprint]');
    const object = root.querySelector<HTMLElement>('[data-gl="hero"]');
    const scan = root.querySelector<HTMLElement>('[data-build-scan]');
    const term = root.querySelector<HTMLElement>('[data-build-term]');
    const cmd = root.querySelector<HTMLElement>('[data-build-cmd]');
    const status = root.querySelector<HTMLElement>('[data-build-status]');
    const bar = root.querySelector<HTMLElement>('[data-build-bar]');
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    const manifest = document.querySelector<HTMLElement>('[data-build-manifest]');
    const html = document.documentElement;
    if (!stage || !final || !blueprint || !object || !scan || !term || !cmd || !status || !bar) {
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

    // --- Położenie obiektu (płaszczyzna GL idzie za prostokątem elementu) ---
    const place = () => {
      const mobile = window.innerWidth < 768;
      object.style.setProperty('--obj-w', String(mobile ? p.OBJECT_WIDTH_M : p.OBJECT_WIDTH));
      object.style.setProperty('--obj-x', String(mobile ? p.OBJECT_X_M : p.OBJECT_X));
      object.style.setProperty('--obj-y', String(mobile ? p.OBJECT_Y_M : p.OBJECT_Y));
    };

    const layout = () => {
      place();
      fit();
      measure();
    };
    layout();

    // --- GL: obiekt `>_` + poziomice w tle; bez WebGL zostaje obraz A ---
    const gl = { opacity: reduced ? 1 : 0, scan: reduced ? 1 : 0, bgReveal: reduced ? 1 : 0 };
    let scene: PromptScene | null = null;
    let disposed = false;
    if (wrap && hasWebGL()) {
      PromptScene.create(wrap, object)
        .then((s) => {
          if (disposed) return s.destroy();
          scene = s;
          root.dataset.gl = 'on';
        })
        .catch(() => (root.dataset.glFallback = ''));
    } else {
      root.dataset.glFallback = '';
    }

    const tick = (_time: number, deltaMs: number) => {
      if (!scene) return;
      Object.assign(scene.state, gl);
      scene.update(Math.min(deltaMs / 1000, 0.1), reduced);
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
      blueprint.style.clipPath = bpClip(1);
      Object.assign(gl, { opacity: 1, scan: 1, bgReveal: 1 });
      gsap.set(scan, { opacity: 0 });
      gsap.to(term, { opacity: 0, y: 8, duration: 0.4, ease: 'power2.out' });
    };

    let split: SplitText | null = null;

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
          // rentgen obiektu wyłania się razem z siatką
          .to(gl, { opacity: 1, duration: 0.9, ease: 'power2.out' }, '<0.1')
          .to(
            bpEls,
            { clipPath: 'inset(-2.5em -8em -2.5em -1em)', duration: 0.6, ease, stagger: 0.08 },
            '<0.05'
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
          // przebieg renderu: od góry blueprint zamienia się w gotową stronę, rentgen w render
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
                gl.scan = y;
                gl.bgReveal = y;
              },
            }
          );
      } else {
        html.classList.remove('hb-pre');
        term.style.display = 'none';
        blueprint.style.clipPath = bpClip(1);
      }

      if (!reduced) {
        // sticky: wiersze rozjeżdżają się na boki, obiekt odjeżdża w górę i maleje
        ScrollTrigger.create({
          trigger: root,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const t = self.progress;
            lines.forEach((line, i) => {
              const x = (i % 2 ? 1 : -1) * t * p.SCROLL_SHIFT * window.innerWidth;
              line.style.transform = `translate3d(${x}px, 0, 0)`;
              const bp = bpLines[i];
              if (bp) bp.style.transform = line.style.transform;
            });
            object.style.setProperty('--obj-lift', String(t * p.SCROLL_LIFT));
            object.style.setProperty('--obj-scale', String(1 - t * (1 - p.SCROLL_SCALE)));
          },
        });

        // Manifest: linia po linii spod maski, na końcu blok kursora
        if (manifest) {
          split = SplitText.create(manifest.querySelectorAll('[data-build-reveal]'), {
            type: 'lines',
            mask: 'lines',
          });
          gsap.from(split.lines, {
            yPercent: 110,
            duration: 1.1,
            ease,
            stagger: 0.08,
            scrollTrigger: { trigger: manifest, start: 'top 75%' },
          });
        }
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

    const onResize = () => {
      layout();
      scene?.resize();
    };
    window.addEventListener('resize', onResize);

    cleanup = () => {
      disposed = true;
      introTl?.kill();
      split?.revert();
      ctx.revert();
      gsap.ticker.remove(tick);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('keydown', skip);
      stage.removeEventListener('pointerdown', skip);
      window.removeEventListener('resize', onResize);
      scene?.destroy();
      scene = null;
      delete root.dataset.gl;
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
