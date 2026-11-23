"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { EDGE_MASK, fitCanvas, stepHover, useFrameLoop, usePointer } from "./shared";

/*
 * Full-screen WebGL2 fragment shaders. No libraries: one triangle, one program.
 * Uniforms shared by every shader:
 *   u_res   canvas size in device px
 *   u_time  seconds
 *   u_mouse cursor in device px (origin bottom-left, like gl_FragCoord)
 *   u_hover 0..1, eased cursor presence
 */

const HEADER = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_hover;
out vec4 outColor;

const vec3 BG   = vec3(0.039, 0.039, 0.043); // #0A0A0B
const vec3 LIME = vec3(0.784, 0.961, 0.376); // #C8F560

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.0; a *= 0.5; }
  return v;
}
`;

/** Ink in water: domain-warped smoke with thin lime veins; the cursor stirs it. */
const INK = /* glsl */ `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res.y;
  vec2 m  = u_mouse / u_res.y;
  float d = distance(uv, m);
  float t = u_time * 0.06;

  vec2 q = vec2(fbm(uv * 1.4 + vec2(0.0, t)), fbm(uv * 1.4 + vec2(5.2, -t)));
  // stir: swirl the warp field around the cursor
  vec2 dir = uv - m;
  float pull = u_hover * exp(-d * 5.0);
  q += pull * 0.6 * vec2(-dir.y, dir.x) / (d + 0.05);

  float n = fbm(uv * 1.8 + 2.2 * q + t);
  float smoke = smoothstep(0.35, 0.95, n);
  float vein  = 1.0 - smoothstep(0.0, 0.018, abs(n - 0.58));

  vec3 col = BG;
  col += vec3(0.11, 0.11, 0.12) * smoke;
  col += LIME * vein * (0.06 + 0.9 * pull);
  outColor = vec4(col, 1.0);
}
`;

/** Topographic map: contour lines of drifting terrain; the cursor raises a hill. */
const TOPO = /* glsl */ `
void main() {
  vec2 uv = gl_FragCoord.xy / u_res.y;
  vec2 m  = u_mouse / u_res.y;
  float d = distance(uv, m);
  float t = u_time * 0.025;

  float h = fbm(uv * 1.3 + vec2(t, -t * 0.7));
  float hill = u_hover * exp(-d * d * 22.0);
  h += hill * 0.45;

  float k = 16.0;
  float f = fract(h * k);
  float w = fwidth(h * k);
  float line = 1.0 - smoothstep(0.0, w * 1.4, min(f, 1.0 - f));
  // every 4th line is an "index contour", slightly brighter
  float major = mod(floor(h * k + 0.5), 4.0) < 0.5 ? 1.0 : 0.0;

  vec3 ink = mix(vec3(0.17, 0.17, 0.18), vec3(0.26, 0.26, 0.28), major);
  vec3 col = BG + line * mix(ink, LIME, smoothstep(0.0, 0.35, hill));
  outColor = vec4(col, 1.0);
}
`;

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export const SHADERS = { ink: INK, topo: TOPO } as const;
export type ShaderName = keyof typeof SHADERS;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
}

export function ShaderField({ shader }: { shader: ShaderName }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const pointer = usePointer(ref);
  const glRef = useRef<{
    gl: WebGL2RenderingContext;
    loc: Record<"res" | "time" | "mouse" | "hover", WebGLUniformLocation | null>;
  } | null>(null);

  // Set up the GL program once per shader.
  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, alpha: false });
    if (!canvas || !gl) return; // no WebGL2: canvas stays empty, page still works

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, HEADER + SHADERS[shader]));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(prog, "a_pos");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    glRef.current = {
      gl,
      loc: {
        res: gl.getUniformLocation(prog, "u_res"),
        time: gl.getUniformLocation(prog, "u_time"),
        mouse: gl.getUniformLocation(prog, "u_mouse"),
        hover: gl.getUniformLocation(prog, "u_hover"),
      },
    };
    return () => {
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
      glRef.current = null;
    };
  }, [shader]);

  useFrameLoop(
    ref,
    (t) => {
      const canvas = ref.current;
      const g = glRef.current;
      if (!canvas || !g) return;
      // Shaders are per-pixel work, so cap resolution a bit lower than other effects.
      fitCanvas(canvas, 1.5);
      const dpr = canvas.width / canvas.clientWidth;
      const p = pointer.current;
      stepHover(p, 0.05);
      const { gl, loc } = g;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(loc.res, canvas.width, canvas.height);
      gl.uniform1f(loc.time, t);
      gl.uniform2f(loc.mouse, p.x * dpr, canvas.height - p.y * dpr);
      gl.uniform1f(loc.hover, p.hover);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    reduce,
  );

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="h-full w-full"
      style={{ maskImage: EDGE_MASK, WebkitMaskImage: EDGE_MASK }}
    />
  );
}
