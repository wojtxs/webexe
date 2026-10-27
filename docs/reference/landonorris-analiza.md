# landonorris.com — analiza techniczna pod odwzorowanie

> Stan na 26.10.2026. Wszystko poniżej pochodzi z analizy na żywo w przeglądarce: DOM, computed styles, zawartość bundla JS, `performance.getEntries()`, globalne obiekty `window.*`. Pomiary przy viewporcie 2142×1237 CSS px, DPR 1.
> Strona jest dziełem agencji **OFF+BRAND** (custom kod hostowany na `lando.itsoffbrand.io`).
>
> ⚠️ Techniki są do wzięcia, ale **assetów (zdjęcia, kaski, pliki .riv, modele GLB, font Brier bez licencji) i kodu 1:1 z ich bundla nie kopiuj** — implementacja i materiały muszą być Twoje.

---

## 0. TL;DR

- **Webflow** robi za hosting, CMS i layout (klasy + HTML). **Zero Webflow Interactions** — każda animacja to custom kod.
- Cały custom kod to **jeden bundle JS ~1,32 MB** (`lando-by-OFF+BRAND.05.js`, minified, `defer`), zbudowany esbuildem i hostowany **poza Webflow**.
- W bundlu siedzą: **GSAP 3.13** (ScrollTrigger, SplitText, Flip, Observer), **Lenis 1.1.20**, **Taxi.js** (przejścia między stronami), **three.js r174** (jeden canvas, kilka scen w render targetach), **Rive** (`@rive-app/canvas-lite` 2.26.4, 8 plików `.riv`).
- **Fluid scaling**: cały layout jest w `rem`, a `html { font-size }` liczy się z szerokości viewportu, więc projekt skaluje się liniowo 1:1 z makietą 1728 px.
- **Loader** (limonkowy ekran z animacją Rive) zasłania stronę, dopóki nie wczytają się **wszystkie** assety GL i Rive. Potem wszystko chodzi płynnie, bo jest już w pamięci.
- JS podpina się do HTML-a **wyłącznie przez atrybuty `data-*`**: designer składa stronę w Webflow, a kod dokłada zachowanie. To najważniejszy wzorzec do skopiowania.

---

## 1. Stack — co jest użyte i jak ładowane

| Warstwa | Co | Wersja | Skąd / jak |
|---|---|---|---|
| Hosting, CMS, layout | Webflow (za Cloudflare, HTTP/3) | — | `cdn.prod.website-files.com` (CSS, obrazy, fonty) |
| Runtime Webflow | jQuery + webflow.js (`schunk`) | jQuery 3.5.1 | domyślne w Webflow, custom kod z nich nie korzysta |
| **Custom bundle** | cały kod agencji | `.05` | `lando.itsoffbrand.io/dev-js/lando-by-OFF+BRAND.05.js`, `defer` |
| Animacje | GSAP + ScrollTrigger + SplitText (+ Flip, Observer w bundlu) | **3.13.0** | wbundlowane (`window.gsapVersions`) |
| Smooth scroll | Lenis | **1.1.20** | wbundlowane, instancja w `window.lenis` |
| Przejścia stron | Taxi.js (`@unseenco/taxi`) | — | wbundlowane: `[data-taxi]`, `[data-taxi-view]`, eventy `NAVIGATE_IN/OUT/END` |
| 3D | three.js + GLTFLoader + DRACOLoader + KTX2Loader + RGBELoader | **r174** | wbundlowane, stan w `window.landoGL` |
| Tekst w WebGL | MSDF (uniformy w stylu `three-msdf-text-utils`) | — | atlasy `.webp` + `.json` |
| Animacje wektorowe | Rive `@rive-app/canvas-lite` | **2.26.4** | JS w bundlu, `rive.wasm` z `unpkg.com` |
| Wideo | Vimeo Player API | — | skrypt dociągany dopiero, gdy jest potrzebny |
| Analityka i marketing | GA4 (Google tag first-party), Klaviyo (newsletter) | — | inline + skrypt z domeny strony |

Hosty na starcie strony głównej: `lando.itsoffbrand.io` (35 requestów: GL i JS), `cdn.prod.website-files.com` (12), `assets.itsoffbrand.io` (7, pliki `.riv`), `unpkg.com` (1, wasm Rive), `cloudfront` (1, jQuery).

---

## 2. Architektura DOM

```
body
├─ .css-main                     ← 13 bloków <style> w Embedach (custom CSS podzielony tematycznie)
│    css-root, css-utils, css-split-type, css-lenis, css-nav, css-buttons, css-home,
│    css-on-track, css-off-track, css-partnerships, css-breakpoints, css-editmode, css-safari
├─ .nav [data-nav-wrap][data-nav-theme=dark]     fixed, z:120, pointer-events:none (dzieci włączają z powrotem)
│   ├─ logo (inline SVG) · przycisk STORE (lime) · hamburger (canvas Rive)
│   └─ .nav-menu-w [data-nav-m]                  menu fullscreen: siatka 2×2 zdjęć + wielkie linki
├─ .mob-landscape-block [data-mob-landscape]     „obróć telefon” (Rive) na mobile w poziomie
├─ .scroll-indicator                             fixed pasek po prawej, mix-blend-mode: difference
├─ .transition-w                                 fixed, z:9999 → loader + przejścia stron (canvas Rive, lime)
└─ .page-w [data-start=hidden]                   ukryte do końca ładowania
    └─ main.main-w [data-taxi]
        └─ .taxi-w [data-taxi-view][data-page=home]      ← TO podmienia Taxi przy nawigacji
            ├─ …sekcje…
            ├─ .gl-wrap        fixed, z:-1 → <canvas class="gl" data-engine="three.js r174">
            └─ .gl-background [data-gl=background]
```

**Konwencje nazw:** `s` = section, `c` = container, `-w` = wrapper, `is-*` = modyfikator (np. `s is-horizontal-track`). Styl idzie przez klasy, zachowanie przez `data-*`.

