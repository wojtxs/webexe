/**
 * DEMO: przykładowa treść do oceny wyglądu (gałąź eksperyment/ruch-chipsy, 2026-10-30).
 *
 * To NIE jest treść z docs/BRIEF.md. Projekty i dane kontaktowe są zmyślone,
 * a ekrany to fikcyjne aplikacje zbudowane w assets-src/demo/screens/ (render: assets-src/demo/render.mjs).
 * Przed merge do master: usunąć ten plik i src/assets/demo/, w sekcjach wrócić do TODO(treść)
 * (D3 realizacje i produkt, D7 kontakt).
 */
import type { ImageMetadata } from 'astro';
import fakturyBase from '../assets/demo/faktury-base.webp';
import flotaBase from '../assets/demo/flota-base.webp';
import grafikBase from '../assets/demo/grafik-base.webp';
import grafikMobileBase from '../assets/demo/grafik-mobile-base.webp';
import przeplywyBase from '../assets/demo/przeplywy-base.webp';
import serwisBase from '../assets/demo/serwis-base.webp';
import astro from '../assets/tech/astro.svg';
import cloudflare from '../assets/tech/cloudflare.svg';
import docker from '../assets/tech/docker.svg';
import github from '../assets/tech/github.svg';
import googleCloud from '../assets/tech/googlecloud.svg';
import jira from '../assets/tech/jira.svg';
import nodejs from '../assets/tech/nodedotjs.svg';
import typescript from '../assets/tech/typescript.svg';

export interface DemoShot {
  image: ImageMetadata;
  alt: string;
}

export interface DemoProject extends DemoShot {
  title: string;
  desc: string;
  tags: string;
  /** Żywa warstwa nad zrzutem (components/live/*); obraz to zrzut bez elementów, które ona dorysowuje */
  live: 'flota' | 'faktury' | 'przeplywy' | 'serwis';
}

export const demoProjects: DemoProject[] = [
  {
    title: 'Kokpit floty',
    desc: 'System dyspozytorski dla firmy transportowej. Trasy, pojazdy i zlecenia w jednym miejscu zamiast arkuszy i telefonów.',
    tags: 'Aplikacja · Integracje',
    image: flotaBase,
    live: 'flota',
    alt: 'Pulpit dyspozytora: mapa Polski z trasami pojazdów, lista pojazdów w trasie i liczba zleceń dnia',
  },
  {
    title: 'Obieg faktur z agentem AI',
    desc: 'Agent odczytuje faktury z poczty i przypisuje je do projektów. Księgowość tylko sprawdza i zatwierdza.',
    tags: 'Automatyzacja · AI',
    image: fakturyBase,
    live: 'faktury',
    alt: 'Kolejka faktur do akceptacji, podgląd dokumentu z zaznaczonymi polami i dane odczytane przez agenta',
  },
  {
    title: 'Sklep, ERP i kurierzy w jednym przepływie',
    desc: 'Zamówienia, stany magazynowe i etykiety synchronizują się same. Błędy wracają do kolejki, zanim zauważy je klient.',
    tags: 'Integracje · Utrzymanie',
    image: przeplywyBase,
    live: 'przeplywy',
    alt: 'Monitor integracji: mapa połączeń między sklepem, ERP, magazynem, kurierami i księgowością oraz dziennik zdarzeń',
  },
  {
    title: 'Portal serwisowy',
    desc: 'Zgłoszenia od klientów, przydział techników i historia każdego urządzenia dla firmy serwisującej maszyny.',
    tags: 'Aplikacja',
    image: serwisBase,
    live: 'serwis',
    alt: 'Tablica zgłoszeń serwisowych w kolumnach: nowe, w realizacji, czeka na części, zamknięte',
  },
];

// Hero pokazuje pierwszy projekt z tą samą żywą warstwą (FlotaLive)
export const demoHero: DemoShot = demoProjects[0];

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
// Ikony: Simple Icons (CC0), src/assets/tech/, kolor z currentColor.
export const demoStack = [
  { name: 'Cloudflare', icon: cloudflare },
  { name: 'Google Cloud', icon: googleCloud },
  { name: 'Astro', icon: astro },
  { name: 'TypeScript', icon: typescript },
  { name: 'Node.js', icon: nodejs },
  { name: 'Docker', icon: docker },
  { name: 'GitHub', icon: github },
  { name: 'Jira', icon: jira },
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
