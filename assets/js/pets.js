/* Pets. Toggled only from the console (`pet cat`). They live on the floor of
   the gutters, walk about, sit, and carry on from where they were on the
   previous page. Off on narrow screens; they sit still under reduced motion. */
(function () {
  var c = document.getElementById('pets');
  if (!c) return;
  var ctx = c.getContext('2d');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var KINDS = ['cat', 'dog', 'duck'];
  var KEY = 'kk.pets', SKEY = 'kk.pets.state';
  var pets = [], raf = null, last = 0;

  function gutters() { return window.site && window.site.gutters ? window.site.gutters() : null; }
  function loadKinds() {
    try { return (JSON.parse(localStorage.getItem(KEY)) || []).filter(function (k) { return KINDS.indexOf(k) >= 0; }); }
    catch (e) { return []; }
  }
  function saveKinds(ks) { try { localStorage.setItem(KEY, JSON.stringify(ks)); } catch (e) {} }
  function restore() {
    try { var s = JSON.parse(sessionStorage.getItem(SKEY)); if (s && s.W === window.innerWidth && s.H === window.innerHeight) return s.d; } catch (e) {}
    return null;
  }
  function persist() { try { sessionStorage.setItem(SKEY, JSON.stringify({ W: window.innerWidth, H: window.innerHeight, d: pets })); } catch (e) {} }
  window.addEventListener('pagehide', persist);
  document.addEventListener('visibilitychange', function () { if (document.hidden) persist(); });

  function fit() { c.width = window.innerWidth; c.height = window.innerHeight; }
  function mk(kind, i) {
    var g = gutters(), side = i % 2 ? 'r' : 'l', r = g[side];
    return { kind: kind, side: side, x: r[0] + (r[1] - r[0]) * (0.3 + Math.random() * 0.4),
      dir: Math.random() < 0.5 ? -1 : 1, state: 'idle', timer: 800 + Math.random() * 2000, t: Math.random() * 1000, bob: 0 };
  }
  function sync() {
    var kinds = loadKinds(), g = gutters();
    if (!g || !kinds.length) { pets = []; stop(); ctx.clearRect(0, 0, c.width, c.height); return; }
    var saved = restore() || [];
    pets = kinds.map(function (k, i) {
      var s = saved.filter(function (p) { return p.kind === k; })[0];
      return s || mk(k, i);
    });
    start();
  }
  function start() { if (raf) return; fit(); last = 0; raf = requestAnimationFrame(tick); }
  function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }

  function render(dt) {
    var g = gutters();
    ctx.clearRect(0, 0, c.width, c.height);
    if (!g) return;
    pets.forEach(function (p) { step(p, dt, g); draw(p, g); });
  }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (document.hidden) { last = 0; return; }
    var dt = last ? Math.min(t - last, 100) : 16; last = t;
    render(dt);
  }
  function step(p, dt, g) {
    var r = g[p.side]; p.t += dt; p.timer -= dt;
    if (reduce) { p.state = 'sit'; p.bob = 0; return; }
    if (p.timer <= 0) {
      p.state = p.state === 'walk' ? (Math.random() < 0.5 ? 'idle' : 'sit') : 'walk';
      p.timer = p.state === 'walk' ? 1500 + Math.random() * 3500 : 1200 + Math.random() * 3000;
      if (p.state === 'walk' && Math.random() < 0.4) p.dir *= -1;
    }
    if (p.state === 'walk') {
      var sp = p.kind === 'duck' ? 0.035 : p.kind === 'dog' ? 0.06 : 0.045;
      p.x += p.dir * sp * dt; p.bob = Math.sin(p.t / 90) * 1.5;
    } else p.bob = Math.sin(p.t / 600) * 0.6;
    if (p.x < r[0] + 30) { p.x = r[0] + 30; p.dir = 1; }
    if (p.x > r[1] - 30) { p.x = r[1] - 30; p.dir = -1; }
  }

  function rr(x, y, w, h, rad) {
    ctx.beginPath(); ctx.moveTo(x + rad, y); ctx.arcTo(x + w, y, x + w, y + h, rad); ctx.arcTo(x + w, y + h, x, y + h, rad);
    ctx.arcTo(x, y + h, x, y, rad); ctx.arcTo(x, y, x + w, y, rad); ctx.closePath(); ctx.fill();
  }
  var DRAW = {
    cat: function (p) {
      var col = '#e0913a', dark = '#b8702a', w = p.state === 'walk' ? Math.sin(p.t / 110) * 2 : 0;
      ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-13, -6); ctx.quadraticCurveTo(-22, -8 + Math.sin(p.t / 250) * 3, -19, -17 + Math.sin(p.t / 250) * 2); ctx.stroke();
      ctx.fillStyle = col; rr(-14, p.state === 'sit' ? -8 : -10, 22, p.state === 'sit' ? 8 : 10, 5);
      ctx.beginPath(); ctx.arc(10, -11, 6, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.moveTo(6, -15); ctx.lineTo(7, -21); ctx.lineTo(10, -16); ctx.fill();
      ctx.beginPath(); ctx.moveTo(11, -16); ctx.lineTo(14, -21); ctx.lineTo(14.5, -15); ctx.fill();
      ctx.fillStyle = dark; ctx.fillRect(-10 + w, -1, 3, 3); ctx.fillRect(-4 - w, -1, 3, 3); ctx.fillRect(3 + w, -1, 3, 3);
      ctx.fillStyle = '#1b1b1b'; ctx.fillRect(11, -13, 1.6, 1.6); ctx.fillRect(14, -13, 1.6, 1.6);
      ctx.fillStyle = '#f28ca0'; ctx.fillRect(15, -10, 1.6, 1);
    },
    dog: function (p) {
      var col = '#8b5a2b', dark = '#6b4320', w = p.state === 'walk' ? Math.sin(p.t / 100) * 2.5 : 0;
      ctx.strokeStyle = col; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-15, -8); ctx.lineTo(-21, -15 + Math.sin(p.t / 120) * 3); ctx.stroke();
      ctx.fillStyle = col; rr(-16, -11, 26, 11, 5);
      ctx.beginPath(); ctx.arc(12, -12, 6.5, 0, 6.28); ctx.fill();
      ctx.fillStyle = dark; ctx.beginPath(); ctx.ellipse(8, -9, 2.4, 5, 0.3, 0, 6.28); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(17, -11, 4.5, 3, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = dark; ctx.fillRect(-12 + w, 0, 3.5, 3); ctx.fillRect(-5 - w, 0, 3.5, 3); ctx.fillRect(3 + w, 0, 3.5, 3);
      ctx.fillStyle = '#1b1b1b'; ctx.fillRect(13, -14, 1.8, 1.8); ctx.fillRect(20, -12, 2, 1.8);
      if (p.state !== 'walk') { ctx.fillStyle = '#f28ca0'; ctx.fillRect(18, -8, 2, 3); }
    },
    duck: function (p) {
      var col = '#f5c400', wob = p.state === 'walk' ? Math.sin(p.t / 120) * 0.08 : 0;
      ctx.rotate(wob);
      ctx.fillStyle = '#f08a00'; ctx.fillRect(-6, 0, 4, 2); ctx.fillRect(2, 0, 4, 2);
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(0, -7, 11, 7, 0, 0, 6.28); ctx.fill();
      ctx.beginPath(); ctx.arc(8, -16, 5.5, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#e8b400'; ctx.beginPath(); ctx.ellipse(-3, -7, 6, 4, 0.2, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#f08a00'; ctx.beginPath(); ctx.moveTo(13, -16); ctx.lineTo(19, -14.5); ctx.lineTo(13, -13); ctx.fill();
      ctx.fillStyle = '#1b1b1b'; ctx.fillRect(9.5, -18, 1.6, 1.6);
    }
  };
  function draw(p, g) {
    ctx.save(); ctx.translate(p.x, g.bottom - 14 + p.bob); ctx.scale(1.6 * p.dir, 1.6);
    DRAW[p.kind](p); ctx.restore();
  }

  window.addEventListener('resize', function () { fit(); if (pets.length) sync(); });

  window.site = window.site || {};
  window.site.pets = {
    kinds: KINDS,
    list: loadKinds,
    toggle: function (k) {
      var ks = loadKinds(), i = ks.indexOf(k);
      if (i >= 0) ks.splice(i, 1); else ks.push(k);
      saveKinds(ks); sync(); return i < 0;
    },
    clear: function () { saveKinds([]); sync(); },
    refresh: sync,
    frame: function (dt) { if (!pets.length) sync(); render(dt || 16); } /* one synchronous frame; used for testing */
  };
  sync();
})();
