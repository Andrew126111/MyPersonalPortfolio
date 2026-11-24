"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion, useScroll } from "motion/react";
import { fitCanvas, useFrameLoop } from "@/components/backgrounds/shared";

/*
 * Cloud transition between the hero and the About tunnel.
 *
 * A full-screen WebGL overlay draws procedural clouds (layered, domain-warped noise),
 * coloured to match the hero video's twilight grade. Page scroll drives three beats:
 *   1. "in":   as the hero scrolls away, clouds billow up from the bottom and thicken
 *   2. peak:   the screen is fully clouded right as the About tunnel pins in place
 *   3. "out":  the clouds part from the centre outward, revealing the tunnel
 * Throughout, the camera drifts forward into the clouds ("travel").
 *
 * Renders at half resolution (clouds are soft, so it's invisible) and only while the
 * transition is on screen. Skipped entirely for reduced motion.
 */

const FRAG = /* glsl */ `#version 300 es
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_in;     // 0..1 clouds rolling in
uniform float u_out;    // 0..1 clouds parting
uniform float u_travel; // 0..1 forward drift
out vec4 outColor;

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
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.03; a *= 0.5; }
  return v;
}
// "Billow" noise: folding the noise makes rounded, puffy, cauliflower-like shapes.
float billow(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * (1.0 - abs(noise(p) * 2.0 - 1.0)); p = r * p * 2.03; a *= 0.5; }
  return v;
}
float clouds(vec2 p, float t) {
  vec2 w = vec2(fbm(p * 0.5 + t), fbm(p * 0.5 - t + 4.0));
  // big soft masses (fbm) shaped by puffy billows
  return fbm(p * 0.9 + w * 0.5) * 0.55 + billow(p * 1.6 + w * 0.6 + vec2(t * 0.4, 0.0)) * 0.45;
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y; // centred, y up
  float t = u_time * 0.03;

  // Fly forward: zoom into the centre as you scroll.
  vec2 p = uv * (1.0 - 0.5 * u_travel) * 1.15 + vec2(0.0, u_travel * 0.5);
  float c = clouds(p, t);

  // Coverage grows with u_in, rising from the bottom first; fully solid near the peak.
  float bottomBias = (0.5 - (uv.y + 0.5)) * 0.7 * (1.0 - u_in);
  float a = smoothstep(0.4, 0.78, c + u_in * 1.3 - 0.6 + bottomBias);

  // Parting: a hole opens in the centre (with a ragged, cloudy edge) and widens.
  float r = u_out * 1.6 - 0.6;
  a *= smoothstep(r, r + 0.35, length(uv * vec2(0.8, 1.0)) + (c - 0.5) * 0.45);

  // Lighting: mostly by thickness (puffs glow, thin edges fall into soft violet shadow),
  // plus a gentle highlight on the side facing the light (upper left).
  float c2 = clouds(p + vec2(-0.04, 0.06), t);
  float shade = clamp((c - 0.35) * 1.6 + (c - c2) * 1.5, 0.0, 1.0);
  vec3 shadow = vec3(0.50, 0.42, 0.62);  // soft violet
  vec3 mid    = vec3(0.82, 0.66, 0.78);  // dusky pink
  vec3 light  = vec3(1.00, 0.90, 0.87);  // warm peach-white
  vec3 col = mix(shadow, mid, smoothstep(0.0, 0.5, shade));
  col = mix(col, light, smoothstep(0.45, 1.0, shade));

  outColor = vec4(col * a, a); // premultiplied alpha
}
`;

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Scroll beats, in viewport heights from the top of the page (the hero is 1 viewport tall).
const IN = [0.3, 0.95] as const;
const OUT = [1.0, 1.6] as const;
const TRAVEL = [0.3, 1.6] as const;

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
  return s;
}

export function CloudTransition() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return <Clouds />;
}

function Clouds() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { scrollY } = useScroll();
  const glRef = useRef<{
    gl: WebGL2RenderingContext;
    loc: Record<"res" | "time" | "in" | "out" | "travel", WebGLUniformLocation | null>;
  } | null>(null);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, premultipliedAlpha: true });
    if (!canvas || !gl) return;

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
    gl.clearColor(0, 0, 0, 0);

    glRef.current = {
      gl,
      loc: {
        res: gl.getUniformLocation(prog, "u_res"),
        time: gl.getUniformLocation(prog, "u_time"),
        in: gl.getUniformLocation(prog, "u_in"),
        out: gl.getUniformLocation(prog, "u_out"),
        travel: gl.getUniformLocation(prog, "u_travel"),
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

      const vh = window.innerHeight;
      const y = scrollY.get() / vh; // scroll position in viewport heights
      const pin = clamp01((y - IN[0]) / (IN[1] - IN[0]));
      const pout = clamp01((y - OUT[0]) / (OUT[1] - OUT[0]));
      const travel = clamp01((y - TRAVEL[0]) / (TRAVEL[1] - TRAVEL[0]));

      const visible = pin > 0 && pout < 1;
      canvas.style.visibility = visible ? "visible" : "hidden";
      if (!visible) return;

      fitCanvas(canvas, 0.5); // half resolution: clouds are soft anyway
      const { gl, loc } = g;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(loc.res, canvas.width, canvas.height);
      gl.uniform1f(loc.time, t);
      gl.uniform1f(loc.in, pin);
      gl.uniform1f(loc.out, pout);
      gl.uniform1f(loc.travel, travel);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    false,
  );

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 h-full w-full"
      style={{ visibility: "hidden" }}
    />
  );
}
