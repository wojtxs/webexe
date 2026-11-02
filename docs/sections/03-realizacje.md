# 03 — Realizacje (sekcja na głównej, lista, strona projektu)

**Status:** done, v2 (2026-11-02, tag `realizacje-v2`). Widoki A i B przebudowane na indeks z żywym ekranem (decyzja 4 niżej). v1: 2026-11-01, S1–S4, tag `realizacje-v1`, karty w siatce (kopia: `demo-v4-2026-11-01`, gałąź `backup/demo-v4`). Treść to DEMO do wymiany w D3. Niesprawdzone: blok `pair` (brak danych), Firefox (fallback zasymulowany), trace 60 fps (RDP daje 32 Hz)
**Zależności:** decyzje z 2026-11-01 (`PROGRESS.md`, log decyzji). Istniejące moduły: `work-live`, `tilt`, `media-reveal`, `split-reveal`, `curtain`, `header`, `chapter-map`, `menu`, `cursor`. Nowy moduł `work-index`, GSAP Flip (jest w paczce `gsap`). Komponenty `Grid`, `XMark`, `Button`, `Contact.astro`. Treść: **D3** (prawdziwe projekty), do tego czasu DEMO. Bez nowych zależności npm.
**Wzorzec:** `docs/INSPIRACJE.md`, wiersz „Realizacje / showcase” (z notką 2026-11-01). `docs/reference/chipsa-analiza.md`: 3 (Best works, link do wszystkich, „Key clients”: indeks nazw z podglądem), 4.2 (`/works/[slug]`: powrót „×”, hero z mediami, bloki z tytułem, następny projekt), 5.3 (front obraz → wideo), 7.2 (przejście). `docs/reference/alpanet-analiza.md`, 4.3 (rytm). Klatek w `docs/refs/03-*/` brak.

## Cel

Na głównej odbiorca przewija indeks trzech najmocniejszych projektów, a obok na przyklejonym ekranie gra aktywny projekt jak żywa aplikacja. Jednym ruchem przechodzi do wszystkich. Na liście widzi, że takich projektów jest więcej. Na stronie projektu czyta konkret: jaki był problem, co zbudowaliśmy, z czym to połączyliśmy, co było trudne i że dalej to utrzymujemy. Każdy widok kończy się kontaktem (D9).

## Treść

Z `BRIEF.md`: wiersz 03 mapy strony i D3. Poza tym `BRIEF.md` nie ma treści tych widoków, więc:

- **Projekty:** DEMO z `src/data/demo.ts` (4 fikcyjne) przenosimy do kolekcji treści (niżej). Każdy wpis ma `demo: true`. Przed wdrożeniem wpisy DEMO znikają (D3).
- **Nagłówek sekcji na głównej:** „Realizacje” (roboczo, jak dziś, `TODO(treść)`).
- **Wiersz-link:** „Wszystkie realizacje” i liczba projektów z kolekcji (`TODO(treść)`).
- **Lista:** nagłówek „Realizacje” i lead `TODO(treść)`. Filtr: „Wszystkie” i typy ze schematu (`tags`) z liczbą projektów; etykiety `TODO(treść)`.
- **Strona projektu, etykiety bloków (propozycja, po akceptacji trafiają do `BRIEF.md`):** Problem, Co zbudowaliśmy, Z czym połączyliśmy, Co było trudne, Utrzymanie. Fakty: Branża, Zakres, Rok, Status. Powrót: „Wszystkie realizacje”. Koniec: „Następna realizacja”.
- **Kursor nad ekranem indeksu i kadrem następnej realizacji:** „Zobacz realizację” (`TODO(treść)`).
- Tytuły i opisy z kolekcji dostają twarde spacje po jednoliterowych słowach (`noOrphans`, `src/data/typo.ts`).
- Liczby tylko prawdziwe. Pole bez danych się nie renderuje (bez „—”).

## Dane

Kolekcja treści Astro `realizacje` (`src/content.config.ts`, loader `glob` na `src/content/realizacje/*.md`, schemat zod). API sprawdzam w Context7 przed kodem (Astro 7). Jeden plik na projekt, a nazwa pliku to slug w URL (`kokpit-floty.md` → `/realizacje/kokpit-floty`). Bloki trzymamy w frontmatterze, bo daje to pełną kontrolę nad układem bez MDX (MDX byłby nową zależnością).

