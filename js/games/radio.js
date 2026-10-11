// Radio (1–6 jaar). A wooden radio that plays traditional children's tunes,
// synthesised live with Web Audio: no recordings, no files, nothing with a
// rights holder. Tap a station picture to change the song, the big button to
// start and stop. A bear, a cat and a dog dance along; tap one and it jumps.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const U = KH.util;
  const W = 780, H = 400;   // landscape: radio left, dance floor right

  // Note name -> frequency
  const SEMI = { C: -9, 'C#': -8, D: -7, 'D#': -6, E: -5, F: -4, 'F#': -3, G: -2, 'G#': -1, A: 0, 'A#': 1, B: 2 };
  function freq(name) {
    const m = /^([A-G]#?)(\d)$/.exec(name);
    return 440 * Math.pow(2, (SEMI[m[1]] + (parseInt(m[2], 10) - 4) * 12) / 12);
  }

  // Each song: tempo in beats per minute, key root for the bass, and the
  // melody as [note, beats] pairs. These are centuries-old tunes.
  const SONGS = [
    { id: 'kortjakje', inst: 'musicbox', acc: 'waltz', name: 'Kortjakje', bpm: 92, root: 'C3', icon: 'bed',
      notes: [['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2],
              ['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2],
              ['G4',1],['G4',1],['F4',1],['F4',1],['E4',1],['E4',1],['D4',2],
              ['G4',1],['G4',1],['F4',1],['F4',1],['E4',1],['E4',1],['D4',2],
              ['C4',1],['C4',1],['G4',1],['G4',1],['A4',1],['A4',1],['G4',2],
              ['F4',1],['F4',1],['E4',1],['E4',1],['D4',1],['D4',1],['C4',2]] },
    { id: 'jacob', inst: 'organ', acc: 'drone', name: 'Vader Jacob', bpm: 100, root: 'C3', icon: 'bell',
      notes: [['C4',1],['D4',1],['E4',1],['C4',1],['C4',1],['D4',1],['E4',1],['C4',1],
              ['E4',1],['F4',1],['G4',2],['E4',1],['F4',1],['G4',2],
              ['G4',.5],['A4',.5],['G4',.5],['F4',.5],['E4',1],['C4',1],
              ['G4',.5],['A4',.5],['G4',.5],['F4',.5],['E4',1],['C4',1],
              ['C4',1],['G3',1],['C4',2],['C4',1],['G3',1],['C4',2]] },
    { id: 'boerderij', inst: 'marimba', acc: 'oompah', name: 'Boerderij', bpm: 104, root: 'G2', icon: 'cow',
      notes: [['G4',1],['G4',1],['G4',1],['D4',1],['E4',1],['E4',1],['D4',2],
              ['B4',1],['B4',1],['A4',1],['A4',1],['G4',2],['D4',1],
              ['G4',1],['G4',1],['G4',1],['D4',1],['E4',1],['E4',1],['D4',2],
              ['B4',1],['B4',1],['A4',1],['A4',1],['G4',2],['D4',.5],['D4',.5],
              ['G4',1],['G4',1],['G4',1],['D4',.5],['D4',.5],['G4',1],['G4',1],['G4',1],
              ['G4',.5],['G4',.5],['G4',1],['G4',.5],['G4',.5],['G4',1],['G4',.5],['G4',.5],['G4',.5],['G4',.5],['G4',1],['G4',1],
              ['G4',1],['G4',1],['G4',1],['D4',1],['E4',1],['E4',1],['D4',2],
              ['B4',1],['B4',1],['A4',1],['A4',1],['G4',3]] },
    { id: 'bootje', inst: 'harp', acc: 'arpeggio', name: 'Bootje', bpm: 108, root: 'C3', icon: 'boat',
      notes: [['C4',1.5],['C4',1.5],['C4',1],['D4',.5],['E4',1.5],
              ['E4',1],['D4',.5],['E4',1],['F4',.5],['G4',3],
              ['C5',.5],['C5',.5],['C5',.5],['G4',.5],['G4',.5],['G4',.5],
              ['E4',.5],['E4',.5],['E4',.5],['C4',.5],['C4',.5],['C4',.5],
              ['G4',1],['F4',.5],['E4',1],['D4',.5],['C4',3]] },
    { id: 'lammetje', inst: 'flute', acc: 'pad', name: 'Lammetje', bpm: 96, root: 'C3', icon: 'sheep',
      notes: [['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['E4',1],['E4',2],
              ['D4',1],['D4',1],['D4',2],['E4',1],['G4',1],['G4',2],
              ['E4',1],['D4',1],['C4',1],['D4',1],['E4',1],['E4',1],['E4',1],['E4',1],
              ['D4',1],['D4',1],['E4',1],['D4',1],['C4',4]] },
    // Ik zag twee beren — volkslied, melodie overgenomen van bladmuziek (C-majeur, 4/4).
    { id: 'beren', inst: 'piano', acc: 'alberti', name: 'Twee beren', bpm: 108, root: 'C3', icon: 'bear',
      notes: [['G4',1],['G4',1],['G4',1],['C5',1],  ['E4',1],['E4',1],['E4',1],['G4',1],
              ['D4',1],['D4',1],['D4',1],['E4',1],  ['G4',2],['G4',2],
              ['A4',1],['F4',1],['F4',1],['F4',1],  ['G4',1],['E4',1],['E4',1],['E4',1],
              ['F4',1],['D4',1],['D4',1],['D4',1],  ['C4',1],['E4',1],['G4',1],['G4',1],
              ['G4',1],['G4',1],['G4',1],['R',1],   ['A4',1],['A4',1],['A4',1],['R',1],
              ['G4',1],['G4',1],['G4',1],['G4',1],  ['G4',1],['G4',1],['C4',2]] },
    // Our own tune: fast, high, repetitive, lots of upward hops — the things small children like.
    { id: 'blij', inst: 'xylo', acc: 'shaker', name: 'Blij-liedje', bpm: 132, root: 'D3', icon: 'sun',
      notes: [['D4',.5],['F#4',.5],['A4',1],['D5',1],['A4',.5],['F#4',.5],['A4',1],['F#4',1],['D4',2],
              ['E4',.5],['G4',.5],['B4',1],['D5',1],['B4',.5],['G4',.5],['A4',1],['G4',1],['E4',2],
              ['D5',.5],['D5',.5],['C#5',.5],['B4',.5],['A4',1],['F#4',1],['G4',.5],['A4',.5],['B4',1],['A4',2],
              ['D4',.5],['F#4',.5],['A4',1],['D5',1],['E5',.5],['D5',.5],['D5',4]] }
  ];

  const ICONS = {
    bed:   '<rect x="-22" y="-2" width="44" height="18" rx="5" fill="#4A7BC9"/><rect x="-22" y="-14" width="18" height="14" rx="5" fill="#F7F3EA"/><rect x="-24" y="14" width="6" height="8" fill="#8E6232"/><rect x="18" y="14" width="6" height="8" fill="#8E6232"/>',
    bell:  '<path d="M -16 10 C -16 -10, -10 -20, 0 -20 C 10 -20, 16 -10, 16 10 Z" fill="#E8B83A"/><rect x="-19" y="9" width="38" height="6" rx="3" fill="#C9961E"/><circle cx="0" cy="18" r="4" fill="#8E6232"/>',
    cow:   '<ellipse cx="0" cy="2" rx="20" ry="16" fill="#F7F3EA"/><ellipse cx="-7" cy="-2" rx="6" ry="5" fill="#3C4A3E"/><ellipse cx="0" cy="10" rx="11" ry="7" fill="#F0A5A0"/><circle cx="-4" cy="10" r="1.5" fill="#3C4A3E"/><circle cx="4" cy="10" r="1.5" fill="#3C4A3E"/><circle cx="-14" cy="-10" r="4" fill="#3C4A3E"/><circle cx="14" cy="-10" r="4" fill="#3C4A3E"/>',
    boat:  '<path d="M -22 4 L 22 4 L 14 16 L -14 16 Z" fill="#D9574C"/><rect x="-1" y="-20" width="2" height="24" fill="#3C4A3E"/><path d="M 1 -18 L 16 2 L 1 2 Z" fill="#F7F3EA"/>',
    sheep: '<ellipse cx="2" cy="2" rx="20" ry="14" fill="#F7F3EA"/><circle cx="-16" cy="-2" r="8" fill="#3C4A3E"/><circle cx="-18" cy="-4" r="1.5" fill="#fff"/><rect x="-10" y="12" width="4" height="8" fill="#3C4A3E"/><rect x="8" y="12" width="4" height="8" fill="#3C4A3E"/>',
    bear:  '<circle cx="-13" cy="-12" r="7" fill="#8E6232"/><circle cx="13" cy="-12" r="7" fill="#8E6232"/><circle r="18" fill="#B07E44"/><ellipse cx="0" cy="6" rx="9" ry="7" fill="#F2D9B0"/><circle cx="-6" cy="-4" r="2.2" fill="#3C4A3E"/><circle cx="6" cy="-4" r="2.2" fill="#3C4A3E"/><ellipse cx="0" cy="4" rx="3" ry="2" fill="#3C4A3E"/>',
    sun:   '<circle r="12" fill="#E8B83A"/><g fill="#E8B83A"><rect x="-2" y="-22" width="4" height="7" rx="2"/><rect x="-2" y="15" width="4" height="7" rx="2"/><rect x="-22" y="-2" width="7" height="4" rx="2"/><rect x="15" y="-2" width="7" height="4" rx="2"/></g>'
  };

  function mount(stage, ctx) {
    const audio = ctx.audio;
    const reduced = ctx.reducedMotion;
    const el = U.el;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' }, stage);
    const defs = el('defs', {}, svg);
    const f = el('filter', { id: 'rshadow', x: '-20%', y: '-20%', width: '140%', height: '160%' }, defs);
    el('feDropShadow', { dx: 0, dy: 4, stdDeviation: 3, 'flood-color': '#3C4A3E', 'flood-opacity': 0.25 }, f);

    // ---- Radio cabinet ----
    // Landscape: the radio on the left, vertically centred.
    const cab = el('g', { transform: 'translate(0 45)' }, svg);
    el('rect', { x: 30, y: 40, width: 340, height: 270, rx: 30, fill: '#D9A86C', filter: 'url(#rshadow)' }, cab);
    el('rect', { x: 50, y: 60, width: 190, height: 150, rx: 18, fill: '#F2D9B0' }, cab);
    // speaker grille
    const grille = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 7; c++) {
      grille.push(el('circle', { cx: 72 + c * 24, cy: 84 + r * 26, r: 6, fill: '#B07E44' }, cab));
    }
    // dial window with needle
    el('rect', { x: 256, y: 60, width: 94, height: 60, rx: 12, fill: '#F7F3EA' }, cab);
    SONGS.forEach((s, i) => el('rect', { x: 268 + i * 11.5, y: 72, width: 3, height: 12, rx: 1.5, fill: '#B07E44' }, cab));
    const needle = el('rect', { x: 268, y: 66, width: 4, height: 48, rx: 2, fill: '#D9574C' }, cab);
    // power button
    const power = el('g', { transform: 'translate(303 170)' }, cab);
    el('circle', { r: 34, fill: '#A84A40' }, power);
    const powerCap = el('circle', { r: 32, cy: -4, fill: '#D9574C' }, power);
    const powerIcon = el('path', { d: 'M -8 -14 L 12 -4 L -8 6 Z', fill: '#F7F3EA', 'pointer-events': 'none' }, power);

    // station buttons
    const stationY = 262;
    const stationBtns = SONGS.map((s, i) => {
      const x = 55 + i * 48.5;
      const g = el('g', { transform: `translate(${x} ${stationY})` }, cab);
      const bg = el('circle', { r: 22, fill: '#F7F3EA', stroke: '#B07E44', 'stroke-width': 3 }, g);
      const ic = el('g', { transform: 'scale(0.7)', 'pointer-events': 'none' }, g);
      ic.innerHTML = ICONS[s.icon];
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); selectStation(i, true); });
      return { g, bg };
    });

    // ---- Dancers ----
    // A bear, a cat and a dog, sitting, in a soft watercolour look. Each is
    // built from parts that move on their own (legs, ears, head, tail).
    // Local coordinates: origin at the feet, y up is negative.
    const INK = '#3C4A3E';
    const PINK = '#F0A5A0';
    const kit = U.paintKit(svg);
    const paint = kit.shape;

    // Landscape: the dance floor sits to the right of the radio.
    const floorG = el('g', { transform: 'translate(390 -250)' }, svg);
    el('rect', { x: 30, y: 350, width: 340, height: 260, rx: 30, fill: '#F2D9B0', 'fill-opacity': 0.55 }, floorG);
    drawJungle();
    // Opaque floor so the leaf stems disappear behind it. Same colour as the old
    // see-through strip (#D9A86C at 60% over the panel), worked out once.
    el('rect', { x: 30, y: 560, width: 340, height: 50, rx: 24, fill: '#E2C092' }, floorG);

    // Leaves behind the dancers, growing up from the floor. They stay still:
    // calm to look at, and nothing to repaint every frame.
    function drawJungle() {
      const deep = U.mixHex('#6FA36B', INK, 0.35);
      const mid = '#6FA36B';
      const fresh = U.mixHex('#6FA36B', '#E8B83A', 0.3);
      const defs = svg.querySelector('defs');
      const clip = el('clipPath', { id: 'radio-floor-clip' }, defs);
      el('rect', { x: 30, y: 350, width: 340, height: 260, rx: 30 }, clip);
      const jungle = el('g', { 'clip-path': 'url(#radio-floor-clip)', 'pointer-events': 'none' }, floorG);

      // A lens-shaped hole between two points (cut out with evenodd).
      function lens(x1, y1, x2, y2, bulge) {
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
        const len = Math.hypot(x2 - x1, y2 - y1);
        const nx = -(y2 - y1) / len * bulge, ny = (x2 - x1) / len * bulge;
        return `M ${x1} ${y1} Q ${mx + nx} ${my + ny} ${x2} ${y2} Q ${mx - nx} ${my - ny} ${x1} ${y1} Z `;
      }
      // Monstera leaf pointing up from (0,0), with oval holes either side of the midrib.
      function monstera(x, y, angle, size, color) {
        const g = el('g', { transform: `translate(${x} ${y}) rotate(${angle}) scale(${size})` }, jungle);
        el('path', { d: 'M 0 6 L 0 -12', stroke: deep, 'stroke-width': 4, 'stroke-linecap': 'round' }, g);
        let d = 'M 0 -6 C -46 -14, -54 -70, -12 -98 Q 0 -104 10 -98 C 52 -72, 46 -14, 0 -6 Z ';
        [[-1, -30, 22], [-1, -58, 20], [-1, -80, 12], [1, -34, 22], [1, -60, 19], [1, -82, 11]].forEach(([s, yy, w]) => {
          d += lens(s * 10, yy, s * (10 + w), yy - 10, 4.5);
        });
        paint(g, 'path', { d, 'fill-rule': 'evenodd' }, color, 0.2);
        el('path', { d: 'M 0 -8 Q 3 -50 0 -96', fill: 'none', stroke: U.mixHex(color, '#ffffff', 0.35), 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-opacity': 0.7 }, g);
      }
      // Fern: a curved stem with pairs of narrow leaflets getting smaller to the tip.
      function fern(x, y, angle, height, color) {
        const g = el('g', { transform: `translate(${x} ${y}) rotate(${angle})` }, jungle);
        const bend = height * 0.12;
        el('path', { d: `M 0 0 Q ${bend} ${-height * 0.5} 0 ${-height}`, fill: 'none', stroke: deep, 'stroke-width': 2, 'stroke-linecap': 'round' }, g);
        const n = 9;
        for (let i = 1; i <= n; i++) {
          const t = i / (n + 1);
          const px = 2 * (1 - t) * t * bend, py = -height * t;
          const len = 26 * (1 - t * 0.7);
          [-1, 1].forEach((s) => paint(g, 'ellipse', {
            cx: px + s * len / 2, cy: py - 2, rx: len / 2, ry: 3.6,
            transform: `rotate(${s * -28} ${px} ${py})`
          }, color, 0.15));
        }
      }
      // Branch: a thin stem with a few round leaves, like the light green sprigs.
      function sprig(x, y, angle, height, color) {
        const g = el('g', { transform: `translate(${x} ${y}) rotate(${angle})` }, jungle);
        el('path', { d: `M 0 0 L 0 ${-height}`, stroke: deep, 'stroke-width': 1.8, 'stroke-linecap': 'round' }, g);
        [0.35, 0.55, 0.75].forEach((t, i) => {
          const s = i % 2 ? 1 : -1;
          paint(g, 'ellipse', { cx: s * 9, cy: -height * t, rx: 9, ry: 4.5, transform: `rotate(${s * -35} 0 ${-height * t})` }, color, 0.1);
        });
        paint(g, 'ellipse', { cx: 0, cy: -height - 7, rx: 4.5, ry: 9 }, color, 0.1);
      }

      // back layer
      // tall ferns in the gaps between the animals
      fern(154, 566, -8, 175, deep);
      fern(248, 566, 9, 165, deep);
      sprig(62, 566, -6, 150, fresh);
      sprig(340, 566, 8, 140, fresh);
      // corner monsteras, leaning in from the sides
      monstera(64, 584, -18, 1.15, mid);
      monstera(338, 584, 20, 1.05, deep);
    }

    // Rotatable part: a group whose transform is rotate(angle px py).
    function part(parent, px, py) {
      const g = el('g', {}, parent);
      return { g, set(a) { g.setAttribute('transform', `rotate(${a.toFixed(1)} ${px} ${py})`); } };
    }
    // Brush strokes (fur, stripes, toes): thin round lines.
    function strokes(parent, d, color, width, opacity) {
      el('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round', 'stroke-opacity': opacity || 1, 'pointer-events': 'none' }, parent);
    }
    // A thick painted stroke (tails), with grain on top.
    function brush(parent, d, color, width) {
      el('path', { d, fill: 'none', stroke: color, 'stroke-width': width, 'stroke-linecap': 'round' }, parent);
      if (kit.grain) el('path', { d, fill: 'none', stroke: kit.grain, 'stroke-width': width, 'stroke-linecap': 'round', class: 'grain', 'pointer-events': 'none' }, parent);
    }
    // Small dot eyes, far apart. They can blink (closed line) or smile (^ ^).
    function eyes(parent, ex, ey, r) {
      const open = el('g', {}, parent);
      [-ex, ex].forEach((x) => el('circle', { cx: x, cy: ey, r, fill: INK }, open));
      const shut = el('path', { d: `M ${-ex - r} ${ey} h ${2 * r} M ${ex - r} ${ey} h ${2 * r}`, stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', display: 'none' }, parent);
      const happy = el('path', { d: `M ${-ex - r - 1} ${ey + 1} q ${r + 1} ${-2.6 * r} ${2 * r + 2} 0 M ${ex - r - 1} ${ey + 1} q ${r + 1} ${-2.6 * r} ${2 * r + 2} 0`, fill: 'none', stroke: INK, 'stroke-width': 2.2, 'stroke-linecap': 'round', display: 'none' }, parent);
      return {
        show(state) {
          open.setAttribute('display', state === 'open' ? 'inline' : 'none');
          shut.setAttribute('display', state === 'shut' ? 'inline' : 'none');
          happy.setAttribute('display', state === 'happy' ? 'inline' : 'none');
        }
      };
    }
    // ---- Sitting animals ----
    // Style of watercolour nursery prints: pear-shaped body, front legs as two
    // columns that stay on the floor (they lift a little, never swing out),
    // hind feet sticking out, a wide soft-square head with a big light muzzle.
    // Outlines are slightly uneven (U.blob), fixed once when drawn.
    const blob = U.blob;
    function blush(parent, x, y) {
      [-x, x].forEach((cx) => el('ellipse', { cx, cy: y, rx: 7, ry: 4.5, fill: PINK, 'fill-opacity': 0.6 }, parent));
    }
    // A front leg: lift 0..1 raises the paw a little with a slight tilt.
    function legPart(parent, s) {
      const g = el('g', {}, parent);
      return { g, set(l) { g.setAttribute('transform', `translate(0 ${(-l * 9).toFixed(1)}) rotate(${(s * l * 5).toFixed(1)} ${s * 10} -46)`); } };
    }
    // Hind feet, body and two front legs. Returns the leg parts [left, right].
    function sitBody(pose, fur, paw, toe, edge, seed) {
      [-1, 1].forEach((s) => {
        paint(pose, 'path', { d: blob(s * 25, -10, 32, 21, { n: 2.4, seed: seed + 3 + s }) }, fur, edge);
        strokes(pose, `M ${s * 33} -4 l ${s * 2} -5 M ${s * 38} -6 l ${s * 2} -4`, toe, 1.6, 0.6);
      });
      paint(pose, 'path', { d: blob(0, -31, 64, 56, { n: 2.3, taper: 0.6, seed: seed + 11 }) }, fur, edge);
      return [-1, 1].map((s) => {
        const leg = legPart(pose, s);
        paint(leg.g, 'path', { d: blob(s * 10, -24, 18, 42, { n: 3, seed: seed + 20 + s }) }, fur, edge + 0.04);
        paint(leg.g, 'path', { d: blob(s * 10, -6, 22, 13, { n: 2.3, seed: seed + 24 + s }) }, paw, 0.2);
        strokes(leg.g, `M ${s * 10 - 3} -1.5 v -4 M ${s * 10 + 3} -1.5 v -4`, toe, 1.5, 0.6);
        return leg;
      });
    }
    function smile(parent, y) {
      strokes(parent, `M 0 ${y} V ${y + 3} M -5.5 ${y + 3} Q -2.7 ${y + 6.5} 0 ${y + 3} Q 2.7 ${y + 6.5} 5.5 ${y + 3}`, INK, 1.7);
    }

    function drawBear(root) {
      const c = '#B07E44', dark = '#8E6232', light = '#F2D9B0';
      const fur = U.mixHex(c, light, 0.22);      // body a little lighter than the head
      const pose = el('g', {}, root);
      const [legL, legR] = sitBody(pose, fur, U.mixHex(c, light, 0.5), dark, 0.3, 0);
      const head = part(pose, 0, -58);
      const earL = part(head.g, -27, -118), earR = part(head.g, 27, -118);
      [[earL, -1], [earR, 1]].forEach(([e, s]) => {
        paint(e.g, 'path', { d: blob(s * 31, -123, 24, 22, { seed: 30 + s }) }, c, 0.25);
        paint(e.g, 'path', { d: blob(s * 31, -122, 13, 12, { seed: 33 + s }) }, '#D9A86C', 0.1);
      });
      paint(head.g, 'path', { d: blob(0, -94, 84, 70, { n: 3.1, taper: 0.9, seed: 40 }) }, c, 0.3);
      strokes(head.g, 'M -6 -124 l 1 5 M 0 -126 v 6 M 6 -124 l -1 5 M -3 -117 l 0.5 4 M 3 -117 l -0.5 4 M -18 -119 l 2 4 M 18 -119 l -2 4', dark, 1.7, 0.75);
      paint(head.g, 'path', { d: blob(0, -77, 48, 30, { n: 2.6, seed: 41 }) }, light, 0.1);
      el('path', { d: 'M -7 -88 Q 0 -91 7 -88 Q 3.5 -81 0 -81 Q -3.5 -81 -7 -88 Z', fill: INK }, head.g);
      el('ellipse', { cx: -2, cy: -87.5, rx: 1.8, ry: 1, fill: '#fff', 'fill-opacity': 0.55 }, head.g);
      smile(head.g, -81);
      const eye = eyes(head.g, 19, -98, 3.3);
      blush(head.g, 30, -84);
      return { pose, head, legL, legR, earL, earR, eye };
    }

    function drawCat(root) {
      const c = '#E8B83A', stripe = '#C9961E', light = '#F7F3EA';
      const fur = U.mixHex(c, light, 0.18);
      const pose = el('g', {}, root);
      const tail = part(pose, 22, -14);
      brush(tail.g, 'M 22 -14 C 48 -14, 52 -40, 42 -58', fur, 10);
      strokes(tail.g, 'M 44 -30 l 7 -1 M 48 -44 l 6 2', stripe, 3.5, 0.85);
      const [legL, legR] = sitBody(pose, fur, U.mixHex(c, light, 0.6), stripe, 0.26, 100);
      strokes(pose, 'M -28 -36 h 6 M -30 -27 h 6 M 22 -36 h 6 M 24 -27 h 6', stripe, 3.5, 0.85);
      const head = part(pose, 0, -58);
      const earL = part(head.g, -24, -118), earR = part(head.g, 24, -118);
      [[earL, -1], [earR, 1]].forEach(([e, s]) => {
        paint(e.g, 'path', { d: `M ${s * 11} -116 L ${s * 26} -139 Q ${s * 32} -146 ${s * 35} -138 L ${s * 40} -108 Z` }, c, 0.2);
        el('path', { d: `M ${s * 18} -117 L ${s * 28} -132 Q ${s * 31} -135 ${s * 32} -131 L ${s * 35} -113 Z`, fill: PINK, 'fill-opacity': 0.85 }, e.g);
      });
      paint(head.g, 'path', { d: blob(0, -94, 90, 68, { n: 2.8, taper: 0.94, seed: 140 }) }, c, 0.26);
      strokes(head.g, 'M -9 -126 l 2 9 M 0 -128 v 11 M 9 -126 l -2 9 M -45 -98 h 8 M -44 -90 h 7 M 37 -98 h 8 M 37 -90 h 7', stripe, 4, 0.85);
      paint(head.g, 'path', { d: blob(0, -80, 36, 23, { n: 2.4, seed: 141 }) }, light, 0.08);
      el('path', { d: 'M -4.5 -88 Q 0 -90 4.5 -88 Q 2 -83.5 0 -83.5 Q -2 -83.5 -4.5 -88 Z', fill: PINK }, head.g);
      smile(head.g, -83.5);
      strokes(head.g, 'M -15 -83 L -34 -86 M -15 -79 L -33 -77 M 15 -83 L 34 -86 M 15 -79 L 33 -77', INK, 1.1, 0.4);
      const eye = eyes(head.g, 19, -98, 3.3);
      blush(head.g, 31, -86);
      return { pose, head, legL, legR, earL, earR, tail, eye };
    }

    function drawDog(root) {
      const c = '#F7F3EA', ear = '#8E6232', patch = '#D9A86C', tan = '#F2D9B0';
      const pose = el('g', {}, root);
      const tail = part(pose, 22, -16);
      brush(tail.g, 'M 22 -16 Q 36 -20, 40 -38', patch, 9);
      const [legL, legR] = sitBody(pose, c, tan, patch, 0.24, 200);
      paint(pose, 'path', { d: blob(24, -24, 13, 12, { seed: 205 }) }, patch, 0.15);
      const head = part(pose, 0, -58);
      paint(head.g, 'path', { d: blob(0, -94, 84, 70, { n: 3, taper: 0.92, seed: 240 }) }, c, 0.24);
      paint(head.g, 'path', { d: blob(18, -101, 24, 21, { seed: 241 }) }, patch, 0.15);
      strokes(head.g, 'M -8 -124 l 1 5 M -2 -126 v 5 M 4 -125 l -0.5 5', patch, 1.8, 0.8);
      paint(head.g, 'path', { d: blob(0, -78, 50, 30, { n: 2.6, seed: 242 }) }, '#ffffff', 0.12);
      el('path', { d: blob(0, -88, 15, 10.5, { n: 2.4, seed: 243, wobble: 0.2 }), fill: INK }, head.g);
      el('ellipse', { cx: -2.5, cy: -89.5, rx: 2.2, ry: 1.2, fill: '#fff', 'fill-opacity': 0.55 }, head.g);
      el('ellipse', { cx: 2, cy: -73, rx: 4, ry: 5, fill: PINK }, head.g);
      smile(head.g, -83);
      const eye = eyes(head.g, 19, -99, 3.3);
      blush(head.g, 30, -85);
      // floppy ears hanging over the sides of the head
      const earL = part(head.g, -36, -120), earR = part(head.g, 36, -120);
      [[earL, -1], [earR, 1]].forEach(([e, s]) => {
        paint(e.g, 'path', { d: blob(s * 42, -98, 20, 44, { taper: 0.7, seed: 250 + s }) }, ear, 0.2);
      });
      return { pose, head, legL, legR, earL, earR, tail, eye };
    }

    // Short, soft tap sounds: two notes each, on the toy instruments.
    function voice(kind) {
      const c = audio.context();
      if (!c) return;
      const t = c.currentTime + 0.01;
      if (kind === 'bear') { audio.noteAt(196, t, 0.4, 0.12, 'marimba'); audio.noteAt(261.6, t + 0.14, 0.5, 0.12, 'marimba'); }
      if (kind === 'cat')  { audio.noteAt(784, t, 0.3, 0.08, 'flute'); audio.noteAt(659.3, t + 0.16, 0.45, 0.08, 'flute'); }
      if (kind === 'dog')  { audio.noteAt(523.3, t, 0.25, 0.1, 'xylo'); audio.noteAt(523.3, t + 0.15, 0.3, 0.1, 'xylo'); }
    }

    const dancers = [
      { kind: 'bear', x: 100, draw: drawBear },
      { kind: 'cat',  x: 200, draw: drawCat },
      { kind: 'dog',  x: 300, draw: drawDog }
    ].map((d, i) => {
      const shadow = el('ellipse', { cx: d.x, cy: 558, rx: 34, ry: 6, fill: INK, 'fill-opacity': 0.14 }, floorG);
      const g = el('g', {}, floorG);
      // generous invisible hit area so a small finger always catches the animal
      el('ellipse', { cx: 0, cy: -70, rx: 44, ry: 72, fill: '#000', 'fill-opacity': 0 }, g);
      const parts = d.draw(g);
      const dancer = Object.assign({ g, shadow, parts, phase: i * 0.5, jump: 0, happyUntil: 0, nextBlink: performance.now() + 1500 + i * 900, blinkUntil: 0 }, d);
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        dancer.jump = 1;
        dancer.happyUntil = performance.now() + 700;
        voice(d.kind);
      });
      return dancer;
    });
    const baseY = 557;
    const JUMP = 70;

    // One dance per animal. b = beats since the song started (0 when quiet),
    // t = seconds, on = music playing and motion allowed, j = jump 0..1.
    // Front legs only lift a little (0..1); they stay under the body.
    function poseDancer(d, b, t, on, j) {
      const p = d.parts;
      const s1 = Math.sin(b * Math.PI);          // one swing per two beats
      const s2 = Math.sin(b * Math.PI * 2);      // one swing per beat
      let bob = 0, sway = 0, tilt = 0, legL = 0, legR = 0, earL = 0, earR = 0, tail = 0, squash = 1;
      if (d.kind === 'bear') {
        // rocks side to side, head bobs, paws tap one at a time
        if (on) {
          bob = Math.abs(s1) * 6;
          sway = s1 * 5;
          tilt = -s1 * 7;
          legL = Math.max(0, s1); legR = Math.max(0, -s1);
          earL = earR = s2 * 10;
          squash = 1 + s2 * 0.035;
        }
      } else if (d.kind === 'cat') {
        // little hop on every beat, both paws up at the top, slow tail swish
        if (on) {
          const hop = Math.abs(s1);
          bob = hop * 12;
          legL = legR = hop * 0.8;
          tilt = Math.sin(b * Math.PI / 2) * 9;
          earL = -Math.pow(Math.max(0, s1), 8) * 18;   // ear twitch on alternate beats
          squash = 1 - Math.cos(b * Math.PI * 2) * 0.04;
        }
        tail = Math.sin(t * (on ? 2.2 : 0.9)) * (on ? 26 : 9);
      } else {
        // bouncy dog: paddling paws, floppy ears that lag, fast tail wag
        if (on) {
          bob = Math.abs(s1) * 10;
          tilt = s1 * 7;
          legL = Math.max(0, s2); legR = Math.max(0, -s2);
          const flop = Math.sin((b - 0.2) * Math.PI * 2) * 14;
          earL = flop; earR = -flop;
          squash = 1 + s2 * 0.045;
        }
        tail = Math.sin(t * (on ? 22 : 6)) * (on ? 28 : 10);
      }
      if (j > 0.05) { legL = Math.max(legL, j); legR = Math.max(legR, j); }
      if (!on && !reduced) squash = 1 + Math.sin(t * 2 + d.phase * 4) * 0.015;   // breathing
      if (reduced) tail = 0;

      const y = baseY - bob - j * JUMP;
      d.g.setAttribute('transform', `translate(${d.x} ${y.toFixed(1)}) scale(${(1 / squash).toFixed(3)} ${squash.toFixed(3)})`);
      p.pose.setAttribute('transform', `rotate(${sway.toFixed(1)} 0 0)`);
      p.head.set(tilt);
      p.legL.set(legL); p.legR.set(legR);
      p.earL.set(earL); p.earR.set(earR);
      if (p.tail) p.tail.set(tail);
      const lift = Math.min(1, (bob + j * JUMP) / 80);
      d.shadow.setAttribute('rx', (34 * (1 - lift * 0.45)).toFixed(1));
      d.shadow.setAttribute('fill-opacity', (0.14 * (1 - lift * 0.6)).toFixed(3));
    }

    function eyesFor(d, now) {
      if (now < d.happyUntil) return 'happy';
      if (now > d.nextBlink) { d.blinkUntil = now + 140; d.nextBlink = now + 2500 + Math.random() * 3000; }
      return now < d.blinkUntil ? 'shut' : 'open';
    }

    // ---- Music engine ----
    let ac = null;        // AudioContext (shared)
    let playing = false;
    let station = 0;
    let songStart = 0;    // ac time at which beat 0 of the current loop started
    let nextIdx = 0;      // next note to schedule
    let nextTime = 0;     // ac time of that note
    let timer = 0;

    function ensure() {
      if (!ac) {
        ac = audio.context();
        if (!ac) return false;
      }
      return true;
    }

    // ---- Arrangement ----
    // Harmony is derived per bar: the I, IV or V chord that best fits the
    // melody notes in that bar. Each song then has its own accompaniment
    // pattern and instrument, so the stations sound like different records.
    const SEMIS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
    function pc(name) { return SEMIS.indexOf(/^([A-G]#?)/.exec(name)[1]); }
    function chordFor(song, barNotes) {
      const rootPc = pc(song.root);
      const cands = [
        { deg: 0, tones: [0, 4, 7] },   // I
        { deg: 5, tones: [5, 9, 0] },   // IV
        { deg: 7, tones: [7, 11, 2] }   // V
      ];
      let best = cands[0], bestScore = -1;
      cands.forEach((c, i) => {
        let score = 0;
        barNotes.forEach(([n, beats]) => {
          if (n === 'R') return;
          const rel = (pc(n) - rootPc + 12) % 12;
          if (c.tones.includes(rel)) score += beats * (rel === c.tones[0] ? 1.2 : 1);
        });
        if (i === 0) score += 0.1; // tie goes to the tonic
        if (score > bestScore) { bestScore = score; best = c; }
      });
      return best;
    }
    // Precompute bars (4 beats) with their chord for the current song.
    function analyse(song) {
      const bars = [];
      let cur = [], beatsIn = 0;
      song.notes.forEach((nb) => {
        cur.push(nb); beatsIn += nb[1];
        if (beatsIn >= 4 - 1e-6) { bars.push({ notes: cur, beats: beatsIn }); cur = []; beatsIn = 0; }
      });
      if (cur.length) bars.push({ notes: cur, beats: beatsIn });
      bars.forEach((bar) => { bar.chord = chordFor(song, bar.notes); });
      return bars;
    }
    let bars = [];
    let barIdx = 0, barTime = 0;

    function chordFreqs(song, chord, octaveShift) {
      const base = freq(song.root) * Math.pow(2, octaveShift || 0);
      return chord.tones.map((t) => base * Math.pow(2, t / 12));
    }

    const ACC = {
      // music box waltz: bass on 1, two light chord taps
      waltz(song, bar, t, spb) {
        const [r, third, fifth] = chordFreqs(song, bar.chord, 0);
        audio.noteAt(r, t, spb * 2, 0.07, 'harp');
        [1, 2].forEach((b) => { audio.noteAt(third * 2, t + b * spb, spb, 0.035, 'musicbox'); audio.noteAt(fifth * 2, t + b * spb, spb, 0.03, 'musicbox'); });
        if (bar.beats >= 4) { audio.noteAt(third * 2, t + 3 * spb, spb, 0.035, 'musicbox'); audio.noteAt(fifth * 2, t + 3 * spb, spb, 0.03, 'musicbox'); }
      },
      // organ: sustained chord under the whole bar
      drone(song, bar, t, spb) {
        chordFreqs(song, bar.chord, 0).forEach((f, i) => audio.noteAt(f, t, spb * bar.beats * 1.05, i === 0 ? 0.06 : 0.035, 'organ'));
      },
      // marimba oom-pah: root on 1 and 3, chord on 2 and 4
      oompah(song, bar, t, spb) {
        const [r, third, fifth] = chordFreqs(song, bar.chord, 0);
        for (let b = 0; b < bar.beats; b++) {
          if (b % 2 === 0) audio.noteAt(r / 2, t + b * spb, spb * 0.9, 0.09, 'marimba');
          else { audio.noteAt(third, t + b * spb, spb * 0.6, 0.045, 'marimba'); audio.noteAt(fifth, t + b * spb, spb * 0.6, 0.04, 'marimba'); }
        }
      },
      // harp arpeggio: eighth notes rolling up and down
      arpeggio(song, bar, t, spb) {
        const [r, third, fifth] = chordFreqs(song, bar.chord, 0);
        const seq = [r, third, fifth, r * 2, fifth, third, r, fifth];
        const n = Math.round(bar.beats * 2);
        for (let i = 0; i < n; i++) audio.noteAt(seq[i % 8], t + i * spb / 2, spb * 1.2, i % 2 === 0 ? 0.055 : 0.04, 'harp');
      },
      // soft pad: slow chord with a gentle swell, flute-like
      pad(song, bar, t, spb) {
        chordFreqs(song, bar.chord, 0).forEach((f, i) => audio.noteAt(f, t, spb * bar.beats * 1.1, i === 0 ? 0.045 : 0.03, 'flute'));
        audio.noteAt(freq(song.root) / 2, t, spb * bar.beats, 0.05, 'piano');
      },
      // alberti bass: root fifth third fifth, piano
      alberti(song, bar, t, spb) {
        const [r, third, fifth] = chordFreqs(song, bar.chord, 0);
        const seq = [r, fifth, third, fifth];
        const n = Math.round(bar.beats * 2);
        for (let i = 0; i < n; i++) audio.noteAt(seq[i % 4], t + i * spb / 2, spb * 0.8, 0.055, 'piano');
      },
      // playful: xylophone bass on 1 and 3, shaker on the offbeats
      shaker(song, bar, t, spb) {
        const [r, third, fifth] = chordFreqs(song, bar.chord, 0);
        for (let b = 0; b < bar.beats; b++) {
          if (b % 2 === 0) audio.noteAt(r, t + b * spb, spb, 0.07, 'xylo');
          else audio.noteAt(b === 1 ? third : fifth, t + b * spb, spb * 0.6, 0.045, 'xylo');
          audio.shakerAt(t + b * spb + spb / 2, 0.06);
        }
      }
    };

    function schedule() {
      if (!playing || !audio.isEnabled()) return;
      const song = SONGS[station];
      const spb = 60 / song.bpm;
      const horizon = ac.currentTime + 0.15;
      while (nextTime < horizon) {
        const [name, beats] = song.notes[nextIdx];
        const dur = beats * spb;
        if (name !== 'R') audio.noteAt(freq(name), nextTime, Math.max(0.6, dur * 1.3), 0.14, song.inst);
        nextTime += dur;
        nextIdx++;
        if (nextIdx >= song.notes.length) { nextIdx = 0; nextTime += spb * 2; songStart = nextTime; }
      }
      while (barTime < horizon) {
        const bar = bars[barIdx];
        ACC[song.acc](song, bar, barTime, spb);
        barTime += bar.beats * spb;
        barIdx++;
        if (barIdx >= bars.length) { barIdx = 0; barTime += spb * 2; } // same breath as the melody
      }
    }

    function start() {
      if (!ensure()) return;
      playing = true;
      bars = analyse(SONGS[station]);
      nextIdx = 0; barIdx = 0;
      nextTime = ac.currentTime + 0.1;
      barTime = nextTime;
      songStart = nextTime;
      clearInterval(timer);
      timer = setInterval(schedule, 40);
      powerIcon.setAttribute('d', 'M -10 -14 H -3 V 6 H -10 Z M 3 -14 H 10 V 6 H 3 Z');
    }
    function stop() {
      playing = false;
      clearInterval(timer);
      powerIcon.setAttribute('d', 'M -8 -14 L 12 -4 L -8 6 Z');
    }

    function selectStation(i, fromUser) {
      station = i;
      stationBtns.forEach((b, j) => b.bg.setAttribute('fill', j === i ? '#E8B83A' : '#F7F3EA'));
      needle.setAttribute('x', 268 + i * 11.5 - 0.5);
      if (fromUser) { audio.click(); start(); }
    }

    powerCap.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      powerCap.setAttribute('cy', 0);
      audio.click();
      if (playing) stop(); else start();
    });
    const up = () => powerCap.setAttribute('cy', -4);
    powerCap.addEventListener('pointerup', up);
    powerCap.addEventListener('pointercancel', up);
    powerCap.addEventListener('pointerleave', up);

    selectStation(0, false);

    // ---- Animation ----
    let raf = 0;
    function frame() {
      let beat = 0, pulse = 0;
      if (playing && ac) {
        const spb = 60 / SONGS[station].bpm;
        beat = (ac.currentTime - songStart) / spb;
        pulse = Math.max(0, 1 - ((beat % 1) * 2));
      }
      const now = performance.now();
      const on = playing && !reduced;
      dancers.forEach((d) => {
        d.jump *= 0.9;
        poseDancer(d, on ? beat : 0, now / 1000, on, d.jump);
        const st = eyesFor(d, now);
        if (st !== d.eyeState) { d.eyeState = st; d.parts.eye.show(st); }
      });
      if (!reduced) grille.forEach((c, i) => c.setAttribute('r', 6 + pulse * 2.5 * ((i % 3) === 0 ? 1 : 0.5)));
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        stop();
        cancelAnimationFrame(raf);
        svg.remove();
      }
    };
  }

  KH.games.push({
    id: 'radio',
    name: 'Radio',
    minAge: 1,
    maxAge: 6,
    icon: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <path d="M62 16 L80 10 V24" fill="none" stroke="#3C4A3E" stroke-width="3" stroke-linecap="round"/>
      <circle cx="30" cy="24" r="7" fill="#B07E44"/><circle cx="54" cy="24" r="7" fill="#B07E44"/>
      <rect x="22" y="20" width="40" height="30" rx="13" fill="#B07E44"/>
      <ellipse cx="42" cy="40" rx="10" ry="6.5" fill="#F2D9B0"/>
      <path d="M38.5 36.5 Q42 35 45.5 36.5 Q44 40 42 40 Q40 40 38.5 36.5 Z" fill="#3C4A3E"/>
      <circle cx="34" cy="30" r="1.8" fill="#3C4A3E"/><circle cx="50" cy="30" r="1.8" fill="#3C4A3E"/>
      <ellipse cx="29" cy="37" rx="3.5" ry="2.2" fill="#F0A5A0" opacity=".7"/><ellipse cx="55" cy="37" rx="3.5" ry="2.2" fill="#F0A5A0" opacity=".7"/>
      <rect x="8" y="44" width="84" height="46" rx="12" fill="#D9A86C"/>
      <rect x="16" y="52" width="42" height="30" rx="8" fill="#F2D9B0"/>
      <g fill="#B07E44"><circle cx="26" cy="60" r="3"/><circle cx="37" cy="60" r="3"/><circle cx="48" cy="60" r="3"/><circle cx="26" cy="72" r="3"/><circle cx="37" cy="72" r="3"/><circle cx="48" cy="72" r="3"/></g>
      <circle cx="74" cy="67" r="12" fill="#D9574C"/>
    </svg>`,
    mount
  });
})();
