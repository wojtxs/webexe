// code.vert — znak x z kodu (spike /lab/hero-code, CodeScene). Każdy punkt to komórka siatki znaków
// (CSS px, y w dół). Znak komórki bierze się z tekstury kodu (uCode: wiersz × kolumna → numer glifu),
// kod przesuwa się o całe wiersze jak log. Znak x liczony jak w dot.vert (dwie kapsuły, profil rury,
// światło), jasność → krycie. Stany sceny: chaos (rozsypany kod), porządek (front pasma zamienia kod
// w bloki), szkic (sam obrys), budowa (bloki od dołu), przepływ (impulsy po ramionach), puls.

#define RIPPLES 4

attribute vec2 aBase;
attribute vec2 aCell;
attribute vec3 aRnd;

uniform vec2 uRes;
uniform float uDpr;
uniform vec2 uCellSize;
uniform sampler2D uCode;
uniform vec2 uCodeSize;
uniform float uPane;
uniform float uLine;
uniform vec2 uC;
uniform float uS;
uniform float uArm;
uniform float uZoom;
uniform vec3 uLight;
uniform float uSweep;
uniform float uBgAlpha;
uniform float uBgReach;
uniform float uTime;
uniform float uAppear;
uniform float uChaos;
uniform float uOrder;
uniform float uWire;
uniform float uBuild;
uniform float uFlow;
uniform float uBeat;
uniform float uDim;
uniform vec3 uMouse;
uniform vec4 uRipples[RIPPLES];
uniform float uRippleSpeed;

varying float vGlyph;
varying float vScale;
varying float vAlpha;
varying float vAmber;
varying float vMark;
varying float vDiag;
varying float vSize;

const float BLOCK = 95.0;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453);
}

float seg(vec2 p, vec2 a, vec2 b, out float h) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h);
}

// odległość od znaku, położenie na ramieniu (0–1, od góry) i numer ramienia
float xd(vec2 p, out float along, out float arm) {
  vec2 d = vec2(0.2, 0.23) * uS;
  float h1;
  float h2;
  float a = seg(p, uC - d, uC + d, h1);
  float b = seg(p, uC + vec2(d.x, -d.y), uC + vec2(-d.x, d.y), h2);
  along = a < b ? h1 : h2;
  arm = a < b ? 0.0 : 1.0;
  return min(a, b);
}

float xd(vec2 p) {
  float al;
  float am;
  return xd(p, al, am);
}

float randGlyph(vec2 cell, float t) {
  return 1.0 + floor(hash(cell + t) * 93.0);
}

