# BRIEF — webexe

## Kim jesteśmy

webexe buduje oprogramowanie dla firm i zostaje przy nim na lata. Robimy aplikacje webowe, systemy wewnętrzne, integracje i automatyzacje z AI. Projektujemy je razem z klientem, wdrażamy etapami i utrzymujemy na własnej infrastrukturze. Klient pisze bezpośrednio do ludzi, którzy system zbudowali.

**Wyróżnik:** nie oddajemy projektu i nie znikamy. Utrzymanie i dalszy rozwój na własnej infrastrukturze to rdzeń oferty, a nie dodatek. Cała strona ma to udowadniać.

## Cel strony

Jeden: potencjalny klient zaczyna rozmowę o projekcie. Każda sekcja prowadzi do CTA (brzmienie w D9).

Strona jest też naszym dowodem kompetencji. To, jak jest zbudowana i utrzymana, ma pokazywać poziom, na którym pracujemy.

## Dla kogo

Firmy, które potrzebują oprogramowania szytego na miarę i kogoś, kto się nim zajmie po wdrożeniu. Często mają za sobą system, który „ktoś kiedyś napisał”, i nikt już nie wie, jak działa. Decyduje właściciel albo kierownik operacyjny, raczej nie programista. *(Do potwierdzenia: branże i wielkość firm.)*

## Ton

Konkretny, spokojny, bez żargonu. Mówimy wprost, także o tym, czego nie warto budować.

- Zwracamy się do klienta w formie **„wy”, małą literą** („razem z wami”, „jak pracujecie”). Formy „Ty / Twój” nie używamy.
- Nie używamy buzzwordów („rewolucja”, „AI-powered”, „next-gen”), estetyki hakera ani terminala, ani liczb, których nie mamy.
- AI pokazujemy jako narzędzie z kontrolą człowieka („system przygotowuje, a człowiek zatwierdza”), a nie jako magię.

## Treść źródłowa (verbatim, jedyne źródło copy)

> Zmiany treści wprowadzasz tutaj, a dopiero potem w kodzie. Łamania linii oznaczone `/` są zamierzone na desktopie.

### 01 Hero
- **H1:** Budujemy / oprogramowanie / dla firm i zostajemy / przy nim na lata.
- **Lead:** Aplikacje webowe, systemy wewnętrzne, integracje i automatyzacje z AI. Projektujemy je razem z wami, wdrażamy etapami i utrzymujemy na własnej infrastrukturze.
- **CTA:** *(D9, propozycja: „Porozmawiajmy o projekcie”)*
- **Etykiety warstw rdzenia** (hover i rozkład przy scrollu, od góry): Aplikacje, Integracje, Automatyzacje, Utrzymanie. *(2026-10-27, od użytkownika; Utrzymanie jako podstawa, bo to rdzeń oferty)*

### 02 Manifest
- **Problem:** Większość firmowego oprogramowania powstaje raz i zostaje bez opieki. Po kilku latach nikt nie wie, jak działa, a każda zmiana jest ryzykiem.
- **Odpowiedź:** My budujemy tak, żeby dało się to rozwijać latami. I sami to rozwijamy.

### 05 Jak pracujemy (4 kroki)

**01 / 04 Projektujemy**
Zaczynamy od tego, jak naprawdę pracujecie, a nie od technologii. Rozpisujemy proces, mówimy wprost, co warto zbudować, a czego nie, i wyceniamy zakres przed startem.

**02 / 04 Budujemy**
Aplikacje webowe, panele, systemy wewnętrzne i integracje z tym, czego już używacie. Etapami: najpierw najważniejsza część, potem kolejne, każda po testach.

**03 / 04 Automatyzujemy**
Powtarzalną pracę przejmuje automat albo agent AI. Tam, gdzie decyzja ma znaczenie, system przygotowuje, a człowiek zatwierdza.

**04 / 04 Utrzymujemy**
Serwery, kopie zapasowe, monitoring, aktualizacje i dalszy rozwój. Gdy coś trzeba zmienić, piszecie do ludzi, którzy to zbudowali.

### Treść z wersji 1, do decyzji D10

Zostaje tylko wtedy, gdy ją potwierdzimy i dostosujemy do formy „wy”.

**Przykładowe rozwiązania** (kandydat do paneli sekcji 05: cztery pierwsze do Budujemy, cztery ostatnie do Automatyzujemy):
- Systemy zarządzania zleceniami i projektami
- Aplikacje do obsługi klientów i pracowników
- Panele administracyjne i systemy wewnętrzne
- Dedykowane narzędzia do zarządzania danymi
- Automatyczne przetwarzanie dokumentów i danych
- Generowanie raportów, ofert i zestawień
- Automatyzacja obiegu informacji
- Wykorzystanie AI do wspomagania codziennych zadań

**Poznaj nas** (kandydat do sekcji 06):
Jesteśmy dwuosobowym zespołem programistycznym specjalizującym się w tworzeniu aplikacji i automatyzacji procesów biznesowych. Stawiamy na bezpośrednią współpracę, przemyślane rozwiązania i praktyczne wykorzystanie technologii. Naszym celem jest dostarczanie oprogramowania, które nie tylko dobrze działa, ale przede wszystkim wnosi rzeczywistą wartość do działalności klienta.

## Mapa strony

