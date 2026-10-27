// Gradient Laguna po przekątnej obiektu (start u góry z lewej, koniec u dołu z prawej, jak w logo).
// uDiag = połowa zakresu (−x + y) w układzie lokalnym obiektu.

uniform vec3 uStart;
uniform vec3 uEnd;
uniform float uDiag;

vec3 laguna(vec3 p) {
  float t = clamp((-p.x + p.y) / uDiag * 0.5 + 0.5, 0.0, 1.0);
  return mix(uEnd, uStart, t);
}
