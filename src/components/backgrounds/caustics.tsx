"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { EDGE_MASK, fitCanvas, stepHover, useFrameLoop, usePointer } from "./shared";

/*
 * Hero background: pool caustics, the bright, shifting web of light on the floor of a
 * swimming pool. A single WebGL2 fragment shader, no libraries.
 *
 * The pattern is the edges of two animated Voronoi layers, slowly warped by noise.
 * Where the layers cross, light "focuses" and gets brighter, like real caustics.
 * The cursor acts as a lens: it magnifies the pattern and tints it lime.
 *
 * Uniforms:
 *   u_res   canvas size in device px
 *   u_time  seconds
 *   u_mouse cursor in device px (origin bottom-left, like gl_FragCoord)
 *   u_hover 0..1, eased cursor presence
 */

const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_hover;
out vec4 outColor;

const vec3 BG   = vec3(0.039, 0.039, 0.043); // #0A0A0B
const vec3 LIME = vec3(0.784, 0.961, 0.376); // #C8F560

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
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
// distance between nearest and 2nd-nearest cell points: ~0 on cell edges
float cellEdge(vec2 p, float t) {
  vec2 i = floor(p), f = fract(p);
  float f1 = 8.0, f2 = 8.0;
  for (int y = -1; y <= 1; y++)
  for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y));
    vec2 o = 0.5 + 0.5 * sin(t + 6.2831 * hash2(i + g));
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < f1) { f2 = f1; f1 = d; } else if (d < f2) { f2 = d; }
  }
  return sqrt(f2) - sqrt(f1);
}

void main() {
  // Normalise by height so the pattern's scale doesn't depend on pixel density.
  vec2 uv = gl_FragCoord.xy / u_res.y;
  vec2 m  = u_mouse / u_res.y;
  float d = distance(uv, m);
  float t = u_time;

  // Lens: pull coordinates toward the cursor, which magnifies the pattern there.
  float lens = u_hover * exp(-d * d * 18.0);
  vec2 p = m + (uv - m) * (1.0 - 0.4 * lens);

  // Strong, slow warping bends the cell edges into wavy, organic light lines.
  vec2 warp = vec2(fbm(p * 1.2 + t * 0.04), fbm(p * 1.2 + 3.7 - t * 0.04));
  vec2 w = p * 4.5 + 1.1 * warp;
  float l1 = 1.0 - smoothstep(0.0, 0.11, cellEdge(w, t * 0.4));
  float l2 = 1.0 - smoothstep(0.0, 0.09, cellEdge(w * 1.45 + 4.0 + 0.6 * warp, t * 0.55));
  float c = 0.35 * l1 * l1 + 0.25 * l2 * l2 + 0.9 * l1 * l2;

  vec3 tint = mix(vec3(0.12, 0.125, 0.135), LIME * 0.8, smoothstep(0.0, 0.7, lens));
  outColor = vec4(BG + c * tint, 1.0);
}
`;

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

/** Phones and touch devices: render at 1x and 30fps to save battery. */
const LITE_QUERY = "(max-width: 767px), (pointer: coarse)";

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s));
  }
  return s;
}

export function Caustics() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const pointer = usePointer(ref);
  const glRef = useRef<{
    gl: WebGL2RenderingContext;
    loc: Record<"res" | "time" | "mouse" | "hover", WebGLUniformLocation | null>;
  } | null>(null);
  const lite = useRef<boolean | null>(null);
  const lastDraw = useRef(-1);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, alpha: false });
    if (!canvas || !gl) return; // no WebGL2: canvas stays empty, page still works

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
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
  }, []);

  useFrameLoop(
    ref,
    (t) => {
      const canvas = ref.current;
      const g = glRef.current;
      if (!canvas || !g) return;

      lite.current ??= window.matchMedia(LITE_QUERY).matches;
      if (lite.current && t - lastDraw.current < 1 / 30) return;
      lastDraw.current = t;

      // Per-pixel work, so cap resolution (lower still on phones).
      fitCanvas(canvas, lite.current ? 1 : 1.5);
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
