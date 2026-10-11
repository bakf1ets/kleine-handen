// Muziekdruppels (1–4 jaar). Tap the dark water and a glowing drop appears
// and sings one soft note; higher on the screen is a higher note. Drag to
// make a run of notes. Drops wobble, drift upward and fade away by themselves.
window.KH = window.KH || {};
KH.games = KH.games || [];

(function () {
  const U = KH.util;
  // C major pentatonic over two octaves, low to high.
  const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0, 1046.5];
  const HUES = [8, 32, 48, 95, 150, 180, 200, 225, 260, 290, 330];
  const LIFE = 7000;

  function mount(stage, ctx) {
    const audio = ctx.audio;
    const reduced = ctx.reducedMotion;
    const wrap = U.div('toy-fill', stage);
    wrap.style.background = 'radial-gradient(ellipse at 50% 30%, #2A4D50 0%, #1B3538 70%, #15292B 100%)';
    const canvas = document.createElement('canvas');
    canvas.style.touchAction = 'none';
    wrap.appendChild(canvas);
    const g = canvas.getContext('2d');
    let w = 1, h = 1;
    const fit = U.fitCanvas(canvas, (nw, nh) => { w = nw; h = nh; });

    const drops = [];
    const ripples = [];
    let raf = 0;

    function noteAt(y) {
      const t = 1 - U.clamp(y / h, 0, 1);
      return Math.min(SCALE.length - 1, Math.floor(t * SCALE.length));
    }

    function spawn(x, y) {
      const n = noteAt(y);
      const now = performance.now();
      drops.push({ x, y, r: 22 + Math.random() * 14, n, born: now, phase: Math.random() * Math.PI * 2, pulse: 0 });
      ripples.push({ x, y, born: now });
      if (drops.length > 36) drops.shift();
      audio.bell(SCALE[n], 1.6, 0.11);
    }

    function hit(x, y) {
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        if (Math.hypot(d.x - x, d.y - y) < d.r + 10) return d;
      }
      return null;
    }

    let down = false, lastX = 0, lastY = 0;
    function pos(e) {
      const r = canvas.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
    canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      down = true;
      const p = pos(e);
      lastX = p.x; lastY = p.y;
      const d = hit(p.x, p.y);
      if (d) {
        // tapping a drop makes it sing again
        d.pulse = 1; d.born = Math.max(d.born, performance.now() - LIFE * 0.4);
        ripples.push({ x: d.x, y: d.y, born: performance.now() });
        audio.bell(SCALE[d.n], 1.6, 0.11);
      } else {
        spawn(p.x, p.y);
      }
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!down) return;
      const p = pos(e);
      if (Math.hypot(p.x - lastX, p.y - lastY) > 52) { lastX = p.x; lastY = p.y; spawn(p.x, p.y); }
    });
    const up = () => { down = false; };
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);

    function frame(now) {
      g.clearRect(0, 0, w, h);

      // ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        const t = Math.max(0, now - rp.born) / 1400;
        if (t >= 1) { ripples.splice(i, 1); continue; }
        g.beginPath();
        g.arc(rp.x, rp.y, 20 + t * 90, 0, Math.PI * 2);
        g.strokeStyle = `rgba(190, 230, 225, ${0.35 * (1 - t)})`;
        g.lineWidth = 2;
        g.stroke();
      }

      // drops
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        // A tap can land after this frame's timestamp, so clamp: a negative age
        // gives a negative radius and createRadialGradient throws, which stops the loop.
        const age = Math.max(0, now - d.born);
        if (age >= LIFE) { drops.splice(i, 1); continue; }
        const life = age / LIFE;
        const appear = Math.min(1, age / 220);
        const fade = life > 0.72 ? 1 - (life - 0.72) / 0.28 : 1;
        if (!reduced) d.y -= 0.12;
        d.pulse *= 0.92;
        const wob = reduced ? 0 : Math.sin(now / 260 + d.phase) * 0.08;
        const rx = d.r * (1 + wob + d.pulse * 0.4) * U.ease.back(appear);
        const ry = d.r * (1 - wob + d.pulse * 0.4) * U.ease.back(appear);
        const hue = HUES[d.n];
        const grad = g.createRadialGradient(d.x - rx * 0.3, d.y - ry * 0.35, 2, d.x, d.y, Math.max(rx, ry));
        grad.addColorStop(0, `hsla(${hue}, 85%, 82%, ${0.95 * fade})`);
        grad.addColorStop(1, `hsla(${hue}, 70%, 55%, ${0.85 * fade})`);
        g.beginPath();
        g.ellipse(d.x, d.y, Math.max(1, rx), Math.max(1, ry), 0, 0, Math.PI * 2);
        g.fillStyle = grad;
        g.shadowColor = `hsla(${hue}, 80%, 65%, ${0.6 * fade})`;
        g.shadowBlur = 24;
        g.fill();
        g.shadowBlur = 0;
        // highlight
        g.beginPath();
        g.ellipse(d.x - rx * 0.35, d.y - ry * 0.4, rx * 0.22, ry * 0.14, -0.5, 0, Math.PI * 2);
        g.fillStyle = `rgba(255,255,255,${0.55 * fade})`;
        g.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    return {
      destroy() {
        cancelAnimationFrame(raf);
        fit.stop();
        wrap.remove();
      }
    };
  }

  KH.games.push({
    id: 'blobs',
    name: 'Muziekdruppels',
    minAge: 1,
    maxAge: 4,
    icon: `<svg viewBox="0 0 100 100" aria-hidden="true">
      <rect x="6" y="6" width="88" height="88" rx="18" fill="#1F3A3D"/>
      <ellipse cx="34" cy="40" rx="15" ry="16" fill="#F0A070"/>
      <ellipse cx="64" cy="62" rx="12" ry="13" fill="#8FD0C8"/>
      <ellipse cx="68" cy="30" rx="9" ry="10" fill="#C9A6E8"/>
      <ellipse cx="30" cy="36" rx="4" ry="2.5" fill="#fff" opacity=".7"/>
    </svg>`,
    mount
  });
})();
