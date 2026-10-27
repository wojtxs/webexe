// Kompozycja hero x: tło ze wzorem, warstwa A (szklisty x), duch klatki,
// warstwa B (system) odsłaniana śladem kursora z poszarpaną krawędzią i konturem.
// Poprzedzony przez noise.glsl, bands.glsl i bg.glsl.
// Render targety są w przestrzeni liniowej, z alfą premultiplikowaną (czyszczone do 0).

uniform sampler2D tA;
uniform sampler2D tB;
uniform sampler2D tGhost;
uniform sampler2D tTrail;

uniform vec3 uBgColor;
uniform vec3 uBgInk;
uniform float uBgInkAlpha;
uniform vec3 uTrailBg;       // plama śladu na tle
uniform vec3 uGhostColor;
uniform float uGhostAlpha;
uniform vec3 uLineObject;
uniform vec3 uLineBg;
uniform float uEdgeNoise;
uniform float uEdgeScale;
uniform float uEdgePhase;
uniform float uDebugTrail;

varying vec2 vUv;

void main() {
  vec2 st = screenSt();
  vec2 px = screenPx();

  vec4 a = texture2D(tA, vUv);
  vec4 b = texture2D(tB, vUv);
  float ghost = texture2D(tGhost, vUv).a;
  float trail = texture2D(tTrail, vUv).r;

  // próg śladu z szumem daje organiczną, „gotującą się” krawędź
  float r = trail + snoise(vec3(st * uEdgeScale, uEdgePhase)) * uEdgeNoise;
  float aa = max(fwidth(r), 1e-4);
  float reveal = smoothstep(0.5 - aa, 0.5 + aa, r);
  float edge = (1.0 - smoothstep(0.0, aa * uLineWidth, abs(r - 0.5))) * step(0.02, trail);

  vec3 bg = mix(uBgColor, uBgInk, backgroundInk(st, px) * uBgInkAlpha);

  vec3 surface = a.rgb + bg * (1.0 - a.a);
  surface = mix(surface, uGhostColor, ghost * uGhostAlpha);

  vec3 system = b.rgb + uTrailBg * (1.0 - b.a);

  vec3 col = mix(surface, system, reveal);
  float onObject = max(a.a, b.a);
  col = mix(col, mix(uLineBg, uLineObject, onObject), edge);
  col = mix(col, vec3(trail), uDebugTrail);

  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}
