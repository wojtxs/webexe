// Smuga światła pod podstawą: otwarty stożek, uv.y = 1 przy podstawie, 0 na dole.
varying vec2 vUv;
varying float vFacing;

void main() {
  vUv = uv;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vFacing = abs(dot(normalize(normalMatrix * normal), normalize(-mv.xyz)));
  gl_Position = projectionMatrix * mv;
}
