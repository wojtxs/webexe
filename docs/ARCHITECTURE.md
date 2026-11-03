# ARCHITECTURE — webexe

Model: **serwerowy HTML + zachowania w JS podpinane przez `data-*`**. Astro generuje statyczny HTML, a nasze moduły TS dokładają ruch. Mechanikę sekcji opisuje `docs/INSPIRACJE.md`, a techniki referencji `docs/reference/`. Tam, gdzie referencje robią coś słabo (waga, reduced motion, alty), robimy lepiej.

## Struktura

```
src/
  pages/            index.astro · realizacje/index.astro (lista) · realizacje/[slug].astro (strona projektu, getStaticPaths)
                    · polityka-prywatnosci.astro · 404.astro · lab/[...].astro (sandbox, noindex, tylko dev)
  content/          realizacje/*.md (frontmatter: schemat w content.config.ts, kolekcja „realizacje”, loader glob)
  data/             realizacje.ts (getRealizacje, featuredOf, nextOf, caseHref, morphName) · tech.ts + tech-keys.ts
                    (rejestr ikon technologii) · demo.ts (DEMO poza realizacjami) · typo.ts (noOrphans: twarde spacje)
  layouts/          Base.astro (head, fonty, nav, loader, kursor, scroll indicator)
  sections/         Hero.astro · Manifest.astro · Work.astro · Product.astro · HowWeWork.astro · About.astro · Contact.astro
  components/       Button.astro · Wordmark.astro · XMark.astro · Grid.astro (siatka z węzłami x) · Header.astro
                    · Curtain.astro · WorkIndex.astro (indeks realizacji z żywym ekranem) · CaseShot.astro (kadr:
                    zrzut, żywa warstwa, toner) · Tags.astro · …
  styles/           tokens.css · fluid.css · base.css · utils.css · sections/*.css
  core/
    app.ts          bootstrap: fonty → scroll → moduły → loader
    lifecycle.ts    rejestr modułów, init/destroy, skan [data-module]
    scroll.ts       Lenis + gsap.ticker + ScrollTrigger, lenisStart/Stop
    motion.ts       gsap.matchMedia: kontekst „full” i „reduced”
    events.ts       mała szyna zdarzeń (app:ready, app:resize, nav:open)
    css.ts          cssVar() (cssColor() wraca dopiero razem z GL)
  modules/          card-expand.ts · scroll-fill.ts · x-zoom.ts · split-reveal.ts · media-reveal.ts · cursor.ts · tilt.ts
                    · header.ts · menu.ts · chapter-map.ts · nav-theme.ts · curtain.ts · work-index.ts · work-live.ts
                    · hero-reel.ts · hero-field.ts · squeeze.ts (nieużywany od realizacji v2) · live/*.ts (żywe warstwy;
                    registry.ts: kadry realizacji dla work-index, work-live i hero-reel) · …
  gl/               tylko wtedy, gdy spec sekcji wymaga WebGL (patrz „GL (opcjonalny)”)
public/
  media/              nagrania i postery: hero, work, product (D3)
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

- `lifecycle.ts` skanuje `[data-module]`, importuje moduł dynamicznie (`import()`, code-splitting) i woła `init(el)` na osobnej instancji (`Object.create(module)`). Moduł w `init` przypisuje `this.destroy`, więc ten sam moduł może stać na stronie kilka razy (np. `work-live` w hero projektu i w następnej realizacji), a każdy element wycofuje własny kontekst.
- Pasek systemu (`Header.astro`, moduły `header nav-theme menu`) ma propsy dla podstron: `chapters` (rozdziały tej strony w komórce paska), `home={false}` (wordmark prowadzi na `/`, menu do `/#id` i do `/realizacje`) i `top="dark"` (kolory paska od pierwszej klatki, zanim `nav-theme` sprawdzi tło; ważne przy morfie, kiedy nowej strony nie zakrywa kurtyna).
- Każdy moduł tworzy animacje w `const ctx = gsap.context(() => { … }, root)`, a w `destroy()` woła `ctx.revert()`. Odpina też listenery, `ResizeObserver` i `IntersectionObserver`.
- Nie ma routera SPA. Każda strona to osobny dokument, a przejścia między nimi robi `curtain` (kurtyna) albo przeglądarka (View Transitions między dokumentami, sam CSS: zgoda `@view-transition` inline na początku `<head>` w `Base.astro`, czasy w `base.css`). Zgoda stoi inline, bo z arkusza przeglądarka bywała pytana o nią, zanim arkusz doszedł, i odrzucała przejście. Kadr na ekranie indeksu realizacji (i kadr następnej realizacji) dostaje `view-transition-name` w chwili kliknięcia (`data-morph`), okładka projektu ma tę nazwę na stałe, więc media przechodzą w okładkę (morf). Pozostałe nawigacje `curtain` pomija w `pageswap` (`skipTransition()`), tam gra kurtyna. Bez View Transitions (Firefox) też kurtyna, przy reduced motion zwykła nawigacja. Kontrakt `init/destroy` zostaje na wypadek routera.

