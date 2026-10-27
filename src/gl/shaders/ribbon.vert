// Wstęga z kodu: rozpina pasek na środku liczonym przez CPU (Ribbon.ts) i dokłada falowanie jedwabiu.
// uCurve (SAMPLES × 3, float, nearest): wiersz 0 = pozycja + prasowanie, 1 = oś szerokości + długość łuku,
// 2 = normalna powierzchni.

uniform sampler2D uCurve;
uniform float uWidth;
uniform float uTime;
uniform float uRipple;
uniform float uRippleFreq;
uniform float uLayer;
uniform float uEchoGap;
uniform float uEchoFan;

varying vec2 vUv;
varying float vIron;
varying float vArc;
varying vec3 vNormal;
varying vec3 vViewPos;

const float SAMPLES = 512.0;
const float PI = 3.1415927;

vec4 curve(int row, float u) {
  float x = clamp(u, 0.0, 1.0) * (SAMPLES - 1.0);
  int i = int(floor(x));
  int j = min(i + 1, int(SAMPLES) - 1);
  return mix(texelFetch(uCurve, ivec2(i, row), 0), texelFetch(uCurve, ivec2(j, row), 0), x - float(i));
}

void main() {
  vUv = uv;
  vec4 p = curve(0, uv.x);
  vec4 w = curve(1, uv.x);
  vec3 n = normalize(curve(2, uv.x).xyz);
  vec3 side = normalize(w.xyz);
  vec3 along = cross(side, n);
  float s = uv.y - 0.5;

  // jedwab: fala biegnie wzdłuż wstęgi, w poprzek zanika ku krawędziom; prasowanie kursorem ją gasi
  float amp = uRipple * (1.0 - p.w);
  float k = uRippleFreq * 2.0 * PI;
  float phase = uv.x * k - uTime * 0.9 + s * 2.2;
  float env = 0.55 + 0.45 * cos(s * PI);
  float ripple = amp * sin(phase) * env;
  float dRdu = amp * k * cos(phase) * env;
  float dRds = amp * (2.2 * cos(phase) * env - sin(phase) * 0.45 * PI * sin(s * PI));

  // arkusze echa za wstęgą, rozchodzą się wachlarzem ku końcom
  float echo = uLayer * uEchoGap * (1.0 + uEchoFan * abs(uv.x - 0.5) * 2.0);
  vec3 pos = p.xyz + side * s * uWidth + n * (ripple - echo);

  // normalna z pochodnych fali (długość łuku na jednostkę u z sąsiedniej próbki)
  float arcRate = max((curve(1, uv.x + 1.0 / SAMPLES).w - w.w) * SAMPLES, 1e-3);
  vec3 normal = normalize(n - side * dRds / max(uWidth, 1e-3) - along * dRdu / arcRate);

  vIron = p.w;
  vArc = w.w;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  vViewPos = mv.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * mv;
}
