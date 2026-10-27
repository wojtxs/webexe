// Rury i linia monitoringu: przygaszona Laguna, po niej płyną impulsy danych.
// vUv.x = długość łuku, więc odstęp impulsów jest równy na każdej rurze. Poprzedzony przez laguna.glsl.
// colorspace_fragment: w render targecie no-op, na ekranie konwersja do sRGB.

uniform vec3 uCore;
uniform vec3 uHot;      // rozjaśnienie czoła impulsu
uniform float uPhase;
uniform float uSpacing; // odstęp impulsów w jednostkach obiektu
uniform float uLength;  // długość ogona jako ułamek odstępu
uniform float uBase;    // jasność rury bez impulsu
uniform float uPower;   // 0 = wyłączone (sam kolor rury), 1 = działa

varying vec3 vLocal;
varying vec2 vUv;

void main() {
  vec3 lag = laguna(vLocal);
  float s = fract(vUv.x / uSpacing - uPhase);
  float head = smoothstep(1.0 - uLength, 1.0, s);

  vec3 col = mix(uCore, lag, uBase + (1.0 - uBase) * head);
  col = mix(col, uHot, pow(head, 6.0) * 0.45);
  gl_FragColor = vec4(col, 1.0);
}
