// Tło: rysunek z tego samego pola co pasma hero.
// Poprzedzony przez noise.glsl i bands.glsl.
// uMode: 0 poziomice, 1 kropki (halftone), 2 schodki na siatce, 3 kreskowanie.

uniform vec3 uBgColor;
uniform vec3 uLineColor;
uniform float uMode;
uniform float uDotMin;   // promień kropki poza pasmem, ułamek komórki
uniform float uDotMax;   // promień kropki w paśmie, ułamek komórki

void main() {
  vec2 st = screenSt();
  vec2 px = screenPx();
  float ink = 0.0;

  if (uMode < 0.5) {
    float x = bandField(st);
    ink = bandLine(x, uLineWidth) * bandReveal(st, x);
  } else if (uMode < 1.5) {
    vec2 stc = cellCenterSt(px);
    float x = bandField(stc);
    float m = bandMask(x) * bandReveal(stc, x);
    vec2 local = fract(px / uCell) - 0.5;
    float r = mix(uDotMin, uDotMax, m);
    float d = length(local);
    float aa = fwidth(d);
    ink = (1.0 - smoothstep(r - aa, r + aa, d)) * mix(0.6, 1.0, m);
  } else if (uMode < 2.5) {
    vec3 g = gridBands(px);
    ink = g.y * bandReveal(cellCenterSt(px), g.z);
  } else {
    float x = bandField(st);
    float y = (px.x + px.y) / uCell;
    float f = fract(y);
    float hatch = 1.0 - smoothstep(0.0, fwidth(y) * uLineWidth, min(f, 1.0 - f));
    ink = max(hatch * bandMask(x), bandLine(x, uLineWidth)) * bandReveal(st, x);
  }

  gl_FragColor = vec4(mix(uBgColor, uLineColor, ink), 1.0);
  #include <colorspace_fragment>
}
