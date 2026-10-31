# INSPIRACJE — webexe

**Status:** kierunek przyjęty (2026-10-30), zastępuje landonorris.com. Pytania otwarte w sekcji 5.
**Źródła:** `docs/reference/alpanet-analiza.md`, `docs/reference/chipsa-analiza.md`, `BRIEF.md`, `DESIGN.md`

Strona jest showcase'owa: realizacje i produkt idą zaraz po Manifeście i są głównym blokiem strony. Nie ma kosztorysu ani konfiguratora (z Alpanetu nie bierzemy `/kosztorys`). Mapa sekcji jest w `BRIEF.md`.

Ten plik ustala, jaką **mechanikę** bierzemy z referencji i w którym miejscu strony. Wygląd (kolory, kroje, promienie, spacing) nigdy nie pochodzi z referencji, tylko z `DESIGN.md`. Treść pochodzi wyłącznie z `BRIEF.md`. Każdy obszar ma jedną główną referencję. Pozycje, których nie wypełnimy naszą treścią, są oznaczone jako zależne od **D3** albo od innej decyzji z `BRIEF.md`, która je blokuje.

> Analiza Alpanetu kończy się na sekcji 6 (Kolory), choć odwołuje się do sekcji 14. Wiersze z Alpanetem opierają się na sekcjach 0–6 tej analizy.

## 1. Rola referencji

- **alpanet.pl**: wzór tego, jak polska firma usługowa układa jedną długą stronę: kolejność sekcji, oferta, produkt na urządzeniach, dowody, kontakt i widoczna siatka jako rusztowanie.
- **chipsa.design**: wzór jakości ruchu i interakcji: trzy tempa i krzywe, reveal słów, kursor z etykietą, nawigacja w rogach ekranu, WebGL tylko tam, gdzie daje dotyk, i zachowanie na mobile.

## 2. Co bierzemy

