// arc.vert — łuk-wstęga (spike /lab/hero-arcs). Lokalny układ: łuk w XY, głębokość w Z (0..uDepth).
varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
varying float vDist;

void main() {
  vLocal = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
