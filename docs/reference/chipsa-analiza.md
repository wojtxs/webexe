# chipsa.design — analiza techniczna pod odwzorowanie

> Stan na 30.10.2026. Wszystko poniżej pochodzi z analizy na żywo w przeglądarce: DOM, computed styles, zawartość chunków JS i arkusza CSS, `performance.getEntries()`, globalne obiekty `window.*`, nagłówki GLB.
> **Pomiary:** viewport 1182×697 (tu strona działa w trybie „tablet”, bo jej próg desktopu to 1200 px), desktop odtworzony w iframe **1600×943** (ta sama proporcja ekranu), mobile w iframe **390×844** (bez emulacji dotyku), DPR 1.
> **Zastrzeżenie:** w tej przeglądarce `requestAnimationFrame` był dławiony do 2–4 klatek/s, więc FPS-ów nie mierzyłem, a czasy animacji pochodzą z parametrów w kodzie (tweeny, CSS), nie z nagrań klatek.
> Strona jest dziełem samego studia **Chipsa** (Rosja, od 2009 r., ~30 osób wg treści strony), wersje EN/RU, assety na `cdn-vk.chipsa.ru`.
> **Rola tej referencji w projekcie:** jakość wizualna i ruch (założenie, bo w briefie została wartość przykładowa).
>
> ⚠️ Techniki są do wzięcia, ale **assetów (modele kamienia i tkaniny, rendery 3D, wideo, sekwencje klatek, fonty Pangram Pangram bez licencji) i kodu 1:1 z ich bundla nie kopiuj** — implementacja i materiały muszą być Twoje.

---

## 0. TL;DR

- **Next.js 13.5 (Pages Router) + React 18.2.** Zero GSAP. Ruch robi **Framer Motion 11.18** (warianty, `useScroll`, `useVelocity`, `AnimatePresence`), smooth scroll **Lenis 1.0.42** (tylko na desktopie), 3D **three.js r163 przez react-three-fiber + drei**.
- **WebGL punktowo, nie wszędzie:** jeden globalny canvas `fixed` nad treścią. Rysuje (1) obiekt w hero, który **zmienia się po kliknięciu** (pękający kamień ↔ tkanina wgniatana kursorem) i (2) **karty portfolio** z przejściem obraz→wideo w shaderze i ściskaniem kart przy szybkim scrollu.
- **Język ruchu jest bardzo spójny:** UI 0,25–0,4 s na `easeOutCubic`, reveale tekstu 1,2 s na `easeInOutQuart`, przejścia stron ~2,2 s na `easeInOutCubic`. To 80% „premium feelingu”.
- **Mikro-UX, który robi robotę:** kursor z etykietą („CLICK ME”, „LEARN MORE”), menu wyrastające z przycisku, mapa rozdziałów z kropek, **koniec strony = odliczanie 10 s do następnej strony (przytrzymanie przyspiesza)**.
- **Słabo z wagą:** strona główna pobiera przed interakcją **≥250 requestów i ≥12 MB** (po rozpakowaniu), w tym **7,3 MB modeli GLB**. Ignoruje `prefers-reduced-motion`, a części obrazów brakuje `alt`.

---

## 1. Stack — co jest użyte i jak ładowane

| Warstwa | Co | Wersja | Skąd / jak |
|---|---|---|---|
| Framework | Next.js, **Pages Router** (`__NEXT_DATA__`, `_buildManifest`) | 13.5.11 | `cdn-vk.chipsa.ru/_next/static/…`, skrypty `defer` |
| UI | React + react-dom | 18.2.0 | chunk `framework` (138 KB) |
| Animacje | **Framer Motion** (`MotionValue`, `animate`, warianty, `AnimatePresence`) | 11.18.2 | w `_app` (wspólny chunk 802 KB) |
| Smooth scroll | Lenis | 1.0.42 | w `_app`, instancja `window._lenis`, montowana **tylko gdy urządzenie = desktop** |
| 3D | three.js + **@react-three/fiber** + **drei** (GLTF/Draco/Meshopt/KTX2 loadery) + zustand | three r163 | chunki: three 686 KB, r3f 128 KB, loadery 79 KB |
| Wideo | `<video>` z kilkoma `<source>` (AV1 w MP4 → zwykłe MP4), lazy przez **vanilla-lazyload** (`lazy entered loaded`) | — | `cdn-vk.chipsa.ru/videos/…`, `/storage/media/…` |
| Streaming | hls.js (+ stats.js w tym samym chunku) | 1.6.16 | chunk 528 KB ładowany już na stronie głównej |
| Obrazy | własny loader Next: `/nextapi/optimize?src=…&w=…&q=85`, AVIF/WebP | — | wykrywanie AVIF inline skryptem → klasa `avif` na `<html>` |
| Typografia tekstów | Typograf (twarde spacje, myślniki) | 7.7.0 | w `_app` |
| Monitoring / analityka | Rollbar (błędy), Yandex Metrika, VK OpenAPI | Rollbar 3.1.0 | async |

**Czego nie ma:** GSAP, ScrollTrigger, SplitText, Rive, Lottie, Barba/Taxi. Wszystko to zastępuje Framer Motion + kilka własnych komponentów.

---

## 2. Architektura DOM i stałe elementy UI

```
#__next
├─ .global-canvas-wrapper        fixed, z-index 1, pointer-events:none → JEDEN <canvas> three.js r163 (szer. = vw − scrollbar)
├─ header.header                 fixed, z 5, pointer-events:none (dzieci włączają): logo (canvas z sekwencją klatek) + linki nav
├─ button.discuss-project-cta    fixed, prawy górny róg: biała karta 200×98, avatar z zieloną kropką „online”, otwiera czat
├─ .page-default-toner           fixed, czarna nakładka do przyciemniania strony przy przejściu
├─ main.main > .page > .page-inner
│    ├─ .navigation              mapa rozdziałów (otwierana przyciskiem z kropkami, lewy dolny róg)
│    ├─ section… (data-navigation-section="cases" itd.)
│    └─ .next-page-transitioner  „następna strona” z odliczaniem (zamiast klasycznej stopki)
├─ .menu-btn-wrapper             fixed, lewa krawędź w połowie wysokości, mix-blend-mode: difference
├─ .menu                         panel menu wyrastający z przycisku
├─ canvas.page-curtain           fixed, 2D canvas: kurtyna przejść między stronami
├─ .chat.app-chat                fixed, prawy dolny róg: ikona koperty (canvas z sekwencją klatek)
└─ .cursor                       fixed, z 9999, mix-blend-mode: difference: własny kursor
```

**Układ „czterech rogów”:** logo (lewy górny), CTA „Discuss project” (prawy górny), nawigacja rozdziałów (lewy dolny), czat (prawy dolny), a menu na środku lewej krawędzi. Treść żyje w środkowym pasie.

**Warstwy GL vs DOM:** canvas ma `z-index: 1` i leży **nad** zwykłą treścią (dlatego kamień z hero przesłania tekst manifestu), a lista kart ma `position: relative; z-index: 1` i jest później w DOM, więc tytuły i tagi kart leżą **nad** obrazem z GL. Na kartach z GL oryginalne `<img>`/`<video>` dostają `display: none` (klasa `webgl-initialized`). Zdarzenia (hover, klik) idą przez DOM, bo canvas nie łapie myszy.

