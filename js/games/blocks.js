// Blokken (2–5 jaar). Pull blocks off the shelf, stack them, knock them over.
// Physics by Matter.js (js/vendor/matter.min.js), drawn with our own SVG so the
// blocks look like the rest of the app. Several fingers at once are fine.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const U = KH.util;
  const W = 780, H = 400;   // landscape: a wide, low room
  const FLOOR = 300;
  const MAX_BLOCKS = 24;

  const KINDS = {
    cube:  { w: 64, h: 64, color: '#D9574C', dark: '#B5443B' },
    long:  { w: 128, h: 42, color: '#4A7BC9', dark: '#3B63A3' },
    small: { w: 42, h: 42, color: '#E8B83A', dark: '#C9961E' },
    roof:  { w: 84, h: 52, color: '#6FA36B', dark: '#558350', tri: true }
  };

  function mount(stage, ctx) {
    const M = window.Matter;
    const audio = ctx.audio;
    const el = U.el;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' }, stage);

    // Room
    el('rect', { x: 0, y: 0, width: W, height: FLOOR, fill: '#F6EFE2' }, svg);
    el('rect', { x: 0, y: FLOOR, width: W, height: H - FLOOR, fill: '#D9A86C' }, svg);
    for (let i = 1; i < 5; i++) el('line', { x1: 0, y1: FLOOR + i * 22, x2: W, y2: FLOOR + i * 22, stroke: '#C48C50', 'stroke-width': 2, 'stroke-opacity': 0.5 }, svg);
    el('rect', { x: 0, y: FLOOR + 30, width: W, height: 10, fill: '#8E6232' }, svg);

    const layer = el('g', {}, svg);
    const shelfLayer = el('g', {}, svg);

    if (!M) {
      // Physics library missing: say so quietly for the parent and stop.
      el('text', { x: W / 2, y: 160, 'text-anchor': 'middle', fill: '#6F7E70', 'font-size': 16, 'font-family': 'Nunito, sans-serif' }, svg).textContent = 'Blokken kon de natuurkunde niet laden.';
      return { destroy() { svg.remove(); } };
    }

    // ---- World ----
    const engine = M.Engine.create({ enableSleeping: true, positionIterations: 10, velocityIterations: 8 });
    const world = engine.world;
    const wallOpts = { isStatic: true, friction: 0.9 };
    M.Composite.add(world, [
      M.Bodies.rectangle(W / 2, FLOOR + 50, W + 400, 100, wallOpts),
      M.Bodies.rectangle(-50, H / 2, 100, H * 3, wallOpts),
      M.Bodies.rectangle(W + 50, H / 2, 100, H * 3, wallOpts),
      M.Bodies.rectangle(W / 2, -600, W + 400, 100, wallOpts)
    ]);

    const blocks = []; // { body, g, kind, born }
    const bodyOpts = { friction: 0.8, frictionStatic: 1.2, restitution: 0.02, density: 0.0025, chamfer: { radius: 4 } };

    function drawShape(kind, body) {
      const k = KINDS[kind];
      const g = el('g', {}, layer);
      // path from the body's own vertices so drawing and physics always match
      const d = body.vertices.map((v, i) => `${i ? 'L' : 'M'} ${(v.x - body.position.x).toFixed(1)} ${(v.y - body.position.y).toFixed(1)}`).join(' ') + ' Z';
      el('path', { d, fill: k.color, stroke: k.dark, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
      if (!k.tri) {
        const top = Math.min(...body.vertices.map((v) => v.y)) - body.position.y;
        el('rect', { x: -k.w / 2 + 6, y: top + 6, width: k.w - 12, height: 6, rx: 3, fill: '#fff', 'fill-opacity': 0.25 }, g);
      }
      return g;
    }

    function makeBlock(kind, x, y) {
      const k = KINDS[kind];
      const body = k.tri
        ? M.Bodies.fromVertices(x, y, [[{ x: -k.w / 2, y: k.h / 2 }, { x: 0, y: -k.h / 2 }, { x: k.w / 2, y: k.h / 2 }]], Object.assign({}, bodyOpts, { chamfer: undefined }))
        : M.Bodies.rectangle(x, y, k.w, k.h, bodyOpts);
      body.label = kind;
      M.Composite.add(world, body);
      const b = { body, g: drawShape(kind, body), kind, born: performance.now() };
      blocks.push(b);
      b.g.style.cursor = 'grab';
      b.g.addEventListener('pointerdown', (e) => { e.preventDefault(); startDrag(b, e, U.svgPoint(svg, e)); });
      if (blocks.length > MAX_BLOCKS) removeBlock(blocks.find((o) => o.body.isSleeping) || blocks[0]);
      render(b);
      return b;
    }

    function removeBlock(b) {
      const i = blocks.indexOf(b);
      if (i >= 0) blocks.splice(i, 1);
      for (const [id, d] of drags) if (d.b === b) { M.Composite.remove(world, d.c); drags.delete(id); }
      M.Composite.remove(world, b.body);
      const { x, y } = b.body.position, a = b.body.angle * 180 / Math.PI;
      U.tween(300, U.ease.inOut, (k) => b.g.setAttribute('transform', `translate(${x} ${y}) rotate(${a}) scale(${1 - k})`), () => b.g.remove());
    }

    function render(b) {
      const p = b.body.position;
      b.g.setAttribute('transform', `translate(${p.x.toFixed(2)} ${p.y.toFixed(2)}) rotate(${(b.body.angle * 180 / Math.PI).toFixed(2)})`);
    }

    // ---- Shelf ----
    [['cube', 230], ['long', 345], ['small', 455], ['roof', 550]].forEach(([kind, x]) => {
      const k = KINDS[kind];
      const g = el('g', { transform: `translate(${x} ${FLOOR + 66}) scale(0.6)` }, shelfLayer);
      if (k.tri) el('path', { d: `M ${-k.w / 2} ${k.h / 2} L 0 ${-k.h / 2} L ${k.w / 2} ${k.h / 2} Z`, fill: k.color, stroke: k.dark, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
      else el('rect', { x: -k.w / 2, y: -k.h / 2, width: k.w, height: k.h, rx: 6, fill: k.color, stroke: k.dark, 'stroke-width': 3 }, g);
      g.style.cursor = 'grab';
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        const p = U.svgPoint(svg, e);
        startDrag(makeBlock(kind, p.x, FLOOR - k.h / 2 - 4), e, p); // spawn just above the floor, never inside it
        audio.pick();
      });
    });

    // ---- Dragging: one spring per finger ----
    const drags = new Map();
    function startDrag(b, e, p) {
      for (const [id, d] of drags) if (d.b === b) { M.Composite.remove(world, d.c); drags.delete(id); }
      M.Sleeping.set(b.body, false);
      const c = M.Constraint.create({
        pointA: { x: p.x, y: p.y },
        bodyB: b.body,
        pointB: { x: p.x - b.body.position.x, y: p.y - b.body.position.y },
        stiffness: 0.12, damping: 0.08, length: 0
      });
      M.Composite.add(world, c);
      drags.set(e.pointerId, { b, c, startX: p.x, startY: p.y, moved: false, t: performance.now() });
      layer.appendChild(b.g);
      try { svg.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
    }
    svg.addEventListener('pointermove', (e) => {
      const d = drags.get(e.pointerId);
      if (!d) return;
      const p = U.svgPoint(svg, e);
      if (Math.hypot(p.x - d.startX, p.y - d.startY) > 8) d.moved = true;
      d.c.pointA.x = U.clamp(p.x, 0, W);
      d.c.pointA.y = U.clamp(p.y, -200, FLOOR - 10);
    });
    function endDrag(e) {
      const d = drags.get(e.pointerId);
      if (!d) return;
      drags.delete(e.pointerId);
      M.Composite.remove(world, d.c);
      M.Sleeping.set(d.b.body, false);
      const tap = !d.moved && performance.now() - d.t < 300 && d.b.born < performance.now() - 400;
      if (tap) knock(d.b);
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);
    svg.addEventListener('lostpointercapture', endDrag);

    function knock(b) {
      const dir = Math.random() < 0.5 ? -1 : 1;
      M.Body.setVelocity(b.body, { x: dir * U.rand(4, 7), y: -U.rand(3, 6) });
      M.Body.setAngularVelocity(b.body, dir * U.rand(0.15, 0.3));
      audio.thud();
    }

    // ---- Sounds on impact ----
    let soundsThisFrame = 0;
    M.Events.on(engine, 'collisionStart', (ev) => {
      ev.pairs.forEach((pair) => {
        if (soundsThisFrame >= 2) return;
        const speed = Math.max(pair.bodyA.speed, pair.bodyB.speed);
        if (speed < 1.2) return;
        soundsThisFrame++;
        const hard = speed > 6;
        audio.knock(hard ? 300 : 520, hard ? 0.1 : 0.06, Math.min(0.45, 0.08 + speed * 0.03));
      });
    });

    // ---- Loop ----
    let raf = 0, lastT = 0;
    function frame(now) {
      const dt = Math.min(32, lastT ? now - lastT : 16.7);
      lastT = now;
      soundsThisFrame = 0;
      M.Engine.update(engine, dt);
      for (let i = blocks.length - 1; i >= 0; i--) {
        const b = blocks[i];
        if (b.body.position.y > H + 300) { removeBlock(b); continue; }
        render(b);
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // A little tower to start with
    makeBlock('cube', 358, FLOOR - 33);
    makeBlock('cube', 422, FLOOR - 33);
    makeBlock('long', 390, FLOOR - 64 - 22);
    makeBlock('roof', 390, FLOOR - 64 - 42 - 20);
    blocks.forEach((b) => { b.born = 0; });

    return {
      destroy() {
        cancelAnimationFrame(raf);
        M.Events.off(engine);
        M.Composite.clear(world, false);
        M.Engine.clear(engine);
        svg.remove();
      }
    };
  }

  KH.games.push({
    id: 'blocks',
    name: 'Blokken',
    minAge: 2,
    maxAge: 5,
    icon: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="6" y="80" width="88" height="12" fill="#D9A86C"/>
      <rect x="22" y="52" width="26" height="26" rx="3" fill="#D9574C"/>
      <rect x="52" y="52" width="26" height="26" rx="3" fill="#E8B83A"/>
      <rect x="20" y="36" width="60" height="14" rx="3" fill="#4A7BC9"/>
      <path d="M50 12 L74 36 L26 36 Z" fill="#6FA36B"/>
    </svg>`,
    mount
  });
})();
