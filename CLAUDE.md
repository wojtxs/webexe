# webexe — strona firmowa

Czytasz ten plik na starcie każdej sesji. Szczegóły leżą w `docs/`. Czytaj je wtedy, gdy zadanie ich dotyczy, a nie wszystkie naraz.

## Projekt

Strona firmowa webexe: dwuosobowy zespół, dedykowane aplikacje, automatyzacja procesów, integracje systemów. Mechanika interakcji jest wzorowana na landonorris.com (opis technik w `docs/reference/landonorris-analiza.md`), ale tożsamość jest własna (`docs/DESIGN.md`). Jedyny cel strony to rozmowa o projekcie, a główne CTA brzmi „Porozmawiajmy o Twoim projekcie”.

Sygnatura strony: **pasma szumu odsłaniają uporządkowany system pod powierzchnią ręcznej roboty**. Te same pasma rysują poziomice w tle całej strony. Drugi motyw to znak **x** z wordmarku.

## Stack

- Astro (`output: 'static'`) + TypeScript strict. Bez Reacta.
- Vanilla moduły TS podpinane do HTML-a wyłącznie przez atrybuty `data-*`.
- GSAP 3.13+ (ScrollTrigger, SplitText, DrawSVG), Lenis, three.js (jeden renderer, sceny w render targetach).
- Rive dochodzi później i jest opcjonalny. Wersja 1 animacji znaku x to SVG + DrawSVG.
- Deploy: statyczny `dist/` na własny VPS.

## Komendy

```
npm run dev       # serwer deweloperski
npm run build     # build produkcyjny, musi przechodzić po każdej warstwie
npm run preview   # podgląd builda
npm run check     # astro check + tsc --noEmit
npm run lint      # eslint + prettier --check
```

(Skrypty powstają w fazie F1. Jeśli którejś komendy jeszcze nie ma, dodaj ją do `package.json`.)

## Mapa dokumentów

| Plik | Co tam jest |
|---|---|
| `docs/BRIEF.md` | oferta i treść. **Jedyne źródło copy** |
| `docs/DESIGN.md` | tokeny, typografia, ruch, zakazy |
| `docs/ARCHITECTURE.md` | struktura, lifecycle modułów, GL, ładowanie, budżety |
| `docs/ASSETS.md` | lista assetów, prompty, pipeline |
| `docs/PROGRESS.md` | fazy, stan, decyzje otwarte, log sesji |
| `docs/sections/NN-*.md` | spec sekcji. Jedna sesja = jeden spec |
| `docs/refs/NN-*/` | klatki referencyjne i szkice do sekcji |
| `docs/reference/` | materiał tylko do odczytu |

## Twarde zasady

1. **Jedna sesja = jedno zadanie z `PROGRESS.md`.** Nie ruszaj plików innych sekcji bez pytania.
2. **Najpierw plan.** Przed kodem przeczytaj spec sekcji i `DESIGN.md`. Jeśli czegoś brakuje albo coś jest niejasne, pytasz, a nie zgadujesz.
3. **Treść tylko z `BRIEF.md`.** Nie wymyślaj liczb, klientów, opinii ani statystyk. Brak treści oznaczasz w kodzie jako `TODO(treść)`.
4. **Kolory, typografia i spacing tylko z tokenów.** Hex dozwolony wyłącznie w `src/styles/tokens.css`. GL czyta kolory z CSS variables (`cssColor('--c-piana')`). Hook to sprawdza.
5. **Zachowanie przez `data-*`, styl przez klasy.** Każdy moduł ma `init(root)` i `destroy()`, a animacje GSAP tworzy w `gsap.context()` i sprząta je przez `revert()`.
6. **Bez `pin: true` w ScrollTriggerze.** Przypięcia robisz przez CSS `position: sticky` w `.sticky-track`.
7. **Każda animacja ma wariant `prefers-reduced-motion`** (przez `gsap.matchMedia()`). Każda scena GL ma fallback bez WebGL.
8. **Żadnych nowych zależności npm bez pytania.**
9. **Nie kopiuj z landonorris.com** assetów, fontów, plików `.riv`, modeli ani kodu z ich bundla. `docs/reference` opisuje techniki, implementacja jest nasza.
10. **Po każdej warstwie** (statyka → ruch → GL → mobile/reduced-motion) `npm run build` musi przejść i robisz commit w formacie `feat(hero): …`.
11. **Koniec sesji = wpis w `PROGRESS.md`:** co zrobione, co zostało, podjęte decyzje, lekcje.

## Sposób pracy

- Zadanie dotyczące sekcji robisz przez skill `build-section`.
- Weryfikację wizualną zlecasz subagentowi `visual-qa` (Chrome, breakpointy 1920 / 1440 / 768 / 390).
- Parametry GL stroisz przez `lil-gui`, które jest widoczne tylko w dev pod `?debug`.
- Nowy spec sekcji piszesz z `docs/sections/_TEMPLATE.md`. Użytkownik go akceptuje, zanim zaczniesz kod.

## Definition of Done (skrót)

Sekcja jest skończona, gdy spełnia wszystkie punkty: dobrze wygląda na 1920, 1440, 768 i 390 px. Trzyma 60 fps na laptopie ze zintegrowanym GPU. Ma wariant reduced-motion i działa bez WebGL. Nie ma layout shiftu. Działa z klawiatury i ma widoczny focus. Treść jest finalna z `BRIEF.md`. Screenshoty są porównane z `docs/refs/`. Build jest czysty, commit i tag zrobione. Pełna checklista jest w skillu `build-section`.