**Ważny detal:** `.gl-wrap` siedzi **wewnątrz** widoku Taxi. Renderer three.js żyje w JS przez całą sesję, a przy zmianie strony jego `<canvas>` jest przepinany do `.gl-wrap` nowego widoku (`renderer.add()` robi `appendChild`). Zasoby GL zostają w pamięci.

**Dostępność tekstu:** każdy animowany tekst istnieje dwa razy: wersja dla czytników ekranu (`.screen-reader`) i podzielona na linie/znaki kopia z `aria-hidden` (na stronie jest 434 elementów `aria-hidden`). Dlatego `get_page_text` zwraca każdy napis podwójnie.

---

## 3. Sekcje strony głównej (kolejność, wysokości, co się dzieje)

Wysokość dokumentu to ~18 300 px przy vh = 1237.

| # | Sekcja (klasa) | Wysokość | Co widać i co się dzieje | Technologia |
|---|---|---|---|---|
| 1 | **Hero + „Message from Lando”** `.sticky-track.home-hero` | 2×vh (sticky 100vh) | Jasne tło `#F8F8F3` z liniami konturowymi. Zdjęcie twarzy, a przez „pasma” szumu prześwituje 3D kask; kursor ugina pasma. Przy scrollu scena GL odjeżdża w górę, tło przechodzi w dark green, pojawia się ramka ze zdjęciem i dwa rzędy wielkiego tekstu przesuwające się w przeciwne strony. W lewym dolnym rogu karta „Next race” z konturem toru. | three.js (headScene + carouselScene, tekst MSDF), ScrollTrigger scrub, Rive (circuits) |
| 2 | **Manifest** `section.s` | ~1,1vh | Wielki uppercase Mona Sans, wybrane słowa w Brier w kolorze lime (REDEFINING, WINS, LEGACY). Reveal linia po linii, na końcu blok-kursor „▌”. | SplitText (linie z maską `clip-path`), `data-anim-high` |
| 3 | **Galeria pozioma** `.s.is-horizontal-track` | ~3,5vh | Sticky + przesuw w poziomie. Rozrzucone zdjęcia różnej wielkości, podpisy-eyebrow (miejsce, rok), cytaty, podpis rysujący się scrollem, licznik. Tło przechodzi z dark green w jasne. | CSS sticky + `translateX` scrub, `containerAnimation` (paralaksa), Rive (signature), `data-gl-change-*` |
| 4 | **ON TRACK / OFF TRACK** `.sticky-track.is-home-otot` | 2×vh | Dwa ogromne linki-hasła, „ON”/„OFF” pisane odręcznie (Rive), zdjęcia z kaskiem rozjeżdżają się na boki (split). | sticky + scrub, Rive (phrases) |
| 5 | **Helmets Hall of Fame** `.s-group.bg-black` | ~2,3vh | Czarne tło, siatka 4 kolumn z pionowym przesunięciem co drugiej kolumny, karty ze ściętym rogiem (maska SVG), PNG kasków + nazwa i rok. 16 pozycji z CMS. Pod spodem CTA. | Webflow CMS, maska SVG |
| 6 | **Store / „World Drivers’ Champion”** `.s.is-lando-exe` | ~1vh | Kolaż zdjęć produktów + nagłówek Mona/Brier + CTA, element „visor” u góry sekcji. | CSS, ScrollTrigger |
| 7 | **Partners & Campaigns** `.s.is-home-collabs` | ~0,85vh | Nagłówek, odręczne „Collabs” w lime (Rive) na wierzchu, marquee logotypów. | Rive (phrases), CSS marquee |
| 8 | **What’s up on socials** `.s.is-callout-socials` | ~1vh | Wachlarz kart (rotacje) z zaokrąglonymi rogami; na hover karta odpala wideo. | Vimeo Player (lazy), placeholder `<img>` |
| 9 | **Footer** `.s.is-footer` | ~1vh | Ciemnozielony panel z wycięciem u góry (`.footer-layout-clip` z `mask-image: ln4-footer-mask-desktop.svg`), zdjęcie Lando w kasku (zwykły WebP, nie GL), podpis Rive nad hasłem Mona+Brier, linki, marquee logotypów SVG, limonkowy gradient tła. | `mask-image` SVG, Rive (signature), marquee |

**Podstrony:** `/on-track` (sticky kask 3D w złotym wariancie z boku, wielkie liczby „49 PODIUMS”, countdown do wyścigu z odręcznym „Race Day”, kalendarz z **3D modelem toru** świecącym na lime i harmonogramem sesji, highlights z CMS), `/off-track`, `/calendar`, `/partnerships`, `/legal/*`, 404 z obracającym się kaskiem.

**Menu:** fullscreen dark green, po lewej siatka 2×2 odbarwionych zdjęć, po prawej wielkie uppercase linki. Aktywny link jest przekreślony limonkową linią. Na dole social i business enquiries.

---

## 4. WebGL — jak to jest zbudowane

### 4.1 Architektura („Experience” + sceny w render targetach)

- **Jeden renderer, jeden canvas** `position: fixed; z-index: -1` pod całym DOM-em. Sekcje mają przezroczyste tło tam, gdzie ma być widać GL.
- Ustawienia renderera: `powerPreference: "high-performance"`, `alpha: true`, `precision: "lowp"`, `autoClear = false`.
- **Pixel ratio**: desktop (>768 px) `min(dpr, 1.25)`, mobile `min(dpr, 2)`. Na desktopie świadomie zbijają rozdzielczość.
- **Kamera „pixel-perfect”**: `fov = 2·atan(height / 2 / z)`, więc 1 jednostka w świecie = 1 px CSS. Dzięki temu meshe da się ustawiać wprost z `getBoundingClientRect()`.
- **Każda scena renderuje się do własnego `WebGLRenderTarget`**, a jej tekstura trafia na płaszczyznę („renderPlane”) w scenie głównej. Pozycja i rozmiar płaszczyzny = prostokąt elementu DOM z `data-gl="…"`. Przy scrollu jest aktualizowana ScrollTriggerem (`scrub`, `invalidateOnRefresh`).
- Pętla: `update()` wszystkich scen → każda robi `renderPipeline()` (render do swojego RT) → na koniec `setRenderTarget(null)` i render sceny głównej.
- Flaga `isRendering` wyłącza sceny, których nie widać.
- Pętlę napędza `gsap.ticker` (ten sam co Lenis).
- Obsługiwane są `webglcontextlost`/`restored` i fallback „No WebGL support”.
- Parametry scen (kolory, prędkości, intensywności) są w `window.landoGL.params`. W bundlu jest panel GUI i Stats do strojenia oraz `toggleGLColorDebug()`.

