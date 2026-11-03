# 01 — Hero

**Status:** na głównej od 2026-11-03 (`hero-v1`), przyjęte przez użytkownika „na razie”: napisze, co z ruchu wyrzucić albo zmienić
**Zależności:** realizacje z kolekcji (`src/content/realizacje`, DEMO do D3), żywe warstwy kadrów (`modules/live/registry.ts`), loader (`core/intro.ts`), `card-expand`, `curtain` (morf w okładkę), D9 (CTA)
**Wzorzec:** `INSPIRACJE.md`, wiersz Hero (Alpanet: karta rozszerzana scrollem do pełnego kontenera). Kurtyna i zoom kadrów jak w indeksie realizacji (`03-realizacje.md`, ruch #1).

## Cel

W pierwszej sekundzie: software house, który buduje i zostaje. Wielki nagłówek mówi to wprost, a obok od razu widać nasze realizacje w działaniu: ekran pokazuje po kolei żywe aplikacje. Klik w ekran prowadzi do projektu, a scroll do Manifestu.

## Treść

- **H1** (`BRIEF.md`): „Budujemy oprogramowanie dla firm i zostajemy przy nim na lata.” Łamanie na desktopie: **„Budujemy oprogramowanie dla firm / i zostajemy przy nim na lata.”** (`BRIEF.md` od 2026-11-03, wcześniej 4 wiersze).
- **Lead** (`BRIEF.md`, 2026-11-01) bez zmian.
- **CTA w hero:** brak. Użytkownik 2026-11-02: przycisk pod leadem „do wyrzucenia”. CTA zostaje w pasku (D9).
- **Pokaz:** tytuły i tagi realizacji z kolekcji.
- `TODO(treść)`: etykieta kursora „Zobacz realizację”, etykiety pauzy („Zatrzymaj / Wznów pokaz realizacji”), etykiety odcinków („Pokaż realizację N: tytuł”), opis figury dla czytnika.
- Etykiety warstw (Aplikacje, Integracje, Automatyzacje, Utrzymanie) nie występują już w hero. Zamiast nich pod nazwą projektu stoją jego tagi. Loader nadal ma wiersz warstw.

## Struktura DOM

```html
<section id="hero" class="hp theme-light sticky-track"
         data-module="card-expand hero-reel" data-card-expand-leave>
  <Grid nodes={false} />
  <div class="sticky-item hp__stage">
    <canvas class="hp__field" aria-hidden="true" data-module="hero-field"></canvas>
    <div class="container hp__inner">
      <h1 class="hp__title" data-card-expand="fade">
        <span data-split="words" data-split-intro>… <br class="br-d" /> …<span class="hp__stop">.</span></span>
      </h1>
      <div class="hp__lead-box" data-card-expand="fade"><p class="hp__lead" data-intro>…</p></div>
      <div class="hp__window" data-card-expand="window" aria-hidden="true"></div>
      <figure class="hp__card" data-card-expand="card" data-tilt="3" data-cursor="…">
        <div class="hp__screen" data-reel-screen>
          <a class="shot hp__shot" data-reel-shot data-morph data-morph-source tabindex="-1" aria-hidden="true">CaseShot</a> ×N
        </div>
      </figure>
      <div class="hp__reel-box" data-card-expand="fade">
        <div class="hp__reel" role="group" aria-roledescription="pokaz" data-intro>
          <div class="hp__items" aria-live="off" data-reel-live>
            <div class="hp__item" data-reel-item><a data-morph>tytuł</a><Tags /></div> ×N
          </div>
          <ol class="hp__segs"><li><button data-reel-seg aria-current><span data-reel-fill></span></button></li> ×N</ol>
          <div class="hp__reel-head"><p>01 / 0N</p><button data-reel-pause aria-pressed></button></div>
        </div>
      </div>
    </div>
  </div>
</section>
```

Opakowania `data-card-expand="fade"` są osobne od elementów z wejściem (`data-split`, `data-intro`), żeby tween zanikania nie zapamiętał opacity 0 spod loadera.

## Layout

```
1440                                                         390
┌───────────────────────────────────────────────────────┐    ┌──────────────────┐
│ webexe                         [CTA]  [ Menu ]         │    │ webexe  [ Menu ] │
│ Budujemy oprogramowanie dla firm                       │    │ Budujemy         │
│          i zostajemy przy nim na lata.                 │    │ oprogramowanie   │
│ Lead (kol. 1–4)  ┌───────────────────────────────────┐ │    │ dla firm         │
│                  │ ekran: realizacja N (kol. 5–12)   │ │    │ i zostajemy…     │
│                  │                                   │ │    │ Lead             │
│ Tytuł projektu   │                                   │ │    │ ┌──────────────┐ │
│ tag × tag        │                                   │ │    │ │ ekran        │ │
│ ━━━ ─── ─── ───  │                                   │ │    │ └──────────────┘ │
│ 01 / 04     (❚❚) └───────────────────────────────────┘ │    │ 01/04 Tytuł (❚❚) │
└───────────────────────────────────────────────────────┘    │ ━━━ ─── ─── ───  │
                                                             └──────────────────┘
```

- Tło Piana, siatka bez węzłów (węzły daje `hero-field`), motyw nawigacji jasny.
- H1: `--t-hero` (4,75 rem desktop, 4,5 rem tablet, 2,5 rem telefon), waga i interlinia H1, `word-spacing: --ws-display`, kropka dosunięta `--kern-stop`. Na desktopie drugi wiersz wcięty o kolumnę siatki (`padding-left` + ujemny `text-indent` liczone z `100cqi`).
- Wiersz 2 siatki: lead u góry kolumn 1–4, pokaz u dołu kolumn 1–4, ekran na kolumnach 5–12 (`1fr` wysokości sceny). Poniżej 992 px: nagłówek, lead, ekran (`1fr`), pokaz w jednym wierszu z postępem pod spodem.
- 834: jak telefon, H1 w 4 wierszach, ekran wyższy.

## Interakcje i ruch

| # | Wyzwalacz | Efekt | Liczby |
|---|---|---|---|
| 1 | koniec loadera (`introDone`) | H1 słowo po słowie spod maski, lead i pokaz od dołu (loader), ekran kurtyną od dołu z dojazdem skali kadru | słowa: `--d-enter`, stagger 0,04 s; ekran: `inset(100% 0 0 0)` → `0`, 1,4 × `--d-enter`; skala 1,12 → 1, 1,6 × `--d-enter`, `--ease-enter` |
| 2 | co `HOLD` | następna realizacja: kurtyna od dołu (wstecz od góry), skala 1,12 → 1, stary tytuł w górę i znika, nowy od dołu; odcinek aktywnego projektu wypełnia się przez cały pokaz | `HOLD` 6 s; kurtyna i skala `--d-enter`, `--ease-enter`; tytuł ±40 % wysokości, nowy z opóźnieniem 0,15 × `--d-enter` |
| 3 | kursor nad ekranem lub pokazem, fokus w pokazie | pokaz stoi (żywa warstwa gra dalej) | — |
| 4 | przycisk pauzy | pokaz i żywa warstwa stoją, `aria-pressed`, zmiany ogłaszane (`aria-live="polite"`) | WCAG 2.2.2 |
| 5 | klik w odcinek | od razu ten projekt (ruch #2), ogłoszenie zmiany | — |
| 6 | ruch kursora (precyzyjny wskaźnik) | węzły x na granicach kolumn w promieniu kursora wyrastają ze środka w Lagunie, dalsze mniejsze i bledsze | krok = szerokość kolumny + gap; promień 2,6 kroku, pełna jasność do 0,3 promienia; wygładzanie kursora 0,16, węzłów 0,12 na klatkę (60 fps); węzeł 0,45 rem, kreska 0,09 rem |
| 7 | kursor nad ekranem | przechył ekranu i etykieta kursora | ±3°, gaśnie z `--expand` |
| 8 | scroll, tor 300vh | ekran rośnie z okna do pełnej sceny (do dolnej krawędzi okna), nagłówek, lead i pokaz gasną | progres 0–0,5 rozszerzenie, 0–0,25 zanikanie, `scrub` |
| 9 | scroll, dalej | pełna scena stoi, pokaz gra dalej | progres 0,5–0,7 |
| 10 | scroll, koniec toru | ekran odjeżdża w górę szybciej niż scroll i odsłania Manifest, który wsuwa się pod ostatni ekran toru (`margin-top: -100vh`) | progres 0,7–1, `--leave` 0 → 1 (`translate` −100vh), `power1.in` |
| 11 | klik w ekran albo tytuł projektu | morf kadru w okładkę projektu (View Transitions, `curtain.ts`) | jak `03-realizacje.md`, ruch #5 |

## Reduced motion / bez WebGL / dotyk

- Reduced motion: bez toru (hero na wysokość ekranu), bez wejścia, pokazu, kurtyny, żywych warstw i siatki; ekran stoi w oknie z pierwszym projektem, odcinki przełączają od razu, pauza ukryta. Manifest zaczyna się normalnie pod hero.
- Bez JS: jak reduced motion, odcinki nie działają (pierwszy projekt, linki działają).
- Dotyk: bez siatki (#6), bez przechyłu i etykiety kursora. Pokaz, pauza i odcinki działają.
- WebGL: nie używany (siatka to canvas 2D).

## Assety

Okładki i żywe warstwy realizacji z kolekcji (`src/assets`, `components/live/*`), DEMO do D3. Kadry mają rozmiar pełnej sceny (okno to przycięcie), więc `sizes` liczy się dla sceny: desktop `100vw`, poniżej 992 px `150vh` (`cover` 16:10). Pierwszy kadr `eager`, reszta `lazy`; cztery pliki 2048 px ważą razem ok. 0,5 MB.

## Etapy implementacji

- S1 statyka + S2 ruch: prototyp w `/lab/hero` (2026-11-02), od 2026-11-03 na głównej: `sections/Hero.astro`, `styles/sections/hero.css`, `modules/hero-reel.ts`, `modules/hero-field.ts`, faza wyjścia w `card-expand.ts`, wybór kadru morfu w `curtain.ts`.
- Usunięte razem z podmianą: stare `Hero.astro` i `hero.css` (karta z kokpitem floty i etykietami warstw), `hero-live.ts`, `demoHero`, kanał powiadomień w `FlotaLive` (`feed`), strona `/lab/hero`. Stan sprzed podmiany: tag `realizacje-v2`.

## Kryteria akceptacji

- Nagłówek w 2 wierszach na 1440 i 1920, bez sklejonych słów, kropka przy ostatnim słowie, sierotki „i” przeniesione.
- Pokaz przełącza 4 projekty, pauza i odcinki działają z klawiatury, ekran stoi pod kursorem.
- Morf z ekranu hero i z indeksu realizacji leci z widocznego kadru.
- init → destroy → init bez przyrostu ScrollTriggerów, konsola czysta, check, lint i build czyste.

## Poza zakresem

Nagranie wideo projektu (D3), żywy widget platformy (D5), zmiana stylu przycisku CTA w pasku.

## Decyzje otwarte

1. Co z czterech elementów ruchu zostaje (użytkownik: „spróbujmy wszystkiego, napiszę, co wyrzucić”).
2. Etykiety warstw: wracają gdzieś w hero czy zostają tylko w loaderze?
3. Przycisk CTA w pasku (ta sama gradientowa pigułka co usunięta z hero): zostaje czy zmienia styl?
