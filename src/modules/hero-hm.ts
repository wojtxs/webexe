/**
 * hero-hm.ts — spike hero „HUMAN / MACHINE” (tylko /lab/hero-hm).
 *
 * Bohaterem jest sama strona, w dwóch stanach jak twarz i kask u Lando:
 * - HUMAN: gotowe hero i Manifest na jasnym tle z poziomicami (ContourScene),
 * - MACHINE: klon tej samej struktury jako system: siatka, ramki z tagami, prawdziwe wymiary z DOM,
 *   nagłówki w obrysie z liniami bazowymi.
 * Warstwę MACHINE odsłania jedna maska clip-path: path(), suma:
 * 1. poziomych pasm w spoczynku (co kilka sekund, losowa wysokość, postrzępione krawędzie),
 * 2. plamy pod kursorem (rośnie z prędkością ruchu, gaśnie, gdy kursor stoi),
 * 3. frontów sterowanych scrollem i intro: MACHINE zalewa ekran, hero przekompilowuje się
 *    w Manifest (tekst dekoduje się ze znaków), front cofa się i odsłania gotowy Manifest,
 *    na końcu rysuje się znak x,
 * 4. przełącznika HUMAN / MACHINE w nawigacji.
 * Minimalny kod, nie produkcja.
 */

import type { Module } from '@core/lifecycle';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { ContourScene } from '@gl/ContourScene';
import { Mouse } from '@gl/Mouse';
import { heroHmParams as p } from '@gl/params';
import { easeFromToken } from '@gl/ease';
import { loadDebug } from '@gl/debug';
import { hasWebGL } from '@gl/support';

gsap.registerPlugin(ScrollTrigger, ScrambleTextPlugin, DrawSVGPlugin);

const px = (v: number) => `${Math.round(v)}px`;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const f1 = (v: number) => v.toFixed(1);

/** gładki szum 1D z trzech sinusów, wynik ~ −1..1 */
const wave = (x: number, seed: number, t: number) =>
  Math.sin(x * 7.3 + seed + t * 1.1) * 0.5 +
  Math.sin(x * 13.1 + seed * 1.7 - t * 0.8) * 0.3 +
  Math.sin(x * 29.7 + seed * 3.1 + t * 1.9) * 0.2;

const SEGMENTS = 36;

/**
 * Poziomy pas [top, bottom] na całą szerokość, krawędzie postrzępione. Kierunek zgodny z ruchem
 * wskazówek zegara (jak plama), więc reguła nonzero sumuje podścieżki.
 */
function bandPath(top: number, bottom: number, w: number, amp: number, seed: number, t: number) {
  if (bottom - top < 0.5) return '';
  const a = Math.min(amp, (bottom - top) * 0.3);
  let d = '';
  for (let i = 0; i <= SEGMENTS; i++) {
    const k = i / SEGMENTS;
    d += `${i ? 'L' : 'M'}${f1(k * (w + 4) - 2)} ${f1(top + wave(k, seed, t) * a)}`;
  }
  for (let i = SEGMENTS; i >= 0; i--) {
    const k = i / SEGMENTS;
    d += `L${f1(k * (w + 4) - 2)} ${f1(bottom + wave(k, seed + 9.1, t) * a)}`;
  }
  return `${d}Z`;
}

/** organiczna plama; częstotliwości całkowite, żeby obwód się domykał */
function blobPath(cx: number, cy: number, r: number, wobble: number, t: number) {
  if (r < 1) return '';
  let d = '';
  const n = 48;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k =
      1 +
      wobble *
        (Math.sin(a * 3 + t * 1.3) * 0.5 +
          Math.sin(a * 5 - t * 0.9 + 1.2) * 0.3 +
          Math.sin(a * 8 + t * 2.1) * 0.2);
    d += `${i ? 'L' : 'M'}${f1(cx + Math.cos(a) * r * k)} ${f1(cy + Math.sin(a) * r * k)}`;
  }
  return `${d}Z`;
}

type Band = { y: number; h: number; age: number; seed: number };

let cleanup: (() => void) | null = null;