Sceny: `headScene` (hero), `backgroundScene` (kontury w tle), `carouselScene` (tekst MSDF + zdjęcie), `tracksScene` (tory), `helmetScrollScene` (sticky kask obracany scrollem na /on-track), `notFoundScene` (404).

### 4.2 Hero — twarz + kask odsłaniany szumem (headScene)

Parametry na produkcji:

```
REVEAL_DURATION 1.1 · SCALE 1 · SPEED 0.1 · DISTORT_SCALE 1 · DISTORT_INTENSITY 0.5
NOISE_DETAIL 3 · CURSOR_INTENSITY 0.15 · CURSOR_SCALE 3 · CURSOR_BOUNCE -0.75 · REVEAL_SIZE 25
COLOR_BACKGROUND #F8F8F3 · COLOR_FOREGROUND #D2FF00 · COLOR_OUTLINE #CBCBB9
COLOR_CURSOR_FOREGROUND #CFD2C5 · COLOR_CURSOR_BACKGROUND #E8E8DF · COLOR_FILTER #50593F
```

Jak to działa:

1. **Twarz to płaskie zdjęcie z mapami** zamiast modelu 3D: `diffuse`, `depth`, `alpha`, `normal`, `roughness` i kilka wariantów `shadow` (wszystko `.webp`). Depth i normal dają pseudo-3D: prześwietlenie i lekką paralaksę (2.5D).
2. **Kask to prawdziwy model** `helmet-21.glb` (Draco) z teksturami PBR: BaseColor w wariantach malowania (gold, disco), Normal, Roughness, Metallic. Szybka jest osobnym materiałem (Glass BaseColor/Normal/Roughness/Metallic, `transmission`). Oświetlenie z HDRI `studio_small_08_1k` w trzech wariantach: light, faded, dark.
3. **Maska odsłonięcia** to osobny pass do RT, pełnoekranowy quad z **simplex noise**:
   - współrzędne są lekko deformowane drugim, wolniejszym szumem (`DISTORT_*`);
   - `fract(noise * NOISE_DETAIL)` daje powtarzalne **pasma** (jak poziomice na mapie), a `step(0.5, …)` zamienia je w binarną maskę: tu twarz, tu kask;
   - **kursor**: wygładzona pozycja myszy plus „pace” (wygładzona prędkość ruchu) dodawane do współrzędnych szumu, więc pasma uginają się wokół kursora tylko wtedy, gdy mysz się rusza;
   - `uReveal` i `REVEAL_SIZE` robią intro: maska wjeżdża od dołu po zakończeniu loadera.
   - **Ten sam szum rysuje linie konturowe w tle** (`OUTLINE: true`). To spina cały wizual.
4. Kask ma warianty `Lime / Dark / Grid / Disco / Google`. Disco używa osobnego `disco-02.glb`, matcapa, maski i tekstury lens flare.
5. Przy scrollu płaszczyzna sceny przesuwa się o wysokość viewportu (`bounds.top: 0 → -height`, scrub) i oddaje miejsce sekcji „Message”.

### 4.3 Tło z konturami (backgroundScene)

- Pełnoekranowe linie „topograficzne” z tego samego szumu. Kolory: `COLOR_BACKGROUND #282c20`, `COLOR_FOREGROUND #363B25`, kursor `#b2c73a`.
- **Kolory zmieniają się per sekcja deklaratywnie**: `data-gl-change-track`, `data-gl-change-from="dark-green, dark-green-tint-1"`, `data-gl-change-to="white, dark-green-tint-1-low"` (pary: tło, linie), opcjonalnie `data-gl-change-trigger-start="top bottom"`. Kod tweenuje uniformy kolorów ScrollTriggerem.

### 4.4 Tekst w WebGL (carouselScene)

- Dwa rzędy: `TEXT_TOP` w Brier (`#b2c73a`) i `TEXT_BOTTOM` w Mona Sans (`#dde1d2`), jadące w przeciwne strony za i przed zdjęciem.
- Fonty jako **MSDF**: `Brier-Bold-msdf.json` + `Brier-Bold-02.webp`, `MonaSans-Bold-msdf.json` + `MonaSans-Bold-02.webp`. Uniformy `uStrokeColor`, `uStrokeOutsetWidth`, `uStrokeInsetWidth` wskazują na `three-msdf-text-utils`.
- Tekst siedzi w GL, bo musi się wtapiać w scenę: deformacja, maskowanie, ten sam pipeline co reszta.

### 4.5 Tory (tracksScene)

- `tracks-06-test.glb`: wszystkie tory w jednym pliku, materiał matcap (`lando__matcap-02.webp`), limonkowy glow. W bundlu jest UnrealBloom, prawdopodobnie właśnie do tego.
- `TRANSITION_DURATION: 2` (przejście między torami), `AUTOROTATE_SPEED: 0.2`, `CURRENT` = aktualny tor z CMS.

### 4.6 Wszystkie assety GL

Bazowy URL: `lando.itsoffbrand.io/gl/`

