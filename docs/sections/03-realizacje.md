# 03 — Realizacje (sekcja na głównej, lista, strona projektu)

**Status:** zaakceptowany (2026-11-01), w budowie
**Zależności:** decyzja z 2026-11-01 (`PROGRESS.md`, log decyzji). Istniejące moduły: `work-live`, `tilt`, `squeeze`, `media-reveal`, `split-reveal`, `curtain`, `header`, `chapter-map`, `menu`, `cursor`. Komponenty `Grid`, `XMark`, `Button`, `Contact.astro`. Treść: **D3** (prawdziwe projekty), do tego czasu DEMO. Bez nowych zależności npm.
**Wzorzec:** `docs/INSPIRACJE.md`, wiersz „Realizacje / showcase” (z notką 2026-11-01). `docs/reference/chipsa-analiza.md`: 3 (Best works, link do wszystkich), 4.2 (`/works/[slug]`: powrót „×”, hero z mediami, bloki z tytułem, następny projekt), 5.3 (front obraz → wideo), 7.2 (przejście). `docs/reference/alpanet-analiza.md`, 3 wiersz 8 (karty realizacji na siatce, stagger kolumn ±133 px) i 4.3 (rytm). Klatek w `docs/refs/03-*/` brak.

## Cel

Na głównej odbiorca widzi trzy najmocniejsze projekty, które grają pod kursorem jak żywe aplikacje, i jednym ruchem przechodzi do wszystkich. Na liście widzi, że takich projektów jest więcej. Na stronie projektu czyta konkret: jaki był problem, co zbudowaliśmy, z czym to połączyliśmy, co było trudne i że dalej to utrzymujemy. Każdy widok kończy się kontaktem (D9).

## Treść

Z `BRIEF.md`: wiersz 03 mapy strony i D3. Poza tym `BRIEF.md` nie ma treści tych widoków, więc:

- **Projekty:** DEMO z `src/data/demo.ts` (4 fikcyjne) przenosimy do kolekcji treści (niżej). Każdy wpis ma `demo: true`. Przed wdrożeniem wpisy DEMO znikają (D3).
- **Nagłówek sekcji na głównej:** „Realizacje” (roboczo, jak dziś, `TODO(treść)`).
- **Wiersz-link:** „Wszystkie realizacje” i liczba projektów z kolekcji (`TODO(treść)`).
- **Lista:** nagłówek „Realizacje” i lead `TODO(treść)`.
- **Strona projektu, etykiety bloków (propozycja, po akceptacji trafiają do `BRIEF.md`):** Problem, Co zbudowaliśmy, Z czym połączyliśmy, Co było trudne, Utrzymanie. Fakty: Branża, Zakres, Rok, Status. Powrót: „Wszystkie realizacje”. Koniec: „Następna realizacja”.
- **Kursor nad kartą:** „Zobacz realizację” (`TODO(treść)`).
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
<!-- A. Główna, Work.astro: 3 karty + wiersz-link + technologie -->
<section id="realizacje" class="section work theme-dark" data-nav-theme="dark">
  <ol class="work__list" data-module="squeeze">
    <li class="work__item">
      <article class="work-card">
        <div class="work-card__media" data-live-card data-cursor="Zobacz realizację" data-tilt="3" data-reveal
             style="view-transition-name: case-kokpit-floty">…zrzut + żywa warstwa + toner…</div>
        <ul class="tags">…<li>Aplikacja</li><li><XMark/></li><li>Integracje</li>…</ul>
        <h3 class="work-card__title"><a class="work-card__link" href="/realizacje/kokpit-floty">Kokpit floty</a></h3>
        <p class="work-card__desc">…</p>
      </article>
    </li>
  </ol>
  <a class="work__all" href="/realizacje">
    <span class="work__all-surface" aria-hidden="true"></span>
    <span class="t-h2">Wszystkie realizacje</span><span class="t-label">4</span>
  </a>
  <div class="stack">…</div>
</section>

<!-- B. /realizacje: pages/realizacje/index.astro -->
<section id="realizacje" class="section cases theme-dark" data-nav-theme="dark">
  <h1>Realizacje</h1><p class="cases__lead">TODO(treść)</p>
  <ol class="cases__list" data-module="squeeze">…ta sama karta (WorkCard.astro)…</ol>
</section>
<Contact />

<!-- C. /realizacje/[slug]: pages/realizacje/[slug].astro -->
<section id="projekt" class="case-hero theme-dark" data-nav-theme="dark">
  <a class="case-hero__back" href="/realizacje"><XMark/> Wszystkie realizacje</a>
  <h1>Kokpit floty</h1><ul class="tags">…</ul>
  <figure class="case-hero__cover" data-live-card style="view-transition-name: case-kokpit-floty">…</figure>
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

