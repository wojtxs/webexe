# PROGRESS — webexe

Claude aktualizuje ten plik na koniec każdej sesji. Fazy idą po kolei, a faza jest zamknięta dopiero wtedy, gdy spełnia swój warunek wyjścia.

**Aktualna faza:** F2 (spike „warstwy systemu” zbudowany, bramka D2 czeka na ocenę na żywo). F0 nadal otwarte: decyzje i assety.
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
| 2026-10-27 | Hero: wielki znak x w 3D, kursor odsłania warstwę „system” (zamiast wariantów 1 i 2 z D2), do potwierdzenia na żywo | użytkownik chce hero na poziomie landonorris.com; x to nasz najmocniejszy znak, robiony w całości w three.js, bez generowanych obrazów |
| 2026-10-27 | Hero: „rentgen aplikacji” zamiast znaku x (okno aplikacji, kursor prześwietla je do infrastruktury), do potwierdzenia na żywo | x się nie podobał: pod x był ten sam x, odsłanianie nic nie mówiło. Rentgen to wariant D2 wprost i mówi to, co H1. Odrzucone: przekrój terenu, porządek z chaosu, founderzy (blokuje D4) |
| 2026-10-27 | Hero: „rdzeń z warstw” zamiast rentgenu: wieża z 4 modułów-usług (Aplikacje, Integracje, Automatyzacje, Utrzymanie), składa się w intro, obraca za myszą, rozkłada się scrollem; do potwierdzenia na żywo | rentgen też się nie podobał; użytkownik opisał choreografię (składanie, pulsujące linie, obrót odsłaniający wnętrze, etykiety na hover, rozkład na warstwy przechodzący w usługi). Kształt: rdzeń z warstw (wybór z 3), 4 etykiety z Utrzymaniem jako podstawą |
| 2026-10-27 | Hero: „warstwy systemu” w stylu referencji użytkownika (kwadratowe płyty: szkło, płytka drukowana w szklanej skrzynce, metalowa podstawa z zielonymi paskami, smuga światła), ciemne tło Głębia, bloom; do potwierdzenia na żywo | biały rdzeń „lipny”; użytkownik pokazał obraz referencyjny (`C:\Users\wojci\OneDrive\Pulpit\fsaf.jpg`, nie w repo). Łamie DESIGN.md: hero na Głębi zamiast Piany i poświata (bloom) mimo zakazu „Laguna nie robi poświaty”; do zatwierdzenia przy akceptacji |

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
- Lekcje: `lifecycle.ts` importuje moduły przez dynamiczny import z szablonem ścieżki (`../modules/${name}.ts`), więc każdy moduł (łącznie z `hero-spike` i three.js) ląduje w `dist/` jako chunk, nawet jeśli żadna produkcyjna strona go nie używa. Nie jest ładowany, ale warto to uporządkować przed F7. Import dev-only trzeba warunkować statycznym `import.meta.env.DEV`, a nie funkcją, inaczej bundler go nie wytnie.

### 2026-10-27 — F2: alternatywy tła

- Zrobione: feedback użytkownika „poziomice w tle za organiczne”. Dodane tryby tła z tego samego pola pasm: kropki (halftone), schodki na siatce, kreskowanie. Przełącznik w `lil-gui` (Tło → tryb) i `?bg=0–3`. Opcja „pasma obiektu w siatce” kwantyzuje też maskę hero. Domyślny tryb w `params.ts` to schodki (2).
- Zostało: wybór trybu tła przez użytkownika na żywo. Jeśli tło zmieni się na stałe, trzeba zaktualizować `DESIGN.md` (motyw sygnaturowy 1 mówi o poziomicach) i spec `01-hero.md` (interakcja 6, kolory konturu).
- Lekcje: headless Edge + SwiftShader potrafi zwrócić pusty zrzut GL przy ponownym użyciu tego samego `--user-data-dir`. Każdy zrzut rób na świeżym profilu, zanim uznasz, że coś jest zepsute.

### 2026-10-27 — F2: hero ze znakiem x 3D (`/lab/hero-x`)

