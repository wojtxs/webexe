// Pole pasm wspólne dla hero i tła. Liczone w przestrzeni ekranu (jednostka = wysokość
// viewportu), więc pasma na obiekcie i poziomice w tle są tymi samymi liniami.
// Wymaga noise.glsl.

uniform vec2 uViewport;   // CSS px
uniform float uDpr;
uniform float uPhase;     // czas × SPEED, akumulowany na CPU
uniform float uScale;
uniform float uDetail;
uniform float uDistortScale;
uniform float uDistortIntensity;
uniform vec2 uMouse;      // eased, w jednostkach st
uniform float uPace;      // 0–1, wygładzona prędkość kursora
uniform float uCursorScale;
uniform float uCursorIntensity;
uniform float uCursorBounce;
uniform float uReveal;    // 0–1, intro od dołu
uniform float uRevealSize;
uniform float uLineWidth; // px urządzenia
uniform float uCell;      // CSS px, bok komórki siatki

vec2 screenPx() {
  return gl_FragCoord.xy / uDpr;
}

vec2 screenSt() {
  return gl_FragCoord.xy / (uDpr * uViewport.y);
}

vec2 cellCenterSt(vec2 px) {
  return (floor(px / uCell) + 0.5) * uCell / uViewport.y;
}

// Zwraca pole x: całkowite i połówkowe wartości x to granice pasm.
float bandField(vec2 st) {
  // Kursor odpycha współrzędne promieniście. CURSOR_BOUNCE < 0 wycina środek,
  // więc ugięcie ma kształt pierścienia wokół kursora (nasza interpretacja parametru).
  vec2 toMouse = st - uMouse;
  float d = length(toMouse) * uCursorScale;
  float k = clamp(1.0 - d, 0.0, 1.0);
  k = k * k * (3.0 - 2.0 * k);
  float push = k + uCursorBounce * k * k;
  vec2 dir = toMouse / max(length(toMouse), 1e-4);
  vec2 p = st + dir * push * uCursorIntensity * uPace;

  float warp = snoise(vec3(p * uDistortScale, uPhase * 0.5));
  float n = snoise(vec3(p * uScale + warp * uDistortIntensity, uPhase));
  return (n * 0.5 + 0.5) * uDetail;
}

// 0 = warstwa A, 1 = warstwa B.
float bandMask(float x) {
  return step(0.5, fract(x));
}

// Kontur na każdej granicy pasma, grubość w pikselach urządzenia, antyaliasing przez fwidth.
float bandLine(float x, float width) {
  float y = x * 2.0;
  float f = fract(y);
  float dist = min(f, 1.0 - f);
  return 1.0 - smoothstep(0.0, fwidth(y) * width, dist);
}

// Intro: front wjeżdża od dołu, krawędź frontu idzie po pasmach.
float bandReveal(vec2 st, float x) {
  float jag = uRevealSize * 0.01;
  float front = mix(-jag, 1.0 + jag, uReveal);
  return step(st.y + (fract(x) - 0.5) * jag, front);
}

// Pasma skwantowane do siatki: maska z środka komórki, kontur po krawędziach komórek,
// na których maska się zmienia (schodki). Zwraca vec3(maska, linia, x).
vec3 gridBands(vec2 px) {
  float h = uViewport.y;
  vec2 c = floor(px / uCell);
  vec2 local = px - c * uCell;
  float x = bandField((c + 0.5) * uCell / h);
  float m = bandMask(x);
  float mr = bandMask(bandField((c + vec2(1.5, 0.5)) * uCell / h));
  float mu = bandMask(bandField((c + vec2(0.5, 1.5)) * uCell / h));
  float w = uLineWidth / uDpr;
  float line = max(
    step(uCell - w, local.x) * abs(m - mr),
    step(uCell - w, local.y) * abs(m - mu)
  );
  return vec3(m, line, x);
}
