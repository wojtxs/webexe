/**
 * realizacje.ts — dostęp do kolekcji realizacji (content.config.ts) dla sekcji 03 i podstron.
 * Kolejność po order. Główna pokazuje pierwsze FEATURED wpisy z featured, a po ostatniej
 * realizacji następną jest pierwsza. Build ostrzega, dopóki w kolekcji są wpisy DEMO.
 */
import { getCollection, type CollectionEntry } from 'astro:content';

export type Realizacja = CollectionEntry<'realizacje'>;

// Ile realizacji pokazuje strona główna
const FEATURED = 3;

let warned = false;

export async function getRealizacje(): Promise<Realizacja[]> {
  const all = (await getCollection('realizacje')).sort((a, b) => a.data.order - b.data.order);
  if (import.meta.env.PROD && !warned && all.some((entry) => entry.data.demo)) {
    warned = true;
    console.warn(
      '[realizacje] Kolekcja ma wpisy DEMO (demo: true). Przed wdrożeniem usuń je (D3).'
    );
  }
  return all;
}

export const featuredOf = (all: Realizacja[]) =>
  all.filter((entry) => entry.data.featured).slice(0, FEATURED);

export const nextOf = (all: Realizacja[], id: string) =>
  all[(all.findIndex((entry) => entry.id === id) + 1) % all.length];

export const caseHref = (entry: Realizacja) => `/realizacje/${entry.id}`;

// Nazwa przejścia kadr karty → okładka projektu (view-transition-name, curtain.ts)
export const morphName = (entry: Realizacja) => `case-${entry.id}`;
