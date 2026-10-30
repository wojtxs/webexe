# alpanet.pl — analiza techniczna pod odwzorowanie mechaniki

> Stan na 30.10.2026. Wszystko poniżej pochodzi z analizy na żywo w przeglądarce: DOM, computed styles, treść `main.min.js` i `main.min.css`, `performance.getEntries()`, nagłówki HTTP z `fetch HEAD`. Pomiary desktopowe przy viewporcie **1182×697 CSS px, DPR 1**. Mobile mierzony w same-origin `<iframe>` 390×690 (media queries liczą się wtedy względem iframe'a). Nie testowałem prawdziwego dotyku ani iOS Safari.
> Strona jest robiona przez samą firmę ALPANET na **własnym CMS-ie „ALP VISUAL SYSTEM”** (renderowanie po stronie serwera, nginx).
> Pominięte zgodnie z prośbą: kosztorys/konfigurator (`/kosztorys`, `Store.js`, moduł `Estimate`) i baner cookies.
>
> ⚠️ Bierz mechanikę, nie wygląd: **nie kopiuj filmów, zdjęć zespołu, mockupów, logotypów klientów, kroju AsenPro (komercyjny) ani kodu z ich bundla**. W sekcji 14 jest rozpisane, jak każdą mechanikę ubrać we własną formę.

---

## 0. TL;DR

- **Zero WebGL, zero GSAP.** Cały „efekt wow” to kilka małych klas w vanilla JS (ES5 po Babelu) + CSS. Biblioteki: **Lenis 1.1.13** (tylko ≥1000 px), **Swiper**, **ScrollReveal 4**, **Font Awesome (JS, pełny zestaw ~2 044 ikon)**, loader Google Maps, reCAPTCHA v3, GTM.
- **Własny atomowy CSS w atrybutach**: `data-d` (deklaracje, skróty „pierwsza+ostatnia litera”: `pn:fd` = `position:fixed`, `ft-se` = `font-size`), `data-g` (szerokość w siatce **36 kolumn**), `data-a` (display/wyrównanie), `data-p` (części komponentów), `data-s` (punkt zaczepienia dla modułu JS). `html { font-size: 1px }`, więc **1rem = 1px**.
- Cztery mechaniki robią całą robotę:
  1. **Hero**: karta wideo w 300vh sticky rozszerza się `clip-path: inset(35% round 30px)` → `inset(0)` na długości 2×vh;
  2. **Zoom przez literę**: w słowie „AI.REW●LUCJA” „O” jest czarnym kołem, które przy scrollu skaluje się 1 → 100 i staje się tłem ciemnej części strony;
  3. **Tekst wypełniany scrollem** słowo po słowie (gradient + `background-clip: text`);
  4. **Widoczna siatka 4 kolumn** (linie 1px, krzyżyki „+” na przecięciach, pionowe eyebrowy na środkowej linii), na której stoją wszystkie karty, częściowo przesunięte w pionie (stagger).
- Do tego drobnica, która dodaje „życia”: liczniki-odometry, „kurtyny” zjeżdżające ze zdjęć w losowej kolejności, własny kursor z obracającym się napisem „WIĘCEJ INFORMACJI”, migające awatary zespołu (co 200 ms), dymek czatu z efektem pisania.
- **Słabo**: wideo hero **4,6 MB (1920×1080)** ładowane także na mobile do karty 169×304 px, bundle JS **1,82 MB** (z czego ~1,5 MB to definicje ikon FA), 6 fontów **TTF z `font-display: block`**, 97/101 obrazów bez `alt`, brak `prefers-reduced-motion`, handlery scrolla z `getBoundingClientRect()` bez rAF.

---

## 1. Stack — co jest użyte i jak ładowane

| Warstwa | Co | Wersja | Skąd / jak |
|---|---|---|---|
| Backend / CMS | własny „ALP VISUAL SYSTEM” (PHP) | — | nginx, HTTP/2, gzip (bez Brotli). Formularze POST z CSRF (`phone[_token]`) |
| CSS | jeden plik `main.min.css` generowany z atrybutów | `?v=2` | 161 KB / **29 KB gzip**, 2 555 reguł, 494 użycia `var(--…)` |
| JS | jeden bundle `main.min.js` (webpack + Babel, klasy ES5) | `?v=2` | **1,82 MB / 723 KB gzip**, 3 linie. Ładowany na końcu body |
| Smooth scroll | Lenis | **1.1.13** | w bundlu, opcje domyślne (`lerp 0.1`), własna pętla rAF, **tylko gdy `innerWidth > 1000`** |
| Karuzele | Swiper | — (v8+) | w bundlu: awatary, logotypy partnerów, blog, opinie, galerie |
| Wejścia elementów | ScrollReveal | **4.x** | w bundlu, konfiguracja z atrybutów `data-delay`, `data-distance`… |
| Ikony | Font Awesome JS (`i2svg`) | 6.x | **cały zestaw solid+brands (~2 044 ikon) w bundlu**, `<i>` zamieniane w runtime na inline SVG (229 SVG na stronie głównej) |
| Mapa | `@googlemaps/js-api-loader` | — | tylko podstrona kontakt (`/resources/Marker_1__1.webp`) |
| Anty-spam | reCAPTCHA v3 | — | `grecaptcha.execute(…, {action:'phone'})`, token odświeżany co 100 s. **Ładuje się na każdej stronie** (349 KB gzip) |
| Analityka | GTM + Consent Mode v2 | — | inline w `<head>` |
| Wideo | natywne `<video>` WebM | — | autoplay/muted/loop/playsinline, play/pause przez IntersectionObserver |
| Miniatury | phpThumb | — | `/photo/phpThumb.php?src=…&w=1000&q=90&f=webp` |
| Dane strukturalne | JSON-LD `LocalBusiness` | — | inline |

**Brak**: GSAP, three.js, Lottie/Rive, frameworka JS, routera SPA (każde kliknięcie to pełne przeładowanie strony), `srcset`, `<picture>`, woff2.

---

## 2. Architektura DOM i system atrybutów

```
html[lang=pl-PL][data-d="ft-fy=main-rr ft-se=1px"].lenis     ← 1rem = 1px
body
├─ header [data-s="Header"]                  fixed, z:1000, h 80px, transition 250ms
│   ├─ [Header.header]                       wariant v1 (duże logo w hero) / v2 (czarny pasek #0f0f0f)
│   └─ hamburger (czarne kółko 40px)
├─ main [data-s="Cookies.blur"]
│   ├─ div (biała część, 0–8 444 px)
│   │   ├─ section [data-s="Splash Header.splash"]   300vh, w środku sticky 100dvh
│   │   ├─ div#tresc                                  kotwica „przewiń do treści”
│   │   ├─ div  (o nas, liczby, oferta, CMS)          4 748 px
│   │   └─ section [data-s="ScrollText"]              overflow: clip → zoom przez literę
│   └─ div (ciemna część #0f0f0f, 8 444–13 564 px)    realizacje, partnerzy, blog, kontakt
├─ footer
├─ [data-s="Chat"]          widget czatu AI (fixed, prawy dół) + dymek [Writer]
├─ [data-s="Modal"]         menu pełnoekranowe (rgba(0,0,0,.9))
├─ [data-s="Cursor"]        własny kursor (fixed, 110px, pointer-events:none)
└─ [data-s="Tooltip"]       własny tooltip zastępujący natywne [title]
```

**Każda sekcja ma własną nakładkę siatki**: `div[pn:ae tp:0 rt:0 bm:0 lt:0]` → kontener 34/36 → 4 kolumny po 25% z `border-left: 1px solid #e2e2e2` (na ciemnym `rgba(255,255,255,.2)`). Treść leży nad nią (`z-index: 100`).

### 2.1 Atomowy CSS w `data-d` — jak to czytać

Skrót = **pierwsza i ostatnia litera** każdego członu właściwości i wartości. Modyfikatory: `@2000:` (media max-width), `:hr->` (hover rodzica), `:fs-wn->` (focus-within rodzica), `@print:`.

| Zapis | CSS |
|---|---|
| `pn:fd tp:0 z-ix:1000 tn-dn:250ms` | `position:fixed; top:0; z-index:1000; transition-duration:250ms` |
| `ft-fy:1-sibd ft-se:30rem @2000:ft-se:24rem @1600:ft-se:20rem @1000:ft-se:16rem` | Poppins SemiBold, 30 → 24 → 20 → 16 px |
| `bd-cr:main-2 br-rs:3px ow:hn` | `background-color: var(--color-main-2); border-radius:3px; overflow:hidden` |
| `wg-me:vl-rl lr-sg:3rem tt-tm:ue` | `writing-mode: vertical-rl; letter-spacing:3px; text-transform:uppercase` |
| `ht:300vh pn:re @1000:ht:il` | `height:300vh; position:relative`, poniżej 1000 px `height: initial` |
| rodzic `:hr->wh`, dziecko `:hr->wh=100%` | „group-hover”: najechanie na rodzica ustawia dziecku `width:100%` |

`data-g="30 @2000=32 @1600=34 @1000=36"` = szerokość 30/36 kolumn, a od 2000 px w dół 32/36 itd. `data-g=">9"` ustawia szerokość **dzieciom**.

`data-s` to wyłącznie haki JS (`Splash`, `Counter`, `Curtain`, `Cursor.i`…). Bootstrap tworzy po jednej instancji klasy na moduł: `Estimate, Carousel, Preloader, Curtains, Accordion, Tab, Icons, Print, Header, Notification, Counter, ScrollText, Modal, Cookies, Chat, Writer, Splash, ScrollToContent, Video, SmoothScroll, Navigation, Cursor, Tooltip, Map, Animate, Audio, ScrollTextColorCover`.

**Wzorzec do zabrania:** tak jak na landonorris, zachowanie siedzi w atrybutach, a moduł JS szuka swoich elementów selektorem `[data-s~="…"]`. Różnica: tu nie ma lifecycle'u `init/destroy`, bo nie ma przejść SPA.

---

## 3. Sekcje strony głównej (kolejność, cel, co się dzieje)

Wysokość dokumentu: **13 988 px** przy vh = 697 (~20 ekranów). Część biała 0–8 444 px, ciemna 8 444–13 564 px, potem stopka.

| # | Sekcja | Pozycja / wysokość | Cel | Co widać i co się dzieje | Technologia |
|---|---|---|---|---|---|
| 1 | **Hero („Splash”)** | 0 / 300vh (sticky 100dvh) | Pierwsze wrażenie, „premium”, ludzie za firmą | Duże logo + „STRONY WWW PREMIUM / Z PAŃSTWEM OD 2000 ROKU”, obok **awatar migający przez 8 zdjęć zespołu co 200 ms**. W środku karta wideo 30% × 30% (zaokrąglenie 30px); słowa „CEL”, „KOD”, „PLAN”… są **wtopione w film**. Scroll rozszerza kartę do pełnego kontenera. Pod kartą przycisk dźwięku (lewituje), strzałka „przewiń” + hasło „Z PASJĄ DO INNOWACJI”. Prawa krawędź: pionowa lista 8 ikon social, lewy dół: 6 okrągłych skrótów kontaktu. | `clip-path` z JS na `scroll`, Swiper (fade, speed 0), ScrollReveal |
| 2 | **Manifest** | ~2 100 / ~350 px | Pozycjonowanie: co robimy i dla kogo | Nagłówek 40 px z inline ikonką aplikacji w zdaniu, tekst **zapełnia się z szarego `#bbb` na `#222` słowo po słowie**. Pod spodem lead 16 px. | ScrollTextColorCover |
| 3 | **KIM.JESTEŚMY** | ~2 450 / ~1 100 px | Zespół i biuro, „są prawdziwi ludzie” | Wielki napis AsenPro Black 70 px, „KIM” z gradientem. Pionowy eyebrow „PASJA TWORZENIA” na środkowej linii siatki. 4 karty ze zdjęciami biura (257×334), **kolumny przesunięte w pionie o ±170 px**, każde zdjęcie odsłania biała kurtyna zjeżdżająca w dół. Karta: mini-logo, numer 01–04, wartość (INNOWACJA, INSPIRACJA…), podtytuł, opis. | Curtain (IO), CSS |
| 4 | **ALPANET W LICZBACH** | ~3 900 / ~300 px | Social proof liczbami | 3 kolumny: ikona FA, liczba (26, 1 000+, 1 500+) jako **odometr** (cyfry przewijają się pionowo, każda z losowym opóźnieniem), podpis. Na liniach siatki czarne 80-pikselowe akcenty na górze sekcji. | Counter (IO) |
| 5 | **NASZA OFERTA** | ~4 300 / ~1 300 px | Katalog usług → podstrony | Nagłówek z wypełnianiem scrollem + lead. **8 kart oferty w siatce 4×2**, krzyżyki „+” na przecięciach linii. Na koniec okrągła odznaka „ALP VISUAL SYSTEM” z obracającym się napisem. | ScrollTextColorCover, Cursor, CSS animation |
| 6 | **ALP KREATOR (CMS + aplikacja)** | ~5 750 / ~1 000 px | Wyróżnik: autorski CMS i aplikacja natywna | „Mobilna aplikacja natywna to wisienka 🍒 na torcie…” (wisienka to obrazek w zdaniu). **Mockup laptopa i telefonu** (telefon gra wideo i lewituje), po bokach 2 okrągłe odznaki z obracającym się tekstem i ikoną (responsywność, SSL). | CSS keyframes, `<video>` |
| 7 | **Chatbot Alpi + „AI.REWOLUCJA”** | 6 839 / 1 604 px | Nowy produkt + przejście w ciemną część | Tag „NOWY MODUŁ”, nagłówek teal, opis. Potem sticky 100vh z napisem „AI.REW●LUCJA”: **czarne koło skaluje się 1 → 100**, pochłania ekran i staje się tłem. Na kole dwa telefony z czatem (lewitują). Dalej (już na czarnym) tekst „Chatbot Alpi to…” wypełniany `#444` → biały, odznaka z twarzą AI, „Dlaczego Chat Alpi?”. | ScrollText (scale), sticky, ScrollTextColorCover |
| 8 | **WEB.KREACJE (realizacje)** | ~8 500 / ~2 100 px | Portfolio, dowód jakości | Wielki napis z gradientem + pionowy eyebrow „NASZE REALIZACJE”. **8 kart realizacji w staggered gridzie** (kolumny 2 i 3 przesunięte o ±133 px). Część okładek to wideo odpalane przy 75% widoczności. | Curtain, Video (IO), Cursor |
| 9 | **Zaufali nam / partnerzy** | ~10 700 / ~1 000 px | Zaufanie, rozpoznawalne marki | Nagłówek + lead, eyebrow „NASI PARTNERZY”, **siatka 4×2 komórek z logotypami**; w każdej komórce mini-karuzela zmieniająca logo (autoplay 3,5 / 4 / 6 s, więc komórki zmieniają się niesynchronicznie). Wejście ScrollReveal z losowym opóźnieniem 71–976 ms. | Swiper ×4, ScrollReveal |
| 10 | **Blog** | ~11 700 / ~900 px | SEO, ekspertyza | 4 karty artykułów (ten sam komponent co realizacje: okładka, data, tytuł, opis, „Dalej”). Jedna okładka to wideo. | Swiper (`articles`: 1,25 slajdu na mobile, 4 na desktopie, autoplay 4 s) |
| 11 | **Kontakt** | ~12 500 / ~700 px | Konwersja | „Skontaktuj się z nami!” + formularz „oddzwonimy” (numer + 2 zgody + „Wyślij”), obok przewijany box z klauzulą RODO. | POST + reCAPTCHA v3 |
| 12 | **Footer** | 13 564 / ~420 px | Nawigacja, dane firmy | Logo, adres, telefon, mail, ikony social (białe kółka), skróty kontaktu, linki menu, copyright. | — |

**Elementy stałe na wszystkich ekranach:** header (chowany przy scrollu w dół), przycisk ustawień cookies (lewy dół), widget czatu z dymkiem (prawy dół), własny scrollbar (10 px, czarny kciuk na `#f2f2f2`).

---

## 4. Layout i siatka

### 4.1 Siatka logiczna: 36 kolumn w procentach

- Szerokość elementu = `n / 36 × 100%` (`data-g="9"` = 25%). Brak `max-width`, brak `clamp()`.
- **Kontener**: `data-g="30 @2000=32 @1600=34 @1000=36"`, wyśrodkowany (`data-a=".x."`):

| Viewport | Kontener | Przy 1182 px |
|---|---|---|
| > 2000 px | 30/36 = 83,3% | — |
| 1600–2000 | 32/36 = 88,9% | — |
| 1000–1600 | 34/36 = 94,4% | **1 107 px** (marginesy po 32,5 px) |
| < 1000 | 36/36 = 100% | — |

- **4 kolumny wizualne** po 25% kontenera (277 px przy 1 107). Karty mają `padding: 10px`, więc karta = 257 px.
- **Breakpointy** (desktop-first, `max-width`): **2000, 1600, 1450, 1300, 1000, 600** + `print`. Główna zmiana układu przy 1000 (Lenis off, hero bez rozszerzania, 2 kolumny kart).

### 4.2 Siatka widoczna (motyw graficzny)

- Linie: 1 px `#e2e2e2` na jasnym, `rgba(255,255,255,.2)` na ciemnym, na granicach 4 kolumn, przez całą wysokość sekcji.
- **Krzyżyki „+”** (ok. 20 px) tam, gdzie pionowa linia przecina poziomą granicę bloku (oferta, partnerzy, blog).
- **Czarne akcenty**: na początku niektórych sekcji linie siatki są przez 80 px czarne (`border-color: black`), jak znaczniki „tu zaczyna się sekcja”.
- **Pionowe eyebrowy** (`writing-mode: vertical-rl`, Poppins Medium 11 px, `letter-spacing: 3px`, uppercase) stoją na środkowej linii: „PASJA TWORZENIA”, „ALPANET W LICZBACH”, „NASZA OFERTA”, „ALP KREATOR”, „NASZE REALIZACJE”, „NASI PARTNERZY”.

### 4.3 Rytm i stagger

- Sekcje mają `padding-top: 80px` (40 px poniżej 1000). Bloki tekstowe: lewy margines = kolumna 1, szerokość ok. 3 kolumn.
- **Stagger kolumn** (desktop): w „Kim jesteśmy” kolumny zaczynają się na 2 966 / 3 137 / 2 794 / 2 966 px (różnice ±170 px), w realizacjach 9 270 / 9 137 / 9 403 / 9 270 (±133 px). W portfolio karty stoją już w równych rzędach.
- Nagłówki sekcji: eyebrow w kolorze teal (`Blog`, `Zaufali nam`) + nagłówek 40 px pod spodem, lead 13–16 px.

---

## 5. Typografia

- **Poppins** (Regular / Medium / SemiBold / Bold) do wszystkiego, **AsenPro** (Bold / ExtraBold / Black) do wielkich haseł „KIM.JESTEŚMY”, „WEB.KREACJE”, „AI.REWOLUCJA” i liczb. AsenPro to krój komercyjny, sprawdź licencję albo dobierz zamiennik.
- Fonty to **osobne pliki TTF na każdą grubość** (`font-family: "Poppins-SemiBold"` zamiast `font-weight`), `font-display: block`, bez preloadu.
- Rozmiary skaczą skokowo na breakpointach (nie ma płynnego skalowania). Wartości przy 1182 px:

| Rola | Krój | Rozmiar / interlinia | Inne | Przykład |
|---|---|---|---|---|
| Hasło display | AsenPro Black | 70 / 84 px | uppercase, pierwsze słowo z gradientem 220° | KIM.JESTEŚMY |
| Licznik duży (podstrony) | Poppins Medium | 120 px | odometr | 1 500+ |
| Nagłówek sekcji | Poppins SemiBold | 40 / 52 px | scroll-fill | „Nowoczesne strony WWW…” |
| Podtytuł sekcji | Poppins SemiBold | 30 / 39 px | — | „Twój Inteligentny Asystent AI” |
| Licznik | Poppins Bold | 30 px (box 50 px, `overflow: clip`) | — | 26 |
| Tytuł karty | Poppins SemiBold | 20 / 20–24 px | ten sam token: 30 → 24 → 20 → 16 | Strony WWW |
| Podtytuł karty | Poppins SemiBold | 16 px, kolor `#555` | — | z UX/UI |
| Lead | Poppins Medium | 16 / 22,4 px | — | „ALPANET to więcej niż…” |
| Tekst karty | Poppins Regular | 13 / 18,2 px | — | opisy |
| Tag / eyebrow karty | Poppins Regular | 12 / 14,4 px | uppercase, czasem `letter-spacing: 3px` | ALP VISUAL SYSTEM, SERWIS |
| Pigułka technologii | Poppins Regular | 10 / 10 px | uppercase, `radius 3px` | CMS, PHP 8.3, NODE |
| Eyebrow pionowy | Poppins Medium | 11 / 15,4 px | `letter-spacing: 3px`, `vertical-rl` | NASZA OFERTA |
| Przycisk | Poppins Regular | 12 px | biały na gradiencie | Dalej |

- Kropka jako separator w hasłach („KIM**.**JESTEŚMY”, „WEB**.**KREACJE”) to element identyfikacji, podobnie jak ikonki wstawiane w środek zdania (ikona aplikacji, wisienka).

---

## 6. Kolory

| Token | Hex | Rola |
|---|---|---|
| `--color-main-5` → `--color-main-6` | `#53779A` → `#3CC3A2` | **gradient marki** (90°): przyciski, tagi, kursor, hasła (wersja 220°) |
| `--color-main-2` | `#487977` | pigułka „CMS”, eyebrowy teal |
| `--color-main-3` / `-4` | `#FD4D00` / `#F87B3B` | logo, tag „SKLEP” |
| `--color-main-9` | `#CC2B2E` | tag „NOWY MODUŁ” |
| `--color-main-1` | `#454258` | tekst drugorzędny |
| `--color-17` | `#0F0F0F` | **ciemne tło** (część realizacje–stopka, compact header, koło w „AI.REW●LUCJA”) |
| `--color-10` | `#222222` | tekst główny / kolor „po wypełnieniu” |
| `--color-14` | `#BBBBBB` | tekst „przed wypełnieniem” (jasne tło) |
| `--color-18` | `#444444` | tekst „przed wypełnieniem” (ciemne tło) |
| `--color-16` | `#555555` | podtytuły kart |
| `--color-3` | `#E2E2E2` | linie siatki |
| `--color-1` | `#F2F2F2` | tor scrollbara |
| — | `rgba(255,255,255,.2)` | linie siatki na ciemnym |
| — | `rgba(0,0,0,.9)` | tło menu |

Paleta to w praktyce **biel + prawie czerń `#0F0F0F` + jeden gradient niebiesko-turkusowy**, z pomarańczem tylko w logo. Gradient jest wszędzie (przyciski, tagi, kursor, hasła, dymek czatu), przez co traci rolę akcentu.

