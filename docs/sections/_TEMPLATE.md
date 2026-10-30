# NN — Nazwa sekcji

**Status:** draft | zaakceptowany | w budowie | done
**Zależności:** (fazy, moduły, assety, decyzje)
**Wzorzec:** (wiersz z `docs/INSPIRACJE.md` + sekcja analizy w `docs/reference/` + klatki w `docs/refs/NN-*/`)

## Cel

Co odbiorca ma zrozumieć albo poczuć po tej sekcji, w jednym, dwóch zdaniach. Jak sekcja prowadzi do CTA.

## Treść

Cytaty z `BRIEF.md`, nic więcej. Brakującą treść oznacz jako `TODO(treść)`.

## Struktura DOM

```html
<!-- szkielet z atrybutami data-* (tylko z tabeli w ARCHITECTURE.md) -->
```

## Layout

Szkic ASCII dla 1440 i 390 oraz opis różnic na 834. Wyrównanie, kolumny siatki, tło (token), motyw nawigacji.

## Interakcje i ruch

Każda pozycja jako: **wyzwalacz → efekt → liczby** (czas, easing, zakres progresu scrolla, odległości w rem/px, parametry shadera). Bez słów typu „płynnie”, „ładnie” czy „jak w referencji”.

| # | Wyzwalacz | Efekt | Liczby |
|---|---|---|---|

## Reduced motion / bez WebGL / dotyk

Co dzieje się zamiast każdej interakcji z tabeli wyżej.

## Assety

ID z `ASSETS.md` i ścieżki w `public/`.

## Etapy implementacji

Warstwy w kolejności, a po każdej build i commit. Np.: S1 statyka, S2 ruch DOM, S3 GL (jeśli sekcja go ma), S4 mobile + reduced motion + fallbacki.

## Kryteria akceptacji

Konkretne i sprawdzalne punkty, plus DoD z `build-section`.

## Poza zakresem

Co świadomie NIE wchodzi do tej sesji.

## Decyzje otwarte

Pytania do użytkownika, zanim ruszy kod.
