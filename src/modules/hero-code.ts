/**
 * hero-code.ts — spike /lab/hero-code: znak x z kodu, jedna scena przez całą stronę.
 * Mechanika wzorem endurosat.com/space-service, motyw z naszego świata (kod, systemy, automatyzacja).
 *
 * Scena GL stoi pod całą stroną (fixed), sekcje przewijają się nad nią. Każda sekcja z
 * [data-hc-key] to klatka kluczowa stanu sceny; między klatkami stan płynie za scrollem:
 * hero (x z kodu) → problem (kod się rozsypuje) → odpowiedź (pasmo układa kod w bloki) →
 * „Jak pracujemy” (x w środku) → kroki po bokach znaku: szkic, budowa, impulsy, puls → CTA na x.
 * Tekst: wiersze H1 spod maski, Manifest słowo po słowie, czasowniki kroków wjeżdżają z boku.
 * Reduced motion: scena stoi w jednym stanie, treść w zwykłym przepływie. Bez WebGL: tło z CSS.
 * Minimalny kod, nie produkcja.
 */

import type { Module } from '@core/lifecycle';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CodeScene, STATE_KEYS, type CodeState } from '@gl/CodeScene';
import { Mouse } from '@gl/Mouse';
import { heroCodeParams as p } from '@gl/params';
import { easeFromToken } from '@gl/ease';
import { loadDebug } from '@gl/debug';
import { hasWebGL } from '@gl/support';

gsap.registerPlugin(ScrollTrigger, SplitText);

type Key = Partial<CodeState>;

const BASE: CodeState = {
  x: 0.71,
  y: 0.48,
  s: 0.8,
  zoom: 1,
  chaos: 0,
  order: 0,
  wire: 0,
  build: 0,
  flow: 0,
  beat: 0,
  dim: 0,
};

/** klatki kluczowe: desktop (znak po stronie bez tekstu) */
const KEYS: Record<string, Key> = {
  hero: {},
  problem: { x: 0.7, y: 0.5, s: 0.66, chaos: 1 },
  answer: { x: 0.7, y: 0.5, s: 0.66, order: 1 },
  steps: { x: 0.5, y: 0.5, s: 0.86, zoom: 1.15, order: 1, dim: 0.45 },
  step1: { x: 0.72, y: 0.5, s: 0.62, wire: 1 },
  step2: { x: 0.28, y: 0.5, s: 0.62, build: 1, order: 1 },
  step3: { x: 0.72, y: 0.5, s: 0.62, order: 1, flow: 1 },
  step4: { x: 0.28, y: 0.5, s: 0.62, order: 1, flow: 0.4, beat: 1 },
  end: { x: 0.5, y: 0.5, s: 0.8, zoom: 1.1, order: 1, flow: 0.5, beat: 0.6, dim: 0.5 },
};

/** mobile: znak nad tekstem, w środku szerokości */
const KEYS_M: Record<string, Key> = {
  hero: { x: 0.5, y: 0.22, s: 0.78 },
  problem: { x: 0.5, y: 0.25, s: 0.78, chaos: 1 },
  answer: { x: 0.5, y: 0.25, s: 0.78, order: 1 },
  steps: { x: 0.5, y: 0.5, s: 1, order: 1, dim: 0.5 },
  step1: { x: 0.5, y: 0.25, s: 0.72, wire: 1 },
  step2: { x: 0.5, y: 0.25, s: 0.72, build: 1, order: 1 },
  step3: { x: 0.5, y: 0.25, s: 0.72, order: 1, flow: 1 },
  step4: { x: 0.5, y: 0.25, s: 0.72, order: 1, flow: 0.4, beat: 1 },
  end: { x: 0.5, y: 0.45, s: 1, order: 1, flow: 0.5, beat: 0.6, dim: 0.55 },
};

/** reduced motion: jeden spokojny stan */
const CALM: Key = { order: 1 };
const CALM_M: Key = { x: 0.5, y: 0.22, s: 0.78, order: 1 };

