/**
 * hero-arcs.ts — spike hero (tylko /lab/hero-arcs), wzór: cerebrium.ai. Obiekt: „sieć systemów” (NetScene).
 *
 * 1. Intro: łuki wyrastają z dołu (GL), wiersze nagłówka wyjeżdżają spod maski, potem lead,
 *    przyciski, linia i marquee usług.
 * 2. Spoczynek: smugi światła biegną po łukach co kilka sekund, łuki idą za kursorem.
 *    Kliknięcie puszcza falę smug przez wszystkie łuki, przytrzymanie puszcza je seriami.
 *    Szybki scroll też odpala smugę.
 * 3. Scroll: nagłówek odjeżdża w górę, łuki rosną i kamera najeżdża, panel wjeżdża na hero.
 *    Manifest odsłania się słowo po słowie, na końcu rysuje się znak x.
 * 4. Jak pracujemy: sticky lista kroków, aktywny krok podświetlony; każda karta ma żywe mini-UI,
 *    które gra tylko wtedy, gdy karta jest na ekranie.
 * 5. Finał: łuki wracają przy CTA w innym ujęciu.
 * Reduced motion: statyczna klatka GL, treść od razu widoczna, mini-UI w stanie końcowym.
 * Minimalny kod, nie produkcja.
 */

import type { Module } from '@core/lifecycle';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { NetScene } from '@gl/NetScene';
import { Mouse } from '@gl/Mouse';
import { heroNetParams as p } from '@gl/params';
import { easeFromToken } from '@gl/ease';
import { loadDebug } from '@gl/debug';
import { hasWebGL } from '@gl/support';

gsap.registerPlugin(ScrollTrigger, SplitText, DrawSVGPlugin, MotionPathPlugin);

const q = <T extends Element = HTMLElement>(el: ParentNode, s: string) =>
  Array.from(el.querySelectorAll<T & HTMLElement>(s));

/** okresowa linia wykresu: dwa okresy obok siebie, żeby przesuw był bez szwu */
function chartPaths(w: number, h: number) {
  const n = 64;
  const y = (x: number) =>
    h * 0.55 -
    h *
      (0.16 * Math.sin((x / w) * Math.PI * 2 * 2) +
        0.1 * Math.sin((x / w) * Math.PI * 2 * 5 + 1.3) +
        0.06 * Math.sin((x / w) * Math.PI * 2 * 11 + 0.4));
  let line = '';
  for (let i = 0; i <= n * 2; i++) {
    const x = (i / n) * w;
    line += `${i ? 'L' : 'M'}${x.toFixed(1)} ${y(x).toFixed(1)}`;
  }
  return { line, area: `${line}L${2 * w} ${h}L0 ${h}Z` };
}

/** kapsuła (odcinek z okrągłymi końcami); ten sam kierunek obiegu, więc suma działa w nonzero */
function capsule(ax: number, ay: number, bx: number, by: number, r: number) {
  const l = Math.hypot(bx - ax, by - ay) || 1;
  const nx = (-(by - ay) / l) * r;
  const ny = ((bx - ax) / l) * r;
  const f = (v: number) => v.toFixed(1);
  return (
    `M${f(ax + nx)} ${f(ay + ny)}L${f(bx + nx)} ${f(by + ny)}` +
    `A${f(r)} ${f(r)} 0 0 0 ${f(bx - nx)} ${f(by - ny)}L${f(ax - nx)} ${f(ay - ny)}` +
    `A${f(r)} ${f(r)} 0 0 0 ${f(ax + nx)} ${f(ay + ny)}Z`
  );
}

/** znak x jak na ekranie rdzenia (NetScene drawFace): ramiona 0,4 × 0,46, kreska 0,13 szerokości */
function xPath(cx: number, cy: number, size: number) {
  const dx = size * 0.2;
  const dy = size * 0.23;
  const r = size * 0.065;
  return (
    capsule(cx - dx, cy - dy, cx + dx, cy + dy, r) + capsule(cx + dx, cy - dy, cx - dx, cy + dy, r)
  );
}

let cleanup: (() => void) | null = null;

