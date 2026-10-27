/**
 * scripts/assets.mjs — pipeline: resize + WebP dla assetów GL i sekcji.
 *
 * Konfiguracja: assets-src/manifest.json
 * Format wpisu:
 *   {
 *     "src":     "hero/hero-a-source.png",   // ścieżka od assets-src/
 *     "dest":    "gl/textures/hero/hero-a.webp", // ścieżka od public/
 *     "width":   2560,                        // docelowa szerokość px
 *     "quality": 85                           // jakość WebP (1–100)
 *   }
 *
 * Użycie: npm run assets
 */

import sharp from 'sharp';
import { readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const assetsSrc = path.join(root, 'assets-src');
const publicDir = path.join(root, 'public');

async function run() {
  const manifestPath = path.join(assetsSrc, 'manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

  const entries = manifest.filter((e) => e.src && e.dest && typeof e.width === 'number');

  if (entries.length === 0) {
    console.log('assets.mjs: brak wpisów do przetworzenia w manifest.json');
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const entry of entries) {
    const srcPath = path.join(assetsSrc, entry.src);
    const destPath = path.join(publicDir, entry.dest);
    const destDir = path.dirname(destPath);

    if (!existsSync(srcPath)) {
      console.warn(`  SKIP  ${entry.src} — plik nie istnieje`);
      continue;
    }

    try {
      await mkdir(destDir, { recursive: true });
      await sharp(srcPath)
        .resize({ width: entry.width, withoutEnlargement: true })
        .webp({ quality: entry.quality ?? 85 })
        .toFile(destPath);
      console.log(`  OK    ${entry.src} → public/${entry.dest}`);
      ok++;
    } catch (err) {
      console.error(`  FAIL  ${entry.src}:`, err.message);
      fail++;
    }
  }

  console.log(`\nassets.mjs: ${ok} OK, ${fail} błędów`);
  if (fail > 0) process.exit(1);
}

run();
