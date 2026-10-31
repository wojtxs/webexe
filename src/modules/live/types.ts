// Wspólny kształt żywych warstw (components/live/*): animacje do play/pause i powrót do stanu z HTML.
export interface Live {
  animations: gsap.core.Animation[];
  /** Przywraca atrybuty ustawiane ręcznie (pozycje, szerokości) do stanu z HTML */
  reset: () => void;
}

export type LiveBuilder = (svg: SVGSVGElement, timeScale?: number) => Live;