| Typ | Pliki |
|---|---|
| Dekodery | `draco/` (`draco_wasm_wrapper.js`, `draco_decoder.wasm`), `basis/` (transcoder KTX2) |
| Modele | `models/helmet-21.glb`, `models/disco-02.glb`, `models/tracks/tracks-06-test.glb`, `models/sotd.glb` |
| HDRI | `hdri/studio_small_08_1k--light.hdr`, `--faded.hdr`, `--dark.hdr` |
| Fonty MSDF | `fonts/Brier-Bold-msdf.json` + `Brier-Bold-02.webp`, `fonts/MonaSans-Bold-msdf.json` + `MonaSans-Bold-02.webp` |
| Twarz | `textures/head/webp/{diffuse,depth,alpha,normal,roughness,shadow,shadow-softer-edit,shadow-to-zip-edit}.webp` |
| Kask | `textures/helmet/webp/{gold,disco}/Norris_Helmet_mat_BaseColor.webp`, `…_Normal`, `…_Roughness`, `…_Metallic` |
| Szybka | `textures/glass/webp/Norris_Glass_mat_{BaseColor,Normal,Roughness,Metallic}.webp` |
| Disco | `textures/helmet/webp/disco/{disco_matcap-01,disco_mask-01,disco_lens-flare-15}.webp` |
| Inne | `textures/plastic/plastic__matcap-02.webp`, `textures/noise/noise-03.webp`, `textures/tracks/lando__matcap-02.webp`, `textures/not-found/webp/not-found-alpha-6.webp` |

Wszystkie tekstury to **WebP**, a nie KTX2: loader KTX2 jest w kodzie, ale na produkcji ładują się `.webp`.

---

## 5. Rive — mikroanimacje i „ręczne” napisy

**Runtime:** `@rive-app/canvas-lite` 2.26.4 (lżejsza wersja bez Rive Text). `rive.wasm` ładuje się z `unpkg.com`.

**Pliki** (`assets.itsoffbrand.io/lando/rive/` + `lando.itsoffbrand.io/rive/`):

| Plik | Do czego |
|---|---|
| `page-transition.riv` | loader i przejścia stron (limonkowy ekran, animowane logo LN4) |
| `ln4.riv` | logo w nawigacji |
| `signature.riv` | odręczny podpis rysowany scrollem lub odtwarzany raz |
| `phrases.riv` | odręczne słowa: „ON”, „OFF”, „Collabs”, „Race Day” |
| `circuits.riv` | kontury torów (input z nazwą toru, np. `mexico-city`) |
| `reef.riv` | ikonki i wzory „reef” z kasku, obiekt w menu |
| `btn-ui.riv` | strzałki w przyciskach (hover) |
| `mob-landscape.riv` | komunikat „obróć telefon” |

**Deklaratywny system, czyli całość sterowana atrybutami na `<canvas>`:**

```html
<canvas
  data-rive-object
  data-rive-file="signature"
  data-rive-artboard="signature"
  data-rive-state-machine="signature_scroll"
  data-rive-input="color_lime"
  data-rive-scrolltrigger-target=".hero-rive-tracker"
  data-rive-scrolltrigger-start="top center"
  data-rive-scrolltrigger-end="bottom 80%"
  data-rive-fit="contain"></canvas>
```

Warianty zachowań:

- `data-rive-scrolltrigger-start/end/target`: input liczbowy maszyny stanów dostaje progress scrolla (scrub). Tak rysuje się podpis.
- `data-rive-scrolltrigger` + `start`: animacja odpala się raz przy wejściu w viewport.
- `data-rive-hover`: input boolean ustawiany na hover rodzica (strzałki w buttonach).
- `data-rive-instant-play`: start od razu.
- `data-rive-input-track="mexico-city"`, `data-rive-input-color`, `data-rive-input-weight`: dane z CMS przekazywane do inputów.
- `data-rive-color-input`: przełączanie koloru przez booleany (`color_lime`, `color_green-off-white-2`…).

Na starcie strony preloadowane są **wszystkie** pliki `.riv` (`window.loadedRiveFiles`). Potem leci event `allriveloaded` i dopiero wtedy startują animacje hero (z retry co 500 ms, maksymalnie 10 s).

---

## 6. Scroll i animacje

### 6.1 Lenis (konfiguracja z produkcji)

```
lerp: 0.1 · smoothWheel: true · syncTouch: true · syncTouchLerp: 0.075
touchInertiaMultiplier: 35 · touchMultiplier: 1.25 · wheelMultiplier: 1
autoRaf: false · anchors: false · overscroll: true
```

Integracja jest standardowa: `lenis.on('scroll', ScrollTrigger.update)`, `gsap.ticker.add(t => lenis.raf(t * 1000))`, `gsap.ticker.lagSmoothing(0)`. Globalne helpery: `window.lenisStart()` i `window.lenisStop()` (np. przy otwartym menu).

### 6.2 Sticky zamiast pinowania

**Nigdzie nie ma `pin: true` z ScrollTriggera.** Wszystkie przypięte sekcje to **CSS `position: sticky`**:

- `.sticky-track` to wysoki wrapper (np. 200vh), a `.sticky-item` w środku ma `position: sticky; top: 0; height: 100vh`;
- progres sekcji liczy ScrollTrigger z `scrub: true` (29 tweenów scrub w bundlu).

Zalety: zero „skoków” przy pinowaniu, brak pin-spacerów, lepsza współpraca z Lenis i z przejściami stron.

### 6.3 Galeria pozioma

- `[data-horizontal-section]` > `.horizontal-pin-sticky` (sticky) > `.horizontal-track`.
- Wysokość sekcji = `trackWidth - innerWidth + 100vh`, a track dostaje `x` od 0 do `-(trackWidth - innerWidth)` w scrubie.
- Zdjęcia w środku (`.image.is-horizontal-scroll`) mają własną paralaksę przez `containerAnimation` (`start: "left right"`, `end: "right left"`, przesunięcie około 4rem).
- Teksty (`.text-eyebrow`, `.horizontal-item-text`) mają osobne reveal'e.

### 6.4 Tekst

