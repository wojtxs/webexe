// Tło hero „Build”: poziomice z pola pasm + fala sygnału, która co kilka sekund przechodzi przez mapę.
// Ta sama fala (uSweep, kierunek SWEEP_DIR) przechodzi potem przez obiekt jako pas rentgenu (prompt.frag).
// Poprzedzony przez noise.glsl, bands.glsl i bg.glsl.

uniform vec3 uBgColor;
uniform vec3 uLineColor;
uniform vec3 uPulseColor;
uniform float uSweep;      // pozycja frontu fali w st (wzdłuż SWEEP_DIR); poza ekranem = brak fali
uniform float uPulseWidth;
uniform float uPulseGain;

const vec2 SWEEP_DIR = vec2(0.912, -0.41);

void main() {
  vec2 st = screenSt();
  float ink = backgroundInk(st, screenPx());
  // fala: jasny przód, wygaszony ogon za frontem
  float s = dot(st, SWEEP_DIR) - uSweep;
  float pulse = exp(-s * s / (uPulseWidth * uPulseWidth)) * mix(0.35, 1.0, step(0.0, s));
  vec3 line = mix(uLineColor, uPulseColor, clamp(pulse * uPulseGain, 0.0, 1.0));
  gl_FragColor = vec4(mix(uBgColor, line, min(ink * (1.0 + pulse * uPulseGain), 1.0)), 1.0);
  #include <colorspace_fragment>
}
