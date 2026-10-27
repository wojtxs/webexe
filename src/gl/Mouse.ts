/**
 * Mouse.ts — pozycja kursora wygładzona (eased) + pace, czyli wygładzona prędkość 0–1.
 * Pace spada do zera, gdy kursor stoi, więc efekty zależne od pace działają tylko w ruchu.
 * Wygładzanie jest niezależne od fps (lerp przeliczany na dt).
 */

export interface MouseOptions {
  lerp: number;
  pacePx: number;
  paceLerp: number;
}

const frameLerp = (amount: number, dt: number) => 1 - Math.pow(1 - amount, dt * 60);

export class Mouse {
  /** CSS px względem viewportu */
  readonly target = { x: 0, y: 0 };
  readonly eased = { x: 0, y: 0 };
  pace = 0;

  private last = { x: 0, y: 0 };
  private hasPointer = false;

  constructor(public options: MouseOptions) {
    this.target.x = this.eased.x = this.last.x = window.innerWidth / 2;
    this.target.y = this.eased.y = this.last.y = window.innerHeight / 2;
    window.addEventListener('pointermove', this.onMove, { passive: true });
  }

  private onMove = (e: PointerEvent) => {
    this.target.x = e.clientX;
    this.target.y = e.clientY;
    if (!this.hasPointer) {
      this.hasPointer = true;
      this.eased.x = this.last.x = e.clientX;
      this.eased.y = this.last.y = e.clientY;
    }
  };

  /** dt w sekundach */
  update(dt: number): void {
    const { lerp, pacePx, paceLerp } = this.options;
    const frames = Math.max(dt * 60, 1e-3);

    const a = frameLerp(lerp, dt);
    this.eased.x += (this.target.x - this.eased.x) * a;
    this.eased.y += (this.target.y - this.eased.y) * a;

    const speed = Math.hypot(this.target.x - this.last.x, this.target.y - this.last.y) / frames;
    this.last.x = this.target.x;
    this.last.y = this.target.y;

    const raw = Math.min(Math.max(speed / pacePx, 0), 1);
    this.pace += (raw - this.pace) * frameLerp(paceLerp, dt);
  }

  destroy(): void {
    window.removeEventListener('pointermove', this.onMove);
  }
}
