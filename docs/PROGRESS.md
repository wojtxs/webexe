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
| 2026-10-27 | Hero: „wstęga z kodu” zamiast „Przez x”: jedna wstęga z prawdziwym kodem strony zawiązana w pętlę na Głębi, kursor ją prasuje (kod ostrzeje), scroll rozwija ją w płachtę pod Manifest; do potwierdzenia na żywo | pomysły z x nie siadały; benchmark użytkownika to całe portfolio OFF+BRAND (jeden obiekt, pustka, szlif), bez twarzy, hero ma sugerować software bez tłumaczenia. Wybór po klatkach z fal.ai (krajobraz z kodu, sygnał, wstęga). Wstęga nie potrzebuje 3D-artysty ani szkła z bloomem |
| 2026-10-28 | Hero: „Build” zamiast wstęgi: terminal `npm run build` i blueprint strony (siatka, ramki z wymiarami z DOM, nagłówek w obrysie) rysują się na żywo, linia skanu renderuje gotowe hero, kursor to rentgen odsłaniający blueprint; nagłówek wersalikami; bez WebGL; nowy token `--f-mono` (krój systemowy); do potwierdzenia na żywo | wstęga odrzucona („do wyjebania, nie pasuje do firmy software”), dwie serie par A/B do maski (monolit, papierologia, szkic, bonsai, dłoń, zegarek) też. Build pokazuje, że jesteśmy software housem, samą stroną. DOM i typografia dają jakość pod kontrolą, czego nie dawały obiekty liczone w three.js |
| 2026-10-28 | Hero: bohater po intro Build to obiekt `>_` (prompt terminala, chrom i szkło) jako zdjęcie z mapami w GL, rentgen w pasmach szumu jak twarz/kask u Lando; soczewka DOM usunięta; hero sticky 2 × vh, wejście w Manifest z blokiem kursora | użytkownikowi podobało się intro, ale hero „w ogóle nie odwzorowuje Lando”. Wybór z 4 obiektów (kursor, klawisz Enter, `>_`, procesor) po klatkach A/B z pasmami. Zdjęcie z mapami zamiast 3D liczonego na żywo, bo to daje jakość renderu (wniosek z 7 odrzuconych konceptów) |

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

### 2026-10-27 — F2: hero „Przez x” (`/lab/hero-portal`)

- Zrobione: użytkownik odrzucił wszystkie obiekty 3D (render warstw psuł się u niego: NaN z transmisji + bloom). Nowy kierunek wybrany przez użytkownika: gigantyczny wordmark (token `--t-wordmark-hero`), scroll rozsuwa litery, x rośnie wokół wierzchołka górnego klina, klin to portal w GL (`portal.frag`: ciemna paleta w klinie, jasna poza nim), klin zakrywa ekran i przechodzi w Manifest (słowa odsłaniane scrollem, akcent „latami”, x rysuje się na końcu). Zrzuty sekwencji scrolla 1440.
- Zostało: ocena na żywo, mobile 390 niesprawdzony, reduced motion tylko szkic, wpisy w DESIGN.md i spec 01-hero po akceptacji.

### 2026-10-27 — F2: hero „wstęga z kodu” (`/lab/hero-ribbon`)