- **GSAP SplitText 3.13**. Od 3.13 wszystkie pluginy GSAP są darmowe. Podział na linie i znaki, a każda `.line` ma maskę `clip-path: polygon(0 -2%, 0 94%, 100% 94%, 100% -2%)`, więc tekst wjeżdża spod niewidocznej krawędzi. Podział odpala się dopiero po `document.fonts` ready.
- **Klon dla czytnika ekranu**: oryginał zostaje dostępny, animowana kopia ma `aria-hidden`.
- `data-anim-high="right, lime, 200"` (kierunek, kolor, opóźnienie w ms): „block reveal” linii. Do każdej `.line` dokładany jest `div.high-line-reveal` w danym kolorze, który przejeżdża przez linię, a tekst odsłania się za nim przez `clip-path: inset(0 100% 0 0) → inset(0)`.
- Słowa akcentowe w `<strong>` w sekcjach „impact” dostają Brier w kolorze lime-off (`8.25rem`, `line-height: 83%`).

### 6.5 Przyciski: hover „roll” bez duplikowania DOM

`[data-anim="text-hover"]`, `data-theme="lime"`. Tekst jest podzielony na znaki, a kopia tekstu powstaje przez `text-shadow: 0 var(--text-offset) currentColor`, gdzie offset = font-size. Na hover znaki jadą w górę o offset ze staggerem, więc pod spodem wjeżdża „cień”. Wynik to efekt toczenia bez drugiego spana.

### 6.6 Pozostałe

- **Nav theme**: sekcje mają `data-nav-theme-target="dark|light"`, a ScrollTrigger przełącza kolor nawigacji, gdy sekcja przejdzie pod nav.
- **Marquee**: JS-owy (`data-marquee-direction`, `-speed` 30–40, `-duplicate`, `-scroll-direction-target`, czyli odwraca się z kierunkiem scrolla, pauza przez IntersectionObserver) plus CSS-owy dla logotypów (`data-css-marquee`).
- **Scroll indicator**: fixed pasek 6 px po prawej, `mix-blend-mode: difference`, czytelny na każdym tle.
- **Domyślny easing i czas**: `--cubic-default: cubic-bezier(0.65, 0.05, 0, 1)` (szybki start, długie wyhamowanie), `--duration-default: 0.75s`.
- **Responsywne ukrywanie**: `data-hide="d|t|ml|m"` (desktop, tablet, mobile landscape, mobile).

---

## 7. Loader i przejścia między stronami

**Loader:**

1. HTML ładuje się z `.page-w[data-start="hidden"]`, a `.transition-w` (fixed, z-index 9999) jest zakryte na limonkowo (`#D2FF00`) i gra `page-transition.riv` z logo.
2. Równolegle (od ~0,7 s) idą fetch'e: 3× GLB, 2× HDR, 2× JSON MSDF, ~25× WebP tekstur, 8× `.riv`, dekoder Draco (WASM). LoadingManager three.js plus licznik Rive.
3. Gdy wszystko jest gotowe, overlay znika, maska hero robi reveal (`uReveal`) i startują animacje hero.

**Przejścia (Taxi.js):**

- Kliknięcie linku → Taxi pobiera HTML nowej strony (z prefetchem) → `NAVIGATE_OUT`: overlay Rive wjeżdża, Lenis się zatrzymuje.
- Podmiana `.taxi-w`. Każdy moduł ma **cleanup**: kill ScrollTriggerów, revert SplitText, destroy instancji Rive, odpięcie listenerów Lenis.
- `NAVIGATE_IN`: init modułów dla nowego widoku (`data-page`), przepięcie canvasu GL, przełączenie scen, `ScrollTrigger.refresh()`, scroll na górę.
- `NAVIGATE_END`: overlay zjeżdża.
- Zasada: **każdy moduł ma `init(view)` i `destroy()`**. Bez tego SPA-transitions szybko zaczynają cieknąć.

---

## 8. Assety i sposób ładowania

**Pierwsze wejście na stronę główną:** 58 requestów.

| Typ | Ile | Uwagi |
|---|---|---|
| webp | 27 | tekstury GL + obrazy nad foldem |
| riv | 8 | wszystkie animacje Rive od razu |
| js | 5 | bundle, Webflow, jQuery, GTM |
| svg | 4 | logo, podpis, maski (`helm-mask-fill`, `footer-mask-desktop`) wołane z CSS |
| glb | 3 | kask, disco, tory (tory i tekstura 404 ładują się już na stronie głównej) |
| hdr / json / wasm / woff2 | 2 / 2 / 2 / 2 | — |
| css | 1 | jeden współdzielony plik Webflow, przez Early Hints |

**Pozostałe pomiary:**

- HTML: **219 KB** po rozpakowaniu, **44 KB** w transferze, HTTP/3. Dużo inline CSS w Embedach i zdublowanego tekstu.
- First Contentful Paint: ~280 ms (u mnie, z ciepłym cache, więc traktuj orientacyjnie).

**Fonty:**

- `Mona Sans Variable` (osie `wdth` i `wght`, 200–900), `<link rel="preload" as="font">`, `font-display: swap`. Darmowy, open source od GitHuba (licencja OFL).
- `Brier` Bold (display, szeryfowy, wysoki kontrast), ładowany z CSS. Krój komercyjny, sprawdź licencję albo dobierz zamiennik.

**Obrazy:**

- Webflow generuje warianty `-p-500`, `-p-800`… z `srcset`/`sizes`, format WebP.
- 131 ze 133 obrazów ma `loading="lazy"`. Kaski to PNG z przezroczystością.
- Maski kształtów (karty kasków, panel stopki) to SVG wstawione jako `mask-image` w CSS.

**Wideo:**

- W DOM-ie nie ma ani jednego `<video>`. Karty mają `[data-video-stream][data-stream-url="<vimeo id>"]` z `<img data-video-stream-placeholder>`.
- Skrypt Vimeo Player API jest wstrzykiwany dopiero przy pierwszym użyciu (hover lub autoplay po wejściu w viewport).

**Upfront vs lazy:** wszystko, co GL i Rive, ładuje się **od razu za loaderem**, nawet assety innych podstron. Obrazy w DOM-ie ładują się leniwie. Zysk: płynność po wejściu i przy przejściach. Koszt: ciężki pierwszy load.

