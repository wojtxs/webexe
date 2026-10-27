// Hero „Build”: obiekt `>_` jako zdjęcie z mapami (technika twarzy z landonorris.com).
// Render A i rentgen B przełączane pasmami szumu, paralaksa z mapy głębi, przebieg skanu z intro.
// Poprzedzony przez noise.glsl i bands.glsl.

uniform sampler2D tA;
uniform sampler2D tB;
uniform sampler2D tMaps;   // r: alfa A, g: alfa B, b: głębia
uniform vec2 uPlaneSize;   // CSS px
uniform float uTexAspect;  // szerokość / wysokość obrazu
uniform vec2 uParallax;    // -1..1, kursor względem środka ekranu
uniform float uDepth;
uniform float uFloat;      // przesunięcie unoszenia w ułamku kadru
uniform float uOpacity;    // 0 przed intro
uniform float uScan;       // 0–1, front przebiegu renderu od góry ekranu; 0 = cały obiekt to rentgen
uniform float uXrayGain;
uniform vec3 uLineColor;
uniform float uLineAlpha;

varying vec2 vUv;

void main() {
  // object-fit: contain
  vec2 uv = vUv;
  float planeAspect = uPlaneSize.x / uPlaneSize.y;
  if (planeAspect > uTexAspect) {
    uv.x = (uv.x - 0.5) * planeAspect / uTexAspect + 0.5;
  } else {
    uv.y = (uv.y - 0.5) * uTexAspect / planeAspect + 0.5;
  }
  uv.y += uFloat;

  // 2.5D: bliższe partie (większa głębia) przesuwają się mocniej
  float depth = texture2D(tMaps, uv).b;
  uv += uParallax * (depth - 0.35) * uDepth;

  vec2 inBounds = step(vec2(0.0), uv) * step(uv, vec2(1.0));
  float bounds = inBounds.x * inBounds.y;

  vec3 maps = texture2D(tMaps, uv).rgb;
  vec3 a = texture2D(tA, uv).rgb;
  vec3 b = texture2D(tB, uv).rgb * uXrayGain;

  // pasma w przestrzeni ekranu: te same linie co poziomice w tle
  vec2 st = screenSt();
  float x = bandField(st);
  float band = bandMask(x);
  float line = bandLine(x, uLineWidth);

  // nad frontem skanu obiekt jest gotowy (pasma), pod nim jeszcze rentgen
  float fromTop = 1.0 - gl_FragCoord.y / (uDpr * uViewport.y);
  float rendered = step(fromTop, uScan);
  float m = mix(1.0, band, rendered);

  // premultiplied: A i B mają własne alfy (B to linie na przezroczystym tle)
  vec4 colA = vec4(a * maps.r, maps.r);
  vec4 colB = vec4(b * maps.g, maps.g);
  vec4 col = mix(colA, colB, m);

  // kontur granicy pasm tylko na bryle obiektu
  float edge = line * rendered * maps.r * uLineAlpha;
  col.rgb = mix(col.rgb, uLineColor, edge);
  col.a = max(col.a, edge);

  col *= bounds * uOpacity;
  // tekstury i uLineColor są w sRGB (bez konwersji), więc wynik idzie wprost na ekran
  gl_FragColor = col;
}
