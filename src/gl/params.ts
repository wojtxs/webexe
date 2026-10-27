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
  OBJECT_Y: -0.07,
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

/**
 * Hero „warstwy systemu” (2026-10-27, styl z referencji użytkownika): stos kwadratowych płyt
 * na ciemnym tle. Szkło (Aplikacje, Integracje), szklana skrzynka z płytką (Automatyzacje),
 * metalowa podstawa (Utrzymanie). Choreografia jak w rdzeniu, do tego bloom.
 */
export const heroPlatesParams = {
  // Obiekt
  /** szerokość stosu (przekątna) jako ułamek szerokości elementu [data-gl="hero"] */
  OBJECT_WIDTH: 0.4,
  /** limit wysokości stosu jako ułamek wysokości elementu */
  OBJECT_HEIGHT: 0.62,
  OBJECT_X: 0.24,
  OBJECT_Y: -0.07,
  YAW: -0.5,
  PITCH: 0.52,
  TURN: 0.5,
  TILT: 0.1,
  HOVER_LIFT: 0.12,
  /** rozsunięcie warstw w hero (przed scrollem) */
  SPREAD: 0.5,

  // Światło i szkło
  GLOW: 1,
  BEAM: 0.9,
  ENV_INTENSITY: 1.1,
  LIGHT_INTENSITY: 1.4,
  BLOOM_STRENGTH: 0.9,
  BLOOM_RADIUS: 0.55,
  BLOOM_THRESHOLD: 0.82,

  // Impulsy
  PULSE_SPEED: 0.9,
  PULSE_SPACING: 0.6,
  PULSE_LENGTH: 0.3,
  PULSE_BASE: 0.7,
  PULSE_GAIN: 3,

  // Scroll: rozkład na warstwy
  EXPLODE_GAP: 0.55,
  EXPLODE_X: -0.1,
  EXPLODE_WIDTH: 0.34,
  EXPLODE_YAW: -0.2,

  // Tło
  BG_INK_ALPHA: 0.5,

  // Intro
  INTRO_DURATION: 1.1,
  INTRO_STAGGER: 0.16,
  INTRO_DROP: 5,
};

/**
 * Hero „Przez x” (2026-10-27): gigantyczny wordmark, scroll rozsuwa litery, x rośnie,
 * a przez jego górny klin (portal) wlatujemy do Manifestu. Zakresy to progres sticky tracku 0–1.
 */
export const heroPortalParams = {
  // Choreografia scrolla
  COPY_OUT: [0.02, 0.14] as [number, number],
  LETTERS_OUT: [0.04, 0.36] as [number, number],
  ZOOM: [0.12, 0.86] as [number, number],
  PORTAL_IN: [0.2, 0.3] as [number, number],
  DARK: [0.84, 0.9] as [number, number],
  /** zapas skali ponad minimum, przy którym klin zakrywa cały ekran */
  ZOOM_OVERSHOOT: 1.25,

  // Kursor
  /** rozwarcie kresek x za kursorem (stopnie) */
  SCISSOR: 4,
  CURSOR_SCALE: 3,
  CURSOR_INTENSITY: 0.15,
  CURSOR_BOUNCE: -0.75,

  // Tło
  INK_ALPHA_LIGHT: 0.55,
  INK_ALPHA_DARK: 0.7,

  // Intro
  INTRO_STAGGER: 0.06,
};

/**
 * Hero „wstęga z kodu” (2026-10-27): jedna wstęga z prawdziwym kodem strony zawiązana w pętlę,
 * kursor ją prasuje (fałdy znikają, kod ostrzeje), scroll rozwija ją w pionową płachtę pod Manifestem.
 * Jednostki krzywej lokalne: wysokość pętli ≈ 2 × LOOP_RADIUS.
 */
