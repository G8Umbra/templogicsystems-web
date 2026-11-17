// TempLogic hero network.
// Decorative, illustrative animation: it does not display live data or telemetry.
// Respects prefers-reduced-motion (one still frame), the page pause button,
// tab visibility and viewport visibility.
const stage = document.querySelector('.network-stage');
const canvas = stage && stage.querySelector('.network-canvas');
if (stage && canvas && canvas.getContext) start(stage, canvas);

function seeded(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, 'rgba(247,245,250,1)');
  r.addColorStop(0.18, 'rgba(217,202,255,.75)');
  r.addColorStop(0.45, 'rgba(188,166,255,.22)');
  r.addColorStop(1, 'rgba(188,166,255,0)');
  g.fillStyle = r;
  g.fillRect(0, 0, 64, 64);
  return c;
}

function start(stage, canvas) {
  const hero = stage.closest('.field-hero') || stage;
  const ctx = canvas.getContext('2d');
  const pills = Array.from(stage.querySelectorAll('.network-nodes li'));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const LILAC = '188,166,255';
  const SOFT = '217,202,255';
  const WHITE = '247,245,250';
  // Hub order follows the list in the page:
  // 0 air conditioning, 1 refrigeration, 2 chillers, 3 boilers, 4 diagnostics, 5 cybersecurity
  const WIDE = [[0.16, 0.58], [0.20, 0.20], [0.58, 0.13], [0.80, 0.36], [0.50, 0.68], [0.74, 0.82]];
  const TALL = [[0.92, 0.60], [0.08, 0.09], [0.92, 0.26], [0.08, 0.43], [0.08, 0.77], [0.92, 0.93]];
  const LINKS = [[1, 2], [2, 3], [1, 0], [0, 4], [4, 5], [3, 5], [2, 4], [1, 4], [3, 4]];
  const glow = makeGlow();
  let W = 0, H = 0, dpr = 1, narrow = false;
  let nodes = [], edges = [], pulses = [], dust = [], streams = [];
  let time = 11.3, last = 0, raf = 0, visible = true;

  function build() {
    const rnd = seeded(20261117);
    narrow = W < 600;
    const layout = narrow ? TALL : WIDE;
    nodes = layout.map(([fx, fy], i) => ({ x: fx * W, y: fy * H, px: fx * W, py: fy * H, hub: true, i }));
    const area = W * H;
    const count = Math.round(Math.min(120, Math.max(26, area / (narrow ? 5200 : 6800))));
    const minD = Math.sqrt(area / count) * 0.62;
    let tries = 0;
    while (nodes.length < 6 + count && tries < count * 40) {
      tries++;
      const x = W * (0.03 + 0.94 * rnd());
      const y = H * (0.04 + 0.92 * rnd());
      let ok = true;
      for (const n of nodes) {
        if (Math.hypot(n.x - x, n.y - y) < (n.hub ? minD * 1.5 : minD)) { ok = false; break; }
      }
      if (!ok) continue;
      nodes.push({
        x, y, px: x, py: y, hub: false, r: 1.2 + rnd() * 1.5,
        ax: 2 + rnd() * 5, ay: 2 + rnd() * 5, sp: 0.25 + rnd() * 0.5, ph: rnd() * 6.283,
        glow: rnd() < 0.22
      });
    }
    edges = [];
    const seen = new Set();
    const add = (a, b, kind) => {
      if (a === b) return;
      const key = a < b ? a + '-' + b : b + '-' + a;
      if (seen.has(key)) return;
      seen.add(key);
      const A = nodes[a], B = nodes[b];
      edges.push({ a, b, kind, len: Math.hypot(B.x - A.x, B.y - A.y), c: (rnd() - 0.5) * 0.28, cx: 0, cy: 0 });
    };
    LINKS.forEach(([a, b]) => add(a, b, 'hub'));
    const reach = Math.max(W, H) * 0.22;
    for (let i = 6; i < nodes.length; i++) {
      const near = [];
      for (let j = 0; j < nodes.length; j++) {
        if (j !== i) near.push([j, Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y)]);
      }
      near.sort((p, q) => p[1] - q[1]);
      const want = 2 + (rnd() < 0.35 ? 1 : 0);
      let k = 0;
      for (const [j, dist] of near) {
        if (dist > reach && k > 0) break;
        add(i, j, nodes[j].hub ? 'spoke' : 'mesh');
        if (++k >= want) break;
      }
    }
    pulses = [];
    edges.forEach((e, i) => {
      const n = e.kind === 'hub' ? 2 : (rnd() < 0.45 ? 1 : 0);
      for (let k = 0; k < n; k++) {
        pulses.push({
          e: i, t: rnd(), d: rnd() < 0.5 ? 1 : -1,
          sp: (50 + rnd() * 70) / Math.max(60, e.len),
          s: e.kind === 'hub' ? 1 : 0.75
        });
      }
    });
    dust = [];
    const dustCount = narrow ? 28 : 64;
    for (let i = 0; i < dustCount; i++) {
      dust.push({
        x: rnd() * W, y: rnd() * H, vx: (rnd() - 0.5) * 9, vy: (rnd() - 0.5) * 9,
        r: 0.5 + rnd() * 0.9, a: 0.12 + rnd() * 0.35, s: 0.5 + rnd() * 1.2, p: rnd() * 6.283
      });
    }
    streams = [
      { y: 0.84, amp: 0.09, f: 1.6, ph: 0.0, n: narrow ? 46 : 110, sp: 1.0 },
      { y: 0.30, amp: 0.08, f: 2.1, ph: 2.0, n: narrow ? 30 : 80, sp: 0.8 }
    ];
  }

  function strokeEdges(kind, width, alpha) {
    ctx.lineWidth = width;
    ctx.strokeStyle = `rgba(${LILAC},${alpha})`;
    ctx.beginPath();
    for (const e of edges) {
      if (e.kind !== kind) continue;
      const A = nodes[e.a], B = nodes[e.b];
      ctx.moveTo(A.px, A.py);
      ctx.quadraticCurveTo(e.cx, e.cy, B.px, B.py);
    }
    ctx.stroke();
  }

  function at(A, e, B, t) {
    const u = 1 - t;
    return [u * u * A.px + 2 * u * t * e.cx + t * t * B.px, u * u * A.py + 2 * u * t * e.cy + t * t * B.py];
  }

  function draw() {
    if (!W || !H) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    for (const n of nodes) {
      if (n.hub) { n.px = n.x; n.py = n.y; }
      else {
        n.px = n.x + Math.cos(time * n.sp + n.ph) * n.ax;
        n.py = n.y + Math.sin(time * n.sp * 0.83 + n.ph) * n.ay;
      }
    }
    for (const e of edges) {
      const A = nodes[e.a], B = nodes[e.b];
      e.cx = (A.px + B.px) / 2 - (B.py - A.py) * e.c;
      e.cy = (A.py + B.py) / 2 + (B.px - A.px) * e.c;
    }
    ctx.globalCompositeOperation = 'source-over';
    for (const d of dust) {
      ctx.fillStyle = `rgba(${SOFT},${d.a * (0.55 + 0.45 * Math.sin(time * d.s + d.p))})`;
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, 6.283);
      ctx.fill();
    }
    strokeEdges('mesh', 0.8, 0.16);
    strokeEdges('spoke', 1, 0.26);
    strokeEdges('hub', 3.5, 0.07);
    strokeEdges('hub', 1.4, 0.42);

    ctx.globalCompositeOperation = 'lighter';
    for (const s of streams) {
      for (let i = 0; i < s.n; i++) {
        const u = ((i / s.n) + time * s.sp * 0.05) % 1;
        const x = u * W;
        const y = H * (s.y + s.amp * Math.sin(u * 6.283 * s.f + s.ph + time * 0.35) * (0.6 + 0.4 * Math.sin(u * 3.1)));
        const env = Math.pow(Math.sin(Math.PI * u), 1.3);
        const r = 0.5 + 1.5 * env * (0.6 + 0.4 * Math.sin(i * 1.7));
        ctx.globalAlpha = 0.12 + 0.6 * env;
        ctx.drawImage(glow, x - r * 2.2, y - r * 2.2, r * 4.4, r * 4.4);
      }
    }
    ctx.globalAlpha = 1;
    for (let i = 6; i < nodes.length; i++) {
      const n = nodes[i];
      const tw = 0.55 + 0.4 * Math.sin(time * 1.1 + n.ph);
      ctx.fillStyle = `rgba(${SOFT},${tw})`;
      ctx.beginPath();
      ctx.arc(n.px, n.py, n.r, 0, 6.283);
      ctx.fill();
      if (n.glow) {
        const s = 10 + n.r * 5;
        ctx.globalAlpha = 0.3 + 0.35 * tw;
        ctx.drawImage(glow, n.px - s / 2, n.py - s / 2, s, s);
        ctx.globalAlpha = 1;
      }
    }
    for (const p of pulses) {
      const e = edges[p.e];
      const A = nodes[e.a], B = nodes[e.b];
      const fade = Math.pow(Math.sin(Math.PI * p.t), 0.5);
      for (let k = 5; k >= 1; k--) {
        const t0 = p.t - p.d * k * 0.012;
        const t1 = p.t - p.d * (k - 1) * 0.012;
        if (t0 < 0 || t0 > 1 || t1 < 0 || t1 > 1) continue;
        const a = at(A, e, B, t0), b = at(A, e, B, t1);
        ctx.strokeStyle = `rgba(${SOFT},${0.5 * (1 - k / 6) * p.s * fade})`;
        ctx.lineWidth = 1.8 * p.s;
        ctx.beginPath();
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        ctx.stroke();
      }
      const h = at(A, e, B, p.t);
      const size = p.s > 0.9 ? 22 : 15;
      ctx.globalAlpha = 0.95 * fade;
      ctx.drawImage(glow, h[0] - size / 2, h[1] - size / 2, size, size);
    }
    ctx.globalAlpha = 1;
    for (let i = 0; i < 6; i++) {
      const n = nodes[i];
      const b = 0.5 + 0.5 * Math.sin(time * 1.3 + i * 1.1);
      ctx.globalAlpha = 0.7 + 0.3 * b;
      ctx.drawImage(glow, n.px - 34, n.py - 34, 68, 68);
      ctx.globalAlpha = 1;
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = `rgba(${SOFT},${0.5 + 0.3 * b})`;
      ctx.beginPath();
      ctx.arc(n.px, n.py, 8 + 2.2 * b, 0, 6.283);
      ctx.stroke();
      ctx.fillStyle = `rgba(${WHITE},1)`;
      ctx.beginPath();
      ctx.arc(n.px, n.py, 3.6, 0, 6.283);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  function update(dt) {
    time += dt;
    for (const p of pulses) {
      p.t += p.d * p.sp * dt;
      if (p.t > 1) p.t -= 1; else if (p.t < 0) p.t += 1;
    }
    for (const d of dust) {
      d.x += d.vx * dt; d.y += d.vy * dt;
      if (d.x < 0) d.x += W; else if (d.x > W) d.x -= W;
      if (d.y < 0) d.y += H; else if (d.y > H) d.y -= H;
    }
  }

  function place() {
    pills.forEach((li, i) => {
      const n = nodes[i];
      if (!n) return;
      const w = li.offsetWidth, h = li.offsetHeight;
      let x = n.x + 12;
      if (x + w > W - 6) x = n.x - 12 - w;
      x = Math.max(6, Math.min(x, W - w - 6));
      let y = n.y - h * 0.62;
      y = Math.max(6, Math.min(y, H - h - 6));
      li.style.transform = `translate(${Math.round(x)}px,${Math.round(y)}px)`;
      li.classList.add('placed');
    });
  }

  const paused = () => hero.classList.contains('network-paused');
  const shouldRun = () => !reduce.matches && !paused() && !document.hidden && visible && W > 0;

  function frame(now) {
    raf = 0;
    if (!shouldRun()) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0);
    last = now;
    update(dt);
    draw();
    raf = requestAnimationFrame(frame);
  }

  function sync() {
    if (shouldRun()) {
      if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); }
    } else {
      if (raf) { cancelAnimationFrame(raf); raf = 0; }
      draw();
    }
  }

  function size() {
    const r = stage.getBoundingClientRect();
    const w = Math.round(r.width), h = Math.round(r.height);
    if (w < 2 || h < 2) return;
    if (w === W && h === H && canvas.width) return;
    W = w; H = h;
    dpr = Math.min(window.devicePixelRatio || 1, W * H > 1100000 ? 1.5 : 2);
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    build();
    place();
    sync();
  }

  new ResizeObserver(size).observe(stage);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[entries.length - 1].isIntersecting; sync(); }).observe(stage);
  }
  new MutationObserver(sync).observe(hero, { attributes: true, attributeFilter: ['class'] });
  reduce.addEventListener('change', sync);
  document.addEventListener('visibilitychange', sync);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { place(); });
  size();
}
