/**
 * css.ts — helpery do odczytu CSS custom properties.
 * cssVar: zwraca wartość tokenu jako string.
 * cssColor: zwraca THREE.Color (lazy import, żeby three.js nie trafiał do głównego bundle).
 */

export function cssVar(token: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(token).trim();
}

export async function cssColor(token: string, el: Element = document.documentElement) {
  const { Color } = await import('three');
  const value = cssVar(token, el);
  return new Color(value);
}