| Obszar | Referencja | Bierzemy (mechanika) | Świadomie nie bierzemy |
|---|---|---|---|
| Struktura strony | Alpanet | Strona w dwóch częściach o różnych tłach (z `DESIGN.md`), połączonych jednym przejściem: zoom przez znak. U nich litera „O”, u nas x na końcu Manifestu, który `BRIEF.md` już tam stawia. Kolejność (showcase w centrum): 01 Hero → 02 Manifest → 03 Realizacje i dowody (D3) → 04 Produkt (D3) → 05 Jak pracujemy → 06 Poznaj nas (D10, D4) → 07 Kontakt. Pod wszystkimi sekcjami widoczna siatka: linie co 3 kolumny naszej 12-kolumnowej siatki, znaczniki na przecięciach, karty przesunięte w pionie (stagger). | Blog, liczby i partnerzy jako osobne sekcje (D3). Pionowe eyebrowy wersalikami i kropka jako separator w hasłach, bo zakazuje ich `DESIGN.md`. Stała kolumna ikon social, skróty kontaktu, czat. Długość ok. 20 ekranów. |
| Hero | Alpanet | Sticky tor (`.sticky-track`, ok. 300vh). Karta z obrazem rozszerza się przy scrollu od wycięcia (`clip-path: inset`) do pełnego kontenera. Obok karty stoją H1 i lead z `BRIEF.md`. Etykiety warstw (Aplikacje, Integracje, Automatyzacje, Utrzymanie) pojawiają się na obrazie, tak jak u nich słowa wtopione w film. Wideo gra tylko wtedy, gdy jest w widoku. **Treść karty zależy od D3** (nagranie prawdziwego systemu) albo od D5 (nasza platforma). | Awatar, który co 200 ms zmienia zdjęcie członka zespołu (bez twarzy w hero). Przycisk dźwięku, ikony social, skróty kontaktu, hasło-slogan. Wideo 4,6 MB ładowane także na mobile. Handler `scroll` bez rAF (u nas ScrollTrigger `scrub`). |
| Oferta | Chipsa | Akordeon na pełną wysokość ekranu: po hoverze albo fokusie kolumna rośnie (`flex-grow` 1 → 3) i odsłania opis. U nas 4 kolumny to 4 kroki z „Jak pracujemy”, z tekstem 1:1 z `BRIEF.md`. Poniżej 992 px kolumny zmieniają się w panele sticky na pełny ekran, które najeżdżają na siebie. 8 przykładowych rozwiązań z wersji 1 dzieli się 4 + 4 między panele Budujemy i Automatyzujemy (**D10**). Kolumny są równorzędne, więc to łagodzi też D11. | Pętle wideo z abstrakcją 3D w tle kolumn: nie mamy ich, więc kolumna działa na samej typografii. Podział na trzy filary. Etykiety kursora po angielsku. |
| Realizacje / showcase | Chipsa | **Zależne od D3.** Duże karty w jednej kolumnie. Na hoverze obraz przechodzi w wideo w shaderze (skośny front, promień z `DESIGN.md`). Szybki scroll lekko ściska karty (`lenis.velocity` w `gsap.ticker`). GL tylko przy `(hover: hover) and (pointer: fine)`, w pozostałych przypadkach `<img>` + `<video>`. Bez D3 sekcja wypada (`BRIEF.md`). | Badge statusu, wstęgi z nagrodami, link „ALL CASES”, podstrony case study z odliczaniem do następnego projektu. Etykiety ze „szkła” na zdjęciach. |
| Prezentacja produktu na urządzeniach | Alpanet | **Zależne od D3** (mogą to być własne narzędzia). Jeden produkt pokazany naraz na laptopie i telefonie, na telefonie gra prawdziwe nagranie ekranu. Ruch tylko za scrollem (lekka paralaksa). Urządzenia jako render albo zdjęcie, nie makieta w CSS. | Lewitacja w pętli i obracające się okrągłe odznaki z tekstem, bo to ruch sam z siebie, wbrew `DESIGN.md`. Obrazek wstawiony w zdanie („wisienka”). Odznaki „SSL” czy „responsywność” jako argumenty. |
| Dowody (liczby, logotypy) | Alpanet | **Zależne od D3.** Liczby jako odometr przy wejściu w widok, logotypy w komórkach widocznej siatki, wyłącznie prawdziwe dane. Jedyny dowód niezależny od D3 to żywy widget z platformy (D5). | Każda liczba i każde logo, których nie ma w `BRIEF.md`. Losowe opóźnienia wejścia i niesynchroniczne karuzele logotypów. Font Awesome. Opinie klientów (nie ma ich w `BRIEF.md`). |
| Kontakt | Alpanet | Krótki formularz na końcu strony: jedno pole kontaktu, zgoda, wysyłka. Obok bezpośredni kontakt do ludzi, którzy system zbudowali (`BRIEF.md`). CTA według **D9**, forma i obsługa według **D7**. | reCAPTCHA ładowana na każdej stronie (349 KB). Przewijany box z klauzulą RODO obok formularza (zamiast niego link do polityki prywatności). Mapa, czat AI. Copy „oddzwonimy”, którego nie ma w `BRIEF.md` (`TODO(treść)`). |
| Nawigacja | Chipsa | Układ rogów: wordmark w lewym górnym, stałe CTA w prawym górnym (D9), mapa rozdziałów w lewym dolnym. Menu wyrasta z przycisku w panel. Mapa prowadzi do 7 sekcji one-pagera, a jej punkty to znaki x (motyw, sekcja 4). Przy CTA zdjęcie jednego z founderów (D4). | `mix-blend-mode: difference`. Kropka „online”, jeśli nikt realnie nie odpowiada od razu. Czat w rogu. Linki menu wersalikami. Header chowany przy scrollu w dół (Alpanet). |
| Ruch i interakcje | Chipsa | Trzy tempa: UI 0,25–0,4 s, wejście treści ok. 1,2 s, zmiana kontekstu ok. 2 s, każde z jedną krzywą. Wartości trafiają do tokenów w `DESIGN.md`. Reveal słów w nagłówkach: słowo wjeżdża spod maski, stagger 0,04 s, jeden raz. Kursor to pierścień z etykietą pisaną zwykłą pisownią, w formie „wy” (copy jako `TODO(treść)`), tylko przy `pointer: fine`. Tilt za kursorem do ok. 6°. Podkreślenie linku, które zjeżdża na hoverze. Sticky zamiast pinowania (zasada 6). Jeden `gsap.ticker` na wszystko. | Odliczanie z automatycznym przejściem (WCAG 2.2.1). Sekwencje klatek na ikonach. 4–5 osobnych pętli rAF. Pominięcie `prefers-reduced-motion`. Framer Motion i wzorce z React (stack jest bez Reacta). Kurtyna przejść między stronami, bo wersja 1 nie ma podstron z treścią. |
| Mobile | Chipsa | Na dotyku natywny scroll, bez kursora i bez tiltu. Karty bez GL. Akordeon jako stos paneli sticky. Menu na pełny ekran z CTA na dole. Telefon w poziomie traktujemy jak mobile. Assety na mobile lżejsze niż na desktopie (budżet z `ARCHITECTURE.md`). | GL z modelami 1,8–3,6 MB w przepływie strony. Ślad dotyku na powierzchni. Skokowa zmiana zachowania na jednym progu szerokości: o GL i kursorze decyduje `hover`/`pointer`, a o układzie breakpointy z `DESIGN.md`. |

