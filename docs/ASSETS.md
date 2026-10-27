# ASSETS — webexe

## Zasady

- **Assety generujesz w osobnej sesji niż kod.** Sesja generowania kończy się plikami w `assets-src/` i wpisami w `assets-src/manifest.json`. Sesja kodu korzysta już tylko z gotowych plików w `public/`.
- Każdy wygenerowany plik ma wpis w manifeście, żeby dało się go odtworzyć i podmienić.
- **Twarzy founderów nie generujemy AI.** Zdjęcia osób pochodzą wyłącznie z prawdziwej sesji.
- Model wybierasz przez fal MCP (`search_models` / `recommend_model`). Endpointy w tym pliku to stan z października 2026, więc przed użyciem sprawdź, czy nie ma nowszej wersji.

Format wpisu w `manifest.json`:

```json
{
  "id": "HERO-A",
  "file": "assets-src/hero/hero-a_v3.png",
  "source": "ai",
  "endpoint": "fal-ai/nano-banana-pro",
  "prompt": "…",
  "seed": 12345,
  "date": "2026-10-27",
  "post": ["bg-removal: <endpoint>", "resize 2048 long edge", "webp q82"],
  "output": "public/gl/textures/hero/hero-a.webp"
}
```

## Lista

| ID | Sekcja | Co | Źródło | Status |
|---|---|---|---|---|
| BRAND-WM | wszędzie | wordmark `webexe.svg`, x jako osobna ścieżka `id="x"` | projektant / zamiana Comfortaa 700 na krzywe (D8) | ☐ |
| BRAND-X | 00, 02, separator | znak x jako dwie linie `<line>` z `stroke-linecap: round` (pod DrawSVG) | ręcznie w SVG | ☐ |
| HERO-A | 01 | powierzchnia, wycięta (wariant 1: aplikacja; wariant 2: papierowa robota) | AI (prompty niżej) + usunięcie tła | ☐ |
| HERO-B | 01 | to, co pod spodem: ta sama sylwetka jako prześwietlenie | AI, edycja HERO-A | ☐ |
| HERO-ALPHA | 01 | wspólna maska alfa A i B | z HERO-A po usunięciu tła | ☐ |
| HERO-DEPTH | 01 | mapa głębi HERO-A | Marigold depth na fal | ☐ |
| HERO-STATIC | 01 | statyczny kadr pasm (fallback, reduced motion) | screenshot z GL w F4 | ☐ |
| EX-01…08 | 04 | 8 ilustracji przykładowych rozwiązań w języku wizualnym HERO-B (zależy od D10) | AI, jedna seria | ☐ |
| WORK-* | 05 | screeny realizacji, para base/hover | prawdziwe projekty (D3) | ☐ |
| TEAM-1/2 | 06 | portrety founderów + mapy głębi | sesja zdjęciowa (D4) + Marigold | ☐ |
| X-3D | 07 | obiekt 3D x | **kod** (dwie kapsuły w three.js), bez pliku | ☐ |
| HDRI | 07 | oświetlenie obiektu x | Poly Haven (CC0), 1k, warianty light/dark | ☐ |
| OG | head | obraz udostępnień 1200×630 | z wordmarku + kadru hero | ☐ |
| FAVICON | head | 16/32/180/512 ze znaku x | brand board ma już wersje | ☐ |

## HERO: prompty

W obu wariantach obowiązuje ta sama zasada: **A i B muszą mieć identyczny kadr, sylwetkę i perspektywę**, bo inaczej pasma będą „rwać” obiekt. Dlatego B robisz zawsze edycją A, a nie osobną generacją.

Spike F2 porównuje oba warianty na tym samym shaderze (różnią się tylko tekstury), a potem rozstrzygamy D2.

### Wariant 1 (rekomendowany): aplikacja → infrastruktura pod nią

Na powierzchni aplikacja, której używa klient. Pod nią to, przy czym zostajemy na lata: serwery, kopie zapasowe, monitoring, deploy. Wprost ilustruje H1 („zostajemy przy nim na lata”) i lead („utrzymujemy na własnej infrastrukturze”).

**HERO-A** (text-to-image, np. Nano Banana Pro, proporcje 4:5, maksymalna rozdzielczość):

```
A single isolated object: a compact sculptural cluster of floating web application
interface panels - a dashboard card with simple charts, a data table panel, a form panel
and one small mobile screen - slightly overlapping at different depths, forming one
cohesive shape. Three-quarter view from slightly above, centred, fully in frame with margin.
Premium product-render look: frosted white and very pale mint surfaces (#FFFFFF, #E6F4F1),
soft rounded corners, a few small teal-to-emerald accents (#0891B2 to #10B981).
Soft diffused studio light from the upper left, gentle contact shadow.
Plain seamless pale mint-grey background (#E6F4F1).
Abstract placeholder blocks instead of words: no legible text, no logos, no brand names.
```

