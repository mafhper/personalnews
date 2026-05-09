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
};

type LiquidMeshProgram = {
  id: WebGLProgram;
  buffer: WebGLBuffer;
  uniforms: LiquidMeshUniforms;
};

const LIQUID_MESH_PRESET = {
  speed: 0.2,
  warp: 0.5,
  ripple: 0.74,
  chrome: 0.14,
  contrast: 0.34,
  grain: 0.01,
  resolution: 1.45,
  pointer: false,
  centerX: 0.58,
  centerY: 0.34,
  centerSize: 1.32,
  clouds: 0.92,
  colorA: "#1678d4",
  colorB: "#f8fbff",
  colorC: "#9bd8ff",
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
  uniform float uClouds;
  uniform vec2 uCenter;
  uniform float uCenterSize;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;

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

    vec3 base = mix(uColorA, uColorB, bands);
    base = mix(base, uColorC, sheen * 0.36);
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
    vec3 skyTop = mix(uColorA, vec3(0.05, 0.26, 0.58), 0.16);
    vec3 skyHorizon = mix(uColorC, vec3(0.86, 0.95, 1.0), 0.28);
    vec3 sky = mix(skyHorizon, skyTop, smoothstep(0.0, 1.0, uv.y));
    sky += vec3(0.06, 0.1, 0.14) * (1.0 - uv.y) * (1.0 - cloudMask);
    vec3 cloud = mix(vec3(0.72, 0.82, 0.92), uColorB, 0.76);
    cloud += vec3(0.2, 0.19, 0.16) * pow(cloudMask, 2.4);
    vec3 cloudColor = mix(sky, cloud, cloudMask * (0.58 + cloudBody * 0.38));
    cloudColor = mix(cloudColor, uColorC, sheen * 0.08);
    color = mix(color, cloudColor, uClouds);

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
      uClouds: gl.getUniformLocation(program, "uClouds"),
      uCenter: gl.getUniformLocation(program, "uCenter"),
      uCenterSize: gl.getUniformLocation(program, "uCenterSize"),
      uColorA: gl.getUniformLocation(program, "uColorA"),
      uColorB: gl.getUniformLocation(program, "uColorB"),
      uColorC: gl.getUniformLocation(program, "uColorC"),
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

    const colorA = hexToRgb(LIQUID_MESH_PRESET.colorA);
    const colorB = hexToRgb(LIQUID_MESH_PRESET.colorB);
    const colorC = hexToRgb(LIQUID_MESH_PRESET.colorC);
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
      gl.uniform1f(meshProgram.uniforms.uClouds, LIQUID_MESH_PRESET.clouds);
      gl.uniform2f(meshProgram.uniforms.uCenter, LIQUID_MESH_PRESET.centerX, LIQUID_MESH_PRESET.centerY);
      gl.uniform1f(meshProgram.uniforms.uCenterSize, LIQUID_MESH_PRESET.centerSize);
      gl.uniform3fv(meshProgram.uniforms.uColorA, colorA);
      gl.uniform3fv(meshProgram.uniforms.uColorB, colorB);
      gl.uniform3fv(meshProgram.uniforms.uColorC, colorC);
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
    <div
      ref={rootRef}
      className={["promo-liquid-mesh", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <div className="promo-liquid-mesh__fallback" />
      <canvas ref={canvasRef} className="promo-liquid-mesh__canvas" />
    </div>
  );
};
