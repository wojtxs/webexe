# HANDOFF — webexe-site

Stan ustalony 2026-10-27 na podstawie plików w repo, historii gita i uruchomienia `npm run check / lint / build`. Plik opisuje tylko to, co da się sprawdzić w repo. Decyzje i plany są cytowane z `docs/` i nie są tu dopisywane.

## 1. Czym jest projekt

Statyczna strona firmowa webexe (dwuosobowy zespół, oprogramowanie dla firm). Zasady pracy są w `CLAUDE.md`, szczegóły w `docs/` (BRIEF, DESIGN, ARCHITECTURE, ASSETS, PROGRESS, sections/).

**Stack (z `package.json`):**

- Astro `^7.0.0` (`output: 'static'`, `site: https://webexe.pl`) + TypeScript strict
- GSAP `^3.13.0`, Lenis `^1.3.4`, three `^0.176.0` (three jeszcze nieużywany poza lazy importem w `css.ts`)
- Fonty: `@fontsource-variable/plus-jakarta-sans`, `@fontsource/comfortaa`
- Dev: ESLint 10 (flat config) + typescript-eslint + eslint-plugin-astro, Prettier 3 + prettier-plugin-astro, `@astrojs/check`, sharp 0.35
- Aliasy: `@core`, `@modules`, `@styles`, `@gl`, `@components` (w `astro.config.ts` i `tsconfig.json`)

**Skrypty:** `dev`, `build`, `preview`, `check` (astro check + tsc), `lint` (eslint + prettier --check), `assets` (`scripts/assets.mjs`).

## 2. Co jest zrobione

Według `docs/PROGRESS.md` i historii gita zamknięta jest **faza F1 (Fundament)**. Commity od `4098445` do `f81f904`.

| Obszar         | Pliki                                                                                                                  | Stan                                                                                                           |
| -------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Tokeny i style | `src/styles/tokens.css`, `fluid.css`, `base.css`, `utils.css`, `fonts.css`                                             | gotowe                                                                                                         |
| Layout         | `src/layouts/Base.astro`                                                                                               | meta/SEO/OG, canonical, preload fontów, skip link, pusty `<nav>`, `.gl-wrap`, import `@core/app`               |
| Bootstrap      | `src/core/app.ts`                                                                                                      | `fonts.ready` → `initScroll` → `initLifecycle` → `emit('app:ready')`                                           |
| Lifecycle      | `src/core/lifecycle.ts`                                                                                                | skan `[data-module]`, dynamiczny import `../modules/${name}.ts`, `init`/`destroyAll`                           |
| Scroll         | `src/core/scroll.ts`                                                                                                   | Lenis na `gsap.ticker`, ScrollTrigger, `lagSmoothing(0)`, bez Lenisa przy reduced motion                       |
| Ruch           | `src/core/motion.ts`                                                                                                   | `addMotion()` przez wspólne `gsap.matchMedia` (full/reduced), `revertMotion()`                                 |
| Zdarzenia      | `src/core/events.ts`                                                                                                   | `emit/on/off` na `CustomEvent`, typowana mapa zdarzeń                                                          |
| CSS → GL       | `src/core/css.ts`                                                                                                      | `cssVar()`, `cssColor()` (lazy `three`)                                                                        |
| Moduły         | `src/modules/grid-overlay.ts`                                                                                          | jedyny moduł, używany w `/lab`                                                                                 |
| Strony         | `index.astro`, `404.astro`, `polityka-prywatnosci.astro`, `lab/index.astro`                                            | index to szkielet 7 sekcji, reszta to placeholdery                                                             |
| Assety         | `scripts/assets.mjs`, `assets-src/manifest.json`                                                                       | pipeline działa, manifest zawiera tylko przykład                                                               |
| Tooling Claude | `.claude/hooks/guard.mjs`, `post-edit.mjs`, `.claude/skills/build-section`, `.claude/agents/visual-qa.md`, `.mcp.json` | hooki: blokada zapisu do `docs/reference/` i `assets-src/brand/`, prettier + eslint + kontrola hexów po edycji |

**Weryfikacja wykonana przy tym handoffie (2026-10-27):**

- `npm run check`: 0 błędów, 0 ostrzeżeń, 0 podpowiedzi (14 plików)
- `npm run lint`: czysto
- `npm run build`: 4 strony (`/`, `/404`, `/lab`, `/polityka-prywatnosci`), bez błędów
- `git status`: czysto, gałąź `master`

## 3. Co nie jest zrobione (według `docs/PROGRESS.md`)

- **F0** ma otwarte punkty: decyzje D6, D8, D9, D10, D11 (oraz D2–D5 i D7 w `BRIEF.md`). Brak `assets-src/brand/webexe.svg` i `x-mark.svg`. Brak klatek referencyjnych (`docs/refs/01-hero/` ma tylko `.gitkeep`). Brak assetów HERO-A/B/ALPHA/DEPTH (katalog `public/` jest pusty).
- **F2** (spike maski hero w `/lab`): nic nie zaczęte, brak katalogu `src/gl/`.
- **F3–F7**: nic nie zaczęte. Nie ma katalogów `src/sections/` ani `src/components/`, które opisuje `ARCHITECTURE.md`.
- Sekcje na `index.astro` mają tylko `TODO(treść)`. Hero zawiera H1 i lead z BRIEF, ale CTA czeka na D9.
- Spec istnieje tylko dla `01-hero` (status: „draft, do akceptacji”).

