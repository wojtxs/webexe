# 01 — Hero

**Status:** draft, do akceptacji (D2 rozstrzyga spike F2)
**Zależności:** F1 (tokeny, scroll, lifecycle), GL core (F4), BackgroundScene, assety HERO-A, B, ALPHA, DEPTH, STATIC
**Wzorzec z oryginału:** analiza, sekcje 3 (wiersz 1), 4.1–4.3 i 7. Klatki referencyjne leżą w `docs/refs/01-hero/`.

## Cel

W trzy sekundy odbiorca ma wiedzieć, kim jesteśmy i co robimy, i dotknąć jednej interakcji, która to pokazuje: **na powierzchni jest aplikacja, której używa klient, a pod nią infrastruktura, przy której zostajemy na lata (serwery, kopie, monitoring, deploy). Pasma odsłaniają ją tam, gdzie porusza się kursor.** Sekcja prowadzi do CTA (D9).

Wariant alternatywny do porównania w spike F2: ręczna robota → system (patrz `ASSETS.md`). Shader i interakcje są identyczne dla obu wariantów, różnią się tylko tekstury.

## Treść

- **H1:** Budujemy / oprogramowanie / dla firm i zostajemy / przy nim na lata.
  Łamania `/` są wymuszone na desktopie i tablecie (4 linie). Na mobile łamie się naturalnie.
- **Lead:** Aplikacje webowe, systemy wewnętrzne, integracje i automatyzacje z AI. Projektujemy je razem z wami, wdrażamy etapami i utrzymujemy na własnej infrastrukturze.
- **CTA:** brzmienie według D9 (propozycja: „Porozmawiajmy o projekcie”) → `#kontakt`
- **Wiersze scroll-out** (dekoracyjne, `aria-hidden`):
  - wiersz 1: wordmark `webexe` powtórzony, separator znak x
  - wiersz 2: PROJEKTUJEMY x BUDUJEMY x AUTOMATYZUJEMY x UTRZYMUJEMY (4 kroki z sekcji 03)
- **Widget na żywo** (za flagą, D5): dwie pozycje z prawdziwych danych platformy, np. „Ostatni deploy: 2 godz. temu”. To dowód na „utrzymujemy na własnej infrastrukturze” z leadu. Etykiety i dane ustalamy w D5. Bez danych widgetu nie ma.

## Struktura DOM

```html
<section class="s-hero" data-module="hero" data-nav-theme="light"
         data-gl-change-from="piana,piana-line" data-gl-change-to="glebia,glebia-line">
  <div class="sticky-track" data-sticky style="--track-h: 200vh">
    <div class="sticky-item">
      <div class="hero-visual" data-gl="hero" aria-hidden="true">
        <img class="hero-fallback" src="/gl/textures/hero/hero-static.webp" alt="" width="1638" height="2048">
      </div>
      <div class="hero-copy">
        <h1 class="hero-title" data-split="lines">
          <span class="l">Budujemy</span> <span class="l">oprogramowanie</span>
          <span class="l">dla firm i zostajemy</span> <span class="l">przy nim na lata.</span>
        </h1>
        <p class="hero-lead">Aplikacje webowe, systemy wewnętrzne, integracje i automatyzacje z AI. Projektujemy je razem z wami, wdrażamy etapami i utrzymujemy na własnej infrastrukturze.</p>
        <a class="btn btn--primary" href="#kontakt" data-btn-roll><!-- D9 --></a>
      </div>
      <div class="hero-rows" aria-hidden="true">
        <div class="hero-row hero-row--wordmark"><!-- Wordmark × n, XMark jako separator --></div>
        <div class="hero-row hero-row--pillars"><!-- PROJEKTUJEMY x BUDUJEMY x AUTOMATYZUJEMY x UTRZYMUJEMY × n --></div>
      </div>
      <aside class="hero-live" data-module="live-stats" data-feature="live-stats"
             aria-label="Na żywo z naszej infrastruktury" hidden></aside>
    </div>
  </div>
</section>
```

## Layout

**Desktop (makieta 1440×900):** tło to poziomice na Pianie z BackgroundScene na całym viewporcie.

```
┌──────────────────────────────────────────────────────────────────────┐
│ webexe                                   [Porozmawiajmy]   ☰         │ nav 5rem, motyw light
│                                                                      │
│  Budujemy                                    ┌───────────────────┐   │
│  oprogramowanie                              │                   │   │
│  dla firm i zostajemy                        │  obiekt A/B       │   │ hero-visual: kol. 8–12,
│  przy nim na lata.                           │  (wycięty, 4:5)   │   │ wysokość 84vh,
│                                              │  pasma + kursor   │   │ środek w pionie
│  Aplikacje webowe, systemy wewnętrzne,       │                   │   │
│  integracje i automatyzacje z AI. …          │                   │   │
│  ( Porozmawiajmy o projekcie )               └───────────────────┘   │
│                                                                      │
│ ┌ widget ───────────┐                                                │ lewy dół, 2rem od krawędzi
│ └───────────────────┘                                                │
└──────────────────────────────────────────────────────────────────────┘
```

