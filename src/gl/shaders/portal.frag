// Tło hero „Przez x”: wzór pasm w dwóch paletach. Wewnątrz górnego klina znaku x (portal)
// paleta ciemna (następna sekcja), poza nim jasna. Pasma biegną przez granicę bez przerwy.
// Poprzedzony przez noise.glsl, bands.glsl i bg.glsl.

uniform vec3 uLightBg;
uniform vec3 uLightInk;
uniform vec3 uDarkBg;
uniform vec3 uDarkInk;
uniform float uInkAlphaLight;
uniform float uInkAlphaDark;

uniform vec2 uApex;      // wierzchołek klina, CSS px od lewego dolnego rogu
uniform vec2 uNormalL;   // normalne krawędzi klina, skierowane do środka
uniform vec2 uNormalR;
uniform vec2 uUp;        // oś klina (w górę, od wierzchołka)
uniform float uDepth;    // wysokość klina (do końców ramion), CSS px
uniform float uPortal;   // 0–1, widoczność portalu
uniform float uDark;     // 0–1, cały ekran w palecie ciemnej (po przejściu)

varying vec2 vUv;

void main() {
  vec2 px = screenPx();
  vec2 v = px - uApex;
  float edge = min(min(dot(v, uNormalL), dot(v, uNormalR)), uDepth - dot(v, uUp));
  float inside = smoothstep(-0.75, 0.75, edge) * uPortal;
  float dark = max(inside, uDark);

  float ink = backgroundInk(screenSt(), px);
  vec3 light = mix(uLightBg, uLightInk, ink * uInkAlphaLight);
  vec3 deep = mix(uDarkBg, uDarkInk, ink * uInkAlphaDark);
  gl_FragColor = vec4(mix(light, deep, dark), 1.0);
  #include <colorspace_fragment>
}
