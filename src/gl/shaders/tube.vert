// tube.vert — przewód między modułami (spike /lab/hero-arcs). uv.x biegnie wzdłuż przewodu.
varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
varying float vDist;

void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  vDist = -mv.z;
  gl_Position = projectionMatrix * mv;
}
