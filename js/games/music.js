// Muziekhoek (1–6 jaar). Eight big coloured keys (pentatonic, so any
// combination sounds fine), a drum, a cymbal, a shaker and a bell. The little
// dial switches the keys between instruments. Several fingers at once are fine.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const U = KH.util;
  const W = 780, H = 400;   // landscape: percussion left, keys right
  const KEYS = [
    { n: 'C4', f: 261.63, c: '#D9574C' }, { n: 'D4', f: 293.66, c: '#E8894A' },
    { n: 'E4', f: 329.63, c: '#E8B83A' }, { n: 'G4', f: 392.00, c: '#6FA36B' },
    { n: 'A4', f: 440.00, c: '#4A9CC9' }, { n: 'C5', f: 523.25, c: '#4A7BC9' },
    { n: 'D5', f: 587.33, c: '#8C5BB5' }, { n: 'E5', f: 659.25, c: '#C95B9C' }
  ];
  const INSTS = [
    { id: 'piano', name: 'Piano', color: '#3C4A3E' },
    { id: 'musicbox', name: 'Muziekdoos', color: '#C9961E' },
    { id: 'xylo', name: 'Xylofoon', color: '#D9574C' },
    { id: 'flute', name: 'Fluit', color: '#4A9CC9' },
    { id: 'organ', name: 'Orgel', color: '#8C5BB5' }
  ];

  function mount(stage, ctx) {
    const audio = ctx.audio;
    const reduced = ctx.reducedMotion;
    const el = U.el;
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'xMidYMid meet' }, stage);
    const defs = el('defs', {}, svg);
    const f = el('filter', { id: 'mshadow', x: '-20%', y: '-20%', width: '140%', height: '160%' }, defs);
    el('feDropShadow', { dx: 0, dy: 3, stdDeviation: 2.5, 'flood-color': '#3C4A3E', 'flood-opacity': 0.22 }, f);

    el('rect', { x: 20, y: 20, width: 740, height: 360, rx: 30, fill: '#F2D9B0', 'fill-opacity': 0.55 }, svg);

    const cancels = [];
    const sparkLayer = el('g', {}, svg);
    function burst(x, y, color) {
      if (reduced) return;
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2, dist = 30 + Math.random() * 30;
        const dot = el('circle', { cx: x, cy: y, r: 4, fill: color }, sparkLayer);
        cancels.push(U.tween(450, U.ease.out, (e) => {
          dot.setAttribute('cx', x + Math.cos(a) * dist * e);
          dot.setAttribute('cy', y + Math.sin(a) * dist * e - 20 * e);
          dot.setAttribute('opacity', 1 - e);
        }, () => dot.remove()));
      }
    }
    function bounce(g, x, y, amount, ms) {
      if (reduced) return;
      cancels.push(U.tween(ms || 260, U.ease.out, (e) => {
        const s = 1 + amount * (1 - e) * Math.sin(e * Math.PI);
        g.setAttribute('transform', `translate(${x} ${y}) scale(${s})`);
      }, () => g.setAttribute('transform', `translate(${x} ${y})`)));
    }
    function hold(fn) {
      // run fn on pointerdown; nothing on move so a finger sliding across keys plays each one once
      return (e) => { e.preventDefault(); fn(e); };
    }

    // ---- Percussion row ----
    const percY = 100;
    // Drum
    (function drum(x, y) {
      const g = el('g', { transform: `translate(${x} ${y})`, filter: 'url(#mshadow)' }, svg);
      el('ellipse', { cy: 22, rx: 46, ry: 16, fill: '#A84A40' }, g);
      el('rect', { x: -46, y: -14, width: 92, height: 36, fill: '#D9574C' }, g);
      el('ellipse', { cy: -14, rx: 46, ry: 16, fill: '#F7F3EA', stroke: '#C9B79C', 'stroke-width': 3 }, g);
      g.addEventListener('pointerdown', hold(() => {
        audio.knock(160, 0.18, 0.6);
        audio.tone(90, 0.25, 'sine', 0.2);
        bounce(g, x, y, 0.08, 220);
        burst(x, y - 14, '#D9574C');
      }));
    })(100, percY);
    // Cymbal
    (function cymbal(x, y) {
      const g = el('g', { transform: `translate(${x} ${y})`, filter: 'url(#mshadow)' }, svg);
      el('rect', { x: -3, y: -4, width: 6, height: 48, fill: '#9C9A94' }, g);
      el('ellipse', { rx: 48, ry: 14, fill: '#E8B83A', stroke: '#C9961E', 'stroke-width': 3 }, g);
      el('circle', { r: 7, fill: '#C9961E' }, g);
      g.addEventListener('pointerdown', hold(() => {
        audio.knock(2400, 0.5, 0.25);
        audio.knock(900, 0.3, 0.12);
        if (!reduced) cancels.push(U.tween(500, U.ease.linear, (e) => g.setAttribute('transform', `translate(${x} ${y}) rotate(${Math.sin(e * Math.PI * 6) * 6 * (1 - e)})`), () => g.setAttribute('transform', `translate(${x} ${y})`)));
        burst(x, y, '#E8B83A');
      }));
    })(232, percY);
    // Shaker
    (function shaker(x, y) {
      const g = el('g', { transform: `translate(${x} ${y})`, filter: 'url(#mshadow)' }, svg);
      el('rect', { x: -14, y: -40, width: 28, height: 52, rx: 14, fill: '#6FA36B' }, g);
      el('rect', { x: -6, y: 8, width: 12, height: 30, rx: 6, fill: '#8E6232' }, g);
      el('circle', { cx: -4, cy: -24, r: 3, fill: '#F7F3EA', 'fill-opacity': 0.5 }, g);
      g.addEventListener('pointerdown', hold(() => {
        const c = audio.context();
        const t = c ? c.currentTime : 0;
        audio.shakerAt(t, 0.25); audio.shakerAt(t + 0.09, 0.15);
        if (!reduced) cancels.push(U.tween(260, U.ease.linear, (e) => g.setAttribute('transform', `translate(${x + Math.sin(e * Math.PI * 8) * 6 * (1 - e)} ${y})`), () => g.setAttribute('transform', `translate(${x} ${y})`)));
      }));
    })(100, percY + 140);
    // Bell
    (function bell(x, y) {
      const g = el('g', { transform: `translate(${x} ${y})`, filter: 'url(#mshadow)' }, svg);
      el('path', { d: 'M -22 14 C -22 -12, -14 -30, 0 -30 C 14 -30, 22 -12, 22 14 Z', fill: '#4A9CC9', stroke: '#3B7BA3', 'stroke-width': 3 }, g);
      el('rect', { x: -26, y: 12, width: 52, height: 8, rx: 4, fill: '#3B7BA3' }, g);
      el('circle', { cy: 22, r: 5, fill: '#F7F3EA' }, g);
      g.addEventListener('pointerdown', hold(() => {
        audio.noteAt(1318.5, audio.context().currentTime, 2.2, 0.1, 'musicbox');
        if (!reduced) cancels.push(U.tween(700, U.ease.linear, (e) => g.setAttribute('transform', `translate(${x} ${y}) rotate(${Math.sin(e * Math.PI * 5) * 14 * (1 - e)} 0 -30)`), () => g.setAttribute('transform', `translate(${x} ${y})`)));
        burst(x, y - 10, '#4A9CC9');
      }));
    })(232, percY + 136);

    // ---- Instrument dial ----
    let inst = 0;
    const dial = el('g', { transform: 'translate(166 340)' }, svg);
    const dialBg = el('rect', { x: -70, y: -20, width: 140, height: 40, rx: 20, fill: INSTS[0].color }, dial);
    const dialText = el('text', { 'text-anchor': 'middle', y: 6, fill: '#F7F3EA', 'font-family': 'Nunito, sans-serif', 'font-weight': 800, 'font-size': 16, 'pointer-events': 'none' }, dial);
    dialText.textContent = INSTS[0].name;
    dial.addEventListener('pointerdown', hold(() => {
      inst = (inst + 1) % INSTS.length;
      dialBg.setAttribute('fill', INSTS[inst].color);
      dialText.textContent = INSTS[inst].name;
      audio.click();
      audio.noteAt(523.25, audio.context().currentTime, 0.8, 0.1, INSTS[inst].id);
      bounce(dial, 166, 340, 0.06, 200);
    }));

    // ---- Keys ----
    const keyTop = 44, keyH = 312, keyW = 50, gap = 4;
    const totalW = KEYS.length * keyW + (KEYS.length - 1) * gap;
    const keyX0 = 318;
    const keys = KEYS.map((k, i) => {
      const x = keyX0 + i * (keyW + gap);
      const g = el('g', {}, svg);
      const r = el('rect', { x, y: keyTop, width: keyW, height: keyH, rx: 14, fill: k.c, filter: 'url(#mshadow)' }, g);
      el('circle', { cx: x + keyW / 2, cy: keyTop + keyH - 28, r: 9, fill: '#fff', 'fill-opacity': 0.5, 'pointer-events': 'none' }, g);
      let lit = null;
      function play() {
        const c = audio.context();
        audio.noteAt(k.f, c ? c.currentTime : 0, 1.4, 0.16, INSTS[inst].id);
        if (lit) lit();
        r.setAttribute('fill', '#F7F3EA');
        lit = U.tween(220, U.ease.out, (e) => {
          r.setAttribute('y', keyTop + 6 * (1 - e));
          r.setAttribute('height', keyH - 6 * (1 - e));
        }, () => { lit = null; });
        setTimeout(() => r.setAttribute('fill', k.c), 120);
        burst(x + keyW / 2, keyTop + 40, k.c);
      }
      return { play };
    });

    // Keys are played by position, so a finger sliding sideways plays a glissando
    // and several fingers can each hold their own key.
    const lastKey = new Map();
    function keyAt(p) {
      if (p.y < keyTop || p.y > keyTop + keyH) return -1;
      const i = Math.floor((p.x - keyX0) / (keyW + gap));
      return i >= 0 && i < KEYS.length ? i : -1;
    }
    svg.addEventListener('pointerdown', (e) => {
      const i = keyAt(U.svgPoint(svg, e));
      lastKey.set(e.pointerId, i);
      if (i >= 0) { e.preventDefault(); keys[i].play(); }
    });
    svg.addEventListener('pointermove', (e) => {
      if (!lastKey.has(e.pointerId)) return;
      const i = keyAt(U.svgPoint(svg, e));
      if (i === lastKey.get(e.pointerId)) return;
      lastKey.set(e.pointerId, i);
      if (i >= 0) keys[i].play();
    });
    const clear = (e) => lastKey.delete(e.pointerId);
    svg.addEventListener('pointerup', clear);
    svg.addEventListener('pointercancel', clear);

    return {
      destroy() {
        cancels.forEach((c) => c());
        svg.remove();
      }
    };
  }

  KH.games.push({
    id: 'music',
    name: 'Muziekhoek',
    minAge: 1,
    maxAge: 6,
    icon: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <g>
        <rect x="12" y="40" width="10" height="50" rx="3" fill="#D9574C"/>
        <rect x="24" y="40" width="10" height="50" rx="3" fill="#E8B83A"/>
        <rect x="36" y="40" width="10" height="50" rx="3" fill="#6FA36B"/>
        <rect x="48" y="40" width="10" height="50" rx="3" fill="#4A9CC9"/>
        <rect x="60" y="40" width="10" height="50" rx="3" fill="#8C5BB5"/>
        <rect x="72" y="40" width="10" height="50" rx="3" fill="#C95B9C"/>
      </g>
      <ellipse cx="30" cy="20" rx="16" ry="7" fill="#F7F3EA" stroke="#C9B79C" stroke-width="2"/>
      <rect x="14" y="20" width="32" height="10" fill="#D9574C"/>
      <ellipse cx="70" cy="22" rx="16" ry="5" fill="#E8B83A"/>
    </svg>`,
    mount
  });
})();
