"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "motion/react";
import { fitCanvas, useFrameLoop, usePointer } from "@/components/backgrounds/shared";

/*
 * Background video with an interactive water-ripple layer.
 *
 * The video plays as normal, and on desktop a WebGL canvas draws it on top, distorted by
 * a small wave simulation: moving the mouse leaves a wake, clicking makes a splash. Ripples
 * refract the picture (with a hint of colour fringing) and catch a soft cream glint.
 *
 * The simulation runs at 1/4 resolution, ping-ponging between two float textures:
 *   drop pass   → adds a bump where the cursor is
 *   update pass → each pixel accelerates toward its neighbours' average (waves spread)
 *   render pass → reads slopes, offsets the video lookup, adds the glint
 *
 * Falls back to the plain video on touch devices, without WebGL2 float support, and for
 * reduced motion (where the video is also paused on its first frame).
 * The video must be same-origin (e.g. /hero.mp4) to be used as a WebGL texture.
 */

const VERT = /* glsl */ `#version 300 es
in vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const DROP = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform vec2 u_size;
uniform vec2 u_center;
uniform float u_radius;
uniform float u_strength;
out vec4 outColor;
void main() {
  vec2 uv = gl_FragCoord.xy / u_size;
  vec4 s = texture(u_state, uv);
  float d = length((uv - u_center) * vec2(u_size.x / u_size.y, 1.0)) / u_radius;
  float bump = max(0.0, 1.0 - d);
  s.r += (0.5 - 0.5 * cos(bump * 3.14159265)) * u_strength;
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
  vec2 dx = vec2(1.0 / u_size.x, 0.0), dy = vec2(0.0, 1.0 / u_size.y);
  vec4 s = texture(u_state, uv);
  float avg = 0.25 * (texture(u_state, uv - dx).r + texture(u_state, uv + dx).r +
                      texture(u_state, uv - dy).r + texture(u_state, uv + dy).r);
  s.g += (avg - s.r) * 2.0; // velocity
  s.g *= 0.985;             // damping
  s.r += s.g;               // height
  outColor = s;
}
`;

const RENDER = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D u_state;
uniform sampler2D u_video;
uniform vec2 u_res;
uniform vec2 u_simSize;
uniform float u_videoAspect;
out vec4 outColor;

const vec3 CREAM = vec3(0.882, 0.878, 0.8);

