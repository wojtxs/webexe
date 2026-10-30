/**
 * css.ts — helpery do odczytu CSS custom properties.
 * cssVar: zwraca wartość tokenu jako string.
 * cssColor() wraca dopiero razem z GL (docs/ARCHITECTURE.md, „GL (opcjonalny)”).
 */

export function cssVar(token: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(token).trim();
}