**Odporność:** sceny GL są owinięte w `WebglErrorBoundary`, a karty mają `fallbackUI` ze zwykłym obrazem, więc brak WebGL nie psuje strony.

---

## 3. Sekcje strony głównej (desktop 1600×943, dokument ~14 030 px ≈ 14,9 vh)

| # | Sekcja (klasa) | Wysokość | Co widać i co się dzieje | Technologia |
|---|---|---|---|---|
| 1 | **Hero + manifest** `section.first-section` | 1986 px (~2,1 vh), tło `#F4F4F4` | Nagłówek H1 („WE EVOKE EMOTIONS THROUGH AESTHETICS, WEBGL AND 3D”) od 4. kolumny siatki + podtytuł 36 px. Pod spodem obiekt 3D na całą szerokość: kamień w kształcie znaku nieskończoności (logo). Na start **odłamki zlatują się w bryłę**. Kursor pokazuje „CLICK ME”: klik rozsypuje kamień i wstawia **tkaninę, którą kursor wgniata**. Przy scrollu obiekt **oddala się** (maleje do ~1/3) i wjeżdża drugi blok: gigantyczny manifest `.h1` 100 px w 4 liniach, akapit i przycisk „WATCH SHOWREEL”. | r3f, animacje z GLB, własny shader, Framer `useScroll` |
| 2 | **Best works** `#cases` | 3755 px (~4 vh) | Tytuł z reveal'em słów. 5 kart **888×690** (14 z 24 kolumn, proporcja 1,288), odstęp ~10 px + margines. Na karcie: tytuł, kolorowy badge statusu (IN PROGRESS / CONCEPT / ONLINE), tagi typu (SITES, CGI…), narożna wstęga z nagrodą. **Hover: obraz „przesuwa się” w wideo** (shader, 1,3 s). **Szybki scroll ściska karty.** Link „ALL CASES” jest sticky na wysokości połowy ekranu po prawej. | GL na kartach (desktop), Framer `useVelocity` |
| 3 | **Major services** `#services` | 943 px (1 vh) | 3 kolumny na pełną wysokość: SITES / INTERFACES / GRAPHICS. **Hover rozszerza kolumnę** (`flex-grow` 1→3), w tle wjeżdża pętla wideo z abstrakcją 3D, pojawia się miniatura wideo i opis. Kursor: „LEARN MORE”. | CSS `flex-grow` + `opacity`, `<video>` AV1 |
| 4 | **Achievements** `#recognitions` | 2605 px (~2,8 vh), tło czarne | Rozrzucone rendery 3D logotypów nagród (CSSDA, Behance, Awwwards, FWA, zwykłe PNG) w sticky liście z licznikami. Potem **ciemna karta wjeżdża na nie** z wielkimi liczbami (lata pracy, liczba osób) i rozmytą poświatą. | 2× `position: sticky` (lista + „sticky-bottom” karta) |
| 5 | **Key clients** `#clients` | 1745 px (~1,85 vh), tło `#F4F4F4` | Sticky tytuł, sticky akapit na dole (słowa pojawiają się po kolei). Na środku **sticky stos 5 renderów 3D liter** (np. litery z marek klientów), a przez środek przewija się lista nazw klientów. Aktywna nazwa dostaje podświetlenie, a obraz za nią się podmienia. | sticky + scroll-spy (`is-active`) |
| 6 | **Latest news** `#publications` | 2052 px (~2,2 vh) | Wąskie karty publikacji (~370 px) w jednej kolumnie: obraz, avatar autora, tytuł, hashtag. | DOM |
| 7 | **Next page transitioner** | 943 px (1 vh), tło `#111` | Pełnoekranowe wideo, „LEARN MORE / ABOUT THE STUDIO” i **licznik 10→0 w kółku z obwódką SVG**. Po dojściu do zera strona sama przechodzi na `/about`. | własny komponent, sekcja 7.3 |

**Nie ma klasycznej stopki.** Kontakt jest w menu, w CTA „Discuss project” i w czacie. Koniec każdej strony to wejście do następnej.

**Menu:** przycisk „MENU” (99×48, tło `rgba(141,141,141,.2)`, promień 8 px, `mix-blend-mode: difference`) **rozrasta się w ciemny panel** 691 px × (100vh − 40 px), kolor `#121212`, promień 8 px. W środku wycentrowane linki uppercase (Right Grotesk 34 px) w trzech grupach: strony główne, usługi, kariera/kontakt.

**Mapa rozdziałów:** przycisk z kropkami (lewy dolny róg) otwiera panel „( CHOOSE CHAPTER )”. Kropki **wylatują z przycisku** (`translate` + `scale(1.4)`) na pozycje „konstelacji”, a każda prowadzi do sekcji (`data-target="#cases"` itd.). Bieżący rozdział jest pogrubiony.

---

## 4. Podstrony

### 4.1 `/about`

Dokument ~15 840 px.

| Sekcja | Wysokość | Co się dzieje |
|---|---|---|
| Hero | 943 | Pętla wideo (dziana żółta rura + niebieski kryształ) na jasnym tle, tytuł „ABOUT THE STUDIO” na środku, podtytuł u dołu. |
| Wideo studia | 894 | Pełnoszerokie wideo z życia studia, przyciemnione. |
| Why us | 3021 | Wycentrowana lista dużych haseł uppercase z krótkimi opisami. **Aktywne hasło jest czarne, pozostałe szare** (podświetlenie zależne od scrolla). |
| Our life | **6300** (~6,7 vh) | Sticky scena: hasło na środku **wypełnia się literami z szarego na czarny** w rytm scrolla, a zdjęcia zespołu **wylatują z paska miniatur na dole** na rozrzucone pozycje z lekkimi rotacjami. Etykieta sekcji jest sticky w lewym górnym rogu. |
| Awards | 2931, tło `#F1F1F1` | Nagrody pogrupowane wg platform. |
| Clients about us | 805 | Opinie klientów (slider przeciągany myszą, kursor w stanie „drag”). |
| Next page | 943 | → `/career`. |

### 4.2 `/works/[slug]` (case study, np. `/works/chillbase`)

Dokument ~15 030 px.

- **Stałe nakładki:** „× BACK TO ALL CASES” na środku u góry, przycisk udostępniania (blend `difference`) w prawym górnym rogu, scroll-spy.
- **Hero (943):** pełnoekranowe tło z mediami case'u (`sibling-cases-bg`: obraz + wideo z crossfade), tytuł **100 px** na środku, biały przycisk „SEE IT LIVE ↗” u dołu, „↓” w lewym dolnym rogu.
- **Treść:** kolumna **894 px** (14/24 kolumn, ta sama co karty na home). U góry tytuł + chipy typów po prawej, opis wyrównany do prawej. Dalej „konstruktor” bloków z CMS: `constructor-image-block`, `constructor-video-block` i `constructor-block--titled` (nagłówek + akapit, np. „GOAL”). Media to głównie mockupy na ciemnym tle `#111`, bloki mają 500–1370 px wysokości.
- **Formularz kontaktowy** (982 px) przed końcem.
- **Next case** z tłem następnego projektu i odliczaniem (sekcja 7.3).

