// Smuga światła: najjaśniejsza przy podstawie i na osi, gaśnie w dół i na brzegach stożka.
// Blending addytywny, więc kolor = światło dodane do tła.

uniform vec3 uColor;
uniform float uStrength;

varying vec2 vUv;
varying float vFacing;

void main() {
  float fade = pow(vUv.y, 2.2) * pow(vFacing, 2.0);
  gl_FragColor = vec4(uColor * fade * uStrength, 1.0);
  #include <colorspace_fragment>
}
