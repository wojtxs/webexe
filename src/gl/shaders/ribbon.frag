// Wstęga z kodu: materiał (miękkie światło studyjne, fresnel, gradient Laguny wzdłuż wstęgi) + kod z tekstury.
// Kod tylko na stronie zwróconej do kamery i tylko na wstędze głównej (uLayer = 0), arkusze echa są gładkie.

uniform sampler2D uCode;
/** długość łuku jednego kafla tekstury kodu (jednostki lokalne) */
uniform float uTexLen;
uniform vec3 uBase;
uniform vec3 uStart;
uniform vec3 uEnd;
uniform vec3 uInk;
uniform float uTint;
uniform float uSpec;
uniform float uGloss;
uniform float uRim;
uniform float uEdge;
uniform float uTextDim;
uniform float uTextGain;
uniform float uLayer;
uniform float uDraw;
uniform float uDim;

varying vec2 vUv;
varying float vIron;
varying float vArc;
varying vec3 vNormal;
varying vec3 vViewPos;

void main() {
  // intro: wstęga „drukuje się” od początku
  if (vUv.x > uDraw) discard;

  vec3 n = normalize(vNormal);
  vec3 v = normalize(-vViewPos);
  float facing = dot(n, v);
  if (facing < 0.0) n = -n;

  // światło klucza z lewej góry, w przestrzeni widoku
  vec3 l = normalize(vec3(-0.45, 0.75, 0.55));
  float diff = 0.32 + 0.68 * max(dot(n, l), 0.0);
  vec3 h = normalize(l + v);
  float spec = pow(max(dot(n, h), 0.0), uGloss) * uSpec;
  float fres = pow(1.0 - abs(facing), 3.0);

  vec3 laguna = mix(uStart, uEnd, smoothstep(0.0, 1.0, vUv.x));
  vec3 col = mix(uBase, laguna, uTint) * diff;
  col += laguna * fres * uRim;
  col += uInk * spec;

  // krawędź arkusza: cienki jasny brzeg, czytelny na arkuszach echa
  float edge = smoothstep(0.44, 0.5, abs(vUv.y - 0.5));
  col += laguna * edge * uEdge;

  if (uLayer < 0.5 && facing > 0.0) {
    float glyph = texture2D(uCode, vec2(vUv.y, 1.0 - vArc / uTexLen)).a;
    float vis = mix(uTextDim, 1.0, vIron) * smoothstep(0.08, 0.45, facing) * uTextGain;
    vec3 ink = mix(mix(laguna, uInk, 0.4), uInk, vIron);
    col = mix(col, ink, clamp(glyph * vis, 0.0, 1.0));
  } else if (uLayer > 0.5) {
    col *= 0.78 - 0.07 * uLayer;
  }

  gl_FragColor = vec4(col * uDim, 1.0);
  #include <colorspace_fragment>
}
