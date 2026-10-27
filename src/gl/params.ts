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

/** 0 poziomice, 1 kropki, 2 schodki na siatce, 3 kreskowanie */
export type BackgroundMode = 0 | 1 | 2 | 3;

export type HeroParams = typeof heroParams;

export const heroColors = {
  background: '--c-piana',
  lineBackground: '--c-piana-deep',
  lineObject: '--c-laguna-start',
} as const;
