// tube.frag — matowy przewód, po nim impulsy danych w gradiencie Bursztynu.
// uPulses[i] = (pozycja 0–1, kierunek ±1, jasność, —). Kolory z tokenów.
precision highp float;

#define PULSES 4

uniform vec3 uBg;
uniform vec3 uBase;
uniform vec3 uShadow;
uniform vec3 uStart;
uniform vec3 uEnd;
uniform vec3 uKey;
uniform vec4 uPulses[PULSES];
uniform float uDraw;
uniform float uWidth;
uniform float uTail;
uniform float uFogNear;
uniform float uFogFar;
uniform float uGrain;
uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vView;
varying float vDist;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  // intro: przewód rysuje się od modułu do rdzenia
  if (vUv.x > uDraw) discard;

  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  float diff = clamp((dot(n, normalize(uKey)) + 0.4) / 1.4, 0.0, 1.0);
  vec3 col = mix(uShadow, uBase, 0.25 + 0.75 * diff);
  col += uBase * pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0) * 0.25;

  // impulsy: jasna głowa, ogon za nią (zgodnie z kierunkiem ruchu)
  float glow = 0.0;
  for (int i = 0; i < PULSES; i++) {
    vec4 p = uPulses[i];
    float d = (vUv.x - p.x) * p.y;
    float head = exp(-d * d / (uWidth * uWidth));
    float tail = d < 0.0 ? exp(d / uTail) * 0.6 : 0.0;
    glow += max(head, tail) * p.z;
  }
  glow = min(glow, 1.5);
  vec3 pulse = mix(uStart, uEnd, clamp(vUv.x, 0.0, 1.0));
  col = mix(col, pulse * 1.25, clamp(glow, 0.0, 1.0));
  col += pulse * max(glow - 1.0, 0.0);

  float fog = smoothstep(uFogNear, uFogFar, vDist);
  col = mix(col, uBg, fog);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * uGrain;
  gl_FragColor = vec4(col, 1.0);
}
