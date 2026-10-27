# ARCHITECTURE — webexe

Model jest ten sam co w oryginale: **serwerowy HTML + zachowania w JS podpinane przez `data-*`**. Webflow zastępuje Astro, a bundle agencji zastępują nasze moduły TS. Opis technik oryginału jest w `docs/reference/landonorris-analiza.md` (sekcje 4–8). Tam, gdzie oryginał robi coś słabo (sekcja 10 analizy), robimy lepiej.

## Struktura

```
src/
  pages/            index.astro · polityka-prywatnosci.astro · 404.astro · lab/[...].astro (sandbox, noindex, tylko dev)
  layouts/          Base.astro (head, fonty, nav, .gl-wrap, loader, scroll indicator)
  sections/         Hero.astro · Manifest.astro · Solutions.astro · Examples.astro · Work.astro · About.astro · Footer.astro
  components/       Button.astro · Wordmark.astro · XMark.astro · …
  styles/           tokens.css · fluid.css · base.css · utils.css · sections/*.css
  core/
    app.ts          bootstrap: fonty → scroll → moduły → GL → loader
    lifecycle.ts    rejestr modułów, init/destroy, skan [data-module]
    scroll.ts       Lenis + gsap.ticker + ScrollTrigger, lenisStart/Stop
    motion.ts       gsap.matchMedia: kontekst „full” i „reduced”
    events.ts       mała szyna zdarzeń (app:ready, app:resize, nav:open)
    css.ts          cssColor('--c-…') → THREE.Color, cssVar()
  modules/          hero.ts · split-lines.ts · btn-roll.ts · nav-theme.ts · marquee.ts · horizontal.ts · live-stats.ts …
  gl/
    Experience.ts   singleton: renderer, kamera, pętla na gsap.ticker, rejestr scen
    Sizes.ts  Time.ts  Mouse.ts (eased + pace)  Camera.ts (pixel-perfect)
    Resources.ts    LoadingManager, tekstury, (Draco/KTX2 dopiero, gdy będą potrzebne)
    DomPlane.ts     płaszczyzna zsynchronizowana z elementem [data-gl]
    params.ts       parametry scen (liczby). Kolory zawsze przez cssColor()
    debug.ts        lil-gui + stats, tylko import.meta.env.DEV i ?debug
    scenes/         BackgroundScene.ts · HeroScene.ts · XMarkScene.ts …
    shaders/        noise.glsl · bands.frag · contour.frag · composite.frag · *.vert
public/
  gl/textures/hero/   hero-a.webp · hero-b.webp · hero-alpha.webp · hero-depth.webp · hero-static.webp
  fonts/              (jeśli nie przez @fontsource)
assets-src/           oryginały i manifest generowania (nie trafia do builda)
```

## Lifecycle modułów

```ts
export interface Module {
  init(root: HTMLElement): void | Promise<void>;
  destroy(): void;
}
```

- `lifecycle.ts` skanuje `[data-module]`, importuje moduł dynamicznie (`import()`, code-splitting) i woła `init(el)`.
- Każdy moduł tworzy animacje w `const ctx = gsap.context(() => { … }, root)`, a w `destroy()` woła `ctx.revert()`. Odpina też listenery, `ResizeObserver` i `IntersectionObserver`.
- W wersji 1 nie ma routera SPA. Kontrakt `init/destroy` jest od pierwszego dnia, żeby przejścia stron (Taxi.js albo View Transitions) w F6 nie wymagały przepisywania modułów.

## API atrybutów `data-*`

| Atrybut | Znaczenie |
|---|---|
| `data-module="hero"` | inicjalizuje `modules/hero.ts` na tym elemencie |
| `data-gl="hero"` | element, z którym synchronizuje się płaszczyzna sceny GL |
| `data-gl-change-from` / `-to` / `-start` / `-end` | kolory tła GL na sekcji, jako pary tokenów, np. `piana,piana-line` → `glebia,glebia-line` |
| `data-nav-theme="light\|dark"` | motyw nawigacji, gdy sekcja jest pod navem |
| `data-sticky` | `.sticky-track` z progresem dla ScrollTriggera |
| `data-split="lines"` + `data-split-delay="0.2"` | reveal linii (SplitText, maska `clip-path`) |
| `data-btn-roll` | hover „roll” na znakach przycisku |
| `data-marquee` + `-speed` / `-direction` | marquee (pauza przez IntersectionObserver) |
| `data-hide="d\|t\|m"` | ukrywanie per breakpoint |
| `data-feature="live-stats"` | element za feature flagą (`PUBLIC_FEATURE_LIVE_STATS`) |

