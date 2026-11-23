"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { EDGE_MASK, fitCanvas, stepHover, useFrameLoop, usePointer } from "./shared";

/*
 * Interactive water surface over the dot grid.
 *
 * A height-field wave simulation runs on the GPU at ~1/4 resolution, ping-ponging
 * between two float textures. Each frame:
 *   1. "drop" passes add bumps along the cursor's path (plus the odd ambient raindrop)
 *   2. "update" passes propagate waves (each pixel accelerates toward its neighbours' average)
 *   3. "render" reads the heights, computes surface normals, and draws the dot grid
 *      refracted through the water, with a faint lime glint on wave crests.
 */

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const DROP = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_size;
uniform vec2 u_center;   // 0..1
uniform float u_radius;  // in units of sim height
uniform float u_strength;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / u_size;
  vec4 s = texture(u_state, uv);
  float aspect = u_size.x / u_size.y;
  float d = length((uv - u_center) * vec2(aspect, 1.0)) / u_radius;
  float bump = max(0.0, 1.0 - d);
  bump = 0.5 - 0.5 * cos(bump * 3.14159265);
  s.r += bump * u_strength;
  outColor = s;
}
`;

const UPDATE = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_size;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / u_size;
  vec2 dx = vec2(1.0 / u_size.x, 0.0);
  vec2 dy = vec2(0.0, 1.0 / u_size.y);
  vec4 s = texture(u_state, uv);
  float avg = 0.25 * (
    texture(u_state, uv - dx).r + texture(u_state, uv + dx).r +
    texture(u_state, uv - dy).r + texture(u_state, uv + dy).r);
  s.g += (avg - s.r) * 2.0;  // velocity
  s.g *= 0.986;              // damping: lower = calmer water
  s.r += s.g;                // height
  outColor = s;
}
`;

const RENDER = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_res;      // canvas, device px
uniform vec2 u_simSize;
uniform float u_dpr;
out vec4 outColor;