```yaml
title: Kokpit floty
summary: System dyspozytorski dla firmy transportowej. …   # karta, lead strony, meta description
tags: [Aplikacja, Integracje]          # enum: Aplikacja | Integracje | Automatyzacja | AI | Utrzymanie
order: 1                               # kolejność na liście i „następna realizacja”
featured: true                         # na główną (pierwsze 3 po order)
demo: true
cover: ../../assets/demo/flota-base.webp
coverAlt: Pulpit dyspozytora: …
live: flota                            # opcjonalna żywa warstwa (components/live/*)
facts:                                 # opcjonalne, tylko prawdziwe wartości
  industry: Transport
  scope: Aplikacja, Integracje
  year: 2025
  status: W utrzymaniu od 2025
tech: [typescript, nodejs, docker]     # klucze ikon z src/assets/tech (te same co w .stack)
url: https://…                         # opcjonalnie „Zobacz na żywo”, tylko publiczne
blocks:
  - { type: text, title: Problem, body: ["akapit", "akapit"] }
  - { type: media, image: ../../assets/…, alt: …, caption: … }
  - { type: pair, desktop: …, desktopAlt: …, mobile: …, mobileAlt: … }
  - { type: tech, title: Z czym połączyliśmy, body: ["…"] }
```

Hero na głównej zostaje na `demoHero` z `demo.ts`, bo jest związany z żywą warstwą floty (D2, D3). `demoProduct` i `demoContact` też zostają w `demo.ts` (to nie realizacje).

## Struktura DOM

```html
<!-- A. Główna, Work.astro: indeks 3 projektów z żywym ekranem + wiersz-link + technologie -->
<section id="realizacje" class="section work theme-dark" data-nav-theme="dark">
  <div class="windex" data-module="work-index">            <!-- components/WorkIndex.astro -->
    <ol class="windex__list" data-index-list>
      <li class="windex__row is-active" data-index-row data-tags="Aplikacja|Integracje" data-summary="…">
        <XMark class="windex__x" draw/>                      <!-- węzeł na lewej linii siatki -->
        <h3 class="windex__title t-h2"><a class="windex__link" href="/realizacje/kokpit-floty/"
            data-morph="case-kokpit-floty">Kokpit floty</a></h3>   <!-- ::after na cały wiersz -->
        <div class="windex__meta"><ul class="tags">…</ul><p class="windex__facts"><span>2025</span><span>W utrzymaniu</span></p></div>
        <p class="windex__summary">…</p>                     <!-- desktop: tylko dla czytnika -->
      </li>
    </ol>
    <div class="windex__aside" aria-hidden="true" data-index-aside>
      <div class="windex__stage">                          <!-- sticky -->
        <div class="windex__screen" data-cursor="Zobacz realizację" data-tilt="2">
          <a class="shot windex__shot is-active" href="/realizacje/kokpit-floty/" tabindex="-1" data-index-shot
             data-morph="case-kokpit-floty" data-morph-source="case-kokpit-floty">…zrzut + żywa warstwa…</a>
          …po jednym kadrze na projekt…
        </div>
        <p class="windex__caption" data-index-caption>opis aktywnego projektu</p>
      </div>
    </div>
  </div>
  <a class="work__all" href="/realizacje">
    <span class="work__all-surface" aria-hidden="true"></span>
    <span class="t-h2">Wszystkie realizacje</span><span class="t-label">4</span>
  </a>
  <div class="stack">…</div>
</section>

<!-- B. /realizacje: pages/realizacje/index.astro -->
<section id="realizacje" class="section cases theme-dark" data-nav-theme="dark">
  <h1>Realizacje</h1><p class="cases__lead">lead, renderuje się, gdy BRIEF go poda</p>
  <div class="windex windex--filters" data-module="work-index">
    <div class="windex__filters" role="group" aria-label="Filtruj realizacje według typu">
      <button class="windex__filter" aria-pressed="true" data-filter="">Wszystkie <span>4</span></button>
      <button class="windex__filter" aria-pressed="false" data-filter="Aplikacja">Aplikacja <span>2</span></button> …
    </div>
    …ten sam indeks z tytułami h2 (WorkIndex.astro, heading="h2")…
  </div>
</section>
<Contact />

<!-- C. /realizacje/[slug]: pages/realizacje/[slug].astro -->
<section id="projekt" class="case-hero theme-dark" data-nav-theme="dark">
  <a class="case-hero__back" href="/realizacje"><XMark/> Wszystkie realizacje</a>
  <h1>Kokpit floty</h1><ul class="tags">…</ul>
  <div class="case-hero__cover" data-live-card="view" style="view-transition-name: case-kokpit-floty">…</div>
  <dl class="case-facts">…4 komórki…</dl>
</section>
<section id="opis" class="case-body theme-light" data-nav-theme="light">
  <p class="case-body__lead t-lead">{summary}</p>
  <section class="case-block" aria-labelledby="…"><h2>Problem</h2><div class="case-block__text"><p>…</p></div></section>
  <figure class="case-media" data-reveal><div data-reveal-zoom><img …></div></figure>
  …
</section>
<section id="nastepna" class="case-next theme-dark" data-nav-theme="dark">
  <a class="case-next__link" href="/realizacje/obieg-faktur">etykieta „Następna realizacja”, tytuł, okładka</a>
</section>
<Contact />
```

