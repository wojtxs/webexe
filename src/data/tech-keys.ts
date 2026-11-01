/**
 * Klucze technologii. Osobno od ikon (data/tech.ts), bo czyta je schemat kolekcji
 * (content.config.ts), który nie powinien importować komponentów SVG.
 */
export const techKeys = [
  'cloudflare',
  'googlecloud',
  'astro',
  'typescript',
  'nodejs',
  'docker',
  'github',
  'jira',
] as const;

export type TechKey = (typeof techKeys)[number];
