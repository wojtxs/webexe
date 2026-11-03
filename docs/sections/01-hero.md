# 01 — Hero

**Status:** na głównej od 2026-11-03 (`hero-v2`, „Schemat systemu”). Do oceny użytkownika na żywo.
**Zależności:** realizacje z kolekcji (`src/content/realizacje`, DEMO do D3), żywe warstwy kadrów (`modules/live/registry.ts`), loader (`core/intro.ts`, `[data-intro]`), `split-reveal` (H1), `cursor` (etykieta), `curtain` (morf w okładkę), D9 (CTA)
**Wzorzec:** brief użytkownika z 2026-11-03 (chipsa.design, alpanet.pl, obys, cuberto, linear.app, burocratik.com). Zasady, nie kopie: skala typografii i asymetria (obys, burocratik), precyzja prawdziwych interfejsów (linear), duży tekst połączony z produktem (cuberto), redakcyjny rytm i jeden bohater (chipsa, alpanet).

## Cel

Pierwsza reakcja: „ktoś się do tej strony przyłożył”, a zarazem od razu widać firmę, która buduje poważne oprogramowanie. Wielkie hasło mówi, że budujemy i zostajemy. Pod nim nasze realizacje pracują jako jeden system: cztery moduły (warstwy oferty) na szynie danych, na tej samej siatce co cała strona.

## Koncepcje (2026-11-03)

1. **Schemat systemu (Interactive System Showcase), wybrana.** Nagłówek w skali impact w dwóch schodkowych wierszach. Pod nim szyna danych z węzłami x i cztery moduły, czyli fragmenty prawdziwych aplikacji, po jednym na warstwę oferty. Hierarchię zmienia kursor, fokus, dotyk i pokaz, a impuls na szynie niesie ją od modułu do modułu. Wejście „uruchamia system”: szyna rysuje się od lewej, na węzłach rysują się x, moduły spadają spod szyny.
2. **Wers.** Typografia na całą scenę (trzy wiersze ok. 14vw), a w jej wolnych polach (pod wydłużeniami liter i w światłach) migają kadry aplikacji. Minimum grafiki, maksimum skali. Odrzucona: ładna jako plakat, ale nie pokazuje, że budujemy systemy, i źle się czyta na telefonie.
3. **Okno ze słowem.** Mała karta na środku z wielkim słowem warstwy wtopionym w obraz, scroll rozszerza ją do pełnej sceny (mechanika alpanet). Prototyp w `/lab/hero` (nie w repo). Odrzucona: jeden kadr naraz i sticky tor 300vh to cięższy scroll i mniej „systemu”.

Wybór 1: jedyna koncepcja, w której sam układ mówi „połączone systemy”. Stoi na siatce i węzłach x (motyw przewodni), pokazuje cztery prawdziwe realizacje naraz i nie przejmuje scrolla.

## Treść

- **H1** (`BRIEF.md`, 2026-11-03): „Budujemy systemy, / które zostają.”. Drugi wiersz startuje od kolumny 4.
- **Lead** (`BRIEF.md`): pierwsze zdanie leadu, w polu pod pierwszym wierszem, obok drugiego wiersza i CTA.
- **CTA:** „Porozmawiajmy o projekcie” (`#kontakt`, wariant cta) i „Zobacz realizacje” (`#realizacje`, wariant ghost, `TODO(treść)`).
- **Moduły:** etykieta warstwy (Aplikacje, Integracje, Automatyzacje, Utrzymanie), przy aktywnym tytuł realizacji. Link modułu ma nazwę „Warstwa: tytuł realizacji”.
- Integracje i Utrzymanie to dwa fragmenty jednej realizacji („Sklep, ERP i kurierzy w jednym przepływie”, tagi Integracje × Utrzymanie): mapa połączeń oraz log zdarzeń z harmonogramem.
- `TODO(treść)`: „Zobacz realizacje”, etykiety pauzy, etykieta kursora „Zobacz realizację”, opis listy dla czytnika.

## Struktura DOM

