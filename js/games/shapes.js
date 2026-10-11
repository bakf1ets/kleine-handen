// Vormenbord (2–3 jaar). A wooden board with three cut-outs; three knobbed
// pieces lie on the tray below. A piece only fits in its own hole. Near a wrong
// hole it slides back to the tray by itself; dropped anywhere else it simply
// stays there, so the child can also just play with the pieces.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const W = 780, H = 400;   // landscape: board on the left, tray on the right
  const PIECE_R = 42;          // piece half-size
  const HOLE_R = PIECE_R + 6;  // hole is a touch bigger, like real wood
  const SNAP_DIST = 58;        // how close counts as "in the hole"
  const HOLE_Y = 200;
  const HOLE_XS = [110, 250, 390];
  const TRAY = { x0: 600, x1: 670, y0: 88, y1: 312 };

  // Each piece is an animal whose outline is exactly its shape:
  // circle = bear face, square = cat face, triangle = little bird.
  const KINDS = [
    { id: 'circle',   color: '#B07E44' },
    { id: 'square',   color: '#E8B83A' },
    { id: 'triangle', color: '#4A7BC9' }
  ];

  function el(name, attrs, parent) {
    const n = document.createElementNS(SVG_NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  // Shape outline centred on (0,0).
  function shapePath(kind, r) {
    if (kind === 'circle') {
      return `M ${-r} 0 a ${r} ${r} 0 1 0 ${2 * r} 0 a ${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
    }
    if (kind === 'square') {
      const s = r * 0.92;
      return `M ${-s} ${-s} H ${s} V ${s} H ${-s} Z`;
    }
    // triangle (equilateral, centred on its centroid)
    const a = r * 1.12;
    return `M 0 ${-a} L ${a * 0.9} ${a * 0.55} L ${-a * 0.9} ${a * 0.55} Z`;
  }

  // Outline of a piece: the shape grown by 3 units with softly rounded corners,
  // the same footprint the old pieces had (shape plus a 6-wide round stroke).
  function piecePath(kind) {
    if (kind === 'circle') return shapePath('circle', PIECE_R + 3);
    const pts = kind === 'square'
      ? (() => { const s = PIECE_R * 0.92 + 3; return [[-s, -s], [s, -s], [s, s], [-s, s]]; })()
      : (() => { const a = PIECE_R * 1.12; return [[0, -a - 5.5], [a * 0.9 + 4.8, a * 0.55 + 3], [-a * 0.9 - 4.8, a * 0.55 + 3]]; })();
    return roundedPoly(pts, kind === 'square' ? 6 : 7);
  }
  function roundedPoly(pts, r) {
    const n = pts.length;
    let d = '';
    for (let i = 0; i < n; i++) {
      const p = pts[i], prev = pts[(i - 1 + n) % n], next = pts[(i + 1) % n];
      const v1 = [prev[0] - p[0], prev[1] - p[1]], v2 = [next[0] - p[0], next[1] - p[1]];
      const l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
      const a = [p[0] + v1[0] / l1 * r, p[1] + v1[1] / l1 * r];
      const b = [p[0] + v2[0] / l2 * r, p[1] + v2[1] / l2 * r];
      d += (i === 0 ? `M ${a[0].toFixed(1)} ${a[1].toFixed(1)} ` : `L ${a[0].toFixed(1)} ${a[1].toFixed(1)} `);
      d += `Q ${p[0]} ${p[1]} ${b[0].toFixed(1)} ${b[1].toFixed(1)} `;
    }
    return d + 'Z';
  }

  const INK = '#3C4A3E', PINK = '#F0A5A0';
  function line(parent, d, color, w, op) {
    el('path', { d, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-opacity': op || 1, 'pointer-events': 'none' }, parent);
  }
  function dotEyes(parent, ex, ey) {
    [-ex, ex].forEach((x) => el('circle', { cx: x, cy: ey, r: 3.6, fill: INK }, parent));
  }
  function cheeks(parent, x, y) {
    [-x, x].forEach((cx) => el('ellipse', { cx, cy: y, rx: 7, ry: 4.5, fill: PINK, 'fill-opacity': 0.6 }, parent));
  }
  function smile(parent, y) {
    line(parent, `M 0 ${y} V ${y + 3} M -5.5 ${y + 3} Q -2.7 ${y + 6.5} 0 ${y + 3} Q 2.7 ${y + 6.5} 5.5 ${y + 3}`, INK, 1.8);
  }

  // The animal on a piece. Everything stays inside piecePath, so the outline
  // still matches the hole exactly.
  function drawPiece(g, kit, kind) {
    const U = KH.util, paint = kit.shape;
    paint(g, 'path', { d: piecePath(kind.id) }, kind.color, 0.28);
    if (kind.id === 'circle') {
      // bear: ears pressed into the rim, light muzzle, brush strokes on the forehead
      [-1, 1].forEach((s) => paint(g, 'circle', { cx: s * 24, cy: -25, r: 8 }, '#D9A86C', 0.1));
      line(g, 'M -5 -33 l 1 5 M 0 -35 v 6 M 5 -33 l -1 5 M -2 -26 l 0.5 4 M 2 -26 l -0.5 4', '#8E6232', 1.8, 0.75);
      paint(g, 'path', { d: U.blob(0, 14, 46, 30, { n: 2.6, seed: 7 }) }, '#F2D9B0', 0.1);
      el('path', { d: 'M -7 3 Q 0 0 7 3 Q 3.5 10 0 10 Q -3.5 10 -7 3 Z', fill: INK }, g);
      smile(g, 10);
      dotEyes(g, 17, -8);
      cheeks(g, 28, 8);
    } else if (kind.id === 'square') {
      // cat: pink ears in the top corners, stripes, small muzzle, whiskers
      const s = PIECE_R * 0.92 + 3;
      [-1, 1].forEach((k) => el('path', { d: `M ${k * (s - 6)} ${-s + 6} L ${k * (s - 21)} ${-s + 6} L ${k * (s - 6)} ${-s + 21} Z`, fill: PINK, 'fill-opacity': 0.85, stroke: PINK, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g));
      line(g, 'M -8 -36 l 2 9 M 0 -38 v 11 M 8 -36 l -2 9 M -41 -2 h 8 M -41 6 h 7 M 33 -2 h 8 M 34 6 h 7', '#C9961E', 4, 0.85);
      paint(g, 'path', { d: U.blob(0, 14, 36, 23, { n: 2.4, seed: 9 }) }, '#F7F3EA', 0.08);
      el('path', { d: 'M -4.5 6 Q 0 4 4.5 6 Q 2 10.5 0 10.5 Q -2 10.5 -4.5 6 Z', fill: PINK }, g);
      smile(g, 10.5);
      line(g, 'M -15 11 L -33 8 M -15 15 L -32 17 M 15 11 L 33 8 M 15 15 L 32 17', INK, 1.2, 0.4);
      dotEyes(g, 16, -6);
      cheeks(g, 27, 8);
    } else {
      // bird: light belly, wings on the sides, a little beak, feather tuft
      paint(g, 'path', { d: U.blob(0, 17, 34, 20, { n: 2.2, seed: 11 }) }, '#F7F3EA', 0.08);
      [-1, 1].forEach((k) => paint(g, 'path', { d: `M ${k * 17} 2 Q ${k * 36} 8 ${k * 36} 25 Q ${k * 25} 24 ${k * 17} 16 Z` }, U.mixHex('#4A7BC9', '#ffffff', 0.35), 0.12));
      line(g, 'M -3 -34 l -3 -6 M 0 -35 v -7 M 3 -34 l 3 -6', '#F7F3EA', 2, 0.8);
      dotEyes(g, 10, -10);
      el('path', { d: 'M -6 -2 L 6 -2 L 0 7 Z', fill: '#E8B83A', stroke: '#E8B83A', 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, g);
      cheeks(g, 19, -3);
    }
  }

  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function tween(ms, ease, step, done) {
    const start = performance.now();
    let cancelled = false;
    function frame(now) {
      if (cancelled) return;
      const t = Math.min(1, (now - start) / ms);
      step(ease(t), t);
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

  function mount(stage, ctx) {
    const audio = ctx.audio;
    const reduced = ctx.reducedMotion;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' }, stage);

    // Defs: a soft wood grain and a drop shadow.
    const defs = el('defs', {}, svg);
    const grad = el('linearGradient', { id: 'wood', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0', 'stop-color': '#E3B67C' }, grad);
    el('stop', { offset: '1', 'stop-color': '#D29B5E' }, grad);
    const filt = el('filter', { id: 'shadow', x: '-20%', y: '-20%', width: '140%', height: '160%' }, defs);
    el('feDropShadow', { dx: 0, dy: 4, stdDeviation: 3, 'flood-color': '#3C4A3E', 'flood-opacity': 0.28 }, filt);

    // Board
    el('rect', { x: 20, y: 60, width: 460, height: 280, rx: 28, fill: 'url(#wood)', filter: 'url(#shadow)' }, svg);
    // grain lines
    for (let i = 0; i < 6; i++) {
      el('path', {
        d: `M 40 ${92 + i * 44} C 160 ${86 + i * 44}, 320 ${100 + i * 44}, 460 ${90 + i * 44}`,
        fill: 'none', stroke: '#C48C50', 'stroke-opacity': 0.35, 'stroke-width': 2
      }, svg);
    }

    // Tray (a lighter mat so the pieces have a home)
    el('rect', { x: 510, y: 24, width: 250, height: 352, rx: 28, fill: '#F2D9B0', 'fill-opacity': 0.55 }, svg);

    // Holes: one per slot; which shape sits where changes per round.
    let order = [0, 1, 2];
    const holes = HOLE_XS.map((x) => el('path', {
      d: shapePath('circle', HOLE_R), fill: '#8E6232',
      transform: `translate(${x} ${HOLE_Y})`
    }, svg));

    function layoutHoles() {
      holes.forEach((h, i) => h.setAttribute('d', shapePath(KINDS[order[i]].id, HOLE_R)));
    }

    const sparkLayer = el('g', {}, svg);
    const pieceLayer = el('g', {}, svg);

    // Pieces: watercolour animals drawn inside the shape outline.
    const kit = KH.util.paintKit(svg);
    const pieces = KINDS.map((kind) => {
      const g = el('g', { class: 'piece', filter: 'url(#shadow)' }, pieceLayer);
      drawPiece(g, kit, kind);
      return { kind: kind.id, g, x: 0, y: 0, scale: 1, home: { x: 0, y: 0 }, placed: false, cancel: null };
    });

    function render(p) {
      p.g.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${p.scale})`);
    }

    function randomTraySpots() {
      // three spots stacked down the tray, in random order, a little jitter sideways
      const rows = shuffle([0, 1, 2]);
      return rows.map((r) => ({
        x: TRAY.x0 + Math.random() * (TRAY.x1 - TRAY.x0),
        y: TRAY.y0 + (TRAY.y1 - TRAY.y0) * (r / 2) + (Math.random() - 0.5) * 12
      }));
    }

    function moveTo(p, to, ms, ease, done) {
      if (p.cancel) p.cancel();
      if (reduced) { p.x = to.x; p.y = to.y; p.scale = 1; render(p); if (done) done(); return; }
      const from = { x: p.x, y: p.y, s: p.scale };
      p.cancel = tween(ms, ease, (e) => {
        p.x = from.x + (to.x - from.x) * e;
        p.y = from.y + (to.y - from.y) * e;
        p.scale = from.s + (1 - from.s) * e;
        render(p);
      }, () => { p.cancel = null; if (done) done(); });
    }

    function sparkle(x, y, color) {
      if (reduced) return;
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const dot = el('circle', { cx: x, cy: y, r: 5, fill: color }, sparkLayer);
        tween(520, easeOut, (e) => {
          dot.setAttribute('cx', x + Math.cos(a) * 70 * e);
          dot.setAttribute('cy', y + Math.sin(a) * 70 * e);
          dot.setAttribute('r', 5 * (1 - e));
          dot.setAttribute('opacity', 1 - e);
        }, () => dot.remove());
      }
    }

    function holeCenter(i) { return { x: HOLE_XS[i], y: HOLE_Y }; }

    function nearestHole(x, y) {
      let best = -1, bestD = Infinity;
      HOLE_XS.forEach((hx, i) => {
        const d = Math.hypot(hx - x, HOLE_Y - y);
        if (d < bestD) { bestD = d; best = i; }
      });
      return bestD <= SNAP_DIST ? best : -1;
    }

    let round = 0;
    let timers = [];
    function later(fn, ms) { timers.push(setTimeout(fn, ms)); }

    function startRound() {
      if (round > 0) order = shuffle(order);
      layoutHoles();
      const spots = randomTraySpots();
      pieces.forEach((p, i) => {
        p.placed = false;
        p.home = spots[i];
        if (round === 0) { p.x = spots[i].x; p.y = spots[i].y; render(p); }
        else moveTo(p, spots[i], 650, easeInOut);
      });
      round++;
    }

    function checkComplete() {
      if (!pieces.every((p) => p.placed)) return;
      later(() => audio.done(), 350);
      later(startRound, 1900);
    }

    // Dragging
    const pt = svg.createSVGPoint();
    function toSvg(evt) {
      pt.x = evt.clientX; pt.y = evt.clientY;
      const m = svg.getScreenCTM();
      return m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
    }

    pieces.forEach((p) => {
      let offset = null;

      p.g.addEventListener('pointerdown', (evt) => {
        if (p.placed) return;
        evt.preventDefault();
        if (p.cancel) p.cancel();
        pieceLayer.appendChild(p.g); // on top (before capturing: re-inserting a node can drop its capture)
        p.g.setPointerCapture(evt.pointerId);
        p.g.classList.add('dragging');
        const s = toSvg(evt);
        offset = { x: s.x - p.x, y: s.y - p.y };
        p.scale = 1.08;
        render(p);
        audio.pick();
      });

      p.g.addEventListener('pointermove', (evt) => {
        if (!offset) return;
        const s = toSvg(evt);
        p.x = Math.max(PIECE_R, Math.min(W - PIECE_R, s.x - offset.x));
        p.y = Math.max(PIECE_R, Math.min(H - PIECE_R, s.y - offset.y));
        render(p);
      });

      function release(evt) {
        if (!offset) return;
        offset = null;
        p.g.classList.remove('dragging');
        try { p.g.releasePointerCapture(evt.pointerId); } catch (e) { /* already released */ }

        const hi = nearestHole(p.x, p.y);
        if (hi === -1) {
          moveTo(p, { x: p.x, y: p.y }, 120, easeOut); // settle scale back
          audio.put();
          return;
        }
        const holeKind = KINDS[order[hi]].id;
        if (holeKind === p.kind) {
          p.placed = true;
          const c = holeCenter(hi);
          audio.good();
          moveTo(p, c, 220, easeOut, () => {
            sparkle(c.x, c.y, KINDS.find((k) => k.id === p.kind).color);
            checkComplete();
          });
        } else {
          audio.soft();
          moveTo(p, p.home, 480, easeInOut);
        }
      }
      p.g.addEventListener('pointerup', release);
      p.g.addEventListener('pointercancel', release);
    });

    startRound();

    return {
      destroy() {
        timers.forEach(clearTimeout);
        pieces.forEach((p) => p.cancel && p.cancel());
        svg.remove();
      }
    };
  }

  KH.games.push({
    id: 'shapes',
    name: 'Vormenbord',
    minAge: 2,
    maxAge: 3,
    icon: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="4" y="22" width="92" height="58" rx="12" fill="#D9A86C"/>
      <circle cx="23" cy="51" r="14" fill="#B07E44"/>
      <circle cx="15" cy="43" r="3" fill="#D9A86C"/><circle cx="31" cy="43" r="3" fill="#D9A86C"/>
      <ellipse cx="23" cy="56" rx="7" ry="4.5" fill="#F2D9B0"/>
      <circle cx="18" cy="49" r="1.8" fill="#3C4A3E"/><circle cx="28" cy="49" r="1.8" fill="#3C4A3E"/>
      <rect x="38" y="37" width="27" height="27" rx="3" fill="#E8B83A"/>
      <path d="M40 39 L46 39 L40 45 Z M63 39 L57 39 L63 45 Z" fill="#F0A5A0"/>
      <ellipse cx="51.5" cy="56" rx="6" ry="4" fill="#F7F3EA"/>
      <circle cx="46.5" cy="49" r="1.8" fill="#3C4A3E"/><circle cx="56.5" cy="49" r="1.8" fill="#3C4A3E"/>
      <path d="M82 34 L95 63 L69 63 Z" fill="#4A7BC9" stroke="#4A7BC9" stroke-width="2" stroke-linejoin="round"/>
      <ellipse cx="82" cy="58" rx="6" ry="3.6" fill="#F7F3EA"/>
      <circle cx="78.5" cy="50" r="1.8" fill="#3C4A3E"/><circle cx="85.5" cy="50" r="1.8" fill="#3C4A3E"/>
      <path d="M80 53 L84 53 L82 56 Z" fill="#E8B83A"/>
    </svg>`,
    mount
  });
})();