const vec3 BG     = vec3(0.039, 0.039, 0.043);
const vec3 SUBTLE = vec3(0.361, 0.361, 0.380);
const vec3 LIME   = vec3(0.784, 0.961, 0.376);
const float GAP = 28.0;

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 e = 1.0 / u_simSize;
  float h  = texture(u_state, uv).r;
  float hx = texture(u_state, uv + vec2(e.x, 0.0)).r - texture(u_state, uv - vec2(e.x, 0.0)).r;
  float hy = texture(u_state, uv + vec2(0.0, e.y)).r - texture(u_state, uv - vec2(0.0, e.y)).r;
  // Heights are tiny (~0.01), so scale slopes up a lot to get visible bending.
  const float SLOPE = 70.0;
  vec3 n = normalize(vec3(-hx * SLOPE, -hy * SLOPE, 1.0));

  // Refract: look up the dot grid at a position bent by the surface slope.
  vec2 p = gl_FragCoord.xy / u_dpr + n.xy * 22.0;
  vec2 cell = mod(p, GAP) - 0.5 * GAP;
  float dotMask = 1.0 - smoothstep(0.9, 1.7, length(cell));

  float energy = clamp(length(n.xy) * 2.5 + abs(h) * 12.0, 0.0, 1.0);
  vec3 dotCol = mix(SUBTLE * 0.75, LIME, smoothstep(0.08, 0.7, energy));
  vec3 col = mix(BG, dotCol, dotMask * (0.7 + 0.3 * energy));

  // Glint on wave crests.
  vec3 L = normalize(vec3(-0.45, 0.6, 1.0));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 90.0);
  col += mix(vec3(0.9), LIME, 0.6) * spec * 0.22;

  outColor = vec4(col, 1.0);
}
`;

type Prog = { prog: WebGLProgram; u: (name: string) => WebGLUniformLocation | null };

function makeProgram(gl: WebGL2RenderingContext, frag: string): Prog {
  const mk = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, mk(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, mk(gl.FRAGMENT_SHADER, frag));
  gl.bindAttribLocation(prog, 0, "a_pos");
  gl.linkProgram(prog);
  const cache = new Map<string, WebGLUniformLocation | null>();
  return {
    prog,
    u: (name) => {
      if (!cache.has(name)) cache.set(name, gl.getUniformLocation(prog, name));
      return cache.get(name)!;
    },
  };
}

type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };

type Sim = {
  gl: WebGL2RenderingContext;
  drop: Prog;
  update: Prog;
  render: Prog;
  vao: WebGLVertexArrayObject;
  targets: [Target, Target];
  w: number;
  h: number;
  read: 0 | 1;
};

const SIM_SCALE = 4; // sim cell = 4 CSS px

export function WaterField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const pointer = usePointer(ref);
  const sim = useRef<Sim | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const nextRain = useRef(0);

  useEffect(() => {
    const canvas = ref.current;
    const gl = canvas?.getContext("webgl2", { antialias: false, alpha: false });
    // Rendering into float textures needs this extension (supported on ~all desktop GPUs).
    if (!canvas || !gl || !gl.getExtension("EXT_color_buffer_float")) return;

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const mkTarget = (): Target => {
      const tex = gl.createTexture()!;
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer()!;
      return { tex, fbo };
    };

    sim.current = {
      gl,
      drop: makeProgram(gl, DROP),
      update: makeProgram(gl, UPDATE),
      render: makeProgram(gl, RENDER),
      vao,
      targets: [mkTarget(), mkTarget()],
      w: 0,
      h: 0,
      read: 0,
    };

    return () => {
      const s = sim.current;
      if (!s) return;
      for (const t of s.targets) {
        gl.deleteTexture(t.tex);
        gl.deleteFramebuffer(t.fbo);
      }
      [s.drop, s.update, s.render].forEach((p) => gl.deleteProgram(p.prog));
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      sim.current = null;
    };
  }, []);

  useFrameLoop(
    ref,
    (t) => {
      const canvas = ref.current;
      const s = sim.current;
      if (!canvas || !s) return;
      const { gl } = s;
      fitCanvas(canvas, 1.5);
      const dpr = canvas.width / canvas.clientWidth;

      // (Re)allocate sim textures when the size changes. Resets the water, which is fine.
      const sw = Math.max(2, Math.round(canvas.clientWidth / SIM_SCALE));
      const sh = Math.max(2, Math.round(canvas.clientHeight / SIM_SCALE));
      if (sw !== s.w || sh !== s.h) {
        for (const tgt of s.targets) {
          gl.bindTexture(gl.TEXTURE_2D, tgt.tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, sw, sh, 0, gl.RGBA, gl.HALF_FLOAT, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, tgt.fbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tgt.tex, 0);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        s.w = sw;
        s.h = sh;
      }

      gl.bindVertexArray(s.vao);
      gl.viewport(0, 0, s.w, s.h);

      // One sim pass: read from targets[read], write to the other, then swap.
      const pass = (p: Prog, setUniforms: () => void) => {
        const src = s.targets[s.read];
        const dst = s.targets[s.read === 0 ? 1 : 0];
        gl.useProgram(p.prog);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform1i(p.u("u_state"), 0);
        gl.uniform2f(p.u("u_size"), s.w, s.h);
        setUniforms();
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        s.read = s.read === 0 ? 1 : 0;
      };
      const drop = (x: number, y: number, radius: number, strength: number) =>
        pass(s.drop, () => {
          gl.uniform2f(s.drop.u("u_center"), x, y);
          gl.uniform1f(s.drop.u("u_radius"), radius);
          gl.uniform1f(s.drop.u("u_strength"), strength);
        });

      if (!reduce) {
        // Cursor wake: drops spaced along the path since last frame.
        const p = pointer.current;
        stepHover(p);
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if (p.active) {
          const prev = last.current ?? { x: p.x, y: p.y };
          const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
          if (dist > 1) {
            const steps = Math.min(5, Math.ceil(dist / 14));
            const strength = Math.min(0.022, 0.004 + dist * 0.0006);
            for (let i = 1; i <= steps; i++) {
              const x = prev.x + ((p.x - prev.x) * i) / steps;
              const y = prev.y + ((p.y - prev.y) * i) / steps;
              drop(x / w, 1 - y / h, 0.022, strength / steps * 2);
            }
          }
          last.current = { x: p.x, y: p.y };
        } else {
          last.current = null;
        }

        // Ambient rain so the surface feels alive even without a mouse.
        if (t > nextRain.current) {
          drop(Math.random(), Math.random(), 0.012 + Math.random() * 0.01, 0.01 + Math.random() * 0.01);
          nextRain.current = t + 0.9 + Math.random() * 1.6;
        }

        pass(s.update, () => {});
        pass(s.update, () => {});
      }

      // Draw to screen.
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(s.render.prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, s.targets[s.read].tex);
      gl.uniform1i(s.render.u("u_state"), 0);
      gl.uniform2f(s.render.u("u_res"), canvas.width, canvas.height);
      gl.uniform2f(s.render.u("u_simSize"), s.w, s.h);
      gl.uniform1f(s.render.u("u_dpr"), dpr);
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
