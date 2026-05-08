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
  uColorA: WebGLUniformLocation | null;
  uColorB: WebGLUniformLocation | null;
  uColorC: WebGLUniformLocation | null;
  uColorD: WebGLUniformLocation | null;
  uColorE: WebGLUniformLocation | null;
};

type LiquidMeshProgram = {
  id: WebGLProgram;
  buffer: WebGLBuffer;
  uniforms: LiquidMeshUniforms;
};

const LIQUID_MESH_PRESET = {
  speed: 0.08,
  warp: 0.34,
  ripple: 0.14,
  chrome: 0.18,
  contrast: 0.24,
  grain: 0.016,
  resolution: 1.18,
  pointer: false,
  colorA: "#03080e",
  colorB: "#059669",
  colorC: "#f97316",
  colorD: "#e11d48",
  colorE: "#2563eb",
};

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
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;
  uniform vec3 uColorE;

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

  float surface(vec2 p) {
    vec2 q = p;
    q.x += sin((p.y + uTime * 0.12) * 1.3) * 0.11 * uWarp;
    q.y += cos((p.x - uTime * 0.1) * 1.8) * 0.08 * uWarp;

    float ribbons =
      sin(q.x * 1.4 + uTime * 0.42) +
      cos(q.y * 1.15 - uTime * 0.32) +
      sin((q.x * 0.9 + q.y * 0.35) * 2.1 + uTime * 0.2);

    float liquid = fbm(q * (1.05 + uRipple * 0.65) + uTime * 0.08);
    return ribbons * 0.16 + liquid * 0.58 + q.y * 0.22;
  }

  void main() {
    vec2 uv = gl_FragCoord.xy / uResolution.xy;
    vec2 p = (gl_FragCoord.xy - 0.5 * uResolution.xy) / uResolution.y;
    vec2 pointer = vec2(uMouse.x, 1.0 - uMouse.y);

    vec2 pointerVector = uv - pointer;
    float pointerField = smoothstep(0.56, 0.0, length(pointerVector)) * uPointer;
    p += pointerVector * pointerField * 0.12;

    float h = surface(p);
    float e = 1.5 / min(uResolution.x, uResolution.y);
    float hx = surface(p + vec2(e, 0.0));
    float hy = surface(p + vec2(0.0, e));
    vec3 normal = normalize(vec3((h - hx) * 12.0, (h - hy) * 12.0, 1.0));

    vec3 lightA = normalize(vec3(-0.4, 0.28, 0.86));
    vec3 lightB = normalize(vec3(0.62, -0.35, 0.7));
    vec3 view = vec3(0.0, 0.0, 1.0);
    vec3 reflected = reflect(-view, normal);

    float bands = smoothstep(0.14, 0.94, h);
    float edge = pow(1.0 - max(dot(normal, view), 0.0), 2.2);
    float specA = pow(max(dot(reflected, lightA), 0.0), 28.0 + uChrome * 84.0);
    float specB = pow(max(dot(reflected, lightB), 0.0), 18.0 + uChrome * 56.0);
    float horizon = smoothstep(-0.34, 0.18, p.y);
    float sky = smoothstep(0.02, 0.72, p.y);
    float ground = smoothstep(0.62, -0.34, p.y);
    float sheen = smoothstep(0.42, 0.98, sin((p.x * 1.2 - p.y * 0.42) * 3.1 + h * 1.8));

    float seedRibbon = smoothstep(0.56, 0.98, sin((p.x * 1.6 + p.y * 0.4) * 2.2 + h * 1.4 + uTime * 0.12));
    float ember = smoothstep(0.72, 1.0, sin((p.x * 1.1 - p.y * 0.65) * 2.5 - h * 1.2 + uTime * 0.16));
    float violetBlue = smoothstep(0.58, 1.0, cos((p.x * 0.55 + p.y * 0.45) * 1.9 + h * 1.2 - uTime * 0.09));

    vec3 seedMix = mix(uColorB, uColorE, violetBlue * 0.32);
    seedMix = mix(seedMix, uColorD, seedRibbon * 0.12);

    vec3 distant = mix(uColorA, seedMix, bands * 0.48);
    distant = mix(distant, uColorC, (sheen * 0.12 + ember * 0.2) * horizon);
    vec3 base = mix(distant * 0.62, distant, sky * 0.48 + ground * 0.28);
    base += (specA * seedMix + specB * uColorC) * (0.04 + uChrome * 0.16) * horizon;
    base += edge * uChrome * 0.06;
    base += pointerField * mix(uColorB, uColorC, 0.38) * 0.025;

    float vignette = smoothstep(1.34, 0.24, length(p * vec2(0.78, 1.08)));
    vec3 color = base * (0.36 + vignette * 0.72);
    color = (color - 0.5) * (1.0 + uContrast * 0.38) + 0.5;

    float grain = (hash(gl_FragCoord.xy + uTime * 60.0) - 0.5) * uGrain;
    color += grain;
    color = pow(max(color, 0.0), vec3(0.94));

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
      uColorA: gl.getUniformLocation(program, "uColorA"),
      uColorB: gl.getUniformLocation(program, "uColorB"),
      uColorC: gl.getUniformLocation(program, "uColorC"),
      uColorD: gl.getUniformLocation(program, "uColorD"),
      uColorE: gl.getUniformLocation(program, "uColorE"),
    },
  };
};