void main() {
  vec2 p = aBase;
  // przelot: siatka rośnie od środka znaku; znak liczony w przestrzeni ekranu po przybliżeniu
  vec2 q = uC + (p - uC) / uZoom;

  float along;
  float arm;
  float r = uArm * uS;
  float d = xd(q, along, arm);
  float t = clamp(d / r, 0.0, 1.0);

  // chaos: krawędź znaku rwie się szumem, komórki skaczą
  float jag = (hash(aCell + floor(uTime * 6.0 * (0.5 + aRnd.x))) - 0.5) * uChaos;
  float mark = 1.0 - smoothstep(0.85, 1.0, d / r + jag * 0.9);

  float e = 1.5;
  vec2 g = vec2(xd(q + vec2(e, 0.0)) - xd(q - vec2(e, 0.0)), xd(q + vec2(0.0, e)) - xd(q - vec2(0.0, e))) / (2.0 * e);
  vec3 n = normalize(vec3(g * t, sqrt(max(1.0 - t * t, 0.0))));
  float shade = clamp(dot(n, normalize(uLight)), 0.0, 1.0);
  float sw = exp(-pow(((q.x - q.y * 0.6) - uSweep) / 70.0, 2.0));
  shade = clamp(shade * 0.8 + 0.18 + sw * 0.5, 0.0, 1.3);

  // kod: trzy kolumny tekstu obok siebie, przesuwane o wiersze
  float pane = floor(aCell.x / uPane);
  float col = mod(aCell.x, uPane);
  float row = mod(aCell.y + floor(uLine) + pane * 23.0, uCodeSize.y);
  float code = texture2D(uCode, (vec2(col, row) + 0.5) / uCodeSize).r * 255.0;
  float glyph = code;
  // w znaku dziury po wcięciach wypełnia drobny znak, żeby x był czytelny
  if (glyph < 0.5 && mark > 0.5) glyph = hash(aCell) > 0.5 ? 29.0 : 11.0;

  float alpha = mix(uBgAlpha * (0.3 + 0.7 * exp(-pow(length(q - uC) / (uS * uBgReach), 2.0))), 0.4 + 0.7 * shade, mark);
  float amber = 0.0;
  float scale = 1.0;

  // chaos: losowe znaki migają
  float flick = step(1.0 - uChaos, hash(aCell * 1.7 + floor(uTime * 12.0 * (0.3 + aRnd.y))));
  glyph = mix(glyph, randGlyph(aCell, floor(uTime * 9.0 + aRnd.z * 9.0)), flick * step(0.5, glyph + mark));
  alpha *= 1.0 - uChaos * 0.35 * (1.0 - mark);

  // porządek: za frontem pasma znak to bloki półtonu, na froncie pasmo losowych znaków
  float x = q.x / uRes.x + (q.y / uRes.y - 0.5) * 0.18 + (hash(vec2(aCell.y, 3.0)) - 0.5) * 0.02;
  float fx = mix(-0.2, 1.2, uOrder);
  float ordered = (1.0 - step(fx, x)) * mark;
  float band = (1.0 - smoothstep(0.0, 0.03, abs(x - fx))) * step(0.001, uOrder) * step(uOrder, 0.999);
  glyph = mix(glyph, BLOCK, ordered);
  scale = mix(scale, 0.3 + 0.62 * clamp(shade, 0.0, 1.0), ordered);
  if (band > 0.2) {
    glyph = randGlyph(aCell, floor(uTime * 14.0));
    amber = max(amber, band);
    alpha = max(alpha, band * 0.9);
  }

  // szkic: tylko obrys znaku, znaki wg kierunku krawędzi
  float rim = 1.0 - smoothstep(0.6, 1.6, abs(d - r) / uCellSize.x);
  float ang = abs(g.x) > 2.0 * abs(g.y) ? 0.0 : (abs(g.y) > 2.0 * abs(g.x) ? 1.0 : (g.x * g.y > 0.0 ? 2.0 : 3.0));
  float wireGlyph = ang < 0.5 ? 92.0 : (ang < 1.5 ? 13.0 : (ang < 2.5 ? 15.0 : 60.0));
  glyph = mix(glyph, wireGlyph, step(0.5, uWire) * rim);
  scale = mix(scale, 1.0, uWire * rim);
  alpha = mix(alpha, mix(alpha * (1.0 - mark), 0.95, rim), uWire);
  amber = max(amber, rim * uWire * 0.7);

  // budowa: bloki rosną od dołu znaku, rząd po rzędzie
  float bottom = uC.y + 0.23 * uS + r;
  float level = mix(bottom, uC.y - 0.23 * uS - r, uBuild);
  float built = step(level, q.y) * mark * step(0.001, uBuild);
  float edgeRow = (1.0 - smoothstep(0.0, uCellSize.y * 1.5, abs(q.y - level))) * mark * step(0.001, uBuild) * step(uBuild, 0.999);
  glyph = mix(glyph, BLOCK, built);
  alpha = mix(alpha, max(alpha, shade * 0.95), built);
  amber = max(amber, edgeRow);

  // przepływ: impulsy biegną po ramionach od góry do dołu
  float head = fract(uTime * 0.35 + arm * 0.17);
  float pulse = 0.0;
  for (int i = 0; i < 3; i++) {
    float h = fract(head + float(i) / 3.0);
    pulse = max(pulse, exp(-pow((along - h) / 0.035, 2.0)));
  }
  pulse *= uFlow * mark;
  glyph = mix(glyph, 30.0, step(0.5, pulse));
  amber = max(amber, pulse);
  alpha = max(alpha, pulse);

  // puls utrzymania: równy oddech całego znaku
  float beat = pow(0.5 + 0.5 * sin(uTime * 2.2), 6.0) * uBeat * mark;
  alpha = clamp(alpha + beat * 0.35, 0.0, 1.3);
  amber = max(amber, beat * 0.4);

  // kursor: latarka, pod nią kod się rozszyfrowuje i jaśnieje
  float l = length(p - uMouse.xy);
  float lens = exp(-l * l / (uMouse.z * uMouse.z + 1.0)) * step(1.0, uMouse.z);
  float decode = step(0.55, lens) * step(0.6, hash(aCell + floor(uTime * 16.0)));
  glyph = mix(glyph, randGlyph(aCell, floor(uTime * 16.0)), decode * step(0.5, glyph));
  alpha = max(alpha, lens * 0.75 * step(0.5, glyph));
  amber = max(amber, lens * 0.6);

  // fale po kliknięciu: (x, y, wiek s, siła)
  for (int i = 0; i < RIPPLES; i++) {
    vec4 rp = uRipples[i];
    if (rp.w <= 0.0) continue;
    float k = exp(-pow((length(p - rp.xy) - rp.z * uRippleSpeed) / 40.0, 2.0)) * rp.w * exp(-rp.z * 1.2);
    if (k > 0.3 && glyph > 0.5) glyph = randGlyph(aCell, floor(uTime * 20.0));
    amber = max(amber, k);
    alpha = max(alpha, k * step(0.5, glyph));
  }

  // intro: wiersze wpisują się z lewej, przed ustaleniem znaki się losują
  float ap = uAppear * 1.8 - (aBase.y / uRes.y) * 0.5 - (aBase.x / uRes.x) * 0.3 - aRnd.z * 0.15;
  float shown = step(0.0, ap);
  if (ap < 0.25 && shown > 0.5 && glyph > 0.5) {
    glyph = randGlyph(aCell, floor(uTime * 24.0));
    amber = max(amber, 0.8);
  }

  vGlyph = glyph;
  vScale = scale;
  vAlpha = alpha * shown * (1.0 - uDim);
  vAmber = clamp(amber, 0.0, 1.0);
  vMark = mark;
  vDiag = clamp(((q.x - uC.x) - (q.y - uC.y)) / (uS * 0.8) + 0.5, 0.0, 1.0);
  vSize = uCellSize.y * uDpr;
  gl_PointSize = vSize;
  gl_Position = vec4(p.x / uRes.x * 2.0 - 1.0, 1.0 - p.y / uRes.y * 2.0, 0.0, 1.0);
}
