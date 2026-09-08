/* Hidden arcade — core.
   In an armed theme (matrix, avengers, star-wars) ten clicks anywhere on the
   site within a few seconds open a gate; the code "play" (any case) collapses
   the page in the theme's own way, then a menu offers the games. Games are
   separate files that call `site.arcade._register(id, game)`; the partner
   who reacts to play is in companions.js. Nothing on the page hints at it.

   A game object provides:
     menu(theme)  -> [name, subtitle]      title(theme) -> HUD title
     help         -> control hint          start()       -> new game
     step(dt) / draw(dt)                   primary()     -> space / click
     secondary()  -> x / shift             pointer(x, y) -> pointer moved
     state()      -> for tests

   The core gives every game: A.keys / A.axis(), A.backdrop(), text helpers,
   an effects layer (A.burst, A.floater, A.shake, A.flash, A.toast), sound
   cues (A.sfx), best scores (A.best / A.record), pause, and the partner
   channel (A.emit). Games stay small; the core stays generic. */
(function () {
  var root = document.documentElement;
  var $ = function (id) { return document.getElementById(id); };
  var box = $('arcade'), gate = $('arcade-gate'), menu = $('arcade-menu'), game = $('arcade-game');
  var form = $('arcade-form'), code = $('arcade-code'), hint = $('arcade-hint');
  var canvas = $('arcade-canvas'), hudScore = $('arcade-score'), hudLives = $('arcade-lives'), hudTitle = $('arcade-title');
  var gateTitle = $('arcade-gate-title'), help = $('arcade-help'), menuList = menu && menu.querySelector('.arcade-menu-list');
  if (!box || !canvas) return;

  var A = {
    W: 480, H: 360,                       /* logical board; rendered at device resolution, see fit() */
    canvas: canvas, ctx: canvas.getContext('2d'),
    games: {}, order: [], keys: {},
    /* theme-level look: what every game and the gate share */
    skins: {
      'matrix':    { gateTitle: 'WAKE UP, NEO', font: '"Share Tech Mono", monospace', bg: '#000000', text: '#00ff41', accent: '#7dff9a', dim: '#00b32d', rain: true, glyphs: 'ｱｲｳｴｵｶｷｸｹｺ01',
                     hints: ['Not that one.', 'Knock, knock, Neo.', 'One word.', 'Think Atari.'] },
      'star-wars': { gateTitle: 'IMPERIAL CLEARANCE CODE', font: 'Orbitron, monospace', bg: '#000000', text: '#ffe81f', accent: '#4bd5ff', dim: '#8a8f99', stars: true,
                     hints: ["These aren't the codes you're looking for.", 'Try again, young one.', 'One word.', 'Think Atari.'] },
      'avengers':  { gateTitle: 'S.H.I.E.L.D. CLEARANCE', font: 'Anton, Impact, sans-serif', bg: '#0b0f1a', text: '#f2f2f2', accent: '#e0b33a', dim: '#6b7280', stars: true,
                     hints: ['Access denied.', 'Level 7 only.', 'One word.', 'Think Atari.'] }
    }
  };
  var ctx = A.ctx, W = A.W, H = A.H;
  A.theme = function () { return root.getAttribute('data-theme') || 'system'; };
  A.armed = function () { return !!A.skins[A.theme()]; };
  A.skin = function () { return A.skins[A.theme()] || A.skins['matrix']; };
  A.emit = function () {};                /* companions.js replaces these three */
  A.drawBuddy = function () {};
  A.resetBuddy = function () {};
  A.hud = function (score, lives) { hudScore.textContent = score; hudLives.textContent = lives > 0 ? new Array(Math.min(lives, 9) + 1).join('♥') : '—'; };
  A.register = function (id, g) { A.games[id] = g; A.order.push(id); };
  A.axis = function () { return (A.keys.ArrowRight ? 1 : 0) - (A.keys.ArrowLeft ? 1 : 0); };
  A.axisY = function () { return (A.keys.ArrowDown ? 1 : 0) - (A.keys.ArrowUp ? 1 : 0); };
  A.rand = function (a, b) { return a + Math.random() * (b - a); };
  A.pick = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  /* ---- sound cues, built on the site's synth ---- */
  function beep(f, d) { if (window.site && window.site.sound && window.site.sound.beep) window.site.sound.beep(f, d); }
  A.beep = beep;
  var SFX = {
    bounce: [[300, 0.03]], paddle: [[440, 0.04]], hit: [[700, 0.05]], brick: [[600, 0.05], [900, 0.04, 40]],
    shoot: [[880, 0.03]], explode: [[160, 0.12], [90, 0.2, 40]], big: [[120, 0.3], [70, 0.4, 80], [50, 0.5, 160]],
    lose: [[120, 0.25], [80, 0.3, 120]], power: [[660, 0.06], [880, 0.06, 60], [1100, 0.1, 120]],
    level: [[660, 0.08], [880, 0.08, 90], [1320, 0.16, 180]], win: [[523, 0.12], [659, 0.12, 120], [784, 0.12, 240], [1046, 0.3, 360]],
    over: [[220, 0.2], [180, 0.2, 200], [140, 0.4, 400]], boss: [[110, 0.2], [110, 0.2, 260], [90, 0.4, 520]], bomb: [[60, 0.5], [900, 0.08], [700, 0.08, 60]],
    hurt: [[200, 0.08], [140, 0.12, 60]], shield: [[500, 0.05], [500, 0.05, 70]]
  };
  A.sfx = function (name) { (SFX[name] || []).forEach(function (n) { if (n[2]) setTimeout(function () { beep(n[0], n[1]); }, n[2]); else beep(n[0], n[1]); }); };

  /* ---- best scores ---- */
  function bestKey(id) { return 'arcade:' + A.theme() + ':' + id; }
  A.best = function (id) { try { return +localStorage.getItem(bestKey(id)) || 0; } catch (e) { return 0; } };
  A.record = function (id, score) { if (score > A.best(id)) { try { localStorage.setItem(bestKey(id), String(score)); } catch (e) {} return true; } return false; };

  /* ---- effects layer: particles, floaters, toasts, shake, flash ---- */
  var parts = [], floats = [], toast = null, shakeT = 0, shakeA = 0, flashA = 0, flashC = '#fff';
  A.burst = function (x, y, color, n, o) {
    o = o || {};
    for (var i = 0; i < n; i++) {
      var a = Math.random() * 6.283, s = A.rand(0.3, 1) * (o.speed || 180);
      parts.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 0), t: 0, life: (o.life || 0.6) * A.rand(0.6, 1.2), r: (o.size || 2.5) * A.rand(0.6, 1.4),
                   color: Array.isArray(color) ? A.pick(color) : color, g: o.gravity || 0, glyph: o.glyphs ? A.pick(o.glyphs) : null, drag: o.drag || 0 });
    }
    if (parts.length > 900) parts.splice(0, parts.length - 900);
  };
  A.floater = function (x, y, text, color, big) { floats.push({ x: x, y: y, text: text, color: color, t: 0, life: big ? 1.3 : 0.9, big: !!big }); };
  A.shake = function (a) { shakeA = Math.max(shakeA, a); shakeT = 0.4; };
  A.flash = function (color, a) { flashC = color; flashA = Math.max(flashA, a); };
  A.toast = function (text, sub, life) { toast = { text: text, sub: sub || '', t: 0, life: life || 1.8 }; };
  A.clearFx = function () { parts = []; floats = []; toast = null; shakeT = 0; shakeA = 0; flashA = 0; };
  A.stepFx = function (dt) {
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i]; p.t += dt; if (p.t > p.life) { parts.splice(i, 1); continue; }
      p.vy += p.g * dt; if (p.drag) { p.vx *= (1 - p.drag * dt); p.vy *= (1 - p.drag * dt); }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (var j = floats.length - 1; j >= 0; j--) { floats[j].t += dt; floats[j].y -= 28 * dt; if (floats[j].t > floats[j].life) floats.splice(j, 1); }
    if (toast) { toast.t += dt; if (toast.t > toast.life) toast = null; }
    if (shakeT > 0) { shakeT -= dt; if (shakeT <= 0) shakeA = 0; }
    if (flashA > 0) flashA = Math.max(0, flashA - dt * 2.2);
  };
  A.shakeOffset = function () { if (shakeT <= 0) return [0, 0]; var k = shakeA * (shakeT / 0.4); return [A.rand(-k, k), A.rand(-k, k)]; };
  A.drawFx = function () {
    var k = A.skin();
    parts.forEach(function (p) {
      var a = 1 - p.t / p.life; ctx.globalAlpha = a; ctx.fillStyle = p.color;
      if (p.glyph) { ctx.font = '11px ' + k.font; ctx.textAlign = 'center'; ctx.fillText(p.glyph, p.x, p.y); }
      else ctx.fillRect(p.x - p.r / 2, p.y - p.r / 2, p.r, p.r);
    });
    ctx.globalAlpha = 1;
    floats.forEach(function (f) {
      ctx.globalAlpha = 1 - f.t / f.life; ctx.fillStyle = f.color; ctx.textAlign = 'center';
      ctx.font = (f.big ? 'bold 18px ' : 'bold 12px ') + k.font; ctx.fillText(f.text, f.x, f.y);
    });
    ctx.globalAlpha = 1;
    if (toast) {
      var u = toast.t / toast.life, a = u < 0.15 ? u / 0.15 : u > 0.7 ? (1 - u) / 0.3 : 1, rise = (1 - a) * 6;
      ctx.globalAlpha = a; ctx.fillStyle = k.text; ctx.textAlign = 'center';
      ctx.font = 'bold 26px ' + k.font; ctx.fillText(toast.text, W / 2, H / 2 - 10 + rise);
      if (toast.sub) { ctx.fillStyle = k.accent; ctx.font = '13px ' + k.font; ctx.fillText(toast.sub, W / 2, H / 2 + 16 + rise); }
      ctx.globalAlpha = 1;
    }
    if (flashA > 0) { ctx.globalAlpha = Math.min(0.85, flashA); ctx.fillStyle = flashC; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
  };

  /* ---- shared backdrop: theme bg, drifting stars, falling glyphs ---- */
  var stars = [], drops = [];
  function seedBackdrop() {
    stars = []; for (var i = 0; i < 90; i++) stars.push([Math.random() * W, Math.random() * H, Math.random() * 1.4 + 0.3, 0.4 + Math.random() * 0.6]);
    drops = []; for (var c = 0; c < W / 14; c++) drops.push({ y: Math.random() * -H, v: A.rand(60, 140), a: A.rand(0.1, 0.25) });
  }
  A.backdrop = function (dt, drift) {
    var k = A.skin();
    ctx.fillStyle = k.bg; ctx.fillRect(-20, -20, W + 40, H + 40);
    if (k.stars) {
      stars.forEach(function (s) {
        if (drift) s[1] = (s[1] + (10 + 50 * s[2]) * dt * (drift === true ? 1 : drift)) % H;
        ctx.globalAlpha = s[3] * 0.7; ctx.fillStyle = '#ffffff'; ctx.fillRect(s[0], s[1], s[2], s[2] * (drift ? 2.2 : 1));
      });
      ctx.globalAlpha = 1;
    }
    if (k.rain) {
      ctx.font = '12px ' + k.font; ctx.textAlign = 'center';
      for (var c = 0; c < drops.length; c++) {
        var d = drops[c]; d.y += d.v * dt * (drift ? 1.6 : 1); if (d.y > H + 20) { d.y = Math.random() * -H; d.v = A.rand(60, 140); }
        ctx.globalAlpha = d.a; ctx.fillStyle = k.text; ctx.fillText(k.glyphs[Math.floor(Math.random() * k.glyphs.length)], c * 14 + 7, d.y);
        ctx.globalAlpha = d.a * 0.5; ctx.fillText(k.glyphs[Math.floor(Math.random() * k.glyphs.length)], c * 14 + 7, d.y - 14);
      }
      ctx.globalAlpha = 1;
    }
  };
  /* text helpers every game uses */
  A.banner = function (text, y, color) { var k = A.skin(); ctx.fillStyle = color || k.text; ctx.font = '14px ' + k.font; ctx.textAlign = 'center'; ctx.fillText(text, W / 2, y); };
  A.endScreen = function (won, winText, overText, score, best) {
    var k = A.skin(); ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, H / 2 - 50, W, 100);
    ctx.fillStyle = won ? k.accent : k.text; ctx.textAlign = 'center';
    ctx.font = 'bold 24px ' + k.font; ctx.fillText(won ? winText : overText, W / 2, H / 2 - 12);
    ctx.fillStyle = k.text; ctx.font = '13px ' + k.font;
    ctx.fillText('SCORE ' + score + (best ? '   ·   NEW BEST' : '   ·   BEST ' + A.best(currentId)), W / 2, H / 2 + 12);
    ctx.fillStyle = k.dim; ctx.fillText('SPACE TO PLAY AGAIN · M FOR MENU', W / 2, H / 2 + 34);
  };
  /* a falling power-up capsule, sized to its label */
  A.pill = function (x, y, label, color) {
    var k = A.skin(); ctx.save(); ctx.translate(x, y);
    ctx.font = 'bold 8px ' + k.font; var w = Math.max(36, ctx.measureText(label).width + 14);
    ctx.fillStyle = color; ctx.shadowColor = color; ctx.shadowBlur = 10;
    ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-w / 2, -7, w, 14, 7); else ctx.rect(-w / 2, -7, w, 14); ctx.fill(); ctx.shadowBlur = 0;
    ctx.fillStyle = '#000'; ctx.textAlign = 'center'; ctx.fillText(label, 0, 3); ctx.restore();
  };
  A.bar = function (x, y, w, h, frac, color) { ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = color; ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h); };

  /* ---- the gate: ten clicks anywhere, inside a few seconds ---- */
  var clicks = [], NEEDED = 10, WINDOW = 6000;
  document.addEventListener('click', function (e) {
    if (!A.armed() || !box.hidden || e.target.closest('.arcade, .console')) return;
    var now = Date.now(); clicks = clicks.filter(function (t) { return now - t < WINDOW; }); clicks.push(now);
    if (clicks.length >= NEEDED) { clicks = []; openGate(); }
  });
  function openGate() {
    gateTitle.textContent = A.skin().gateTitle;
    box.hidden = false; gate.hidden = false; menu.hidden = true; game.hidden = true; hint.textContent = ''; code.value = '';
    document.body.classList.add('arcade-open'); code.focus();
  }

  /* ---- the page goes first, in the theme's own way (see .arcade-shatter in style.css) ---- */
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches, shattered = false;
  function shatter(done) {
    if (reduce) { done(); return; }
    shattered = true; gate.hidden = true; box.classList.add('arcade-clear');
    document.body.classList.add('arcade-shatter');
    var t = A.theme(), snd = window.site && window.site.sound;
    if (snd) { if (t === 'star-wars') snd.trigger('jump'); else if (t === 'avengers') { beep(90, 0.5); snd.trigger('click'); } else beep(220, 0.45); }
    setTimeout(function () { box.classList.remove('arcade-clear'); done(); }, 1300);
  }
  function restore() {
    if (!shattered) return;
    shattered = false;
    document.body.classList.remove('arcade-shatter'); document.body.classList.add('arcade-restore');
    setTimeout(function () { document.body.classList.remove('arcade-restore'); }, 800);
  }

  /* ---- the menu: one button per registered game, with its best score ---- */
  function showMenu() {
    stopGame(); game.hidden = true; menu.hidden = false; box.classList.add('is-playing');
    var t = A.theme(); menuList.textContent = '';
    A.order.forEach(function (id, i) {
      var g = A.games[id], m = g.menu(t), b = document.createElement('button'), best = A.best(id);
      b.type = 'button'; b.setAttribute('data-game', id);
      b.innerHTML = '<b>' + (i + 1) + '</b><span></span><small></small>';
      b.querySelector('span').textContent = m[0]; b.querySelector('small').textContent = m[1] + (best ? ' · best ' + best : '');
      b.addEventListener('click', function () { pick(id); });
      menuList.appendChild(b);
    });
    var first = menuList.querySelector('button'); if (first) first.focus();
  }
  function pick(id) { if (!A.games[id]) return; menu.hidden = true; game.hidden = false; startGame(id); }

  function close() {
    stopGame(); box.hidden = true; menu.hidden = true;
    box.classList.remove('arcade-clear'); box.classList.remove('is-playing'); document.body.classList.remove('arcade-open'); restore();
    try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(function () {}); } catch (err) {}
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (code.value.trim().toLowerCase() === 'play') {
      hint.textContent = '';
      /* fullscreen must be asked for on the gesture itself; the collapse then plays fullscreen */
      try { if (document.documentElement.requestFullscreen && !document.fullscreenElement) document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(function () {}); } catch (err) {}
      shatter(function () { gate.hidden = true; showMenu(); });
    } else {
      var h = A.skin().hints; hint.textContent = A.pick(h);
      gate.classList.remove('shake'); void gate.offsetWidth; gate.classList.add('shake'); code.select(); beep(180, 0.12);
    }
  });
  box.querySelector('.arcade-close').addEventListener('click', close);
  box.querySelector('[data-arcade-exit]').addEventListener('click', close);
  box.querySelector('[data-arcade-menu]').addEventListener('click', showMenu);
  box.addEventListener('click', function (e) { if (e.target === box) close(); });
  document.addEventListener('keydown', function (e) {
    if (box.hidden) return;
    var typing = e.target === code;
    if (e.key === 'Escape' || (!typing && (e.key === 'q' || e.key === 'Q'))) { close(); e.stopPropagation(); e.preventDefault(); return; }
    if (!menu.hidden && /^[1-9]$/.test(e.key) && A.order[+e.key - 1]) { pick(A.order[+e.key - 1]); e.stopPropagation(); e.preventDefault(); return; }
    if (!game.hidden && !typing && (e.key === 'm' || e.key === 'M')) { showMenu(); e.stopPropagation(); e.preventDefault(); return; }
    if (!game.hidden && !typing && (e.key === 'p' || e.key === 'P')) { paused = !paused; last = 0; e.stopPropagation(); e.preventDefault(); }
  }, true);

  /* ---- sizing: fill the viewport at 4:3, render at device resolution ---- */
  var bc = $('arcade-buddy');
  A.buddyCanvas = bc; A.bctx = bc ? bc.getContext('2d') : null; A.BW = bc ? bc.width : 140; A.BH = bc ? bc.height : 220;
  function fit() {
    if (game.hidden) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 3), showBuddy = window.innerWidth > 700;
    var availW = Math.min(window.innerWidth - (showBuddy ? 218 : 24), 1800), availH = window.innerHeight - 170;
    var cssW = Math.max(200, Math.min(availW, availH * W / H)), cssH = cssW * H / W;
    canvas.style.width = cssW + 'px'; canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr); canvas.height = Math.round(cssH * dpr);
    ctx.setTransform(canvas.width / W, 0, 0, canvas.height / H, 0, 0);
    if (bc) {
      var bs = Math.max(0.9, Math.min(1.8, cssH / 360));
      bc.style.width = Math.round(A.BW * bs) + 'px'; bc.style.height = Math.round(A.BH * bs) + 'px';
      bc.width = Math.round(A.BW * bs * dpr); bc.height = Math.round(A.BH * bs * dpr);
      A.bctx.setTransform(bc.width / A.BW, 0, 0, bc.height / A.BH, 0, 0);
    }
    if (current) frame(0);
  }
  window.addEventListener('resize', fit);
  document.addEventListener('fullscreenchange', fit);

  /* ---- the loop ---- */
  var current = null, currentId = null, raf = null, last = 0, paused = false;
  var TRACKED = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1 };
  function onKey(e) {
    if (TRACKED[e.key]) { A.keys[e.key] = true; e.preventDefault(); return; }
    if (e.key === ' ') { e.preventDefault(); if (current && !paused) current.primary(); return; }
    if ((e.key === 'x' || e.key === 'X' || e.key === 'Shift') && current && !paused && current.secondary) { e.preventDefault(); current.secondary(); }
  }
  function onKeyUp(e) { A.keys[e.key] = false; }
  canvas.addEventListener('pointermove', function (e) {
    if (!current) return;
    var r = canvas.getBoundingClientRect(); current.pointer((e.clientX - r.left) * (W / r.width), (e.clientY - r.top) * (H / r.height));
  });
  canvas.addEventListener('pointerdown', function (e) { if (current && !paused) { if (e.button === 2 && current.secondary) current.secondary(); else current.primary(); } });
  canvas.addEventListener('contextmenu', function (e) { e.preventDefault(); });

  function stopGame() {
    if (raf) cancelAnimationFrame(raf); raf = null; current = null; currentId = null; A.keys = {}; paused = false; A.clearFx();
    window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKeyUp);
  }
  function startGame(id) {
    stopGame(); current = A.games[id]; currentId = id;
    var t = A.theme(); hudTitle.textContent = current.title(t); help.textContent = current.help;
    seedBackdrop(); window.addEventListener('keydown', onKey); window.addEventListener('keyup', onKeyUp);
    current.start(); A.resetBuddy(); fit(); A.emit('hello'); last = 0; raf = requestAnimationFrame(tick); canvas.focus();
  }
  function frame(dt) {
    if (!current) return;
    if (!paused) { current.step(dt); A.stepFx(dt); }
    var o = A.shakeOffset();
    ctx.save(); ctx.translate(o[0], o[1]);
    current.draw(dt); A.drawFx();
    ctx.restore();
    if (paused) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); A.banner('PAUSED · P TO RESUME', H / 2); }
    A.drawBuddy(dt);
  }
  function tick(t) {
    raf = requestAnimationFrame(tick);
    if (document.hidden) { last = 0; return; }
    var dt = last ? Math.min((t - last) / 1000, 0.05) : 1 / 60; last = t;
    frame(dt);
  }

  /* ---- public ---- */
  window.site = window.site || {};
  window.site.arcade = {
    open: openGate, close: close, armed: A.armed, menu: showMenu, start: pick,
    frame: function (dt) { frame(dt || 1 / 60); },
    state: function () { return current ? current.state() : null; }, mode: function () { return currentId; },
    paused: function () { return paused; },
    games: function () { var t = A.theme(); return A.order.map(function (id) { return A.games[id].menu(t)[0]; }); },
    hint: function () {
      return A.armed()
        ? ['This theme has an arcade. Click anywhere on the site ten times, quickly.', 'When asked for a code, it is one word. Think Atari.', 'Or: arcade open']
        : ['Not on this theme. Try: theme set matrix | avengers | star-wars'];
    },
    _register: A.register, _core: A
  };
})();
