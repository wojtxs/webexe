// Render ekranów DEMO do src/assets/demo/*.webp (zrzut @2x przez Playwright na Edge, konwersja sharpem).
// Flota renderuje się drugi raz z ?base (zrzut pod żywą warstwę hero) i zapisuje geometrię tras
// do src/data/hero-live.json.
// playwright-core nie jest zależnością projektu: ścieżkę podaj w PLAYWRIGHT_CORE (katalog pakietu).
// Użycie: PLAYWRIGHT_CORE=… node assets-src/demo/render.mjs [nazwa…]
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../src/assets/demo');
const geomOut = path.resolve(here, '../../src/data/hero-live.json');
const pw = process.env.PLAYWRIGHT_CORE;
if (!pw) throw new Error('Ustaw PLAYWRIGHT_CORE na katalog pakietu playwright-core');
const { chromium } = await import(pathToFileURL(path.join(pw, 'index.mjs')).href);

// [plik wyjściowy, ekran, zapytanie, szerokość, wysokość]
const shots = [
  ['flota', 'flota', '', 1440, 900],
  ['flota-base', 'flota', '?base', 1440, 900],
  ['faktury', 'faktury', '', 1440, 900],
  ['przeplywy', 'przeplywy', '', 1440, 900],
  ['serwis', 'serwis', '', 1440, 900],
  ['grafik', 'grafik', '', 1440, 900],
  ['grafik-mobile', 'grafik-mobile', '', 390, 844],
];

const only = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge' });
for (const [name, screen, query, width, height] of shots) {
  if (only.length && !only.includes(screen)) continue;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(here, 'screens', `${screen}.html`)).href + query);
  await page.waitForLoadState('networkidle');
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 90 }).toFile(path.join(out, `${name}.webp`));
  if (query === '?base') {
    const geom = await page.evaluate(() => window.__geom);
    await writeFile(geomOut, JSON.stringify(geom, null, 2) + '\n');
    console.log('hero-live.json');
  }
  await page.close();
  console.log(`${name}.webp`);
}
await browser.close();
