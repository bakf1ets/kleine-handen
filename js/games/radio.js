// Radio (1–6 jaar). A wooden radio that plays traditional children's tunes,
// synthesised live with Web Audio: no recordings, no files, nothing with a
// rights holder. Big arrows change the song, tapping the song picture starts
// and stops it. A bear, a cat and a dog are stickers on the radio; they dance
// along and jump when tapped.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const U = KH.util;
  const W = 780, H = 400;   // landscape

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

    // ---- Layout (landscape) ----
    // A wooden radio body fills the stage. In the middle a dark screen shows the
    // current song as a picture card, the previous and next cards peeking in at
    // the edges, a little equaliser and a progress bar. Big arrows left and right
    // change the song; tapping the card starts or stops it. Speakers sit in the
    // bottom corners. A bear, a cat and a dog are stickers on the body: they
    // dance to the music and jump when tapped.
    const INK = '#3C4A3E';
    const PINK = '#F0A5A0';
    const kit = U.paintKit(svg);
    const paint = kit.shape;
    const mix = U.mixHex;
    const SCR = { x0: 200, y0: 40, x1: 580, y1: 360 };     // the screen
    const CARD = 150;                                        // card size
    const CARD_X = 318, CARD_Y = 172;                        // current card centre

    // Body and screen frame
    el('rect', { x: 10, y: 10, width: 760, height: 380, rx: 38, fill: '#D9A86C', filter: 'url(#rshadow)' }, svg);
    if (kit.grain) el('rect', { x: 10, y: 10, width: 760, height: 380, rx: 38, fill: kit.grain, opacity: 0.5, class: 'grain', 'pointer-events': 'none' }, svg);
    el('rect', { x: SCR.x0 - 16, y: SCR.y0 - 16, width: SCR.x1 - SCR.x0 + 32, height: SCR.y1 - SCR.y0 + 32, rx: 32, fill: '#B07E44' }, svg);
    el('rect', { x: SCR.x0, y: SCR.y0, width: SCR.x1 - SCR.x0, height: SCR.y1 - SCR.y0, rx: 22, fill: INK }, svg);
    const scrClip = el('clipPath', { id: 'radio-screen' }, defs);
    el('rect', { x: SCR.x0, y: SCR.y0, width: SCR.x1 - SCR.x0, height: SCR.y1 - SCR.y0, rx: 22 }, scrClip);
    const screen = el('g', { 'clip-path': 'url(#radio-screen)' }, svg);

    // ---- Song cards ----
    // One picture per song, drawn here in the app's own style.
    const light = (c, k) => mix(c, '#ffffff', k);
    function starPath(r1, r2) {
      let d = '';
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? r2 : r1;
        d += `${i ? 'L' : 'M'} ${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)} `;
      }
      return d + 'Z';
    }
    const face = (x, y, s) => `<circle cx="${x - 7 * s}" cy="${y}" r="${2.6 * s}" fill="${INK}"/><circle cx="${x + 7 * s}" cy="${y}" r="${2.6 * s}" fill="${INK}"/>` +
      `<path d="M ${x - 5 * s} ${y + 6 * s} Q ${x} ${y + 11 * s} ${x + 5 * s} ${y + 6 * s}" fill="none" stroke="${INK}" stroke-width="${2.2 * s}" stroke-linecap="round"/>` +
      `<ellipse cx="${x - 12 * s}" cy="${y + 5 * s}" rx="${3.5 * s}" ry="${2.2 * s}" fill="${PINK}" opacity=".75"/><ellipse cx="${x + 12 * s}" cy="${y + 5 * s}" rx="${3.5 * s}" ry="${2.2 * s}" fill="${PINK}" opacity=".75"/>`;
    const ART = {
      // Kortjakje: a smiling star in the night sky
      bed: () => `<rect x="-75" y="-75" width="150" height="150" fill="${mix('#4A7BC9', INK, 0.35)}"/>` +
        [[-48, -48, 3], [44, -52, 2.5], [52, 30, 2], [-52, 40, 2.2], [-20, -60, 1.6], [30, 58, 1.8]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#F7F3EA"/>`).join('') +
        `<path d="M 50 -30 a 16 16 0 1 0 6 26 a 12 12 0 1 1 -6 -26 Z" fill="${light('#E8B83A', 0.35)}"/>` +
        `<path d="${starPath(46, 21)}" fill="#E8B83A" stroke="#E8B83A" stroke-width="10" stroke-linejoin="round" transform="translate(-6 8)"/>` + face(-6, 8, 1.1),
      // Vader Jacob: two bells ringing
      bell: () => `<rect x="-75" y="-75" width="150" height="150" fill="${light('#6FA36B', 0.55)}"/>` +
        `<g transform="translate(-22 4) rotate(-14) scale(2.2)">${ICONS.bell}</g><g transform="translate(34 22) rotate(12) scale(1.5)">${ICONS.bell}</g>` +
        `<path d="M -58 -40 l -8 -6 M -60 -26 l -10 0 M 58 -10 l 8 -6 M 60 4 l 10 0" stroke="#C9961E" stroke-width="4" stroke-linecap="round"/>`,
      // Boerderij: a cow on a green hill
      cow: () => `<rect x="-75" y="-75" width="150" height="150" fill="${light('#4A7BC9', 0.7)}"/>` +
        `<ellipse cx="0" cy="88" rx="120" ry="60" fill="#6FA36B"/>` + `<g transform="translate(0 -2) scale(2.6)">${ICONS.cow}</g>`,
      // Bootje: a boat on the waves under a sun
      boat: () => `<rect x="-75" y="-75" width="150" height="150" fill="${light('#4A7BC9', 0.7)}"/>` +
        `<circle cx="48" cy="-46" r="14" fill="#E8B83A"/>` + `<g transform="translate(-4 4) scale(2.6)">${ICONS.boat}</g>` +
        `<path d="M -80 52 q 15 -10 30 0 t 30 0 t 30 0 t 30 0 t 30 0 t 30 0 V 80 H -80 Z" fill="#4A7BC9"/>`,
      // Lammetje: a lamb among flowers
      sheep: () => `<rect x="-75" y="-75" width="150" height="150" fill="${light('#6FA36B', 0.55)}"/>` +
        `<ellipse cx="0" cy="92" rx="120" ry="52" fill="#6FA36B"/>` + `<g transform="translate(4 0) scale(2.6)">${ICONS.sheep}</g>` +
        [[-52, 52, '#D9574C'], [50, 56, '#E8B83A'], [-30, 62, '#8C5BB5']].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="6" fill="${c}"/><circle cx="${x}" cy="${y}" r="2.4" fill="#F7F3EA"/>`).join(''),
      // Twee beren: a big bear and a little bear
      bear: () => `<rect x="-75" y="-75" width="150" height="150" fill="#F2D9B0"/>` +
        `<g transform="translate(-16 -2) scale(2.2)">${ICONS.bear}</g><g transform="translate(42 34) scale(1.3)">${ICONS.bear}</g>`,
      // Blij-liedje: a laughing sun
      sun: () => `<rect x="-75" y="-75" width="150" height="150" fill="${light('#E8B83A', 0.6)}"/>` +
        `<g transform="scale(3)">${ICONS.sun}</g>` + face(0, -2, 1.2)
    };
    const cardClip = el('clipPath', { id: 'radio-card' }, defs);
    el('rect', { x: -CARD / 2, y: -CARD / 2, width: CARD, height: CARD, rx: 18 }, cardClip);
    const cards = SONGS.map((s) => {
      const g = el('g', {}, screen);
      const inner = el('g', { 'clip-path': 'url(#radio-card)' }, g);
      inner.innerHTML = ART[s.icon]();
      if (kit.grain) el('rect', { x: -CARD / 2, y: -CARD / 2, width: CARD, height: CARD, fill: kit.grain, opacity: 0.6, class: 'grain', 'pointer-events': 'none' }, inner);
      el('rect', { x: -CARD / 2, y: -CARD / 2, width: CARD, height: CARD, rx: 18, fill: 'none', stroke: '#F7F3EA', 'stroke-width': 4 }, g);
      return { g };
    });
    // play badge over the current card while the music is off
    const badge = el('g', { 'pointer-events': 'none' }, screen);
    el('circle', { r: 26, fill: INK, 'fill-opacity': 0.55 }, badge);
    el('path', { d: 'M -8 -13 L 14 0 L -8 13 Z', fill: '#F7F3EA', stroke: '#F7F3EA', 'stroke-width': 4, 'stroke-linejoin': 'round' }, badge);
    // invisible tap target on the current card
    const cardHit = el('rect', { x: CARD_X - CARD / 2, y: CARD_Y - CARD / 2, width: CARD, height: CARD, rx: 18, fill: '#000', 'fill-opacity': 0 }, svg);

    // Card positions: the current card sits left of centre; the previous card
    // peeks in at the left edge, the next one at the right edge.
    let pos = 0;             // shown position (float while sliding)
    function cardOffset(k) { return k < 0 ? k * 170 : k * 312; }
    function layoutCards() {
      const n = SONGS.length;
      cards.forEach((c, i) => {
        let k = i - pos;
        if (k > n / 2) k -= n;
        if (k < -n / 2) k += n;
        const visible = Math.abs(k) < 1.6;
        c.g.setAttribute('display', visible ? 'inline' : 'none');
        if (visible) {
          const lo = Math.floor(k), t = k - lo;
          const x = CARD_X + cardOffset(lo) + (cardOffset(lo + 1) - cardOffset(lo)) * t;
          const sc = 1 - Math.min(1, Math.abs(k)) * 0.12;
          c.g.setAttribute('transform', `translate(${x.toFixed(1)} ${CARD_Y}) scale(${sc.toFixed(3)})`);
        }
      });
    }

    // ---- Equaliser and notes (right part of the screen) ----
    const EQ_COLORS = ['#D9574C', '#E8B83A', '#6FA36B', '#4A7BC9', '#8C5BB5'];
    const eq = EQ_COLORS.map((c, i) => el('rect', { x: 446 + i * 22, y: 240, width: 14, height: 20, rx: 7, fill: light(c, 0.25) }, screen));
    const notes = [0, 1, 2].map((i) => {
      const g = el('g', { 'pointer-events': 'none', opacity: 0 }, screen);
      el('ellipse', { cx: 0, cy: 0, rx: 7, ry: 5.5, fill: '#F7F3EA', transform: 'rotate(-20)' }, g);
      el('path', { d: i === 1 ? 'M 6 -2 V -26 L 18 -22 V -2' : 'M 6 -2 V -26 q 8 4 10 12', fill: 'none', stroke: '#F7F3EA', 'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      return { g, phase: i / 3, x: 455 + i * 36 };
    });

    // ---- Progress bar ----
    el('rect', { x: 236, y: 312, width: 306, height: 10, rx: 5, fill: '#F7F3EA', 'fill-opacity': 0.25 }, screen);
    const fill = el('rect', { x: 236, y: 312, width: 0, height: 10, rx: 5, fill: '#F2D9B0' }, screen);
    const knob = el('g', {}, screen);
    el('circle', { r: 15, fill: INK, stroke: '#F2D9B0', 'stroke-width': 4 }, knob);
    el('circle', { r: 7, fill: '#F2D9B0' }, knob);

    // ---- Arrows ----
    function arrow(x, y, dir) {
      const g = el('g', { transform: `translate(${x} ${y})` }, svg);
      const tri = `M ${-30 * dir} -40 L ${34 * dir} 0 L ${-30 * dir} 40 Z`;
      el('path', { d: tri, fill: '#C9961E', stroke: '#C9961E', 'stroke-width': 14, 'stroke-linejoin': 'round', transform: 'translate(0 7)' }, g);
      const top = el('g', {}, g);
      el('path', { d: tri, fill: '#E8B83A', stroke: '#E8B83A', 'stroke-width': 14, 'stroke-linejoin': 'round' }, top);
      el('path', { d: `M ${-22 * dir} -26 L ${-22 * dir} 6`, stroke: '#fff', 'stroke-opacity': 0.4, 'stroke-width': 6, 'stroke-linecap': 'round' }, top);
      el('circle', { r: 56, fill: '#000', 'fill-opacity': 0 }, g);   // generous hit area
      const press = (down) => top.setAttribute('transform', down ? 'translate(0 6)' : '');
      g.addEventListener('pointerdown', (e) => { e.preventDefault(); press(true); go(dir); });
      ['pointerup', 'pointercancel', 'pointerleave'].forEach((t) => g.addEventListener(t, () => press(false)));
      return g;
    }
    arrow(104, 210, -1);
    arrow(676, 210, 1);

    // ---- Speakers with sound rays ----
    function speaker(x, y) {
      const g = el('g', { transform: `translate(${x} ${y})`, 'pointer-events': 'none' }, svg);
      [-14, 0, 14].forEach((o) => el('path', { d: `M ${-22 + o} ${12 + o * 0.2} L ${22 + o} ${-12 + o * 0.2}`, stroke: '#8E6232', 'stroke-width': 8, 'stroke-linecap': 'round', transform: `translate(${o * 0.4} ${o})` }, g));
      const rays = el('g', { opacity: 0.25 }, g);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2 + 0.3;
        el('path', { d: `M ${Math.cos(a) * 44} ${Math.sin(a) * 40} L ${Math.cos(a) * 58} ${Math.sin(a) * 53}`, stroke: '#E8B83A', 'stroke-width': 5, 'stroke-linecap': 'round' }, rays);
      }
      return rays;
    }
    const rays = [speaker(104, 330), speaker(676, 330)];

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

    // ---- Stickers ----
    // Each animal sits on a die-cut white backing with a soft shadow, like a
    // sticker on the radio. The backing is the animal's outline drawn with a
    // thick white stroke (no SVG filter, so it stays cheap while dancing).
    function backing(parent, kind, color, opacity, dy) {
      const g = el('g', { transform: `translate(0 ${dy})`, 'pointer-events': 'none' }, parent);
      const st = { fill: color, stroke: color, 'stroke-width': 20, 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'fill-opacity': opacity, 'stroke-opacity': opacity };
      const shape = (attrs, tag) => el(tag || 'path', Object.assign({}, st, attrs), g);
      // shared lower half
      shape({ cx: 0, cy: -30, rx: 34, ry: 30 }, 'ellipse');
      shape({ cx: 0, cy: -10, rx: 42, ry: 12 }, 'ellipse');
      if (kind === 'bear') {
        shape({ d: blob(0, -94, 84, 70, { n: 3.1, taper: 0.9, seed: 40 }) });
        [-1, 1].forEach((s) => shape({ cx: s * 31, cy: -123, r: 12 }, 'circle'));
      } else if (kind === 'cat') {
        shape({ d: blob(0, -94, 90, 68, { n: 2.8, taper: 0.94, seed: 140 }) });
        [-1, 1].forEach((s) => shape({ d: `M ${s * 11} -116 L ${s * 26} -139 Q ${s * 32} -146 ${s * 35} -138 L ${s * 40} -108 Z` }));
        shape({ d: 'M 22 -14 C 48 -14, 52 -40, 42 -58', fill: 'none', 'stroke-width': 30 });
      } else {
        shape({ d: blob(0, -94, 84, 70, { n: 3, taper: 0.92, seed: 240 }) });
        [-1, 1].forEach((s) => shape({ d: blob(s * 42, -98, 20, 44, { taper: 0.7, seed: 250 + s }) }));
        shape({ d: 'M 22 -16 Q 36 -20, 40 -38', fill: 'none', 'stroke-width': 29 });
      }
      return g;
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

    // Placement: bear top-left, cat top-right, dog stuck across the top-right
    // corner of the screen frame. x, y = feet; s = size; rot = sticker tilt.
    const dancers = [
      { kind: 'bear', x: 104, y: 142, s: 0.62, rot: -7, draw: drawBear },
      { kind: 'cat',  x: 676, y: 142, s: 0.62, rot: 6,  draw: drawCat },
      { kind: 'dog',  x: 590, y: 96,  s: 0.46, rot: 12, draw: drawDog }
    ].map((d, i) => {
      const g = el('g', {}, svg);
      backing(g, d.kind, INK, 0.16, 6);           // shadow
      backing(g, d.kind, '#FFFFFF', 1, 0);        // white sticker edge
      const parts = d.draw(g);
      // generous invisible hit area so a small finger always catches the sticker
      el('ellipse', { cx: 0, cy: -70, rx: 62, ry: 90, fill: '#000', 'fill-opacity': 0 }, g);
      const dancer = Object.assign({ g, parts, phase: i * 0.5, jump: 0, happyUntil: 0, nextBlink: performance.now() + 1500 + i * 900, blinkUntil: 0 }, d);
      g.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        dancer.jump = 1;
        dancer.happyUntil = performance.now() + 700;
        voice(d.kind);
      });
      return dancer;
    });
    const JUMP = 46;   // in sticker units (before scaling)

    // One dance per animal. b = beats since the song started (0 when quiet),
    // t = seconds, on = music playing and motion allowed, j = jump 0..1.
    // The whole sticker hops and squashes; inside it the animal rocks, nods,
    // lifts its paws and moves ears and tail.
    function poseDancer(d, b, t, on, j) {
      const p = d.parts;
      const s1 = Math.sin(b * Math.PI);          // one swing per two beats
      const s2 = Math.sin(b * Math.PI * 2);      // one swing per beat
      let bob = 0, sway = 0, tilt = 0, legL = 0, legR = 0, earL = 0, earR = 0, tail = 0, squash = 1, wiggle = 0;
      if (d.kind === 'bear') {
        if (on) {
          bob = Math.abs(s1) * 10;
          sway = s1 * 4;
          tilt = -s1 * 7;
          wiggle = s1 * 4;
          legL = Math.max(0, s1); legR = Math.max(0, -s1);
          earL = earR = s2 * 10;
          squash = 1 + s2 * 0.04;
        }
      } else if (d.kind === 'cat') {
        if (on) {
          const hop = Math.abs(s1);
          bob = hop * 16;
          legL = legR = hop * 0.8;
          tilt = Math.sin(b * Math.PI / 2) * 8;
          earL = -Math.pow(Math.max(0, s1), 8) * 18;
          squash = 1 - Math.cos(b * Math.PI * 2) * 0.05;
        }
        tail = Math.sin(t * (on ? 2.2 : 0.9)) * (on ? 14 : 6);
      } else {
        if (on) {
          bob = Math.abs(s1) * 12;
          tilt = s1 * 7;
          wiggle = -s1 * 5;
          legL = Math.max(0, s2); legR = Math.max(0, -s2);
          const flop = Math.sin((b - 0.2) * Math.PI * 2) * 10;
          earL = flop; earR = -flop;
          squash = 1 + s2 * 0.05;
        }
        tail = Math.sin(t * (on ? 22 : 6)) * (on ? 16 : 8);
      }
      if (j > 0.05) { legL = Math.max(legL, j); legR = Math.max(legR, j); }
      if (!on && !reduced) squash = 1 + Math.sin(t * 2 + d.phase * 4) * 0.015;   // breathing
      if (reduced) { tail = 0; wiggle = 0; }

      const lift = (bob + j * JUMP) * d.s;
      d.g.setAttribute('transform', `translate(${d.x} ${(d.y - lift).toFixed(1)}) rotate(${(d.rot + wiggle).toFixed(1)}) scale(${(d.s / squash).toFixed(3)} ${(d.s * squash).toFixed(3)})`);
      p.pose.setAttribute('transform', `rotate(${sway.toFixed(1)} 0 0)`);
      p.head.set(tilt);
      p.legL.set(legL); p.legR.set(legR);
      p.earL.set(earL); p.earR.set(earR);
      if (p.tail) p.tail.set(tail);
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
    let totalBeats = 1;   // length of the current song, for the progress bar

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
      totalBeats = SONGS[station].notes.reduce((a, n) => a + n[1], 0) + 2;
      nextIdx = 0; barIdx = 0;
      nextTime = ac.currentTime + 0.1;
      barTime = nextTime;
      songStart = nextTime;
      clearInterval(timer);
      timer = setInterval(schedule, 40);
    }
    function stop() {
      playing = false;
      clearInterval(timer);
    }

    // Slide the cards to a new song; with fromUser it also starts playing.
    let slideCancel = null;
    function selectStation(i, fromUser) {
      const n = SONGS.length;
      const from = pos;
      let to = i;
      // take the short way round, so the wrap from last to first slides one step
      while (to - from > n / 2) to -= n;
      while (from - to > n / 2) to += n;
      station = ((i % n) + n) % n;
      if (slideCancel) slideCancel();
      if (reduced || !fromUser) { pos = station; layoutCards(); }
      else slideCancel = U.tween(320, U.ease.out, (e) => { pos = from + (to - from) * e; layoutCards(); }, () => { pos = station; layoutCards(); slideCancel = null; });
      if (fromUser) { audio.click(); start(); }
    }
    function go(dir) { selectStation(station + dir, true); }

    cardHit.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      audio.click();
      if (playing) stop(); else start();
    });

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

      // play badge, card pulse, progress
      badge.setAttribute('display', playing ? 'none' : 'inline');
      badge.setAttribute('transform', `translate(${CARD_X} ${CARD_Y})`);
      if (on) cards[station].g.setAttribute('transform', `translate(${CARD_X} ${CARD_Y}) scale(${(1 + pulse * 0.025).toFixed(3)})`);
      const prog = playing ? Math.min(1, Math.max(0, beat) / totalBeats) : 0;
      fill.setAttribute('width', (306 * prog).toFixed(1));
      knob.setAttribute('transform', `translate(${(243 + 292 * prog).toFixed(1)} 317)`);

      // equaliser bars and floating notes
      eq.forEach((r, i) => {
        const h = playing && !reduced
          ? 18 + 70 * Math.abs(Math.sin(beat * Math.PI * (0.5 + i * 0.25) + i)) * (0.5 + pulse * 0.5)
          : 18;
        r.setAttribute('y', (260 - h).toFixed(1));
        r.setAttribute('height', h.toFixed(1));
      });
      notes.forEach((nt) => {
        if (!on) { nt.g.setAttribute('opacity', 0); return; }
        const k = ((beat / 4) + nt.phase) % 1;
        nt.g.setAttribute('opacity', (Math.sin(k * Math.PI) * 0.9).toFixed(2));
        nt.g.setAttribute('transform', `translate(${(nt.x + Math.sin(k * 6) * 6).toFixed(1)} ${(150 - k * 90).toFixed(1)})`);
      });
      rays.forEach((r) => r.setAttribute('opacity', (on ? 0.25 + pulse * 0.75 : 0.25).toFixed(2)));
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        stop();
        if (slideCancel) slideCancel();
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
