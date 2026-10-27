/**
 * params.ts — parametry scen GL (same liczby). Kolory zawsze jako tokeny CSS, czytane przez cssColor().
 * Wartości startowe ze speca docs/sections/01-hero.md. Po strojeniu w lil-gui przepisz je tutaj.
 */

export type HeroVariant = 1 | 2;

export const heroParams = {
  /** 1 = aplikacja → infrastruktura, 2 = ręczna robota → system (D2) */
  VARIANT: 1 as HeroVariant,

  // Pasma
  SPEED: 0.08,
  SCALE: 1,
  NOISE_DETAIL: 3,
  DISTORT_SCALE: 1,
  DISTORT_INTENSITY: 0.5,

  // Kursor
  CURSOR_SCALE: 3,
  CURSOR_INTENSITY: 0.15,
  CURSOR_BOUNCE: -0.75,
  MOUSE_LERP: 0.1,
  /** prędkość (px/klatkę), przy której pace = 1 */
  PACE_PX: 40,
  PACE_LERP: 0.08,

  // Intro
  REVEAL_DURATION: 1.1,
  REVEAL_SIZE: 25,

  // Kontury
  LINE_WIDTH: 1,
  LINE_ALPHA_OBJECT: 0.6,
  BACKGROUND_CONTOURS: true,

  // Tło: tryb rysunku z pola pasm (poziomice okazały się za organiczne)
  BACKGROUND_MODE: 2 as BackgroundMode,
  /** bok komórki siatki w CSS px (kropki, schodki, odstęp kreskowania) */
  GRID_CELL: 16,
  DOT_MIN: 0.08,
  DOT_MAX: 0.3,
  /** pasma na obiekcie skwantowane do tej samej siatki co tło */
  HERO_GRID: false,
};

/**
 * Hero x (decyzja 2026-10-27): wielki znak x w 3D, kursor odsłania warstwę „system”.
 * Pole tła (SPEED, SCALE, tryb tła…) bierze wartości z heroParams.
 */
export const heroXParams = {
  // Obiekt
  /** wysokość znaku jako ułamek wysokości elementu [data-gl="hero"] */
  OBJECT_SIZE: 0.86,
  /** przesunięcie w poziomie jako ułamek szerokości elementu (0 = środek) */
  OBJECT_X: 0.2,
  TILT: 0.35,
  IDLE: 0.06,
  CAGE_SCALE: 1.22,

  // Warstwa B
  GRID_RINGS: 2.2,
  GRID_SEAMS: 12,
  GRID_ALPHA: 0.55,
  FLOW_SPEED: 0.6,

  // Ślad kursora
  TRAIL_RADIUS: 0.22,
  TRAIL_DECAY: 0.975,
  TRAIL_STRENGTH: 1.8,
  EDGE_NOISE: 0.3,
  EDGE_SCALE: 5,
  EDGE_SPEED: 0.25,
  EDGE_LINE: 1.5,

  // Duch klatki i tło
  GHOST_ALPHA: 0.18,
  BG_INK_ALPHA: 0.45,

  // Intro
  INTRO_DURATION: 1.8,
};

export type HeroXParams = typeof heroXParams;

/**
 * Hero „rentgen aplikacji” (2026-10-27, zamiast znaku x): okno aplikacji, kursor prześwietla
 * je do infrastruktury pod spodem. Ślad, krawędź, duch i tło jak w hero x.
 */
export const heroRentgenParams = {
  // Obiekt
  /** szerokość okna jako ułamek szerokości elementu [data-gl="hero"] */
  OBJECT_WIDTH: 0.57,
  /** przesunięcie środka w poziomie jako ułamek szerokości elementu (0 = środek) */
  OBJECT_X: 0.13,
  YAW: -0.42,
  PITCH: 0.14,
  TILT: 0.22,
  IDLE: 0.04,
  /** rozsunięcie kart i treści UI w głębi */
  EXPLODE: 0.1,

  // Warstwa B
  GRID_DENSITY: 5,
  GRID_ALPHA: 0.35,
  RIM: 0.9,
  PULSE_SPEED: 0.9,
  PULSE_SPACING: 0.9,
  PULSE_LENGTH: 0.35,
  PULSE_BASE: 0.3,

  // Ślad kursora
  TRAIL_RADIUS: 0.2,
  TRAIL_DECAY: 0.975,
  /** siła = sqrt(pace) × TRAIL_STRENGTH, więc odsłania już spokojny ruch */
  TRAIL_STRENGTH: 2.4,
  EDGE_NOISE: 0.3,
  EDGE_SCALE: 5,
  EDGE_SPEED: 0.25,
  EDGE_LINE: 1.5,

  // Duch maszynowni i tło
  GHOST_ALPHA: 0.12,
  BG_INK_ALPHA: 0.45,

  // Światło warstwy A
  ENV_INTENSITY: 1,
  LIGHT_INTENSITY: 1.2,

  // Intro
  INTRO_DURATION: 1.8,
};

/**
 * Hero „rdzeń z warstw” (2026-10-27, zamiast rentgenu): wieża z czterech modułów-usług.
 * Intro: warstwy składają się od podstawy. Mysz obraca rdzeń, wycięty klin pokazuje wnętrze.
 * Hover: warstwa się unosi, obok etykieta. Scroll: rozkład na warstwy (rysunek złożeniowy).
 */
export const heroCoreParams = {
  // Obiekt
  /** wysokość wieży jako ułamek wysokości elementu [data-gl="hero"] */
  OBJECT_SIZE: 0.5,
  /** przesunięcie środka w poziomie jako ułamek szerokości elementu (0 = środek) */
  OBJECT_X: 0.22,
  OBJECT_Y: 0.02,
  YAW: 0.25,
  PITCH: 0.42,
  /** obrót za kursorem (rad) */
  TURN: 0.6,
  TILT: 0.12,
  HOVER_LIFT: 0.1,

  // Wnętrze
  RIM: 0.3,
  PULSE_SPEED: 0.8,
  PULSE_SPACING: 0.7,
  PULSE_LENGTH: 0.35,
  PULSE_BASE: 0.55,
  /** prędkość pierścieni automatyzacji (mnożnik) */
  SPIN: 1,

  // Scroll: rozkład na warstwy
  /** dodatkowy odstęp między warstwami przy pełnym rozkładzie */
  EXPLODE_GAP: 0.55,
  /** położenie środka przy pełnym rozkładzie (ułamek szerokości, 0 = środek) */
  EXPLODE_X: -0.12,
  EXPLODE_SIZE: 0.62,
  EXPLODE_YAW: 0.55,

  // Tło
  BG_INK_ALPHA: 0.45,

  // Światło
  ENV_INTENSITY: 1,
  LIGHT_INTENSITY: 1.2,

  // Intro
  INTRO_DURATION: 1.1,
  INTRO_STAGGER: 0.14,
  INTRO_DROP: 6,
};

/** 0 poziomice, 1 kropki, 2 schodki na siatce, 3 kreskowanie */
export type BackgroundMode = 0 | 1 | 2 | 3;

export type HeroParams = typeof heroParams;

export const heroColors = {
  background: '--c-piana',
  lineBackground: '--c-piana-deep',
  lineObject: '--c-laguna-start',
} as const;