```html
<section id="hero" class="hs theme-light" data-module="hero-system">
  <Grid nodes={false} />
  <div class="container hs__head">
    <h1 class="hs__title"><span data-split="words" data-split-intro>
      <span class="hs__line">Budujemy systemy,</span>
      <span class="hs__line hs__line--2">które zostają<span class="hs__stop">.</span></span>
    </span></h1>
    <p class="hs__lead" data-intro>…</p>
    <div class="hs__actions" data-intro><Button/> <Button variant="ghost"/></div>
  </div>
  <div class="container hs__system">
    <button class="hs__pause" data-hs-pause aria-pressed>…</button>
    <span class="hs__bus" data-hs-bus></span> <span class="hs__pulse" data-hs-pulse></span>
    <ul class="hs__strip" data-hs-strip>
      <li class="hs__seg is-active" style="--w; --fx; --fy; --zoom?" data-hs-seg>
        <p class="hs__label" aria-hidden="true"><XMark class="hs__node" draw/>
          <span data-hs-label><span class="hs__layer">Aplikacje</span><span class="hs__name">tytuł</span></span></p>
        <a class="hs__panel" href data-cursor data-morph data-morph-source data-hs-panel aria-label="Warstwa: tytuł">
          <div class="shot hs__canvas" data-hs-canvas><CaseShot/></div>
        </a>
      </li> ×4
    </ul>
  </div>
</section>
```

## Layout

```
1440                                                            390
┌──────────────────────────────────────────────────────────┐    ┌──────────────────┐
│ webexe                                 [CTA]  [ Menu ]   │    │ webexe  [ Menu ] │
│ Budujemy systemy,                                        │    │ Budujemy         │
│            które zostają.                                │    │ systemy,         │
│ lead (kol. 1–3)  [Porozmawiajmy…] [Zobacz realizacje]    │    │     które        │
│                                                    (❚❚)  │    │     zostają.     │
│ x─────────────────────────x─────────x─────────x───────── │    │ lead, CTA        │
│ Aplikacje  Kokpit floty    Integracje Automat.  Utrzym.  │    │ x Aplikacje  …   │
│ ┌──────── 6 kolumn ───────┐ ┌─2─┐ ┌─2─┐ ┌─2─┐            │    │ ┌──────────────┐ │
│ │ aktywny moduł           │ │   │ │   │ │   │            │    │ └──────────────┘ │
│ └─────────────────────────┘ └───┘ └───┘ └───┘            │    │ x Integracje ▭   │
└──────────────────────────────────────────────────────────┘    └──────────────────┘
```

- Scena `min-height: 100svh`, wiersze `auto` (nagłówek) i `1fr` (schemat). Tło Piana, siatka bez węzłów: węzłami są x na szynie.
- H1: `--t-impact` (8 rem; poniżej 992 px `--t-hero`, na telefonie znowu `--t-impact` 3,5 rem), waga, interlinia i tracking impact, `word-spacing: --ws-display`. Drugi wiersz wcięty o 3 kolumny z rynnami (tablet 2, telefon 1), liczone z `100cqi`.
- Lead w kolumnach 1–3, w wierszach 1–2 siatki nagłówka, dół równo z dołem CTA. CTA od kolumny 4, pod drugim wierszem H1.
- Moduł ma szerokość `--w` kolumn: `--w × kol + (--w − 1) × rynna`. Aktywny ma 6, pozostałe po 2, suma 12, więc szwy leżą na siatce. Szyna biegnie od środka lewej rynny siatki do środka prawej, a węzeł x stoi na szynie w rynnie przed każdym modułem.
- Kadr modułu: CaseShot w rozmiarze `--zoom` × wysokość modułu (domyślnie 1,8, Utrzymanie 2), 16:10. Punkt `--fx`, `--fy` stoi na środku modułu (`clamp`, kadr nie odsłania krawędzi). Przy zmianie szerokości kadr się nie skaluje, tylko odsłania więcej.
- Poniżej 992 px moduły stoją w pionie, a `--w` liczy wysokość (`--w × 3,5 rem`, telefon `× 2,75 rem`). Kadr liczy się z szerokości modułu (`2,2 × 100cqi`). Szyny i impulsu nie ma, a każdy moduł ma kreskę z węzłem x u góry.
- Moduły w tle hierarchii przyciemnia Głębia na 50 %.

## Interakcje i ruch