Wspólny indeks to `components/WorkIndex.astro` (główna i lista; w v1 była to karta `WorkCard.astro`, usunięta). Każdy wiersz to jeden link do projektu: tytuł z `::after` na cały wiersz, jedyny przystanek tabulatora i nazwa linku. Kadry na ekranie też są linkami (dla myszy i dotyku), ale ekran ma `aria-hidden` i kadry `tabindex="-1"`, bo powtarzają tytuły. Pierwszy wiersz i pierwszy kadr są aktywne już w HTML, więc bez JS ekran pokazuje pierwszy projekt, a wiersze działają jak linki. Na desktopie opis jest pod ekranem (podpis), a w wierszu tylko dla czytnika; poniżej 992 px opis stoi w wierszu.

Pliki spoza sekcji:
- `Header.astro`: propsy `chapters` i `home` (na podstronach wordmark → `/`, menu → `/#id` plus pozycja „Wszystkie realizacje”). Na głównej bez zmian.
- `curtain.ts`: pomija linki z `data-morph`, gdy przeglądarka obsługuje przejścia między dokumentami (wtedy gra morf). W chwili kliknięcia nadaje `view-transition-name` kadrowi z `data-morph-source` o tej samej nazwie. Okładka ma nazwę na stałe. Stałe nazwy na wszystkich kartach morfowałyby każdą parę o tej samej nazwie (główna → lista, kadr następnej realizacji w stopce projektu). Inne nawigacje `pageswap` pozbawia przejścia przeglądarki (`skipTransition()`), żeby nie dublowało kurtyny.
- `nav-theme.ts`: w trakcie przejścia hit-testing trafia tylko w `<html>`, więc wynik „nieznany” sonda sprawdza w następnej klatce. `Header.astro`: prop `top` (podstrony `dark`), żeby pierwsza klatka nowej strony miała właściwe kolory paska.
- `Base.astro`: reguła `@view-transition` inline na samym początku `<head>` *(v2; w v1 stała w `base.css`)*. Z regułą w arkuszu przeglądarka bywała pytana o zgodę nowej strony, zanim arkusz doszedł, i odrzucała przejście („opt-in disabled”; z głównej 0 na 5 prób, z regułą inline 5 na 5). Czasy przejścia zostają w `base.css`.
- `ARCHITECTURE.md`: strony, kolekcja, `data-morph`, propsy Header.
- `index.astro` i `Hero.astro`: bez zmian.

## Layout

Tła: 03 na głównej Głębia (jak dziś). Lista: Głębia. Strona projektu: hero i fakty na Głębi (media świecą), opis na Pianie (długie czytanie), następna realizacja na Głębi, potem kontakt na Głębi. Granice teł są zwykłe, bez dużego momentu.

