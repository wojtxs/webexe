// Wzór tła z pola pasm. Wymaga noise.glsl i bands.glsl.
// uMode: 0 poziomice, 1 kropki (halftone), 2 schodki na siatce, 3 kreskowanie.

uniform float uMode;
uniform float uDotMin;   // promień kropki poza pasmem, ułamek komórki
uniform float uDotMax;   // promień kropki w paśmie, ułamek komórki

float backgroundInk(vec2 st, vec2 px) {
  if (uMode < 0.5) {
    float x = bandField(st);
    return bandLine(x, uLineWidth) * bandReveal(st, x);
  }
  if (uMode < 1.5) {
    vec2 stc = cellCenterSt(px);
    float x = bandField(stc);
    float m = bandMask(x) * bandReveal(stc, x);
    vec2 local = fract(px / uCell) - 0.5;
    float r = mix(uDotMin, uDotMax, m);
    float d = length(local);
    float aa = fwidth(d);
    return (1.0 - smoothstep(r - aa, r + aa, d)) * mix(0.6, 1.0, m);
  }
  if (uMode < 2.5) {
    vec3 g = gridBands(px);
    return g.y * bandReveal(cellCenterSt(px), g.z);
  }
  float x = bandField(st);
  float y = (px.x + px.y) / uCell;
  float f = fract(y);
  float hatch = 1.0 - smoothstep(0.0, fwidth(y) * uLineWidth, min(f, 1.0 - f));
  return max(hatch * bandMask(x), bandLine(x, uLineWidth)) * bandReveal(st, x);
}