---

## 5. WebGL — jak to jest zbudowane

### 5.1 Architektura

- **Jeden canvas r3f** w `.global-canvas-wrapper` (fixed, cały viewport, `pointer-events: none`).
- Komponenty z DOM wstrzykują swoje sceny do tego canvasu: karty używają `tunnel` (`T.In`) i komponentu z propem `track={ref}`, a to najpewniej drei `<View track>`. Każda karta to osobny viewport zsynchronizowany z prostokątem elementu DOM.
- `KeyVisualModels` (hero) to grupa z prostą maszyną stanów (`add`, `next`, `isAnimating`): klik przełącza między zarejestrowanymi obiektami.
- **Gotowość aplikacji = zamontowana scena** (komponent `Ready` ustawia flagę po rozwiązaniu `Suspense`, czyli po wczytaniu GLB). Na tę flagę czeka preloader.

### 5.2 Hero: kamień ↔ tkanina

**Kamień** (`stone-5-opt.glb`, desktop):

- 24 meshe-odłamki, materiał `StoneAllIn_4k`, `envMap` z `envMapIntensity: 2`.
- W pliku są klipy **`Intro` i `Outro`** (po 72 kanały, czyli pozycja/rotacja/skala × 24 odłamki). Rozpad i składanie są więc **wypieczone w Blenderze**, a nie liczone w runtime.
- **Wejście:** `Intro` grane do przodu, odłamki zlatują się w bryłę. **Wyjście:** to samo `Intro` puszczone **wstecz** (`timeScale = −1`, start 0,5 s przed końcem klipu). Odłamki wracają do pozycji spoczynkowej tweenem 0,2 s.

**Tkanina** (`cloth-opt.glb`):

- Jeden mesh `Retopo_FABRICK001_Baked`. Oświetlenie jest **wypieczone w teksturę** (emissiveMap z GLB idzie jako zwykła tekstura do `ShaderMaterial`), więc nie ma świateł w runtime, a wygląda jak render.
- **Vertex shader „szczypania”:** odległość wierzchołka od punktu trafienia kursora → `smoothstep(0, brushSize)` → przesunięcie wzdłuż kierunku od kursora, plus falowanie 4D simplex noise. Parametry z produkcji:

```
elasticity 8 · damping 0.72 · brushSize 2.6 · brushStrength 0.8 · smoothness 0.65
wobblePositionFrequency 0.05 · positionFrequency 0.01 · strength 6.4 · wobbleStrength 1.7 · forceMov 2
mobileTrace: 1 na mobile (osobna logika śladu dotyku)
```

- Uwaga: mimo komentarza „simulate physics” w shaderze **nie ma stanu między klatkami**. `elasticity`/`damping` tylko kształtują deformację w każdej klatce od zera. Wrażenie sprężystości daje wygładzona pozycja kursora po stronie JS.

**Przejście tkaniny (czasy z kodu):**

```
wejście:  alpha 0→1 0.2s · rotacja (x 1, y 0.2)→0 0.8s easeOutQuart · scaleY/Z 0→1 0.8s · scaleX 0→1 0.4s
wyjście:  alpha 1→0 0.3s (delay 0.1, easeInQuart) · rotacja →(0.2, 1) 0.4s
          scaleY/Z →0 0.6s easeInOutQuart · scaleX →0 0.6s cubic-bezier(.46,-.53,.3,1.04)  ← „zamach” przed zniknięciem
```

**Kursor i scroll:**

- **Tilt:** grupa obraca się za kursorem, `rotation = lerp(rotation, clamp(0.1 · pointer, ±0.2), 0.1)`. W praktyce daje to maksymalnie ~0,1 rad (~6°).
- **Oddalanie przy scrollu:** desktop `z = −40 + 15·(1 − 5·m)`, gdzie `m` = postęp sekcji zmapowany z [0, 0.65] na [0, 1]. Obiekt odjeżdża z z = −25 do z = −100, więc maleje do ~1/4. Mobile: `z = −40 + 5·(1 − u)`, `u` z [0, 0.5].
- Kursor nad obiektem: stan „pointer” + etykieta „CLICK ME”.

### 5.3 Karty portfolio (shader obraz → wideo)

Uniformy: `uImage`, `uVideo`, `uImageSize`, `uVideoSize`, `uPlaneSize`, `uResolution`, `uProgress`, `uFlag`, `uToner`, `uBorderRadius`, `uTime`.

- **Zaokrąglone rogi w shaderze:** piksele poza zaokrągloną ramką są odrzucane (`discard`).
- Obraz i wideo mapowane jak `object-fit: cover` (`coverTextureUv`).
- **Hover:** `uProgress` 0→1 w **1,3 s `easeOutCubic`**, wyjście tak samo w drugą stronę. `uFlag` losuje kierunek (lewo/prawo) przy każdym wejściu. Front przejścia to `smoothstep` po osi X, a obraz „wypychany” jest przesunięciem UV, nie zwykłym crossfade'em.
- `uToner: 0.12`: przyciemnienie o 12% pod białe tytuły (to samo na mobile robi pseudo-element `:after` z `opacity: var(--toner)`).
- **Ściskanie przy scrollu (velocity squeeze):** co klatkę `o = lerp(o, |0.15 · scrollVelocity / szerokośćOkna|, 0.065)`, a skala karty = `1 − o`. Przy szybkim scrollu karty kurczą się o kilka–kilkanaście procent i miękko wracają.
- GL na kartach włącza się tylko, gdy urządzenie = desktop **i** `(hover: hover) and (pointer: fine)`. W pozostałych przypadkach: zwykłe `<img>` + `<video>` z `opacity` 0,3 s na hover.

### 5.4 Assety GL

| Plik | Waga (po rozpakowaniu) | Zawartość | Kiedy |
|---|---|---|---|
| `stone-5-opt.glb` | **5,85 MB** | 24 meshe, Draco, tekstury WebP („4k”), klipy Intro/Outro | desktop, od razu |
| `stone-5-mobile-opt.glb` | 1,80 MB | to samo, lżejsze | ≤1024 px |
| `cloth-opt.glb` | 1,45 MB | 1 mesh, Draco, WebP, `KHR_materials_sheen/ior/emissive_strength` | desktop, **od razu** (zanim ktoś kliknie) |
| `cloth-mobile-opt.glb` | **3,65 MB** | Draco, tekstury **PNG** | ≤1024 px |

Wersja mobilna tkaniny jest **2,5× cięższa** od desktopowej, bo ma PNG zamiast WebP. To wygląda na przeoczenie w pipeline.

---

## 6. Ruch i interakcje

### 6.1 Lenis

```
lerp: 0.1 · easing: t => min(1, 1.001 − 2^(−10t)) · smoothWheel: true · syncTouch: true
touchMultiplier: 0.5 · wheelMultiplier: 1 · wheelEventsTarget/eventsTarget: document.body
```

- Montowany **tylko na desktopie**: przy 1182 px i 390 px `window._lenis === null`, przy 1600 px działa. Próg najpewniej 1200 px (największy breakpoint CSS to 1199/1200).
- Ma **własną pętlę rAF**, osobną od Framer Motion i od r3f. Do tego dochodzą pętle kursora i sekwencji klatek, czyli 4–5 równoległych pętli. Zatrzymywany (`stop()`), gdy otwarte jest menu.

