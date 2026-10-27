/**
 * Camera.ts — kamera pixel-perfect: 1 jednostka świata = 1 px CSS na płaszczyźnie z = 0.
 */

import { PerspectiveCamera } from 'three';

const DISTANCE = 600;

export function createPixelCamera(): PerspectiveCamera {
  const camera = new PerspectiveCamera(45, 1, 1, DISTANCE * 2);
  camera.position.z = DISTANCE;
  return camera;
}

export function fitPixelCamera(camera: PerspectiveCamera, width: number, height: number): void {
  camera.aspect = width / height;
  camera.fov = (2 * Math.atan(height / 2 / DISTANCE) * 180) / Math.PI;
  camera.updateProjectionMatrix();
}
