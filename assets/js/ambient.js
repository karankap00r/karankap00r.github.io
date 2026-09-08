/* Ambient margin art. Each theme may register one effect that lives in the
   gutters either side of the content column: behind the text, never over it,
   only on wide viewports, still (or absent) under reduced motion. Effects
   save their state on page exit and resume on the next page. */
(function () {
  var root = document.documentElement;
  var host = document.getElementById('ambient');
  var ui = document.getElementById('ambient-ui');
  if (!host || !ui) return;

  var COL = 680, PAD = 24, MIN = 120;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var paused = false;

  /* Body padding is how a docked console reserves space; gutters respect it. */
  function insets() {
    var cs = getComputedStyle(document.body);
    return { l: parseFloat(cs.paddingLeft) || 0, r: parseFloat(cs.paddingRight) || 0,
             t: parseFloat(cs.paddingTop) || 0, b: parseFloat(cs.paddingBottom) || 0 };
  }
  function gutters() {
    var i = insets(), W = window.innerWidth - i.l - i.r, g = Math.floor((W - COL) / 2) - PAD;
    if (g < MIN) return null;
    return { w: g, l: [i.l, i.l + g], r: [i.l + W - g, i.l + W], top: i.t, bottom: window.innerHeight - i.b };
  }
  function cssVar(n) { return getComputedStyle(root).getPropertyValue(n).trim(); }
  function randIn(g) {
    return Math.random() < 0.5 ? g.l[0] + Math.random() * (g.l[1] - g.l[0]) : g.r[0] + Math.random() * (g.r[1] - g.r[0]);
  }
  function inGutter(x, g) { return (x >= g.l[0] && x <= g.l[1]) || (x >= g.r[0] && x <= g.r[1]); }
  function canvas() {
    var c = document.createElement('canvas'); host.appendChild(c);
    function fit() { c.width = window.innerWidth; c.height = window.innerHeight; }
    fit();
    return { c: c, ctx: c.getContext('2d'), fit: fit };
  }
  function loop(fn, fps) {
    var raf, last = 0, on = true;
    function tick(t) {
      if (!on) return;
      raf = requestAnimationFrame(tick);
      if (document.hidden || paused) { last = 0; return; }
      if (last && t - last < 1000 / fps) return;
      var dt = last ? Math.min(t - last, 100) : 1000 / fps;
      last = t; fn(dt);
    }
    raf = requestAnimationFrame(tick);
    return function () { on = false; cancelAnimationFrame(raf); };
  }
  function onResize(fn) { window.addEventListener('resize', fn); return function () { window.removeEventListener('resize', fn); }; }

  /* ---- continuity across pages: sessionStorage, keyed by theme ---- */
  var savers = [];
  function store(key) {
    var k = 'kk.amb.' + key;
    return {
      load: function () {
        try { var s = JSON.parse(sessionStorage.getItem(k)); return s && s.W === window.innerWidth && s.H === window.innerHeight ? s.d : null; }
        catch (e) { return null; }
      },
      save: function (d) { try { sessionStorage.setItem(k, JSON.stringify({ W: window.innerWidth, H: window.innerHeight, d: d })); } catch (e) {} }
    };
  }
  function persist(fn) { savers.push(fn); return function () { var i = savers.indexOf(fn); if (i >= 0) savers.splice(i, 1); }; }
  function saveAll() { savers.forEach(function (f) { try { f(); } catch (e) {} }); }
  window.addEventListener('pagehide', saveAll);
  document.addEventListener('visibilitychange', function () { if (document.hidden) saveAll(); });

  /* ---- generators: mount(key) -> unmount() | { unmount, on } ---- */

  function drift(o) {
    return function (key) {
      if (reduce) return null;
      var k = canvas(), g = gutters(), st = store(key), S = st.load() || { ps: [], t: 0 };
      function spawn(top) {
        var s = o.size || 8, span = g.bottom - g.top;
        /* first fill spreads across the visible height, so nothing is empty on arrival */
        return { x: randIn(g), y: top ? g.top - 20 : g.top + Math.random() * span,
          r: s * (0.6 + Math.random() * 0.8), a: Math.random() * 6.28, va: (Math.random() - 0.5) * 0.04,
          vy: (o.speed || 1) * (0.6 + Math.random() * 0.8), sw: Math.random() * 6.28 };
      }
      while (S.ps.length < o.n) S.ps.push(spawn(false));
      var stop = loop(function (dt) {
        S.t += dt;
        var ctx = k.ctx, f = dt / 16; ctx.clearRect(0, 0, k.c.width, k.c.height);
        ctx.fillStyle = o.color; ctx.strokeStyle = o.color;
        S.ps.forEach(function (p) {
          p.y += p.vy * f;
          if (o.sway !== 0) p.x += Math.sin(S.t / 1200 + p.sw) * 0.4 * f;
          p.a += p.va * f;
          if (p.y > g.bottom + 20) { var n = spawn(true); for (var q in n) p[q] = n[q]; }
          if (!inGutter(p.x, g)) return;
          ctx.save(); ctx.translate(p.x, p.y); if (o.sway !== 0) ctx.rotate(p.a);
          ctx.globalAlpha = o.alpha || 0.8; o.draw(ctx, p.r); ctx.restore();
        });
      }, 30);
      var offP = persist(function () { st.save(S); });
      var offR = onResize(function () { k.fit(); g = gutters() || g; });
      return function () { stop(); offP(); offR(); };
    };
  }
  var petal = function (ctx, r) {
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * 0.55, 0, 0, 6.28); ctx.fill();
    ctx.beginPath(); ctx.ellipse(r * 0.5, 0, r * 0.55, r * 0.35, 0, 0, 6.28); ctx.fill();
  };
  var clover = function (ctx, r) {
    [[0, -r * 0.55], [-r * 0.5, r * 0.3], [r * 0.5, r * 0.3]].forEach(function (c) {
      ctx.beginPath(); ctx.arc(c[0], c[1], r * 0.55, 0, 6.28); ctx.fill();
    });
    ctx.fillRect(-r * 0.08, r * 0.2, r * 0.16, r * 0.9);
  };
  var flake = function (ctx, r) { ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, 6.28); ctx.fill(); };
  var streak = function (ctx, r) { ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, r * 2.2); ctx.stroke(); };

  function stars(o) {
    return function (key) {
      var k = canvas(), g = gutters(), st = store(key), S = st.load() || { st: [], t: 0 };
      var col = cssVar('--text') || '#fff';
      var hyper = null, nextJump = o.hyper ? 15000 + Math.random() * 20000 : Infinity;
      function jump() {
        if (reduce || hyper) return;
        hyper = { t: 0, dur: 1800 };
        if (window.site && window.site.sound) window.site.sound.trigger('jump');
      }
      while (S.st.length < o.n) S.st.push({ x: randIn(g), y: g.top + Math.random() * (g.bottom - g.top),
        r: 0.5 + Math.random() * 1.2, ph: Math.random() * 6.28, sp: 0.5 + Math.random() });
      function draw(dt) {
        S.t += dt || 0;
        if (o.hyper && dt) {
          nextJump -= dt; if (nextJump <= 0) { jump(); nextJump = 25000 + Math.random() * 25000; }
          if (hyper) { hyper.t += dt; if (hyper.t >= hyper.dur) hyper = null; }
        }
        var ctx = k.ctx; ctx.clearRect(0, 0, k.c.width, k.c.height); ctx.fillStyle = col; ctx.strokeStyle = col;
        var cx = window.innerWidth / 2, cy = (g.top + g.bottom) / 2;
        var stretch = hyper ? Math.sin(Math.PI * hyper.t / hyper.dur) : 0;   /* 0 → 1 → 0: the jump to lightspeed */
        S.st.forEach(function (s) {
          if (!inGutter(s.x, g)) return;
          var tw = reduce ? 0.6 : 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(S.t / 900 * s.sp + s.ph));
          if (stretch > 0.02) {
            var dx = s.x - cx, dy = s.y - cy, d = Math.sqrt(dx * dx + dy * dy) || 1;
            var len = stretch * (40 + d * 0.35);
            ctx.globalAlpha = Math.min(1, tw + stretch * 0.6); ctx.lineWidth = s.r;
            ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x + dx / d * len, s.y + dy / d * len); ctx.stroke();
            return;
          }
          ctx.globalAlpha = tw;
          ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
        });
        if (o.moon) {
          var mx = g.r[0] + g.w * 0.5, my = g.top + (g.bottom - g.top) * 0.18, mr = Math.min(28, g.w * 0.18);
          ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(mx, my, mr, 0, 6.28); ctx.fill();
          ctx.fillStyle = cssVar('--bg'); ctx.beginPath(); ctx.arc(mx + mr * 0.45, my - mr * 0.15, mr * 0.85, 0, 6.28); ctx.fill();
          ctx.fillStyle = col;
        }
      }
      var stop = reduce ? (draw(0), function () {}) : loop(draw, o.hyper ? 30 : 12);
      var offP = persist(function () { st.save(S); });
      var offR = onResize(function () { k.fit(); g = gutters() || g; draw(0); });
      return { unmount: function () { stop(); offP(); offR(); }, on: { jump: jump } };
    };
  }

  function gutterRain() {
    return function (key) {
      if (reduce) return null;
      var k = canvas(), g = gutters(), st = store(key), S = st.load() || { drops: [] }, fs = 14;
      var chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789';
      var stop = loop(function () {
        var ctx = k.ctx, cols = Math.floor(k.c.width / fs);
        while (S.drops.length < cols) S.drops.push(Math.random() * -60);
        var m = getComputedStyle(document.body).backgroundColor.match(/\d+/g) || [0, 0, 0];
        ctx.fillStyle = 'rgba(' + m[0] + ',' + m[1] + ',' + m[2] + ',0.1)';
        ctx.fillRect(0, 0, k.c.width, k.c.height);
        ctx.fillStyle = cssVar('--text-muted'); ctx.font = fs + 'px monospace';
        for (var i = 0; i < cols; i++) {
          var x = i * fs;
          if (!inGutter(x, g)) continue;
          ctx.fillText(chars[Math.floor(Math.random() * chars.length)], x, S.drops[i] * fs);
          if (S.drops[i] * fs > g.bottom && Math.random() > 0.975) S.drops[i] = 0;
          S.drops[i]++;
        }
      }, 24);
      var offP = persist(function () { st.save(S); });
      var offR = onResize(function () { k.fit(); g = gutters() || g; });
      return function () { stop(); offP(); offR(); };
    };
  }

  function skyline() {
    return function (key) {
      var k = canvas(), g = gutters(), st = store(key), S = st.load() || { seed: 1 }, timer;
      function rnd() { S.seed = (S.seed * 1664525 + 1013904223) % 4294967296; return S.seed / 4294967296; }
      function draw() {
        var ctx = k.ctx; ctx.clearRect(0, 0, k.c.width, k.c.height);
        var base = g.bottom, bcol = cssVar('--bg-deep'), win = cssVar('--accent');
        var rs = S.seed; /* buildings are fixed; only windows vary per pass */
        [g.l, g.r].forEach(function (r) {
          var x = r[0], seed = Math.floor(r[0]) + 7;
          while (x < r[1] - 6) {
            var w = 14 + ((seed * 9301 + 49297) % 233) % 26, h = 40 + ((seed * 233 + 17) % 1000) % 140; seed++;
            ctx.fillStyle = bcol; ctx.fillRect(x, base - h, w, h);
            ctx.fillStyle = win;
            for (var wy = base - h + 6; wy < base - 6; wy += 9)
              for (var wx = x + 3; wx < x + w - 3; wx += 7)
                if (rnd() < 0.35) { ctx.globalAlpha = 0.55; ctx.fillRect(wx, wy, 3, 4); }
            ctx.globalAlpha = 1; x += w + 3;
          }
        });
        S.seed = rs; S.last = S.seed;
      }
      draw();
      if (!reduce) timer = setInterval(function () { if (!document.hidden && !paused) { S.seed = (S.seed + 1) % 4294967296; draw(); } }, 5000);
      var offP = persist(function () { st.save(S); });
      var offR = onResize(function () { k.fit(); g = gutters() || g; draw(); });
      return function () { clearInterval(timer); offP(); offR(); };
    };
  }

  function storm() {
    return function (key) {
      if (reduce) return null;
      var k = canvas(), g = gutters(), st = store(key), S = st.load() || { ps: [], t: 0, next: 4000 };
      var flash = 0, bolt = null;
      function spawn(top) {
        return { x: randIn(g), y: top ? g.top - 20 : g.top + Math.random() * (g.bottom - g.top),
          r: 5 + Math.random() * 5, vy: 7 + Math.random() * 5 };
      }
      while (S.ps.length < 90) S.ps.push(spawn(false));
      function strike() {
        var side = Math.random() < 0.5 ? g.l : g.r, x = side[0] + (side[1] - side[0]) * (0.3 + Math.random() * 0.4);
        var pts = [[x, g.top]], y = g.top, floor = g.top + (g.bottom - g.top) * 0.6;
        while (y < floor) { y += 18 + Math.random() * 30; x += (Math.random() - 0.5) * 36; pts.push([x, y]); }
        bolt = { pts: pts, ttl: 240 }; flash = 1;
        if (window.site && window.site.sound) window.site.sound.trigger('thunder');
      }
      var stop = loop(function (dt) {
        S.t += dt; S.next -= dt;
        if (S.next <= 0) { strike(); S.next = 7000 + Math.random() * 9000; }
        var ctx = k.ctx, f = dt / 16; ctx.clearRect(0, 0, k.c.width, k.c.height);
        if (flash > 0) {
          ctx.fillStyle = 'rgba(200,214,255,' + (0.16 * flash).toFixed(3) + ')';
          ctx.fillRect(g.l[0], g.top, g.l[1] - g.l[0], g.bottom - g.top);
          ctx.fillRect(g.r[0], g.top, g.r[1] - g.r[0], g.bottom - g.top);
          flash -= dt / 260;
        }
        ctx.strokeStyle = 'rgba(184,201,255,0.45)'; ctx.lineWidth = 1;
        S.ps.forEach(function (p) {
          p.y += p.vy * f;
          if (p.y > g.bottom + 20) { var n = spawn(true); for (var q in n) p[q] = n[q]; }
          if (!inGutter(p.x, g)) return;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - 1, p.y + p.r * 2.2); ctx.stroke();
        });
        if (bolt) {
          ctx.strokeStyle = '#eaf0ff'; ctx.lineWidth = 2; ctx.shadowColor = '#b8c9ff'; ctx.shadowBlur = 14;
          ctx.beginPath(); bolt.pts.forEach(function (p, i) { i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke();
          ctx.shadowBlur = 0; bolt.ttl -= dt; if (bolt.ttl <= 0) bolt = null;
        }
      }, 30);
      var offP = persist(function () { st.save(S); });
      var offR = onResize(function () { k.fit(); g = gutters() || g; });
      return { unmount: function () { stop(); offP(); offR(); }, on: { bolt: strike } };
    };
  }

  function lineNumbers() {
    return function () {
      var g = gutters(), d = document.createElement('div'); d.className = 'amb-lines'; host.appendChild(d);
      function draw() {
        g = gutters() || g; var n = Math.ceil((g.bottom - g.top) / 20) + 1, s = '';
        for (var i = 1; i <= n; i++) s += i + '\n';
        d.textContent = s; d.style.left = g.l[0] + 'px'; d.style.top = g.top + 'px'; d.style.width = g.w + 'px';
      }
      draw();
      return onResize(draw);
    };
  }

  function webring() {
    return function () {
      var nav = Array.prototype.slice.call(document.querySelectorAll('.site-nav a'));
      if (!nav.length) return null;
      var i = Math.max(0, nav.findIndex(function (a) { return a.classList.contains('is-active'); }));
      var prev = nav[(i - 1 + nav.length) % nav.length], next = nav[(i + 1) % nav.length];
      var others = nav.filter(function (_, j) { return j !== i; });
      var rnd = others[Math.floor(Math.random() * others.length)] || next;
      var g = gutters(), d = document.createElement('div'); d.className = 'amb-webring';
      d.innerHTML = '<b>Personal Homepage WebRing</b><br>' +
        '[ <a href="' + prev.getAttribute('href') + '">prev</a> ] ' +
        '[ <a href="' + rnd.getAttribute('href') + '">random</a> ] ' +
        '[ <a href="' + next.getAttribute('href') + '">next</a> ]' +
        '<br><small>member #1,024 · est. 1998</small>';
      d.style.right = (window.innerWidth - g.r[1] + 16) + 'px';
      ui.appendChild(d);
      return function () {};
    };
  }

  function counter() {
    return function () {
      var n = 0;
      try { n = parseInt(localStorage.getItem('kk.visits') || '0', 10) + 1; localStorage.setItem('kk.visits', String(n)); } catch (e) {}
      var digits = ('000000' + (41 + n)).slice(-6);
      var g = gutters(), d = document.createElement('div'); d.className = 'amb-counter';
      d.innerHTML = '<div class="amb-new">★ NEW! ★</div><div>You are visitor</div><div class="amb-digits">' +
        digits.split('').map(function (c) { return '<span>' + c + '</span>'; }).join('') +
        '</div><div class="amb-small">Best viewed in Netscape Navigator 4.0<br>at 800×600</div>';
      d.style.left = (g.l[0] + 16) + 'px';
      host.appendChild(d);
      return function () {};
    };
  }

  var FX = {
    'valentines-day':  drift({ n: 30, color: '#e8517f', draw: petal, size: 9 }),
    'st-patricks-day': drift({ n: 14, color: '#1e7a3c', draw: clover, size: 8, speed: 0.5 }),
    'snow':            drift({ n: 90, color: '#9cc3e5', draw: flake, size: 6, speed: 0.6, alpha: 0.9 }),
    'rain':            drift({ n: 120, color: 'rgba(46,111,149,0.55)', draw: streak, size: 7, speed: 7, sway: 0 }),
    'storm':           storm(),
    'star-wars':       stars({ n: 140, hyper: true }),
    'night-owl':       stars({ n: 70, moon: true }),
    'matrix':          gutterRain(),
    'tokyo-night':     skyline(),
    'jetbrains-dark':  lineNumbers(),
    'jetbrains-light': lineNumbers(),
    'web-rings':       webring(),
    '90s-vibes':       counter()
  };

  var current = null, active = null;
  function clear() {
    if (active) { try { (active.unmount || active)(); } catch (e) {} }
    active = null; host.textContent = ''; ui.textContent = ''; current = null;
  }
  function apply(theme) {
    if (theme === current) return;
    clear();
    if (!FX[theme] || !gutters()) return;
    current = theme;
    active = FX[theme](theme);
  }
  function refresh(force) {
    var t = root.getAttribute('data-theme') || 'system';
    if (!gutters()) { saveAll(); clear(); return; }
    if (force || t !== current) { saveAll(); current = null; apply(t); }
  }
  function trigger(name) { if (active && active.on && active.on[name]) active.on[name](); }
  function pause(v) {
    paused = (v === undefined) ? !paused : !!v;
    if (paused) Array.prototype.forEach.call(host.querySelectorAll('canvas'), function (c) { c.getContext('2d').clearRect(0, 0, c.width, c.height); });
    return paused;
  }

  var rt;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { refresh(false); }, 150); });

  window.site = window.site || {};
  window.site.gutters = gutters;
  window.site.ambient = { apply: apply, clear: clear, refresh: refresh, trigger: trigger, pause: pause, themes: Object.keys(FX) };
  apply(root.getAttribute('data-theme') || 'system');
})();