Wpis w logu sesji PROGRESS wskazuje jako następny krok **F2: spike maski hero w /lab**. Warunek wejścia z F0 („robocze assety hero”) nie jest spełniony, bo assetów nie ma w repo.

## 4. Rozbieżności i rzeczy do sprawdzenia

Zauważone w kodzie i dokumentach. Żadna nie psuje builda. Nic z tego nie było poprawiane.

1. **`PROGRESS.md` mówi „Aktualna faza: F0”**, a jednocześnie F1 ma wszystkie checkboxy i log mówi, że następna jest F2. Nagłówek nie został zaktualizowany albo celowo zostaje F0, bo F0 nie spełnia warunku wyjścia. Nie da się tego rozstrzygnąć z plików.
2. **`lifecycle.ts` połyka każdy błąd** w `catch {}`. Celem było pominięcie nieistniejących modułów (`hero`, `manifest`, `how-we-work`, `examples`, `work`, `about`, `footer` są w `index.astro`, a plików nie ma), ale w ten sam sposób zniknie też prawdziwy wyjątek z `init()` istniejącego modułu.
3. **`motion.ts`: `revertMotion()` cofa globalny `gsap.matchMedia`**, czyli animacje wszystkich modułów naraz. Komentarz sugeruje użycie „przy destroy modułu”. Do przemyślenia przed pierwszym modułem z ruchem.
4. **Nazewnictwo sekcji 03 jest niespójne:** `index.astro` ma `jak-pracujemy` / `data-module="how-we-work"` (zgodnie z BRIEF „03 Jak pracujemy”), a `PROGRESS.md` (F5) mówi „03 Rozwiązania” i `ARCHITECTURE.md` wymienia `Solutions.astro`.
5. **`/lab` w buildzie produkcyjnym** generuje `dist/lab/index.html` (stronę „Strona niedostępna” ze statusem 200). Spec mówi „tylko dev”.
6. **`grid-overlay.ts` ma kolory `rgba(8, 145, 178, …)` w kodzie.** Hook łapie tylko hexy, więc przeszło, ale to wartość `--c-laguna-start` wpisana ręcznie (zasada 4 w `CLAUDE.md`).
7. **`assets-src/brand/brand-board.png` jest śledzony w gicie**, mimo że `.gitignore` go wyklucza (dodany przed regułą). Nie wiadomo, czy ma zostać w repo.
8. **`.npmrc` konfiguruje rejestr GSAP Club** (`@gsap:registry`, `GSAP_TOKEN`). Projekt używa publicznego pakietu `gsap`, który od 3.13 zawiera SplitText i DrawSVG. Wpis wygląda na nieużywany, ale nie wiadomo, czy był zostawiony celowo.
9. **Node:** `.nvmrc` = 24.13.0, a lokalnie jest v22.14.0 (`engines: >=22`, więc build działa).
10. **Brak remote'a i tagów.** Repo jest tylko lokalne, gałąź `master`. `CLAUDE.md` wymaga tagów po sekcjach (np. `hero-v1`), ale żadnego jeszcze nie ma, bo żadna sekcja nie jest skończona.
11. **`lil-gui` nie ma w zależnościach**, a jest potrzebne w F2 (`CLAUDE.md`, `ARCHITECTURE.md`). Zasada 8 wymaga zgody przed dodaniem.
12. **`.claude/settings.local.json` wyłącza serwery MCP `chrome-devtools` i `context7`** z `.mcp.json`. Subagent `visual-qa` potrzebuje Chrome, więc trzeba to włączyć albo użyć Claude in Chrome (`/chrome`).

## 5. Czego nie da się ustalić z plików

- Czy decyzje D2–D11 zapadły poza repo (rozmowy, notatki). W `BRIEF.md` są otwarte.
- Czy assety hero albo nagrania z landonorris.com istnieją gdzieś poza repo.
- Czy spec `01-hero.md` został zaakceptowany (status w pliku: draft).
- Czy strona była już gdzieś wdrożona i jak wygląda VPS. Nie ma konfiguracji deployu.
- Czy jest zdalne repozytorium (GitHub itp.). Lokalnie nie ma remote'a.
- Czy integracja fal MCP i Claude in Chrome z `README.md` jest skonfigurowana na nowym koncie.
- Jaka jest kolejność dalszej pracy, jeśli ma się różnić od `PROGRESS.md`.

## 6. Jak bezpiecznie kontynuować

1. Na starcie sesji: `git status` (powinien być czysty) i `npm install`, jeśli `node_modules` nie pasuje do `package-lock.json`. Potem `npm run check && npm run lint && npm run build` jako punkt odniesienia.
2. Pracować według `CLAUDE.md`: jedna sesja to jedno zadanie z `PROGRESS.md`, najpierw plan, potem kod. Sekcje przez skill `build-section`.
3. Przed F2 ustalić z właścicielem projektu:
   - czy są robocze assety hero (bez nich spike nie ma czego mieszać),
   - zgodę na `lil-gui` (zasada 8),
   - czy punkty z sekcji 4 poprawić teraz, czy przy okazji.
4. Po każdej warstwie: `npm run build` + commit w formacie `feat(…): …`. Na koniec sesji wpis w `PROGRESS.md`.
5. Nie edytować `docs/reference/` ani `assets-src/brand/` (blokuje to hook `guard.mjs`).
