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

### 02 Manifest
- **Problem:** Większość firmowego oprogramowania powstaje raz i zostaje bez opieki. Po kilku latach nikt nie wie, jak działa, a każda zmiana jest ryzykiem.
- **Odpowiedź:** My budujemy tak, żeby dało się to rozwijać latami. I sami to rozwijamy.

### 03 Jak pracujemy (4 kroki)

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

**Przykładowe rozwiązania** (kandydat do sekcji 04 Przykłady):
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

Wersja 1 to one-pager plus `/polityka-prywatnosci` i `/404`.

| # | Sekcja | Treść | Mechanika z landonorris.com |
|---|---|---|---|
| 00 | Loader | — | „Load Norris”: znak x rysuje się dwiema kreskami, potem reveal hero |
| 01 | Hero | Hero | twarz → kask w pasmach szumu; u nas aplikacja → infrastruktura pod nią (D2) |
| 02 | Manifest | Manifest | wielki tekst; u nas reveal **słowo po słowie** sterowany scrollem, słowo-akcent „latami”, znak x na końcu |
| 03 | Jak pracujemy | 4 kroki | ON / OFF TRACK: wielkie hasła na sticky tracku, tu 4 czasowniki z licznikiem 01–04 |
| 04 | Przykłady | D10 | galeria pozioma: sticky + translateX, podpisy, paralaksa |
| 05 | Realizacje | **brak treści** (D3) | Hall of Fame: staggered grid kart base/hover |
| 06 | Poznaj nas | D10 | zdjęcia 2.5D (depth); spina się z „piszecie do ludzi, którzy to zbudowali” |
| 07 | Kontakt / stopka | CTA (D9) | panel z maską, wielki wordmark, obiekt 3D x |

## Decyzje

Rozstrzygnięte:
- ~~D1. Oferta~~: budujemy i utrzymujemy oprogramowanie dla firm (aplikacje webowe, systemy wewnętrzne, integracje, automatyzacje z AI). Strony wizytówkowe nie są eksponowane. *(2026-10-27)*

Otwarte (w nawiasie faza, którą blokują):
- **D2. Koncept hero.** Rekomendacja: na powierzchni aplikacja, pod nią infrastruktura. Alternatywa: ręczna robota → system. Spike F2 porównuje oba warianty na tym samym shaderze. *(blokuje F4)*
- **D3. Realizacje.** Czy jest minimum 4 projekty do pokazania (mogą być własne narzędzia)? Jeśli nie, sekcja 05 wypada z wersji 1. *(blokuje 05)*
- **D4. Zdjęcia founderów.** Sesja: termin, miejsce, kto robi. *(blokuje 06)*
- **D5. Żywy widget w hero.** Jakie dane z platformy mogą być publiczne i pod jakim endpointem? Po zmianie oferty to **dowód na „utrzymujemy na własnej infrastrukturze”**, więc warto go mieć w wersji 1. *(nie blokuje, jest za flagą)*
- **D6. Język.** Tylko PL czy także EN?
- **D7. Kontakt i analityka.** Formularz przez nasz serwer pocztowy czy mailto + telefon? Plausible, GA4 czy nic? Od tego zależy baner cookies.
- **D8. Wordmark SVG.** Plik od projektanta czy generujemy z Comfortaa 700? Litera x musi być osobną ścieżką.
- **D9. Brzmienie CTA w formie „wy”.** Propozycja: „Porozmawiajmy o projekcie”. *(blokuje F3)*
- **D10. Treść z wersji 1.** Czy zostają przykłady (sekcja 04) i „Poznaj nas” (06)? Jeśli tak, trzeba je przepisać na formę „wy” i nowy ton. *(blokuje F3)*
- **D11. Kroki 01–04.** Numeracja mówi „to jest kolejność”. Projektujemy → Budujemy → Utrzymujemy to faktycznie etapy, ale Automatyzujemy jest bardziej rodzajem pracy niż etapem. Zostawiamy numerację (czytaną jako cykl życia projektu), czy krok 03 przeformułowujemy? *(blokuje 03)*
