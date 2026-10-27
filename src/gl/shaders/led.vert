// Diody na szafie: aBlink = (faza, częstotliwość). Częstotliwość 0 = dioda świeci stale.
attribute vec2 aBlink;

varying vec3 vLocal;
varying vec2 vBlink;

void main() {
  vLocal = position;
  vBlink = aBlink;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