const HeroHm: Module = {
  init(root: HTMLElement) {
    const stage = root.querySelector<HTMLElement>('[data-hm-stage]');
    const human = root.querySelector<HTMLElement>('[data-hm-human]');
    const machine = root.querySelector<HTMLElement>('[data-hm-machine]');
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    const html = document.documentElement;
    if (!stage || !human || !machine) {
      html.classList.remove('hm-pre');
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = easeFromToken('--ease-default');

    // --- MACHINE = klon warstwy HUMAN: identyczna geometria bez liczenia pozycji ---
    const clone = document.createElement('div');
    clone.className = 'hm-clone';
    clone.style.display = 'contents';
    human.childNodes.forEach((n) => clone.appendChild(n.cloneNode(true)));
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    clone.querySelectorAll('a, button').forEach((el) => el.setAttribute('tabindex', '-1'));
    machine.appendChild(clone);

    const q = <T extends Element = HTMLElement>(el: ParentNode, s: string) =>
      Array.from(el.querySelectorAll<T & HTMLElement>(s));
    const hEls = q(human, '[data-hm-el]');
    const mEls = q(clone, '[data-hm-el]');
    const hLines = q(human, '[data-hm-line]');
    const mLines = q(clone, '[data-hm-line]');
    const title = human.querySelector<HTMLElement>('[data-hm-title]');
    const mTitle = clone.querySelector<HTMLElement>('[data-hm-title]');
    const hHero = human.querySelector<HTMLElement>('[data-hm-scene="hero"]');
    const hManifest = human.querySelector<HTMLElement>('[data-hm-scene="manifest"]');
    const mHero = clone.querySelector<HTMLElement>('[data-hm-scene="hero"]');
    const mManifest = clone.querySelector<HTMLElement>('[data-hm-scene="manifest"]');
    const mDecode = q(clone, '[data-hm-decode]');
    const xLines = q<SVGLineElement>(human, '[data-hm-x] line');
    const cols = q(machine, '[data-hm-col]');
    const toggles = q<HTMLButtonElement>(human, '[data-hm-mode]');
    const spec = document.createElement('span');
    spec.className = 'hm-spec';
    mTitle?.appendChild(spec);

    // tekst do dekodowania: zapamiętany, w klonie startuje pusty
    const decodeText = mDecode.map((el) => el.textContent?.replace(/\s+/g, ' ').trim() ?? '');

    // --- Rozmiar nagłówka: najdłuższy wiersz = szerokość kontenera (mobile: najdłuższe słowo) ---
    const fit = () => {
      if (!title) return;
      const mobile = window.innerWidth < 768;
      const container = title.parentElement!;
      const cs = getComputedStyle(container);
      const avail =
        container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      title.style.setProperty('--hm-size', '100px');
      const longest = mobile
        ? (hLines[1]?.scrollWidth ?? 1)
        : Math.max(...hLines.map((l) => l.scrollWidth));
      const lineH = parseFloat(getComputedStyle(title).lineHeight) / 100;
      const reserve = mobile ? 0.45 : 0.4;
      const byHeight =
        (stage.clientHeight * (1 - reserve)) / (hLines.length * lineH * (mobile ? 1.4 : 1));
      const size = Math.min((100 * avail) / longest, byHeight) * 0.995;
      title.style.setProperty('--hm-size', px(size));
      mTitle?.style.setProperty('--hm-size', px(size));
    };

    // --- Etykiety MACHINE: wymiary z elementów HUMAN (klon w trakcie dekodowania jest pusty) ---
    const measure = () => {
      hEls.forEach((el, i) => {
        const m = mEls[i];
        if (!m) return;
        const r = el.getBoundingClientRect();
        m.dataset.tag = el.dataset.hmEl ?? '';
        m.dataset.size = `${Math.round(r.width)} × ${Math.round(r.height)}`;
        if (m.hasAttribute('data-hm-decode')) m.style.minHeight = px(r.height);
      });
      const edge = stage.getBoundingClientRect().right - 80;
      hLines.forEach((el, i) => {
        const m = mLines[i];
        if (!m) return;
        const r = el.getBoundingClientRect();
        m.dataset.size = `${Math.round(r.width)}px`;
        m.toggleAttribute('data-edge', r.right > edge);
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

    // --- Tło: poziomice w GL; bez WebGL zostaje jednolite tło z CSS ---
    const mouse = new Mouse({ lerp: p.MOUSE_LERP, pacePx: p.PACE_PX, paceLerp: p.PACE_LERP });
    let scene: ContourScene | null = null;
    let disposed = false;
    if (wrap && hasWebGL()) {
      ContourScene.create(wrap, mouse)
        .then((s) => {
          if (disposed) return s.destroy();
          scene = s;
          root.dataset.gl = 'on';
        })
        .catch(() => (root.dataset.glFallback = ''));
    } else {
      root.dataset.glFallback = '';
    }

    // --- Stan maski ---
    const st = {
      /** intro: front MACHINE cofa się od góry i odsłania HUMAN (0 = cały MACHINE) */
      intro: reduced ? 1 : 0,
      /** scroll: zalanie ekranu od środka */
      cover: 0,
      /** scroll: front cofa się od góry, odsłania Manifest */
      recede: 0,
    };
    const bands: Band[] = [];
    let nextBand = 1.4;
    let blobR = 0;
    let forced = 0;
    let forcedTarget = 0;
    let pointerIn = false;
    let time = 0;
    let lastD = '';
    const onMove = () => (pointerIn = true);
    const onLeave = () => (pointerIn = false);
    window.addEventListener('pointermove', onMove, { passive: true });
    html.addEventListener('pointerleave', onLeave);

    const render = (dt: number) => {
      const w = stage.clientWidth;
      const h = stage.clientHeight;
      const amp = p.EDGE_NOISE * h;
      const t = time * p.EDGE_SPEED;
      let d = '';

      // intro + scroll: jeden front [top, bottom]; pad, żeby postrzępienie nie wychodziło w ekran
      const pad = 0.15 * h;
      const span = 0.5 * h + pad;
      const introTop = -pad + st.intro * (h + 2 * pad);
      d += bandPath(introTop, h + pad, w, amp * 2, 1.3, t);
      const top = h / 2 - st.cover * span + st.recede * 2 * span;
      const bottom = h / 2 + st.cover * span;
      d += bandPath(top, bottom, w, amp * 2, 4.7, t);
      if (forced > 0.001)
        d += bandPath(h / 2 - forced * span, h / 2 + forced * span, w, amp * 2, 7.9, t);

      if (!reduced) {
        // pasma w spoczynku
        nextBand -= dt;
        if (nextBand <= 0 && st.intro >= 1) {
          bands.push({
            y: rand(0.12, 0.88),
            h: rand(p.BAND_H_MIN, p.BAND_H_MAX),
            age: 0,
            seed: rand(0, 100),
          });
          nextBand = rand(p.BAND_GAP_MIN, p.BAND_GAP_MAX);
        }
        for (let i = bands.length - 1; i >= 0; i--) {
          const b = bands[i]!;
          b.age += dt;
          const k = b.age / p.BAND_LIFE;
          if (k >= 1) {
            bands.splice(i, 1);
            continue;
          }
          const hh = b.h * h * Math.pow(Math.sin(Math.PI * k), 0.6);
          const yc = (b.y + p.BAND_DRIFT * (k - 0.5)) * h;
          d += bandPath(yc - hh / 2, yc + hh / 2, w, amp, b.seed, t);
        }

        // plama pod kursorem
        const target =
          pointerIn && mouse.pace > 0.03 ? p.BLOB_RADIUS + p.BLOB_GROW * mouse.pace : 0;
        blobR += (target - blobR) * (1 - Math.pow(1 - p.BLOB_LERP, dt * 60));
        const r = stage.getBoundingClientRect();
        d += blobPath(mouse.eased.x - r.left, mouse.eased.y - r.top, blobR, p.BLOB_WOBBLE, t);
      }

      if (d !== lastD) {
        machine.style.clipPath = d ? `path('${d}')` : 'polygon(0 0, 0 0, 0 0)';
        lastD = d;
      }
    };

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      time += dt;
      mouse.update(dt);
      forced += (forcedTarget - forced) * (reduced ? 1 : 1 - Math.pow(1 - p.TOGGLE_LERP, dt * 60));
      render(dt);
      scene?.update(dt, reduced);
    };

    // --- Przełącznik HUMAN / MACHINE ---
    const setMode = (mode: string) => {
      forcedTarget = mode === 'machine' ? 1 : 0;
      root.dataset.mode = mode;
      toggles.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.hmMode === mode)));
    };
    const onToggle = (e: Event) =>
      setMode((e.currentTarget as HTMLElement).dataset.hmMode ?? 'human');
    toggles.forEach((b) => b.addEventListener('click', onToggle));

    // --- Intro i scroll ---
    let introTl: gsap.core.Timeline | null = null;
    const finishIntro = () => {
      st.intro = 1;
      gsap.set(cols, { scaleY: 1 });
      gsap.set(mEls, { clearProps: 'clipPath' });
    };

    const ctx = gsap.context(() => {
      html.classList.remove('hm-pre');
      if (reduced) {
        root.dataset.hmStatic = '';
        mDecode.forEach((el, i) => (el.textContent = decodeText[i] ?? ''));
        return;
      }
      root.dataset.hmLive = '';
      root.style.setProperty('--hm-track', String(p.TRACK_SCREENS));
      mDecode.forEach((el) => (el.textContent = ''));
      gsap.set(hManifest, { autoAlpha: 0 });
      gsap.set(mManifest, { autoAlpha: 0 });
      gsap.set(xLines, { drawSVG: '0%' });

      // intro: siatka i ramki rysują się w MACHINE, potem front odsłania HUMAN od góry
      gsap.set(cols, { scaleY: 0 });
      gsap.set(mEls, { clipPath: 'inset(-2.5em 100% -2.5em -1em)' });
      introTl = gsap
        .timeline({ onComplete: finishIntro, delay: 0.2 })
        .to(cols, { scaleY: 1, duration: 0.7, ease, stagger: 0.03 })
        .to(
          mEls,
          { clipPath: 'inset(-2.5em -8em -2.5em -1em)', duration: 0.6, ease, stagger: 0.06 },
          '<0.15'
        )
        .to(st, { intro: 1, duration: 1.1, ease: 'power2.inOut' }, '>-0.1');

      // scroll: zalanie → przekompilowanie w Manifest → odsłonięcie → znak x
      const tl = gsap.timeline({ defaults: { ease: 'none' } });
      tl.to(st, { cover: 1, duration: 1, ease: 'power2.inOut' }, 0);
      hLines.forEach((line, i) => {
        tl.to(line, { x: () => (i % 2 ? 1 : -1) * 0.12 * window.innerWidth, duration: 1 }, 0);
      });
      // pod pełnym MACHINE: HUMAN podmienia scenę bez widocznego cięcia
      tl.set(hHero, { autoAlpha: 0 }, 1).set(hManifest, { autoAlpha: 1 }, 1);
      mLines.forEach((line, i) => {
        tl.to(
          line,
          {
            x: () => (i % 2 ? 1 : -1) * 0.7 * window.innerWidth,
            autoAlpha: 0,
            duration: 0.7,
            ease: 'power2.in',
          },
          1 + i * 0.05
        );
      });
      tl.to(mHero?.querySelectorAll('[data-hm-fade]') ?? [], { autoAlpha: 0, duration: 0.4 }, 1);
      tl.to(mHero, { autoAlpha: 0, duration: 0.3 }, 1.45);
      tl.set(mManifest, { autoAlpha: 1 }, 1.3);
      mDecode.forEach((el, i) => {
        tl.to(
          el,
          {
            duration: 0.8,
            scrambleText: {
              text: decodeText[i] ?? '',
              chars: 'upperAndLowerCase',
              revealDelay: 0.3,
              speed: 0.6,
            },
          },
          1.35 + i * 0.75
        );
      });
      tl.to(st, { recede: 1, duration: 1.1, ease: 'power2.inOut' }, 3);
      tl.to(xLines, { drawSVG: '100%', duration: 0.35, stagger: 0.18, ease: 'power2.out' }, 4);
      tl.to({}, { duration: 0.3 }, 4.6);

      ScrollTrigger.create({
        trigger: root,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        animation: tl,
        invalidateOnRefresh: true,
      });
    }, root);

    gsap.ticker.add(tick);

    // pominięcie intro: kółko, klawisz, klik
    const skip = () => {
      if (introTl && st.intro < 1) introTl.progress(1);
    };
    window.addEventListener('wheel', skip, { passive: true });
    window.addEventListener('keydown', skip);
    stage.addEventListener('pointerdown', skip);

    const onResize = () => {
      layout();
      scene?.resize();
    };
    window.addEventListener('resize', onResize);

    // strojenie pod ?debug
    let gui: Awaited<ReturnType<typeof loadDebug>> = null;
    void loadDebug('hero HUMAN / MACHINE').then((g) => {
      if (!g || disposed) return g?.destroy();
      gui = g;
      g.add(p, 'BAND_GAP_MIN', 0.3, 6, 0.1);
      g.add(p, 'BAND_GAP_MAX', 0.5, 8, 0.1);
      g.add(p, 'BAND_LIFE', 0.3, 3, 0.05);
      g.add(p, 'BAND_H_MIN', 0.01, 0.3, 0.005);
      g.add(p, 'BAND_H_MAX', 0.02, 0.5, 0.005);
      g.add(p, 'EDGE_NOISE', 0, 0.05, 0.001);
      g.add(p, 'BLOB_RADIUS', 0, 300, 1);
      g.add(p, 'BLOB_GROW', 0, 400, 1);
      g.add(p, 'BLOB_WOBBLE', 0, 0.5, 0.01);
    });

    cleanup = () => {
      disposed = true;
      introTl?.kill();
      ctx.revert();
      gsap.ticker.remove(tick);
      toggles.forEach((b) => b.removeEventListener('click', onToggle));
      window.removeEventListener('pointermove', onMove);
      html.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('wheel', skip);
      window.removeEventListener('keydown', skip);
      stage.removeEventListener('pointerdown', skip);
      window.removeEventListener('resize', onResize);
      gui?.destroy();
      mouse.destroy();
      scene?.destroy();
      scene = null;
      clone.remove();
      machine.style.clipPath = '';
      delete root.dataset.gl;
      delete root.dataset.hmLive;
      delete root.dataset.hmStatic;
    };
  },

  destroy() {
    cleanup?.();
    cleanup = null;
  },
};

export default HeroHm;
