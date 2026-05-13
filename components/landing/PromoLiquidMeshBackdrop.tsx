import React from "react";

type LiquidMeshUniforms = {
  uTime: WebGLUniformLocation | null;
  uResolution: WebGLUniformLocation | null;
  uMouse: WebGLUniformLocation | null;
  uWarp: WebGLUniformLocation | null;
  uRipple: WebGLUniformLocation | null;
  uChrome: WebGLUniformLocation | null;
  uContrast: WebGLUniformLocation | null;
  uGrain: WebGLUniformLocation | null;
  uPointer: WebGLUniformLocation | null;
  uClouds: WebGLUniformLocation | null;
  uCenter: WebGLUniformLocation | null;
  uCenterSize: WebGLUniformLocation | null;
  uColorA: WebGLUniformLocation | null;
  uColorB: WebGLUniformLocation | null;
  uColorC: WebGLUniformLocation | null;
  uCycle: WebGLUniformLocation | null;
  uStarIntensity: WebGLUniformLocation | null;
  uHorizonSoftness: WebGLUniformLocation | null;
  uAccent: WebGLUniformLocation | null;
  uAccentMix: WebGLUniformLocation | null;
  uPageBg: WebGLUniformLocation | null;
};

type LiquidMeshProgram = {
  id: WebGLProgram;
  buffer: WebGLBuffer;
  uniforms: LiquidMeshUniforms;
};

const DAY_NIGHT_CYCLE_PRESET = {
  duration: 60,
  speed: 1,
  warp: 0.42,
  ripple: 0.68,
  chrome: 0.1,
  contrast: 0.28,
  grain: 0.012,
  resolution: 1.35,
  pointer: false,
  centerX: 0.56,
  centerY: 0.35,
  centerSize: 1.38,
  clouds: 0.88,
  starIntensity: 1,
  horizonSoftness: 0.72,
  accentMix: 0.12,
  colorA: "#1678d4",
  colorB: "#f8fbff",
  colorC: "#9bd8ff",
};

const FORCED_CYCLE_PHASES: Record<string, number> = {
  morning: 0.14,
  dusk: 0.36,
  night: 0.62,
  "deep-night": 0.8,
  dawn: 0.94,
};

const CLOCK_CYCLE_SEGMENTS = [
  { startHour: 2, endHour: 5, startCycle: 0.76, endCycle: 0.88 },
  { startHour: 5, endHour: 7, startCycle: 0.88, endCycle: 0.1 },
  { startHour: 7, endHour: 17, startCycle: 0.1, endCycle: 0.3 },
  { startHour: 17, endHour: 20, startCycle: 0.3, endCycle: 0.54 },
  { startHour: 20, endHour: 26, startCycle: 0.54, endCycle: 0.76 },
];

