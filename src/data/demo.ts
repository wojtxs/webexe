/**
 * DEMO: przykładowa treść do oceny wyglądu (gałąź eksperyment/ruch-chipsy, 2026-10-30).
 *
 * To NIE jest treść z docs/BRIEF.md. Projekty, liczby, klienci i dane kontaktowe są zmyślone,
 * a ekrany to fikcyjne aplikacje zbudowane w assets-src/demo/screens/ (render: assets-src/demo/render.mjs).
 * Przed merge do master: usunąć ten plik i src/assets/demo/, w sekcjach wrócić do TODO(treść)
 * (D3 realizacje i produkt, D7 kontakt).
 */
import type { ImageMetadata } from 'astro';
import faktury from '../assets/demo/faktury.webp';
import flota from '../assets/demo/flota.webp';
import grafikMobile from '../assets/demo/grafik-mobile.webp';
import grafik from '../assets/demo/grafik.webp';
import przeplywy from '../assets/demo/przeplywy.webp';
import serwis from '../assets/demo/serwis.webp';

export interface DemoShot {
  image: ImageMetadata;
  alt: string;
}

export interface DemoProject extends DemoShot {
  title: string;
  desc: string;
  tags: string;
}

export const demoProjects: DemoProject[] = [
  {
    title: 'Kokpit floty',
    desc: 'System dyspozytorski dla firmy transportowej. Trasy, pojazdy i zlecenia w jednym miejscu zamiast arkuszy i telefonów.',
    tags: 'Aplikacja · Integracje',
    image: flota,
    alt: 'Pulpit dyspozytora: mapa Polski z trasami pojazdów, lista pojazdów w trasie i liczba zleceń dnia',
  },
  {
    title: 'Obieg faktur z agentem AI',
    desc: 'Agent odczytuje faktury z poczty i przypisuje je do projektów. Księgowość tylko sprawdza i zatwierdza.',
    tags: 'Automatyzacja · AI',
    image: faktury,
    alt: 'Kolejka faktur do akceptacji, podgląd dokumentu z zaznaczonymi polami i dane odczytane przez agenta',
  },
  {
    title: 'Sklep, ERP i kurierzy w jednym przepływie',
    desc: 'Zamówienia, stany magazynowe i etykiety synchronizują się same. Błędy wracają do kolejki, zanim zauważy je klient.',
    tags: 'Integracje · Utrzymanie',
    image: przeplywy,
    alt: 'Monitor integracji: mapa połączeń między sklepem, ERP, magazynem, kurierami i księgowością oraz dziennik zdarzeń',
  },
  {
    title: 'Portal serwisowy',
    desc: 'Zgłoszenia od klientów, przydział techników i historia każdego urządzenia dla firmy serwisującej maszyny.',
    tags: 'Aplikacja',
    image: serwis,
    alt: 'Tablica zgłoszeń serwisowych w kolumnach: nowe, w realizacji, czeka na części, zamknięte',
  },
];

// Hero pokazuje pierwszy projekt
export const demoHero: DemoShot = demoProjects[0];

export const demoProduct = {
  name: 'Grafik',
  lead: 'Planowanie zmian i urlopów dla firm produkcyjnych. Kierownik układa tydzień w kilka minut, a pracownicy widzą swoje zmiany w telefonie.',
  desktop: {
    image: grafik,
    alt: 'Tygodniowy grafik zmian: pracownicy w wierszach, dni w kolumnach, panel braków obsady',
  },
  mobile: {
    image: grafikMobile,
    alt: 'Aplikacja mobilna: najbliższa zmiana pracownika i plan na bieżący tydzień',
  },
} satisfies { name: string; lead: string; desktop: DemoShot; mobile: DemoShot };

export const demoNumbers = [
  { value: '30+', label: 'systemów wdrożonych i utrzymywanych' },
  { value: '7 lat', label: 'pracy razem w jednym zespole' },
  { value: '99,9%', label: 'dostępności serwerów w ostatnim roku' },
  { value: '4 h', label: 'na reakcję na zgłoszenie' },
];

// Zmyślone nazwy firm, pisane jak sygnety
export const demoClients = [
  'nordtrans',
  'Halvio',
  'KUBIKO',
  'spedia',
  'Wiklina',
  'MOTOROL',
  'agrova',
  'Tessa',
];

export const demoContact = {
  label: 'Napiszcie albo zadzwońcie bezpośrednio',
  email: 'kontakt@webexe.pl',
  phone: '+48 500 000 000',
  fieldLabel: 'E-mail albo telefon',
  messageLabel: 'Krótko o projekcie',
  consent: 'Zgadzam się na kontakt w sprawie zapytania. Szczegóły w',
  submit: 'Wyślij',
};
