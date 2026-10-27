// Warstwa B znaku x: pozycja lokalna kapsuły (oś = y) do siatki, normalne do fresnela,
// kolor wierzchołka = gradient Laguna po przekątnej całego znaku (jak w logo).
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vLaguna;

void main() {
  vLocal = position;
  vLaguna = color;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
