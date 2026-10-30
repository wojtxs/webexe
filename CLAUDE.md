# webexe — strona firmowa

Czytasz ten plik na starcie każdej sesji. Szczegóły leżą w `docs/`. Czytaj je wtedy, gdy zadanie ich dotyczy, a nie wszystkie naraz.

## Projekt

Strona firmowa webexe: dwuosobowy zespół, dedykowane aplikacje, automatyzacja procesów, integracje systemów. Strona jest showcase'owa: w centrum stoją nasze realizacje i produkty. Nie ma kosztorysu ani konfiguratora. Kierunek mechaniki wyznacza `docs/INSPIRACJE.md` (synteza alpanet.pl i chipsa.design z `docs/reference/`), a tożsamość jest własna (`docs/DESIGN.md`). Jedyny cel strony to rozmowa o projekcie. Brzmienie głównego CTA ustala D9 w `BRIEF.md`.

Motyw przewodni: **system na siatce, węzły to znak x**. Cała strona stoi na jednej widocznej siatce, a w jej węzłach stoi znak **x** z wordmarku. Szczegóły w `docs/DESIGN.md` (Motywy sygnaturowe).

## Stack

- Astro (`output: 'static'`) + TypeScript strict. Bez Reacta.
- Vanilla moduły TS podpinane do HTML-a wyłącznie przez atrybuty `data-*`.
- GSAP 3.13+ (ScrollTrigger, SplitText, DrawSVG), Lenis. Znak x to SVG + DrawSVG.
- three.js tylko wtedy, gdy spec sekcji go wymaga (decyzja w specu, zgoda jak przy nowej zależności). Bazowy stack jest bez WebGL.
- Deploy: statyczny `dist/` w obrazie Docker na własnym VPS.

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
| `docs/BRIEF.md` | oferta, treść i mapa strony. **Jedyne źródło copy** |
| `docs/INSPIRACJE.md` | kierunek: co bierzemy z alpanet.pl i chipsa.design, czego nie, motyw przewodni |
| `docs/DESIGN.md` | tokeny, typografia, ruch, motywy, zakazy |
| `docs/ARCHITECTURE.md` | struktura, lifecycle modułów, GL (opcjonalny), ładowanie, budżety, deploy |
| `docs/ASSETS.md` | lista assetów, nagrania, pipeline |
| `docs/PROGRESS.md` | fazy, stan, decyzje otwarte, log sesji |
| `docs/sections/NN-*.md` | spec sekcji. Jedna sesja = jeden spec |
| `docs/refs/NN-*/` | klatki referencyjne i szkice do sekcji |
| `docs/reference/` | analizy referencji, tylko do odczytu |
| `docs/archive/` | wycofane dokumenty (landonorris.com, stary spec hero), tylko do wglądu |

## Twarde zasady

1. **Jedna sesja = jedno zadanie z `PROGRESS.md`.** Nie ruszaj plików innych sekcji bez pytania.
2. **Najpierw plan.** Przed kodem przeczytaj spec sekcji i `DESIGN.md`. Jeśli czegoś brakuje albo coś jest niejasne, pytasz, a nie zgadujesz.
3. **Treść tylko z `BRIEF.md`.** Nie wymyślaj liczb, klientów, opinii ani statystyk. Brak treści oznaczasz w kodzie jako `TODO(treść)`.
4. **Kolory, typografia i spacing tylko z tokenów.** Hex dozwolony wyłącznie w `src/styles/tokens.css`. GL czyta kolory z CSS variables (`cssColor('--c-piana')`). Hook to sprawdza.
5. **Zachowanie przez `data-*`, styl przez klasy.** Każdy moduł ma `init(root)` i `destroy()`, a animacje GSAP tworzy w `gsap.context()` i sprząta je przez `revert()`.
6. **Bez `pin: true` w ScrollTriggerze.** Przypięcia robisz przez CSS `position: sticky` w `.sticky-track`.
7. **Każda animacja ma wariant `prefers-reduced-motion`** (przez `gsap.matchMedia()`). Każda scena GL ma fallback bez WebGL.
8. **Żadnych nowych zależności npm bez pytania.**
9. **Nie kopiuj z referencji** (alpanet.pl, chipsa.design) filmów, zdjęć, mockupów, logotypów, fontów, modeli ani kodu z ich bundli. `docs/reference` opisuje techniki, implementacja jest nasza.
10. **Po każdej warstwie** (statyka → ruch → GL → mobile/reduced-motion) `npm run build` musi przejść i robisz commit w formacie `feat(hero): …`.
11. **Koniec sesji = wpis w `PROGRESS.md`:** co zrobione, co zostało, podjęte decyzje, lekcje.

## Sposób pracy

- Zadanie dotyczące sekcji robisz przez skill `build-section`.
- Weryfikację wizualną zlecasz subagentowi `visual-qa` (Playwright, breakpointy 1920 / 1440 / 834 / 390).
- Parametry ruchu i GL stroisz przez `lil-gui`, które jest widoczne tylko w dev pod `?debug`.
- Nowy spec sekcji piszesz z `docs/sections/_TEMPLATE.md`. Użytkownik go akceptuje, zanim zaczniesz kod.

## Narzędzia

- **Playwright MCP**: screeny na 1920 / 1440 / 834 / 390 i emulacja `prefers-reduced-motion`. Główne narzędzie `visual-qa`.
- **Chrome DevTools MCP**: trace wydajności, konsola, sieć.
- **Claude in Chrome** (`/chrome`): tylko gdy trzeba zajrzeć na stronę referencyjną.
- **Context7**: zanim użyjesz API, którego nie jesteś pewien, sprawdź jego aktualną dokumentację.
- **Skill `frontend-design`**: wolno go używać, ale pierwszeństwo ma `docs/DESIGN.md` (i `docs/INSPIRACJE.md`, gdy powstanie). Kolory, fonty, spacing i motyw bierzesz tylko stamtąd.
- **Skill `web-design-guidelines`**: checklista przy przeglądzie sekcji, nie źródło stylu.
- Stack jest bez Reacta, więc nie stosujesz wzorców z React ani Next.js.

## Definition of Done (skrót)

Sekcja jest skończona, gdy spełnia wszystkie punkty: dobrze wygląda na 1920, 1440, 834 i 390 px. Trzyma 60 fps na laptopie ze zintegrowanym GPU. Ma wariant reduced-motion i działa bez WebGL. Nie ma layout shiftu. Działa z klawiatury i ma widoczny focus. Treść jest finalna z `BRIEF.md`. Screenshoty są porównane z `docs/refs/`. Build jest czysty, commit i tag zrobione. Pełna checklista jest w skillu `build-section`.
