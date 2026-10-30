# 02 — Manifest

**Status:** done (2026-10-30), poza trace 60 fps w Chrome DevTools (na tym komputerze nie ma Chrome, patrz log sesji w `PROGRESS.md`)
**Zależności:** F3 (greybox: `src/sections/Manifest.astro`, `src/modules/x-zoom.ts`), komponenty `Grid` i `XMark`. Bez assetów i bez decyzji z `BRIEF.md`.
**Wzorzec:** `docs/INSPIRACJE.md`, wiersz „Struktura strony” i konflikt 2 (wypełnianie scrollem tylko w Manifeście). `docs/reference/alpanet-analiza.md`, sekcja 3: wiersz 2 (Manifest, tekst zapełnia się słowo po słowie) i wiersz 7 (sticky 100vh, koło skaluje się 1 → 100 i staje się tłem). Klatek w `docs/refs/02-*/` brak (F0 otwarte).

## Cel

Odbiorca czyta problem, który zna z własnej firmy, i naszą odpowiedź na niego. Scroll wypełnia tekst w tempie czytania, a znak x na końcu prowadzi go przez swój środek do realizacji, czyli do dowodu, że ta odpowiedź działa. Sekcja nie ma CTA: prowadzi do 03, a stamtąd do kontaktu.

## Treść

Z `BRIEF.md`, 1:1:

- **Problem:** Większość firmowego oprogramowania powstaje raz i zostaje bez opieki. Po kilku latach nikt nie wie, jak działa, a każda zmiana jest ryzykiem.
- **Odpowiedź:** My budujemy tak, żeby dało się to rozwijać latami. I sami to rozwijamy.
- **Słowo-akcent:** „latami” (Comfortaa 700, małe litery, gradient Laguna, zgodnie z `DESIGN.md`).

Nagłówek sekcji `<h2>` „Manifest” jest tylko dla czytników ekranu (`.sr-only`), bo `BRIEF.md` nie daje widocznego nagłówka.

## Struktura DOM

```html
<section id="manifest" class="manifest theme-light" data-nav-theme="light" aria-labelledby="manifest-title">
  <div class="grid-sys" aria-hidden="true">…</div>                       <!-- Grid.astro, węzły na górnej granicy -->

  <div class="container manifest__body" data-module="scroll-fill">
    <h2 id="manifest-title" class="sr-only">Manifest</h2>
    <p class="manifest__problem t-h3" data-scroll-fill="text">Większość …</p>
    <p class="manifest__answer t-h2" data-scroll-fill="text">My budujemy … <span class="accent">latami</span>. I sami to rozwijamy.</p>
  </div>

  <div class="xzoom sticky-track" data-module="x-zoom">                   <!-- tor 250vh -->
    <div class="sticky-item xzoom__stage">
      <div class="xzoom__mark" data-x-zoom="mark"><svg class="xmark">…</svg></div>
    </div>
  </div>
</section>
```

Nowy atrybut `data-scroll-fill="text"` trafia do tabeli w `ARCHITECTURE.md` przed kodem.

## Layout

Tło Piana (`theme-light`), siatka: linie `--c-piana-line`, węzły `--c-piana-deep`. Motyw nawigacji `light`. Układ z greyboxu F3 (zaakceptowany 2026-10-30).

```
1440
| kol 1 ─────────── 7 |                                    |
| Problem (t-h3, 32 px, --c-ink-muted)                     |
|                                                          |
|             | kol 4 ───────────────────────────── 12 |   |
|             | Odpowiedź (t-h2, 56 px, Głębia)         |   |
|             | … rozwijać latami. I sami to rozwijamy. |   |
|                                                          |
| ─────────── tor x-zoom 250vh, scena sticky 100vh ─────── |
|                          x                               |   x: 8 rem (128 px), kreska 16 px, Głębia
|                   (środek ekranu)                        |

390
| kol 1 ── 4 |
| Problem    |   t-h3 (24 px)
| Odpowiedź  |   t-h2 (32 px)
|     x      |   x: 5 rem (80 px)
```

- Padding górny bloku tekstu `--s-32`, odstęp problem → odpowiedź `--s-16`. Bez dolnego paddingu: tor x-zoom zaczyna się zaraz pod tekstem, a jego ostatnia klatka przechodzi bez szwu w 03.
- 834: jak 390 (tekst na całą szerokość), x 6 rem.

## Interakcje i ruch

Cały ruch jest sterowany scrollem (`scrub`), nic nie gra samo. Bez `pin`, tylko `.sticky-track`.

