# PROGRESS — webexe

Claude aktualizuje ten plik na koniec każdej sesji. Fazy idą po kolei, a faza jest zamknięta dopiero wtedy, gdy spełnia swój warunek wyjścia.

**Aktualna faza:** F2 (spike zbudowany, bramka D2 czeka na assety i ocenę na żywo). F0 nadal otwarte: decyzje i assety.
**Decyzje otwarte:** D2–D11 w `BRIEF.md`

## F0: Treść i kierunek (bez Claude Code albo tylko pomocniczo)

- [x] D1: oferta (budujemy i utrzymujemy oprogramowanie dla firm)
- [ ] Rozstrzygnięte D6, D8, D9, D10 i D11
- [ ] `assets-src/brand/webexe.svg` (x jako osobna ścieżka) oraz `x-mark.svg`
- [ ] Nagrania ekranu z landonorris.com dla każdej sekcji-wzorca, klatki kluczowe wyciągnięte do `docs/refs/NN-*/`:
      `ffmpeg -i hero.mov -vf "fps=4" docs/refs/01-hero/frame_%03d.png`, a potem wybierasz 5–8 klatek
- [ ] Assety HERO-A, B, ALPHA i DEPTH dla **obu wariantów** z `ASSETS.md` (osobna sesja generowania). Na spike F2 wystarczą wersje robocze.

**Warunek wyjścia:** BRIEF bez blokujących decyzji dla F1–F3 i robocze assety hero.

## F1: Fundament

- [x] Astro (static) + TS strict, ESLint, Prettier, skrypty `dev/build/preview/check/lint`
- [x] `tokens.css` (z DESIGN.md), `fluid.css`, `base.css`, `utils.css`
- [x] Fonty self-host + preload, subset latin-ext
- [x] `core/`: lifecycle, scroll (Lenis + ticker + ScrollTrigger), motion (matchMedia full/reduced), events, css
- [x] Strona `/lab` (tylko dev, noindex) jako sandbox na eksperymenty
- [x] Skrypt `scripts/assets.mjs` (sharp: resize + WebP)

**Warunek wyjścia:** pusta makieta z siatką skaluje się proporcjonalnie od 992 do 1920 px, scroll jest płynny na desktopie i na telefonie, przy reduced motion działa natywny scroll, `npm run build` przechodzi czysto.

## F2: Spike maski hero (w `/lab`)

- [x] Minimalny GL: renderer, kamera pixel-perfect, `DomPlane`, `Mouse` z eased + pace
- [x] Shader pasm (`bands.frag`) mieszający HERO-A i HERO-B z alfą, kursor ugina pasma tylko w ruchu
- [x] Panel `lil-gui` z parametrami ze speca 01
- [x] Przełącznik wariantów hero (1 / 2) w `lil-gui`

**Warunek wyjścia (bramka D2):** wybrany jeden wariant hero, a efekt wygląda świetnie na żywo i trzyma 60 fps. Jeśli żaden nie działa, zmieniamy koncept hero **przed** F3.

## F3: Greybox całej strony

- [ ] Wszystkie sekcje 01–07 jako statyczny HTML/CSS z prawdziwą treścią z BRIEF i szarymi blokami w miejscu wizualów
- [ ] Wysokości sticky tracków zgrubnie ustawione

**Warunek wyjścia:** przewinięcie całej strony daje dobry rytm i kolejność, a decyzje o zmianach kolejności są zapisane poniżej.

## F4: GL core + 01 Hero

- [ ] GL core docelowy (Experience, Resources, render targety, IO-visibility, fallbacki)
- [ ] `BackgroundScene` (poziomice + `data-gl-change-*`)
- [ ] 01 Hero według `docs/sections/01-hero.md`, etapy H1–H5

## F5: Sekcje

Przed każdą sekcją: Claude pisze draft speca z `_TEMPLATE.md`, ty go akceptujesz, potem build.

- [ ] 02 Manifest
- [ ] 03 Rozwiązania
- [ ] 04 Przykłady
- [ ] 05 Realizacje (zależy od D3)
- [ ] 06 Poznaj nas (zależy od D4)
- [ ] 07 Kontakt / stopka (+ X-3D)

## F6: Warstwa globalna

- [ ] Nawigacja: motyw per sekcja, menu fullscreen, `lenis.stop()` przy otwartym menu
- [ ] 00 Loader (rysowanie znaku x, limit 2.5 s, przekazanie `app:ready`)
- [ ] Przejścia stron (Taxi.js albo View Transitions), `/404`, `/polityka-prywatnosci`
- [ ] Scroll indicator, easter egg (np. inny seed pasm przy każdym wejściu)

## F7: Hardening i deploy

- [ ] Budżety z ARCHITECTURE.md, Lighthouse, trace wydajności
- [ ] A11y: alty, focus, kolejność, reduced motion, czytniki ekranu
- [ ] SEO: meta, OG, sitemap, `robots.txt`, schema.org `Organization`
- [ ] Mobile: sceny uproszczone tam, gdzie trzeba
- [ ] Kontakt według D7, analityka według D7
- [ ] Deploy na VPS, cache, kompresja, monitoring uptime