```
A. Główna 1440
| Realizacje (t-h2)                                              |
x───────────────────────────── |                                 |   linia wiersza od lewej linii siatki do środkowej
| Kokpit floty (t-h2, jasny)    | [ekran 16:10, kol 7–12,        |   wiersz: min-height max(18rem, 42svh)
| Aplikacja x Integracje  2025  |  sticky w połowie okna,        |
x───────────────────────────── |  żywa warstwa aktywnego]       |   aktywny: x w Lagunie, linia w Lagunie od x w prawo
| Obieg faktur… (przygaszony)   | opis aktywnego (podpis)        |
x───────────────────────────── |                                 |
| Sklep, ERP… (przygaszony)     |                                 |
| ───────────────────────────── |                                 |
| ────────────────────────────────────────────────────────────── |   linia siatki
| Wszystkie realizacje (t-h2)                                 4  |   kol 1–12, min-height 10rem
| ────────────────────────────────────────────────────────────── |
| Technologie, na których budujemy (.stack, bez zmian)           |

B. /realizacje 1440
| Realizacje (t-impact)                                          |
| lead, kol 1–7                                                  |
| (Wszystkie 4) (Aplikacja 2) (Integracje 2) …                   |   filtr, chipy t-label
| indeks jak w A, wszystkie projekty, tytuły h2                  |
| Kontakt + stopka                                               |

C. /realizacje/kokpit-floty 1440
| x Wszystkie realizacje (t-label)                               |   padding-top --s-32 (pod paskiem)
| Kokpit floty (t-h1, kol 1–9)                                   |
| Aplikacja x Integracje                                         |
| [okładka, kol 1–12, 16:10, --r-card, żywa warstwa]             |
| Branża │ Zakres │ Rok │ Status   (komórki po 3 kol, linie)     |   jak .stack
| ─── Piana ───                                                  |
|            lead (t-lead, kol 4–10)                             |
| Problem    │ akapity (t-body, kol 4–10)                        |   etykieta kol 1–3, t-label
| [media, kol 1–12]                                              |
| Co zbudowaliśmy │ akapity                                      |
| [para: desktop kol 1–8 │ telefon kol 9–12]                     |
| Z czym połączyliśmy │ akapit + ikony technologii (komórki)     |
| Co było trudne │ akapity                                       |
| Utrzymanie │ akapity                                           |
| ─── Głębia ───                                                 |
| Następna realizacja (t-label)                                  |
| Obieg faktur z AI (t-h1, kol 1–7) │ okładka kol 8–12           |
| Kontakt + stopka                                               |

390 i 834 (A, B): indeks w kolumnie
| [ekran 16:10 na całą szerokość, sticky top 0 pod paskiem, tło Głębia] |   pod nim pas wygaszenia --s-8
| x── Kokpit floty (t-h3), tagi, fakty, opis                            |   wiersze przewijają się pod ekranem
| x── Obieg faktur…                                                     |
390 (C)
| fakty 2 × 2 (span 2)
| etykieta bloku nad akapitami
| para: desktop, pod nim telefon (kol 2–3)
| następna: tytuł, pod nim okładka
```

834 (C): fakty 2 × 2. Etykieta bloku nad tekstem. Para obok siebie (5 + 3).

Poniżej 992 px `.windex` jest kolumną flex, a nie podsiatką: element siatki ze `sticky` trzyma się tylko własnego obszaru (wiersza siatki), a w kolumnie ekran zostaje u góry przez cały indeks.

Tagi wszędzie jako lista z x między pozycjami. Dziś są pisane z „·”, czego zakazuje `DESIGN.md`.

## Interakcje i ruch

Jeden moment na widok: na głównej i liście gra indeks z ekranem, a na stronie projektu przejście okładki. Reszta to istniejące moduły globalne.