export const heroRibbonParams = {
  // Obiekt
  /** wysokość pętli jako ułamek wysokości viewportu */
  OBJECT_SIZE: 0.56,
  OBJECT_X: 0.25,
  OBJECT_Y: -0.07,
  YAW: -0.35,
  PITCH: 0.18,
  ROLL: -0.12,
  TURN: 0.2,
  TILT: 0.1,

  // Krzywa
  LOOP_LENGTH: 2.6,
  LOOP_RADIUS: 1,
  LOOP_DEPTH: 0.7,
  /** wielokrotności π */
  THETA_START: -0.12,
  THETA_END: 2.3,
  WIDTH: 0.62,
  TWIST: 1.1,
  TWIST_FREQ: 1.3,
  TWIST_SPEED: 0.25,
  BREATH: 0.06,
  BREATH_SPEED: 0.5,
  RIPPLE: 0.03,
  RIPPLE_FREQ: 9,
  SPEED: 1,

  // Arkusze echa
  ECHO_COUNT: 5,
  ECHO_GAP: 0.022,
  ECHO_FAN: 1.1,

  // Kursor: prasowanie
  /** promień śladu w CSS px */
  IRON_RADIUS: 220,
  IRON_RISE: 0.2,
  IRON_FALL: 0.012,
  IRON_LIFT: 0.12,

  // Materiał
  TINT: 0.45,
  SPEC: 0.55,
  GLOSS: 40,
  RIM: 0.8,
  EDGE: 0.5,
  TEXT_DIM: 0.32,
  TEXT_GAIN: 1,
  /** znaków w wierszu kodu na szerokość wstęgi */
  CHARS_PER_ROW: 56,

  // Scroll: płachta
  /** szerokość płachty jako ułamek szerokości viewportu */
  SHEET_WIDTH: 0.46,
  SHEET_DIM: 0.12,

  // Tło
  BG_INK_ALPHA: 0.5,

  // Intro
  INTRO_DURATION: 2.4,
};

/**
 * Hero „Build” (2026-10-27): strona buduje się jak blueprint, przebieg renderu zamienia ją
 * w gotowe hero, kursor to soczewka z blueprintem. Bez WebGL, czasy w sekundach, promienie w CSS px.
 */
export const heroBuildParams = {
  // Intro
  TYPE_DURATION: 0.55,
  BUILD_DURATION: 1.3,
  RENDER_DURATION: 0.8,

  // Obiekt `>_` (render A, rentgen B, mapy: alfa A, alfa B, głębia)
  /** szerokość kadru obrazu jako ułamek szerokości ekranu (obiekt zajmuje ~1/3 kadru) */
  OBJECT_WIDTH: 1.12,
  /** przesunięcie środka kadru jako ułamek szerokości / wysokości ekranu */
  OBJECT_X: 0.2,
  OBJECT_Y: -0.07,
  /** mobile (< 768 px): obiekt nad nagłówkiem */
  OBJECT_WIDTH_M: 2.3,
  OBJECT_X_M: 0,
  OBJECT_Y_M: -0.2,
  /** paralaksa z mapy głębi (ułamek kadru przy kursorze na krawędzi ekranu) */
  DEPTH: 0.014,
  /** unoszenie w spoczynku: amplituda (ułamek kadru) i prędkość */
  FLOAT_AMP: 0.004,
  FLOAT_SPEED: 0.6,
  /** jasność rentgenu i konturu na granicy pasm */
  XRAY_GAIN: 1.15,
  LINE_ALPHA: 0.55,

  // Pasma: jak heroParams, gęściej na obiekcie
  SPEED: 0.06,
  SCALE: 1.2,
  NOISE_DETAIL: 4.5,
  DISTORT_SCALE: 1,
  DISTORT_INTENSITY: 0.5,
  CURSOR_SCALE: 3,
  CURSOR_INTENSITY: 0.15,
  CURSOR_BOUNCE: -0.75,
  MOUSE_LERP: 0.1,
  PACE_PX: 40,
  PACE_LERP: 0.08,
  LINE_WIDTH: 1,

  // Scroll (sticky 2 × vh)
  /** przesunięcie wierszy nagłówka jako ułamek szerokości ekranu */
  SCROLL_SHIFT: 0.18,
  /** obiekt odjeżdża w górę o ułamek wysokości ekranu i maleje */
  SCROLL_LIFT: 0.55,
  SCROLL_SCALE: 0.8,
};

/** 0 poziomice, 1 kropki, 2 schodki na siatce, 3 kreskowanie */
export type BackgroundMode = 0 | 1 | 2 | 3;

export type HeroParams = typeof heroParams;

export const heroColors = {
  background: '--c-piana',
  lineBackground: '--c-piana-deep',
  lineObject: '--c-laguna-start',
} as const;
