// Warstwa B znaku x („system”): ciemny rdzeń, siatka linii na powierzchni kapsuły,
// krawędź świecąca gradientem Laguna. Kolory w przestrzeni liniowej (cssColor).

uniform vec3 uCore;
uniform float uGridRings;   // pierścienie na jednostkę długości kapsuły
uniform float uGridSeams;   // linie wzdłuż kapsuły
uniform float uGridAlpha;
uniform float uPhase;       // przesuw pierścieni (przepływ danych)

varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLaguna;

float gridLine(float v) {
  float f = fract(v);
  return 1.0 - smoothstep(0.0, max(fwidth(v), 1e-4) * 1.2, min(f, 1.0 - f));
}

void main() {
  float rings = gridLine(vLocal.y * uGridRings - uPhase);
  float seams = gridLine(atan(vLocal.z, vLocal.x) / 6.28318 * uGridSeams);
  float grid = max(rings, seams);

  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 2.5);

  vec3 col = uCore;
  col = mix(col, vLaguna, grid * uGridAlpha);
  col = mix(col, vLaguna, fresnel);

  gl_FragColor = vec4(col, 1.0);
}