| # | Wyzwalacz | Efekt | Liczby |
|---|---|---|---|
| 1 | Wiersz indeksu przecina linię aktywności (desktop: środek okna; poniżej 992 px: 35 % wolnego miejsca pod ekranem), kursor nad wierszem, fokus, klik | Tytuł jaśnieje (nieaktywne przygaszone), węzeł x rysuje się w Lagunie, linia wiersza rysuje się w Lagunie od x w prawo, podpis się podmienia. Nowy kadr wjeżdża na ekran kurtyną w kierunku scrolla (następny od dołu, poprzedni od góry) z dojazdem skali. Gra tylko żywa warstwa aktywnego kadru, tilt ekranu za kursorem. Fokus z klawiatury trzyma swój wiersz do pierwszego przewinięcia (kółko, dotyk, klawisz), bo przeglądarka stawia fokus w okolicy środka okna, a na mobile to tuż pod linią aktywności. Klik przełącza od razu, żeby morf (#5) leciał z widocznego kadru | `work-index`: kurtyna `clip-path` + skala 1.12 → 1 w `--d-enter`, `--ease-enter`; x i linia w `--d-enter`, `--ease-draw`; tilt 2°; kadr następnej realizacji jak w v1 (`work-live`, toner, tilt 3°) |
| 2 | Klik w filtr (lista) | Wiersze spoza typu znikają, reszta przestawia się na swoje miejsca; jeśli aktywny wiersz zniknął, aktywny jest pierwszy widoczny | GSAP Flip (`absolute`), `--d-ui` × 2, `--ease-enter`; wejście i wyjście przez opacity |
| 3 | Wejście mediów w widok | Kurtyna od góry, zoom 1.2 → 1. Okładka projektu bez kurtyny: stoi od pierwszej klatki, bo morf nie może lecieć w ukryty element, a jej żywa warstwa gra w widoku jak wideo (`data-live-card="view"`) | `media-reveal`, `--d-enter` |
| 4 | Kursor albo fokus na wierszu „Wszystkie realizacje” | Powierzchnia Głębia raise rysuje się od lewej jak kreska x. Liczba przesuwa się o `--s-2` w lewo | `scale: 0 1` → `1 1` od lewej krawędzi (płaski prostokąt, transform na kompozytorze), `--d-enter`, `--ease-draw`; zjazd: `--d-ui`, `--ease-ui` |
| 5 | Klik wiersza albo ekranu indeksu (główna, lista), klik następnej realizacji | **Morf:** kadr z ekranu płynnie przechodzi w okładkę strony projektu, reszta przenika się | View Transitions między dokumentami: grupa `case-<slug>` w `--d-enter`, `--ease-enter`; root: przenikanie w `--d-ui` |
| 6 | Klik innego linku między stronami | Kurtyna | `curtain` jak dziś (`--d-context`) |
| 7 | Nagłówki h1/h2 | Słowa spod maski | `split-reveal`, jak na głównej |
| 8 | Pasek systemu na podstronach | Te same stany co na głównej (zwijanie, chowanie, postęp, rozdział) | `header`, rozdziały z propsa |

## Reduced motion / bez WebGL / dotyk

- **Reduced motion:** indeks działa tak samo (aktywny wiersz, podmiana kadru i podpisu), ale bez kurtyny ekranu, bez żywych warstw i bez Flipa w filtrze. Bez morfu (reguła `@view-transition` tylko przy `no-preference`), bez kurtyny stron, media stoją, kadr następnej realizacji bez tonera i tiltu, wiersz-link zmienia tło bez ruchu. Treść kompletna.
- **Bez WebGL:** nie używamy WebGL.
- **Dotyk:** #1 sterowany scrollem (linia aktywności pod przyklejonym ekranem), tap w wiersz albo ekran przechodzi do projektu. #4 nie ma odpowiednika hover (świadomie): wiersz ma stałe linie i wygląda klikalnie.
- **Bez JS:** wszystkie linki działają, ekran pokazuje pierwszy projekt, filtr nie działa (przyciski bez efektu). Strony przenikają się (reguła `@view-transition` to sam CSS), ale bez morfu, bo nazwę kadrowi nadaje skrypt w chwili kliknięcia.
- **Przeglądarka bez View Transitions** (np. Firefox): klik wiersza idzie przez kurtynę.

## Assety

Okładki i żywe warstwy DEMO z `src/assets/demo/`. Media do bloków: D3 (w `ASSETS.md` dopisujemy `CASE-<slug>-*`). Do sprawdzenia układu jeden projekt DEMO dostaje blok `media` z istniejącego zrzutu. Ikony technologii z `src/assets/tech/`.

## Etapy implementacji

1. **S1 statyka:** kolekcja i schemat, 4 wpisy DEMO z `demo.ts`, `WorkCard.astro`, główna z 3 kartami i wiersz-link, `/realizacje`, `/realizacje/[slug]` (`getStaticPaths`), `Contact` na podstronach, `Header` z propsami, tagi z x, SEO per strona (`title`, `description`, `og:image` z okładki). Build + visual-qa + commit `feat(realizacje): statyka`.
2. **S2 ruch DOM:** stretched link + kursor, wiersz-link (#4), moduły kart na liście i w następnej realizacji, `media-reveal` w blokach. Test init → destroy → init. Commit `feat(realizacje): ruch`.
3. **S3 przejście:** View Transitions (#5), wyjątek w `curtain.ts`, fallback kurtyny. Commit `feat(realizacje): przejście karty`.
4. **S4 mobile + reduced motion + fallbacki:** 390 / 834, dotyk, reduced motion, bez JS, Firefox. Commit `feat(realizacje): mobile i reduced motion`, tag `realizacje-v1`.
5. **v2 indeks z żywym ekranem (2026-11-01/02):** prototyp w `/lab`, akceptacja, `WorkIndex.astro` + `work-index.ts` + `work-index.css` na głównej i liście, filtr z Flip, wspólny rejestr żywych warstw (`modules/live/registry.ts`), usunięcie `WorkCard`, zgoda na przejście inline w `Base.astro`. Commity `fix(przejście): …`, `feat(realizacje): indeks z żywym ekranem`, tag `realizacje-v2`.

## Kryteria akceptacji

- Główna pokazuje dokładnie 3 projekty (`featured`, po `order`). Wiersz prowadzi do `/realizacje`, a liczba w nim równa się liczbie wpisów kolekcji.
- Build generuje stronę dla każdego wpisu. Każdy wiersz indeksu prowadzi do istniejącej strony, a ostatnia realizacja ma jako następną pierwszą.
- Wiersz to jeden przystanek tabulatora z nazwą z tytułu. Fokus aktywuje wiersz i jego kadr; na mobile tytuł z fokusem nie chowa się pod przyklejonym ekranem.
- W każdej chwili gra najwyżej jedna żywa warstwa indeksu (aktywny kadr).
- Filtr: liczby przy typach równają się liczbie projektów z tym typem; po filtrze aktywny jest widoczny wiersz.
- Strona projektu ma jeden `h1`, `h2` w każdym bloku z tytułem i `alt` na każdym obrazie. Link „Wszystkie realizacje” jest pierwszym elementem treści po pasku.
- Na podstronach wordmark prowadzi do `/`, CTA do `#kontakt` na tej samej stronie, a pozycje menu do istniejących celów.
- Edge: klik wiersza albo ekranu przenosi kadr w okładkę (morf) bez kurtyny, z głównej i z listy. Bez View Transitions działa kurtyna. Reduced motion: zwykła nawigacja.
- Pole faktu bez wartości się nie renderuje. Wpisy z `demo: true` wypisują ostrzeżenie w buildzie.
- CLS 0 (okładki i media mają wymiary z `astro:assets`).
- Plus DoD ze skilla `build-section`.

## Poza zakresem

- Prawdziwe projekty, nagrania i opisy (D3).
- Paginacja. *(Filtr typów wszedł w v2.)*
- Shader GL obraz → wideo (żywe warstwy w DOM zostają).
- Loader przy powrocie na główną (bez zmian). Produkt (04) jako realizacja. Udostępnianie, blog.

## Decyzje

Rozstrzygnięte przez użytkownika 2026-11-01 (wszystkie zgodnie z rekomendacją), razem z akceptacją reszty speca:

1. **Układ listy `/realizacje`:** dwie kolumny ze staggerem na siatce. *(Zastąpione przez decyzję 4.)*
2. **Przejście karta → projekt:** morf przez View Transitions, a gdzie ich nie ma, kurtyna.
3. **Treść stron projektów do czasu D3:** teksty DEMO do oceny wyglądu, oznaczone `demo: true`, bez liczb.
4. **2026-11-01, po v1:** użytkownik chciał ciekawszej sekcji. Wybrał „Indeks + żywy ekran” (duże nazwy projektów na liniach siatki, aktywny wiersz rysuje węzeł x, obok przyklejony ekran z żywą warstwą, na liście filtr typów; wzór: chipsa „Key clients”) i zakres „główna i lista”, strona projektu bez zmian. Prototyp w `/lab` zaakceptowany 2026-11-02 („pasuje, możemy to wrzucać”).