Wspólna karta wychodzi do `components/WorkCard.astro` (główna i lista). Link w karcie jest jeden i ma nazwę z tytułu. Jego `::after` rozciąga się na całą kartę, więc karta to jeden przystanek tabulatora, a focus ring obejmuje kartę przez `:has(:focus-visible)`.

Pliki spoza sekcji:
- `Header.astro`: propsy `chapters` i `home` (na podstronach wordmark → `/`, menu → `/#id` plus pozycja „Wszystkie realizacje”). Na głównej bez zmian.
- `curtain.ts`: pomija linki z `data-morph`, gdy przeglądarka obsługuje przejścia między dokumentami (wtedy gra morf).
- `base.css`: reguła `@view-transition`.
- `ARCHITECTURE.md`: strony, kolekcja, `data-morph`, propsy Header.
- `index.astro` i `Hero.astro`: bez zmian.

## Layout

Tła: 03 na głównej Głębia (jak dziś). Lista: Głębia. Strona projektu: hero i fakty na Głębi (media świecą), opis na Pianie (długie czytanie), następna realizacja na Głębi, potem kontakt na Głębi. Granice teł są zwykłe, bez dużego momentu.

```
A. Główna 1440
| Realizacje (t-h2)                                              |
| [karta 1, kol 1–9, 16:10]                                      |
|                 [karta 2, kol 4–12]                            |   row-gap --s-24
| [karta 3, kol 1–9]                                             |
| ────────────────────────────────────────────────────────────── |   linia siatki
| Wszystkie realizacje (t-h2)                                 4  |   kol 1–12, min-height 10rem
| ────────────────────────────────────────────────────────────── |
| Technologie, na których budujemy (.stack, bez zmian)           |

B. /realizacje 1440
| Realizacje (t-impact)                                          |
| lead, kol 1–7                                                  |
| [karta A, kol 1–6]           |                                 |
|                              | [karta B, kol 7–12], +8rem      |   stagger jak Alpanet (±133 px)
| [karta C, kol 1–6]           |                                 |   row-gap --s-24
|                              | [karta D, kol 7–12], +8rem      |
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

390 (wszystkie widoki)
| kol 1 ── 4 |   karty jedna pod drugą, bez staggera, row-gap --s-16
| fakty 2 × 2 (span 2)
| etykieta bloku nad akapitami
| para: desktop, pod nim telefon (kol 2–3)
| następna: tytuł, pod nim okładka
```

834: lista ma 2 kolumny po 4 z 8, stagger `--s-16`. Fakty 2 × 2. Etykieta bloku nad tekstem. Para obok siebie (5 + 3).

Tagi wszędzie jako lista z x między pozycjami. Dziś są pisane z „·”, czego zakazuje `DESIGN.md`.

## Interakcje i ruch

Jeden moment na widok: na głównej i liście grają karty, a na stronie projektu przejście okładki. Reszta to istniejące moduły globalne.

| # | Wyzwalacz | Efekt | Liczby |
|---|---|---|---|
| 1 | Kursor albo fokus na karcie (główna, lista, następna) | Toner Głębi zdejmuje się skośnym frontem, gra żywa warstwa, tilt | jak dziś: `work-live` (`--d-enter`, `--ease-enter`), tilt 3° |
| 2 | Szybki scroll | Media kart lekko się ściskają | `squeeze`: GAIN 1.8, MAX 0.08 |
| 3 | Wejście mediów w widok | Kurtyna od góry, zoom 1.2 → 1 | `media-reveal`, `--d-enter` |
| 4 | Kursor albo fokus na wierszu „Wszystkie realizacje” | Powierzchnia Głębia raise rysuje się od lewej jak kreska x. Liczba przesuwa się o `--s-2` w lewo | `clip-path: inset(0 100% 0 0)` → `inset(0)`, `--d-enter`, `--ease-draw`; zjazd: `--d-ui`, `--ease-ui` |
| 5 | Klik karty (główna, lista, następna) | **Morf:** media karty płynnie przechodzą w okładkę strony projektu, reszta przenika się | View Transitions między dokumentami: grupa `case-<slug>` w `--d-enter`, `--ease-enter`; root: przenikanie w `--d-ui` |
| 6 | Klik innego linku między stronami | Kurtyna | `curtain` jak dziś (`--d-context`) |
| 7 | Nagłówki h1/h2 | Słowa spod maski | `split-reveal`, jak na głównej |
| 8 | Pasek systemu na podstronach | Te same stany co na głównej (zwijanie, chowanie, postęp, rozdział) | `header`, rozdziały z propsa |

