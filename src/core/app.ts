/**
 * app.ts — punkt startowy aplikacji.
 *
 * Kolejność bootstrap:
 * 1. Poczekaj na gotowość fontów (żeby SplitText miał dobre wymiary)
 * 2. Zainicjuj scroll (Lenis + ScrollTrigger)
 * 3. Zainicjuj moduły (data-module)
 * 4. Wyślij app:ready
 *
 * GL (Experience) dojdzie w F4.
 */

import { initScroll } from './scroll';
import { initLifecycle } from './lifecycle';
import { emit } from './events';

async function bootstrap(): Promise<void> {
  // 1. Czekamy na załadowanie fontów, żeby layout był stabilny
  await document.fonts.ready;

  // 2. Smooth scroll + ScrollTrigger
  initScroll();

  // 3. Moduły podpięte przez data-module
  await initLifecycle();

  // 4. Sygnał dla reszty systemu
  emit('app:ready');
}

bootstrap().catch(console.error);
