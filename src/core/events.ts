/**
 * events.ts — minimalna szyna zdarzeń oparta na CustomEvent.
 * Używaj: emit('app:ready'), on('app:ready', cb), off('app:ready', cb).
 */

type EventMap = {
  'app:ready': undefined;
  'app:resize': { width: number; height: number };
  'nav:open': undefined;
  'nav:close': undefined;
};

type EventName = keyof EventMap;

// Mapa cb → wrapper, żeby off() mógł usunąć właściwy listener
const wrapperMap = new WeakMap<object, EventListener>();

export function emit<T extends EventName>(name: T, detail?: EventMap[T]): void {
  document.dispatchEvent(new CustomEvent(name, { detail }));
}

export function on<T extends EventName>(name: T, cb: (detail: EventMap[T]) => void): void {
  const wrapper: EventListener = (e) => cb((e as CustomEvent<EventMap[T]>).detail);
  wrapperMap.set(cb, wrapper);
  document.addEventListener(name, wrapper);
}

export function off<T extends EventName>(name: T, cb: (detail: EventMap[T]) => void): void {
  const wrapper = wrapperMap.get(cb);
  if (wrapper) {
    document.removeEventListener(name, wrapper);
    wrapperMap.delete(cb);
  }
}
