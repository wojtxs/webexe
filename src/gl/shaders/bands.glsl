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

vec2 screenSt() {
  return gl_FragCoord.xy / (uDpr * uViewport.y);
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
