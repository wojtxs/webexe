// Diody: Laguna, gdy świecą, kolor wyłączonej diody na krótkie mrugnięcie. Poprzedzony przez laguna.glsl.

uniform float uTime;
uniform vec3 uOff;

varying vec3 vLocal;
varying vec2 vBlink;

void main() {
  float f = fract(uTime * vBlink.y + vBlink.x);
  float on = 1.0 - step(0.86, f);
  gl_FragColor = vec4(mix(uOff, laguna(vLocal), on), 1.0);
}