## Log decyzji

| Data | Decyzja | Dlaczego |
|---|---|---|
| 2026-10-26 | Astro + vanilla TS zamiast Next.js | model oryginału (HTML + moduły `data-*`), brak walki z lifecycle Reacta przy GSAP/GL, statyczny deploy na VPS |
| 2026-10-26 | Paleta i fonty z brand boardu, mechanika z landonorris.com | własna tożsamość, palety Lando nie kopiujemy |
| 2026-10-27 | D1: oferta to budowa i wieloletnie utrzymanie oprogramowania dla firm, forma „wy” | nowe copy; utrzymanie na własnej infrastrukturze to wyróżnik |
| 2026-10-27 | Hero: rekomendowany wariant „aplikacja → infrastruktura”, porównanie z „ręczna robota → system” w F2 | nowy H1 mówi o zostawaniu na lata, a nie o samej automatyzacji |

## Log sesji

<!-- Szablon wpisu:
### RRRR-MM-DD — <zadanie>
- Zrobione:
- Zostało:
- Decyzje:
- Lekcje (co dopisać do speca/DESIGN/CLAUDE.md):
-->

### 2026-10-27 — F1: Fundament

- Zrobione: wszystkie 7 commitów F1. Astro 7.3.8 (static) + TS strict, ESLint 10 flat config, Prettier. CSS: tokens, fluid, base, utils. Fonty: @fontsource PJS Variable + Comfortaa 700, preload w Base.astro. Core: app, lifecycle, scroll (Lenis+ST), motion (matchMedia), events (WeakMap), css (lazy three). /lab z grid overlay. scripts/assets.mjs (sharp WebP pipeline). `npm run build/check/lint` przechodzą czysto. 0 vulnerabilities.
- Zostało: F0 (D2–D11 otwarte, assety hero). Następna faza to F2: spike maski hero w /lab.
- Decyzje: Astro 5→7 (5 było za stare przy starcie projektu w 2026-10). ESLint 9→10. sharp 0.33→0.35 (CVE fix). .prettierignore na docs/ i .claude/. events.ts używa WeakMap cb→wrapper żeby off() działało poprawnie.
- Lekcje: Warto sprawdzać `npm show astro dist-tags.latest` przed pisaniem package.json — wersja w planie była przeterminowana. Prettier domyślnie sięga do docs/ i plików projektu — dodaj .prettierignore od razu w C1.

### 2026-10-27 — F2: spike maski hero (`/lab/hero`)

- Zrobione: `src/gl/` (Camera pixel-perfect, DomPlane, Mouse z eased + pace niezależnym od fps, params, debug), shadery (`noise.glsl` simplex 3D MIT, `bands.glsl` wspólne pole pasm, `bands.frag` hero, `contour.frag` poziomice tła), moduł `hero-spike`, strona `/lab/hero` (tylko dev). Intro `uReveal` na `app:ready` z easingiem z tokenu `--ease-default`. Reduced motion: statyczna klatka. Brak WebGL2: komunikat w `/lab`. Panel `lil-gui` pod `?debug` (wszystkie parametry ze speca 01, wariant, podgląd maski, przycisk „kopiuj parametry”). `?variant=2` przełącza wariant z linku. Build/check/lint czyste, `lil-gui` nie trafia do `dist/`. Zrzuty headless (Edge + SwiftShader) 1440 i 390 dla obu wariantów.
- Zostało: warunek wyjścia F2, czyli ocena na żywo na prawdziwym sprzęcie (60 fps na iGPU) i z prawdziwymi assetami HERO-A/B/ALPHA. Tekstury są zastępcze (`src/gl/placeholders.ts`, do usunięcia po dostarczeniu assetów). Poza zakresem spike'a: dotyk (tap-impuls, dryf Lissajous), paralaksa z depth (H4), render targety i Experience (F4).
- Decyzje: `lil-gui` 0.21.0 jako devDependency (zgoda użytkownika). Tekstury zastępcze zamiast czekania na assety (zgoda użytkownika). Pole pasm liczone w przestrzeni ekranu (jednostka = wysokość viewportu), żeby pasma na obiekcie i poziomice tła były tymi samymi liniami bez osobnego passu maski. `CURSOR_BOUNCE` interpretujemy jako pierścień ugięcia wokół kursora (`k + bounce·k²`), bo w analizie nie ma definicji. Kontur rysowany na obu granicach pasma (0.5 i 1.0 w `fract`).
- Lekcje: `lifecycle.ts` importuje moduły przez `import(\`../modules/${name}.ts\`)`, więc każdy moduł (łącznie z `hero-spike` i three.js) ląduje w `dist/` jako chunk, nawet jeśli żadna produkcyjna strona go nie używa. Nie jest ładowany, ale warto to uporządkować przed F7. Import dev-only trzeba warunkować statycznym `import.meta.env.DEV`, a nie funkcją, inaczej bundler go nie wytnie.
