# Archiwum: assety hero z kierunku landonorris.com (pasma, A/B)

Wycofane 2026-10-30 razem z kierunkiem landonorris.com. Wycięte z `docs/ASSETS.md` bez zmian treści.

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