const HeroArcs: Module = {
  init(root: HTMLElement) {
    const wrap = document.querySelector<HTMLElement>('[data-gl-wrap]');
    const dots = document.querySelector<HTMLElement>('[data-ha-dots]');
    const cursor = document.querySelector<HTMLElement>('[data-ha-cursor]');
    const hero = root.querySelector<HTMLElement>('[data-ha-hero]');
    const panel = root.querySelector<HTMLElement>('[data-ha-panel]');
    const cta = root.querySelector<HTMLElement>('[data-ha-cta]');
    if (!hero || !panel || !cta) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const ease = easeFromToken('--ease-default');
    const easeOut = easeFromToken('--ease-out');

    // --- GL; bez WebGL zostaje poświata z CSS ---
    const mouse = new Mouse({ lerp: 0.12, pacePx: p.PACE_PX, paceLerp: p.PACE_LERP });
    let scene: NetScene | null = null;
    let disposed = false;
    const view = { intro: reduced ? 1 : 0, scroll: 0, outro: 0, gather: 0 };
    const nav = root.querySelector<HTMLElement>('[data-ha-nav]');
    /** tryb ze scenami scrolla (bez reduced motion) */
    let live = false;
    /** Manifest lub panel zasłania cały ekran: GL nie renderuje */
    let covered = false;
    let dirty = true;

    if (wrap && hasWebGL()) {
      NetScene.create(wrap, mouse)
        .then((s) => {
          if (disposed) return s.destroy();
          scene = s;
          dirty = true;
        })
        .catch(() => wrap.setAttribute('data-fallback', ''));
    } else {
      wrap?.setAttribute('data-fallback', '');
    }

    const tick = (_t: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 0.1);
      mouse.update(dt);
      if (cursor && fine && !reduced) {
        cursor.style.transform = `translate3d(${mouse.eased.x}px, ${mouse.eased.y}px, 0)`;
      }
      // zasłonięte: maska x pełna, a CTA jeszcze poniżej ekranu
      covered = live && st.reveal >= 1 && cta.getBoundingClientRect().top > window.innerHeight;
      if (scene && !covered && (!reduced || dirty)) {
        scene.intro = view.intro;
        scene.scroll = view.scroll;
        scene.outro = view.outro;
        // przed finałem sieć jest złożona; rozproszenie startuje dopiero przy CTA
        scene.gather = view.gather > 0 ? view.gather : 1;
        scene.update(dt, reduced);
        dirty = false;
      }
      renderReveal();
    };
    gsap.ticker.add(tick);

    // --- Kliknięcie i przytrzymanie: smugi (poza linkami i przyciskami) ---
    const inArcs = (e: PointerEvent) =>
      !(e.target as Element).closest('a, button, [data-ha-panel]');
    const onDown = (e: PointerEvent) => {
      if (reduced || !scene || !inArcs(e)) return;
      scene.burst();
      scene.hold = true;
      cursor?.classList.add('is-down');
    };
    const onUp = () => {
      if (scene) scene.hold = false;
      cursor?.classList.remove('is-down');
    };
    const onMove = (e: PointerEvent) => {
      cursor?.classList.toggle(
        'is-on',
        fine && !reduced && !covered && st.reveal < 0.5 && inArcs(e)
      );
    };
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('pointermove', onMove, { passive: true });

    // --- Mini-UI kart: osobne pętle, grają tylko na ekranie ---
    const loops: gsap.core.Timeline[] = [];
    const buildLoops = () => {
      // 01 diagram procesu: krawędzie się rysują, węzły wskakują, sygnał płynie przez rdzeń
      const design = root.querySelector<HTMLElement>('[data-ha-ui="design"]');
      if (design) {
        const edges = q<SVGPathElement>(design, '[data-ha-edge]');
        const nodes = q<SVGGElement>(design, '[data-ha-node]');
        const dot = design.querySelector<SVGCircleElement>('[data-ha-dot]');
        const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.6 });
        tl.fromTo(
          nodes.slice(0, 2),
          { scale: 0.6, autoAlpha: 0 },
          { scale: 1, autoAlpha: 1, duration: 0.5, ease: easeOut, stagger: 0.12 }
        )
          .fromTo(
            edges.slice(0, 2),
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: 0.6, ease, stagger: 0.1 },
            '-=0.1'
          )
          .fromTo(
            nodes[2]!,
            { scale: 0.6, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.5, ease: easeOut },
            '-=0.2'
          )
          .fromTo(
            edges.slice(2, 4),
            { drawSVG: '0%' },
            { drawSVG: '100%', duration: 0.6, ease, stagger: 0.1 }
          )
          .fromTo(
            nodes.slice(3),
            { scale: 0.6, autoAlpha: 0 },
            { scale: 1, autoAlpha: 1, duration: 0.5, ease: easeOut, stagger: 0.12 },
            '-=0.3'
          )
          .fromTo(edges[4]!, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.4 }, '-=0.2');
        if (dot && edges[0] && edges[2]) {
          tl.fromTo(dot, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.2 })
            .to(dot, {
              motionPath: { path: edges[0], align: edges[0], alignOrigin: [0.5, 0.5] },
              duration: 0.9,
              ease: 'power1.inOut',
            })
            .to(dot, {
              motionPath: { path: edges[2], align: edges[2], alignOrigin: [0.5, 0.5] },
              duration: 0.9,
              ease: 'power1.inOut',
            })
            .to(dot, { autoAlpha: 0, duration: 0.2 })
            .to(nodes, { autoAlpha: 0, duration: 0.4, delay: 0.8 })
            .to(edges, { autoAlpha: 0, duration: 0.4 }, '<')
            .set(edges, { autoAlpha: 1 });
        }
        loops.push(tl);
      }

      // 02 aplikacja: kawałki interfejsu składają się po kolei, wykres rośnie
      const build = root.querySelector<HTMLElement>('[data-ha-ui="build"]');
      if (build) {
        const pieces = q(build, '[data-ha-piece]');
        const bars = q(build, '.ha-app-bars i');
        const rows = q(build, '.ha-app-row, .ha-app-side .ha-sk-line');
        const ring = build.querySelector('.ha-app-ring');
        const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 1 });
        tl.fromTo(
          pieces,
          { autoAlpha: 0, y: 14 },
          { autoAlpha: 1, y: 0, duration: 0.5, ease: easeOut, stagger: 0.14 }
        )
          .fromTo(rows, { scaleX: 0 }, { scaleX: 1, duration: 0.5, ease, stagger: 0.05 }, '-=0.5')
          .fromTo(
            bars,
            { scaleY: 0 },
            { scaleY: 1, duration: 0.6, ease: easeOut, stagger: 0.06 },
            '-=0.6'
          )
          .fromTo(
            ring,
            { rotate: -120, autoAlpha: 0 },
            { rotate: 0, autoAlpha: 1, duration: 0.8, ease },
            '<'
          )
          .to(pieces, { autoAlpha: 0, duration: 0.4, delay: 1.6 });
        loops.push(tl);
      }

      // 03 dokument: system przygotowuje (pasek), przejazd, człowiek zatwierdza, odkłada na stos
      const auto = root.querySelector<HTMLElement>('[data-ha-ui="auto"]');
      if (auto) {
        const doc = auto.querySelector<HTMLElement>('[data-ha-doc]');
        const progress = auto.querySelector('[data-ha-progress]');
        const link = auto.querySelector('[data-ha-link]');
        const approve = auto.querySelector<HTMLElement>('[data-ha-approve]');
        const done = q(auto, '[data-ha-done] span');
        const tl = gsap.timeline({ paused: true, repeat: -1, repeatDelay: 0.4 });
        tl.set(approve, { className: 'ha-pipe-approve' })
          .fromTo(
            doc,
            { autoAlpha: 0, x: -20 },
            { autoAlpha: 1, x: 0, duration: 0.5, ease: easeOut }
          )
          .fromTo(
            q(doc ?? auto, '.ha-sk-line'),
            { scaleX: 0 },
            { scaleX: 1, duration: 0.5, ease, stagger: 0.1 },
            '<0.1'
          )
          .fromTo(progress, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power1.inOut' })
          .fromTo(link, { scaleX: 0 }, { scaleX: 1, duration: 0.35, ease })
          .to(approve, { scale: 0.9, duration: 0.12, yoyo: true, repeat: 1, delay: 0.4 })
          .set(approve, { className: 'ha-pipe-approve is-ok' }, '<0.12')
          .to(doc, {
            x: () => auto.clientWidth * 0.55,
            y: -6,
            autoAlpha: 0,
            duration: 0.6,
            ease,
            delay: 0.3,
          })
          .fromTo(done, { autoAlpha: 0.3 }, { autoAlpha: 1, duration: 0.3, stagger: 0.06 }, '<0.3')
          .to([progress, link], { scaleX: 0, duration: 0.3 });
        loops.push(tl);
      }

      // 04 monitoring: wykres płynie, kropki statusu pulsują, kopia zapasowa się dopełnia
      const run = root.querySelector<HTMLElement>('[data-ha-ui="run"]');
      if (run) {
        const g = run.querySelector('[data-ha-chart]');
        const { line, area } = chartPaths(400, 120);
        run.querySelector('[data-ha-line-path]')?.setAttribute('d', line);
        run.querySelector('[data-ha-area]')?.setAttribute('d', area);
        const tl = gsap.timeline({ paused: true });
        tl.fromTo(g, { x: 0 }, { x: -400, duration: 8, ease: 'none', repeat: -1 }, 0)
          .fromTo(
            q(run, '[data-ha-pulse]'),
            { '--pulse': 0 },
            {
              '--pulse': 1,
              duration: 1.4,
              repeat: -1,
              stagger: 0.4,
              ease: 'power1.out',
            },
            0
          )
          .fromTo(
            q(run, '[data-ha-meter]'),
            { scaleX: 0.6 },
            {
              scaleX: 1.15,
              duration: 1.8,
              repeat: -1,
              yoyo: true,
              ease: 'sine.inOut',
              stagger: 0.5,
            },
            0
          )
          .fromTo(
            run.querySelector('[data-ha-backup]'),
            { scaleX: 0 },
            { scaleX: 1, duration: 3.2, repeat: -1, repeatDelay: 0.8, ease: 'power1.inOut' },
            0
          );
        loops.push(tl);
      }
    };

    // --- Maska x: ten sam kształt co ikona rdzenia, rośnie od niej na cały ekran ---
    const reveal = root.querySelector<HTMLElement>('[data-ha-reveal]');
    const st = { reveal: 0, glow: 0 };
    let lastClip = '';
    const renderReveal = () => {
      if (!reveal || !live) return;
      let clip: string;
      if (st.reveal <= 0) clip = 'polygon(50% 50%, 50% 50%, 50% 50%)';
      else if (st.reveal >= 1) clip = 'none';
      else {
        const w = window.innerWidth;
        const h = window.innerHeight;
        const hs = scene?.hubScreen() ?? { x: w / 2, y: h / 2, size: Math.min(w, h) * 0.4 };
        const r = st.reveal;
        const s0 = Math.max(hs.size, 40);
        const s1 = (Math.hypot(w, h) / 0.13) * 1.3;
        const size = s0 * Math.pow(s1 / s0, r);
        const k = r * r;
        clip = `path('${xPath(hs.x + (w / 2 - hs.x) * k, hs.y + (h / 2 - hs.y) * k, size)}')`;
      }
      if (clip !== lastClip) {
        reveal.style.clipPath = clip;
        lastClip = clip;
      }
      reveal.style.setProperty('--glow', st.glow.toFixed(3));
    };

    const ctx = gsap.context(() => {
      const lines = q(hero, '[data-ha-line]');
      const outerLines = q(hero, '.ha-line');
      const side = hero.querySelector('[data-ha-side]');
      const sideParts = side ? Array.from(side.children) : [];
      const ruleWrap = hero.querySelector('.ha-rule');
      const rule = hero.querySelector('[data-ha-rule]');
      const marquee = hero.querySelector('[data-ha-marquee]');
      const track = hero.querySelector<HTMLElement>('[data-ha-track]');
      const manifest = root.querySelector<HTMLElement>('[data-ha-manifest]');
      const xLines = manifest ? q<SVGLineElement>(manifest, '[data-ha-xmark] line') : [];

      // statyczny wykres też dostaje kształt
      if (reduced) {
        const run = root.querySelector<HTMLElement>('[data-ha-ui="run"]');
        if (run) {
          const { line, area } = chartPaths(400, 120);
          run.querySelector('[data-ha-line-path]')?.setAttribute('d', line);
          run.querySelector('[data-ha-area]')?.setAttribute('d', area);
        }
        return;
      }
      live = true;
      root.dataset.live = '';

      // --- Intro po załadowaniu ---
      gsap
        .timeline({ delay: 0.15 })
        .to(view, { intro: 1, duration: 2.4, ease: 'power2.out' }, 0)
        .from(lines, { yPercent: 110, duration: 1.1, ease, stagger: 0.09 }, 0.35)
        .from(
          nav,
          { autoAlpha: 0, y: -12, duration: 0.8, ease: easeOut, clearProps: 'transform' },
          0.6
        )
        .from(side, { autoAlpha: 0, y: 24, duration: 0.9, ease: easeOut }, 0.9)
        .from(rule, { scaleX: 0, duration: 1.2, ease }, 1)
        .from(marquee, { autoAlpha: 0, duration: 1 }, 1.3);

      // marquee bez końca: zestaw ma połowę szerokości ścieżki
      if (track) gsap.to(track, { xPercent: -50, duration: 40, ease: 'none', repeat: -1 });

      // --- 1. Przelot: hero się rozjeżdża, kamera leci w rdzeń, x otwiera Manifest ---
      const split = manifest
        ? SplitText.create(q(manifest, '[data-ha-words]'), { type: 'words', wordsClass: 'ha-word' })
        : null;
      gsap.set(xLines, { drawSVG: '0%' });
      const tl = gsap.timeline({ defaults: { ease: 'none' } });
      outerLines.forEach((l, i) => {
        tl.to(
          l,
          { xPercent: (i % 2 ? 1 : -1) * 70, autoAlpha: 0, duration: 0.26, ease: 'power2.in' },
          0.02 + i * 0.02
        );
      });
      tl.to(sideParts, { y: 90, autoAlpha: 0, duration: 0.18, stagger: 0.03, ease: 'power2.in' }, 0)
        .to([ruleWrap, track], { y: 70, autoAlpha: 0, duration: 0.18 }, 0.02)
        .to(dots, { autoAlpha: 0, duration: 0.2 }, 0)
        .to(view, { scroll: 1, duration: 0.52, ease: 'power1.inOut' }, 0.04)
        .to(st, { reveal: 1, duration: 0.2, ease: 'power2.in' }, 0.48)
        .to(st, { glow: 1, duration: 0.08 }, 0.48)
        .to(st, { glow: 0, duration: 0.14 }, 0.6);
      if (split) {
        tl.fromTo(
          split.words,
          { opacity: 0.08, yPercent: 30 },
          { opacity: 1, yPercent: 0, duration: 0.04, stagger: 0.24 / split.words.length },
          0.7
        );
      }
      tl.to(xLines, { drawSVG: '100%', duration: 0.04, stagger: 0.02 }, 0.95).to(
        {},
        { duration: 0.03 }
      );
      ScrollTrigger.create({
        trigger: root.querySelector('[data-ha-intro]'),
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.6,
        animation: tl,
        onUpdate: () => (dirty = true),
      });

      // --- 2. Dwa rzędy usług w przeciwne strony, przechył z prędkości scrolla ---
      const rowsWrap = root.querySelector<HTMLElement>('[data-ha-rows]');
      q(root, '[data-ha-row]').forEach((row) => {
        const dir = Number(row.dataset.haRow);
        gsap.fromTo(
          row,
          { xPercent: dir > 0 ? 0 : -33 },
          {
            xPercent: dir > 0 ? -33 : 0,
            ease: 'none',
            scrollTrigger: {
              trigger: rowsWrap,
              start: 'top bottom',
              end: 'bottom top',
              scrub: 0.4,
            },
          }
        );
      });
      const skew = rowsWrap
        ? gsap.quickTo(rowsWrap, 'skewX', { duration: 0.6, ease: 'power3' })
        : null;

      // --- 3. Jak pracujemy: stos kart, lista, pasek postępu ---
      buildLoops();
      const navSteps = q(root, '[data-ha-nav-step]');
      const stepEls = q(root, '[data-ha-step]');
      const setActive = () => {
        const line = window.innerHeight * 0.55;
        let active = 0;
        stepEls.forEach((el, i) => {
          if (el.getBoundingClientRect().top < line) active = i;
        });
        navSteps.forEach((n, j) => n.classList.toggle('is-active', j === active));
      };
      const process = root.querySelector('[data-ha-process]');
      ScrollTrigger.create({
        trigger: process,
        start: 'top bottom',
        end: 'bottom top',
        onUpdate: setActive,
        onRefresh: setActive,
      });
      gsap.fromTo(
        root.querySelector('[data-ha-steps-bar]'),
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: { trigger: process, start: 'top 55%', end: 'bottom bottom', scrub: true },
        }
      );
      stepEls.forEach((step, i) => {
        const card = step.querySelector('[data-ha-ui]');
        ScrollTrigger.create({
          trigger: card,
          start: 'top bottom',
          end: 'bottom top',
          onToggle: (self) => (self.isActive ? loops[i]?.play() : loops[i]?.pause()),
        });
        gsap.from(step, {
          y: 120,
          rotate: 2,
          ease: 'none',
          scrollTrigger: { trigger: step, start: 'top bottom', end: 'top 40%', scrub: true },
        });
        const next = stepEls[i + 1];
        if (next) {
          gsap.to(step, {
            scale: 0.9,
            '--dim': 0.6,
            ease: 'none',
            scrollTrigger: {
              trigger: next,
              start: 'top bottom',
              end: () => `top ${parseFloat(getComputedStyle(next).top) || 0}px`,
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        }
      });

      // --- 4. Finał: moduły zlatują się w sieć, litery CTA wyjeżdżają ---
      ScrollTrigger.create({
        trigger: cta,
        start: 'top bottom',
        end: 'top 10%',
        onUpdate: (self) => {
          view.gather = self.progress;
          dirty = true;
        },
        onLeaveBack: () => (view.gather = 0),
      });
      gsap.to(view, {
        outro: 1,
        ease: 'none',
        scrollTrigger: { trigger: cta, start: 'top bottom', end: 'bottom bottom', scrub: true },
      });
      if (dots) {
        gsap.fromTo(
          dots,
          { autoAlpha: 0 },
          {
            autoAlpha: 0.5,
            ease: 'none',
            immediateRender: false,
            scrollTrigger: { trigger: cta, start: 'top 60%', end: 'top top', scrub: true },
          }
        );
      }
      const ctaText = cta.querySelector<HTMLElement>('[data-ha-cta-text]');
      if (ctaText) {
        const chars = SplitText.create(ctaText, { type: 'chars,words' }).chars;
        gsap
          .timeline({
            scrollTrigger: { trigger: cta, start: 'top 70%', end: 'top 5%', scrub: 0.5 },
          })
          .from(chars, { yPercent: 120, rotate: 8, autoAlpha: 0, ease: 'none', stagger: 0.03 })
          .from(
            cta.querySelector('.ha-cta-link .ha-x'),
            { scale: 0, rotate: -270, ease: 'none' },
            '>-0.2'
          );
      }

      // --- Cała strona: pasek postępu, nav, przechył rzędów, impulsy przy szybkim scrollu ---
      gsap.to(document.querySelector('[data-ha-scrollbar]'), {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      });
      let cool = 0;
      ScrollTrigger.create({
        start: 0,
        end: 'max',
        onUpdate: (self) => {
          const v = self.getVelocity();
          const y = self.scroll();
          nav?.classList.toggle('is-hidden', self.direction === 1 && y > 160);
          nav?.classList.toggle('is-solid', y > window.innerHeight * 0.4);
          skew?.(gsap.utils.clamp(-10, 10, -v / 280));
          const now = performance.now();
          if (Math.abs(v) > 1400 && now > cool && !covered) {
            scene?.fire(1.6);
            cool = now + 220;
          }
        },
      });

      // magnes na CTA
      const link = cta.querySelector<HTMLElement>('[data-ha-cta-link]');
      if (link && fine) {
        const mx = gsap.quickTo(link, 'x', { duration: 0.6, ease: 'power3' });
        const my = gsap.quickTo(link, 'y', { duration: 0.6, ease: 'power3' });
        link.addEventListener('pointermove', (e) => {
          const r = link.getBoundingClientRect();
          mx((e.clientX - r.left - r.width / 2) * 0.12);
          my((e.clientY - r.top - r.height / 2) * 0.2);
        });
        link.addEventListener('pointerleave', () => {
          mx(0);
          my(0);
        });
      }
    }, root);

    const onResize = () => {
      scene?.resize();
      dirty = true;
    };
    window.addEventListener('resize', onResize);

    // strojenie pod ?debug
    let gui: Awaited<ReturnType<typeof loadDebug>> = null;
    void loadDebug('hero sieć systemów').then((g) => {
      if (!g || disposed) return g?.destroy();
      gui = g;
      const keys = [
        ['X', -6, 8],
        ['Y', -8, 2],
        ['ROT_X', -1, 1],
        ['ROT_Y', -2, 2],
        ['CAM_Z', 4, 20],
        ['PULSE_SPEED', 0.1, 2],
        ['PULSE_GAP_MIN', 0.05, 4],
        ['PULSE_GAP_MAX', 0.1, 6],
        ['PARALLAX_X', 0, 0.5],
        ['PARALLAX_Y', 0, 0.5],
      ] as const;
      keys.forEach(([k, a, b]) => g.add(p, k, a, b, 0.01));
    });

    cleanup = () => {
      disposed = true;
      ctx.revert();
      loops.forEach((l) => l.kill());
      gsap.ticker.remove(tick);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('resize', onResize);
      gui?.destroy();
      mouse.destroy();
      scene?.destroy();
      scene = null;
      delete root.dataset.live;
      if (reveal) reveal.style.clipPath = '';
    };
  },

  destroy() {
    cleanup?.();
    cleanup = null;
  },
};

export default HeroArcs;
