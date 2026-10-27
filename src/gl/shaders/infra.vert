// Warstwa B rentgenu: pozycja lokalna (gradient Laguna, siatka), normalne do fresnela,
// kolor części z atrybutu color, uv.x rur = długość łuku w jednostkach obiektu.
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
varying vec3 vColor;
varying vec2 vUv;

void main() {
  vLocal = position;
  vUv = uv;
  #ifdef USE_COLOR
  vColor = color;
  #else
  vColor = vec3(1.0);
  #endif
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