const full = (k: Key): CodeState => ({ ...BASE, ...k });
const smooth = (t: number) => t * t * (3 - 2 * t);

let cleanup: (() => void) | null = null;

const HeroCode: Module = {
  init(root: HTMLElement) {
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ease = easeFromToken('--ease-default');
    const easeOut = easeFromToken('--ease-out');
    const mouse = new Mouse({ lerp: 0.18, pacePx: p.PACE_PX, paceLerp: p.PACE_LERP });
    const keyEls = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-key]'));

    let scene: CodeScene | null = null;
    let disposed = false;
    let anchors: { y: number; state: CodeState }[] = [];

    // klatka kluczowa = sekcja wypełnia ekran (jej góra przy górze ekranu), ostatnia przy końcu strony
    const measure = () => {
      const mobile = window.innerWidth < 768;
      const table = mobile ? KEYS_M : KEYS;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      anchors = keyEls.map((el) => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        const centered = el.offsetHeight < window.innerHeight;
        const y = centered ? top - (window.innerHeight - el.offsetHeight) / 2 : top;
        return { y: Math.min(Math.max(y, 0), max), state: full(table[el.dataset.hcKey!] ?? {}) };
      });
    };

    const target = full({});
    const sample = (sy: number) => {
      if (!anchors.length) return;
      let i = 0;
      while (i < anchors.length - 1 && sy > anchors[i + 1]!.y) i++;
      const a = anchors[i]!;
      const b = anchors[Math.min(i + 1, anchors.length - 1)]!;
      const t = b.y > a.y ? smooth(Math.min(Math.max((sy - a.y) / (b.y - a.y), 0), 1)) : 0;
      for (const k of STATE_KEYS) target[k] = a.state[k] + (b.state[k] - a.state[k]) * t;
    };

    if (wrap && hasWebGL()) {
      CodeScene.create(wrap, mouse)
        .then((s) => {
          if (disposed) return s.destroy();
          scene = s;
          if (reduced) {
            Object.assign(s.state, full(window.innerWidth < 768 ? CALM_M : CALM));
            s.appear = 1;
          } else {
            measure();
            sample(window.scrollY);
            Object.assign(s.state, target);
            gsap.to(s, { appear: 1, duration: 2.2, ease: 'power2.out', delay: 0.1 });
          }
        })
        .catch(() => wrap.setAttribute('data-fallback', ''));
    } else {
      wrap?.setAttribute('data-fallback', '');
    }

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      mouse.update(dt);
      if (!scene) return;
      if (!reduced) {
        sample(window.scrollY);
        const k = 1 - Math.pow(1 - p.FOLLOW, dt * 60);
        for (const key of STATE_KEYS) scene.state[key] += (target[key] - scene.state[key]) * k;
        scene.lineShift = (window.scrollY / window.innerHeight) * p.LINES_PER_SCREEN;
      }
      scene.update(dt, reduced);
    };
    gsap.ticker.add(tick);

    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button')) return;
      scene?.burst();
      if (scene) scene.hold = true;
    };
    const onUp = () => {
      if (scene) scene.hold = false;
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      root.dataset.live = '';

      // hero: wiersze spod maski, potem lead i przyciski
      const lines = root.querySelectorAll('[data-hc-line]');
      const side = root.querySelector('[data-hc-side]');
      const tl = gsap.timeline({ delay: 0.3 });
      tl.from(lines, { yPercent: 115, duration: 1.1, ease, stagger: 0.08 }).from(
        side ? Array.from(side.children) : [],
        { y: 24, autoAlpha: 0, duration: 0.9, ease: easeOut, stagger: 0.1 },
        0.55
      );

      // hero odpływa w górę szybciej niż scroll
      const hero = root.querySelector('[data-hc-key="hero"]');
      if (hero) {
        gsap.to(hero.querySelectorAll('[data-hc-row], [data-hc-side]'), {
          yPercent: -40,
          autoAlpha: 0,
          ease: 'none',
          stagger: 0.03,
          scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom 20%', scrub: true },
        });
      }

      // Manifest: słowa z szarości do pełnej Kości
      const splits = Array.from(root.querySelectorAll<HTMLElement>('[data-hc-words]')).map((el) => {
        const split = SplitText.create(el, { type: 'words' });
        gsap.fromTo(
          split.words,
          { opacity: 0.16 },
          {
            opacity: 1,
            ease: 'none',
            stagger: 0.05,
            scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true },
          }
        );
        return split;
      });

      // nagłówek „Jak pracujemy” rośnie z x
      const title = root.querySelector('[data-hc-title]');
      if (title) {
        gsap.fromTo(
          title,
          { scale: 0.86, autoAlpha: 0 },
          {
            scale: 1,
            autoAlpha: 1,
            ease: 'none',
            scrollTrigger: { trigger: title, start: 'top 85%', end: 'center 50%', scrub: true },
          }
        );
      }

      // kroki: czasownik wjeżdża od krawędzi ekranu po swojej stronie, opis za nim
      root.querySelectorAll<HTMLElement>('[data-hc-step]').forEach((step) => {
        const dir = step.dataset.hcStep === 'right' ? 1 : -1;
        const st = { trigger: step, start: 'top 85%', end: 'top 30%', scrub: true };
        gsap.fromTo(
          step.querySelector('[data-hc-verb]'),
          { xPercent: 35 * dir, autoAlpha: 0 },
          { xPercent: 0, autoAlpha: 1, ease: 'none', scrollTrigger: st }
        );
        gsap.fromTo(
          step.querySelectorAll('[data-hc-fade]'),
          { y: 30, autoAlpha: 0 },
          {
            y: 0,
            autoAlpha: 1,
            ease: 'none',
            stagger: 0.1,
            scrollTrigger: { ...st, start: 'top 70%' },
          }
        );
      });

      // CTA na końcu: wiersze spod maski
      const endLines = root.querySelectorAll('[data-hc-end-line]');
      gsap.from(endLines, {
        yPercent: 110,
        ease: 'none',
        stagger: 0.1,
        scrollTrigger: {
          trigger: endLines[0]?.parentElement ?? root,
          start: 'top 85%',
          end: 'top 45%',
          scrub: true,
        },
      });

      // przycisk w rogu po zejściu z hero
      const dock = root.querySelector('[data-hc-dock]');
      if (dock) {
        ScrollTrigger.create({
          trigger: hero ?? root,
          start: 'bottom 60%',
          end: 'max',
          toggleClass: { targets: dock, className: 'is-on' },
        });
      }

      ScrollTrigger.refresh();
      measure();

      return () => {
        splits.forEach((s) => s.revert());
        delete root.dataset.live;
      };
    });

    const onRefresh = () => measure();
    ScrollTrigger.addEventListener('refresh', onRefresh);
    const onResize = () => scene?.resize();
    window.addEventListener('resize', onResize);

    let gui: Awaited<ReturnType<typeof loadDebug>> = null;
    void loadDebug('hero kod').then((g) => {
      if (!g || disposed) return g?.destroy();
      gui = g;
      const keys = [
        ['BG_ALPHA', 0, 0.6],
        ['BG_REACH', 0.2, 3],
        ['LINES_PER_S', 0, 4],
        ['LENS_R', 0, 300],
        ['FOLLOW', 0.02, 1],
      ] as const;
      keys.forEach(([k, a, b]) => g.add(p, k, a, b, 0.01));
    });

    cleanup = () => {
      disposed = true;
      mm.revert();
      gsap.ticker.remove(tick);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('resize', onResize);
      gui?.destroy();
      mouse.destroy();
      scene?.destroy();
      scene = null;
    };
  },

  destroy() {
    cleanup?.();
    cleanup = null;
  },
};

export default HeroCode;
