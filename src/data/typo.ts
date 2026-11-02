/**
 * typo.ts — polska typografia w tekstach z danych (build, bez JS w przeglądarce).
 */

/** Twarda spacja po jednoliterowych słowach (a, i, o, u, w, z), żeby nie zostawały na końcu wiersza */
export const noOrphans = (text: string): string =>
  text.replace(/(?<=^|[\s(„])([aiouwzAIOUWZ])\s+/g, '$1\u00a0');