| # | Wyzwalacz | Efekt | Liczby |
|---|---|---|---|
| 1 | Scroll przez akapit „Problem” | Słowa wypełniają się po kolei: krycie każdego słowa 0.2 → 1 | SplitText `words`; `start: 'top 75%'`, `end: 'bottom 45%'`; `scrub: true`; `stagger` po słowach, `ease: 'none'` |
| 2 | Scroll przez akapit „Odpowiedź” | Jak #1, osobny przebieg. „latami” wypełnia się razem z resztą (krycie na całym słowie z gradientem) | jak #1 |
| 3 | Wejście toru x-zoom (`top top`) | Dwie kreski x rysują się od środka na zewnątrz, druga z opóźnieniem | DrawSVG `50% 50%` → `0% 100%`; kreska 1: progres toru 0–0.2, kreska 2: 0.1–0.3, `ease: 'none'` |
| 4 | Dalszy scroll toru | Pauza: x stoi narysowany | progres 0.3–0.4 |
| 5 | Dalszy scroll toru | Zoom przez punkt przecięcia: x skaluje się, aż kreski w Głębi zakryją cały ekran | progres 0.4–0.95, `scale` 1 → `max(vw, vh) / √2 / grubość kreski × 1.2` (liczone przy refresh), `ease: 'power2.in'` |
| 6 | Koniec toru | Ekran w całości w Głębi, przejście w 03 bez szwu | progres 0.95–1 |

Wysokość toru: 250vh na desktopie i tablecie, 200vh poniżej 768 px.

## Reduced motion / bez WebGL / dotyk

- **Reduced motion** (`gsap.matchMedia` przez `addMotion`): tekst w pełni wypełniony od początku, bez SplitText. Tor x-zoom ma wysokość `auto`, scena nie jest sticky, x stoi narysowany w 8 rem z paddingiem `--s-24`, potem zwykła granica z ciemną sekcją 03. Lenis wyłączony (globalnie).
- **Bez WebGL:** sekcja nie używa WebGL.
- **Dotyk:** brak interakcji hover. Scrub działa tak samo na natywnym scrollu i na Lenisie.
- **Bez JS:** tekst w pełni widoczny, x narysowany, tor ma 250vh (scena sticky z nieruchomym x).

## Assety

Brak. Znak x to `XMark.astro` (do czasu D8: ten sam kształt co x w wordmarku, dwie kreski o zaokrąglonych końcach).

## Etapy implementacji

1. **S1 statyka:** greybox z F3 dopięty do speca: rozmiar x 8 / 6 / 5 rem, tor 200vh poniżej 768 px, `data-scroll-fill` w DOM i w tabeli `ARCHITECTURE.md`. Build + commit `feat(manifest): statyka`.
2. **S2 ruch DOM:** nowy moduł `scroll-fill.ts` (SplitText `words`, `aria` według aktualnych docs SplitText, scrub krycia), `x-zoom.ts` według tabeli (już prawie zgodny). Test init → destroy → init. Build + commit `feat(manifest): ruch`.
3. **S3 GL:** nie dotyczy.
4. **S4 mobile + reduced motion + fallbacki:** sprawdzenie 390 / 834, reduced motion, brak JS, resize w trakcie toru (refresh skali). Build + commit `feat(manifest): mobile i reduced motion`, tag `manifest-v1`.

## Kryteria akceptacji

- Każde słowo obu akapitów jest w pełni wypełnione, zanim akapit dojdzie do 45% wysokości ekranu (od góry), a w momencie wejścia akapitu w widok (75%) wszystkie słowa mają krycie 0.2.
- „latami” ma gradient Laguna także w stanie niewypełnionym (krycie 0.2), bez przeskoku koloru.
- Czytnik ekranu czyta każdy akapit jako jedno zdanie, a nie słowo po słowie.
- Przy progresie toru 0.95 żaden piksel viewportu nie ma koloru Piany (sprawdzone na 1920 × 1080, 1440 × 900, 834 × 1112 i 390 × 844, także po resize w trakcie toru).
- Przejście 02 → 03 bez widocznego szwu i bez przeskoku tła.
- Reduced motion: zero ruchu, tekst kompletny od początku, x widoczny.
- Plus DoD ze skilla `build-section`.

## Poza zakresem

- Mapa rozdziałów, zmiana motywu nawigacji na ciemny po zoomie i stałe CTA (F6).
- Loader i x w loaderze (F6).
- Ostateczny kształt x z wordmarku (D8).
- Tokeny trzech temp z Chipsy i natywny scroll na dotyku (decyzja przy specu hero). Manifest ma tylko scrub, więc nie potrzebuje tokenów czasu.

## Decyzje

Rozstrzygnięte przez użytkownika 2026-10-30 (wszystkie zgodnie z rekomendacją):

1. **Stan niewypełniony:** krycie 0.2 tej samej barwy, jeden mechanizm także dla „latami” z gradientem.
2. **Wypełniony „Problem”:** `--c-ink-muted` (problem ciszej, odpowiedź w Głębi).
3. **Znak x:** osobno pod tekstem, na środku sceny sticky.
4. **Kolor x:** Głębia przez cały czas.

**Dostępność podziału (z kodu SplitText 3.15):** `aria: 'auto'` stawia `aria-label` na `<p>`, a słowa dostają `aria-hidden`. Nazwa na akapicie nie jest wspierana przez ARIA (rola `paragraph`), więc czytniki mogą przeczytać pustkę. Zgodnie z `ARCHITECTURE.md` (Tekst) moduł tworzy `.sr-only` z pełnym tekstem, a dzieloną kopię oznacza `aria-hidden`. Robi to tylko w trybie z ruchem.
