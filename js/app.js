// App shell: home grid, play screen, parent lock with age filter.
window.KH = window.KH || {};

(function () {
  const VERSION = '0.9.0';
  const HOLD_MS = 2000;

  const $ = (sel) => document.querySelector(sel);
  const home = $('#home');
  const play = $('#play');
  const stage = $('#stage');
  const tiles = $('#tiles');
  const noGames = $('#no-games');
  const settingsSheet = $('#settings');
  const parentBtn = $('#parent-btn');
  const homeBtn = $('#home-btn');
  const ageChips = $('#age-chips');
  const soundToggle = $('#sound-toggle');
  const ageFilterToggle = $('#age-filter-toggle');
  const grainToggle = $('#grain-toggle');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Settings live only on this device.
  const settings = load();
  function load() {
    const def = { age: 2, ageFilter: true, sound: true, grain: true };
    try {
      const raw = localStorage.getItem('kh.settings');
      return raw ? Object.assign(def, JSON.parse(raw)) : def;
    } catch (e) { return def; }
  }
  function save() {
    try { localStorage.setItem('kh.settings', JSON.stringify(settings)); } catch (e) { /* fine */ }
  }

  KH.audio.setEnabled(settings.sound);
  // Watercolour grain on the drawings; parents can switch it off if a phone struggles.
  const applyGrain = () => document.documentElement.classList.toggle('no-grain', !settings.grain);
  applyGrain();
  // iOS only allows sound after a gesture; unlock on the first touch anywhere.
  document.addEventListener('pointerdown', () => KH.audio.unlock(), { capture: true });
  // Ask for landscape. Android honours the manifest and this call; iPhone
  // Safari refuses (it only allows a lock in fullscreen), so there the child
  // turns the phone and the portrait screen shows a picture asking for that.
  let triedLock = false;
  document.addEventListener('pointerdown', () => {
    if (triedLock) return;
    triedLock = true;
    try {
      const o = screen.orientation;
      if (o && o.lock) o.lock('landscape').catch(() => { /* not allowed here: fine */ });
    } catch (e) { /* fine */ }
  }, { capture: true });

  // ---- Home ----
  let current = null;

  function renderHome() {
    tiles.innerHTML = '';
    // The parent can switch the age filter off to show every toy.
    const visible = KH.games.filter((g) => !settings.ageFilter || (settings.age >= g.minAge && settings.age <= g.maxAge))
      .sort((a, b) => a.minAge - b.minAge || a.maxAge - b.maxAge);
    // Rows of four, each centred, so a short last row sits in the middle.
    let row = null;
    visible.forEach((g, i) => {
      if (i % 4 === 0) { row = document.createElement('div'); row.className = 'tile-row'; tiles.appendChild(row); }
      const b = document.createElement('button');
      b.className = 'tile';
      b.type = 'button';
      b.setAttribute('aria-label', g.name);
      b.innerHTML = g.icon + `<span class="label">${g.name}</span>`;
      b.addEventListener('click', () => openGame(g));
      row.appendChild(b);
    });
    noGames.hidden = visible.length > 0;
    noGames.textContent = visible.length ? '' :
      `Er zijn nog geen spelletjes voor ${settings.age} jaar. Houd het slotje ingedrukt om de leeftijd te veranderen.`;
  }

  function openGame(g) {
    closeGame();
    home.hidden = true;
    play.hidden = false;
    current = g.mount(stage, { audio: KH.audio, reducedMotion });
  }

  function closeGame() {
    if (current && current.destroy) current.destroy();
    current = null;
    stage.innerHTML = '';
    play.hidden = true;
    home.hidden = false;
  }

  homeBtn.addEventListener('click', closeGame);

  // ---- Parent lock: hold for two seconds ----
  let holdStart = 0, holdRaf = 0;
  function holdFrame() {
    const p = Math.min(1, (performance.now() - holdStart) / HOLD_MS);
    parentBtn.style.setProperty('--p', p);
    if (p >= 1) { endHold(); openSettings(); return; }
    holdRaf = requestAnimationFrame(holdFrame);
  }
  // A finger is never perfectly still, so the hold only ends when the finger
  // lifts or really slides away (more than 40 px), not on every tiny wobble.
  let holding = false, holdX = 0, holdY = 0;
  function startHold(evt) {
    evt.preventDefault();
    if (holding) return;
    holding = true;
    holdX = evt.clientX; holdY = evt.clientY;
    try { parentBtn.setPointerCapture(evt.pointerId); } catch (e) { /* fine */ }
    holdStart = performance.now();
    parentBtn.classList.add('holding');
    holdRaf = requestAnimationFrame(holdFrame);
  }
  function endHold() {
    holding = false;
    cancelAnimationFrame(holdRaf);
    parentBtn.classList.remove('holding');
    parentBtn.style.setProperty('--p', 0);
  }
  parentBtn.addEventListener('pointerdown', startHold);
  parentBtn.addEventListener('pointermove', (e) => {
    if (holding && Math.hypot(e.clientX - holdX, e.clientY - holdY) > 40) endHold();
  });
  parentBtn.addEventListener('pointerup', endHold);
  parentBtn.addEventListener('pointercancel', endHold);
  // iOS can still decide a long touch is a system gesture; blocking the touch
  // events themselves keeps the hold ours.
  parentBtn.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
  parentBtn.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
  parentBtn.addEventListener('contextmenu', (e) => e.preventDefault());
  // Keyboard users (and parents without touch) get the sheet on Enter/Space.
  parentBtn.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openSettings(); } });

  // ---- Settings sheet ----
  function renderChips() {
    ageChips.innerHTML = '';
    for (let a = 1; a <= 6; a++) {
      const c = document.createElement('button');
      c.type = 'button';
      c.className = 'chip';
      c.textContent = a;
      c.setAttribute('aria-pressed', String(a === settings.age));
      c.setAttribute('aria-label', `${a} jaar`);
      c.addEventListener('click', () => { settings.age = a; save(); renderChips(); renderHome(); });
      ageChips.appendChild(c);
    }
  }
  function openSettings() {
    renderChips();
    ageFilterToggle.checked = settings.ageFilter;
    ageChips.classList.toggle('off', !settings.ageFilter);
    soundToggle.checked = settings.sound;
    grainToggle.checked = settings.grain;
    settingsSheet.hidden = false;
    $('#settings-close').focus();
  }
  ageFilterToggle.addEventListener('change', () => {
    settings.ageFilter = ageFilterToggle.checked;
    ageChips.classList.toggle('off', !settings.ageFilter);
    save();
    renderHome();
  });
  soundToggle.addEventListener('change', () => {
    settings.sound = soundToggle.checked;
    KH.audio.setEnabled(settings.sound);
    save();
    if (settings.sound) KH.audio.pick();
  });
  grainToggle.addEventListener('change', () => {
    settings.grain = grainToggle.checked;
    applyGrain();
    save();
  });
  $('#settings-close').addEventListener('click', () => { settingsSheet.hidden = true; });
  settingsSheet.addEventListener('click', (e) => { if (e.target === settingsSheet) settingsSheet.hidden = true; });
  $('#version').textContent = VERSION;

  // ---- Keep the screen on while the app is open ----
  // Needs a user gesture first; iOS 16.4+ and Android Chrome support it.
  // Re-request after returning from the background, because the lock is released then.
  let wakeLock = null;
  async function keepAwake() {
    if (!('wakeLock' in navigator) || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    } catch (e) { wakeLock = null; /* not allowed or low battery: fine */ }
  }
  document.addEventListener('pointerdown', keepAwake, { capture: true });
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') keepAwake(); });

  // ---- Boot ----
  renderHome();

  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => { /* works without it, just not offline */ });
    });
  }
})();