- `.hero-copy`: kolumny 1–7, wyrównanie do lewej, górna krawędź H1 na 20% wysokości viewportu. H1 `--t-h1`, dokładnie 4 linie z wymuszonymi łamaniami. Najdłuższa linia („dla firm i zostajemy”) musi zmieścić się w kolumnach 1–7. Jeśli się nie mieści, H1 w hero dostaje 4 rem. Lead `--t-lead`, kolor `--c-ink-muted`, max 38ch, 1.75 rem pod H1. CTA 2 rem pod leadem. Kopia nie może zachodzić na widget (sprawdź przy 1440×800).
- `.hero-visual`: obiekt nie ma ramki ani karty, stoi na tle z poziomicami jak twarz u Lando.
- `.hero-live`: karta Biel, `--r-card`, padding 1 rem 1.25 rem, `--t-small`.
- `.hero-rows`: absolutnie na 38% i 58% wysokości. Domyślnie `opacity: 0` (pojawiają się w scroll-oucie). Wiersz 1 w rozmiarze `--t-impact` (wysokość wordmarku), wiersz 2 Plus Jakarta Sans 800, `--t-impact`, uppercase.

**Tablet (834):** układ jak na mobile, ale obiekt zajmuje 50vh, a H1 ma 3.5 rem.

**Mobile (makieta 390×844):**

```
┌──────────────────────────┐
│ webexe            ☰      │
│      ┌──────────────┐    │
│      │  obiekt A/B  │    │ 36vh, wyśrodkowany
│      └──────────────┘    │
│ Budujemy oprogramowanie  │ H1 2.25rem, łamanie naturalne
│ dla firm i zostajemy     │
│ przy nim na lata.        │
│ Aplikacje webowe, …      │ lead może zejść pod pierwszy ekran
│ (Porozmawiajmy o …     ) │ CTA na całą szerokość
└──────────────────────────┘
```

Widget na mobile jest ukryty (`data-hide="m"`). Sticky track ma na mobile 160vh.

## Interakcje i ruch

Parametry startowe trzymasz w `gl/params.ts` i stroisz w `lil-gui` pod `?debug`.

| # | Wyzwalacz | Efekt | Liczby |
|---|---|---|---|
| 1 | `app:ready` | intro maski: pasma wjeżdżają od dołu | `uReveal` 0→1, 1.1 s, `--ease-default`, `REVEAL_SIZE 25` |
| 2 | `app:ready` | reveal linii H1 spod maski `clip-path` | start +0.35 s, stagger 0.08 s, 0.75 s, `--ease-default` |
| 3 | `app:ready` | lead, potem CTA | lead +0.6 s, CTA +0.75 s: `opacity` 0→1, `y` 1 rem→0, 0.75 s |
| 4 | czas | pasma płyną | `SPEED 0.08`, `NOISE_DETAIL 3`, `DISTORT_SCALE 1`, `DISTORT_INTENSITY 0.5` |
| 5 | `pointermove` | kursor ugina pasma, **tylko gdy się rusza** | mysz eased `lerp 0.1`; `pace` = prędkość / 40 px na klatkę, clamp 0–1, wygładzone `lerp 0.08`, po zatrzymaniu spada do 0 w ≤ 0.8 s; `CURSOR_SCALE 3`, `CURSOR_INTENSITY 0.15`, `CURSOR_BOUNCE -0.75` |
| 6 | granica pasma | linia konturu na krawędzi pasma | grubość 1 px urządzenia, antyaliasing przez `fwidth`; poza obiektem `--c-piana-deep`, na obiekcie `--c-laguna-start` z alfą 0.6 |
| 7 | pozycja myszy | paralaksa 2.5D z mapy głębi | offset UV warstwy A = mysz eased × depth × 0.012, warstwa B × 0.008; światło krawędziowe z normali (pochodne depth), kierunek lekko za myszą, intensywność 0.15 |
| 8 | scroll, p 0→0.3 | `.hero-copy` znika | `opacity` 1→0, `y` 0→−3 rem, scrub |
| 9 | scroll, p 0.15→1 | płaszczyzna hero odjeżdża w górę | `translateY` 0→−110vh, `ease: none`, scrub |
| 10 | scroll, p 0.3→1 | wiersze tekstu wjeżdżają i jadą w przeciwne strony | wiersz 1: `opacity` 0→1 (p 0.3–0.45), `xPercent` 0→−25; wiersz 2: to samo, `xPercent` −25→0 |
| 11 | scroll, p 0.45→0.9 | tło GL przechodzi z Piany w Głębię | uniformy BackgroundScene przez `data-gl-change-*`; kolor wierszy Głębia→Piana w tym samym zakresie, x zawsze z gradientem |
| 12 | scroll, p ≥ 0.7 | nawigacja przełącza się na motyw dark | przez `data-nav-theme` następnej sekcji |
| 13 | hover / focus CTA | efekt roll na znakach + focus ring | `--d-fast`… `0.6 s`, stagger znaków 12 ms, `--ease-default` |