### 6.2 Tekst: reveal słów

- Tekst dzielony **na słowa** (nie linie, nie znaki). Każde słowo siedzi w `span` z `overflow: clip` i `padding-top: 0.13em` (żeby nie ucinać akcentów i wysokich liter).
- Słowo wjeżdża `y: 150% → 0` w **1,2 s `easeInOutQuart`**, ze staggerem per słowo (tytuły sekcji: `stagger 0.04`, `delay 0.1`). Odpala się raz (`useInView once`).
- Brak kopii dla czytników ekranu: słowa są w DOM jako zwykły tekst w spanach, więc czytnik dostaje je normalnie (rozbite na fragmenty).
- **Akapity** (np. w Key clients): słowa w osobnych spanach, pojawiają się po kolei po dodaniu klasy `is-visible`.
- **/about:** wypełnianie liter szarym→czarnym w rytm scrolla oraz podświetlanie aktywnego hasła na liście.

### 6.3 Easingi i czasy (to jest „podpis” ruchu tej strony)

| Funkcja (JS) | Gdzie | Odpowiednik CSS |
|---|---|---|
| `easeOutCubic` | hover kart 1,3 s, wyjście preloadera 0,5 s | `cubic-bezier(.215,.61,.355,1)` — **113 użyć w CSS** |
| `easeInOutQuart` | reveal słów 1,2 s, wyjście tkaniny | — |
| `easeInOutCubic` | kurtyna przejść 0,6 / 0,65 / 0,8 s, menu 0,55 s | `cubic-bezier(.645,.045,.355,1)` |
| `easeOutQuart` | preloader, wejście tkaniny, nakładki | — |
| „back” | ikonki przycisków | `cubic-bezier(.68,-.55,.265,1.55)`, `cubic-bezier(.175,.885,.32,1.275)` |

Czasy przejść w CSS: **0,25 s (74×)**, 0,3 s (34×), 0,5 s (13×), 0,4 s (12×). Wniosek: mikro-UI szybko (0,25–0,4 s), wejścia treści wolno (1,2 s), duże zmiany kontekstu ~2 s.

### 6.4 Sticky zamiast pinowania

Tak jak u Lando: **żadnego pinowania JS**, wszystko na `position: sticky`.

- Services <1200 px: każda kolumna to `position: sticky; top: 0; height: 100vh`, więc panele najeżdżają na siebie jak stos kart.
- Achievements: sticky lista ikon + „sticky-bottom” karta z liczbami.
- Key clients: sticky tytuł (top 20 px), sticky akapit (przyklejony do dołu), sticky stos obrazów (top 0) + przewijana lista.
- Linki „ALL CASES / ALL AWARDS”: sticky na `top: ~50vh` po prawej, więc towarzyszą całej sekcji.
- `/about` „Our life”: sticky scena na 6,7 vh scrolla.

### 6.5 Kursor

- `.cursor` fixed, z 9999, **`mix-blend-mode: difference`** (wyłączany w stanach „drag” i „video”), ukryty na urządzeniach dotykowych.
- **Stan domyślny:** pierścień 40 px, 1 px obramowania. **Etykieta** (uppercase, 12 px, podkreślona) pojawia się obok pierścienia (`left: 100% + .5em`, `top: 40px`), z fade 0→1 przez `AnimatePresence`.
- **Stany:** `default` / `drag` (strzałki, przy przytrzymaniu `scale .75`) / `hold` (kropka 10 px odjeżdża o 20 px, etykieta „przytrzymaj”, 0,5 s `easeOutCubic`) / `video`. Zmiana stanu: `scale 0 → 1`.
- Pozycja liczona we własnej pętli rAF (wygładzenie, współczynnika nie dało się zmierzyć przy dławionym rAF).

### 6.6 Hover i drobiazgi

- **Linki podkreślone:** linia jako `background-image`, na hover `background-size: 100% → 0%` w 0,4 s `easeOutCubic` (linia „zjeżdża”).
- **Przycisk menu:** ikona `scale(.75)` w 0,25 s z odbiciem („back”). Wariant czarno-biały: dwa pseudo-elementy przesuwane `translateY(100% → 0)`, 0,4 s.
- **Services:** `flex-grow` 0,4 s `easeOutCubic` + `opacity` wideo tła 0,4 s.
- **Logo i ikona czatu** to **sekwencje klatek rysowane na `<canvas>` 240×240** (komponent `ImgSequence`): obracające się złote logo-nieskończoność i koperta. Koperta ma ~140 klatek AVIF.
- Avatar przy „Discuss project” z zieloną kropką „online”: daje wrażenie żywej osoby po drugiej stronie.

---

## 7. Preloader i przejścia między stronami

### 7.1 Preloader

1. Jasny ekran, na środku mała ikona (obrazki zmieniają się **co 300 ms**), na dole dwa wiersze: nazwa studia i lista usług.
2. Gdy scena GL jest gotowa (+400 ms debounce): ikona `scale → 0` (0,5 s `easeOutQuart`), wiersze tekstu zjeżdżają w maskę (`y: 0 → 100%`, 0,5 s).
3. Po kolejnych 800 ms preloader znika (`opacity`, 0,5 s `easeOutCubic`).
4. Wjeżdża H1, potem **odłamki kamienia zlatują się** z dołu (klip `Intro`). Logo i nawigacja pojawiają się na końcu.

Minimum od gotowości sceny do pełnej strony to ~1,7 s. Na ciepłym cache cały preloader trwał u mnie ~1,5–2 s.

### 7.2 Przejście między stronami

Obserwowane klatki + kod (`page-curtain` to zwykły **canvas 2D**, kolor `#F0F0F0`):

1. **Stara strona przygasa i lekko się zmniejsza:** czarny `.page-default-toner` + skala strony.
2. **Kurtyna wjeżdża od dołu:** prostokąt `fill 0 → 1` w **0,6 s `easeInOutCubic`**.
3. Podmiana strony (Next router, `scroll: false`).
4. **Otwiera się okno na środku:** kurtynę rysują 4 pasy od krawędzi o grubości `w`. `w` = 0,5 → 0,3 w **0,65 s** (okno 0 → 40% ekranu), potem 0,3 → 0 w **0,8 s z opóźnieniem 0,2 s** (okno na cały ekran). Oba kroki `easeInOutCubic`.

Łącznie ~2,2 s plus wygaszenie starej strony. Efekt: nowa strona „wyłania się” z prostokąta w środku jasnej kurtyny.

### 7.3 „Next page transitioner”: odliczanie do następnej strony