---

## 9. Design system

### 9.1 Fluid scaling (klucz do „pixel-perfect 1:1 z makietą”)

```
--design-width: 1728   (szerokość makiety)     --design-unit: 16 (bazowy font w makiecie)
--min-width: 992px     --max-width: 1920px     (zakres, w którym skaluje się desktop)
--fluid-container = clamp(min-width, 100vw, max-width)
html { font-size: fluid-container / design-width * design-unit }
```

Wszystko (paddingi, fonty, gridy) jest w `rem`, więc cała strona skaluje się proporcjonalnie do szerokości okna. Przy 1920+ px `html` ma 17,78 px.

Breakpointy nadpisują zakres:

| Zakres | min–max | Zmiana |
|---|---|---|
| Tablet | 768–991 px | `--design-unit: 20` |
| Mobile landscape | 480–767 px | — |
| Mobile portrait | 320–479 px | `--design-unit: 48` |

### 9.2 Kolory

| Token | Hex | Rola |
|---|---|---|
| `--color--lime` | `#D2FF00` | główny akcent, CTA, loader |
| `--color--lime-off` | `#B2C73A` | akcent na ciemnym tle, słowa w Brier |
| `--color--dark-green` | `#282C20` | ciemne tło (menu, sekcje, footer) |
| `--color--dark-green-tint-1` | `#3B3C38` | linie konturów na ciemnym |
| `--color--dark-green-tint-2` | `#535450` | — |
| `--color--white` | `#F4F4ED` | „biel” (ciepła, złamana) |
| `--color--cream` | `#EFEFE5` | — |
| `--color--green-off-white-1` | `#DDE1D2` | tekst na ciemnym |
| `--color--green-off-white-2` | `#B4B8A5` | — |
| `--color--grey-1` / `--color--green-light` | `#EBEEE0` | — |
| `--color--grey-2` | `#C8CBBD` | — |
| `--color--grey-on-track` | `#B9BBAD` | akcenty na on-track |
| `--color--black` | `#111112` | sekcja kasków |
| `--color--orange` | `#FF6B00` | McLaren papaya, sporadycznie |
| hero bg (GL) | `#F8F8F3` | — |

Paleta to praktycznie **3 kolory**: złamana biel, butelkowa zieleń i neonowy lime, plus odcienie szarozielone. Żadnej czystej bieli ani czerni w tłach.

### 9.3 Typografia

- **Mona Sans** (bold, uppercase) do nagłówków, **Brier** do pojedynczych słów-akcentów, **Rive** do odręcznych napisów i podpisu.
- Nagłówki: `letter-spacing` ≈ −0,047em (−2,22 px przy 47 px), `line-height` ≈ 0,89.
- Tokeny rozmiarów (rem, przy bazie 16 px dla 1728):

```
--text--impact 7.9375 · --text--h2 4.5 · --text--h1 4 · --text--med 2.76 · --text--h3 2
--text--btn-footer 1.875 · --text--reg 1.6 · --text--h4 1.5 · --text--btn-nav 1.25
--text--h5 1.2 · --text--h6 1 · --text--btn-primary 1 · --text--eyebrow 0.578
```

### 9.4 Spacing, promienie, layout

```
--padding--mini 1 · --padding--small 2 · --padding--med 3 · --padding--large 4 · --padding--xlarge 5   (rem)
--gap 1.25rem · --padding--container 1.25rem · --container-padding 2rem
--radius--small 1rem · --radius--med 3rem · --radius--large 6.25rem
--section-padding: calc(3.5rem + var(--gap) * 2) · --grid-col: 25.4375rem
```

---

## 10. Co zrobili słabo (zrób lepiej)

- **115 ze 133 obrazów nie ma `alt`.**
- **Brak obsługi `prefers-reduced-motion`.** W bundlu nie znalazłem ani jednego odwołania.
- **Monolit 1,3 MB JS** i wszystkie assety GL (także z innych podstron) na starcie. U siebie zrób code-splitting per strona/scena i lazy-load sceny, gdy jej element zbliża się do viewportu.
- jQuery (z Webflow) jest ładowany, choć nikt z niego nie korzysta.
- `rive.wasm` z publicznego CDN (unpkg). Lepiej self-hostować.
- Plik `tracks-06-test.glb` na produkcji 🙂. Wersjonuj assety (hash w nazwie) i ustaw długie cache.

---

## 11. Rekomendowany stack do odwzorowania

**Opcja A, najbliższa oryginałowi (polecam):** **Astro** (statyczny HTML, content collections jako CMS) + **vanilla TypeScript** z modułami podpinanymi przez `data-*`. To architektura 1:1 z oryginałem (serwerowy HTML + JS-owe zachowania), tylko bez Webflow.

**Opcja B:** **Next.js** (App Router). Canvas i Experience trzymasz w root layoucie (przetrwa nawigację), przejścia robisz własnym routerem albo View Transitions. Da się, ale React tu przeszkadza: lifecycle animacji GSAP/Rive/GL wymaga więcej pilnowania.

**Opcja C:** Webflow + własny bundle (Vite) hostowany na Twoim VPS/CDN, czyli dokładnie ich model.

**Paczki (npm):**

```
three · gsap (ScrollTrigger, SplitText) · lenis · @unseenco/taxi
@rive-app/canvas-lite (albo @rive-app/canvas, jeśli potrzebujesz Rive Text)
three-msdf-text-utils · lil-gui (debug) · @gltf-transform/cli (pipeline modeli)
```

**Proponowana struktura:**

