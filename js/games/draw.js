// Tekenen (1–6 jaar). A big sheet of paper, a fat round brush, six colours and
// a sponge that wipes the sheet clean with a slow fade. Drawing makes a soft
// crayon rustle so a one-year-old can hear that the hand does something.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const U = KH.util;
  const COLORS = ['#D9574C', '#E8B83A', '#4A7BC9', '#6FA36B', '#8C5BB5', '#3C4A3E'];
  const BRUSH = 22;

  function mount(stage, ctx) {
    const audio = ctx.audio;
    const wrap = U.div('toy-fill', stage);
    wrap.style.background = '#FBF7EE';
    const canvas = document.createElement('canvas');
    canvas.style.touchAction = 'none';
    wrap.appendChild(canvas);
    const g = canvas.getContext('2d');
    g.lineCap = 'round';
    g.lineJoin = 'round';

    // Keep the drawing when the canvas is resized (rotation).
    let snapshot = null;
    const fit = U.fitCanvas(canvas, (w, h) => {
      g.lineCap = 'round'; g.lineJoin = 'round';
      if (snapshot) { g.drawImage(snapshot, 0, 0, w, h); snapshot = null; }
    });
    function keepSnapshot() {
      try {
        const c = document.createElement('canvas');
        c.width = canvas.width; c.height = canvas.height;
        c.getContext('2d').drawImage(canvas, 0, 0);
        snapshot = c;
      } catch (e) { snapshot = null; }
    }
    window.addEventListener('orientationchange', keepSnapshot);

    // Palette
    const palette = U.div('palette', wrap);
    let color = COLORS[0];
    const swatches = COLORS.map((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'swatch';
      b.style.background = c;
      b.setAttribute('aria-label', 'Kleur');
      b.setAttribute('aria-pressed', String(c === color));
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        color = c;
        swatches.forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
        audio.pick();
      });
      palette.appendChild(b);
      return b;
    });
    const sponge = document.createElement('button');
    sponge.type = 'button';
    sponge.className = 'swatch';
    sponge.style.background = '#F2D9B0';
    sponge.setAttribute('aria-label', 'Spons: veeg het blad schoon');
    sponge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="7" width="18" height="11" rx="4" fill="#E8B83A"/><circle cx="8" cy="11" r="1.4" fill="#C9961E"/><circle cx="14" cy="14" r="1.4" fill="#C9961E"/><circle cx="17" cy="10" r="1.2" fill="#C9961E"/></svg>';
    palette.appendChild(sponge);

    let wiping = null;
    sponge.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      if (wiping) return;
      audio.knock(900, 0.25, 0.25);
      const r = canvas.getBoundingClientRect();
      // fade to paper over ~700ms
      wiping = U.tween(700, U.ease.linear, () => {
        g.fillStyle = 'rgba(251, 247, 238, 0.18)';
        g.fillRect(0, 0, r.width, r.height);
      }, () => { g.clearRect(0, 0, r.width, r.height); wiping = null; });
    });

    // Drawing
    let drawing = false, last = null, rustle = 0;
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      drawing = true;
      last = pos(e);
      g.strokeStyle = color;
      g.fillStyle = color;
      g.lineWidth = BRUSH;
      g.beginPath();
      g.arc(last.x, last.y, BRUSH / 2, 0, Math.PI * 2);
      g.fill();
      audio.knock(1200, 0.04, 0.12);
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      const pts = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      g.strokeStyle = color;
      g.lineWidth = BRUSH;
      g.beginPath();
      g.moveTo(last.x, last.y);
      let dist = 0;
      pts.forEach((pe) => {
        const p = pos(pe);
        dist += Math.hypot(p.x - last.x, p.y - last.y);
        g.lineTo(p.x, p.y);
        last = p;
      });
      g.stroke();
      rustle += dist;
      if (rustle > 60) { rustle = 0; audio.knock(2200 + Math.random() * 800, 0.03, 0.06); }
    });
    const up = () => { drawing = false; last = null; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    return {
      destroy() {
        if (wiping) wiping();
        window.removeEventListener('orientationchange', keepSnapshot);
        fit.stop();
        wrap.remove();
      }
    };
  }

  KH.games.push({
    id: 'draw',
    name: 'Tekenen',
    minAge: 1,
    maxAge: 6,
    icon: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="10" y="10" width="80" height="80" rx="14" fill="#FBF7EE" stroke="#E6DCC8" stroke-width="3"/>
      <path d="M24 60 C 34 30, 50 30, 56 50 S 74 72, 80 40" fill="none" stroke="#D9574C" stroke-width="10" stroke-linecap="round"/>
      <circle cx="30" cy="76" r="6" fill="#4A7BC9"/><circle cx="48" cy="76" r="6" fill="#E8B83A"/><circle cx="66" cy="76" r="6" fill="#6FA36B"/>
    </svg>`,
    mount
  });
})();