const VERTEX_SHADER_SOURCE = `
  attribute vec2 aPosition;
  varying vec2 vUv;

  void main() {
    vUv = aPosition * 0.5 + 0.5;
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const FRAGMENT_SHADER_SOURCE = `
  precision highp float;

  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uWarp;
  uniform float uRipple;
  uniform float uChrome;
  uniform float uContrast;
  uniform float uGrain;
  uniform float uPointer;
  uniform float uClouds;
  uniform vec2 uCenter;
  uniform float uCenterSize;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform float uCycle;
  uniform float uStarIntensity;
  uniform float uHorizonSoftness;
  uniform vec3 uAccent;
  uniform float uAccentMix;
  uniform vec3 uPageBg;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
      mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
      u.y
    );
  }

  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    mat2 rotate = mat2(0.78, -0.62, 0.62, 0.78);

    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p = rotate * p * 2.02 + 0.17;
      amplitude *= 0.52;
    }

    return value;
  }

  float saturate(float x) {
    return clamp(x, 0.0, 1.0);
  }

  float phaseWindow(float x, float start, float end, float feather) {
    float enter = smoothstep(start, start + feather, x);
    float exit = 1.0 - smoothstep(end - feather, end, x);
    return saturate(enter * exit);
  }

  float wrappedPhaseWindow(float x, float start, float end, float feather) {
    if (start <= end) {
      return phaseWindow(x, start, end, feather);
    }

    return max(
      phaseWindow(x, start, 1.0, feather),
      phaseWindow(x, 0.0, end, feather)
    );
  }

  float starLayer(vec2 uv, float t) {
    vec2 grid = floor(uv * vec2(172.0, 96.0));
    vec2 cell = fract(uv * vec2(172.0, 96.0)) - 0.5;
    float rnd = hash(grid);
    float visible = step(0.986, rnd);
    float star = smoothstep(0.036, 0.0, length(cell));
    float twinkle = 0.58 + 0.42 * sin(t * 2.0 + rnd * 18.0);
    return star * visible * twinkle;
  }

  float supernovaLayer(vec2 uv, float t) {
    vec2 grid = floor(uv * vec2(18.0, 10.0));
    vec2 cellUv = fract(uv * vec2(18.0, 10.0));
    float rnd = hash(grid + vec2(9.17, 2.31));
    float rare = step(0.968, rnd);
    vec2 center = vec2(hash(grid + vec2(1.7, 0.4)), hash(grid + vec2(4.3, 8.1)));
    float d = distance(cellUv, center);
    float pulse = pow(0.5 + 0.5 * sin(t * 0.28 + rnd * 40.0), 12.0);
    float core = smoothstep(0.064, 0.0, d);
    float halo = smoothstep(0.24, 0.0, d) * 0.22;
    return rare * pulse * (core + halo);
  }

  float surface(vec2 p) {
    vec2 q = p;
    q.x += sin((p.y + uTime * 0.22) * 2.7) * 0.18 * uWarp;
    q.y += cos((p.x - uTime * 0.18) * 3.2) * 0.15 * uWarp;

    float ribbons =
      sin(q.x * 2.7 + uTime * 0.9) +
      cos(q.y * 3.1 - uTime * 0.64) +
      sin((q.x + q.y) * 4.2 + uTime * 0.36);

    float liquid = fbm(q * (1.9 + uRipple * 1.3) + uTime * 0.17);
    return ribbons * 0.22 + liquid * 0.78;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    vec2 pointer = vec2(uMouse.x, 1.0 - uMouse.y);
    float aspect = uResolution.x / uResolution.y;
    vec2 center = vec2((uCenter.x - 0.5) * aspect, 0.5 - uCenter.y);
    float centerSize = max(uCenterSize, 0.1);

    float pointerField = smoothstep(0.56, 0.0, distance(uv, pointer)) * uPointer;
    p += normalize(p - center + 0.001) * pointerField * 0.13;

    vec2 focusP = (p - center) / centerSize;
    float h = surface(focusP);
    float e = 1.5 / min(uResolution.x, uResolution.y);
    float hx = surface(focusP + vec2(e, 0.0) / centerSize);
    float hy = surface(focusP + vec2(0.0, e) / centerSize);
    vec3 normal = normalize(vec3((h - hx) * 28.0, (h - hy) * 28.0, 1.0));

    vec3 lightA = normalize(vec3(-0.4, 0.28, 0.86));
    vec3 lightB = normalize(vec3(0.62, -0.35, 0.7));
    vec3 view = vec3(0.0, 0.0, 1.0);
    vec3 reflected = reflect(-view, normal);

    float bands = smoothstep(0.15, 0.92, h);
    float edge = pow(1.0 - max(dot(normal, view), 0.0), 2.2);
    float specA = pow(max(dot(reflected, lightA), 0.0), 18.0 + uChrome * 72.0);
    float specB = pow(max(dot(reflected, lightB), 0.0), 10.0 + uChrome * 42.0);
    float sheen = smoothstep(0.22, 0.96, sin((focusP.x - focusP.y) * 7.0 + h * 5.4));
    float focusGlow = smoothstep(0.82 * centerSize, 0.0, length(p - center));

    float cycle = fract(uCycle);
    float morning = wrappedPhaseWindow(cycle, 0.00, 0.28, 0.08);
    float dusk = phaseWindow(cycle, 0.22, 0.52, 0.10);
    float night = phaseWindow(cycle, 0.46, 0.76, 0.12);
    float deepNight = phaseWindow(cycle, 0.70, 0.92, 0.08);
    float dawn = wrappedPhaseWindow(cycle, 0.88, 0.08, 0.07);
    float phaseTotal = max(morning + dusk + night + deepNight + dawn, 0.001);
    morning /= phaseTotal;
    dusk /= phaseTotal;
    night /= phaseTotal;
    deepNight /= phaseTotal;
    dawn /= phaseTotal;

    vec3 morningTop = vec3(0.039, 0.137, 0.388);
    vec3 morningMid = uColorA;
    vec3 morningHorizon = vec3(0.890, 0.965, 0.992);

    vec3 duskTop = vec3(0.102, 0.137, 0.494);
    vec3 duskMid = vec3(0.612, 0.153, 0.690);
    vec3 duskHorizon = vec3(1.000, 0.435, 0.000);

    vec3 nightTop = vec3(0.008, 0.016, 0.031);
    vec3 nightMid = vec3(0.043, 0.043, 0.165);
    vec3 nightHorizon = vec3(0.106, 0.106, 0.290);

    vec3 deepTop = vec3(0.015, 0.018, 0.055);
    vec3 deepMid = vec3(0.102, 0.102, 0.227);
    vec3 deepHorizon = vec3(0.176, 0.063, 0.376);

    vec3 dawnTop = vec3(0.051, 0.106, 0.165);
    vec3 dawnMid = vec3(0.176, 0.227, 0.431);
    vec3 dawnHorizon = vec3(0.910, 0.627, 0.376);

    vec3 skyTop =
      morningTop * morning +
      duskTop * dusk +
      nightTop * night +
      deepTop * deepNight +
      dawnTop * dawn;

    vec3 skyMid =
      morningMid * morning +
      duskMid * dusk +
      nightMid * night +
      deepMid * deepNight +
      dawnMid * dawn;

    vec3 skyHorizon =
      morningHorizon * morning +
      duskHorizon * dusk +
      nightHorizon * night +
      deepHorizon * deepNight +
      dawnHorizon * dawn;

    skyTop = mix(skyTop, uAccent, uAccentMix * (0.18 + dusk * 0.45 + deepNight * 0.24));
    skyMid = mix(skyMid, uAccent, uAccentMix * (0.12 + dusk * 0.34));
    skyHorizon = mix(skyHorizon, uAccent, uAccentMix * (0.10 + dawn * 0.28));

    vec3 base = mix(skyTop, skyHorizon, bands);
    base = mix(base, skyMid, sheen * 0.32);
    base += (specA * uColorB + specB * uColorC) * (0.2 + uChrome * 0.86);
    base += edge * uChrome * 0.24;
    base += focusGlow * uColorB * (0.1 + uChrome * 0.2);
    base += pointerField * uColorB * 0.12;

    float vignette = smoothstep(1.18, 0.32, length(p));
    vec3 color = base * (0.62 + vignette * 0.62);
    color = (color - 0.5) * (1.0 + uContrast * 0.82) + 0.5;

    float grain = (hash(gl_FragCoord.xy + uTime * 60.0) - 0.5) * uGrain;
    color += grain;
    color = pow(max(color, 0.0), vec3(0.92));

    vec2 cloudP = focusP * vec2(1.28, 0.82) + vec2(uTime * 0.055, -uTime * 0.018);
    float cloudNoise = fbm(cloudP * (2.0 + uRipple * 0.8));
    cloudNoise += fbm(cloudP * 0.72 + vec2(4.0, 1.7)) * 0.52;
    float cloudMask = smoothstep(0.52, 0.96, cloudNoise + h * 0.16);
    float cloudBody = smoothstep(0.36, 0.74, cloudNoise);
    vec3 sky = mix(skyHorizon, skyTop, smoothstep(0.0, 1.0, uv.y));
    sky = mix(sky, skyMid, smoothstep(0.24, 0.76, 1.0 - abs(uv.y - 0.52) * 1.7) * 0.22);
    sky += vec3(0.06, 0.1, 0.14) * (1.0 - uv.y) * (1.0 - cloudMask) * (0.45 + night + deepNight);

    float cloudPhase = morning * 0.95 + dusk * 0.72 + dawn * 0.78 + night * 0.22 + deepNight * 0.08;
    vec3 cloud = mix(vec3(0.72, 0.82, 0.92), uColorB, 0.64 + morning * 0.16);
    cloud = mix(cloud, vec3(0.30, 0.24, 0.36), dusk * 0.5 + night * 0.3 + deepNight * 0.42);
    cloud += vec3(0.2, 0.19, 0.16) * pow(cloudMask, 2.4) * (0.6 + dusk * 0.4);
    vec3 cloudColor = mix(sky, cloud, cloudMask * (0.58 + cloudBody * 0.38));
    cloudColor = mix(cloudColor, uColorC, sheen * 0.08);
    color = mix(color, cloudColor, uClouds * cloudPhase);

    float starsVisible = (dusk * 0.16 + night * 0.72 + deepNight + dawn * 0.18) * uStarIntensity;
    float stars = starLayer(uv + vec2(0.0, uTime * 0.002), uTime) * starsVisible;
    float novas = supernovaLayer(uv, uTime) * deepNight * uStarIntensity;
    vec3 starColor = mix(vec3(0.76, 0.86, 1.0), uAccent, uAccentMix * 0.72);
    color += starColor * stars * 0.9;
    color += mix(vec3(0.68, 0.74, 1.0), uAccent, 0.35) * novas * 0.58;

    float pageBlend = 1.0 - smoothstep(0.0, max(uHorizonSoftness, 0.08), uv.y);
    color = mix(color, uPageBg, pageBlend * 0.72);

    gl_FragColor = vec4(color, 1.0);
  }
