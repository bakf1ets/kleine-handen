// Small synthesised sounds (Web Audio). No audio files, so nothing to download
// and nothing that can fail to load offline.
//
// Everything goes through one master chain: a low-pass filter that takes the
// edge off, a gentle compressor so nothing jumps out, and a soft room reverb.
// Pitched notes are a "soft piano": a few sine partials with a quick attack and
// a long, uneven decay, instead of raw oscillators (which sound like a Game Boy).
window.KH = window.KH || {};

KH.audio = (function () {
  let ctx = null;
  let out = null;       // where every sound connects
  let enabled = true;

  function ensure() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!ctx) {
      ctx = new AC();
      buildChain();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function buildChain() {
    const c = ctx;
    out = c.createGain();
    out.gain.value = 1;

    const lp = c.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3200;
    lp.Q.value = 0.5;

    const comp = c.createDynamicsCompressor();
    comp.threshold.value = -22;
    comp.knee.value = 18;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.25;

    const master = c.createGain();
    master.gain.value = 0.7;

    // Reverb: short, dark impulse so it sounds like a small warm room.
    const conv = c.createConvolver();
    conv.buffer = impulse(c, 1.6, 2.8);
    const wet = c.createGain();
    wet.gain.value = 0.28;
    const dry = c.createGain();
    dry.gain.value = 0.85;

    out.connect(lp);
    lp.connect(dry).connect(comp);
    lp.connect(conv).connect(wet).connect(comp);
    comp.connect(master).connect(c.destination);
  }

  function impulse(c, seconds, decay) {
    const rate = c.sampleRate;
    const len = Math.floor(rate * seconds);
    const buf = c.createBuffer(2, len, rate);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      for (let i = 0; i < len; i++) {
        d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
      }
    }
    return buf;
  }

  function now() {
    const c = ensure();
    return c ? c.currentTime : 0;
  }

  // Soft piano / music box tone: fundamental plus a few quiet partials, each
  // with its own decay. `dur` is how long it rings, not how long it is held.
  const PARTIALS = [
    [1, 1.0, 1.0],     // ratio, level, decay factor
    [2, 0.35, 0.6],
    [3, 0.14, 0.4],
    [4.01, 0.06, 0.3]
  ];
  function note(freq, at, dur, type, peak) {
    const c = ensure();
    if (!c || !enabled) return;
    // Keep the bright partials down for high notes so nothing gets shrill.
    const brightness = freq > 700 ? 0.5 : 1;
    PARTIALS.forEach(([ratio, level, decay], i) => {
      if (i > 0 && freq * ratio > 4500) return;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * ratio;
      const lvl = peak * level * (i > 0 ? brightness : 1);
      const d = Math.max(0.08, dur * decay);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(lvl, at + 0.006);
      g.gain.exponentialRampToValueAtTime(lvl * 0.5, at + Math.min(0.12, d * 0.3));
      g.gain.exponentialRampToValueAtTime(0.0001, at + d);
      osc.connect(g).connect(out);
      osc.start(at);
      osc.stop(at + d + 0.05);
    });
  }

  // ---- Instruments ----
  // Each takes (freq, at, dur, peak). They differ in partials, attack and decay,
  // so songs played on different ones sound like different instruments.
  function additive(freq, at, dur, peak, partials, attack, curve) {
    const c = ensure();
    if (!c || !enabled) return;
    partials.forEach(([ratio, level, decay]) => {
      if (freq * ratio > 5000) return;
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq * ratio;
      const lvl = Math.max(0.0002, peak * level);
      const d = Math.max(0.08, dur * decay);
      g.gain.setValueAtTime(0.0001, at);
      g.gain.linearRampToValueAtTime(lvl, at + attack);
      if (curve === 'pluck') g.gain.exponentialRampToValueAtTime(lvl * 0.4, at + attack + Math.min(0.1, d * 0.25));
      if (curve === 'pad') g.gain.setValueAtTime(lvl, at + d * 0.6);
      g.gain.exponentialRampToValueAtTime(0.0001, at + d);
      osc.connect(g).connect(out);
      osc.start(at);
      osc.stop(at + d + 0.05);
    });
  }
  const INSTRUMENTS = {
    // the default: soft piano
    piano:    (f, t, d, p) => additive(f, t, d, p, [[1, 1, 1], [2, 0.35, 0.6], [3, 0.14, 0.4], [4.01, 0.06, 0.3]], 0.006, 'pluck'),
    // music box: bright, bell-like partials, long ring
    musicbox: (f, t, d, p) => additive(f, t, d * 1.6, p * 0.8, [[1, 1, 1], [2.76, 0.3, 0.5], [5.4, 0.12, 0.3], [8.9, 0.04, 0.2]], 0.004, 'pluck'),
    // marimba: hollow wooden, short
    marimba:  (f, t, d, p) => additive(f, t, Math.min(d, 0.5), p * 1.1, [[1, 1, 1], [3.9, 0.25, 0.35], [9.2, 0.05, 0.2]], 0.004, 'pluck'),
    // flute-ish: slow attack, nearly pure, steady
    flute:    (f, t, d, p) => additive(f, t, d, p * 0.9, [[1, 1, 1], [2, 0.12, 1], [3, 0.04, 1]], 0.06, 'pad'),
    // harp / nylon guitar pluck
    harp:     (f, t, d, p) => additive(f, t, d * 1.2, p, [[1, 1, 1], [2, 0.5, 0.5], [3, 0.25, 0.35], [4, 0.12, 0.25], [5, 0.05, 0.2]], 0.003, 'pluck'),
    // warm organ: steady, odd partials
    organ:    (f, t, d, p) => additive(f, t, d, p * 0.7, [[1, 1, 1], [2, 0.5, 1], [3, 0.3, 1], [4, 0.2, 1]], 0.03, 'pad'),
    // toy xylophone: bright and short
    xylo:     (f, t, d, p) => additive(f, t, Math.min(d, 0.6), p, [[1, 1, 1], [2.9, 0.4, 0.5], [6.2, 0.15, 0.3]], 0.003, 'pluck')
  };

  // A short burst of filtered noise: clicks, knocks, taps.
  function knock(freq, dur, peak) {
    const c = ensure();
    if (!c || !enabled) return;
    const len = Math.floor(c.sampleRate * dur);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.5);
    const src = c.createBufferSource();
    src.buffer = buf;
    const bp = c.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = Math.min(freq, 2400);
    bp.Q.value = 1.2;
    const g = c.createGain();
    g.gain.value = peak;
    src.connect(bp).connect(g).connect(out);
    src.start();
  }

  function bell(freq, dur, peak) {
    note(freq, now(), dur, 'sine', peak);
  }

  return {
    context: ensure,
    // The node every toy-made sound should connect to (goes through the master chain).
    output() { ensure(); return out; },
    // One pitched note at a given time, on a named instrument (default: piano).
    noteAt(freq, at, dur, peak, instrument) { (INSTRUMENTS[instrument] || INSTRUMENTS.piano)(freq, at, dur, peak); },
    instruments: Object.keys(INSTRUMENTS),
    // Soft brushed percussion for accompaniments.
    shakerAt(at, peak) {
      const c = ensure();
      if (!c || !enabled) return;
      const len = Math.floor(c.sampleRate * 0.06);
      const buf = c.createBuffer(1, len, c.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const src = c.createBufferSource();
      src.buffer = buf;
      const hp = c.createBiquadFilter();
      hp.type = 'highpass'; hp.frequency.value = 1800;
      const g = c.createGain(); g.gain.value = peak;
      src.connect(hp).connect(g).connect(out);
      src.start(at);
    },
    tone(freq, dur, type, peak) { note(freq, now(), dur, 'sine', peak || 0.1); },
    bell,
    knock,
    click() { knock(1400, 0.05, 0.3); },
    tick() { knock(2000, 0.03, 0.14); },
    thud() { knock(220, 0.12, 0.5); },
    ding() { note(1046.5, now(), 1.4, 'sine', 0.11); },
    boop() { note(392, now(), 0.3, 'sine', 0.12); },
    creak() { knock(600, 0.18, 0.12); },
    unlock: ensure,
    setEnabled(v) { enabled = !!v; },
    isEnabled() { return enabled; },

    pick() { note(660, now(), 0.25, 'sine', 0.06); },
    put() { note(330, now(), 0.3, 'sine', 0.05); },
    good() {
      const t = now();
      [523.25, 659.25, 783.99].forEach((f, i) => note(f, t + i * 0.09, 0.9, 'sine', 0.12));
    },
    soft() { note(196, now(), 0.5, 'sine', 0.07); },
    done() {
      const t = now();
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => note(f, t + i * 0.11, 1.4, 'sine', 0.1));
    }
  };
})();
