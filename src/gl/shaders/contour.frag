// Tło: rysunek z tego samego pola co pasma hero.
// Poprzedzony przez noise.glsl, bands.glsl i bg.glsl.

uniform vec3 uBgColor;
uniform vec3 uLineColor;

void main() {
  float ink = backgroundInk(screenSt(), screenPx());
  gl_FragColor = vec4(mix(uBgColor, uLineColor, ink), 1.0);
  #include <colorspace_fragment>
}