- Zrobione: rozmowa o kierunku (diagnoza: wcześniejsze obiekty były ilustracją oferty, a prymitywy three.js z szkłem w czasie rzeczywistym nie dorównują wypalonym modelom OFF+BRAND). Klatki koncepcyjne z fal.ai (nano-banana-2.1, 8 sztuk, scratchpad sesji), wybrana wstęga (A3). Spike: `src/gl/Ribbon.ts` (środek wstęgi na CPU: 512 próbek, pętla trochoidalna z głębią, skręt, oddech, morph do pionowej płachty; tekstura danych dla vertex shadera; tekstura kodu z canvasu z prawdziwych źródeł spike'a, komentarze przygaszone; arkusze echa za wstęgą), `ribbon.vert` (rozpięcie paska, fala jedwabiu z normalną z pochodnych), `ribbon.frag` (światło klucza, połysk, fresnel, krawędź, gradient Laguny wzdłuż wstęgi, kod tylko na stronie do kamery). Moduł `hero-ribbon`: intro „drukowania” wstęgi na `app:ready`, prasowanie kursorem (próbki blisko wskaźnika na ekranie prostują skręt, gaszą falę, wysuwają się do kamery, kod jaśnieje; powrót powolny), scroll: kopia znika, pętla rozwija się w płachtę kodu na środku, Manifest (treść z BRIEF) wjeżdża na przygaszoną płachtę. Tło: Głębia + wzór pasm. CTA „Porozmawiajmy o projekcie” jako propozycja D9. `?debug` (wszystkie parametry), `?p=0–1`. Zrzuty 1440 (spoczynek, kursor, 3 klatki scrolla) i 390. Check, lint i build czyste.
- Zostało: ocena na żywo (wygląd materiału na prawdziwym GPU, 60 fps na iGPU: 9 przebiegów wstęgi po ~26 tys. trójkątów + 512 projekcji na CPU na klatkę, w razie potrzeby mniej echa i segmentów). Mobile: wstęga u góry, H1 lekko na ogonach, dotyk tylko przez przeciąganie. Reduced motion: statyczna klatka, bez `gsap.matchMedia`. Bez WebGL: komunikat jak w innych spike'ach. Przejście morphu ma przewężenie w połowie (resztka skrętu), do wygładzenia. Po akceptacji: `DESIGN.md` (ciemne hero, fresnel, nowa sygnatura), spec `01-hero.md`, `ASSETS.md`, decyzja D2 w `BRIEF.md`.
- Decyzje: koncept hero = wstęga z kodu (do potwierdzenia na żywo). Na wstędze prawdziwy kod strony. Brak bloomu i transmisji (problem z NaN u użytkownika). Spike'i x, rentgen, rdzeń, płyty i portal zostają w labie.
- Lekcje: przed spike'iem warto pokazać klatki z generatora obrazów: dwie rundy po 4 klatki rozstrzygnęły kierunek, którego wcześniej nie dało się wybrać z opisu. Środek wstęgi na CPU + tekstura danych (`FloatType`, `NearestFilter`, ręczna interpolacja `texelFetch`) upraszcza morph i ślad kursora, bo jedna krzywa obsługuje fizykę i render. Uwaga na `sed` po wzorcu w `params.ts`: te same klucze (`OBJECT_X`) są w kilku blokach.

### 2026-10-28 — F2: hero „Build” (`/lab/hero-build`)

- Zrobione: wstęga i 2 serie par A/B odrzucone. Klatki koncepcji Build z fal.ai (scratchpad `hero-build/`: build, hero, rentgen), użytkownik wybrał nagłówek wersalikami. Spike bez WebGL: `src/pages/lab/hero-build.astro` (warstwa gotowa + warstwa blueprint, terminal, linia skanu, SVG obrysu soczewki), `src/modules/hero-build.ts` (klon warstwy gotowej jako blueprint, dopasowanie rozmiaru H1 do najdłuższego wiersza i wysokości ekranu, etykiety z prawdziwymi wymiarami z `getBoundingClientRect` i specyfikacją fontu, intro na timeline GSAP, prawdziwy czas w „gotowe w X s”, soczewka `clip-path: path()` z 40 punktów z falowaniem i rozciąganiem wzdłuż prędkości, scroll rozsuwa wiersze na boki). Pominięcie intro: kółko, klawisz, klik. `heroBuildParams` w `params.ts`, token `--f-mono`. Zrzuty 1440 (intro, render, soczewka, scroll) i 390. Check, lint i build czyste.
- Zostało: ocena na żywo. Dotyk: soczewka tylko z `pointermove` (na telefonie brak rentgenu, do decyzji: przeciąganie albo samoczynny przelot). Reduced motion: bez intro i wobble, ale bez `gsap.matchMedia`. Wejście w Manifest: tylko rozsunięcie wierszy, przejście do zaprojektowania w F3. Intro może zastąpić loader 00 (limit 2,5 s, teraz ~3 s). CTA D9 do potwierdzenia. Po akceptacji: `DESIGN.md` (ciemne hero, mono, nowa sygnatura zamiast pasm szumu), spec `01-hero.md`, `ASSETS.md`, D2 w `BRIEF.md`.
- Decyzje: koncept hero = Build (do potwierdzenia na żywo). Blueprint to klon DOM warstwy gotowej, więc geometria zgadza się bez liczenia pozycji.
- Lekcje: pseudo-element `::before` na elemencie bez `position: absolute` staje się tekstem w linii i rozpycha klon (wiersze blueprintu były o ~50% szersze). Gdy pętla `gsap.ticker` i timeline sterują tym samym `clip-path`, pętla musi czekać na koniec intro. Insety `clip-path` przy wipe'ach liczyć w `em` z zapasem i czyścić po animacji, bo inaczej ucinają etykiety poza ramką.

### 2026-10-28 — F2: hero „Build” + obiekt `>_` w GL (`/lab/hero-build`)

- Zrobione: klatki 4 obiektów w fal.ai (scratchpad `hero-obj/`: render A, rentgen B z edycji tej samej klatki, podgląd z pasmami), wybrany `>_`. Mapy policzone lokalnie (Python, scipy): alfa A z różnicy od dopasowanego tła, alfa B z linii rentgenu, głębia z transformaty odległości od krawędzi bryły; spakowane w jedną teksturę (r, g, b). Assety w `assets-src/hero-prompt/` → `public/gl/textures/hero-prompt/` (pipeline: nowa opcja `lossless` dla map). `src/gl/PromptScene.ts` (jeden renderer: tło z poziomicami z `contour.frag`, płaszczyzna obiektu zsynchronizowana z `[data-gl="hero"]`), `src/gl/shaders/prompt.frag` (A/B przez `bandField`, paralaksa z głębi, unoszenie, front skanu, kontur granicy pasm na bryle, premultiplied w sRGB). Moduł: rentgen obiektu wyłania się z siatką blueprintu, skan renderuje DOM i obiekt naraz, tło odsłania się razem ze skanem; sticky 2 × vh (wiersze na boki, obiekt w górę i mniejszy); Manifest przez SplitText z maską linii i blokiem „▌”; fallback bez WebGL: obraz A z wtopionymi krawędziami. Zrzuty 1440 (intro, gotowe, kursor, 2 klatki scrolla, Manifest) i 390. Check, lint i build czyste.
- Zostało: ocena na żywo (ruch pasm i paralaksa na prawdziwym GPU, 60 fps). Rozdzielczość tekstur 1376 px (na retinie miękko; upscale albo render 2K, gdy wrócą kredyty fal). Maska alfa liczona heurystycznie, lewa końcówka podkreślnika lekko poszarpana. Kompozycja: nagłówek zasłania część obiektu (parametry `OBJECT_*`). Reduced motion i brak WebGL niesprawdzone na zrzutach. Dotyk: pasma bez kursora płyną same. Po akceptacji: `DESIGN.md`, spec `01-hero.md`, `ASSETS.md`, D2 w `BRIEF.md`.
- Decyzje: bohater = `>_` jako zdjęcie z mapami. Soczewka DOM odpada (jeden efekt jak u Lando). Canvas GL `position: fixed` pod całą stroną, sekcje przezroczyste.
- Lekcje: technika Lando (płaskie zdjęcie + mapy zamiast modelu) zamyka lukę jakości renderu, którą miały wszystkie obiekty liczone w three.js. Rentgen robiony edycją tej samej klatki trzyma sylwetkę na tyle, że pasma się nie rozjeżdżają. Kredyty fal mogą się skończyć w połowie zadania: maskę i głębię prostego obiektu na gładkim tle da się policzyć lokalnie. Maski linii SplitText ucinają ogonki przy `line-height: 1`, więc potrzebny jest zapas `padding-bottom` na wrapperze.
- Poprawka po ocenie użytkownika („źle to wygląda”): nagłówek leżał na obiekcie, rentgen dominował i był chaotyczny (wymiary i pseudo-kod z generatora po całym kadrze). Teraz kompozycja dzielona: nagłówek na `TITLE_WIDTH` 0.56 kontenera po lewej, obiekt po prawej bez nakładania. Rentgen zajmuje węższą część pasma (`BAND_SHARE` 0.34), więc w spoczynku dominuje render. Linie rentgenu tylko przy bryle (`XRAY_HALO`: alfa A rozszerzona 8 próbkami). Lekcja: rentgen z generatora jest ładny jako akcent w pasmie, ale nie jako większość kadru, a tekst nie może przykrywać bohatera.
- Poprawka 2 („tło nie działa jak u Lando, nachodzi na obiekt”): w pasmach rentgenu obiekt był przezroczysty, więc poziomice przechodziły przez bryłę. Teraz bryła jest pełna w obu stanach (rentgen leży na wypełnieniu w kolorze tła), a wokół obiektu jest miękka strefa w kolorze tła (alfa A rozszerzona na dwóch promieniach), więc poziomice kończą się przed krawędzią. Lekcja: tło ma być za bohaterem, a bohater nigdy nie może być przezroczysty.
- Poprawka 3 (wybór użytkownika: „obiekt cały, rentgen pod kursorem”): pasma zniknęły z bryły. `>_` w spoczynku jest zawsze całym renderem, poziomice płyną i uginają się tylko w tle, a rentgen pokazuje się w plamie pod kursorem (promień `XRAY_RADIUS` + wzrost z prędkością, krawędź postrzępiona szumem, kontur Laguny tylko na bryle). Plama gaśnie, gdy kursor wyjdzie z okna. Linie rentgenu przycięte do bryły (`XRAY_HALO` 0.01). Odchodzimy tu od Lando (u nich pasma leżą na twarzy), bo przy naszym obiekcie pasy na bryle czytały się jak naklejki. Lekcja: przy dwóch nieudanych poprawkach z rzędu trzeba zapytać o kierunek z gotowymi opcjami, zamiast zgadywać trzeci raz.
- Życie w spoczynku („nic się nie dzieje, u Lando cały czas coś się dzieje”): co ~6 s fala sygnału przechodzi ukośnie przez poziomice w tle (linie rozjaśniają się Laguną, `prompt-bg.frag` zamiast `contour.frag`) i tym samym frontem przecina `>_` pasem rentgenu z postrzępioną krawędzią i konturem. Do tego wędrujący cień na bryle (szum o niskiej częstotliwości), błysk światła po chromie co ~4,6 s i dryf paralaksy, gdy nie ma kursora. Rentgen pod kursorem bez zmian. Wszystko po intro (zegar rusza przy scan = 1), w reduced motion wyłączone. Parametry `SWEEP_*`, `PULSE_*`, `GLINT_*`, `SHADOW*`, `IDLE_DRIFT`.

### 2026-10-28 — F2: hero „HUMAN / MACHINE” (`/lab/hero-hm`)

- Zrobione: `>_` odrzucony po 4 poprawkach („słabo i nieprofesjonalnie”). Badanie na żywo w Chrome:
  - **landonorris.com**: bohater centralny, bez nagłówka w hero, duch kasku widoczny stale, poziome pasma co 1–2 s z szarym ogonem-cieniem w tle, plama pod kursorem bez obrysu, przejście scrollem w kartę z dwoma rzędami tekstu i podpisem;
  - **itsoffbrand.com**: jeden shader-obiekt, tekst zmienia kolor na kuli;
  - **Awwwards (ok. 190 Sites of the Day)**: edolus, cerebrium, why.zero, basement.studio (przełącznik HUMAN / MACHINE: cała strona jako tekstowy mirror), darkroom.engineering, igloo.inc.
- Zrobione: testy assetów w Blenderze 4.5.14 LTS portable (`E:\tools\blender-4.5.14`, pobrany za zgodą, suma SHA-256 sprawdzona). Skrypt w scratchpadzie (`blender/wx_tests.py`) robi x z kabli i x z taśmy gaffer, każdy w stanie A i B, z ziarnem i winietą. Szkło i chrom odrzucone przez użytkownika jako kicz.
- Zrobione: spike `/lab/hero-hm`, w którym bohaterem jest sama strona.
  - `src/gl/ContourScene.ts`: same poziomice na Pianie, kursor je ugina.
  - `src/modules/hero-hm.ts`: MACHINE to klon HUMAN (siatka, ramki z wymiarami z DOM, obrys nagłówków, linie bazowe, specyfikacja fontu). Jedna maska `clip-path: path()` jest sumą podścieżek o jednym kierunku (nonzero): poziome pasma w spoczynku, plama pod kursorem rosnąca z prędkością, front intro, front scrolla i przełącznik.
  - Scroll (sticky 5 ekranów): MACHINE zalewa ekran, wiersze hero wylatują, pod pełnym MACHINE HUMAN podmienia scenę, Manifest dekoduje się ScrambleText, front cofa się i odsłania Manifest, znak x rysuje się DrawSVG.
  - `heroHmParams`, `?debug`.
  - Zrzuty 1440 (intro, spoczynek z pasmem, 5 klatek scrolla) i 390. Check, lint i build czyste. Commit `faaaa58`.
- Zostało:
  - ocena na żywo (płynność `clip-path: path()` na całym ekranie przy 60 fps, czytelność);
  - przełącznik MACHINE na razie tylko zalewa ekran, prawdziwy tekstowy mirror strony to osobne zadanie;
  - reduced motion: układ statyczny bez maski, przełącznik nie działa;
  - dotyk: plama tylko z `pointermove`;
  - obrys fontu zmiennego pokazuje wewnętrzne kontury liter (wygląda jak druciak, do oceny);
  - etykiety przełącznika (Human / Machine) to `TODO(treść)`.
- Decyzje:
  - kierunek hero = HUMAN / MACHINE (zgoda użytkownika na spike);
  - asset 3D odpada, bo jakość zależy od typografii i ruchu, a nie od renderu;
  - Blender zostaje jako narzędzie do assetów pobocznych.
- **Konflikt do decyzji:** `DESIGN.md` (Zakazy) i `BRIEF.md` (Ton) zabraniają „estetyki terminala i hakera” oraz etykiet w monospace, a MACHINE na nich stoi. Jeśli koncept przejdzie, trzeba zmienić oba zapisy (za zgodą użytkownika) albo przerobić MACHINE na blueprint bez mono.
- Lekcje:
  - przed kolejną rundą poprawek obejrzeć referencję na żywo; zrzuty klatka po klatce pokazały rzeczy, których nie było w analizie (duch B widoczny stale, cień jako ogon pasma, brak nagłówka w hero);
  - `scroll:N` w `cdp-shot.mjs` to wysokości ekranu, nie piksele;
  - w `C:\Program Files\Blender Foundation` zostają resztki po odinstalowaniu, a sama obecność folderu nie znaczy, że Blender jest zainstalowany; sprawdzaj `blender.exe`.

### 2026-10-28 — F2: hero „łuki” (`/lab/hero-arcs`)

- Zrobione: HUMAN / MACHINE odrzucony („dziwne i kiczowate”). Użytkownik wybrał wzór **cerebrium.ai** i **ciemne tło**. Wymaganie: „zajebiste i nowoczesne technologicznie”, dużo animacji i scroll w GSAP, ale ma sprzedawać, bez skrajności. Cerebrium obejrzane na żywo w Chrome: hero, łuki, kursor „click and hold”, marquee logotypów, jasny panel ze sticky listą funkcji i kartami z żywym UI, sekcja z kulą.
- Zrobione: spike `/lab/hero-arcs` (commit `3104c20`).
  - `src/gl/ArcScene.ts` + `arc.vert/frag`: 5 łuków z `ExtrudeGeometry` (wycinek pierścienia wyciągnięty w głąb). Materiał matowy w gradiencie Laguny, światło w poprzek wstęgi, mgła do Głębi i ziarno. Smugi światła po przedniej krawędzi: w spoczynku co 1,4–3,2 s, po kliknięciu fala przez wszystkie łuki, przy przytrzymaniu serie, przy szybkim scrollu pojedyncza smuga. Paralaksa za kursorem, intro z łukami wyrastającymi z dołu, scroll z najazdem kamery, finał przy CTA w innym ujęciu. GL nie renderuje, gdy panel zasłania ekran.
  - Hero: nagłówek z BRIEF w lekkiej wadze z lewej na dole, lead i dwa CTA z prawej, linia i marquee usług z separatorem x (zamiast logotypów). Nawigacja: logo, pigułka z linkami, CTA w Lagunie. Kropki nad łukami jak na cerebrium.
  - Panel (ciemny raise, jasny pod `?panel=light`) wjeżdża na hero ze skalą 0,94 → 1. Manifest odsłania się słowo po słowie (SplitText, scrub), na końcu DrawSVG rysuje znak x.
  - Jak pracujemy: sticky lista 4 kroków z licznikiem, aktywny liczony z pozycji kroków. Każdy krok ma kartę z żywym mini-UI w pętli GSAP, która gra tylko na ekranie: diagram procesu z sygnałem, składana aplikacja, „system przygotowuje / człowiek zatwierdza”, monitoring z płynącym wykresem. Same szkielety, bez wymyślonych liczb i tekstów.
  - Reduced motion: statyczna klatka GL, treść widoczna od razu, mini-UI w stanie końcowym. Bez WebGL zostaje poświata z CSS.
  - `heroArcsParams`, `?debug`. Zrzuty 1440 (hero, panel, 4 karty, finał) i 390. Check, lint i build czyste.
- Zostało:
  - ocena użytkownika na żywo (płynność, kursor, smugi);
  - stan startowy pętli mini-UI: przed pierwszym odtworzeniem karta pokazuje stan końcowy i przeskakuje do początku;
  - kursor-kółko bez napisu, bo napis byłby treścią spoza BRIEF;
  - CTA końcowe to `TODO(treść)` (D9, sekcja 07);
  - nie mierzyłem fps na zintegrowanym GPU.
- Decyzje:
  - kierunek: sprawdzony wzorzec (cerebrium) w barwach webexe zamiast autorskiego gimmicku;
  - nowy token `--w-display-light: 400` dla lekkich nagłówków. **Do zatwierdzenia w DESIGN.md**, bo DESIGN mówi h1 800;
  - konflikt mono/terminal z poprzedniego wpisu jest nieaktualny, ten spike nie używa mono.
- Lekcje:
  - `node -e` w Bash na Windowsie psuje `\s` w wyrażeniach regularnych, więc podmiany parametrów robi skrypt `setp.mjs` w scratchpadzie;
  - sticky lista liczona przez `onToggle` per krok gubi stan przy skoku scrolla; pewniej liczyć aktywny krok z `getBoundingClientRect` w `onUpdate`.

### 2026-10-28 — F2: hero, paleta v2 i „sieć systemów” (`/lab/hero-arcs`)

- Zrobione: użytkownik: „jest już o wiele lepiej”, ale kolory, czcionka i łuki nie siedzą. Przysłał planszę marki: Węgiel `#15110E`, Gradient x „Bursztyn”, Kawa `#2A221C`, Kość `#F7F4F0`, Comfortaa 700 + Plus Jakarta Sans.
  - `tokens.css`: paleta v2 obok Laguny (stare spike'i działają). Hex Bursztynu (`#F59E0B` → `#EA580C`) odczytany z planszy, do potwierdzenia. Pochodne (`--c-kawa-line`, `--c-kawa-raise`, `--c-kosc-muted`, `--c-kosc-line`, `--c-ink-warm`) to moje propozycje. Nowy `--f-accent`.
  - `src/gl/NetScene.ts` + `tube.vert/frag` zamiast łuków: moduły aplikacji (RoundedBoxGeometry, ekrany z canvasu: wykres, lista, kanban, formularz, licznik; same szkielety) połączone przewodami z rdzeniem, czyli ikoną x z logo. Impulsy danych: moduł pyta, rdzeń błyska i zwykle odpowiada, moduł błyska po odebraniu. Kliknięcie puszcza zapytania ze wszystkich modułów, przytrzymanie serie. Intro: rdzeń, moduły, rysujące się przewody. `heroNetParams`.
  - Typografia: nagłówki Jakarta 800, wordmark i znaki x w Comfortaa 700, akcent w Bursztynie (Comfortaa w akcencie do porównania pod `?accent=comfortaa`).
  - Zrzuty 1440 (hero, Manifest, kroki, finał, panel jasny) i 390. Lint, check i build czyste.
- Zostało: ocena na żywo; potwierdzenie hexów Bursztynu i pochodnych; przeniesienie palety v2 do `DESIGN.md` (zastępuje Lagunę, wymaga zgody); `ArcScene` zostaje w repo nieużywany do porównania.
- Decyzje: obiekt hero = sieć modułów z rdzeniem x (kojarzy się z oprogramowaniem i integracjami, niesie znak marki); Comfortaa tylko w wordmarku i znakach x, bo obok Jakarty 800 w nagłówku wyglądała za miękko.
- Lekcje: kontrast brył na Węglu wymaga jaśniejszego korpusu (`--c-kawa-raise`) i mocniejszego światła; ciemna Kawa na Węglu znika.

### 2026-10-28 — F2: choreografia scrolla (`/lab/hero-arcs`)

- Zrobione: użytkownik: hero „spoko na ten moment”, ale scroll „bardzo nudny”, ma być extra jak na sprawdzonych stronach. Commit `feat(lab): hero — choreografia scrolla…`.
  - **Przelot w rdzeń** (wzór: landonorris „przez kask”, igloo/edolus kamera scrollem). Intro przypięte przez `position: sticky` (460svh, bez `pin`). Wiersze nagłówka rozjeżdżają się na boki, lead i marquee opadają. Kamera NetScene leci przez sieć na oś ekranu rdzenia. Maska `clip-path: path()` w kształcie tego samego x (dwie kapsuły, nonzero) startuje z rozmiaru ikony (`NetScene.hubScreen()`, projekcja) i rośnie wykładniczo na cały ekran, z błyskiem Bursztynu. Pod nią Manifest: słowa wjeżdżają, na końcu DrawSVG rysuje x.
  - **Dwa rzędy usług** (wzór: landonorris) w przeciwne strony, `skewX` z prędkości scrolla (`quickTo`).
  - **Stos kart** w Jak pracujemy: sticky z przesunięciem `--i`, poprzednia karta skaluje się do 0,9 i przygasa, nowa wjeżdża z obrotem. Pasek postępu przy liście.
  - **Finał**: moduły wracają z rozproszenia (`gather`), przewody rysują się na nowo, litery CTA wjeżdżają (SplitText chars), x się obraca, magnes na linku.
  - Nav fixed (chowa się w dół, tło po zjechaniu), pasek postępu strony. GL nie renderuje pod pełną maską.
  - Reduced motion: bez `[data-live]` wszystko w zwykłym przepływie (sprawdzone zrzutem z emulacją). Zrzuty 1440 (14 klatek) i 390 (5 klatek). Lint, check i build czyste.
- Zostało: ocena płynności na żywo (clip-path path na całym ekranie, przelot), strojenie tempa (`.ha-intro` 460svh, pozycje na osi), dotyk na mobile; akcent po SplitText dostaje gradient osobno (`.ha-word`).
- Lekcje: `node -e` z dłuższym kodem w Bash na Windowsie łamie się na cudzysłowach; większe podmiany robić plikiem `.mjs` w scratchpadzie. Animacje scroll i intro na tych samych elementach i właściwościach się gryzą; scroll animuje opakowania (`.ha-line`, dzieci `.ha-side`), intro elementy wewnętrzne.