```
src/
  styles/        tokens.css · fluid.css · base.css · utils.css · sections/*.css
  core/          scroll.ts (Lenis+GSAP) · router.ts (Taxi) · loader.ts · lifecycle.ts · events.ts
  gl/
    Experience.ts  Sizes.ts  Time.ts  Mouse.ts (eased + pace)  Renderer.ts  Camera.ts
    Resources.ts (LoadingManager, Draco, KTX2, RGBE)  sources.ts  DomPlane.ts
    scenes/        BackgroundScene.ts  HeroScene.ts  TextScene.ts  ObjectScrollScene.ts  NotFoundScene.ts
    shaders/       contour.frag  composite.frag  …
  rive/          RiveManager.ts (deklaratywny init z data-*)
  anim/          splitText.ts  highlight.ts  buttons.ts  marquee.ts  horizontal.ts  navTheme.ts  sticky.ts
  pages/         index.astro · … · 404.astro
public/
  gl/{models,textures,hdri,fonts,draco,basis}/   rive/   fonts/
```

---

## 12. Pipeline własnych assetów

- **Modele 3D:** Blender → glTF → `npx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp`. Dekoder Draco hostuj u siebie (`/gl/draco/`).
- **HDRI:** oryginał używa `studio_small_08` z Poly Haven (CC0) w 1k. Możesz wziąć to samo albo inne studio. Zrób sobie warianty light/dark (ekspozycja).
- **Zdjęcie 2.5D (jak twarz w hero):** wycięcie tła → alpha, mapa głębi (np. Depth Anything) → `depth.webp`, normal map wyliczona z depth → `normal.webp`, plus miękki cień jako osobna tekstura.
- **MSDF fonty:** `msdf-bmfont-xml` (albo `msdf-atlas-gen`) z Twojego fontu → `.json` + atlas `.png`, potem konwersja do `.webp`.
- **Rive:** edytor rive.app. Do scrolla daj w maszynie stanów input liczbowy (np. `progress` 0–100), do hovera boolean, do kolorów booleany. Odręczne napisy rysujesz jako ścieżki z animacją trim path.
- **Obrazy:** AVIF/WebP, warianty szerokości, `srcset` + `sizes`, `loading="lazy"` poza hero.
- **Fonty:** self-host woff2 + preload głównego, `font-display: swap`.

---

## 13. Plan budowy sekcja po sekcji (pod Claude Code)

Każdy krok kończy się czymś, co da się obejrzeć i dopieścić, zanim pójdziesz dalej.

1. **Fundament.** Projekt, tokeny (kolory, typografia, spacing), fluid scaling, reset, fonty z preloadem, `data-hide`. ✅ gdy pusta makieta skaluje się proporcjonalnie od 992 do 1920 px.
2. **Scroll.** Lenis + GSAP ticker + ScrollTrigger, scroll indicator, helper `sticky-track`. ✅ gdy płynny scroll działa na desktopie i telefonie.
3. **Router i lifecycle.** Taxi, overlay przejścia (najpierw zwykły CSS, Rive później), rejestr modułów `init/destroy`. ✅ gdy przy przejściach między dwiema stronami nic nie cieknie (sprawdź liczbę ScrollTriggerów).
4. **Rdzeń GL.** Experience (Sizes, Time, Mouse, Renderer, Camera pixel-perfect), Resources z progresem → loader, `DomPlane` (sync z `data-gl`), render target per scena, canvas przepinany między widokami.
5. **Tło z konturami.** Shader szumu i konturów + zmiana kolorów per sekcja przez `data-gl-change-*`.
6. **Nawigacja.** Fixed nav, przełączanie motywu, menu fullscreen, hamburger (Rive), `lenis.stop()` przy otwartym menu.
7. **Hero.** Sticky 200vh. **Zacznij od wersji 2D:** dwa obrazy mieszane maską z szumu + kursor (80% efektu bez 3D). Potem podmień drugi obraz na obiekt 3D (GLB + HDRI) i dodaj intro `uReveal`.
8. **System tekstu.** SplitText reveal (linie z `clip-path`), `data-anim-high`, przyciski z efektem roll, klony dla czytników ekranu.
9. **Manifest** (wielki tekst z akcentami w drugim foncie).
10. **Galeria pozioma** (sticky + `translateX`, paralaksa przez `containerAnimation`).
11. **Sekcja split** (odpowiednik ON/OFF TRACK).
12. **Siatka** (odpowiednik kasków) z kartami ze ściętym rogiem (maska SVG), dane z kolekcji.
13. **Sekcja feature** (odpowiednik Store).
14. **Marquee** klientów lub technologii.
15. **Karty social** z wideo na hover (lazy Vimeo/YouTube albo własny MP4/HLS).
16. **Footer** z panelem wyciętym maską SVG, podpisem Rive i marquee logotypów.
17. **Podstrony + 404** ze sceną GL.
18. **Szlif.** Mobile (DPR, uproszczone sceny albo fallback bez GL, blok „obróć telefon”), `prefers-reduced-motion`, alty, budżet wagowy, Lighthouse.

---

## 14. Mapowanie na Twoją stronę (software / automatyzacje / strony www): propozycje

- **Hero:** zamiast twarza→kask zrób **„powierzchnia → to, co pod spodem”**: np. zdjęcie produktu lub zespołu, a w pasmach szumu prześwituje wireframe/kod/schemat systemu (3D albo shader). Ta sama maska konturowa, inna treść.
- **Message from Lando** → wiadomość od founderów / manifest firmy z tekstem MSDF w GL.
- **Galeria pozioma** → oś czasu realizacji (rok, klient, zdjęcie, cytat klienta).
- **ON / OFF TRACK** → dwa filary oferty, np. „SOFTWARE / WEB” albo „BUILD / AUTOMATE”, z odręcznym słowem w Rive.
- **Hall of Fame** → portfolio w staggered gridzie z kartami ze ściętym rogiem.
- **Store / WDC** → wyróżniony case study albo własny produkt (np. platforma deployowa).
- **Partners** → marquee klientów i technologii.
- **Footer** → mocne hasło + CTA „Porozmawiajmy”, obiekt GL (Twoje logo w 3D) wsuwany scrollem.
- **Charakter wizualny do przejęcia:** 3 kolory (złamana biel, ciemny kolor marki, jeden neon), wielki uppercase sans + słowa-akcenty w kontrastowym serifie + odręczne napisy, poziomice w tle jako motyw spinający całość.

