// dot.frag — okrągła kropka z wygładzoną krawędzią. Znak w gradiencie Bursztynu (jak x w logo),
// światło zmienia tylko rozmiar i jasność kropki, nie barwę; tło w przygaszonej Kości.
precision highp float;

uniform vec3 uBgInk;
uniform vec3 uStart;
uniform vec3 uEnd;
uniform float uBgAlpha;

varying float vShade;
varying float vMark;
varying float vAlpha;
varying float vSize;
varying float vDiag;

void main() {
  if (vSize < 0.6) discard;
  float r = length(gl_PointCoord - 0.5);
  float edge = 1.0 / max(vSize, 1.0);
  float a = 1.0 - smoothstep(0.5 - edge, 0.5, r);
  vec3 amber = mix(uStart, uEnd, vDiag);
  amber *= 0.82 + 0.22 * clamp(vShade, 0.0, 1.0);
  vec3 col = mix(uBgInk, amber, vMark);
  float alpha = a * vAlpha * mix(uBgAlpha, 1.0, vMark);
  if (alpha < 0.01) discard;
  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
