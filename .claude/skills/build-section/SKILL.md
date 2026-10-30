---
name: build-section
description: Workflow budowy lub dopracowania jednej sekcji strony webexe od speca do commita — plan, implementacja warstwami, weryfikacja wizualna i wydajnościowa, aktualizacja PROGRESS.md. Używaj, gdy użytkownik zaczyna pracę nad sekcją (np. "buduj hero", "/build-section 01-hero", "dopracuj manifest") albo nad plikiem z docs/sections/.
---

# Budowa sekcji

Sekcję wskazuje argument albo wiadomość użytkownika. Jeśli nie jest wskazana, bierzesz pierwszą niezamkniętą pozycję z `docs/PROGRESS.md` i potwierdzasz ją z użytkownikiem.

## 1. Kontekst

Przeczytaj w tej kolejności:
1. `docs/sections/NN-*.md` (spec). Jeśli speca nie ma albo ma status `draft`, zatrzymaj się. Napisz go z `_TEMPLATE.md` i poproś o akceptację.
2. `docs/DESIGN.md`
3. Te fragmenty `docs/ARCHITECTURE.md`, których dotyczy sekcja.
4. Klatki w `docs/refs/NN-*/`.
5. Wiersz sekcji w `docs/INSPIRACJE.md` i wskazane w specu sekcje analiz w `docs/reference/`. Opisują technikę, a nie kod do skopiowania.

## 2. Plan (plan mode)

- Zanim zaplanujesz, zadaj użytkownikowi pytania o wszystko, czego spec nie rozstrzyga. Pytaj o konkretne liczby i zachowania, a nie ogólnie.
- Plan rozpisz na etapy ze speca. Przy każdym etapie podaj pliki, które powstaną albo się zmienią, i sposób weryfikacji.
- Wypisz pliki spoza sekcji, które musisz ruszyć (np. `core/`, `gl/`), i uzasadnij każdy.

## 3. Implementacja warstwami

Zawsze ta kolejność: **statyka → ruch DOM → GL → mobile, dotyk, reduced motion, fallbacki**.

Po każdym etapie:
1. `npm run check` i `npm run build` przechodzą.
2. Weryfikacja przez subagenta `visual-qa`: ten etap, 4 breakpointy.
3. Commit `feat(<sekcja>): <etap>`.

Jeśli zmieniasz parametr GL po strojeniu w `lil-gui`, przepisz go do `gl/params.ts` w tym samym etapie.

## 4. Definition of Done

- [ ] Wygląd zgodny ze specem i klatkami referencyjnymi na 1920, 1440, 834 i 390 px
- [ ] Fluid scaling: brak przeskoków przy płynnej zmianie szerokości 992 → 1920
- [ ] 60 fps w trace (Chrome DevTools) na scrollu i interakcjach, bez long tasks > 50 ms po `app:ready`
- [ ] `prefers-reduced-motion`: brak ruchu poza natywnym scrollem, treść kompletna
- [ ] Bez WebGL: sekcja kompletna i czytelna
- [ ] Dotyk: każda interakcja hover ma odpowiednik albo świadomie jej nie ma (zapisane w specu)
- [ ] CLS = 0, obrazy mają wymiary, fonty nie przeskakują
- [ ] Klawiatura: kolejność focusu logiczna, focus widoczny, nic nie wpada w pułapkę
- [ ] Semantyka: poprawne nagłówki, alty, `aria-hidden` na elementach dekoracyjnych
- [ ] Treść 1:1 z `BRIEF.md`, brak wymyślonych liczb, `TODO(treść)` tam, gdzie brak
- [ ] Kolory i rozmiary tylko z tokenów (hook nie zgłasza hexów)
- [ ] Moduły mają `destroy()`, który sprząta wszystko. Test: init → destroy → init nie dubluje ScrollTriggerów (`ScrollTrigger.getAll().length`)
- [ ] Konsola bez błędów i ostrzeżeń
- [ ] `npm run check`, `npm run lint` i `npm run build` czyste
- [ ] Commit + tag `<sekcja>-v1`

## 5. Zamknięcie sesji

1. Ustaw status w specu (`done` albo `w budowie` + co zostało).
2. Dopisz wpis do „Logu sesji” w `PROGRESS.md`: co zrobione, co zostało, decyzje, lekcje.
3. Lekcje, które mają obowiązywać dalej, dopisz tam, gdzie będą czytane: wzorzec do `ARCHITECTURE.md`, reguła wizualna do `DESIGN.md`, twarda zasada do `CLAUDE.md`. Zapytaj użytkownika przed zmianą `CLAUDE.md`.
