// Friemelbord (1–3 jaar). A wooden board full of things to press, flip, turn,
// slide, flick and open. Nothing to finish; everything reacts.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const U = KH.util;
  const W = 780, H = 400;   // landscape
  const WOOD = '#D9A86C', WOOD_DARK = '#B07E44', WOOD_LIGHT = '#F2D9B0', INK = '#3C4A3E';

  function mount(stage, ctx) {
    const audio = ctx.audio;
    const reduced = ctx.reducedMotion;
    const el = U.el;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' }, stage);
    const defs = el('defs', {}, svg);
    const f = el('filter', { id: 'bshadow', x: '-20%', y: '-20%', width: '140%', height: '160%' }, defs);
    el('feDropShadow', { dx: 0, dy: 3, stdDeviation: 2.5, 'flood-color': INK, 'flood-opacity': 0.25 }, f);

    // Board
    el('rect', { x: 20, y: 20, width: 740, height: 360, rx: 30, fill: WOOD, filter: 'url(#bshadow)' }, svg);
    for (let i = 0; i < 7; i++) {
      el('path', {
        d: `M 36 ${48 + i * 48} C 260 ${42 + i * 48}, 520 ${56 + i * 48}, 744 ${46 + i * 48}`,
        fill: 'none', stroke: '#C48C50', 'stroke-opacity': 0.3, 'stroke-width': 2
      }, svg);
    }
    // screws in the corners
    [[40, 40], [740, 40], [40, 360], [740, 360]].forEach(([x, y]) => {
      el('circle', { cx: x, cy: y, r: 6, fill: '#9C9A94' }, svg);
      el('path', { d: `M ${x - 4} ${y} H ${x + 4} M ${x} ${y - 4} V ${y + 4}`, stroke: '#6B6A66', 'stroke-width': 1.5 }, svg);
    });

    // Same watercolour grain as the animals, laid over the wooden board.
    const kit = U.paintKit(svg);
    if (kit.grain) el('rect', { x: 20, y: 20, width: 740, height: 360, rx: 30, fill: kit.grain, opacity: 0.45, class: 'grain', 'pointer-events': 'none' }, svg);

    // A tiny face: 'sleep' (closed lines), 'open' (dots) or 'happy' (^ ^).
    // Drawn into `parent` around (cx, cy); s scales it.
    function face(parent, cx, cy, s, mode) {
      const g = el('g', { 'pointer-events': 'none' }, parent);
      const ex = 8 * s, ey = cy - 3 * s, r = 2.6 * s, w = Math.max(1.6, 2 * s);
      const open = el('g', {}, g);
      [-ex, ex].forEach((x) => el('circle', { cx: cx + x, cy: ey, r, fill: INK }, open));
      const sleep = el('path', { d: `M ${cx - ex - r} ${ey} q ${r} ${r * 1.2} ${2 * r} 0 M ${cx + ex - r} ${ey} q ${r} ${r * 1.2} ${2 * r} 0`, fill: 'none', stroke: INK, 'stroke-width': w, 'stroke-linecap': 'round' }, g);
      const happy = el('path', { d: `M ${cx - ex - r} ${ey + r * 0.4} q ${r} ${-r * 2.2} ${2 * r} 0 M ${cx + ex - r} ${ey + r * 0.4} q ${r} ${-r * 2.2} ${2 * r} 0`, fill: 'none', stroke: INK, 'stroke-width': w, 'stroke-linecap': 'round' }, g);
      el('path', { d: `M ${cx - 4 * s} ${cy + 4 * s} Q ${cx} ${cy + 8 * s} ${cx + 4 * s} ${cy + 4 * s}`, fill: 'none', stroke: INK, 'stroke-width': w, 'stroke-linecap': 'round' }, g);
      [-1, 1].forEach((k) => el('ellipse', { cx: cx + k * 13 * s, cy: cy + 3 * s, rx: 3.2 * s, ry: 2 * s, fill: '#F0A5A0', 'fill-opacity': 0.7 }, g));
      function set(m) {
        open.setAttribute('display', m === 'open' ? 'inline' : 'none');
        sleep.setAttribute('display', m === 'sleep' ? 'inline' : 'none');
        happy.setAttribute('display', m === 'happy' ? 'inline' : 'none');
      }
      set(mode || 'open');
      return { g, set };
    }

    const loops = [];      // per-frame updaters
    const cancels = [];    // tween cancels
    const timers = [];     // cleanup callbacks for timeouts
    let raf = 0;

    function plate(x, y, w, h, r) {
      return el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: r || 14, fill: WOOD_LIGHT, 'fill-opacity': 0.55 }, svg);
    }

    // ---- Toggle switches with lamps ----
    function toggle(x, y, lampColor) {
      plate(x, y, 70, 120, 18);
      const lamp = el('circle', { cx: x, cy: y - 36, r: 13, fill: '#CFC9BE', stroke: '#9C9A94', 'stroke-width': 3 }, svg);
      el('rect', { x: x - 20, y: y - 2, width: 40, height: 44, rx: 10, fill: '#F7F3EA', stroke: '#9C9A94', 'stroke-width': 3 }, svg);
      const lever = el('g', {}, svg);
      el('rect', { x: -7, y: -40, width: 14, height: 44, rx: 7, fill: '#5B6B5E' }, lever);
      el('circle', { cx: 0, cy: -40, r: 11, fill: '#3C4A3E' }, lever);
      const lampFace = face(svg, x, y - 35, 0.62, 'sleep');
      const hit = el('rect', { x: x - 35, y: y - 60, width: 70, height: 120, fill: 'transparent' }, svg);
      let on = false, angle = 28;
      const cy = y + 20;
      function draw(a) { lever.setAttribute('transform', `translate(${x} ${cy}) rotate(${a})`); }
      draw(angle);
      hit.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        on = !on;
        audio.click();
        lamp.setAttribute('fill', on ? lampColor : '#CFC9BE');
        lamp.setAttribute('stroke', on ? lampColor : '#9C9A94');
        lampFace.set(on ? 'happy' : 'sleep');
        const from = angle, to = on ? -28 : 28;
        if (reduced) { angle = to; draw(angle); return; }
        cancels.push(U.tween(180, U.ease.back, (k) => { angle = from + (to - from) * k; draw(angle); }));
      });
    }
    toggle(90, 112, '#E8B83A');
    toggle(170, 112, '#6FA36B');

    // ---- Big push button with three chasing lights ----
    (function bigButton(x, y) {
      plate(x, y, 130, 120, 18);
      const lights = [-34, 0, 34].map((dx) => el('circle', { cx: x + dx, cy: y - 40, r: 8, fill: '#CFC9BE' }, svg));
      el('circle', { cx: x, cy: y + 14, r: 42, fill: '#A84A40' }, svg);
      const cap = el('circle', { cx: x, cy: y + 8, r: 40, fill: '#D9574C' }, svg);
      const shine = el('ellipse', { cx: x - 14, cy: y - 14, rx: 10, ry: 6, fill: '#fff', 'fill-opacity': 0.35, 'pointer-events': 'none' }, svg);
      const capFace = face(svg, x, y + 10, 1.1, 'open');
      let busy = false, faceTimer = 0;
      timers.push(() => clearTimeout(faceTimer));
      function pressed(down) {
        const dy = down ? 5 : 0;
        cap.setAttribute('cy', y + 8 + dy);
        capFace.g.setAttribute('transform', `translate(0 ${dy})`);
        shine.setAttribute('cy', y - 14 + dy);
      }
      cap.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        pressed(true);
        capFace.set('happy');
        clearTimeout(faceTimer);
        faceTimer = setTimeout(() => capFace.set('open'), 700);
        audio.boop();
        if (busy) return;
        busy = true;
        const colors = ['#D9574C', '#E8B83A', '#4A7BC9'];
        lights.forEach((l, i) => setTimeout(() => {
          l.setAttribute('fill', colors[i]);
          setTimeout(() => l.setAttribute('fill', '#CFC9BE'), 350);
        }, i * 140));
        setTimeout(() => { busy = false; }, 800);
      });
      const up = () => pressed(false);
      cap.addEventListener('pointerup', up);
      cap.addEventListener('pointercancel', up);
      cap.addEventListener('pointerleave', up);
    })(310, 112);

    // ---- Rotary knob ----
    (function knob(x, y) {
      plate(x, y, 130, 130, 24);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        el('circle', { cx: x + Math.cos(a) * 56, cy: y + Math.sin(a) * 56, r: 3, fill: WOOD_DARK }, svg);
      }
      const g = el('g', {}, svg);
      el('circle', { r: 42, fill: '#4A7BC9', stroke: '#3B63A3', 'stroke-width': 4 }, g);
      el('rect', { x: -5, y: -40, width: 10, height: 16, rx: 5, fill: '#F7F3EA' }, g);
      face(g, 0, 4, 1.05, 'open');
      let angle = 0, last = null, acc = 0;
      function draw() { g.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`); }
      draw();
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        g.setPointerCapture(e.pointerId);
        const p = U.svgPoint(svg, e);
        last = Math.atan2(p.y - y, p.x - x);
      });
      g.addEventListener('pointermove', (e) => {
        if (last === null) return;
        const p = U.svgPoint(svg, e);
        const a = Math.atan2(p.y - y, p.x - x);
        let d = a - last;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        last = a;
        angle += d * 180 / Math.PI;
        acc += Math.abs(d);
        if (acc > 0.26) { acc = 0; audio.tick(); } // a tick every 15°
        draw();
      });
      const end = () => { last = null; };
      g.addEventListener('pointerup', end);
      g.addEventListener('pointercancel', end);
    })(470, 112);

    // ---- Slider ----
    (function slider(x0, x1, y) {
      plate((x0 + x1) / 2, y, 170, 70, 18);
      el('rect', { x: x0, y: y - 6, width: x1 - x0, height: 12, rx: 6, fill: WOOD_DARK }, svg);
      for (let i = 0; i <= 6; i++) el('rect', { x: x0 + (x1 - x0) * i / 6 - 1.5, y: y - 18, width: 3, height: 8, fill: WOOD_DARK }, svg);
      const h = el('rect', { x: x0 - 16, y: y - 24, width: 32, height: 48, rx: 10, fill: '#6FA36B', stroke: '#558350', 'stroke-width': 3 }, svg);
      const hFace = face(svg, 0, y - 2, 0.62, 'open');
      let pos = 0, drag = null, notch = 0;
      function draw() {
        const hx = x0 + (x1 - x0) * pos;
        h.setAttribute('x', hx - 16);
        hFace.g.setAttribute('transform', `translate(${hx.toFixed(1)} 0)`);
      }
      h.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        h.setPointerCapture(e.pointerId);
        drag = U.svgPoint(svg, e).x - (x0 + (x1 - x0) * pos);
        hFace.set('happy');
      });
      h.addEventListener('pointermove', (e) => {
        if (drag === null) return;
        const px = U.svgPoint(svg, e).x - drag;
        pos = U.clamp((px - x0) / (x1 - x0), 0, 1);
        const n = Math.round(pos * 6);
        if (n !== notch) { notch = n; audio.tone(260 + n * 70, 0.12, 'triangle', 0.07); }
        draw();
      });
      const end = () => { drag = null; hFace.set('open'); };
      h.addEventListener('pointerup', end);
      h.addEventListener('pointercancel', end);
      draw();
    })(110, 250, 290);

    // ---- Bell ----
    (function bell(x, y) {
      plate(x, y, 130, 140, 24);
      const g = el('g', {}, svg);
      el('rect', { x: -4, y: -62, width: 8, height: 14, rx: 3, fill: '#9C9A94' }, g);
      el('path', { d: 'M -36 22 C -36 -20, -22 -48, 0 -48 C 22 -48, 36 -20, 36 22 Z', fill: '#E8B83A', stroke: '#C9961E', 'stroke-width': 3 }, g);
      el('rect', { x: -42, y: 20, width: 84, height: 12, rx: 6, fill: '#C9961E' }, g);
      el('circle', { cx: 0, cy: 34, r: 8, fill: '#8E6232' }, g);
      const bellFace = face(g, 0, -6, 1.1, 'sleep');
      let a = 0, wakeTimer = 0;
      timers.push(() => clearTimeout(wakeTimer));
      function draw() { g.setAttribute('transform', `translate(${x} ${y}) rotate(${a} 0 -62)`); }
      draw();
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.ding();
        bellFace.set('happy');
        clearTimeout(wakeTimer);
        wakeTimer = setTimeout(() => bellFace.set('sleep'), 1400);
        if (reduced) return;
        cancels.push(U.tween(900, U.ease.linear, (k) => { a = Math.sin(k * Math.PI * 5) * 16 * (1 - k); draw(); }));
      });
    })(650, 112);

    // ---- Little door with a sun behind it ----
    (function door(x, y) {
      const w = 120, h = 120;
      el('rect', { x: x - w / 2 - 8, y: y - h / 2 - 8, width: w + 16, height: h + 16, rx: 18, fill: WOOD_DARK }, svg);
      el('rect', { x: x - w / 2, y: y - h / 2, width: w, height: h, rx: 12, fill: '#9FD0E8' }, svg);
      const sun = el('g', { transform: `translate(${x} ${y})` }, svg);
      for (let i = 0; i < 8; i++) {
        el('rect', { x: -4, y: -44, width: 8, height: 16, rx: 4, fill: '#E8B83A', transform: `rotate(${i * 45})` }, sun);
      }
      el('circle', { r: 26, fill: '#E8B83A' }, sun);
      el('circle', { cx: -9, cy: -5, r: 3, fill: INK }, sun);
      el('circle', { cx: 9, cy: -5, r: 3, fill: INK }, sun);
      el('path', { d: 'M -10 8 Q 0 18 10 8', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }, sun);
      const leaf = el('g', {}, svg);
      el('rect', { x: 0, y: -h / 2, width: w, height: h, rx: 12, fill: '#6FA36B', stroke: '#558350', 'stroke-width': 3 }, leaf);
      el('circle', { cx: w - 18, cy: 0, r: 6, fill: '#F7F3EA' }, leaf);
      const hinge = x - w / 2;
      let a = 0, closeTimer = 0;
      // Seen head-on, a door swinging open just gets narrower.
      function draw() { leaf.setAttribute('transform', `translate(${hinge} ${y}) scale(${Math.max(0.03, Math.cos(a * Math.PI / 180))} 1)`); }
      draw();
      function swing(to) {
        const from = a;
        if (reduced) { a = to; draw(); return; }
        cancels.push(U.tween(380, U.ease.inOut, (k) => { a = from + (to - from) * k; draw(); }));
      }
      leaf.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.creak();
        swing(88);
        clearTimeout(closeTimer);
        closeTimer = setTimeout(() => { audio.creak(); swing(0); }, 4500); // closes by itself
      });
      timers.push(() => clearTimeout(closeTimer));
      sun.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        audio.bell(1046.5, 0.6, 0.1);
        cancels.push(U.tween(500, U.ease.linear, (k) => sun.setAttribute('transform', `translate(${x} ${y}) rotate(${k * 45})`)));
      });
    })(395, 290);

    // ---- Spinner wheel: flick it ----
    (function spinner(x, y) {
      plate(x, y, 160, 112, 28);
      const g = el('g', {}, svg);
      const cols = ['#D9574C', '#E8B83A', '#4A7BC9', '#6FA36B', '#D9574C', '#E8B83A', '#4A7BC9', '#6FA36B'];
      const r = 50;
      cols.forEach((c, i) => {
        const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
        el('path', {
          d: `M 0 0 L ${Math.cos(a0) * r} ${Math.sin(a0) * r} A ${r} ${r} 0 0 1 ${Math.cos(a1) * r} ${Math.sin(a1) * r} Z`,
          fill: c, stroke: WOOD_LIGHT, 'stroke-width': 2
        }, g);
      });
      el('circle', { r: 12, fill: '#F7F3EA', stroke: '#9C9A94', 'stroke-width': 3 }, g);
      el('path', { d: `M ${x + r + 18} ${y} l 14 -9 v 18 z`, fill: INK }, svg);
      let angle = 0, vel = 0, last = null, lastT = 0, seg = 0;
      function draw() { g.setAttribute('transform', `translate(${x} ${y}) rotate(${angle})`); }
      draw();
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        g.setPointerCapture(e.pointerId);
        const p = U.svgPoint(svg, e);
        last = Math.atan2(p.y - y, p.x - x); lastT = performance.now(); vel = 0;
      });
      g.addEventListener('pointermove', (e) => {
        if (last === null) return;
        const p = U.svgPoint(svg, e);
        const a = Math.atan2(p.y - y, p.x - x);
        let d = a - last;
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        const now = performance.now();
        const dt = Math.max(1, now - lastT);
        vel = (d * 180 / Math.PI) / dt * 16; // degrees per frame
        last = a; lastT = now;
        angle += d * 180 / Math.PI;
        draw();
      });
      const end = () => { last = null; };
      g.addEventListener('pointerup', end);
      g.addEventListener('pointercancel', end);
      loops.push(() => {
        if (last !== null || Math.abs(vel) < 0.05) return;
        angle += vel;
        vel *= 0.985;
        const s = Math.floor(((angle % 360) + 360) % 360 / 45);
        if (s !== seg) { seg = s; audio.tick(); }
        draw();
      });
    })(590, 290);

    function frame() {
      loops.forEach((fn) => fn());
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        cancelAnimationFrame(raf);
        cancels.forEach((c) => c());
        timers.forEach((c) => c());
        svg.remove();
      }
    };
  }

  KH.games.push({
    id: 'busy',
    name: 'Friemelbord',
    minAge: 1,
    maxAge: 3,
    icon: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="8" y="10" width="84" height="80" rx="12" fill="#D9A86C"/>
      <circle cx="30" cy="34" r="13" fill="#D9574C"/>
      <path d="M26 39 Q30 42 34 39" fill="none" stroke="#3C4A3E" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="25.5" cy="33" r="1.8" fill="#3C4A3E"/><circle cx="34.5" cy="33" r="1.8" fill="#3C4A3E"/>
      <rect x="54" y="22" width="30" height="10" rx="5" fill="#B07E44"/>
      <circle cx="78" cy="27" r="8" fill="#6FA36B"/>
      <rect x="22" y="58" width="14" height="24" rx="7" fill="#F7F3EA"/>
      <circle cx="29" cy="64" r="6" fill="#3C4A3E"/>
      <circle cx="68" cy="68" r="15" fill="#4A7BC9"/>
      <rect x="66" y="55" width="4" height="7" rx="2" fill="#F7F3EA"/>
      <path d="M64 73 Q68 76 72 73" fill="none" stroke="#3C4A3E" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="63.5" cy="68" r="1.8" fill="#3C4A3E"/><circle cx="72.5" cy="68" r="1.8" fill="#3C4A3E"/>
    </svg>`,
    mount
  });
})();