## API atrybutów `data-*`

| Atrybut | Znaczenie |
|---|---|
| `data-module="hero"` | inicjalizuje `modules/hero.ts` na tym elemencie |
| `data-gl="…"` | tylko z GL: element, z którym synchronizuje się scena |
| `data-nav-theme="light\|dark"` | motyw nawigacji, gdy sekcja jest pod navem |
| `data-sticky` | `.sticky-track` z progresem dla ScrollTriggera |
| `data-card-expand="card\|window\|fade"` | części `card-expand`: karta, okno startowe (prostokąt z siatki CSS), treść gasnąca pod kartą |
| `data-card-expand-leave` | `card-expand` (na root): faza wyjścia, po rozszerzeniu karta stoi, potem odjeżdża w górę (`--leave`), a następna sekcja wchodzi pod ostatni ekran toru (`.has-leave`) |
| `data-reel-screen` · `data-reel-shot` | `hero-reel`: ekran pokazu (kurtyna) i kadry realizacji na nim, po jednym na projekt |
| `data-reel-item` · `data-reel-live` | `hero-reel`: nazwa i tagi projektu (ta sama kolejność co kadry) i ich wspólne opakowanie z `aria-live` (ogłaszanie po wyborze ręcznym) |
| `data-reel-seg` · `data-reel-fill` · `data-reel-count` · `data-reel-pause` | `hero-reel`: przycisk projektu z paskiem postępu, licznik, przycisk pauzy (`aria-pressed`) |
| `data-x-zoom="mark"` | opakowanie znaku x skalowane przez `x-zoom` |
| `data-scroll-fill="text"` | akapit wypełniany scrollem słowo po słowie przez `scroll-fill` (tylko Manifest) |
| `data-split="lines"` + `data-split-delay="0.2"` | reveal linii (SplitText, maska `clip-path`) |
| `data-btn-roll` | hover „roll” na znakach przycisku |
| `data-marquee` + `-speed` / `-direction` | marquee (pauza przez IntersectionObserver) |
| `data-hide="d\|t\|m"` | ukrywanie per breakpoint |
| `data-feature="live-stats"` | element za feature flagą (`PUBLIC_FEATURE_LIVE_STATS`) |
| `data-reveal` + `data-reveal-zoom` | `media-reveal`: kurtyna od góry na mediach, zoom 1.2 → 1 na wnętrzu |
| `data-tilt="3"` + `data-tilt-area` | `tilt`: przechył za kursorem do podanego kąta (°), opcjonalnie względem innego prostokąta |
| `data-cursor="etykieta"` | `cursor`: etykieta kursora nad elementem |
| `data-live-card` | `work-live`: kadr następnej realizacji z żywą warstwą, gra pod kursorem (toner zdejmuje się frontem) |
| `data-live-card="view"` | `work-live`: okładka projektu, gra w widoku jak wideo, bez tonera i kursora |
| `data-squeeze` | `squeeze`: kadr dostaje `--squeeze` (ściskanie przy szybkim scrollu); zmienna bez dziedziczenia (`@property`), więc przelicza się sam kadr. Od realizacji v2 nigdzie nieużywany |
| `data-live-host` | `work-live`: fokus w środku (link) gra kadr hosta |
| `data-index-list` · `data-index-row` | `work-index`: lista i wiersze indeksu realizacji. Wiersz niesie `data-tags` (typy rozdzielone pionową kreską, dla filtra) i `data-summary` (podpis pod ekranem) |
| `data-index-aside` · `data-index-shot` · `data-index-caption` | `work-index`: kolumna ekranu (jej wysokość wyznacza linię aktywności na mobile), kadry na ekranie (po jednym na wiersz, ta sama kolejność), podpis aktywnego projektu |
| `data-filter="Typ"` | `work-index`: przycisk filtra (`aria-pressed`); pusta wartość to „Wszystkie” |
| `data-morph="case-<slug>"` | `curtain`: link przechodzi do projektu morfem (View Transitions), a nie kurtyną |
| `data-morph-source="case-<slug>"` | `curtain`: element, który w chwili kliknięcia dostaje `view-transition-name` (kadr na ekranie indeksu, kadr następnej realizacji) |

