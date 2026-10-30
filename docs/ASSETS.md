# ASSETS — webexe

## Zasady

- **Assety przygotowujesz w osobnej sesji niż kod.** Sesja kończy się plikami w `assets-src/` i wpisami w `assets-src/manifest.json`. Sesja kodu korzysta już tylko z gotowych plików w `public/`.
- Każdy plik ma wpis w manifeście, żeby dało się go odtworzyć i podmienić.
- **Twarzy founderów nie generujemy AI.** Zdjęcia osób pochodzą wyłącznie z prawdziwej sesji.
- **Showcase to prawdziwy materiał.** Zrzuty i nagrania realizacji i produktów pochodzą z naszych systemów (D3), a nie z generatora. Logotypy klientów tylko za ich zgodą.
- Jeśli coś generujesz, model wybierasz przez fal MCP (`search_models` / `recommend_model`) i przed użyciem sprawdzasz, czy nie ma nowszej wersji.

Format wpisu w `manifest.json`:

```json
{
  "id": "WORK-01",
  "file": "assets-src/work/work-01_hover.mp4",
  "source": "screen-recording",
  "date": "2026-10-30",
  "post": ["crop 16:10", "1280 px", "av1 + mp4"],
  "output": "public/media/work/work-01.mp4"
}
```

## Lista

| ID | Sekcja | Co | Źródło | Status |
|---|---|---|---|---|
| BRAND-WM | wszędzie | wordmark `webexe.svg`, x jako osobna ścieżka `id="x"` | projektant / zamiana Comfortaa 700 na krzywe (D8) | ☐ |
| BRAND-X | 00, 02, węzły siatki, mapa rozdziałów, separator | znak x jako dwie linie `<line>` z `stroke-linecap: round` (pod DrawSVG) | ręcznie w SVG | ☐ |
| HERO-MEDIA | 01 | nagranie jednego projektu do karty hero (pętla, bez dźwięku) | nagranie ekranu prawdziwego systemu (D3) | ☐ |
| HERO-POSTER | 01 | pierwsza klatka HERO-MEDIA (fallback, reduced motion, LCP) | z HERO-MEDIA | ☐ |
| WORK-* | 03 | na każdą realizację: obraz okładki + krótka pętla wideo (hover obraz → wideo) | prawdziwe projekty (D3) | ☐ |
| LOGO-* | 03 | logotypy klientów do komórek siatki | od klientów, za zgodą (D3) | ☐ |
| PRODUCT-* | 04 | nagrania ekranu jednego produktu w wersji desktop i mobile + urządzenia (laptop, telefon) jako render albo zdjęcie | nagranie (D3), render / zdjęcie | ☐ |
| TEAM-1/2 | 06, CTA | portrety founderów | sesja zdjęciowa (D4) | ☐ |
| OG | head | obraz udostępnień 1200×630 | z wordmarku + kadru hero | ☐ |
| FAVICON | head | 16/32/180/512 ze znaku x | brand board ma już wersje | ☐ |

Stare assety hero z kierunku landonorris.com (HERO-A/B/ALPHA/DEPTH, prompty, seria EX) leżą w `docs/archive/assets-hero-pasma.md`.

## Nagrania ekranu (HERO-MEDIA, WORK-*, PRODUCT-*)

- Nagrywasz prawdziwy system na danych demonstracyjnych, bez danych klientów i bez treści, której nie ma w `BRIEF.md`.
- Pętla 6–12 s, bez dźwięku, start i koniec w tym samym stanie.
- Desktop: szerokość 1280 px. Mobile: osobne, lżejsze nagranie, a nie ten sam plik.
- Do każdego wideo poster (pierwsza klatka) w WebP.

## Pipeline

- **Obrazy:** oryginał trafia do `assets-src/`, potem `sharp` (skrypt `scripts/assets.mjs`, F1) robi resize i WebP/AVIF, a wynik ląduje w `public/` z wersją w nazwie.
- **Wideo:** AV1 w MP4 + zwykłe MP4 jako drugie źródło, `muted loop playsinline`, ładowane leniwie (IntersectionObserver, `preload="none"` albo `metadata`).
- **3D (tylko jeśli spec sekcji go wymaga):** Blender → GLB (eksport headless z CLI) → `@gltf-transform/cli` (Meshopt/Draco, tekstury WebP) → `public/gl/models/`.
- **Fonty:** self-host woff2 z subsetem latin + latin-ext (polskie znaki).
