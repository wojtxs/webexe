/**
 * DomPlane.ts — płaszczyzna zsynchronizowana z prostokątem elementu DOM.
 * Bez elementu płaszczyzna pokrywa cały viewport (tło).
 */

import { Mesh, PlaneGeometry, type Material } from 'three';

export class DomPlane<M extends Material = Material> {
  readonly mesh: Mesh<PlaneGeometry, M>;
  readonly size = { width: 0, height: 0 };

  constructor(
    material: M,
    private el: HTMLElement | null = null
  ) {
    this.mesh = new Mesh(new PlaneGeometry(1, 1), material);
  }

  sync(viewWidth: number, viewHeight: number): void {
    const r = this.el
      ? this.el.getBoundingClientRect()
      : { left: 0, top: 0, width: viewWidth, height: viewHeight };

    this.size.width = r.width;
    this.size.height = r.height;
    this.mesh.scale.set(r.width, r.height, 1);
    this.mesh.position.set(
      r.left - viewWidth / 2 + r.width / 2,
      -(r.top - viewHeight / 2 + r.height / 2),
      0
    );
  }

  destroy(): void {
    this.mesh.geometry.dispose();
    this.mesh.removeFromParent();
  }
}
