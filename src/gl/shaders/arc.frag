// arc.frag — matowy łuk w gradiencie Laguny, smuga światła biegnąca wzdłuż przedniej krawędzi.
// Kolory przychodzą z tokenów (cssColor), tutaj tylko proporcje.
precision highp float;

uniform vec3 uBg;
uniform vec3 uShadow;
uniform vec3 uStart;
uniform vec3 uEnd;
uniform vec3 uLight;
uniform vec3 uKey;
uniform float uAlbedo;
uniform float uHue;
uniform float uDepth;
uniform float uRadius;
uniform float uStreak;
uniform float uStreakI;
uniform float uStreakW;
uniform float uTail;
uniform float uGlow;
uniform float uFogNear;
uniform float uFogFar;
uniform float uGrain;
uniform float uTime;
uniform float uFade;

varying vec3 vLocal;
varying vec3 vNormal;
varying vec3 vView;
varying float vDist;

const float PI = 3.14159265;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  vec3 v = normalize(vView);

  // pozycja wzdłuż łuku: 0 = prawa stopa, 1 = lewa stopa
  float a = clamp(atan(vLocal.y, vLocal.x) / PI, 0.0, 1.0);

  // matowy materiał: miękkie światło z wrapem, bez połysku szkła
  float diff = clamp((dot(n, normalize(uKey)) + 0.35) / 1.35, 0.0, 1.0);
  vec3 albedo = mix(uStart, uEnd, clamp(a * 0.7 + uHue, 0.0, 1.0)) * uAlbedo;
  // światło w poprzek wstęgi: ciemniej w głębi, jaśniej przy przedniej krawędzi
  albedo *= mix(0.55, 1.2, smoothstep(0.0, uDepth, vLocal.z));
  vec3 col = mix(uShadow, albedo, 0.28 + 0.72 * pow(diff, 1.2));

  // delikatny rim, żeby krawędzie łapały światło
  float rim = pow(1.0 - clamp(dot(n, v), 0.0, 1.0), 3.0);
  col += uEnd * rim * 0.12;

  // smuga: ostry front, ogon za nią; najjaśniejsza na przedniej krawędzi
  float d = a - uStreak;
  float head = exp(-d * d / (uStreakW * uStreakW));
  float tail = d < 0.0 ? exp(d / uTail) : 0.0;
  float s = max(head, tail * 0.55);
  float edge = exp(-pow((vLocal.z - uDepth) / (0.035 * uDepth), 2.0));
  float inner = exp(-pow((length(vLocal.xy) - uRadius) / 0.06, 2.0));
  vec3 lightCol = mix(uLight, uEnd, 0.35);
  col += lightCol * s * uStreakI * (edge * 1.6 + inner * 0.5);
  col += uEnd * s * uStreakI * uGlow;

  // mgła do tła i ziarno
  float fog = smoothstep(uFogNear, uFogFar, vDist);
  col = mix(col, uBg, fog);
  col += (hash(gl_FragCoord.xy + fract(uTime) * 61.0) - 0.5) * uGrain;
  col = mix(uBg, col, uFade);

  gl_FragColor = vec4(col, 1.0);
}