| # | Wyzwalacz | Efekt | Liczby |
|---|---|---|---|
| 1 | koniec loadera | H1 słowo po słowie spod maski (`split-reveal`), lead i CTA od dołu (loader `[data-intro]`) | jak w loaderze |
| 2 | koniec loadera | szyna rysuje się od lewej. Gdy dojdzie do węzła, rysuje się x, etykieta wchodzi, moduł spada spod szyny kurtyną, a kadr dojeżdża skalą | szyna 1,6 × `--d-enter`, `--ease-draw`, start 0,15 s; x 0,6 × `--d-enter`; etykieta +0,08 s, `--d-enter`; kurtyna +0,12 s, 1,3 × `--d-enter`; skala 1,12 → 1, 1,9 × `--d-enter`, `--ease-enter` |
| 3 | pokaz co `HOLD` | następny moduł aktywny (ruch #4) | `HOLD` 5 s, startuje po wejściu |
| 4 | zmiana modułu | wagi płyną do nowego układu, impuls (odcinek szyny w `--c-laguna-start`) jedzie od węzła poprzedniego do węzła nowego i gaśnie na końcach. Węzeł aktywny dostaje gradient, tytuł realizacji wchodzi, przyciemnienie gaśnie, kadr dojeżdża skalą. Gra tylko żywa warstwa aktywnego modułu | `--d-context`, `--ease-context`; skala 1,05 → 1, 1,2 × `--d-context`; tytuł z opóźnieniem 0,6 × `--d-context` |
| 5 | kursor nad modułem (mysz, pióro) | moduł staje się aktywny | zwłoka 0,12 s |
| 6 | kursor nad schematem | pokaz stoi (żywa warstwa gra) | — |
| 7 | ruch kursora nad aktywnym modułem (precyzyjny wskaźnik) | kadr przesuwa się przeciwnie do kursora | ±14 px poziomo, ±10 px pionowo, `quickTo` 0,6 s `power3.out` |
| 8 | fokus w module (Tab) | moduł aktywny, pokaz stoi | — |
| 9 | dotyk | pierwsze dotknięcie nieaktywnego modułu wybiera go, drugie prowadzi do realizacji | — |
| 10 | pauza | pokaz i żywa warstwa stoją, `aria-pressed` | WCAG 2.2.2 |
| 11 | klik w aktywny moduł | morf kadru w okładkę realizacji (`curtain.ts`) | jak `03-realizacje.md`, ruch #5 |
| 12 | scroll | bez przejmowania: hero ma wysokość ekranu, Manifest wchodzi normalnie, a jego węzły siatki rysują się przy wejściu. Hero poza ekranem: pokaz i żywe warstwy stoją | — |

## Reduced motion / bez JS / dotyk

- Reduced motion: bez wejścia, pokazu, impulsu, paralaksy i żywych warstw. Kursor, fokus i dotyk przełączają moduł od razu, bez przejść CSS. Pauza ukryta.
- Bez JS: pierwszy moduł aktywny (wagi w `style`), linki działają.
- Dotyk: ruch #9 zamiast #5, bez paralaksy i etykiety kursora.
- WebGL: nie używany.

## Assety

Okładki i żywe warstwy realizacji z kolekcji (DEMO do D3). Wszystkie cztery kadry są w pierwszym ekranie, więc są `eager`. Kadr ma `2,2 ×` szerokość modułu na telefonie i ok. 0,8 szerokości ekranu na desktopie, stąd `sizes="(max-width: 991px) 220vw, 80vw"`.

## Etapy implementacji

- 2026-11-03: S1 statyka i S2 ruch razem (brief: „zaimplementuj bez zatrzymywania”): `sections/Hero.astro`, `styles/sections/hero.css`, `modules/hero-system.ts`.
- Usunięte: `hero-reel.ts`, `hero-field.ts` i stary układ „Plakat + ekran” (tag `hero-v1`). `card-expand.ts` zostaje, bo używa go prototyp w `/lab`.

## Kryteria akceptacji

- 1440 i 390: nagłówek, CTA i schemat tworzą jedną kompozycję, bez poziomego scrolla, a lead nie dotyka H1.
- Przełączanie kursorem, Tabem, dotykiem i pokazem. Pauza działa z klawiatury.
- Przejście do Manifestu bez skoku i bez przejmowania scrolla.
- Konsola czysta, check, lint i build czyste.

## Decyzje otwarte

1. Ocena użytkownika na żywo: hasło, skala H1, tempo pokazu (`HOLD` 5 s).
2. Dwa przyciski CTA w pierwszym ekranie: w pasku i w hero. Czy chować CTA paska, dopóki hero jest w widoku (zmiana w `Header`, poza sekcją)?
3. „Utrzymanie” pokazuje fragment realizacji przepływów (log zdarzeń i harmonogram). Gdy będzie materiał z D3/D5 (monitoring platformy), podmienić.
