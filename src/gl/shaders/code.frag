// code.frag — glif z atlasu (16 × 6 komórek, kod ASCII − 32, ostatnia komórka to blok).
// Znak x w gradiencie Bursztynu jak x w logo, kod w tle w przygaszonej Kości. vScale zmniejsza
// glif wokół środka komórki (bloki półtonu w porządku).
precision highp float;

uniform sampler2D uAtlas;
uniform vec3 uInk;
uniform vec3 uInkHi;
uniform vec3 uStart;
uniform vec3 uEnd;

varying float vGlyph;
varying float vScale;
varying float vAlpha;
varying float vAmber;
varying float vMark;
varying float vDiag;
varying float vSize;

void main() {
  if (vGlyph < 0.5 || vAlpha < 0.01) discard;
  vec2 pc = (gl_PointCoord - 0.5) / max(vScale, 0.05) + 0.5;
  if (pc.x < 0.0 || pc.x > 1.0 || pc.y < 0.0 || pc.y > 1.0) discard;
  vec2 cell = vec2(mod(vGlyph, 16.0), floor(vGlyph / 16.0));
  float ink = texture2D(uAtlas, (cell + pc) / vec2(16.0, 6.0)).r;
  float a = ink * clamp(vAlpha, 0.0, 1.0);
  if (a < 0.01) discard;
  vec3 amber = mix(uStart, uEnd, vDiag);
  vec3 col = mix(uInk, mix(uInkHi, amber, 0.85), vMark);
  col = mix(col, amber * 1.15, vAmber);
  gl_FragColor = vec4(col, a);
  #include <colorspace_fragment>
}
