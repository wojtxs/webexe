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

  // Element może mieć kilka modułów rozdzielonych spacją: data-module="split-reveal tilt"
  const entries = Array.from(elements).flatMap((el) =>
    (el.dataset.module ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => ({ el, name }))
  );

  await Promise.all(
    entries.map(async ({ el, name }) => {
      let instance: Module;
      try {
        instance = ((await import(`../modules/${name}.ts`)) as { default: Module }).default;
      } catch {
        // Moduł jeszcze nie istnieje — cicho pomijamy (F1 to fundament, nie finalna strona)
        return;
      }
      try {
        await instance.init(el);
        registry.push({ name, root: el, instance });
      } catch (error) {
        console.error(`[lifecycle] ${name}:`, error);
      }
    })
  );
}

export function destroyAll(): void {
  registry.forEach(({ instance }) => instance.destroy());
  registry.length = 0;
}
