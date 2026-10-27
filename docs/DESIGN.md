# DESIGN — webexe

## Zasada główna

Z landonorris.com bierzemy **mechanikę**: jedną sygnaturę, pasma szumu, poziomice w tle, choreografię na sticky trackach i fluid scaling. **Wygląd** bierzemy z brand boardu webexe (`assets-src/brand/brand-board.png`). Palety Lando (limonka na butelkowej zieleni) nie używamy w żadnej formie.

Odwagę wydajemy w jednym miejscu, czyli w pasmach odsłaniających system pod powierzchnią. Reszta strony jest spokojna i zdyscyplinowana. Jeśli jakiś element nie wspiera sygnatury ani CTA, wylatuje.

## Kolory

Struktura jest jak u Lando (jasne tło, ciemny kolor marki, jeden akcent), ale kolory są nasze. Wartości bazowe pobrane z brand boardu:

| Token | Hex | Rola |
|---|---|---|
| `--c-piana` | `#E6F4F1` | domyślne jasne tło strony (hero, sekcje jasne) |
| `--c-biel` | `#FFFFFF` | powierzchnie: karty, panele na Pianie |
| `--c-glebia` | `#0F1F24` | tekst na jasnym, ciemne sekcje, menu, stopka |
| `--c-laguna-start` | `#0891B2` | początek gradientu |
| `--c-laguna-end` | `#10B981` | koniec gradientu |
| `--g-laguna` | `linear-gradient(135deg, var(--c-laguna-start), var(--c-laguna-end))` | akcent marki |

Pochodne kolory (do weryfikacji okiem w F1, kontrast sprawdzony):

| Token | Hex | Rola | Kontrast |
|---|---|---|---|
| `--c-piana-line` | `#D5EAE5` | poziomice na jasnym tle | dekoracja |
| `--c-piana-deep` | `#BCD9D2` | obrysy, separatory na jasnym | dekoracja |
| `--c-glebia-line` | `#16292F` | poziomice na ciemnym tle | dekoracja |
| `--c-glebia-raise` | `#1F363D` | podniesione powierzchnie na ciemnym | dekoracja |
| `--c-ink-muted` | `#566B6F` | tekst drugorzędny na Pianie | 4.98:1 ✓ |
| `--c-ink-muted-dark` | `#9DB5B0` | tekst drugorzędny na Głębi | 7.79:1 ✓ |
| `--c-laguna-ink` | `#0E7490` | linki tekstowe na jasnym tle | 4.74:1 ✓ |

Reguły:
- **Gradient Laguna pojawia się tylko w czterech miejscach:** na literze x (w wordmarku i jako znak), w tle głównego CTA, w odcieniach kursora i obrysów w GL oraz w słowach-akcentach (patrz typografia). Nigdy nie jest tłem sekcji, nie robi „poświaty” i nie wypełnia bloków tekstu.
- **CTA z gradientem ma tekst w kolorze Głębi** (kontrast 4.59–6.67:1). Biały tekst na gradiencie nie przechodzi (3.68:1).
- **Laguna jako kolor tekstu na jasnym tle przechodzi tylko przy dużym rozmiarze** (3.26:1, czyli od 24 px w górę). Do małego tekstu bierz `--c-laguna-ink`.
- **Focus ring:** 2 px `--c-laguna-start` z offsetem 3 px. Na Pianie daje 3.26:1, co spełnia wymóg 3:1 dla elementów nietekstowych.
- Tła to Piana, Biel albo Głębia. Bez szarości, bez czystej czerni, bez dodatkowych odcieni.

## Typografia

| Krój | Rola | Uwagi |
|---|---|---|
| **Plus Jakarta Sans** (variable, wght 200–800) | wszystko: nagłówki, tekst, UI | self-host woff2, subset latin + latin-ext (polskie znaki), preload |
| **Comfortaa 700** | wordmark i słowa-akcenty | wordmark zawsze jako SVG, nie jako tekst. Font ładujemy tylko na akcenty |

Odpowiednik Brier z oryginału to **Comfortaa 700, małymi literami, wypełniony gradientem Laguna** (`background-clip: text`). Reguły:
- Używamy go **tylko** w Manifeście (02) i w stopce (07).
- Maksymalnie jeden akcent na ekran.
- Minimum 32 px.
- Uppercase stosujemy wyłącznie dla haseł z 1–2 słów (APLIKACJE, AUTOMATYZACJE). Zdania, w tym H1, piszemy zawsze zwykłą pisownią.

Skala (rem, gdzie 1 rem = 16 px na makiecie 1440):

| Token | rem | px @1440 | waga | line-height | tracking |
|---|---|---|---|---|---|
| `--t-impact` | 8 | 128 | 800 | 0.88 | −0.045em |
| `--t-h1` | 4.5 | 72 | 800 | 0.98 | −0.035em |
| `--t-h2` | 3.5 | 56 | 800 | 1.0 | −0.03em |
| `--t-h3` | 2 | 32 | 700 | 1.1 | −0.02em |
| `--t-lead` | 1.375 | 22 | 500 | 1.45 | −0.01em |
| `--t-body` | 1.125 | 18 | 400 | 1.55 | 0 |
| `--t-small` | 0.875 | 14 | 500 | 1.45 | 0 |
| `--t-label` | 0.875 | 14 | 600 | 1.3 | 0 |

