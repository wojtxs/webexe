// Bryły maszynowni (szafa, baza danych, kopie, monitoring, skrzynka): ciemny kolor części,
// siatka na dnie skrzynki, krawędzie świecą gradientem Laguna (fresnel). Poprzedzony przez laguna.glsl.

uniform float uGridDensity; // linie na jednostkę
uniform float uGridAlpha;
uniform float uGridMaxZ;    // siatka tylko na dnie skrzynki
uniform float uRim;

varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vColor;

float gridLine(float v) {
  float f = fract(v);
  return 1.0 - smoothstep(0.0, max(fwidth(v), 1e-4) * 1.2, min(f, 1.0 - f));
}

void main() {
  vec3 lag = laguna(vLocal);
  vec2 g = vLocal.xy * uGridDensity;
  float grid = max(gridLine(g.x), gridLine(g.y)) * step(vLocal.z, uGridMaxZ);
  float fresnel = pow(1.0 - clamp(dot(normalize(vNormal), normalize(vView)), 0.0, 1.0), 3.0);

  vec3 col = mix(vColor, lag, grid * uGridAlpha);
  col = mix(col, lag, fresnel * uRim);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