## Reduced motion / bez WebGL / dotyk

- **Reduced motion:** bez morfu (reguła `@view-transition` tylko przy `no-preference`), bez kurtyny, media stoją, karty bez tonera i tiltu, wiersz-link zmienia tło bez ruchu. Treść kompletna.
- **Bez WebGL:** nie używamy WebGL.
- **Dotyk:** #1 gra karta w środkowej części ekranu (jak dziś), tap przechodzi do projektu. #4 nie ma odpowiednika hover (świadomie): wiersz ma stałe linie i wygląda klikalnie.
- **Bez JS:** wszystkie linki działają, a morf też, bo View Transitions między dokumentami to sam CSS. Karty pokazują zrzut.
- **Przeglądarka bez View Transitions** (np. Firefox): klik karty idzie przez kurtynę.

## Assety

Okładki i żywe warstwy DEMO z `src/assets/demo/`. Media do bloków: D3 (w `ASSETS.md` dopisujemy `CASE-<slug>-*`). Do sprawdzenia układu jeden projekt DEMO dostaje blok `media` z istniejącego zrzutu. Ikony technologii z `src/assets/tech/`.

## Etapy implementacji

1. **S1 statyka:** kolekcja i schemat, 4 wpisy DEMO z `demo.ts`, `WorkCard.astro`, główna z 3 kartami i wiersz-link, `/realizacje`, `/realizacje/[slug]` (`getStaticPaths`), `Contact` na podstronach, `Header` z propsami, tagi z x, SEO per strona (`title`, `description`, `og:image` z okładki). Build + visual-qa + commit `feat(realizacje): statyka`.
2. **S2 ruch DOM:** stretched link + kursor, wiersz-link (#4), moduły kart na liście i w następnej realizacji, `media-reveal` w blokach. Test init → destroy → init. Commit `feat(realizacje): ruch`.
3. **S3 przejście:** View Transitions (#5), wyjątek w `curtain.ts`, fallback kurtyny. Commit `feat(realizacje): przejście karty`.
4. **S4 mobile + reduced motion + fallbacki:** 390 / 834, dotyk, reduced motion, bez JS, Firefox. Commit `feat(realizacje): mobile i reduced motion`, tag `realizacje-v1`.

## Kryteria akceptacji

- Główna pokazuje dokładnie 3 projekty (`featured`, po `order`). Wiersz prowadzi do `/realizacje`, a liczba w nim równa się liczbie wpisów kolekcji.
- Build generuje stronę dla każdego wpisu. Każda karta prowadzi do istniejącej strony, a ostatnia realizacja ma jako następną pierwszą.
- Karta to jeden przystanek tabulatora z nazwą z tytułu. Focus ring obejmuje kartę.
- Strona projektu ma jeden `h1`, `h2` w każdym bloku z tytułem i `alt` na każdym obrazie. Link „Wszystkie realizacje” jest pierwszym elementem treści po pasku.
- Na podstronach wordmark prowadzi do `/`, CTA do `#kontakt` na tej samej stronie, a pozycje menu do istniejących celów.
- Edge: klik karty przenosi media w okładkę (morf) bez kurtyny. Bez View Transitions działa kurtyna. Reduced motion: zwykła nawigacja.
- Stagger listy: 8 rem na desktopie, 4 rem na 834, brak poniżej 768.
- Pole faktu bez wartości się nie renderuje. Wpisy z `demo: true` wypisują ostrzeżenie w buildzie.
- CLS 0 (okładki i media mają wymiary z `astro:assets`).
- Plus DoD ze skilla `build-section`.

## Poza zakresem

- Prawdziwe projekty, nagrania i opisy (D3).
- Filtry i kategorie na liście (wracamy przy ponad 8 projektach). Paginacja.
- Shader GL obraz → wideo (żywe warstwy w DOM zostają).
- Loader przy powrocie na główną (bez zmian). Produkt (04) jako realizacja. Udostępnianie, blog.

## Decyzje

Rozstrzygnięte przez użytkownika 2026-11-01 (wszystkie zgodnie z rekomendacją), razem z akceptacją reszty speca:

1. **Układ listy `/realizacje`:** dwie kolumny ze staggerem na siatce.
2. **Przejście karta → projekt:** morf przez View Transitions, a gdzie ich nie ma, kurtyna.
3. **Treść stron projektów do czasu D3:** teksty DEMO do oceny wyglądu, oznaczone `demo: true`, bez liczb.