- Ostatnia sekcja każdej strony. Pełnoekranowe tło (wideo albo obraz następnego case'u), etykieta („LEARN MORE” / „NEXT CASE”), tytuł `.h2` i **licznik `10 → 00`** w kółku z obwódką SVG (`stroke-dasharray` = długość okręgu).
- Licznik startuje, gdy sekcja jest w widoku. `setInterval` co ~17 ms odejmuje ~17 ms z 10 000 ms, czyli liczy w czasie rzeczywistym. Przy zerze robi `router.push(next, { scroll: false })`.
- **Przytrzymanie myszy** (kursor w stanie „hold”) skraca interwał 10× (w kodzie ~1,7 ms). Przeglądarki przycinają interwały do ~4 ms, więc realnie to raczej ~4× szybciej.
- Wyjście z widoku resetuje licznik. Na ekranach dotykowych (`pointer: coarse`) zwykłe tapnięcie od razu przechodzi dalej.
- Zmierzone: od 02 do przejścia na `/works/Visa` minęło ~2 s, zgodnie z kodem.

---

## 8. Assety, ładowanie, wydajność

**Strona główna, desktop 1600×943, ~6 s po wejściu, bez scrolla i bez klikania:**

| Typ | Ile | Waga (po rozpakowaniu) | Uwagi |
|---|---|---|---|
| glb | 2 | **7,3 MB** | kamień + tkanina (tkanina, zanim ktoś kliknie) |
| js | 21 | **2,6 MB** | `_app` 802 KB, three 686 KB, hls+stats 528 KB, react 138 KB, next 131 KB, r3f 128 KB, polyfills 89 KB… |
| obrazy (`/nextapi/optimize`) | 29 | 1,0 MB | AVIF, `q=85`, `srcset` 414–2560w, wszystkie `loading="lazy"` |
| sekwencje klatek | 189 | ~1,0 MB | **tylko koperta czatu**: 140 AVIF + 49 WebP (część klatek w obu formatach) |
| css | 1 | 284 KB | jeden arkusz dla wszystkich stron |
| woff2 | 3 | 64 KB | preload, `font-display: swap` |
| **Razem** | **≥250** | **≥12,2 MB** | bufor Resource Timing zapchał się na 250 wpisach, więc to dolna granica |

Wideo nie jest w tej liczbie: ładuje się leniwie (`preload="metadata"`, vanilla-lazyload) i stream'uje przy odtwarzaniu.

**Pozostałe pomiary (ciepły cache, traktuj orientacyjnie):**

- HTML **150 KB** po rozpakowaniu, **21 KB** w transferze. Dokument przyszedł po HTTP/1.1.
- TTFB 240–300 ms · FCP **476–752 ms** · DOMContentLoaded 0,47–0,92 s · `load` 1,5–2,1 s.
- Główny wątek: ~320 ms blokowania w pierwszych 6 s (hydracja Reacta i init sceny). Poza tym wolny.
- `Cache-Control: max-age=345600` (4 dni) na plikach z hashem w nazwie, które mogłyby mieć `immutable` na rok.
- Next prefetchuje JS wszystkich podstron z menu (~15 plików `rel=prefetch`).

**Wideo:**

- Tła sekcji: 3 źródła na `<video>`, pierwsze **AV1 w MP4** (`*-x1280-opt.av1.mp4`), ostatnie zwykłe MP4. Szerokość 1280 px nawet na desktopie.
- Karty: `hero-optimized.mp4` itp., `muted loop playsinline`, start dopiero po „video-ready”.

---

## 9. Design system

### 9.1 Siatka i layout

```
--grid-columns: 24 · --grid-gap: 10px · --offset-x: 30px (→ 22 → 17 → 15px na mniejszych ekranach)
--grid-column-width: calc((100vw − scrollbar − 2·offset-x) / 24 − gap·23/24)
--header-height: 74px · --offset-bottom: 30px (20px mobile)
```

- **Główna kolumna treści: 14/24 kolumn, start od 6. kolumny** (karty 888 px i treść case'u 894 px przy 1600 px).
- **Nagłówki sekcji i H1** startują od 4. kolumny (x = 223 px przy 1600). To daje lekkie przesunięcie względem kart i dynamikę bez łamania siatki.
- Stałe UI trzyma się `offset-x` (30 px) od krawędzi.
- Breakpointy (od najczęstszych): `≤1199` (229 reguł), `≤767` lub telefon poziomo `≤900 landscape` (276 reguł), `≤1799`, `≤1366`, `≤1024 portrait`, `≥1800`, `≥1921`, `≤576`, `≤480`, `≤350`.

### 9.2 Typografia

- **PP Right Grotesk Compact Dark** (w CSS jako `PPRightGroteskText`, 800): wszystkie nagłówki, **zawsze uppercase**, bardzo ciasna interlinia. Wąski krój robi zwartość, więc `letter-spacing` to tylko ~−0,14 px.
- **PP Neue Montreal** 500/700: tekst, nawigacja, etykiety (bazowo 14–15 px, `letter-spacing: −0.01em`).
- Oba kroje od **Pangram Pangram (komercyjne)**. Razem 3 pliki, 64 KB.
- **Fluid typography przez `clamp()`:** liniowo między 1280 a 1920 px, a na mobile między 360 a 768 px.

| Klasa | Desktop 1280→1920 | Mobile 360→768 | Uwagi |
|---|---|---|---|
| `.h1` | 80 → 120 px | 50 → 80 px | interlinia liczona 0,8 (100/80 px) |
| `.h2` | 60 → 100 px | 44 → 60 px | |
| `.h3` | 40 → 60 px | 32 → 40 px | H1 na home używa `.h3` (50 px / 40 px przy 1600) |
| `.h4` | 28 → 40 px | 26 px | linki w menu (34 px) |
| `.text-xl` | 26 → 40 px, bold, uppercase | 22 → 26 px | tytuły usług |
| `.text-l` | 22 → 30 px, bold, uppercase | ~20–22 px | |
| `.text-xxl` | 36 px przy 1600 | — | podtytuł hero |
| `.text-m` / `.text-s` / `.text-xs` | 20→28 / 18→24 / 16→18 px, 500 | 18→20 / — / — | interlinia 1,22–1,25 |

### 9.3 Kolory

UI jest **monochromatyczny**. Kolor wnoszą wyłącznie treści: rendery 3D, wideo i małe badge statusu.

| Token / miejsce | Hex | Rola |
|---|---|---|
| `--theme-light-bg-color` | `#FFFFFF` | tło stron |
| `--theme-light-color` | `#000000` | tekst, tło Achievements (sekcja odwrócona) |
| hero, Key clients | `#F4F4F4` | jasna szarość sekcji |
| `--theme-gray-color` | `#F1F1F1` | tła pomocnicze (Awards na /about) |
| kurtyna przejść | `#F0F0F0` | — |
| `--menu-bg-color` | `#121212` | panel menu |
| next-page, media kart | `#111111` | ciemne tła |
| etykiety na kartach | `#8D8D8D33` + tekst `#FFFC` | szkło na zdjęciu |
| przycisk menu | `rgba(141,141,141,.2)` | półprzezroczysty szary + blend `difference` |
| badge statusu | żółty / czerwono-pomarańczowy / różowy | jedyny „systemowy” kolor (IN PROGRESS / CONCEPT / ONLINE) |

Jest też obsługa motywu (`theme-light` na `<html>`, zapamiętany w `localStorage` jako `APP_THEME`), ale przełącznika na home nie widziałem.

### 9.4 Promienie i komponenty

- Promienie: **6–8 px** wszędzie (karty, menu, CTA, przyciski, etykiety). Wideo w services: 16 px. Żadnych pigułek poza „SEND REQUEST”.
- Etykiety (tagi): `padding 8px 11px`, uppercase, 800, promień 6 px.
- Karty: padding treści 30 px (desktop) → 20 px → 13/16 px (mobile).

---

## 10. Mobile (390×844)

- **Lenis wyłączony** (natywny scroll), **kursor ukryty**.
- **Hero:** canvas GL jest w przepływie strony (~380×393), a nie `fixed` na cały ekran. Ładuje lżejszy kamień (1,8 MB), ale cięższą tkaninę (3,65 MB, PNG). Oddalanie przy scrollu jest słabsze (`z` −35 → −40). Klik/tap nadal przełącza obiekt, a shader tkaniny ma osobny tryb śladu dotyku (`mobileTrace`).
- **Karty:** zwykłe `<img>` + `<video>` bez GL, pełna szerokość, promień 6 px, padding 13/16 px.
- **Services:** 3 pełnoekranowe panele sticky najeżdżające na siebie, z wideo tła zawsze widocznym.
- **Menu:** pełnoekranowy ciemny panel (`scaleY 0 → 1`, 0,6 s `easeInOutCubic`), na dole karta „Discuss project”. Przycisk menu przenosi się w prawy górny róg.
- **Next page:** tap od razu przechodzi dalej.
- Telefon w poziomie jest traktowany jak mobile (`max-width: 900px and orientation: landscape`).
- Dokument krótszy: ~11 550 px.

---

## 11. Snippety startowe (własne implementacje technik)

Pisane pod stack z analizy Lando (Astro + vanilla TS + GSAP + Lenis + three). Kod jest mój, nie z ich bundla.

### Reveal słów (zamiennik ich komponentu, z obsługą reduced motion)

```ts
export function revealWords(el: HTMLElement, { stagger = 0.04, delay = 0.1 } = {}) {
  const text = el.textContent!.trim().replace(/\s+/g, ' ');
  el.innerHTML =
    `<span class="sr-only">${text}</span>` +
    `<span aria-hidden="true">` +
    text.split(' ').map((w, i) =>
      `<span class="rw"><span class="rw__in" style="--d:${(delay + i * stagger).toFixed(3)}s">${w}</span></span>`
    ).join(' ') +
    `</span>`;
  const io = new IntersectionObserver(([e]) => {
    if (e.isIntersecting) { el.classList.add('is-in'); io.disconnect(); }
  }, { threshold: 0.25 });
  io.observe(el);
}
```

```css
.rw      { display: inline-block; overflow: clip; padding-top: .12em; vertical-align: top; }
.rw__in  { display: inline-block; transform: translateY(140%);
           transition: transform 1.1s cubic-bezier(.76,0,.24,1) var(--d); }
.is-in .rw__in { transform: none; }
@media (prefers-reduced-motion: reduce) { .rw__in { transform: none; transition: none; } }
```

### Ściskanie kart przy szybkim scrollu (Lenis + GSAP ticker)

```ts
let squeeze = 0;
const list = document.querySelector<HTMLElement>('[data-squeeze]')!;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

gsap.ticker.add(() => {
  if (reduce) return;
  const target = Math.min(Math.abs(lenis.velocity) / innerWidth * 1.8, 0.1); // dostrój współczynnik i limit
  squeeze += (target - squeeze) * 0.07;
  list.style.setProperty('--squeeze', squeeze.toFixed(4));
});
```

```css
[data-squeeze] .card { transform: scale(calc(1 - var(--squeeze, 0))); }
```

(Jeśli karta jest w GL, przekaż `squeeze` do `mesh.scale` zamiast CSS.)

### Hover obraz → wideo (fragment shader, skośny front z miękką krawędzią)

```glsl
precision highp float;
uniform sampler2D uImage, uVideo;
uniform vec2  uPlane, uImageSize, uVideoSize;   // px
uniform float uProgress;  // 0..1, tween ~1.1 s ease-out na pointerenter / pointerleave
uniform float uDir;       // 0 lub 1, losuj przy każdym wejściu
uniform float uRadius;    // px
uniform float uDim;       // np. 0.1 pod białe tytuły
varying vec2 vUv;

vec2 coverUv(vec2 uv, vec2 tex, vec2 plane) {
  float rt = tex.x / tex.y, rp = plane.x / plane.y;
  vec2 s = rp > rt ? vec2(1.0, rt / rp) : vec2(rp / rt, 1.0);
  return (uv - 0.5) * s + 0.5;
}
float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

void main() {
  float d = sdRoundBox((vUv - 0.5) * uPlane, uPlane * 0.5, uRadius);
  float alpha = 1.0 - smoothstep(-1.0, 0.0, d);               // wygładzona krawędź zamiast discard

  float x    = mix(vUv.x, 1.0 - vUv.x, uDir);
  float edge = x * 0.8 + vUv.y * 0.2;                          // lekko skośny front
  float m    = smoothstep(edge - 0.12, edge + 0.12, uProgress * 1.24 - 0.12);

  vec2 vuv = (vUv - 0.5) / mix(1.08, 1.0, m) + 0.5;            // wideo lekko „dojeżdża” zoomem
  vec3 img = texture2D(uImage, coverUv(vUv, uImageSize, uPlane)).rgb;
  vec3 vid = texture2D(uVideo, coverUv(vuv, uVideoSize, uPlane)).rgb;

  gl_FragColor = vec4(mix(img, vid, m) * (1.0 - uDim), alpha);
}
```

(`VideoTexture` z `colorSpace = SRGBColorSpace`, materiał `transparent: true`. Wideo odtwarzaj dopiero, gdy `uProgress > 0`.)

### Akordeon 3 kolumn (CSS, z fallbackiem sticky na mniejszych ekranach)

```css
.pillars { display: flex; height: 100svh; }
.pillar  { flex: 1 1 0; position: relative; overflow: clip;
           transition: flex-grow .45s cubic-bezier(.215,.61,.355,1); }
.pillar:is(:hover, :focus-within, .is-active) { flex-grow: 3; }
.pillars:has(.pillar:hover) .pillar.is-active:not(:hover) { flex-grow: 1; }
.pillar video  { position: absolute; inset: 0; object-fit: cover; opacity: 0; transition: opacity .4s; }
.pillar:is(:hover, :focus-within, .is-active) video { opacity: 1; }
.pillar__more  { opacity: 0; transition: opacity .4s; }
.pillar:is(:hover, :focus-within, .is-active) .pillar__more { opacity: 1; }

@media (max-width: 1199px) {
  .pillars { display: block; height: auto; }
  .pillar  { position: sticky; top: 0; height: 100svh; }
  .pillar video, .pillar__more { opacity: 1; }
}
```

### Kurtyna z oknem (canvas 2D + GSAP, pod hooki Taxi)

```ts
const cv = document.querySelector<HTMLCanvasElement>('.curtain')!;
const ctx = cv.getContext('2d')!;
const COLOR = getComputedStyle(document.documentElement).getPropertyValue('--curtain').trim();
const st = { fill: 0, open: 0 };   // fill: 0..1 zasłona od dołu · open: 0..1 okno od środka

function size() { cv.width = innerWidth; cv.height = innerHeight; }
function drawFill() {
  ctx.clearRect(0, 0, cv.width, cv.height);
  ctx.fillStyle = COLOR;
  ctx.fillRect(0, cv.height * (1 - st.fill), cv.width, cv.height * st.fill);
}
function drawWindow() {
  const { width: w, height: h } = cv;
  ctx.clearRect(0, 0, w, h);
  if (st.open >= 1) return;
  const ww = w * st.open, hh = h * st.open;
  ctx.beginPath();
  ctx.rect(0, 0, w, h);
  ctx.roundRect((w - ww) / 2, (h - hh) / 2, ww, hh, Math.min(24, ww / 2, hh / 2)); // zaokrąglone okno = Twój akcent
  ctx.fillStyle = COLOR;
  ctx.fill('evenodd');
}

export const leave = () => new Promise<void>((done) => {
  size(); st.fill = 0;
  gsap.to(st, { fill: 1, duration: 0.6, ease: 'power2.inOut', onUpdate: drawFill, onComplete: done });
});
export const enter = () => new Promise<void>((done) => {
  st.open = 0;
  gsap.timeline({ onUpdate: drawWindow, onComplete: done })
    .to(st, { open: 0.4, duration: 0.65, ease: 'power2.inOut' })
    .to(st, { open: 1, duration: 0.8, ease: 'power2.inOut' }, '+=0.2');
});
```

### „Następna strona” z przytrzymaniem (rAF zamiast `setInterval`, bez auto-skoku przy reduced motion)

```ts
export function nextPage(el: HTMLAnchorElement, { ms = 8000, holdSpeed = 5 } = {}) {
  const label = el.querySelector<HTMLElement>('[data-count]')!;
  const ring  = el.querySelector<SVGCircleElement>('[data-ring]')!;
  const len = ring.getTotalLength();
  ring.style.strokeDasharray = `${len}`;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let left = ms, inView = false, holding = false, last = 0, raf = 0;

  const tick = (t: number) => {
    const dt = last ? t - last : 0; last = t;
    if (inView && (holding || !reduce)) left = Math.max(0, left - dt * (holding ? holdSpeed : 1));
    label.textContent = String(Math.ceil(left / 1000)).padStart(2, '0');
    ring.style.strokeDashoffset = `${len * (left / ms)}`;
    if (left === 0) { el.click(); return; }       // przejście przez Twój router (Taxi przechwyci link)
    raf = requestAnimationFrame(tick);
  };

  new IntersectionObserver(([e]) => {
    inView = e.intersectionRatio > 0.85;
    if (!inView) left = ms;                        // reset po wyjściu z widoku
  }, { threshold: [0, 0.85] }).observe(el);

  el.addEventListener('pointerdown', () => (holding = true));
  ['pointerup', 'pointerleave', 'pointercancel'].forEach((ev) => el.addEventListener(ev, () => (holding = false)));
  raf = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(raf);          // ← do Twojego lifecycle destroy()
}
```

### Wgniatanie powierzchni kursorem (vertex shader, wersja uproszczona)

```glsl
// + snoise(vec3) z dowolnej implementacji simplex 3D
uniform vec3  uPointer;   // punkt trafienia raycastu (world space)
uniform float uPress;     // 0..1: w JS sprężyna — rośnie przy ruchu kursora nad obiektem, sama opada
uniform float uRadius, uDepth, uTime, uWobble;
varying vec2  vUv;
varying float vDent;

void main() {
  vec3 p  = position;
  vec3 wp = (modelMatrix * vec4(p, 1.0)).xyz;
  float f = 1.0 - smoothstep(0.0, uRadius, distance(wp, uPointer));
  f = f * f * (3.0 - 2.0 * f);
  p -= normal * f * uDepth * uPress;                                // wgniecenie
  p += normal * snoise(p * 0.6 + vec3(0.0, 0.0, uTime * 0.15)) * uWobble; // „oddychanie” materiału
  vUv = uv; vDent = f * uPress;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
// fragment: kolor z tekstury z wypieczonym światłem, lekko ściemniony o vDent
```

Sprężystość rób w JS: `press += (target − press) · 0.12`. Jeśli chcesz prawdziwego „dobijania” i drgań po puszczeniu, potrzebujesz symulacji ze stanem (GPGPU ping-pong albo sprężyna per wierzchołek w JS na niskopoligonowej siatce).

---

## 12. Podsumowanie w roli „jakość wizualna i ruch”

### 12.1 Co ta strona robi najlepiej

- **Spójny, „dwubiegowy” język ruchu.** Interfejs reaguje szybko (0,25–0,4 s, `easeOutCubic`), treść wchodzi wolno i elegancko (1,2 s, `easeInOutQuart`), zmiany kontekstu są długie (~2 s). Trzy tempa, cztery krzywe, konsekwentnie w CSS i JS. Stąd wrażenie „drogiej” strony bez fajerwerków w każdej sekcji.
- **WebGL tam, gdzie daje dotyk, a nie wszędzie.** Hero zaprasza do kliknięcia i odpowiada fizycznie (rozpad odłamków, wgniatanie tkaniny). Karty dostają przejście obraz→wideo i reakcję na prędkość scrolla. Reszta to DOM + sticky, więc strona jest lekka w obsłudze mimo ciężkich assetów.
- **Wypiekanie zamiast liczenia.** Rozpad kamienia to klipy z Blendera, światło tkaniny jest w teksturze. Wygląda jak render, kosztuje jak prosty shader.
- **Monochromatyczne UI, kolor tylko z prac.** Biel, szarości `#F0`–`#F4`, czerń `#111`–`#121212`. Rendery i wideo świecą, bo nic z nimi nie konkuruje.
- **Mikro-UX z charakterem:** kursor z etykietą mówi, co się stanie; menu wyrasta z przycisku; mapa rozdziałów z kropek; „następna strona” z odliczaniem i przytrzymaniem zamienia stopkę w ciągłą podróż po portfolio.
- **Przejścia mają ciągłość:** stara strona przygasa, jasna kurtyna, nowa wyłania się z okna na środku. Proste (canvas 2D, 4 prostokąty), a bardzo czytelne.

### 12.2 Co robi słabo

- **Waga i liczba requestów:** ≥12 MB i ≥250 requestów przed jakąkolwiek interakcją. 5,85 MB kamienia (tekstura „4k”), tkanina ładowana, zanim ktoś kliknie, mobilna tkanina cięższa od desktopowej (PNG), ~190 klatek animacji ikony koperty (część w dwóch formatach), hls.js + stats.js na home bez streamów HLS, CSS 284 KB dla wszystkich stron.
- **Dostępność:** `prefers-reduced-motion` obsłużone w 3 regułach CSS. Framer Motion działa z domyślnym `reducedMotion: "never"`, a Lenis nie sprawdza preferencji. Brak `alt` w 10/29 obrazów na home i 17/26 w case study. Tytuł strony to samo „Chipsa”.
- **Auto-przejście po 10 s** bez akcji użytkownika: zaskakuje (np. ktoś czyta formularz nad sekcją) i jest problematyczne wg WCAG 2.2.1 (regulowany limit czasu).
- **Kilka niezależnych pętli rAF** (Lenis, Framer, r3f, kursor, sekwencje). Działa, ale trudniej to synchronizować i debugować niż jeden ticker.
- **Cache 4 dni** na plikach z hashem i HTML po HTTP/1.1. Drobne, ale łatwe do poprawienia.
- Różnica odczucia między 1199 a 1200 px (Lenis on/off, akordeon vs stos, GL na kartach on/off) jest skokowa.

### 12.3 Jak przenieść mechanikę bez kopiowania wyglądu

**Zasada:** bierzesz **rytm, strukturę interakcji i liczby** (czasy, krzywe, proporcje). Nie bierzesz **materiałów, krojów, kompozycji kadrów ani palety**. U Ciebie: wordmark „webexe”, Biel / Laguna (gradient) / Głębia / Piana, Comfortaa 700 (tylko wordmark) + Plus Jakarta Sans.

| Mechanika Chipsa | Jak ją zrobić po swojemu |
|---|---|
| Obiekt hero zmieniany kliknięciem (rozpad ↔ miękka powierzchnia) | Dwa stany pod Wasze hasło o software, z którym zostajecie na lata: **„surowa struktura” ↔ „dopracowany produkt”**. Np. bryła z bloków/modułów, która po kliknięciu się rozkłada, a w jej miejsce wjeżdża gładka, wgniatana powierzchnia w gradiencie Laguny. Rozpad wypiecz w Blenderze (cell fracture → klipy). W planie z analizy Lando możesz to połączyć z maską szumu: klik przełącza, która warstwa jest „pod spodem”. |
| Tilt za kursorem ±6° + oddalanie przy scrollu | Bierz 1:1 jako zasadę, to czysta mechanika. Dobierz własne wartości. |
| Karty: hover obraz→wideo + ściskanie przy scrollu | Shader z sekcji 11: **skośny front i zoom wideo** zamiast ich poziomego przesuwu, zaokrąglenia z Twojego systemu (np. 16–20 px zamiast 6–8 px), przyciemnienie Głębią zamiast czernią. |
| Akordeon 3 kolumn (usługi) | 3 filary oferty, np. **Strony / Software i automatyzacje / Utrzymanie**. W tle własne pętle (np. abstrakcje w kolorach marki albo nagrania z prawdziwego dashboardu Waszej platformy deployowej). |
| Sticky „karta z liczbami” na tle nagród | Liczby, które budują Wasze pozycjonowanie (lata utrzymania, liczba utrzymywanych aplikacji, uptime), tylko prawdziwe. Zamiast logotypów nagród np. ikony technologii albo zrzuty z monitoringu. |
| Scroll-spy klientów ze sticky obrazem | Lista klientów lub projektów, a w tle rendery w Twoim materiale (np. litery wordmarku w szkle/gradiencie) albo zrzuty realizacji. |
| Reveal słów 1,2 s | Plus Jakarta Sans ExtraBold zamiast wąskiego groteska uppercase. Możesz zostać przy reveal'u linii z planu Lando, a słowa dać tylko w krótkich nagłówkach. |
| Kursor z etykietą | Etykiety po polsku w formie „wy” („Kliknijcie”, „Zobaczcie case”). Bez `mix-blend-mode: difference`, jeśli kłóci się z gradientem. |
| Menu wyrastające z przycisku | Ta sama morfologia (przycisk → panel), ale np. panel z gradientem Laguny i inną pozycją (prawy górny róg). |
| Kurtyna z oknem | Kolor Piany/Bieli, **zaokrąglone okno** (snippet w sekcji 11), te same proporcje czasu 0,6 / 0,65 / 0,2 / 0,8 s. |
| Odliczanie do następnej strony | Koniec case study: „Następny projekt” z przytrzymaniem. **Bez automatycznego przejścia przy `prefers-reduced-motion`**, z pauzą, gdy fokus jest w formularzu, z normalnym linkiem dla klawiatury. |
| Mapa rozdziałów z kropek | Dobra nawigacja dla długiej strony; własny układ kropek (np. linia czasu zamiast konstelacji). |

**Lando vs Chipsa: co z czego brać do jednej strony**

| Aspekt | landonorris.com | chipsa.design | Rekomendacja |
|---|---|---|---|
| Charakter ruchu | kinowy, scrub, długie sceny | „produktowy”: szybkie UI + wolne wejścia treści | Rytm i krzywe z Chipsy, wielkie sceny scroll z Lando tylko w 1–2 miejscach (hero, galeria). |
| Użycie WebGL | prawie wszystko w GL, loader czeka na komplet | hero + karty, reszta DOM | Model Chipsy (GL punktowo) z architekturą Lando (DomPlane + render targety, lazy sceny). |
| Interakcja | kursor ugina shader | klik zmienia obiekt, wgniatanie, hold-to-next | Obie: kursor ugina, klik zmienia stan. |
| Przejścia | overlay Rive | kurtyna canvas 2D | Na start kurtyna z oknem (zero zależności), Rive ewentualnie później. |
| Koniec strony | stopka z maską SVG | odliczanie do następnej strony | Na home stopka z CTA, na case study „następny projekt”. |
| Waga | ~58 requestów, wszystko za loaderem | ≥250 requestów, 7,3 MB GLB | Budżet: GLB ≤1,5 MB na hero, reszta lazy, jeden format sekwencji (albo wideo zamiast sekwencji). |

**Przełożenie stacku (Chipsa jest w React, Ty idziesz w Astro + vanilla):**

| Chipsa | U Ciebie |
|---|---|
| Framer Motion: warianty, `animate`, `AnimatePresence` | GSAP (już w planie) albo vanilla `motion` |
| `useScroll` / `useTransform` | ScrollTrigger `scrub` albo `lenis.on('scroll')` |
| `useVelocity` + `useAnimationFrame` | `lenis.velocity` w `gsap.ticker` (jeden ticker na wszystko) |
| r3f `<View track>` + tunnel | Twój `DomPlane` z planu Lando (krok 4) |
| klipy GLB przez drei `useAnimations` | `THREE.AnimationMixer` + `clipAction`, `timeScale = −1` do odtwarzania wstecz |
| vanilla-lazyload na wideo | `IntersectionObserver` + `preload="none"` i `data-src` |

**Gdzie to wpiąć w plan z analizy Lando (numery kroków stamtąd):**

- **Krok 3 (router):** kurtyna z oknem jako pierwszy overlay przejść.
- **Krok 7 (hero):** do maski z szumu dodaj „klik zmienia stan” i tilt. Rozpad wypiekany w Blenderze.
- **Krok 8 (system tekstu):** reveal słów jako drugi wariant obok linii. Ustal 3 tempa i 4 krzywe jako tokeny (`--ease-ui`, `--ease-reveal`, `--ease-scene`, `--ease-back`; `--dur-ui: .3s`, `--dur-reveal: 1.2s`, `--dur-scene: 2s`).
- **Kroki 10 i 12 (galeria, siatka):** karty portfolio z hover obraz→wideo w GL i ściskaniem przy scrollu.
- **Krok 11 (sekcja split):** akordeon 3 filarów jako alternatywa dla ON/OFF.
- **Krok 17 (podstrony):** koniec case study = „następny projekt” z przytrzymaniem. Mapa rozdziałów na długich podstronach.
- **Krok 18 (szlif):** to, czego Chipsa nie zrobiła: reduced motion w JS (Lenis, GSAP, GL), alty, budżet wagowy, jeden format sekwencji, `immutable` cache.
