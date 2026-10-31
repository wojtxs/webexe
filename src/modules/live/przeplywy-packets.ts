// Pakiety na każdym połączeniu: położenie w spoczynku (ułamek długości) i promień, jak w zrzucie.
// Wspólne dla komponentu PrzeplywyLive (stan w HTML) i modułu live/przeplywy.ts (ruch).
export const PACKETS = [
  { t0: 0.22, r: 2.5 },
  { t0: 0.5, r: 3.5 },
  { t0: 0.78, r: 2.5 },
] as const;
