/**
 * registry.ts — żywe warstwy kadrów realizacji (svg[data-live] w CaseShot) dla work-live, work-index
 * i pokazu w hero (hero-reel). Produkt buduje swoją warstwę sam (product-live).
 */

import { fakturyLive } from './faktury';
import { flotaLive } from './flota';
import { przeplywyLive } from './przeplywy';
import { serwisLive } from './serwis';
import type { Live, LiveBuilder } from './types';

const BUILDERS: Record<string, LiveBuilder> = {
  flota: flotaLive,
  faktury: fakturyLive,
  przeplywy: przeplywyLive,
  serwis: serwisLive,
};

// Flota ma tempo dyspozytorni; w kadrze realizacji ma pokazać ruch od razu
const TIME_SCALE: Record<string, number> = { flota: 4 };

/** Żywa warstwa kadru, zatrzymana do pierwszego resume(); null, gdy kadr jej nie ma */
export const createLive = (shot: Element): Live | null => {
  const svg = shot.querySelector<SVGSVGElement>('svg[data-live]');
  const kind = svg?.dataset.live ?? '';
  const build = BUILDERS[kind];
  if (!svg || !build) return null;
  const live = build(svg, TIME_SCALE[kind] ?? 1);
  live.animations.forEach((a) => a.pause());
  return live;
};
