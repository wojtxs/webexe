# webexe — paczka startowa pod Claude Code

Te pliki wrzucasz do pustego repo, zanim powstanie jakikolwiek kod. Claude Code czyta `CLAUDE.md` na starcie każdej sesji, a resztę bierze z `docs/`, kiedy jest potrzebna.

## Co gdzie leży

```
CLAUDE.md                     zasady i mapa, czytane co sesję
docs/BRIEF.md                 oferta, treść (jedyne źródło copy), decyzje otwarte D1–D8
docs/DESIGN.md                tokeny z brand boardu, typografia, ruch, zakazy
docs/ARCHITECTURE.md          Astro + moduły data-*, GL, ładowanie, budżety, deploy
docs/ASSETS.md                lista assetów, prompty do hero, pipeline
docs/PROGRESS.md              fazy F0–F7 z warunkami wyjścia, logi
docs/sections/_TEMPLATE.md    szablon speca sekcji
docs/sections/01-hero.md      pełny spec hero
docs/reference/               analiza landonorris.com (tylko do odczytu, chroni ją hook)
docs/refs/01-hero/            tu wrzucasz klatki referencyjne
.claude/skills/build-section  rytuał budowy sekcji + pełne DoD
.claude/agents/visual-qa.md   subagent: Chrome, 4 breakpointy, trace, raport
.claude/hooks/                guard (blokuje zapis do referencji) + post-edit (prettier, eslint, kontrola hexów)
.claude/settings.json         podpięcie hooków
.mcp.json                     Chrome DevTools MCP + Context7 (na poziomie projektu)
assets-src/                   oryginały assetów + manifest generowania
```

## Setup (raz)

1. `git init` i skopiowanie tej paczki do repo.
2. fal MCP na poziomie użytkownika:
   `claude mcp add --transport http --scope user fal https://mcp.fal.ai/mcp-relay`,
   potem w Claude Code `/mcp`, wybierasz `fal`, potem Authenticate.
3. Przeglądarka: rozszerzenie Claude in Chrome, a w Claude Code `/chrome`.
4. Przy pierwszym uruchomieniu w repo Claude Code zapyta o zgodę na serwery z `.mcp.json`. Zatwierdź.
5. Wymagany jest Node w PATH, bo hooki to skrypty `.mjs`.

## Prompty startowe

Każdą fazę zaczynasz od `/clear`. Tryb planowania włączasz Shift+Tab.

**F0, pomocniczo (osobna sesja, generowanie assetów):**
> Przeczytaj docs/ASSETS.md, sekcja HERO, wariant 1. Wygeneruj przez fal 4 propozycje HERO-A według promptu. Pokaż mi je i nic dalej nie rób, dopóki nie wybiorę. Każdy zapisany plik wpisuj do assets-src/manifest.json. (Potem to samo dla wariantu 2.)

**F1:**
> Jesteśmy w fazie F1 z docs/PROGRESS.md. Przeczytaj CLAUDE.md, docs/DESIGN.md i docs/ARCHITECTURE.md. Zanim zaplanujesz, zadaj mi pytania o wszystko, co niejasne. Potem plan na całą F1 z podziałem na commity.

**F2, spike:**
> Faza F2: spike maski hero w /lab. Spec efektu: docs/sections/01-hero.md, interakcje 4–7. Technika: docs/reference/landonorris-analiza.md, sekcje 4.1–4.2 i 15. Minimalny kod, bez sprzątania pod produkcję. Chcę zobaczyć efekt i stroić go w lil-gui.

**Każda sekcja:**
> /build-section 01-hero

**Nowa sekcja bez speca:**
> Napisz draft docs/sections/02-manifest.md z _TEMPLATE.md. Treść tylko z BRIEF.md, wzorzec z analizy (sekcja 3, wiersz 2). Zostaw decyzje otwarte na końcu. Kodu nie piszesz.

## Zasady, które warto pamiętać samemu

- Jedna sesja to jedna sekcja albo jedno zadanie. Kontekst czyścisz między nimi.
- Gdy Claude zaczyna „naprawiać” coś poza zakresem, przerwij (Esc) i odeślij go do sekcji „Poza zakresem” w specu.
- Gdy coś poszło źle, cofasz się do commita z poprzedniej warstwy i nie łatasz na łatce.
- Lekcje z sesji lądują w dokumentach, nie w Twojej głowie. Pilnuje tego wpis w PROGRESS.md na koniec sesji.