- Zrobione: analiza nagrania landonorris.com (`docs/refs/NN-/`, klatki wyciągnięte przez headless Edge, bez ffmpeg). Wniosek: u Lando obiekt jest ogromny i centralny, warstwa B pojawia się tylko w śladzie kursora (organiczne plamy, które zanikają), duch warstwy B (siatkowy kask) jest widoczny zawsze, tło prawie puste. Zbudowany spike: x z dwóch kapsuł (proporcje z brand boardu, rozsunięte w głębi), warstwa A szklista z gradientem Laguna, warstwa B ciemny rdzeń z siatką + klatka, duch klatki, ślad kursora ping-pong w 1/4 rozdzielczości z poszarpaną krawędzią i konturem, plama śladu na tle, intro B → A, przechył za kursorem. `?debug`, `?autopilot` (wirtualny kursor Lissajous), `?bg=0–3`. Wspólne pliki: `bg.glsl`, `ease.ts`, `support.ts`.
- Zostało: ocena na żywo przez użytkownika (60 fps na iGPU, wygląd materiału A, czytelność H1 obok znaku). Mobile niezweryfikowany na prawdziwym urządzeniu (headless przy 390 px liczy layout szerzej niż zrzut). Dotyk: tap-impuls nie zrobiony, autopilot może posłużyć jako dryf. Po akceptacji: aktualizacja `BRIEF.md` (D2), `DESIGN.md` (motywy sygnaturowe), `ASSETS.md` (assety HERO-A/B przestają być potrzebne) i specu `01-hero.md`.
- Decyzje: koncept hero = znak x 3D (użytkownik). Tryb tła domyślnie „schodki na siatce”. Nagranie referencyjne (78 MB) nie jest commitowane.
- Lekcje: ShaderMaterial z `vertexColors: true` dostaje atrybut `color`, więc gradient Laguna liczony raz na CPU działa w obu warstwach. Render targety warstw w HalfFloat + MSAA 4×, kompozycja zakłada alfę premultiplikowaną (czyszczenie do 0).

### 2026-10-27 — F2: hero „rentgen aplikacji” (`/lab/hero-rentgen`)

- Zrobione: użytkownik odrzucił znak x. Z czterech kierunków (przekrój terenu, porządek z chaosu, rentgen aplikacji, founderzy) wybrał rentgen. Spike na pipeline z hero x (render targety, ślad ping-pong, `composite.frag`, tło), nowy obiekt w `src/gl/AppStack.ts`. Warstwa A to okno aplikacji z matowych paneli rozsuniętych w głębi (menu, wykres z linią Laguna, tabela, pierścień statusu, przycisk), bez tekstu. Warstwa B to skrzynka z maszynownią w tym samym obrysie: szafa z diodami pod menu, monitoring z linią sygnału pod wykresem, baza danych pod tabelą, kopie pod statusem, rury z impulsami danych, siatka na dnie. Duch to krawędzie maszynowni i osie rur. Shadery `infra`, `pulse`, `led` + wspólny `laguna.glsl`. `?xray` (cała warstwa B), w `?debug` podgląd pace i siły śladu. Zrzuty 1440 i 390.
- Zmiana wspólna: `trail.frag` przyjmuje siłę > 1 (wartość śladu i tak ≤ 1). Rentgen liczy siłę jako sqrt(pace) × 2.4, więc spokojny ruch też odsłania dużą plamę. W hero x z liniowym pace × 1.8 normalny ruch ledwo przekraczał próg 0.5, co mogło osłabiać efekt. Hero x ma siłę obciętą do 1, więc działa po staremu.
- Zostało: ocena na żywo (60 fps na iGPU przy 3 warstwach z MSAA, czytelność). Przy wartościach ze strojenia użytkownika (OBJECT_WIDTH 0.57, OBJECT_X 0.13) okno wchodzi pod H1 na 1440, a skrzynka B jest przez głębię większa niż okno A. Do decyzji: obiekt mniejszy, H1 krótsza kolumna albo świadome nakładanie. Warstwa A ryzykuje wygląd „każdego landingu SaaS”: do rozważenia mocniejszy charakter (inne proporcje okna, mniej kart, jeden wyraźny element). Dotyk i reduced motion jak w hero x. Po akceptacji aktualizacja `BRIEF.md` (D2), `DESIGN.md`, `ASSETS.md` i `01-hero.md`.
- Decyzje: koncept hero = rentgen aplikacji (do potwierdzenia na żywo). Spike hero x zostaje w labie do porównania.
- Lekcje: tryb `--screenshot` + `--virtual-time-budget` w headless Edge przestał zwracać klatki GL (nawet dla starego spike). Działa CDP w prawdziwym czasie: Edge z `--remote-debugging-port`, WebSocket z Node 22 (bez zależności), `Page.captureScreenshot`, ruch przez `Input.dispatchMouseEvent`. SwiftShader daje ~11 fps, więc ślad testowy wymaga szybkiego ruchu i zrzutu zaraz po nim. Przycisk „kopiuj parametry” musi dawać blok TS, a nie JSON z kluczem-wrapperem: wklejka JSON-a zepsuła `params.ts`.

### 2026-10-27 — F2: hero „rdzeń z warstw” (`/lab/hero-core`)

