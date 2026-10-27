# PROGRESS — webexe

Claude aktualizuje ten plik na koniec każdej sesji. Fazy idą po kolei, a faza jest zamknięta dopiero wtedy, gdy spełnia swój warunek wyjścia.

**Aktualna faza:** F0
**Decyzje otwarte:** D2–D11 w `BRIEF.md`

## F0: Treść i kierunek (bez Claude Code albo tylko pomocniczo)

- [x] D1: oferta (budujemy i utrzymujemy oprogramowanie dla firm)
- [ ] Rozstrzygnięte D6, D8, D9, D10 i D11
- [ ] `assets-src/brand/webexe.svg` (x jako osobna ścieżka) oraz `x-mark.svg`
- [ ] Nagrania ekranu z landonorris.com dla każdej sekcji-wzorca, klatki kluczowe wyciągnięte do `docs/refs/NN-*/`:
      `ffmpeg -i hero.mov -vf "fps=4" docs/refs/01-hero/frame_%03d.png`, a potem wybierasz 5–8 klatek
- [ ] Assety HERO-A, B, ALPHA i DEPTH dla **obu wariantów** z `ASSETS.md` (osobna sesja generowania). Na spike F2 wystarczą wersje robocze.

**Warunek wyjścia:** BRIEF bez blokujących decyzji dla F1–F3 i robocze assety hero.

## F1: Fundament

- [ ] Astro (static) + TS strict, ESLint, Prettier, skrypty `dev/build/preview/check/lint`
- [ ] `tokens.css` (z DESIGN.md), `fluid.css`, `base.css`, `utils.css`
- [ ] Fonty self-host + preload, subset latin-ext
- [ ] `core/`: lifecycle, scroll (Lenis + ticker + ScrollTrigger), motion (matchMedia full/reduced), events, css
- [ ] Strona `/lab` (tylko dev, noindex) jako sandbox na eksperymenty
- [ ] Skrypt `scripts/assets.mjs` (sharp: resize + WebP)

**Warunek wyjścia:** pusta makieta z siatką skaluje się proporcjonalnie od 992 do 1920 px, scroll jest płynny na desktopie i na telefonie, przy reduced motion działa natywny scroll, `npm run build` przechodzi czysto.

## F2: Spike maski hero (w `/lab`)

- [ ] Minimalny GL: renderer, kamera pixel-perfect, `DomPlane`, `Mouse` z eased + pace
- [ ] Shader pasm (`bands.frag`) mieszający HERO-A i HERO-B z alfą, kursor ugina pasma tylko w ruchu
- [ ] Panel `lil-gui` z parametrami ze speca 01
- [ ] Przełącznik wariantów hero (1 / 2) w `lil-gui`

**Warunek wyjścia (bramka D2):** wybrany jeden wariant hero, a efekt wygląda świetnie na żywo i trzyma 60 fps. Jeśli żaden nie działa, zmieniamy koncept hero **przed** F3.

## F3: Greybox całej strony

- [ ] Wszystkie sekcje 01–07 jako statyczny HTML/CSS z prawdziwą treścią z BRIEF i szarymi blokami w miejscu wizualów
- [ ] Wysokości sticky tracków zgrubnie ustawione

**Warunek wyjścia:** przewinięcie całej strony daje dobry rytm i kolejność, a decyzje o zmianach kolejności są zapisane poniżej.

## F4: GL core + 01 Hero

- [ ] GL core docelowy (Experience, Resources, render targety, IO-visibility, fallbacki)
- [ ] `BackgroundScene` (poziomice + `data-gl-change-*`)
- [ ] 01 Hero według `docs/sections/01-hero.md`, etapy H1–H5

## F5: Sekcje

Przed każdą sekcją: Claude pisze draft speca z `_TEMPLATE.md`, ty go akceptujesz, potem build.

- [ ] 02 Manifest
- [ ] 03 Rozwiązania
- [ ] 04 Przykłady
- [ ] 05 Realizacje (zależy od D3)
- [ ] 06 Poznaj nas (zależy od D4)
- [ ] 07 Kontakt / stopka (+ X-3D)

## F6: Warstwa globalna

- [ ] Nawigacja: motyw per sekcja, menu fullscreen, `lenis.stop()` przy otwartym menu
- [ ] 00 Loader (rysowanie znaku x, limit 2.5 s, przekazanie `app:ready`)
- [ ] Przejścia stron (Taxi.js albo View Transitions), `/404`, `/polityka-prywatnosci`
- [ ] Scroll indicator, easter egg (np. inny seed pasm przy każdym wejściu)

## F7: Hardening i deploy

- [ ] Budżety z ARCHITECTURE.md, Lighthouse, trace wydajności
- [ ] A11y: alty, focus, kolejność, reduced motion, czytniki ekranu
- [ ] SEO: meta, OG, sitemap, `robots.txt`, schema.org `Organization`
- [ ] Mobile: sceny uproszczone tam, gdzie trzeba
- [ ] Kontakt według D7, analityka według D7
- [ ] Deploy na VPS, cache, kompresja, monitoring uptime

## Log decyzji

| Data | Decyzja | Dlaczego |
|---|---|---|
| 2026-10-26 | Astro + vanilla TS zamiast Next.js | model oryginału (HTML + moduły `data-*`), brak walki z lifecycle Reacta przy GSAP/GL, statyczny deploy na VPS |
| 2026-10-26 | Paleta i fonty z brand boardu, mechanika z landonorris.com | własna tożsamość, palety Lando nie kopiujemy |
| 2026-10-27 | D1: oferta to budowa i wieloletnie utrzymanie oprogramowania dla firm, forma „wy” | nowe copy; utrzymanie na własnej infrastrukturze to wyróżnik |
| 2026-10-27 | Hero: rekomendowany wariant „aplikacja → infrastruktura”, porównanie z „ręczna robota → system” w F2 | nowy H1 mówi o zostawaniu na lata, a nie o samej automatyzacji |

## Log sesji

<!-- Szablon wpisu:
### RRRR-MM-DD — <zadanie>
- Zrobione:
- Zostało:
- Decyzje:
- Lekcje (co dopisać do speca/DESIGN/CLAUDE.md):
-->
