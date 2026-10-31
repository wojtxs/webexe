// Render ekranów DEMO do src/assets/demo/*.webp (zrzut @2x przez Playwright na Edge, konwersja sharpem).
// Ekrany z żywą warstwą renderują się drugi raz z ?base (zrzut bez elementów, które dorysowuje strona)
// i zapisują geometrię z window.__geom do src/data/live/<ekran>.json. Elementy z SPRITES zapisują się
// osobno jako zrzut samego elementu (np. nowe zgłoszenie wpadające na tablicę).
// playwright-core nie jest zależnością projektu: ścieżkę podaj w PLAYWRIGHT_CORE (katalog pakietu).
// Użycie: PLAYWRIGHT_CORE=… node assets-src/demo/render.mjs [ekran…]
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../src/assets/demo');
const liveOut = path.resolve(here, '../../src/data/live');
const pw = process.env.PLAYWRIGHT_CORE;
if (!pw) throw new Error('Ustaw PLAYWRIGHT_CORE na katalog pakietu playwright-core');
const { chromium } = await import(pathToFileURL(path.join(pw, 'index.mjs')).href);

// [ekran, szerokość, wysokość, czy ma wariant ?base]
const screens = [
  ['flota', 1440, 900, true],
  ['faktury', 1440, 900, true],
  ['przeplywy', 1440, 900, true],
  ['serwis', 1440, 900, true],
  ['grafik', 1440, 900, false],
  ['grafik-mobile', 390, 844, false],
];

// Zrzuty pojedynczych elementów z pełnego wariantu: [ekran, selektor, plik]
const SPRITES = [['serwis', '#new-ticket', 'serwis-ticket']];

const toWebp = (png, name) => sharp(png).webp({ quality: 90 }).toFile(path.join(out, `${name}.webp`));

const only = process.argv.slice(2);
await mkdir(liveOut, { recursive: true });
const browser = await chromium.launch({ channel: 'msedge' });

for (const [screen, width, height, hasBase] of screens) {
  if (only.length && !only.includes(screen)) continue;
  for (const base of hasBase ? [false, true] : [false]) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    const url = pathToFileURL(path.join(here, 'screens', `${screen}.html`)).href;
    await page.goto(url + (base ? '?base' : ''));
    await page.waitForLoadState('networkidle');
    const name = base ? `${screen}-base` : screen;
    await toWebp(await page.screenshot(), name);
    console.log(`${name}.webp`);

    if (base) {
      const geom = await page.evaluate(() => window.__geom);
      await writeFile(path.join(liveOut, `${screen}.json`), JSON.stringify(geom, null, 2) + '\n');
      console.log(`live/${screen}.json`);
    } else {
      for (const [s, selector, file] of SPRITES) {
        if (s !== screen) continue;
        await toWebp(await page.locator(selector).screenshot(), file);
        console.log(`${file}.webp`);
      }
    }
    await page.close();
  }
}
await browser.close();