- Zrobione: rentgen odrzucony, użytkownik podał własną choreografię hero (5 punktów). Kształt wybrany z trzech: rdzeń z warstw (pozostałe: kostka z modułów, mechanizm zębatkowy). `src/gl/CoreStack.ts`: 4 okrągłe moduły w wieży, jasna matowa obudowa z wyciętym klinem (~110°), w środku ciemna maszyneria per usługa: Aplikacje (ekrany z paskami Laguny), Integracje (piasta, rury do złączy), Automatyzacje (dwa pierścienie z zębami obracające się w przeciwne strony), Utrzymanie (12 serwerów z diodami, podstawa). Świetlne krawędzie pokryw i ścieżki na podłogach z impulsami, oś danych przez całą wieżę. `hero-core.ts`: intro (warstwy spadają od podstawy ze staggerem, potem `uPower` 0→1 włącza impulsy, diody i pierścienie), obrót za myszą, hover/tap przez raycast (warstwa się unosi, etykieta DOM obok, przerzucana na lewo albo dociskana do krawędzi, gdy brak miejsca), scroll na sticky tracku 300vh (220vh mobile): kopia znika, wieża przesuwa się do środka i rozkłada na warstwy z etykietami w rozmiarze h3. Tło: osobny pass `bg-only.frag`, bez render targetów. Wspólne helpery w `gl/geometry.ts` (AppStack też z nich korzysta). `?p=0–1` podgląd rozkładu. Etykiety dopisane do `BRIEF.md`. Zrzuty 1440 i 390 (złożony, hover, rozkład).
- Zostało: ocena na żywo. Ryzyko wyglądu: biała wieża z dysków przypomina ikonę bazy danych; dźwignie to detale obudowy (szczeliny, porty, szew Laguny), inne proporcje albo ciemniejsza obudowa. Kolejność warstw do potwierdzenia. Prawdziwe przejście w sekcję 03 dopiero po F3 (teraz greybox `TODO(treść)`). Reduced motion: statyczna klatka, etykiety widoczne stale; bez `gsap.matchMedia` (spike). Etykiety nie są dostępne z klawiatury. Po akceptacji: `DESIGN.md` (sygnatura to już nie „pasma odsłaniają system”, zasadę „sam z siebie rusza się tylko szum” trzeba poszerzyć o impulsy i pierścienie), spec `01-hero.md`, `ASSETS.md`.
- Decyzje: koncept hero = rdzeń z warstw (do potwierdzenia na żywo). Kolejność od góry: Aplikacje, Integracje, Automatyzacje, Utrzymanie. Spike x i spike rentgen zostają w labie.
- Lekcje: `ShaderMaterial` renderowany prosto na ekran potrzebuje `#include <colorspace_fragment>` (w render targecie to no-op, więc wspólne shadery mogą go mieć zawsze). Po commicie z `autocrlf` pliki mają CRLF: skrypty podmieniające tekst muszą normalizować końce linii, a `prettier --check` pada na plikach przepisanych przez checkout. Dłuższe edycje rób skryptem w pliku, nie przez `node -e '…'` w bashu: apostrofy i `\x27` psują cytowanie.

### 2026-10-27 — F2: hero „warstwy systemu” (`/lab/hero-plates`)

- Zrobione: biały rdzeń odrzucony, użytkownik pokazał obraz referencyjny (stos płyt: szklane panele, płytka w szklanej skrzynce, metalowa podstawa z zielonymi paskami, ciemne tło, smuga światła). `src/gl/PlateStack.ts`: Aplikacje (dwie szklane płyty z wytrawionym interfejsem: obrysy, paski, wykres), Integracje (szklana płyta z siecią 7 węzłów, impulsy na krawędziach), Automatyzacje (szklana skrzynka, płytka z układem centralnym, 8 mniejszymi, pinami i 36 świecącymi ścieżkami z impulsami, deterministyczny generator), Utrzymanie (ośmiokątna metalowa podstawa w dwóch stopniach, zielone paski na bokach, kątowniki na wierzchu, smuga światła `beam.frag` addytywnie). Szkło to `MeshPhysicalMaterial` z transmisją, świecenie to kolory HDR + `UnrealBloomPass` (EffectComposer z MSAA 4×, `NoToneMapping`, żeby tło zostało tokenem). Tło: Głębia + wzór pasm w `--c-glebia-line`, quad w scenie. Choreografia jak w rdzeniu (intro od podstawy, zapalanie, obrót, hover z etykietą, rozkład scrollem). Zrzuty 1440 (złożony, hover, rozkład) i 390.
- Zostało: ocena na żywo, zwłaszcza **60 fps na iGPU** (transmisja renderuje scenę drugi raz, do tego bloom; w razie problemów: niższa rozdzielczość bloomu, mniej segmentów, szkło bez transmisji na mobile). Szkło w SwiftShader wychodzi szarawe, na prawdziwym GPU może wyglądać inaczej. Po akceptacji: `DESIGN.md` (ciemne hero, poświata, nowa sygnatura), spec `01-hero.md`, `ASSETS.md`. Reduced motion i klawiatura jak w rdzeniu (spike).
- Decyzje: koncept hero = warstwy systemu w stylu referencji (do potwierdzenia na żywo). Spike'i x, rentgen i rdzeń zostają w labie.
- Lekcje: kolorów HDR (> 1) na `MeshBasicMaterial` używaj z `toneMapped: false` i bloomem z progiem ~0.8; tło musi zostać poniżej progu. Quad tła w tej samej scenie (`frustumCulled = false`, `renderOrder = -1`, bez depth) pozwala na jeden RenderPass zamiast dwóch renderów.
