// Hero: warstwy A i B przełączane pasmami, wycięte maską alfa, z konturem na granicy pasm.
// Poprzedzony przez noise.glsl i bands.glsl.

uniform sampler2D tA;
uniform sampler2D tB;
uniform sampler2D tAlpha;
uniform vec2 uPlaneSize;  // CSS px
uniform float uTexAspect; // szerokość / wysokość tekstur
uniform vec3 uLineColor;
uniform float uLineAlpha;
uniform float uDebugMask;
uniform float uHeroGrid;  // 1 = pasma skwantowane do siatki tła (tryb schodków)

varying vec2 vUv;

void main() {
  vec2 st = screenSt();
  float x, mask, line, revealed;
  if (uHeroGrid > 0.5) {
    vec3 g = gridBands(screenPx());
    x = g.z;
    revealed = bandReveal(cellCenterSt(screenPx()), x);
    mask = g.x;
    line = g.y;
  } else {
    x = bandField(st);
    revealed = bandReveal(st, x);
    mask = bandMask(x);
    line = bandLine(x, uLineWidth);
  }

  // object-fit: contain
  vec2 uv = vUv;
  float planeAspect = uPlaneSize.x / uPlaneSize.y;
  if (planeAspect > uTexAspect) {
    uv.x = (uv.x - 0.5) * planeAspect / uTexAspect + 0.5;
  } else {
    uv.y = (uv.y - 0.5) * uTexAspect / planeAspect + 0.5;
  }
  vec2 inBounds = step(vec2(0.0), uv) * step(uv, vec2(1.0));

  vec3 a = texture2D(tA, uv).rgb;
  vec3 b = texture2D(tB, uv).rgb;
  float alpha = texture2D(tAlpha, uv).r * inBounds.x * inBounds.y;

  mask *= revealed;
  vec3 col = mix(a, b, mask);
  col = mix(col, uLineColor, line * revealed * uLineAlpha);
  col = mix(col, vec3(mask), uDebugMask);

  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