## 3. Konflikty i rekomendacje

### Między referencjami

1. **Hero: rozszerzająca się karta (Alpanet) czy obiekt zmieniany kliknięciem (Chipsa).** Obiekt Chipsy daje więcej „wow”, ale potrzebuje bohatera-bryły, a takie bryły (w tym x jako obiekt) były już kilka razy odrzucane. Karta to rama na prawdziwy obraz oprogramowania, więc od pierwszej sekundy czyta się jak software. Nie potrzebuje GLB i działa bez WebGL. **Rekomendacja: Alpanet.** Z Chipsy bierzemy tylko tilt karty za kursorem, który należy do wiersza „Ruch i interakcje”.
2. **Tekst słowo po słowie: wypełnianie scrollem (Alpanet) czy wjazd słów spod maski (Chipsa).** **Rekomendacja:** reveal Chipsy we wszystkich nagłówkach, a wypełnianie scrollem tylko w Manifeście, bo `BRIEF.md` opisuje go jako reveal sterowany scrollem. To jedyny wyjątek od zasady „ruch = Chipsa”.
3. **Koniec strony: stopka (Alpanet) czy odliczanie do następnej strony (Chipsa).** **Rekomendacja: stopka z kontaktem.** Wersja 1 to one-pager, a automatyczne przejście łamie WCAG 2.2.1.
4. **WebGL: wcale (Alpanet) czy punktowo (Chipsa).** **Rekomendacja: punktowo, tylko tam, gdzie daje dotyk**, czyli na kartach realizacji. three.js wypada ze stacku bazowego i dochodzi tylko na żądanie speca sekcji (`ARCHITECTURE.md`, „GL (opcjonalny)”).
5. **Menu: pełnoekranowy modal (Alpanet) czy panel wyrastający z przycisku (Chipsa).** **Rekomendacja: Chipsa**, razem z układem rogów. Header się nie chowa, bo stałe elementy stoją w rogach.
6. **Siatka: widoczne 4 kolumny (Alpanet) czy 24 kolumny z nagłówkami przesuniętymi względem treści (Chipsa).** **Rekomendacja:** linie Alpanetu na naszej 12-kolumnowej siatce (co 3 kolumny), bez przesunięcia nagłówków, bo rytm daje już stagger kart.
7. **Próg „desktopu”: 1000 px (Alpanet) czy 1200 px (Chipsa).** **Rekomendacja: żaden.** Układ zmienia się na breakpointach z `DESIGN.md` (992 / 768), a GL, kursor i tilt włączamy według `(hover: hover) and (pointer: fine)`.

