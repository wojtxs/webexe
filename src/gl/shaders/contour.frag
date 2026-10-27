// Tło: poziomice z tego samego pola co pasma hero.
// Poprzedzony przez noise.glsl i bands.glsl.

uniform vec3 uBgColor;
uniform vec3 uLineColor;
uniform float uLineWidth;

void main() {
  vec2 st = screenSt();
  float x = bandField(st);
  float line = bandLine(x, uLineWidth) * bandReveal(st, x);

  gl_FragColor = vec4(mix(uBgColor, uLineColor, line), 1.0);
  #include <colorspace_fragment>
}
