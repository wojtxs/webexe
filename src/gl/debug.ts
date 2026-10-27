/**
 * debug.ts — lil-gui, tylko w dev i pod ?debug. Importuj dynamicznie przez loadDebug(),
 * żeby lil-gui nie trafiał do builda produkcyjnego.
 */

import type GUI from 'lil-gui';

export function isDebug(): boolean {
  return import.meta.env.DEV && new URLSearchParams(window.location.search).has('debug');
}

export async function loadDebug(title: string): Promise<GUI | null> {
  // Statyczny warunek DEV pozwala bundlerowi wyciąć import w produkcji
  if (!import.meta.env.DEV || !isDebug()) return null;
  const { default: LilGui } = await import('lil-gui');
  return new LilGui({ title });
}