`;

const hexToRgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
};

const cssRgbToUnit = (
  value: string,
  fallback: [number, number, number],
): [number, number, number] => {
  const parts = value
    .trim()
    .split(/[\s,]+/)
    .map(Number)
    .filter(Number.isFinite);

  if (parts.length < 3) return fallback;
  return [
    Math.max(0, Math.min(255, parts[0])) / 255,
    Math.max(0, Math.min(255, parts[1])) / 255,
    Math.max(0, Math.min(255, parts[2])) / 255,
  ];
};

const getForcedCyclePhase = () => {
  if (typeof window === "undefined") return null;

  const phase = new URLSearchParams(window.location.search).get("promoCyclePhase");
  if (!phase) return null;

  return FORCED_CYCLE_PHASES[phase] ?? null;
};

const easeCycleProgress = (value: number) => value * value * (3 - 2 * value);

const interpolateCycle = (from: number, to: number, progress: number) => {
  const delta = (to - from + 1) % 1;
  return (from + delta * easeCycleProgress(progress)) % 1;
};

const getLocalClockCycle = (date = new Date()) => {
  const rawHour =
    date.getHours() +
    date.getMinutes() / 60 +
    date.getSeconds() / 3600 +
    date.getMilliseconds() / 3600000;
  const clockHour = rawHour < 2 ? rawHour + 24 : rawHour;
  const segment =
    CLOCK_CYCLE_SEGMENTS.find(
      ({ startHour, endHour }) => clockHour >= startHour && clockHour < endHour,
    ) ?? CLOCK_CYCLE_SEGMENTS[0];
  const progress =
    (clockHour - segment.startHour) / (segment.endHour - segment.startHour);

  return interpolateCycle(segment.startCycle, segment.endCycle, progress);
};

const compileShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) => {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create WebGL shader");

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) || "Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }

  return shader;
};

const createProgram = (gl: WebGLRenderingContext): LiquidMeshProgram => {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
  const fragmentShader = compileShader(
    gl,
    gl.FRAGMENT_SHADER,
    FRAGMENT_SHADER_SOURCE,
  );
  const program = gl.createProgram();

  if (!program) throw new Error("Unable to create WebGL program");

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const message = gl.getProgramInfoLog(program) || "WebGL program link failed";
    gl.deleteProgram(program);
    throw new Error(message);
  }

  const buffer = gl.createBuffer();
  if (!buffer) {
    gl.deleteProgram(program);
    throw new Error("Unable to create WebGL buffer");
  }

  const positionLocation = gl.getAttribLocation(program, "aPosition");
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW,
  );
  gl.useProgram(program);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  return {
    id: program,
    buffer,
    uniforms: {
      uTime: gl.getUniformLocation(program, "uTime"),
      uResolution: gl.getUniformLocation(program, "uResolution"),
      uMouse: gl.getUniformLocation(program, "uMouse"),
      uWarp: gl.getUniformLocation(program, "uWarp"),
      uRipple: gl.getUniformLocation(program, "uRipple"),
      uChrome: gl.getUniformLocation(program, "uChrome"),
      uContrast: gl.getUniformLocation(program, "uContrast"),
      uGrain: gl.getUniformLocation(program, "uGrain"),
      uPointer: gl.getUniformLocation(program, "uPointer"),
      uClouds: gl.getUniformLocation(program, "uClouds"),
      uCenter: gl.getUniformLocation(program, "uCenter"),
      uCenterSize: gl.getUniformLocation(program, "uCenterSize"),
      uColorA: gl.getUniformLocation(program, "uColorA"),
      uColorB: gl.getUniformLocation(program, "uColorB"),
      uColorC: gl.getUniformLocation(program, "uColorC"),
      uCycle: gl.getUniformLocation(program, "uCycle"),
      uStarIntensity: gl.getUniformLocation(program, "uStarIntensity"),
      uHorizonSoftness: gl.getUniformLocation(program, "uHorizonSoftness"),
      uAccent: gl.getUniformLocation(program, "uAccent"),
      uAccentMix: gl.getUniformLocation(program, "uAccentMix"),
      uPageBg: gl.getUniformLocation(program, "uPageBg"),
    },
  };
};

export const PromoLiquidMeshBackdrop = ({
  className = "",
}: {
  className?: string;
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const root = rootRef.current;
    if (!canvas || !root) return;

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (reduceMotion?.matches) {
      canvas.hidden = true;
      return;
    }

    if (window.navigator.userAgent.toLowerCase().includes("jsdom")) {
      canvas.hidden = true;
      return;
    }

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = canvas.getContext("webgl", {
        alpha: false,
        antialias: false,
        depth: false,
        stencil: false,
        powerPreference: "high-performance",
      });
    } catch {
      canvas.hidden = true;
      return;
    }

    if (!gl) {
      canvas.hidden = true;
      return;
    }

    let meshProgram: LiquidMeshProgram;
    try {
      meshProgram = createProgram(gl);
    } catch {
      canvas.hidden = true;
      return;
    }

    const colorA = hexToRgb(DAY_NIGHT_CYCLE_PRESET.colorA);
    const colorB = hexToRgb(DAY_NIGHT_CYCLE_PRESET.colorB);
    const colorC = hexToRgb(DAY_NIGHT_CYCLE_PRESET.colorC);
    const rootStyles = window.getComputedStyle(root);
    const pageBg = cssRgbToUnit(
      rootStyles.getPropertyValue("--promo-page-bg-rgb"),
      [10 / 255, 10 / 255, 10 / 255],
    );
    const accent = cssRgbToUnit(
      rootStyles.getPropertyValue("--promo-accent-rgb"),
      [217 / 255, 118 / 255, 87 / 255],
    );
    const forcedCycle = getForcedCyclePhase();
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let frameId = 0;
    let lastTime = performance.now();
    let sceneTime = 0;
    const initialCycle = getLocalClockCycle();
    let isVisible = true;
    let isDocumentVisible = document.visibilityState === "visible";

    const resize = () => {
      if (!gl) return;
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        DAY_NIGHT_CYCLE_PRESET.resolution,
      );
      const width = Math.max(1, Math.floor(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.floor(canvas.clientHeight * ratio));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      gl.viewport(0, 0, width, height);
    };

    const render = (now: number) => {
      frameId = window.requestAnimationFrame(render);
      if (!gl) return;

      const delta = Math.min(100, Math.max(0, now - lastTime || 16.7));
      lastTime = now;
      mouse.x += (mouse.tx - mouse.x) * 0.055;
      mouse.y += (mouse.ty - mouse.y) * 0.055;

      if (!isVisible || !isDocumentVisible) return;

      sceneTime += delta * 0.001;
      const shaderTime = sceneTime * DAY_NIGHT_CYCLE_PRESET.speed;
      const cycle =
        forcedCycle ??
        (initialCycle + sceneTime / DAY_NIGHT_CYCLE_PRESET.duration) % 1;

      gl.useProgram(meshProgram.id);
      gl.uniform1f(meshProgram.uniforms.uTime, shaderTime);
      gl.uniform2f(
        meshProgram.uniforms.uResolution,
        canvas.width,
        canvas.height,
      );
      gl.uniform2f(meshProgram.uniforms.uMouse, mouse.x, mouse.y);
      gl.uniform1f(meshProgram.uniforms.uWarp, DAY_NIGHT_CYCLE_PRESET.warp);
      gl.uniform1f(meshProgram.uniforms.uRipple, DAY_NIGHT_CYCLE_PRESET.ripple);
      gl.uniform1f(meshProgram.uniforms.uChrome, DAY_NIGHT_CYCLE_PRESET.chrome);
      gl.uniform1f(meshProgram.uniforms.uContrast, DAY_NIGHT_CYCLE_PRESET.contrast);
      gl.uniform1f(meshProgram.uniforms.uGrain, DAY_NIGHT_CYCLE_PRESET.grain);
      gl.uniform1f(
        meshProgram.uniforms.uPointer,
        DAY_NIGHT_CYCLE_PRESET.pointer ? 1 : 0,
      );
      gl.uniform1f(meshProgram.uniforms.uClouds, DAY_NIGHT_CYCLE_PRESET.clouds);
      gl.uniform2f(meshProgram.uniforms.uCenter, DAY_NIGHT_CYCLE_PRESET.centerX, DAY_NIGHT_CYCLE_PRESET.centerY);
      gl.uniform1f(meshProgram.uniforms.uCenterSize, DAY_NIGHT_CYCLE_PRESET.centerSize);
      gl.uniform3fv(meshProgram.uniforms.uColorA, colorA);
      gl.uniform3fv(meshProgram.uniforms.uColorB, colorB);
      gl.uniform3fv(meshProgram.uniforms.uColorC, colorC);
      gl.uniform1f(meshProgram.uniforms.uCycle, cycle);
      gl.uniform1f(meshProgram.uniforms.uStarIntensity, DAY_NIGHT_CYCLE_PRESET.starIntensity);
      gl.uniform1f(meshProgram.uniforms.uHorizonSoftness, DAY_NIGHT_CYCLE_PRESET.horizonSoftness);
      gl.uniform3fv(meshProgram.uniforms.uAccent, accent);
      gl.uniform1f(meshProgram.uniforms.uAccentMix, DAY_NIGHT_CYCLE_PRESET.accentMix);
      gl.uniform3fv(meshProgram.uniforms.uPageBg, pageBg);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const handlePointerMove = (event: PointerEvent) => {
      mouse.tx = event.clientX / Math.max(1, window.innerWidth);
      mouse.ty = event.clientY / Math.max(1, window.innerHeight);
    };

    const handleVisibilityChange = () => {
      isDocumentVisible = document.visibilityState === "visible";
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver(
            ([entry]) => {
              isVisible = Boolean(entry?.isIntersecting);
            },
            { threshold: 0.05 },
          );

    observer?.observe(root);
    window.addEventListener("resize", resize);
    if (DAY_NIGHT_CYCLE_PRESET.pointer) {
      window.addEventListener("pointermove", handlePointerMove);
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resize();
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      if (DAY_NIGHT_CYCLE_PRESET.pointer) {
        window.removeEventListener("pointermove", handlePointerMove);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer?.disconnect();

      if (gl) {
        gl.deleteBuffer(meshProgram.buffer);
        gl.deleteProgram(meshProgram.id);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={["promo-liquid-mesh", "promo-day-cycle-backdrop", className]
        .filter(Boolean)
        .join(" ")}
      data-cycle-backdrop="day-night"
      aria-hidden="true"
    >
      <div className="promo-liquid-mesh__fallback" />
      <canvas ref={canvasRef} className="promo-liquid-mesh__canvas" />
    </div>
  );
};