// Map screen uv to video uv like CSS object-fit: cover.
vec2 cover(vec2 uv) {
  float ca = u_res.x / u_res.y;
  if (ca > u_videoAspect) uv.y = (uv.y - 0.5) * (u_videoAspect / ca) + 0.5;
  else uv.x = (uv.x - 0.5) * (ca / u_videoAspect) + 0.5;
  return uv;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  vec2 e = 1.0 / u_simSize;
  float hx = texture(u_state, uv + vec2(e.x, 0.0)).r - texture(u_state, uv - vec2(e.x, 0.0)).r;
  float hy = texture(u_state, uv + vec2(0.0, e.y)).r - texture(u_state, uv - vec2(0.0, e.y)).r;

  // Refraction, with red and blue bent slightly differently (subtle colour fringing).
  vec2 off = vec2(hx, hy) * 3.2;
  vec2 base = cover(uv);
  float r = texture(u_video, base + off * 1.15).r;
  float g = texture(u_video, base + off).g;
  float b = texture(u_video, base + off * 0.85).b;
  vec3 col = vec3(r, g, b);

  // Soft glint on wave crests.
  vec3 n = normalize(vec3(-hx * 70.0, -hy * 70.0, 1.0));
  vec3 L = normalize(vec3(-0.4, 0.6, 1.0));
  float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 80.0);
  col += CREAM * spec * 0.35;

  outColor = vec4(col, 1.0);
}
`;

type Prog = { prog: WebGLProgram; u: (name: string) => WebGLUniformLocation | null };
type Target = { tex: WebGLTexture; fbo: WebGLFramebuffer };
type GL = {
  gl: WebGL2RenderingContext;
  drop: Prog;
  update: Prog;
  render: Prog;
  vao: WebGLVertexArrayObject;
  targets: [Target, Target];
  videoTex: WebGLTexture;
  w: number;
  h: number;
  read: 0 | 1;
};

const SIM_SCALE = 4; // one sim cell per 4 CSS px

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

function makeTexture(gl: WebGL2RenderingContext) {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  return tex;
}

export function VideoRipple({ src, poster, className }: { src: string; poster?: string; className?: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();
  const pointer = usePointer(canvasRef);
  const glRef = useRef<GL | null>(null);
  const last = useRef<{ x: number; y: number } | null>(null);
  const splash = useRef<{ x: number; y: number } | null>(null);

  // Play / pause with the reduced-motion preference.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (reduce) v.pause();
    else v.play().catch(() => {});
  }, [reduce]);

  // Set up WebGL (desktop + mouse only).
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video || reduce) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const gl = canvas.getContext("webgl2", { antialias: false, alpha: false });
    if (!gl || !gl.getExtension("EXT_color_buffer_float")) return;

    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const mkTarget = (): Target => ({ tex: makeTexture(gl), fbo: gl.createFramebuffer()! });
    glRef.current = {
      gl,
      drop: makeProgram(gl, DROP),
      update: makeProgram(gl, UPDATE),
      render: makeProgram(gl, RENDER),
      vao,
      targets: [mkTarget(), mkTarget()],
      videoTex: makeTexture(gl),
      w: 0,
      h: 0,
      read: 0,
    };

    // Canvas takes over drawing; keep the video playing underneath as the texture source.
    canvas.style.opacity = "1";
    video.style.opacity = "0";

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = canvas.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
      splash.current = { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    window.addEventListener("pointerdown", onDown);

    return () => {
      window.removeEventListener("pointerdown", onDown);
      const s = glRef.current;
      if (s) {
        for (const t of s.targets) {
          gl.deleteTexture(t.tex);
          gl.deleteFramebuffer(t.fbo);
        }
        gl.deleteTexture(s.videoTex);
        [s.drop, s.update, s.render].forEach((p) => gl.deleteProgram(p.prog));
      }
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      glRef.current = null;
      canvas.style.opacity = "0";
      video.style.opacity = "1";
    };
  }, [reduce]);

  useFrameLoop(
    canvasRef,
    () => {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const s = glRef.current;
      if (!canvas || !video || !s || video.readyState < 2) return;
      const { gl } = s;
      fitCanvas(canvas, 1.5);

      const sw = Math.max(2, Math.round(canvas.clientWidth / SIM_SCALE));
      const sh = Math.max(2, Math.round(canvas.clientHeight / SIM_SCALE));
      if (sw !== s.w || sh !== s.h) {
        for (const t of s.targets) {
          gl.bindTexture(gl.TEXTURE_2D, t.tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, sw, sh, 0, gl.RGBA, gl.HALF_FLOAT, null);
          gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
          gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t.tex, 0);
          gl.clearColor(0, 0, 0, 0);
          gl.clear(gl.COLOR_BUFFER_BIT);
        }
        s.w = sw;
        s.h = sh;
      }

      gl.bindVertexArray(s.vao);
      gl.viewport(0, 0, s.w, s.h);
      const pass = (p: Prog, set: () => void) => {
        const src = s.targets[s.read];
        const dst = s.targets[s.read === 0 ? 1 : 0];
        gl.useProgram(p.prog);
        gl.bindFramebuffer(gl.FRAMEBUFFER, dst.fbo);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, src.tex);
        gl.uniform1i(p.u("u_state"), 0);
        gl.uniform2f(p.u("u_size"), s.w, s.h);
        set();
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        s.read = s.read === 0 ? 1 : 0;
      };
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const drop = (x: number, y: number, radius: number, strength: number) =>
        pass(s.drop, () => {
          gl.uniform2f(s.drop.u("u_center"), x / w, 1 - y / h);
          gl.uniform1f(s.drop.u("u_radius"), radius);
          gl.uniform1f(s.drop.u("u_strength"), strength);
        });

      // Cursor wake: drops spaced along the path since last frame, stronger when moving fast.
      const p = pointer.current;
      if (p.active) {
        const prev = last.current ?? { x: p.x, y: p.y };
        const dist = Math.hypot(p.x - prev.x, p.y - prev.y);
        if (dist > 1) {
          const steps = Math.min(5, Math.ceil(dist / 14));
          const strength = Math.min(0.02, 0.003 + dist * 0.0005);
          for (let i = 1; i <= steps; i++) {
            drop(prev.x + ((p.x - prev.x) * i) / steps, prev.y + ((p.y - prev.y) * i) / steps, 0.025, (strength / steps) * 2);
          }
        }
        last.current = { x: p.x, y: p.y };
      } else {
        last.current = null;
      }
      if (splash.current) {
        drop(splash.current.x, splash.current.y, 0.05, 0.05);
        splash.current = null;
      }
      pass(s.update, () => {});
      pass(s.update, () => {});

      // Upload the current video frame and draw.
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, s.videoTex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);

      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(s.render.prog);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, s.targets[s.read].tex);
      gl.uniform1i(s.render.u("u_state"), 0);
      gl.uniform1i(s.render.u("u_video"), 1);
      gl.uniform2f(s.render.u("u_res"), canvas.width, canvas.height);
      gl.uniform2f(s.render.u("u_simSize"), s.w, s.h);
      gl.uniform1f(s.render.u("u_videoAspect"), video.videoWidth / video.videoHeight);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    reduce,
  );

  return (
    <div className={className}>
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 h-full w-full opacity-0"
      />
    </div>
  );
}