**HERO-B** (edycja obrazu, wejście: HERO-A z tłem):

```
Use the provided image as an exact composition reference. Keep the identical silhouette,
position, scale and perspective of every panel. Reveal what runs underneath the application:
render the whole cluster as a technical x-ray of its infrastructure - inside the panels show
server racks, database cylinders, stacked backup copies, monitoring graphs with heartbeat
lines and a deployment pipeline, connected by thin glowing flow lines.
Deep dark teal fill (#0F1F24), edges and lines in a teal-to-emerald gradient
(#0891B2 to #10B981), subtle inner glow, blueprint precision.
Same plain pale mint-grey background. No legible text, no logos.
```

Uwaga: warstwa A jest jasna na jasnym tle. Wybierz kadr z wyraźnym cieniem kontaktowym i czytelną sylwetką, żeby obiekt nie zlewał się z Pianą.

### Wariant 2: ręczna robota → system

Na powierzchni papierowa, ręczna robota, pod nią uporządkowany system. Mocniej mówi o automatyzacji, słabiej o utrzymaniu.

**HERO-A:**

```
A tall, slightly precarious stack of everyday office paperwork shown as one isolated object:
printed spreadsheets, invoices, delivery notes, two ring binders with handwritten labels,
a clipboard, colourful sticky notes, paper clips, a few receipts sliding off the side.
Three-quarter view from slightly above, centred, the whole stack fully in frame with margin.
Soft diffused studio light from the upper left, gentle contact shadow.
Plain seamless pale mint-grey background (#E6F4F1). Photorealistic, crisp detail,
everything in focus. No people, no legible text, no logos, no brand names.
```

**HERO-B** (edycja HERO-A):

```
Use the provided image as an exact composition reference. Keep the identical silhouette,
position, scale and perspective of every object. Transform the whole stack into a clean
technical x-ray of a software system: each sheet of paper becomes a crisp translucent panel
with simple interface blocks and data rows, the binders become database cylinders, sticky notes
become small status chips, and thin glowing flow lines connect the elements.
Deep dark teal fill (#0F1F24), edges and lines in a teal-to-emerald gradient (#0891B2 to #10B981),
subtle inner glow, blueprint precision. Same plain pale mint-grey background.
No legible text, no logos.
```

### Po wygenerowaniu (oba warianty)

1. Wybierz kadr ze zwartą sylwetką, bez cienkich, odstających elementów (dają poszarpaną krawędź po wycięciu).
2. Usuń tło z A (fal: `search_models "remove background"`) i z kanału alfa zapisz **HERO-ALPHA**.
3. **Kontrola wyrównania:** nałóż A i B w edytorze z kryciem 50%. Jeśli rozjazd przekracza ~8 px na krawędziach, generujesz ponownie albo korygujesz warpem.
4. Na B nakładasz **tę samą** maskę HERO-ALPHA.

### HERO-DEPTH

Marigold depth (`fal-ai/imageutils/marigold-depth`) na HERO-A. Wynik zapisujesz w skali szarości (jasne = blisko). Normale liczymy w shaderze z pochodnych mapy głębi, więc osobny plik normal map nie jest potrzebny.

### Eksport HERO

Desktop: dłuższa krawędź 2048 px. Mobile: 1280 px (wariant `-m`). WebP q80–85, depth i alpha jako WebP lossless w skali szarości. Obiekt jest wycięty, więc te same pliki działają na mobile, zmienia się tylko kadrowanie w layoucie.

## EX-01…08: seria ilustracji (sekcja 04)

Jeden styl dla całej serii, czyli język wizualny HERO-B: prześwietlony obiekt-symbol danego rozwiązania na Głębi, krawędzie w gradiencie Laguna. Najpierw generujesz jedną ilustrację-wzorzec, akceptujesz ją, a kolejne robisz z nią jako referencją stylu. Lista obiektów powstanie razem ze spec-em sekcji 04.

## Pipeline

- **Obrazy:** oryginał trafia do `assets-src/`, potem `sharp` (skrypt `scripts/assets.mjs`, F1) robi resize i WebP/AVIF, a wynik ląduje w `public/` z wersją w nazwie.
- **3D (jeśli kiedyś plik, a nie kod):** Blender → GLB (eksport headless z CLI) → `@gltf-transform/cli` (Meshopt/Draco, tekstury WebP) → `public/gl/models/`.
- **Fonty:** self-host woff2 z subsetem latin + latin-ext (polskie znaki).
