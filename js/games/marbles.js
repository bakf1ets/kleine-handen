// Knikkerbaan (1–6 jaar). A pegboard with a ready-made marble run. Tap
// anywhere on the board and a marble drops from the top at that spot; it
// rolls over the planks, which ring like xylophone keys. Older children can
// build: pull planks, bumpers and bells out of the tray, drag them around,
// tap a plank to tilt it, and drag a piece back to the tray to remove it.
// Physics by Matter.js (never our own). Several fingers at once are fine.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const U = KH.util;
  const W = 780, H = 400;                     // landscape
  const BOARD = { x0: 20, y0: 14, x1: 640, y1: 386 };
  const TRAY = { x0: 652, y0: 14, x1: 766, y1: 386 };
  const GRID = 20;
  const MAX_MARBLES = 24, MAX_PIECES = 16;
  const ANGLES = [-30, -15, 0, 15, 30];       // a tap on a plank steps through these
  const INK = '#3C4A3E';
  // Plank colours and their notes (pentatonic, so every run sounds fine)
  const KEYS = [
    { c: '#D9574C', f: 523.25 }, { c: '#E8B83A', f: 587.33 }, { c: '#6FA36B', f: 659.25 },
    { c: '#4A7BC9', f: 783.99 }, { c: '#8C5BB5', f: 880.0 }
  ];
  const MARBLE_COLORS = ['#D9574C', '#E8B83A', '#6FA36B', '#4A7BC9', '#8C5BB5'];
  const KINDS = {
    long:   { len: 160 },
    short:  { len: 100 },
    bumper: { r: 20 },
    bell:   { r: 17 }
  };

  function mount(stage, ctx) {
    const M = window.Matter;
    const audio = ctx.audio;
    const el = U.el;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' }, stage);
    const defs = el('defs', {}, svg);
    const kit = U.paintKit(svg);

    // ---- Pegboard and tray ----
    const pat = el('pattern', { id: 'mb-holes', patternUnits: 'userSpaceOnUse', width: 40, height: 40, x: BOARD.x0, y: BOARD.y0 }, defs);
    el('circle', { cx: 20, cy: 20, r: 3.2, fill: '#D9A86C', 'fill-opacity': 0.8 }, pat);
    el('rect', { x: BOARD.x0, y: BOARD.y0, width: BOARD.x1 - BOARD.x0, height: BOARD.y1 - BOARD.y0, rx: 28, fill: '#F2D9B0' }, svg);
    el('rect', { x: BOARD.x0, y: BOARD.y0, width: BOARD.x1 - BOARD.x0, height: BOARD.y1 - BOARD.y0, rx: 28, fill: 'url(#mb-holes)' }, svg);
    if (kit.grain) el('rect', { x: BOARD.x0, y: BOARD.y0, width: BOARD.x1 - BOARD.x0, height: BOARD.y1 - BOARD.y0, rx: 28, fill: kit.grain, opacity: 0.45, class: 'grain', 'pointer-events': 'none' }, svg);
    el('rect', { x: TRAY.x0, y: TRAY.y0, width: TRAY.x1 - TRAY.x0, height: TRAY.y1 - TRAY.y0, rx: 24, fill: '#D9A86C', 'fill-opacity': 0.5 }, svg);
    // the hole at the bottom left where marbles leave the board
    el('ellipse', { cx: 46, cy: 382, rx: 22, ry: 8, fill: '#8E6232' }, svg);

    const pieceLayer = el('g', {}, svg);
    const marbleLayer = el('g', { 'pointer-events': 'none' }, svg);
    const trayLayer = el('g', {}, svg);

    if (!M) {
      el('text', { x: W / 2, y: 200, 'text-anchor': 'middle', fill: '#6F7E70', 'font-size': 16, 'font-family': 'Nunito, sans-serif' }, svg).textContent = 'De knikkerbaan kon de natuurkunde niet laden.';
      return { destroy() { svg.remove(); } };
    }

    // ---- World ----
    const engine = M.Engine.create({ positionIterations: 8, velocityIterations: 6 });
    engine.gravity.y = 0.9;
    const world = engine.world;
    // frictionStatic 0 everywhere: Matter's default (0.5) holds marbles still on gentle slopes
    const wall = { isStatic: true, friction: 0.1, frictionStatic: 0, restitution: 0.2 };
    // left wall, wall between board and tray, and a gutter that runs down to the hole
    M.Composite.add(world, [
      M.Bodies.rectangle(BOARD.x0 - 10, H / 2, 20, H * 2, wall),
      M.Bodies.rectangle(BOARD.x1 + 6, H / 2, 12, H * 2, wall),
      M.Bodies.rectangle(361, 363, 560, 10, Object.assign({ angle: -0.082, friction: 0 }, wall))
    ]);
    el('rect', { x: 81, y: 358, width: 560, height: 10, rx: 5, fill: '#B07E44', transform: 'rotate(-4.7 361 363)' }, svg);

    // ---- Pieces ----
    const pieces = [];              // { kind, body, g, key, angle (deg), x, y }
    const byBody = new Map();       // body.id -> piece
    let keyCounter = 0;

    function drawPiece(p) {
      const g = el('g', { class: 'piece' }, pieceLayer);
      if (p.kind === 'long' || p.kind === 'short') {
        const L = KINDS[p.kind].len, c = KEYS[p.key].c;
        el('rect', { x: -L / 2, y: -7, width: L, height: 14, rx: 7, fill: U.mixHex(c, INK, 0.25) , transform: 'translate(0 3)' }, g);
        el('rect', { x: -L / 2, y: -7, width: L, height: 14, rx: 7, fill: c }, g);
        el('rect', { x: -L / 2 + 8, y: -4.5, width: L - 16, height: 3, rx: 1.5, fill: '#fff', 'fill-opacity': 0.35 }, g);
        [-1, 1].forEach((s) => el('circle', { cx: s * (L / 2 - 9), cy: 1, r: 3.2, fill: '#8E6232' }, g));
        // the stop post at the low end (moved by place(), hidden when flat)
        p.postEl = el('rect', { x: -4, y: -POST.h / 2, width: POST.w, height: POST.h, rx: 4, fill: '#8E6232' }, g);
        // wide invisible grip so small fingers catch thin planks
        el('rect', { x: -L / 2 - 6, y: -22, width: L + 12, height: 44, fill: '#000', 'fill-opacity': 0 }, g);
      } else if (p.kind === 'bumper') {
        const r = KINDS.bumper.r;
        const face = el('g', {}, g);
        el('circle', { r: r + 2, fill: '#A84A40', cy: 2 }, face);
        el('circle', { r, fill: '#D9574C' }, face);
        el('circle', { cx: -7, cy: -7, r: 4, fill: '#fff', 'fill-opacity': 0.35 }, face);
        [-6, 6].forEach((x) => el('circle', { cx: x, cy: -2, r: 2.4, fill: INK }, face));
        el('path', { d: 'M -5 4 Q 0 9 5 4', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, face);
        p.face = face;
        el('circle', { r: r + 14, fill: '#000', 'fill-opacity': 0 }, g);
      } else {
        const bellG = el('g', {}, g);
        el('rect', { x: -2, y: -22, width: 4, height: 7, rx: 2, fill: '#8E6232' }, bellG);
        el('path', { d: 'M -15 10 C -15 -8, -9 -16, 0 -16 C 9 -16, 15 -8, 15 10 Z', fill: '#E8B83A' }, bellG);
        el('rect', { x: -18, y: 8, width: 36, height: 6, rx: 3, fill: '#C9961E' }, bellG);
        el('circle', { cy: 17, r: 3.5, fill: '#8E6232' }, bellG);
        p.face = bellG;
        el('circle', { r: 32, fill: '#000', 'fill-opacity': 0 }, g);
      }
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); grab(p, e, false); });
      return g;
    }

    // A tilted plank gets a stop post just past its low end, like a real
    // marble run: the marble hits the post and drops straight down onto the
    // next plank instead of flying over it. Flat planks have no post.
    const POST = { w: 8, h: 34, gap: 31 };   // plank end to post centre: leaves 27 px, a marble is 22
    const isPlank = (p) => p.kind === 'long' || p.kind === 'short';
    function postLocal(p) {
      const side = Math.sign(p.angle);       // +1: right end is low
      // y -16: the post stands on the plank's level and never pokes out below it
      return side ? { x: side * (KINDS[p.kind].len / 2 + POST.gap), y: -16 } : null;
    }
    function makeBodies(p) {
      const opts = () => ({ isStatic: true, friction: 0.02, frictionStatic: 0, restitution: 0.15 });
      if (isPlank(p)) {
        const list = [M.Bodies.rectangle(p.x, p.y, KINDS[p.kind].len, 14, Object.assign(opts(), { chamfer: { radius: 6 } }))];
        if (postLocal(p)) list.push(M.Bodies.rectangle(p.x, p.y, POST.w, POST.h, Object.assign(opts(), { chamfer: { radius: 3 }, restitution: 0.05 })));
        return list;
      }
      if (p.kind === 'bumper') return [M.Bodies.circle(p.x, p.y, KINDS.bumper.r, Object.assign(opts(), { restitution: 1.0 }))];
      return [M.Bodies.circle(p.x, p.y, KINDS.bell.r, Object.assign(opts(), { restitution: 0.5 }))];
    }
    function setBodies(p) {
      if (p.bodies) p.bodies.forEach((b) => { M.Composite.remove(world, b); byBody.delete(b.id); });
      p.bodies = makeBodies(p);
      p.bodies.forEach((b) => { M.Composite.add(world, b); byBody.set(b.id, p); });
    }

    function addPiece(kind, x, y, angle) {
      if (pieces.length >= MAX_PIECES) { audio.soft(); return null; }
      const p = { kind, x, y, angle: angle || 0, key: (kind === 'long' || kind === 'short') ? (keyCounter++ % KEYS.length) : 0, lastHit: 0 };
      setBodies(p);
      p.g = drawPiece(p);
      pieces.push(p);
      place(p);
      return p;
    }
    function place(p) {
      const a = p.angle * Math.PI / 180, cos = Math.cos(a), sin = Math.sin(a);
      M.Body.setPosition(p.bodies[0], { x: p.x, y: p.y });
      M.Body.setAngle(p.bodies[0], a);
      const post = isPlank(p) && postLocal(p);
      if (post && p.bodies[1]) {
        M.Body.setPosition(p.bodies[1], { x: p.x + cos * post.x - sin * post.y, y: p.y + sin * post.x + cos * post.y });
        M.Body.setAngle(p.bodies[1], a);
      }
      if (p.postEl) {
        p.postEl.setAttribute('display', post ? 'inline' : 'none');
        if (post) { p.postEl.setAttribute('x', post.x - POST.w / 2); p.postEl.setAttribute('y', post.y - POST.h / 2); }
      }
      p.g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle})`);
    }
    function removePiece(p) {
      const i = pieces.indexOf(p);
      if (i >= 0) pieces.splice(i, 1);
      p.bodies.forEach((b) => { byBody.delete(b.id); M.Composite.remove(world, b); });
      const { x, y, angle } = p;
      U.tween(260, U.ease.inOut, (k) => p.g.setAttribute('transform', `translate(${x} ${y}) rotate(${angle}) scale(${1 - k})`), () => p.g.remove());
      audio.put();
    }

    // ---- Tray: pull out a new piece ----
    [['long', 70], ['short', 160], ['bumper', 250], ['bell', 330]].forEach(([kind, y]) => {
      const g = el('g', { transform: `translate(${(TRAY.x0 + TRAY.x1) / 2} ${y})` }, trayLayer);
      if (kind === 'long' || kind === 'short') {
        const L = kind === 'long' ? 92 : 58;
        el('rect', { x: -L / 2, y: -7, width: L, height: 14, rx: 7, fill: '#4A7BC9', transform: 'rotate(-15)' }, g);
        el('rect', { x: -L / 2, y: -7, width: L, height: 14, rx: 7, fill: '#E8B83A', transform: 'translate(0 18) rotate(-15)' }, g);
      } else if (kind === 'bumper') {
        el('circle', { r: 20, fill: '#D9574C' }, g);
        [-6, 6].forEach((x) => el('circle', { cx: x, cy: -2, r: 2.4, fill: INK }, g));
        el('path', { d: 'M -5 4 Q 0 9 5 4', fill: 'none', stroke: INK, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
      } else {
        el('path', { d: 'M -15 10 C -15 -8, -9 -16, 0 -16 C 9 -16, 15 -8, 15 10 Z', fill: '#E8B83A' }, g);
        el('rect', { x: -18, y: 8, width: 36, height: 6, rx: 3, fill: '#C9961E' }, g);
      }
      el('rect', { x: -52, y: -40, width: 104, height: 80, fill: '#000', 'fill-opacity': 0 }, g);
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault(); e.stopPropagation();
        const pt = U.svgPoint(svg, e);
        const p = addPiece(kind, pt.x, pt.y, kind === 'long' || kind === 'short' ? 15 : 0);
        if (p) { audio.pick(); grab(p, e, true); }
      });
    });

    // ---- Dragging pieces: one per finger ----
    const grabs = new Map();   // pointerId -> { p, offX, offY, sx, sy, moved }
    function grab(p, e, fromTray) {
      for (const [id, gr] of grabs) if (gr.p === p) grabs.delete(id);
      const pt = U.svgPoint(svg, e);
      grabs.set(e.pointerId, { p, offX: fromTray ? 0 : pt.x - p.x, offY: fromTray ? 0 : pt.y - p.y, sx: pt.x, sy: pt.y, moved: fromTray });
      pieceLayer.appendChild(p.g);
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    }
    svg.addEventListener('pointermove', (e) => {
      const gr = grabs.get(e.pointerId);
      if (!gr) return;
      const pt = U.svgPoint(svg, e);
      if (!gr.moved && Math.hypot(pt.x - gr.sx, pt.y - gr.sy) > 8) gr.moved = true;
      if (!gr.moved) return;
      gr.p.x = U.clamp(pt.x - gr.offX, BOARD.x0, TRAY.x1);
      gr.p.y = U.clamp(pt.y - gr.offY, BOARD.y0 + 10, BOARD.y1 - 24);
      place(gr.p);
    });
    function release(e) {
      const gr = grabs.get(e.pointerId);
      if (!gr) return;
      grabs.delete(e.pointerId);
      const p = gr.p;
      if (gr.moved) {
        if (p.x > BOARD.x1 - 6) { removePiece(p); return; }          // back in the tray
        p.x = U.clamp(Math.round(p.x / GRID) * GRID, BOARD.x0 + 30, BOARD.x1 - 30);
        p.y = U.clamp(Math.round(p.y / GRID) * GRID, BOARD.y0 + 30, BOARD.y1 - 40);
        place(p);
        audio.put();
      } else if (p.kind === 'long' || p.kind === 'short') {
        // tap: tilt to the next angle
        const i = ANGLES.indexOf(p.angle);
        p.angle = ANGLES[(i + 1) % ANGLES.length];
        setBodies(p);
        place(p);
        audio.click();
      } else {
        ring(p, 1);
      }
    }
    svg.addEventListener('pointerup', release);
    svg.addEventListener('pointercancel', release);

    // ---- Marbles ----
    const marbles = [];        // { body, g }
    function dropMarble(x) {
      if (marbles.length >= MAX_MARBLES) removeMarble(marbles[0], false);
      // a hair of sideways jitter, so a marble never balances forever on top of a bell or bumper
      const body = M.Bodies.circle(x + U.rand(-1.5, 1.5), BOARD.y0 + 18, 11, { restitution: 0.3, friction: 0, frictionStatic: 0, frictionAir: 0.004, density: 0.004 });
      body.label = 'marble';
      M.Composite.add(world, body);
      const c = U.pick(MARBLE_COLORS);
      const g = el('g', {}, marbleLayer);
      el('circle', { r: 11, fill: c }, g);
      el('circle', { r: 11, fill: 'none', stroke: U.mixHex(c, INK, 0.3), 'stroke-width': 1.5 }, g);
      el('circle', { cx: -3.5, cy: -4, r: 3.5, fill: '#fff', 'fill-opacity': 0.6 }, g);
      marbles.push({ body, g, still: 0 });
      audio.pick();
    }
    function removeMarble(m, plop) {
      const i = marbles.indexOf(m);
      if (i >= 0) marbles.splice(i, 1);
      M.Composite.remove(world, m.body);
      m.g.remove();
      if (plop) audio.knock(260, 0.08, 0.2);
    }
    function fadeMarble(m) {
      const i = marbles.indexOf(m);
      if (i >= 0) marbles.splice(i, 1);
      M.Composite.remove(world, m.body);
      const g = m.g;
      U.tween(400, U.ease.out, (k) => g.setAttribute('opacity', 1 - k), () => g.remove());
    }
    // a tap on an empty part of the board drops a marble there
    svg.addEventListener('pointerdown', (e) => {
      if (grabs.has(e.pointerId)) return;
      const pt = U.svgPoint(svg, e);
      if (pt.x < BOARD.x0 + 12 || pt.x > BOARD.x1 - 12 || pt.y < BOARD.y0 || pt.y > BOARD.y1) return;
      e.preventDefault();
      dropMarble(U.clamp(pt.x, BOARD.x0 + 16, BOARD.x1 - 16));
    });

    // ---- Sounds ----
    function ring(p, strength) {
      const now = performance.now();
      if (now - p.lastHit < 90) return;
      p.lastHit = now;
      const c = audio.context();
      const t = c ? c.currentTime : 0;
      const peak = Math.min(0.16, 0.05 + strength * 0.03);
      if (p.kind === 'long' || p.kind === 'short') audio.noteAt(KEYS[p.key].f, t, 0.9, peak, 'marimba');
      else if (p.kind === 'bumper') audio.noteAt(392, t, 0.4, peak, 'xylo');
      else audio.noteAt(1318.5, t, 1.6, peak * 0.8, 'musicbox');
      // a little squish so you see which piece rang
      if (p.face && !ctx.reducedMotion) U.tween(220, U.ease.out, (k) => p.face.setAttribute('transform', `scale(${1 + 0.18 * Math.sin(k * Math.PI)})`));
    }
    let soundsThisFrame = 0;
    M.Events.on(engine, 'collisionStart', (ev) => {
      ev.pairs.forEach((pair) => {
        if (soundsThisFrame >= 3) return;
        const a = pair.bodyA, b = pair.bodyB;
        const marble = a.label === 'marble' ? a : (b.label === 'marble' ? b : null);
        if (!marble) return;
        const other = marble === a ? b : a;
        const speed = marble.speed;
        if (speed < 0.8) return;
        const p = byBody.get(other.id);
        soundsThisFrame++;
        if (p) ring(p, speed);
        else if (other.label === 'marble') audio.knock(1800, 0.03, Math.min(0.12, 0.03 + speed * 0.01));
      });
    });

    // ---- Loop ----
    let raf = 0, lastT = 0;
    function frame(now) {
      const dt = Math.min(32, lastT ? now - lastT : 16.7);
      lastT = now;
      soundsThisFrame = 0;
      M.Engine.update(engine, dt);
      for (let i = marbles.length - 1; i >= 0; i--) {
        const m = marbles[i], pos = m.body.position;
        if (pos.y > H + 20 || pos.x < -40 || pos.x > W + 40) { removeMarble(m, true); continue; }
        // a marble that has lain still for 10 s (on a flat plank, in a corner) fades away
        m.still = m.body.speed < 0.05 ? m.still + dt : 0;
        if (m.still > 10000) { fadeMarble(m); continue; }
        m.g.setAttribute('transform', `translate(${pos.x.toFixed(1)} ${pos.y.toFixed(1)})`);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // ---- A ready-made run to start with ----
    // A zigzag from top left down to the gutter, plus a bell, a bumper and a
    // second little run on the right so taps anywhere do something.
    // Each plank's low end lies above the next plank, so a marble keeps going.
    addPiece('long', 220, 100, 15);     // drops at x ~310
    addPiece('long', 260, 200, -15);    // catches it, drops at x ~170
    addPiece('long', 230, 300, 15);     // catches it, drops at x ~322 into the gutter
    addPiece('bell', 590, 140);         // rings when you drop a marble on the right
    addPiece('bumper', 460, 160);
    addPiece('short', 520, 220, -15);   // drops at x ~455 (its post clears the plank below)
    addPiece('short', 440, 290, 15);    // low end stays high enough for marbles in the gutter to pass under

    return {
      destroy() {
        cancelAnimationFrame(raf);
        M.Events.off(engine);
        M.World.clear(world, false);
        M.Engine.clear(engine);
        svg.remove();
      }
    };
  }

  KH.games.push({
    id: 'marbles',
    name: 'Knikkerbaan',
    minAge: 1,
    maxAge: 6,
    icon: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="8" y="8" width="84" height="84" rx="14" fill="#F2D9B0"/>
      <g fill="#D9A86C"><circle cx="22" cy="22" r="2.5"/><circle cx="50" cy="22" r="2.5"/><circle cx="78" cy="22" r="2.5"/><circle cx="22" cy="50" r="2.5"/><circle cx="78" cy="50" r="2.5"/><circle cx="22" cy="78" r="2.5"/><circle cx="50" cy="78" r="2.5"/></g>
      <rect x="18" y="30" width="46" height="9" rx="4.5" fill="#D9574C" transform="rotate(15 41 34)"/>
      <rect x="36" y="54" width="46" height="9" rx="4.5" fill="#4A7BC9" transform="rotate(-15 59 58)"/>
      <circle cx="30" cy="24" r="7" fill="#6FA36B"/><circle cx="28" cy="22" r="2.2" fill="#fff" opacity=".6"/>
      <circle cx="74" cy="78" r="7" fill="#E8B83A"/>
    </svg>`,
    mount
  });
})();
