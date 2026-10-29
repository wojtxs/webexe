// dot.vert — raster znaku x (spike /lab/hero-arcs, DotScene). Współrzędne w CSS px, y w dół.
// Znak liczony w shaderze: dwie kapsuły jak maska modułu, profil rury → normalna → cieniowanie →
// rozmiar kropki (półton). Kursor rozpycha kropki, kliknięcie puszcza falę, intro i finał składają
// kropki z rozsypki, przelot scrollem przybliża raster do środka znaku.

#define RIPPLES 4

attribute vec2 aBase;
attribute vec3 aRnd;

uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uC;
uniform float uS;
uniform float uArm;
uniform float uZoom;
uniform vec3 uLight;
uniform float uSweep;
uniform float uGap;
uniform float uBgDot;
uniform float uBgReach;
uniform vec3 uMouse;
uniform float uMouseR;
uniform vec4 uRipples[RIPPLES];
uniform float uRippleSpeed;
uniform float uAppear;
uniform float uScatter;

varying float vShade;
varying float vMark;
varying float vAlpha;
varying float vSize;
varying float vDiag;

float seg(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

float xd(vec2 p) {
  vec2 d = vec2(0.2, 0.23) * uS;
  return min(seg(p, uC - d, uC + d), seg(p, uC + vec2(d.x, -d.y), uC + vec2(-d.x, d.y)));
}

void main() {
  vec2 p = aBase;
  float r = uArm * uS;
  float d = xd(p);
  float t = clamp(d / r, 0.0, 1.0);
  float mark = 1.0 - smoothstep(0.9, 1.0, d / r);

  // normalna rury z gradientu odległości
  float e = 1.5;
  vec2 g = vec2(xd(p + vec2(e, 0.0)) - xd(p - vec2(e, 0.0)), xd(p + vec2(0.0, e)) - xd(p - vec2(0.0, e))) / (2.0 * e);
  vec3 n = normalize(vec3(g * t, sqrt(max(1.0 - t * t, 0.0))));
  float shade = clamp(dot(n, normalize(uLight)), 0.0, 1.0);

  // fala światła po przekątnej
  float sw = exp(-pow(((p.x - p.y * 0.6) - uSweep) / 70.0, 2.0));
  shade = clamp(shade * 0.85 + 0.12 + sw * 0.45, 0.0, 1.3);

  // tło: drobny raster gaśnie z odległością od znaku
  float bg = exp(-pow(length(p - uC) / (uS * uBgReach), 2.0));
  float size = mix(uBgDot * bg, uGap * (0.18 + 0.86 * shade), mark);

  // kursor: kropki uciekają, rosną przy krawędzi pola
  vec2 off = vec2(0.0);
  vec2 dm = p - uMouse.xy;
  float l = length(dm);
  float f = exp(-l * l / (uMouseR * uMouseR));
  off += dm / max(l, 1.0) * uMouse.z * f;
  size *= 1.0 + 0.5 * f * step(0.01, uMouse.z);

  // fale po kliknięciu: (x, y, wiek s, siła)
  for (int i = 0; i < RIPPLES; i++) {
    vec4 q = uRipples[i];
    if (q.w <= 0.0) continue;
    vec2 dq = p - q.xy;
    float dd = length(dq);
    float k = exp(-pow((dd - q.z * uRippleSpeed) / 55.0, 2.0)) * q.w * exp(-q.z * 1.4);
    off += dq / max(dd, 1.0) * k * 26.0;
    size *= 1.0 + k * 0.7;
  }

  // intro i finał: kropki zlatują się z rozsypki, znak trochę po tle
  float a = clamp(uAppear * 1.6 - aRnd.z * 0.6 - mark * 0.15, 0.0, 1.0);
  a = 1.0 - pow(1.0 - a, 3.0);
  off += (aRnd.xy * 2.0 - 1.0) * uScatter * (1.0 - a);

  // przelot: raster rośnie od środka znaku
  vec2 qp = uC + (p + off - uC) * uZoom;
  size *= uZoom;

  vShade = shade;
  vMark = mark;
  vAlpha = a * mix(bg, 1.0, mark);
  vSize = size * uDpr;
  vDiag = clamp(((p.x - uC.x) - (p.y - uC.y)) / (uS * 0.8) + 0.5, 0.0, 1.0);
  gl_PointSize = vSize;
  gl_Position = vec4(qp.x / uRes.x * 2.0 - 1.0, 1.0 - qp.y / uRes.y * 2.0, 0.0, 1.0);
}