### Z naszymi dokumentami

- **Zamknięte 2026-10-31 (gałąź eksperymentu):** natywny scroll na dotyku i trzy tempa z Chipsy jako tokeny ruchu (`--d-ui`, `--d-enter`, `--d-context` z krzywymi) są w `DESIGN.md` (Ruch). Do wycofania, jeśli się nie sprawdzą.
- **Zamknięte 2026-10-30:** `BRIEF.md`, `CLAUDE.md`, `DESIGN.md` i `ARCHITECTURE.md` nie wskazują już landonorris.com. Obowiązuje wygląd z `DESIGN.md` (Laguna), a palety v2 i v3 w `tokens.css` są do usunięcia w sesji kodu.

## 4. Motyw przewodni: system na siatce, węzły to znak x

Cała strona stoi na jednej widocznej siatce. To jest uporządkowany system, który budujemy i przy którym zostajemy. W węzłach siatki, tam gdzie Alpanet stawia „+”, u nas stoi znak x z wordmarku. Motyw mówi to samo co wyróżnik z `BRIEF.md`: pod spodem jest porządek, a my jesteśmy w każdym jego punkcie.

Jak motyw prowadzi przez stronę:

- **Hero:** karta z obrazem rozszerza się do linii siatki.
- **Manifest:** kończy się znakiem x, a zoom przez jego środek otwiera drugą część strony.
- **Jak pracujemy:** kolumny akordeonu stoją na kolumnach siatki.
- **Produkt, realizacje i dowody (D3):** karty i komórki stoją na liniach siatki.
- **Nawigacja:** punkty mapy rozdziałów to znaki x.
- **Kontakt:** ostatni węzeł to CTA.

Motyw zastąpił pasma szumu i poziomice (2026-10-30). Reguły rysowania siatki i węzłów są w `DESIGN.md` (Motywy sygnaturowe).

## 5. Pytania

Otwarte:

1. Czy role referencji z sekcji 1 są trafne? Analiza Chipsy sama zaznacza, że jej rola („jakość wizualna i ruch”) była założeniem.
2. Analiza Alpanetu urywa się na sekcji 6 i brakuje w niej m.in. ruchu, mobile, wydajności oraz sekcji 14. Czy jest gdzieś pełna wersja?
3. Hero (D2): który projekt i jaki kadr trafia do karty? Rozstrzyga style frame w F2.
4. D3: które projekty (minimum 4) pokazujemy, z jakimi zrzutami, nagraniami i opisami? Czy mamy choć jedną prawdziwą liczbę i zgody na logotypy?
5. Kontakt (D7): czy jedno pole ma przyjmować telefon, mail, czy oba? Formularz przez nasz serwer czy mailto?
6. Czy mapa rozdziałów ma sens przy 7 sekcjach, czy wystarczy stałe CTA w rogu? Czy przy CTA ma być zdjęcie (D4)?

Rozstrzygnięte 2026-10-30:

- Wygląd: obowiązuje `DESIGN.md` (Laguna, Plus Jakarta Sans, Comfortaa). Palety v2 i v3 z `tokens.css` do usunięcia.
- Motyw: siatka z węzłami x zastępuje pasma szumu i poziomice.
- Struktura: showcase w centrum, kolejność jak w mapie w `BRIEF.md`. „Przykłady” przechodzą do paneli akordeonu w 05 (D10).
- D3: jest minimum 4 projekty do pokazania.
- GL: three.js nie jest częścią stacku bazowego. Dochodzi tylko na żądanie speca sekcji.
- Dokumenty: `BRIEF.md`, `DESIGN.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `ASSETS.md` i `PROGRESS.md` są zaktualizowane pod ten kierunek.