---

## 15. Snippety startowe (własne implementacje technik)

### Fluid scaling

```css
:root {
  --min-width: 992px;  --max-width: 1920px;
  --design-width: 1728; --design-unit: 16;
}
@media (max-width: 991px) { :root { --min-width: 768px; --max-width: 991px; --design-unit: 20; } }
@media (max-width: 767px) { :root { --min-width: 480px; --max-width: 767px; } }
@media (max-width: 479px) { :root { --min-width: 320px; --max-width: 479px; /* dobierz unit/width pod makietę mobile */ } }

html {
  font-size: calc(clamp(var(--min-width), 100vw, var(--max-width)) / var(--design-width) * var(--design-unit));
}
```

### Lenis + GSAP

```ts
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

export const lenis = new Lenis({
  lerp: 0.1, syncTouch: true, syncTouchLerp: 0.075, touchMultiplier: 1.25, autoRaf: false,
});
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((t) => lenis.raf(t * 1000));
gsap.ticker.lagSmoothing(0);
// syncTouch: przetestuj na iOS; jeśli coś skacze, wyłącz na touch.
```

### Sticky track + progres

```html
<div class="sticky-track" data-sticky style="height:200vh">
  <div class="sticky-item" style="position:sticky; top:0; height:100vh"> … </div>
</div>
```

```ts
document.querySelectorAll<HTMLElement>('[data-sticky]').forEach((track) => {
  gsap.timeline({ scrollTrigger: { trigger: track, start: 'top top', end: 'bottom bottom', scrub: true } })
    .to(track.querySelector('.thing'), { yPercent: -50, ease: 'none' });
});
```

### Kamera pixel-perfect + płaszczyzna zsynchronizowana z DOM

```ts
const z = 600;
camera.position.z = z;
const fitFov = () => {
  camera.aspect = innerWidth / innerHeight;
  camera.fov = (2 * Math.atan(innerHeight / 2 / z) * 180) / Math.PI;
  camera.updateProjectionMatrix();
};

function syncPlane(mesh: THREE.Mesh, el: HTMLElement) {
  const r = el.getBoundingClientRect();
  mesh.scale.set(r.width, r.height, 1);
  mesh.position.set(r.left - innerWidth / 2 + r.width / 2, -(r.top - innerHeight / 2 + r.height / 2), 0);
}

// w pętli: każda scena → swój render target → tekstura na płaszczyźnie w scenie głównej
for (const s of scenes) if (s.visible) {
  renderer.setRenderTarget(s.rt);
  renderer.render(s.scene, s.camera);
  s.plane.material.uniforms.tScene.value = s.rt.texture;
}
renderer.setRenderTarget(null);
renderer.render(mainScene, camera);
```

### Maska / kontury z szumu (szkic shadera)

```glsl
// + snoise(vec3) z dowolnej implementacji simplex 3D (np. Ashima / glsl-noise)
uniform float uTime, uAspect, uPace, uDetail;  // uPace = wygładzona prędkość myszy (0..1)
uniform vec2  uMouse;                          // -1..1
varying vec2  vUv;

void main() {
  vec2 uv = vUv; uv.x *= uAspect;
  vec2 m = uMouse * 0.5 + 0.5; m.x *= uAspect;

  float cursor = clamp(1.0 - distance(m, uv) * 3.0, 0.0, 1.0) * uPace;   // wpływ kursora
  float warp   = snoise(vec3(uv, uTime * 0.01)) * 0.5;                    // wolna deformacja

  float n     = 0.5 + 0.5 * snoise(vec3(uv + cursor * 0.15 + warp * 0.5, uTime * 0.1));
  float bands = fract(n * uDetail);                                       // „poziomice”
  float mask  = step(0.5, bands);                                         // 0 = warstwa A, 1 = warstwa B
  float line  = 1.0 - smoothstep(0.0, fwidth(bands) * 1.5, abs(bands - 0.5)); // kontur

  gl_FragColor = vec4(mask, bands, line, 1.0);  // zapisz do RT, użyj w kompozycji hero i tła
}
```

### Rive sterowany atrybutami

```ts
import { Rive, Layout, Fit } from '@rive-app/canvas-lite';

export function initRive(root: ParentNode = document) {
  root.querySelectorAll<HTMLCanvasElement>('canvas[data-rive-file]').forEach((canvas) => {
    const d = canvas.dataset;
    const sm = d.riveStateMachine!;
    const r = new Rive({
      src: `/rive/${d.riveFile}.riv`, canvas, artboard: d.riveArtboard, stateMachines: sm,
      layout: new Layout({ fit: Fit.Contain }), autoplay: true,
      onLoad: () => {
        r.resizeDrawingSurfaceToCanvas();
        const input = r.stateMachineInputs(sm).find((i) => i.name === d.riveInput);
        // data-rive-scrolltrigger-start → dataset.riveScrolltriggerStart itd.
        if (input && d.riveScrolltriggerStart) {
          ScrollTrigger.create({
            trigger: d.riveScrolltriggerTarget ? document.querySelector(d.riveScrolltriggerTarget)! : canvas,
            start: d.riveScrolltriggerStart, end: d.riveScrolltriggerEnd || 'bottom top', scrub: true,
            onUpdate: (s) => { input.value = s.progress * 100; },
          });
        }
      },
    });
    registerCleanup(() => r.cleanup());   // ← Twój lifecycle z routera
  });
}
```

### Przycisk z efektem roll (text-shadow)

```css
.btn-text        { --offset: 1em; display: inline-block; overflow: hidden; line-height: 1; }
.btn-text .char  { display: inline-block; text-shadow: 0 var(--offset) currentColor;
                   transition: transform .6s cubic-bezier(.65,.05,0,1);
                   transition-delay: calc(var(--i) * 12ms); }
.btn:hover .btn-text .char { transform: translateY(calc(var(--offset) * -1)); }
```

(Znaki dzielisz SplitTextem i ustawiasz `--i` każdemu znakowi.)