export const PromoLiquidMeshBackdrop = () => {
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

    const colorA = hexToRgb(LIQUID_MESH_PRESET.colorA);
    const colorB = hexToRgb(LIQUID_MESH_PRESET.colorB);
    const colorC = hexToRgb(LIQUID_MESH_PRESET.colorC);
    const colorD = hexToRgb(LIQUID_MESH_PRESET.colorD);
    const colorE = hexToRgb(LIQUID_MESH_PRESET.colorE);
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };
    let frameId = 0;
    let lastTime = performance.now();
    let sceneTime = 0;
    let isVisible = true;
    let isDocumentVisible = document.visibilityState === "visible";

    const resize = () => {
      if (!gl) return;
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        LIQUID_MESH_PRESET.resolution,
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

      const delta = Math.max(16.7, now - lastTime);
      lastTime = now;
      mouse.x += (mouse.tx - mouse.x) * 0.055;
      mouse.y += (mouse.ty - mouse.y) * 0.055;

      if (!isVisible || !isDocumentVisible) return;

      sceneTime += delta * 0.001 * LIQUID_MESH_PRESET.speed;
      gl.useProgram(meshProgram.id);
      gl.uniform1f(meshProgram.uniforms.uTime, sceneTime);
      gl.uniform2f(
        meshProgram.uniforms.uResolution,
        canvas.width,
        canvas.height,
      );
      gl.uniform2f(meshProgram.uniforms.uMouse, mouse.x, mouse.y);
      gl.uniform1f(meshProgram.uniforms.uWarp, LIQUID_MESH_PRESET.warp);
      gl.uniform1f(meshProgram.uniforms.uRipple, LIQUID_MESH_PRESET.ripple);
      gl.uniform1f(meshProgram.uniforms.uChrome, LIQUID_MESH_PRESET.chrome);
      gl.uniform1f(meshProgram.uniforms.uContrast, LIQUID_MESH_PRESET.contrast);
      gl.uniform1f(meshProgram.uniforms.uGrain, LIQUID_MESH_PRESET.grain);
      gl.uniform1f(
        meshProgram.uniforms.uPointer,
        LIQUID_MESH_PRESET.pointer ? 1 : 0,
      );
      gl.uniform3fv(meshProgram.uniforms.uColorA, colorA);
      gl.uniform3fv(meshProgram.uniforms.uColorB, colorB);
      gl.uniform3fv(meshProgram.uniforms.uColorC, colorC);
      gl.uniform3fv(meshProgram.uniforms.uColorD, colorD);
      gl.uniform3fv(meshProgram.uniforms.uColorE, colorE);
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
    window.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    resize();
    frameId = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      observer?.disconnect();

      if (gl) {
        gl.deleteBuffer(meshProgram.buffer);
        gl.deleteProgram(meshProgram.id);
      }
    };
  }, []);

  return (
    <div ref={rootRef} className="promo-liquid-mesh" aria-hidden="true">
      <div className="promo-liquid-mesh__fallback" />
      <canvas ref={canvasRef} className="promo-liquid-mesh__canvas" />
    </div>
  );
};