Nowy atrybut dopisujesz najpierw do tej tabeli, potem do kodu.

## Scroll

- Lenis z `autoRaf: false` jest napędzany przez `gsap.ticker`, wywołuje `lenis.on('scroll', ScrollTrigger.update)` i ma `gsap.ticker.lagSmoothing(0)` (snippet w analizie, sekcja 15).
- Przypięcia robimy przez `.sticky-track` (wysokość np. `200vh`) z `.sticky-item` (`position: sticky; top: 0; height: 100vh`). Progres liczy ScrollTrigger z `scrub: true`. **Nigdy `pin: true`.**
- Galeria pozioma: wysokość = `trackWidth - innerWidth + 100vh`, a paralaksa elementów idzie przez `containerAnimation`.
- Przy reduced motion Lenis się nie startuje i działa natywny scroll.

## Tekst

- SplitText 3.13+ dzieli tekst na linie z maską `clip-path` i uruchamia się dopiero po `document.fonts.ready`.
- Dostępność: najpierw sprawdź wbudowaną obsługę `aria` w SplitText (aktualne docs przez Context7). Jeśli nie wystarcza, stosujesz wzorzec z oryginału: oryginał w `.sr-only`, a animowana kopia z `aria-hidden`.

## GL

- **Jeden renderer, jeden canvas.** `.gl-wrap` ma `position: fixed; z-index: -1`. Ustawienia: `alpha: true`, `autoClear = false`, `powerPreference: 'high-performance'`.
- **Pixel ratio:** desktop `min(dpr, 1.25)`, mobile `min(dpr, 1.5)`. Mobile startuje z 1.5, a nie 2 jak w oryginale, i podnosimy to tylko, jeśli pomiar pozwoli.
- **Kamera pixel-perfect:** `fov = 2·atan(h/2/z)`, czyli 1 jednostka = 1 px CSS.
- **Każda scena renderuje do własnego `WebGLRenderTarget`**, a tekstura trafia na `DomPlane` w scenie głównej. Scena renderuje się tylko wtedy, gdy jej element jest w viewporcie (IntersectionObserver ustawia flagę `isRendering`).
- **Szum jest liczony w shaderze**, bez tekstury szumu. `noise.glsl` (simplex 3D) to jeden plik współdzielony przez hero i tło.
- Obsługujemy `webglcontextlost` / `restored`. Bez WebGL działają fallbacki statyczne (`hero-static.webp`, tło CSS).
- Parametry są w `params.ts`, a strojenie odbywa się w `lil-gui` pod `?debug`. Wartości ze strojenia przepisujesz z powrotem do `params.ts`.

## Ładowanie (lepiej niż w oryginale)

Oryginał ładuje za loaderem wszystko z całej strony (58 requestów, 1.3 MB JS). U nas:

1. **Krytyczne dla hero** są: fonty, `hero-a`, `hero-b`, `hero-alpha`, `hero-depth` i kompilacja shaderów hero. Tylko na to czeka loader.
2. **Twardy limit loadera to 2.5 s.** Jeśli assety nie zdążą, hero startuje w trybie statycznym (`hero-static.webp`) i podmienia się na GL, kiedy będzie gotowe.
3. **Pozostałe sceny** importujemy dynamicznie i ładujemy, gdy ich element jest w odległości 1.5 viewportu.
4. H1 jest w DOM-ie od pierwszego renderu, nie czeka na GL.
5. Assety mają hash albo wersję w nazwie, długi cache i są self-hostowane, łącznie z dekoderami i ewentualnym `rive.wasm`.

## Budżety (sprawdzane w F7, ale pilnowane od F1)

| Metryka | Cel |
|---|---|
| JS początkowy (gzip) | ≤ 250 KB |
| Assety krytyczne hero | ≤ 1.2 MB |
| LCP (mobile, szybkie 4G) | ≤ 2.5 s |
| CLS | 0 |
| Klatka | ≤ 16.7 ms na laptopie ze zintegrowanym GPU, czas JS hero ≤ 4 ms/klatkę |
| Lighthouse (mobile) | Performance ≥ 85, Accessibility = 100, SEO = 100 |

## Deploy

`npm run build` daje statyczny `dist/`, który trafia na VPS (rsync albo pipeline naszej platformy) i jest serwowany przez nginx lub Caddy. Kompresja brotli/gzip, `Cache-Control: immutable` dla `/_astro/*` i `/gl/*`, krótki cache dla HTML. HTTP/2 albo HTTP/3.
