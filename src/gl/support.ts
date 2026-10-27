/**
 * support.ts — wykrywanie WebGL2 i limit pixel ratio (ARCHITECTURE.md § GL).
 */

export function hasWebGL(): boolean {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

/** desktop min(dpr, 1.25), mobile min(dpr, 1.5) */
export function maxDpr(): number {
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  return Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.25);
}
