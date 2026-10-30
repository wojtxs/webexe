// Render ekranów DEMO do src/assets/demo/*.webp (zrzut @2x przez Playwright na Edge, konwersja sharpem).
// playwright-core nie jest zależnością projektu: ścieżkę podaj w PLAYWRIGHT_CORE (katalog pakietu).
// Użycie: PLAYWRIGHT_CORE=… node assets-src/demo/render.mjs [nazwa…]
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.resolve(here, '../../src/assets/demo');
const pw = process.env.PLAYWRIGHT_CORE;
if (!pw) throw new Error('Ustaw PLAYWRIGHT_CORE na katalog pakietu playwright-core');
const { chromium } = await import(pathToFileURL(path.join(pw, 'index.mjs')).href);

const screens = {
  flota: [1440, 900],
  faktury: [1440, 900],
  przeplywy: [1440, 900],
  serwis: [1440, 900],
  grafik: [1440, 900],
  'grafik-mobile': [390, 844],
};

const only = process.argv.slice(2);
const browser = await chromium.launch({ channel: 'msedge' });
for (const [name, [width, height]] of Object.entries(screens)) {
  if (only.length && !only.includes(name)) continue;
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(here, 'screens', `${name}.html`)).href);
  await page.waitForLoadState('networkidle');
  const png = await page.screenshot();
  await sharp(png).webp({ quality: 90 }).toFile(path.join(out, `${name}.webp`));
  await page.close();
  console.log(`${name}.webp`);
}
await browser.close();
