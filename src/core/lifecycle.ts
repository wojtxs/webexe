/**
 * lifecycle.ts — rejestr modułów.
 *
 * Skanuje [data-module] w DOM, dynamicznie importuje moduł z src/modules/
 * i woła init(el). Każdy moduł musi spełniać interfejs Module.
 *
 * Moduły tworzą animacje w gsap.context(() => {}, root) i w destroy()
 * wołają ctx.revert(). Dzięki temu F6 (Taxi.js / View Transitions) nie
 * wymaga przepisywania modułów.
 */

export interface Module {
  init(root: HTMLElement): void | Promise<void>;
  destroy(): void;
}

type ModuleEntry = {
  name: string;
  root: HTMLElement;
  instance: Module;
};

const registry: ModuleEntry[] = [];

export async function initLifecycle(): Promise<void> {
  const elements = document.querySelectorAll<HTMLElement>('[data-module]');

  await Promise.all(
    Array.from(elements).map(async (el) => {
      const name = el.dataset.module;
      if (!name) return;

      try {
        const mod = (await import(`../modules/${name}.ts`)) as { default: Module };
        const instance = mod.default;
        await instance.init(el);
        registry.push({ name, root: el, instance });
      } catch {
        // Moduł jeszcze nie istnieje — cicho pomijamy (F1 to fundament, nie finalna strona)
      }
    })
  );
}

export function destroyAll(): void {
  registry.forEach(({ instance }) => instance.destroy());
  registry.length = 0;
}
