/**
 * Hero background: one fragment shader, no library.
 *
 *   silhouettes (layered ridges, slow)  -> the persistent runtime: always there
 *   sparks that appear, rise and fade   -> execution worlds: born for work, gone after
 *   silk ribbons with a mint rim        -> the brand's arm gradient, in motion
 *
 * Budget: renders at ≤1.25× DPR (0.75× on small screens), pauses off-screen and
 * in background tabs, draws a single still frame for reduced motion, and
 * leaves the CSS fallback in place when WebGL is unavailable or software-only.
 */

const VERT = `
attribute vec2 a;
void main() { gl_Position = vec4(a, 0.0, 1.0); }
`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uWide;

// Sine-free hashes (Dave Hoskins): stable at low float precision, where
// fract(sin(n) * 43758.5) breaks the noise into visible steps.
float hash(float n) {
  n = fract(n * 0.1031);
  n *= n + 33.33;
  n *= n + n;
  return fract(n);
}
float hash2(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(float x) {
  float i = floor(x);
  float f = fract(x);
  float u = f * f * (3.0 - 2.0 * f);
  return mix(hash(i), hash(i + 1.0), u);
}
float fbm(float x) {
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(x); x *= 2.03; a *= 0.5; }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float aspect = uRes.x / uRes.y;
  vec2 p = vec2(uv.x * aspect, uv.y);
  float t = uTime;
  vec3 mint = vec3(0.176, 0.831, 0.749);

  // Keep the left (text) side calmer on wide screens.
  float side = mix(0.55, smoothstep(0.05, 0.85, uv.x) * 0.85 + 0.15, uWide);

  // Base: ink into deep teal.
  vec3 col = mix(vec3(0.012, 0.067, 0.059), vec3(0.022, 0.15, 0.142), smoothstep(1.0, 0.0, uv.y) * 0.7);
  col += vec3(0.05, 0.36, 0.31) * 0.22 * exp(-3.2 * length(uv - vec2(0.78 + uPointer.x * 0.03, 0.72 + uPointer.y * 0.02)));

  // Silk ribbons: a soft body with a bright rim, like the logo's arm.
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float y = 0.64 - fi * 0.05
      + 0.11 * sin(p.x * 1.15 + t * 0.12 + fi * 1.9)
      + 0.045 * sin(p.x * 2.9 - t * 0.19 + fi * 0.7)
      + uPointer.y * 0.015 * (fi + 1.0);
    float d = uv.y - y;
    float body = smoothstep(0.0, -0.12, d) * smoothstep(-0.26, -0.05, d) * (0.06 - fi * 0.01);
    float edge = exp(-abs(d) / 0.0028) * (0.36 - fi * 0.06);
    col += mint * (body + edge) * side;
  }

  // Silhouettes: back layers higher and brighter, front layers dark.
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float speed = 0.018 + fi * 0.011;
    float h = 0.06 + (3.0 - fi) * 0.055
      + 0.22 * (1.0 - fi * 0.16) * fbm(p.x * (0.85 + fi * 0.5) + t * speed + fi * 7.3 + uPointer.x * 0.06 * (fi + 1.0));
    float inside = smoothstep(h + 0.003, h - 0.003, uv.y);
    vec3 top = mix(vec3(0.05, 0.3, 0.28), vec3(0.012, 0.075, 0.068), fi / 3.0);
    vec3 bottom = mix(vec3(0.02, 0.13, 0.12), vec3(0.006, 0.035, 0.032), fi / 3.0);
    vec3 layer = mix(bottom, top, smoothstep(h - 0.25, h, uv.y));
    col = mix(col, layer, inside);
    float rim = exp(-abs(uv.y - h) * 180.0) * (0.75 - fi * 0.13);
    col += mint * rim;
  }

  // Worlds: sparks that are born, rise and end.
  vec2 grid = p * 13.0;
  vec2 id = floor(grid);
  vec2 f = fract(grid) - 0.5;
  float r = hash2(id);
  if (r > 0.7 && uv.y > 0.12) {
    float ph = fract(t * (0.1 + r * 0.16) + r * 13.0);
    float life = smoothstep(0.0, 0.1, ph) * (1.0 - smoothstep(0.4, 0.85, ph));
    vec2 off = vec2(hash2(id + 3.1) - 0.5, hash2(id + 7.7) - 0.5) * 0.45;
    off.y += ph * 0.2 - 0.1;
    float d = length(f - off);
    float core = smoothstep(0.07, 0.0, d);
    float halo = exp(-d * 10.0) * 0.3;
    col += vec3(0.45, 0.97, 0.88) * (core + halo) * life * (0.35 + 0.65 * side);
  }

  // Vignette and dithering (kills banding in the dark gradients).
  col *= 1.0 - 0.45 * pow(length(uv - vec2(0.5, 0.55)), 2.0);
  col += (hash2(gl_FragCoord.xy + fract(t)) - 0.5) / 128.0;
  gl_FragColor = vec4(col, 1.0);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.warn('[hero] shader:', gl.getShaderInfoLog(s));
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export function mountHero(canvas: HTMLCanvasElement) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const gl = canvas.getContext('webgl', {
    antialias: false,
    alpha: false,
    powerPreference: 'low-power',
    failIfMajorPerformanceCaveat: !new URLSearchParams(location.search).has('hero-force'),
  });
  if (!gl) return;

  // No GPU (software rasteriser): the CSS fallback is cheaper and looks close.
  const info = gl.getExtension('WEBGL_debug_renderer_info');
  const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  // `?hero-force` renders anyway (visual QA in headless browsers).
  const force = new URLSearchParams(location.search).has('hero-force');
  if (!force && /swiftshader|llvmpipe|software|basic render/i.test(renderer)) {
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return;
  }

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uRes = gl.getUniformLocation(prog, 'uRes');
  const uTime = gl.getUniformLocation(prog, 'uTime');
  const uPointer = gl.getUniformLocation(prog, 'uPointer');
  const uWide = gl.getUniformLocation(prog, 'uWide');

  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let visible = true;
  let raf = 0;
  const start = performance.now() - 20_000; // start mid-flow, not at a blank frame

  const resize = () => {
    // The scene is soft by nature; render below device resolution on phones.
    const small = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, small ? 0.75 : 1.25);
    const w = Math.max(1, Math.floor(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.floor(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    gl.uniform2f(uRes, w, h);
    gl.uniform1f(uWide, window.innerWidth >= 1024 ? 1 : 0);
  };

  const draw = (now: number) => {
    pointer.x += (pointer.tx - pointer.x) * 0.04;
    pointer.y += (pointer.ty - pointer.y) * 0.04;
    // Keep the value small so low-precision GPUs stay smooth.
    gl.uniform1f(uTime, ((now - start) / 1000) % 600);
    gl.uniform2f(uPointer, pointer.x, pointer.y);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const loop = (now: number) => {
    draw(now);
    raf = requestAnimationFrame(loop);
  };
  const play = () => {
    if (!raf && visible && !document.hidden && !reduce) raf = requestAnimationFrame(loop);
  };
  const pause = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };

  resize();
  draw(performance.now());
  canvas.dataset.ready = '';

  new ResizeObserver(() => {
    resize();
    if (!raf) draw(performance.now());
  }).observe(canvas);

  if (reduce) return;

  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) play();
    else pause();
  }).observe(canvas);

  document.addEventListener('visibilitychange', () => (document.hidden ? pause() : play()));
  window.addEventListener(
    'pointermove',
    (e) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    pause();
  });

  play();
}
