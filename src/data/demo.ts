/**
 * DEMO: przykładowa treść do oceny wyglądu (gałąź eksperyment/ruch-chipsy, 2026-10-30).
 *
 * To NIE jest treść z docs/BRIEF.md. Produkt i dane kontaktowe są zmyślone (projekty: src/content/realizacje/),
 * a ekrany to fikcyjne aplikacje zbudowane w assets-src/demo/screens/ (render: assets-src/demo/render.mjs).
 * Przed merge do master: usunąć ten plik, wpisy demo: true i src/assets/demo/, w sekcjach wrócić do TODO(treść)
 * (D3 realizacje i produkt, D7 kontakt).
 */
import type { ImageMetadata } from 'astro';
import grafikBase from '../assets/demo/grafik-base.webp';
import grafikMobileBase from '../assets/demo/grafik-mobile-base.webp';
import type { TechKey } from './tech-keys';

export interface DemoShot {
  image: ImageMetadata;
  alt: string;
}

// Projekty DEMO są w kolekcji src/content/realizacje/ (demo: true); hero pokazuje je po kolei.

export const demoProduct = {
  name: 'Grafik',
  lead: 'Planowanie zmian i urlopów dla firm produkcyjnych. Kierownik układa tydzień w kilka minut, a pracownicy widzą swoje zmiany w telefonie.',
  desktop: {
    image: grafikBase,
    alt: 'Tygodniowy grafik zmian: pracownicy w wierszach, dni w kolumnach, panel braków obsady',
  },
  mobile: {
    image: grafikMobileBase,
    alt: 'Aplikacja mobilna: najbliższa zmiana pracownika i plan na bieżący tydzień',
  },
} satisfies { name: string; lead: string; desktop: DemoShot; mobile: DemoShot };

// TODO(treść): do potwierdzenia, na czym stoją nasze realizacje. Cloudflare, Google Cloud, Astro i Jira
// wskazał zespół (2026-11-01), TypeScript, Node.js, Docker i GitHub to stack tej strony.
// Nazwy i ikony: data/tech.ts.
export const demoStack: TechKey[] = [
  'cloudflare',
  'googlecloud',
  'astro',
  'typescript',
  'nodejs',
  'docker',
  'github',
  'jira',
];

export const demoContact = {
  label: 'Napiszcie albo zadzwońcie bezpośrednio',
  email: 'kontakt@webexe.pl',
  phone: '+48 500 000 000',
  fieldLabel: 'E-mail albo telefon',
  messageLabel: 'Krótko o projekcie',
  consent: 'Zgadzam się na kontakt w sprawie zapytania. Szczegóły w',
  submit: 'Wyślij',
  // Stan po wysłaniu: formularz jeszcze nic nie wysyła (D7), więc tekst mówi to wprost
  successTitle: 'Dziękujemy',
  successText: 'DEMO: formularz jeszcze nic nie wysyła (D7). Tu stanie potwierdzenie wysyłki.',
};
