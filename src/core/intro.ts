/**
 * intro.ts — koniec wejścia strony. Loader (modules/loader.ts) woła finishIntro(), kiedy panel
 * zaczyna znikać, a moduły czekające na wejście (H1 hero w split-reveal) słuchają introDone.
 *
 * Bez loadera na stronie wejście kończy się od razu, a gdy loader zawiedzie, najpóźniej
 * po 3 s od startu nawigacji (ten sam fallback co html.js-motion w Base.astro).
 */

const FALLBACK = 3000;

let done: () => void = () => {};

export const introDone = new Promise<void>((resolve) => {
  done = resolve;
});

export function finishIntro(): void {
  done();
}

if (!document.querySelector('[data-module="loader"]')) finishIntro();
setTimeout(finishIntro, Math.max(FALLBACK - performance.now(), 0));
