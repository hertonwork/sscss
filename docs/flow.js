// A slow flow field for the hero: domain-warped value noise in the accent color, like ink drifting in water. Inlined
// into index.html by scripts/build.mjs (no request), started after load when the browser is idle, rendered at a
// fraction of the resolution that steps down until the frame rate holds, paused off-screen and when the tab is hidden, a single still frame under
// prefers-reduced-motion. Software renderers (no GPU, PageSpeed's Chrome) and slow first frames bow out, leaving the
// plain hero. Colors come from the tokens, so dark mode follows. #flow in the URL forces it on.
const init = () => {
  const canvas = document.querySelector('canvas.flow');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { antialias: false, alpha: true, premultipliedAlpha: true });
  if (!gl) return;
  const force = location.hash === '#flow', info = gl.getExtension('WEBGL_debug_renderer_info');
  if (!force && /swiftshader|llvmpipe|softpipe|software|mesa offscreen/i.test(info ? gl.getParameter(info.UNMASKED_RENDERER_WEBGL) : '')) return;
  if (!force && navigator.connection && navigator.connection.saveData) return;

  const vert = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  const frag = `precision mediump float;
uniform vec2 r;uniform float t;uniform vec3 ink,ink2;uniform float dark;
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*noise(p);p=mat2(1.6,1.2,-1.2,1.6)*p;a*=.5;}return s;}
void main(){
vec2 uv=(gl_FragCoord.xy-.5*r)/r.y;
vec2 p=uv*1.6+vec2(t*.02,0.);
// two rounds of warping, each drifting at its own pace
vec2 q=vec2(fbm(p+vec2(0.,t*.05)),fbm(p+vec2(5.2,1.3)-t*.04));
vec2 w=vec2(fbm(p+3.*q+vec2(1.7,9.2)+t*.03),fbm(p+3.*q+vec2(8.3,2.8)-t*.02));
float n=fbm(p+2.5*w);
// bands of ink: thin bright veins where the field crosses its own values
float v=smoothstep(.35,.75,n)*(.55+.45*sin(n*20.+t*.3));
float veins=pow(1.-abs(fract(n*6.+t*.05)*2.-1.),6.)*(.18+.2*dark);
float a=(v*.7+veins+.16*q.x);
// stronger to the right and the bottom, where there is no headline
float side=smoothstep(-.9,.6,uv.x*.9+.25)*smoothstep(.75,-.2,uv.y);
a*=side;
vec3 col=mix(ink,ink2,w.y);
gl_FragColor=vec4(col*a,a);}`;

  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram();
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, vert)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, frag)); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n) => gl.getUniformLocation(prog, n);
  const uR = u('r'), uT = u('t');

  const rgb = (s) => { const m = s.trim().match(/^#([0-9a-f]{3,6})$/i); if (!m) return [0, 0, 0]; const x = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1]; return [0, 2, 4].map((i) => parseInt(x.slice(i, i + 2), 16) / 255); };
  const theme = () => {
    const cs = getComputedStyle(document.documentElement), dark = matchMedia('(prefers-color-scheme: dark)').matches;
    const acc = rgb(cs.getPropertyValue('--acc')), ink = rgb(cs.getPropertyValue('--ink'));
    gl.uniform3fv(u('ink'), acc);
    gl.uniform3fv(u('ink2'), dark ? acc.map((c, i) => c * .5 + ink[i] * .5) : acc.map((c, i) => c * .6 + ink[i] * .1));
    gl.uniform1f(u('dark'), dark ? 1 : 0);
  };
  theme();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', theme);

  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // resolution: start at half the CSS pixels, then step down while frames take longer than ~17 ms (measured over the
  // first second), so a slow GPU holds a steady frame rate instead of stuttering at full size
  let scale = 0.5, w = 0, hh = 0, visible = true, raf = 0, start = performance.now(), probe = !force, last = 0, slow = 0, n = 0;
  const size = () => {
    const W = Math.max(1, Math.round(canvas.clientWidth * scale)), H = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (W !== w || H !== hh) { w = canvas.width = W; hh = canvas.height = H; gl.viewport(0, 0, w, hh); gl.uniform2f(uR, w, hh); }
  };
  const frame = (now) => {
    raf = 0; size();
    gl.uniform1f(uT, (now - start) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (probe) { probe = false; const t0 = performance.now(); gl.finish(); if (performance.now() - t0 > 40) { canvas.remove(); return; } }
    canvas.classList.add('on');
    if (last && n < 90) { n++; if (now - last > 19) slow++; if (n % 30 === 0) { if (slow > 8 && scale > 0.2) scale *= 0.7; slow = 0; } }
    last = now;
    if (!still && visible && !document.hidden) raf = requestAnimationFrame(frame);
  };
  const go = () => { if (!raf) raf = requestAnimationFrame(frame); };
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) go(); }).observe(canvas);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) go(); });
  addEventListener('resize', go);
  go();
};
addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(init, { timeout: 1500 }) : setTimeout(init, 300)));