Tekst ciągły ma maksymalnie `64ch` szerokości. Etykiety (`--t-label`) piszemy zwykłą pisownią, a nie wersalikami.

Na mobile (makieta 390) skalę nadpisujemy: impact 3.5, h1 2.5, h2 2, h3 1.5, lead 1.125, body 1.

## Fluid scaling

Technika z oryginału, z naszymi makietami. Cały layout jest w `rem`, a `html { font-size }` liczy się z szerokości viewportu.

```css
:root  { --min-w: 992px; --max-w: 1920px; --design-w: 1440; --unit: 16; }
@media (max-width: 991px) { :root { --min-w: 768px; --max-w: 991px; --design-w: 834; } }
@media (max-width: 767px) { :root { --min-w: 320px; --max-w: 767px; --design-w: 390; } }
html { font-size: calc(clamp(var(--min-w), 100vw, var(--max-w)) / var(--design-w) * var(--unit)); }
```

Makiety referencyjne mają 1440 (desktop), 834 (tablet) i 390 (mobile). Wymiar z makiety w px dzielony przez 16 daje rem.

## Spacing, siatka, promienie

- Spacing w rem: `--s-1` 0.25 · `--s-2` 0.5 · `--s-3` 0.75 · `--s-4` 1 · `--s-6` 1.5 · `--s-8` 2 · `--s-12` 3 · `--s-16` 4 · `--s-24` 6 · `--s-32` 8.
- Siatka desktop: 12 kolumn, gap 1.25 rem, padding kontenera 2 rem. Tablet 8 kolumn, mobile 4 kolumny z paddingiem 1.25 rem.
- Promienie zależą od hierarchii, nie stosujemy jednego wszędzie: `--r-chip` 0.5 rem, `--r-card` 1.25 rem, `--r-panel` 2.5 rem (panele sekcji, stopka), `--r-pill` 999 px (przyciski). Zaokrąglenia nawiązują do zaokrąglonych końców kresek w Comfortaa.
- Cienie: brak. Głębię robimy kolorem tła (Biel na Pianie, `--c-glebia-raise` na Głębi).

## Ruch

| Token | Wartość | Użycie |
|---|---|---|
| `--ease-default` | `cubic-bezier(0.65, 0.05, 0, 1)` | reveale, przejścia: szybki start, długie wyhamowanie |
| `--ease-out` | `cubic-bezier(0.22, 1, 0.36, 1)` | hover, małe UI |
| `--d-fast` | 0.35 s | hover, focus |
| `--d-default` | 0.75 s | reveale |
| `--d-slow` | 1.1 s | intro hero, loader |
| stagger linii | 0.08 s | SplitText lines |
| Lenis | `lerp 0.1`, `syncTouch` testowany na iOS | — |

Zasady:
- **Ruch odpowiada na scroll albo wskaźnik.** Sam z siebie porusza się tylko szum pasm i to bardzo wolno.
- **Jeden zorkiestrowany moment na sekcję.** Nie animujemy każdego elementu „fade + slide-up”.
- Hover na przyciskach to efekt „roll” na znakach (technika z oryginału, sekcja 6.5 analizy).
- **Reduced motion:** Lenis wyłączony (natywny scroll), reveale stają się natychmiastowe albo dostają opacity ≤ 0.2 s, scrub-y zamieniają się w stany końcowe, a GL renderuje statyczną klatkę.

## Motywy sygnaturowe

1. **Pasma.** Szum simplex pocięty na pasma jak poziomice. W hero przełączają warstwę „ręczna robota” i warstwę „system”. W tle całej strony rysują poziomice, których kolory zmieniają się per sekcja (`data-gl-change-*`).
2. **Znak x.** Dwie kreski o zaokrąglonych końcach. Rysuje się w loaderze, na końcu Manifestu (zamiast podpisu Lando) i jako separator w wierszach tekstu. W stopce występuje jako obiekt 3D (dwie kapsuły, materiał z gradientem Laguna).
3. **Wordmark webexe.** Mały w nawigacji, wielki w scroll-out hero i w stopce. Zawsze SVG, a x zawsze ma gradient.

## Zakazy (typowe oznaki generyka)

- Eyebrow pisany wersalikami z rozstrzeloną literą nad każdym nagłówkiem.
- Etykiety pisane fontem monospace, estetyka terminala i hakera.
- Ciągi rozdzielone kropką na środku („A · B · C”). Jako separator służy znak x.
- Strzałka „→” doklejana do tekstu linków i przycisków.
- Siatka identycznych kart z tym samym promieniem i cieniem. Gradienty jako dekoracja tła.
- Numeracja 01 / 02 / 03 tam, gdzie treść nie jest sekwencją.
- Liczby, metryki i logotypy klientów, których nie ma w `BRIEF.md`.
