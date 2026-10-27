// Samo tło ze wzorem pasm (bez warstw obiektu), na pełnoekranowym quadzie pod sceną.
// Poprzedzony przez noise.glsl, bands.glsl i bg.glsl.

uniform vec3 uBgColor;
uniform vec3 uBgInk;
uniform float uBgInkAlpha;

varying vec2 vUv;

void main() {
  vec3 col = mix(uBgColor, uBgInk, backgroundInk(screenSt(), screenPx()) * uBgInkAlpha);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
