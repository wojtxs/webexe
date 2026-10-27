// Hero „Build”: obiekt `>_` jako zdjęcie z mapami (technika twarzy z landonorris.com).
// Obiekt zawsze cały jako render A; rentgen B tylko w plamie pod kursorem. Paralaksa z mapy głębi,
// przebieg skanu z intro. Poziomice zostają w tle (contour.frag) i kończą się przed bryłą.
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
uniform float uXray;       // 0–1, plama rentgenu widoczna (kursor w oknie)
uniform float uXrayRadius; // promień plamy w jednostkach st (wysokość ekranu)
uniform float uXrayNoise;
uniform float uHalo;       // zasięg linii rentgenu poza bryłą, ułamek kadru
uniform float uClearHalo;  // strefa bez poziomic wokół bryły, ułamek kadru
uniform vec3 uBgColor;     // kolor tła (sRGB): wypełnienie rentgenu i strefa bez poziomic wokół bryły

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

  // plama rentgenu pod kursorem: postrzępiona szumem krawędź, promień rośnie z prędkością ruchu
  vec2 st = screenSt();
  float n = snoise(vec3(st * 5.0, uPhase * 3.0));
  float r = uXrayRadius * uXray;
  float d = length(st - uMouse) + n * uXrayNoise;
  float aa = fwidth(d) * 1.5;
  float spot = (1.0 - smoothstep(r - aa, r + aa, d)) * step(0.002, r);
  float ring = (1.0 - smoothstep(0.0, aa * uLineWidth, abs(d - r))) * step(0.002, r);

  // nad frontem skanu obiekt jest gotowy, pod nim jeszcze rentgen (intro)
  float fromTop = 1.0 - gl_FragCoord.y / (uDpr * uViewport.y);
  float rendered = step(fromTop, uScan);
  float m = mix(1.0, spot, rendered);

  // alfa A „rozszerzona” próbkami na dwóch promieniach: bliżej linie rentgenu, dalej strefa bez poziomic
  float near = maps.r;
  float far = maps.r;
  for (int i = 0; i < 8; i++) {
    float ang = float(i) * 0.785398;
    vec2 dir = vec2(cos(ang), sin(ang) * uTexAspect);
    near = max(near, texture2D(tMaps, uv + dir * uHalo).r);
    far = max(far, texture2D(tMaps, uv + dir * uClearHalo).r);
  }

  // bryła jest pełna w obu stanach, jak twarz i kask u Lando: tło nigdy nie prześwituje przez obiekt
  float solid = smoothstep(0.0, 0.5, maps.r);
  vec4 colA = vec4(a * maps.r, maps.r);
  float aB = maps.g * smoothstep(0.05, 0.6, near);
  float alphaB = max(aB, solid);
  vec4 colB = vec4(mix(uBgColor, b, aB) * alphaB, alphaB);
  vec4 col = mix(colA, colB, m);

  // kontur plamy tylko na bryle obiektu
  float edge = ring * rendered * maps.r * uLineAlpha;
  col.rgb = mix(col.rgb, uLineColor, edge);
  col.a = max(col.a, edge);

  // pod obiektem: miękka strefa w kolorze tła, poziomice kończą się przed krawędzią bryły
  float clearZone = smoothstep(0.0, 0.9, max(near, far * 0.7));
  col += (1.0 - col.a) * vec4(uBgColor * clearZone, clearZone);

  col *= bounds * uOpacity;
  // tekstury i uLineColor są w sRGB (bez konwersji), więc wynik idzie wprost na ekran
  gl_FragColor = col;
}