Nowy atrybut dopisujesz najpierw do tej tabeli, potem do kodu.

## Scroll

- Lenis z `autoRaf: false` jest napędzany przez `gsap.ticker`, wywołuje `lenis.on('scroll', ScrollTrigger.update)` i ma `gsap.ticker.lagSmoothing(0)`.
- Przypięcia robimy przez `.sticky-track` (wysokość np. `200vh`) z `.sticky-item` (`position: sticky; top: 0; height: 100vh`). Progres liczy ScrollTrigger z `scrub: true`. **Nigdy `pin: true`.**
- Jeden `gsap.ticker` na wszystko (scroll, kursor, prędkość scrolla). Bez osobnych pętli rAF w modułach.
- Przy reduced motion Lenis się nie startuje i działa natywny scroll.

## Tekst

- SplitText 3.13+ dzieli tekst na linie albo słowa z maską `clip-path` i uruchamia się dopiero po `document.fonts.ready`.
- Dostępność: najpierw sprawdź wbudowaną obsługę `aria` w SplitText (aktualne docs przez Context7). Jeśli nie wystarcza, oryginalny tekst idzie do `.sr-only`, a animowana kopia dostaje `aria-hidden`.

## Wideo

- `<video muted loop playsinline>` z dwoma źródłami (AV1 w MP4, potem zwykłe MP4) i posterem. Wymiary w atrybutach, żeby nie było CLS.
- Ładowanie leniwe: `preload="none"` albo `metadata`, `src` podpinany przez IntersectionObserver. Odtwarzanie tylko w widoku, pauza po wyjściu.
- Mobile dostaje osobne, lżejsze pliki. Reduced motion: wideo nie startuje, widać poster.

## GL (opcjonalny)

Bazowy stack jest bez WebGL. three.js dochodzi tylko wtedy, gdy spec sekcji uzasadni efekt, którego nie da się zrobić w DOM, CSS albo wideo, i wtedy jak nowa zależność (zasada 8 w `CLAUDE.md`). Dziś jedynym kandydatem jest przejście obraz → wideo na kadrach realizacji (03) przy `(hover: hover) and (pointer: fine)`.

Jeśli GL wejdzie:

- **Jeden renderer, jeden canvas.** Sceny włączają się tylko na urządzeniach z `(hover: hover) and (pointer: fine)`, a w pozostałych przypadkach działa wersja DOM.
- **Pixel ratio:** desktop `min(dpr, 1.25)`, mobile `min(dpr, 1.5)`.
- Scena renderuje się tylko wtedy, gdy jej element jest w viewporcie (IntersectionObserver).
- Kolory zawsze przez `cssColor('--c-…')`. Parametry w `gl/params.ts`, strojenie w `lil-gui` pod `?debug`.
- Obsługujemy `webglcontextlost` / `restored`. Bez WebGL sekcja jest kompletna w wersji DOM.

## Ładowanie

1. **Krytyczne dla hero** są fonty i poster karty hero. Tylko na to czeka loader.
2. **Twardy limit loadera to 2.5 s.** Wideo hero startuje, kiedy będzie gotowe, a do tego czasu widać poster.
3. **Pozostałe media** ładujemy leniwie, gdy ich element jest w odległości 1.5 viewportu.
4. H1 jest w DOM-ie od pierwszego renderu i na nic nie czeka.
5. Assety mają hash albo wersję w nazwie, długi cache i są self-hostowane.
6. Do startu modułów elementy z wejściem (`[data-split]`, `[data-reveal]`) ukrywa `html.js-motion`. Klasę zdejmuje stały fallback 3 s w `Base.astro`, a nie start modułu. Moduł nie może więc kończyć wejścia przez `clearProps`, bo do 3 s reguła ukryje element z powrotem. Zostawia stan końcowy inline (`opacity: 1`, `clip-path: none`), a revert kontekstu go zdejmuje.
7. W trakcie View Transition (morf realizacji) hit-testing trafia tylko w `<html>`, pod którym leżą pseudo-elementy przejścia. Moduł, który na starcie pyta `elementsFromPoint` (np. `nav-theme`), traktuje taki wynik jako nieznany i pyta w następnej klatce.

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

`npm run build` daje statyczny `dist/`. Trafia do obrazu Docker z serwerem statycznym (nginx albo Caddy), który działa na naszym VPS. Konfiguracja obrazu powstaje w F7. Kompresja brotli/gzip, `Cache-Control: immutable` dla `/_astro/*` i `/media/*`, krótki cache dla HTML. HTTP/2 albo HTTP/3.
