// Small helpers shared by the toys.
window.KH = window.KH || {};
KH.games = KH.games || [];

KH.util = (function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVG_NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function div(cls, parent) {
    const d = document.createElement('div');
    if (cls) d.className = cls;
    if (parent) parent.appendChild(d);
    return d;
  }

  const ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    linear: (t) => t,
    // overshoot a little, like something settling into place
    back: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  };

  function tween(ms, fn, step, done) {
    const start = performance.now();
    let cancelled = false;
    function frame(now) {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / ms);
      step(fn(t), t);
      if (t < 1) requestAnimationFrame(frame); else if (done) done();
    }
    requestAnimationFrame(frame);
    return () => { cancelled = true; };
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  // Pointer position in SVG user units.
  function svgPoint(svg, evt) {
    const pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    const m = svg.getScreenCTM();
    return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
  }

  // A canvas that fills its container at device resolution and tells you when it resized.
  function fitCanvas(canvas, onResize) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    function resize() {
      const r = canvas.parentElement.getBoundingClientRect();
      const w = Math.max(1, Math.floor(r.width)), h = Math.max(1, Math.floor(r.height));
      if (canvas.width === w * dpr && canvas.height === h * dpr) return;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      const ctx = canvas.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (onResize) onResize(w, h);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);
    return { stop: () => ro.disconnect(), dpr };
  }

  // Timers that a toy can cancel in one go when it unmounts.
  function timerBag() {
    const ids = [];
    return {
      later(fn, ms) { ids.push(setTimeout(fn, ms)); },
      clear() { ids.forEach(clearTimeout); ids.length = 0; }
    };
  }

  // ---- Watercolour look ----
  // Shapes get a soft radial fill (lighter in the middle, a touch darker at the
  // edge) and an optional grain overlay: a tileable speckle texture made once
  // with canvas, so there are still no image files. The overlay sits on top of
  // each shape in its own coordinates, so it moves along with the shape and
  // needs no SVG filter (filters on animated parts are slow on phones).
  // The parent setting adds .no-grain to <html> to hide all overlays.
  function mixHex(hex, to, amt) {
    const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
    const ch = (v, s) => (v >> s) & 255;
    const m = (s) => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * amt);
    return '#' + ((1 << 24) + (m(16) << 16) + (m(8) << 8) + m(0)).toString(16).slice(1);
  }

  let grainURL;   // undefined = not tried yet, null = no canvas available
  function grainTexture() {
    if (grainURL !== undefined) return grainURL;
    grainURL = null;
    const N = 192;
    const cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const g = cv.getContext && cv.getContext('2d');
    if (!g || !g.createImageData) return grainURL;
    // Tileable value noise: random grid, smoothly interpolated, wrapping at the edge.
    function layer(cells) {
      const grid = [];
      for (let i = 0; i < cells * cells; i++) grid.push(Math.random() * 2 - 1);
      const at = (x, y) => grid[((y % cells) + cells) % cells * cells + ((x % cells) + cells) % cells];
      const s = (t) => t * t * (3 - 2 * t);
      return (px, py) => {
        const fx = px / N * cells, fy = py / N * cells;
        const x0 = Math.floor(fx), y0 = Math.floor(fy), tx = s(fx - x0), ty = s(fy - y0);
        const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx;
        const bot = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx;
        return top + (bot - top) * ty;
      };
    }
    const blotch = layer(6), mottle = layer(14), fine = layer(48);
    const img = g.createImageData(N, N);
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const n = blotch(x, y) * 0.35 + mottle(x, y) * 0.3 + fine(x, y) * 0.3 + (Math.random() * 2 - 1) * 0.35;
      const i = (y * N + x) * 4;
      if (n > 0) { img.data[i] = 255; img.data[i + 1] = 250; img.data[i + 2] = 240; img.data[i + 3] = Math.min(255, n * 85); }
      else       { img.data[i] = 70;  img.data[i + 1] = 45;  img.data[i + 2] = 25;  img.data[i + 3] = Math.min(255, -n * 50); }
    }
    g.putImageData(img, 0, 0);
    try { grainURL = cv.toDataURL('image/png'); } catch (e) { grainURL = null; }
    return grainURL;
  }

  // Hand-drawn outline: a superellipse (n=2 ellipse, n=3..4 soft square) centred
  // on (cx, cy), w x h, optionally narrower at the top (taper < 1), with a small
  // uneven wobble so the edge looks drawn by hand. Returns SVG path data.
  // The wobble is fixed per shape (seeded), so nothing changes between frames.
  function blob(cx, cy, w, h, o) {
    o = o || {};
    const n = o.n || 2, taper = o.taper === undefined ? 1 : o.taper;
    const amp = o.wobble === undefined ? Math.min(w, h) * 0.025 : o.wobble;
    let seed = o.seed === undefined ? (cx * 13.1 + cy * 7.7 + w) : o.seed;
    const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
    const p1 = rnd() * 6.28, p2 = rnd() * 6.28, p3 = rnd() * 6.28;
    const N = 36, pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * Math.PI * 2;
      const c = Math.cos(t), s = Math.sin(t);
      let x = Math.sign(c) * Math.pow(Math.abs(c), 2 / n) * w / 2;
      const y = Math.sign(s) * Math.pow(Math.abs(s), 2 / n) * h / 2;
      x *= taper + (1 - taper) * (y / h + 0.5);      // y<0 is the top
      const wob = 1 + (amp / (Math.min(w, h) / 2)) * (Math.sin(3 * t + p1) * 0.5 + Math.sin(5 * t + p2) * 0.3 + Math.sin(8 * t + p3) * 0.2);
      pts.push([cx + x * wob, cy + y * wob]);
    }
    // Closed Catmull-Rom spline through the points, as cubic Beziers.
    let d = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `;
    for (let i = 0; i < N; i++) {
      const p0 = pts[(i - 1 + N) % N], a = pts[i], b = pts[(i + 1) % N], p3b = pts[(i + 2) % N];
      const c1 = [a[0] + (b[0] - p0[0]) / 6, a[1] + (b[1] - p0[1]) / 6];
      const c2 = [b[0] - (p3b[0] - a[0]) / 6, b[1] - (p3b[1] - a[1]) / 6];
      d += `C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)} `;
    }
    return d + 'Z';
  }

  let kitSeq = 0;
  function paintKit(svg) {
    const id = 'wc' + (++kitSeq);
    let defs = svg.querySelector('defs');
    if (!defs) defs = el('defs', {}, svg);
    const grads = {};
    let grainId = null;
    const tex = grainTexture();
    if (tex) {
      grainId = id + '-grain';
      const pat = el('pattern', { id: grainId, patternUnits: 'userSpaceOnUse', width: 96, height: 96 }, defs);
      const im = el('image', { width: 96, height: 96, preserveAspectRatio: 'none' }, pat);
      im.setAttribute('href', tex);
      im.setAttributeNS('http://www.w3.org/1999/xlink', 'xlink:href', tex);
    }
    // Soft fill for a base colour. `edge` darkens the rim (0..1).
    function fill(hex, edge) {
      const key = hex + (edge || '');
      if (grads[key]) return grads[key];
      const gid = id + '-g' + Object.keys(grads).length;
      const rg = el('radialGradient', { id: gid, cx: '0.45', cy: '0.36', r: '0.7' }, defs);
      el('stop', { offset: '0', 'stop-color': mixHex(hex, '#ffffff', 0.3) }, rg);
      el('stop', { offset: '0.55', 'stop-color': hex }, rg);
      el('stop', { offset: '1', 'stop-color': mixHex(hex, '#3C2A1A', edge === undefined ? 0.12 : edge) }, rg);
      return (grads[key] = `url(#${gid})`);
    }
    // A painted shape: soft fill plus grain overlay. Returns the base shape.
    function shape(parent, tag, attrs, hex, edge) {
      const base = el(tag, Object.assign({}, attrs, { fill: fill(hex, edge) }), parent);
      if (grainId) el(tag, Object.assign({}, attrs, { fill: `url(#${grainId})`, class: 'grain', 'pointer-events': 'none' }), parent);
      return base;
    }
    return { fill, shape, mix: mixHex, grain: grainId ? `url(#${grainId})` : null };
  }

  return { el, div, ease, tween, shuffle, rand, pick, clamp, svgPoint, fitCanvas, timerBag, paintKit, mixHex, blob };
})();