Progres `p` liczy ScrollTrigger na `.sticky-track` (`start: 'top top'`, `end: 'bottom bottom'`, `scrub: true`).

## Reduced motion, brak WebGL, dotyk

- **Reduced motion:** sceny GL hero nie inicjalizujemy. Widać `hero-static.webp`, a poziomice tła są statyczne (jedna klatka). Intro jest natychmiastowe. Interakcje 8–11 zostają zastąpione stanami końcowymi bez ruchu: kopia nie znika, wiersze stoją. Lenis wyłączony.
- **Brak WebGL:** `hero-static.webp` + tło `--c-piana` w CSS. Ruch DOM (2, 3, 8, 10) działa normalnie.
- **Dotyk:** zamiast śledzenia kursora: (a) **tap → impuls**, czyli pozycja tapnięcia z `pace` 0.8 wygasającym w 0.8 s; (b) **dryf w spoczynku**, czyli wirtualny kursor na wolnej krzywej Lissajous (okres ~14 s) ze stałym `pace` 0.25, żeby pasma oddychały. `touch-action: pan-y` na `.hero-visual`, bez blokowania scrolla.

## Assety

`HERO-A`, `HERO-B`, `HERO-ALPHA`, `HERO-DEPTH`, `HERO-STATIC` z `ASSETS.md` leżą w `public/gl/textures/hero/`. Kolorystyka: A i B w `SRGBColorSpace`, alpha i depth w `NoColorSpace`. Płaszczyzna wyświetla się ~1:1, więc `generateMipmaps: false` i `LinearFilter`. Opcjonalna optymalizacja: alpha w kanale R, a depth w G jednej tekstury.

Dopóki nie ma loadera (F6), `core/app.ts` emituje `app:ready` po załadowaniu assetów krytycznych hero albo po 2.5 s, zależnie od tego, co nastąpi pierwsze. Przy timeoucie hero zostaje w trybie statycznym i przełącza się na GL, kiedy będzie gotowe.

## Etapy implementacji

Po każdym etapie: `npm run build`, weryfikacja przez `visual-qa` i commit.

- **H1, statyka:** DOM, CSS, layout 1440 / 834 / 390, `hero-static` (na start może to być HERO-A) w slocie wizuala, CTA z roll, widget za flagą.
- **H2, ruch DOM:** intro tekstu na `app:ready`, scroll-out kopii, wiersze, przełączenie navu. Wszystko bez GL.
- **H3, GL:** HeroScene: A, B, alpha, shader pasm (`bands.frag`), mysz + pace, intro `uReveal`, linie konturu, `DomPlane` + translate scrollem, spięcie kolorów z BackgroundScene.
- **H4, 2.5D:** paralaksa z depth, normale z pochodnych, światło krawędziowe.
- **H5, utwardzenie:** dotyk, reduced motion, fallback bez WebGL, trace wydajności, limity DPR, renderowanie tylko gdy widoczne. Tag `hero-v1`.

## Kryteria akceptacji

1. H1 jest widoczny i czytelny z samego DOM-u, zanim GL będzie gotowe. Intro trwa ≤ 1.5 s od `app:ready`.
2. Pasma uginają się tylko w ruchu kursora i wracają do spoczynku w ≤ 0.8 s po jego zatrzymaniu.
3. Krawędzie pasm nie mają schodków przy DPR 1 i 2.
4. Rozjazd A/B na krawędziach obiektu ≤ 2 px w skali wyświetlania.
5. Przy p = 1 tło jest w kolorze Głębi, płaszczyzna jest poza ekranem, a nav ma motyw dark. Scroll w górę odtwarza wszystko odwrotnie, bez skoków.
6. 60 fps w trace na laptopie z iGPU przy 1440×900 i 1920×1080. JS hero ≤ 4 ms na klatkę.
7. Na 390×844 w pierwszym ekranie mieszczą się obiekt i cały H1. CTA jest widoczne najpóźniej po przewinięciu o 25% ekranu. Tap daje impuls.
8. Przy reduced motion nic się nie rusza poza natywnym scrollem.
9. Bez WebGL hero jest kompletne i czytelne.
10. Widget bez flagi lub bez danych jest niewidoczny, a CLS = 0.
11. Lighthouse Accessibility = 100 dla strony z samym hero.
12. Spełnione DoD z `build-section`.

## Poza zakresem

Loader (00), menu fullscreen, obiekt 3D x, tekst MSDF w GL (wiersze są w DOM-ie, wersja GL może dojść później), backend widgetu (tylko frontend + flaga), przejścia stron.

## Decyzje otwarte

- **D2:** wariant hero: aplikacja → infrastruktura (rekomendowany) czy ręczna robota → system? Rozstrzyga bramka po spike F2, który porównuje oba warianty na żywo.
- **D5:** dane i etykiety widgetu.
- **D9:** brzmienie CTA.
- Wiersz 2 w scroll-oucie: 4 czasowniki z sekcji 03 (propozycja) czy coś innego?
