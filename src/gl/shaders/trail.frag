// Ślad kursora (ping-pong, niska rozdzielczość). Kanał R: 0 = warstwa A, 1 = warstwa B.
// Odcinek poprzednia→obecna pozycja myszy, więc szybki ruch zostawia ciągły ślad.

uniform sampler2D tPrev;
uniform vec2 uMouse;      // uv 0–1
uniform vec2 uPrevMouse;  // uv 0–1
uniform float uAspect;    // szerokość / wysokość
uniform float uStrength;  // pace × siła, 0–1
uniform float uRadius;    // w jednostkach wysokości ekranu
uniform float uDecay;     // mnożnik na tę klatkę
uniform float uIntro;     // 1 → 0: na starcie cała warstwa B rozpuszcza się do A

varying vec2 vUv;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * h);
}

void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  vec2 a = vec2(uPrevMouse.x * uAspect, uPrevMouse.y);
  vec2 b = vec2(uMouse.x * uAspect, uMouse.y);

  float splat = (1.0 - smoothstep(0.0, uRadius, segmentDistance(p, a, b))) * uStrength;
  float value = texture2D(tPrev, vUv).r * uDecay;
  value = max(value, splat);
  // intro: góra trzyma B dłużej, więc x „schodzi” z warstwy systemu od dołu
  value = max(value, clamp(uIntro * 1.6 - (1.0 - vUv.y) * 0.6, 0.0, 1.0));

  gl_FragColor = vec4(value, 0.0, 0.0, 1.0);
}
