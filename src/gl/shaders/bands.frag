// Hero: warstwy A i B przełączane pasmami, wycięte maską alfa, z konturem na granicy pasm.
// Poprzedzony przez noise.glsl i bands.glsl.

uniform sampler2D tA;
uniform sampler2D tB;
uniform sampler2D tAlpha;
uniform vec2 uPlaneSize;  // CSS px
uniform float uTexAspect; // szerokość / wysokość tekstur
uniform vec3 uLineColor;
uniform float uLineAlpha;
uniform float uLineWidth;
uniform float uDebugMask;

varying vec2 vUv;

void main() {
  vec2 st = screenSt();
  float x = bandField(st);
  float revealed = bandReveal(st, x);

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

  float mask = bandMask(x) * revealed;
  vec3 col = mix(a, b, mask);
  col = mix(col, uLineColor, bandLine(x, uLineWidth) * revealed * uLineAlpha);
  col = mix(col, vec3(mask), uDebugMask);

  gl_FragColor = vec4(col, alpha);
  #include <colorspace_fragment>
}