Wersja 1 to one-pager plus `/polityka-prywatnosci` i `/404`, bez kosztorysu i konfiguratora. Strona jest showcase'owa: realizacje i produkt idą zaraz po Manifeście i są głównym blokiem strony. Mechanikę opisuje `docs/INSPIRACJE.md`.

| # | Sekcja | Treść | Mechanika (`INSPIRACJE.md`) | Zależy od |
|---|---|---|---|---|
| 00 | Loader | — | znak x rysuje się dwiema kreskami, potem wejście hero, limit 2,5 s | D8 |
| 01 | Hero | Hero | karta z nagraniem jednego projektu rozszerza się na sticky torze do pełnego kontenera, etykiety warstw na obrazie (Alpanet) | **D3** (materiał), D9 |
| 02 | Manifest | Manifest | wypełnianie scrollem **słowo po słowie**, słowo-akcent „latami”, na końcu znak x i zoom przez jego środek do ciemnej części strony (Alpanet) | — |
| 03 | Realizacje | **D3** (min. 4 projekty: tytuł, opis, obraz, wideo), na końcu dowody (logotypy, liczby) | duże karty, hover obraz → wideo, ściskanie przy szybkim scrollu (Chipsa); logotypy w komórkach siatki, liczby jako odometr (Alpanet) | **D3** |
| 04 | Produkt | **D3** (jeden produkt) | ten sam produkt na laptopie i telefonie, nagranie ekranu, paralaksa scrollem (Alpanet) | **D3** |
| 05 | Jak pracujemy | 4 kroki; przykładowe rozwiązania 4 + 4 w panelach Budujemy i Automatyzujemy | akordeon 4 kolumn, poniżej 992 px stos paneli sticky (Chipsa) | D10, D11 |
| 06 | Poznaj nas | D10 | zdjęcia na kolumnach siatki ze staggerem (Alpanet, „Kim jesteśmy”), szczegóły w specu; spina się z „piszecie do ludzi, którzy to zbudowali” | D4, D10 |
| 07 | Kontakt / stopka | CTA (D9) | krótki formularz + bezpośredni kontakt, ostatni węzeł x to CTA, wielki wordmark (Alpanet + motyw) | D7, D9 |

- **Warstwa globalna (Chipsa):** nawigacja w rogach ekranu, menu wyrastające z przycisku, mapa rozdziałów z punktami x, stałe CTA, kursor z etykietą.
- **Tła:** 01–02 jasne, potem przejście przez x; 03–04 ciemne (media świecą na Głębi); 05–06 jasne; 07 Głębia. Powrót na jasne tło przed 05 to zwykła granica sekcji, bez drugiego dużego momentu.

## Decyzje

Rozstrzygnięte:
- ~~D1. Oferta~~: budujemy i utrzymujemy oprogramowanie dla firm (aplikacje webowe, systemy wewnętrzne, integracje, automatyzacje z AI). Strony wizytówkowe nie są eksponowane. *(2026-10-27)*

Otwarte (w nawiasie faza, którą blokują):
- **D2. Koncept hero.** Kierunek z `INSPIRACJE.md`: karta z nagraniem jednego projektu, która rozszerza się scrollem do pełnego kontenera. Otwarte: który projekt i jaki kadr. Rozstrzyga style frame i nowy spec hero w F2. *(blokuje F4)*
- **D3. Realizacje.** Częściowo rozstrzygnięte: jest minimum 4 projekty do pokazania *(2026-10-30)*. Otwarte: które projekty, zrzuty, nagrania i opisy (tytuł, krótki opis) do tego pliku, logotypy klientów za zgodą, prawdziwe liczby, jeśli są. *(blokuje 01, 03 i 04)*
- **D4. Zdjęcia founderów.** Sesja: termin, miejsce, kto robi. *(blokuje 06)*
- **D5. Żywy widget w hero.** Jakie dane z platformy mogą być publiczne i pod jakim endpointem? Po zmianie oferty to **dowód na „utrzymujemy na własnej infrastrukturze”**, więc warto go mieć w wersji 1. *(nie blokuje, jest za flagą)*
- **D6. Język.** Tylko PL czy także EN?
- **D7. Kontakt i analityka.** Formularz przez nasz serwer pocztowy czy mailto + telefon? Plausible, GA4 czy nic? Od tego zależy baner cookies.
- **D8. Wordmark SVG.** Plik od projektanta czy generujemy z Comfortaa 700? Litera x musi być osobną ścieżką.
- **D9. Brzmienie CTA w formie „wy”.** Propozycja: „Porozmawiajmy o projekcie”. *(blokuje F3)*
- **D10. Treść z wersji 1.** Czy zostają przykładowe rozwiązania (w panelach sekcji 05) i „Poznaj nas” (06)? Jeśli tak, trzeba je przepisać na formę „wy” i nowy ton. *(blokuje F3)*
- **D11. Kroki 01–04.** Numeracja mówi „to jest kolejność”. Projektujemy → Budujemy → Utrzymujemy to faktycznie etapy, ale Automatyzujemy jest bardziej rodzajem pracy niż etapem. Zostawiamy numerację (czytaną jako cykl życia projektu), czy krok 03 przeformułowujemy? Akordeon w sekcji 05 stawia kroki obok siebie jako równorzędne, co łagodzi problem. *(blokuje 05)*
