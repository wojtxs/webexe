# webexe — paczka startowa pod Claude Code

Te pliki wrzucasz do pustego repo, zanim powstanie jakikolwiek kod. Claude Code czyta `CLAUDE.md` na starcie każdej sesji, a resztę bierze z `docs/`, kiedy jest potrzebna.

## Co gdzie leży

```
CLAUDE.md                     zasady i mapa, czytane co sesję
docs/BRIEF.md                 oferta, treść (jedyne źródło copy), mapa strony, decyzje D1–D11
docs/INSPIRACJE.md            kierunek: co bierzemy z alpanet.pl i chipsa.design, motyw przewodni
docs/DESIGN.md                tokeny z brand boardu, typografia, ruch, motywy, zakazy
docs/ARCHITECTURE.md          Astro + moduły data-*, wideo, GL (opcjonalny), ładowanie, budżety, deploy
docs/ASSETS.md                lista assetów, nagrania, pipeline
docs/PROGRESS.md              fazy F0–F7 z warunkami wyjścia, logi
docs/sections/_TEMPLATE.md    szablon speca sekcji (nowy spec hero powstaje w F2)
docs/reference/               analizy alpanet.pl i chipsa.design (tylko do odczytu, chroni je hook)
docs/refs/01-hero/            tu wrzucasz klatki referencyjne
docs/archive/                 wycofane: landonorris.com, stary spec hero, HANDOFF z 2026-10-27
.claude/skills/build-section  rytuał budowy sekcji + pełne DoD
.claude/agents/visual-qa.md   subagent: Playwright + DevTools, 4 breakpointy, trace, raport
.claude/hooks/                guard (blokuje zapis do referencji) + post-edit (prettier, eslint, kontrola hexów)
.claude/settings.json         podpięcie hooków
assets-src/                   oryginały assetów + manifest generowania
```

## Setup (raz)

1. `git init` i skopiowanie tej paczki do repo.
2. Wymagany jest Node w PATH, bo hooki to skrypty `.mjs`, a serwery MCP startują przez `npx`.
3. W terminalu, w katalogu repo (`playwright` dostaje scope local, czyli działa tylko w tym projekcie):

   ```
   claude mcp add playwright npx @playwright/mcp@latest
   claude mcp add chrome-devtools --scope user npx chrome-devtools-mcp@latest
   claude mcp add --transport http --scope user fal https://mcp.fal.ai/mcp-relay
   npx skills add vercel-labs/agent-skills --skill web-design-guidelines -a claude-code
   ```

   Komendy wpisujesz dokładnie tak, bez wrappera `cmd /c`. W Git Bash `/c` zamienia się w `C:/` i serwer nie startuje.

4. W sesji Claude Code:

   ```
   /plugin install frontend-design@claude-plugins-official
   /plugin install context7@claude-plugins-official
   ```

   Potem `/mcp`, wybierasz `fal` i Authenticate.

5. Przeglądarka do stron referencyjnych: rozszerzenie Claude in Chrome, a w Claude Code `/chrome`.
6. Sprawdzenie: `/mcp` pokazuje `playwright`, `chrome-devtools`, `fal` i `context7` jako połączone.

## Prompty startowe

Każdą fazę zaczynasz od `/clear`. Tryb planowania włączasz Shift+Tab.

**F1:**
> Jesteśmy w fazie F1 z docs/PROGRESS.md. Przeczytaj CLAUDE.md, docs/DESIGN.md i docs/ARCHITECTURE.md. Zanim zaplanujesz, zadaj mi pytania o wszystko, co niejasne. Potem plan na całą F1 z podziałem na commity.

**F2, materiał D3 (osobna sesja, assety):**
> Faza F2, krok 1. Przeczytaj docs/BRIEF.md (D3) i docs/ASSETS.md (nagrania ekranu). Pomóż mi spisać minimum 4 projekty: tytuł, krótki opis, jakie zrzuty i nagrania mamy. Opisy dopisz do BRIEF.md dopiero po mojej akceptacji, a pliki wpisuj do assets-src/manifest.json.

**F2, spec hero:**
> Faza F2, kroki 2–3. Przeczytaj docs/INSPIRACJE.md (wiersz Hero), docs/DESIGN.md i docs/BRIEF.md. Najpierw style frame karty hero z prawdziwym materiałem do akceptacji, potem draft docs/sections/01-hero.md z _TEMPLATE.md. Kodu nie piszesz.

**Każda sekcja:**
> /build-section 01-hero

**Nowa sekcja bez speca:**
> Napisz draft docs/sections/02-manifest.md z _TEMPLATE.md. Treść tylko z BRIEF.md, mechanika z wiersza w docs/INSPIRACJE.md i mapy strony w BRIEF.md. Zostaw decyzje otwarte na końcu. Kodu nie piszesz.

## Zasady, które warto pamiętać samemu

- Jedna sesja to jedna sekcja albo jedno zadanie. Kontekst czyścisz między nimi.
- Gdy Claude zaczyna „naprawiać” coś poza zakresem, przerwij (Esc) i odeślij go do sekcji „Poza zakresem” w specu.
- Gdy coś poszło źle, cofasz się do commita z poprzedniej warstwy i nie łatasz na łatce.
- Lekcje z sesji lądują w dokumentach, nie w Twojej głowie. Pilnuje tego wpis w PROGRESS.md na koniec sesji.
