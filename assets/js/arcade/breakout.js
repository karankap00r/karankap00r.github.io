/* Hidden arcade — game one: Breakout, the full version.
   Eight designed levels (rows, checker, pyramid, diamond, fortress, stripes,
   tunnel, boss), bricks with hit points and unbreakable steel, six power-ups
   named for the theme, multiball, lasers, combos, a final boss that rebuilds
   its wall. Per-theme look and words live in SKINS; the rules are shared. */
(function () {
  var api = window.site && window.site.arcade, A = api && api._core;
  if (!A) return;
  var W = A.W, H = A.H, ctx = A.ctx, ID = 'breakout';

  var SKINS = {
    'matrix': {
      menu: ['BREAKOUT', 'break the code, brick by brick · 8 levels'], title: 'THE MATRIX HAS YOU',
      bricks: ['#00ff41', '#00b32d', '#7dff9a'], steel: '#1f3d26', paddle: '#00ff41', ball: '#7dff9a', boss: '#00ff41', glyphs: 'ｱｲｳｴｵｶｷｸｹｺ01',
      launch: 'FOLLOW THE WHITE RABBIT · SPACE', over: 'SYSTEM FAILURE', win: 'THERE IS NO SPOON', bossName: 'AGENT SMITH', bossIntro: 'MR. ANDERSON.',
      levels: ['THE CONSTRUCT', 'DÉJÀ VU', 'THE LOADING PROGRAM', 'THE ORACLE', 'ZION', 'THE MEROVINGIAN', 'THE SOURCE', 'THE ONE'],
      powers: { wide: 'OPERATOR', multi: 'RED PILL', slow: 'BULLET TIME', laser: 'LOTS OF GUNS', life: 'REBOOT', smash: 'THE ONE' }
    },
    'star-wars': {
      menu: ['REBEL BREAKOUT', 'hollow bricks, a saber for a paddle · 8 levels'], title: 'REBEL BREAKOUT',
      bricks: ['#ffe81f', '#4bd5ff', '#ff3b3b'], steel: '#3b3f47', paddle: '#4bd5ff', ball: '#ff3b3b', boss: '#8a8f99', hollow: true, saber: true, bolt: true,
      launch: 'PUNCH IT · SPACE', over: 'I HAVE A BAD FEELING ABOUT THIS', win: 'THE FORCE IS WITH YOU', bossName: 'DEATH STAR', bossIntro: "THAT'S NO MOON.",
      levels: ['TATOOINE', 'HOTH', 'DAGOBAH', 'BESPIN', 'ENDOR', 'THE ASTEROID FIELD', 'THE TRENCH', 'THE DEATH STAR'],
      powers: { wide: 'THE FORCE', multi: 'SQUADRON', slow: 'CARBONITE', laser: 'PROTON TORPEDOES', life: 'R2-D2', smash: 'HYPERDRIVE' }
    },
    'avengers': {
      menu: ['ASSEMBLE BREAKOUT', 'steel bricks, a shield for a paddle · 8 levels'], title: 'ASSEMBLE',
      bricks: ['#e2231a', '#e0b33a', '#9be7ff'], steel: '#4b5563', paddle: '#e0b33a', ball: '#9be7ff', boss: '#4a3f6b', metal: true, shield: true, ring: true,
      launch: 'AVENGERS, ASSEMBLE · SPACE', over: 'WHATEVER IT TAKES', win: 'I AM IRON MAN', bossName: 'LEVIATHAN', bossIntro: 'THROUGH THE PORTAL.',
      levels: ['STARK TOWER', 'HELICARRIER', 'SOKOVIA', 'WAKANDA', 'TITAN', 'THE SNAP', 'THE TIME HEIST', 'ENDGAME'],
      powers: { wide: 'PYM PARTICLES', multi: 'ASSEMBLE', slow: 'TIME STONE', laser: 'REPULSORS', life: 'SUPER SOLDIER', smash: 'HULK SMASH' }
    }
  };
  var POWER_COLORS = { wide: '#4bd5ff', multi: '#e0b33a', slow: '#a78bfa', laser: '#ff3b3b', life: '#ff6bcb', smash: '#7dff9a' };
  var POWER_IDS = ['wide', 'multi', 'slow', 'laser', 'life', 'smash'];
  function skin() { return SKINS[A.theme()] || SKINS['matrix']; }

  /* ---- levels: a function of (row, col) -> hit points; 0 empty, 9 steel ---- */
  var ROWS = 6, COLS = 11, PAD = 3, TOP = 34, BW = (W - PAD * (COLS + 1)) / COLS, BH = 14;
  var LAYOUTS = [
    function (r, c) { return r < 4 ? 1 : 0; },
    function (r, c) { return (r + c) % 2 ? (r === 0 ? 2 : 1) : 0; },
    function (r, c) { return (c >= r && c <= COLS - 1 - r) ? (r === 0 ? 2 : 1) : 0; },
    function (r, c) { var d = Math.abs(c - 5) + Math.abs(r - 2.5); return d <= 4 ? (d <= 1.5 ? 3 : d <= 3 ? 2 : 1) : 0; },
    function (r, c) { if (r === 1 && c > 1 && c < COLS - 2 && c !== 5) return 9; if (r === 0) return 1; if (r >= 2 && r <= 4 && c >= 3 && c <= 7) return 2; return 0; },
    function (r, c) { return c % 3 === 1 ? 3 : c % 3 === 2 ? 1 : 0; },
    function (r, c) { if (c === 2 || c === COLS - 3) return r < 5 ? 9 : 0; if (c > 2 && c < COLS - 3) return r < 5 ? (r % 2 ? 1 : 2) : 0; return r < 2 ? 1 : 0; },
    function (r, c) { return (r === 3 && c % 2 === 0) ? 2 : 0; }
  ];
  function bricksFor(level) {
    var out = [], k = skin(), fn = LAYOUTS[Math.min(level, LAYOUTS.length) - 1];
    for (var r = 0; r < ROWS; r++) for (var c = 0; c < COLS; c++) {
      var hp = fn(r, c); if (!hp) continue;
      out.push(brick(r, c, hp));
    }
    return out;
  }
  function brick(r, c, hp) {
    var k = skin();
    return { r: r, c: c, x: PAD + c * (BW + PAD), y: TOP + r * (BH + PAD), w: BW, h: BH, hp: hp, max: hp,
             color: hp === 9 ? k.steel : k.bricks[(hp - 1) % k.bricks.length], glyph: k.glyphs ? A.pick(k.glyphs) : '' };
  }

  /* ---- state ---- */
  var S = null;
  function hud() { A.hud('SCORE ' + S.score + '  LVL ' + S.level + '/8  BEST ' + Math.max(S.score, A.best(ID)), S.lives); }
  function newBall(x, y, vx, vy) { return { x: x, y: y, r: 5, vx: vx || 0, vy: vy || 0, trail: [] }; }
  function reset(level, score, lives) {
    var k = skin();
    S = { level: level, score: score, lives: lives, over: false, won: false, launched: false, newBest: false, t: 0,
          speed: 230 * Math.pow(1.12, level - 1), combo: 0, comboBest: 0,
          paddle: { x: W / 2 - 35, w: 70, h: 8 }, balls: [newBall(W / 2, H - 30)], bricks: bricksFor(level),
          drops: [], lasers: [], fx: { wide: 0, slow: 0, laser: 0, smash: 0 }, laserCd: 0,
          boss: level === 8 ? { x: W / 2 - 70, y: 48, w: 140, h: 26, hp: 36, max: 36, vx: 80, rebuild: 0, hurt: 0 } : null };
    hud();
    A.toast('LEVEL ' + level, k.levels[level - 1]);
    if (S.boss) { setTimeout(function () { if (S && S.boss) { A.toast(k.bossName, k.bossIntro, 2.2); A.sfx('boss'); A.emit('boss'); } }, 1900); }
  }
  function newGame() { A.clearFx(); reset(1, 0, 3); }

  /* ---- power-ups ---- */
  function dropPower(x, y) {
    var id = A.pick(POWER_IDS.concat(['wide', 'multi', 'laser']));      /* the fun ones a little more often */
    if (id === 'life' && Math.random() < 0.5) id = 'slow';
    S.drops.push({ x: x, y: y, id: id, vy: 70, spin: 0 });
  }
  function applyPower(id) {
    var k = skin(), p = S.paddle;
    A.sfx('power'); A.emit('power'); A.floater(p.x + p.w / 2, H - 40, k.powers[id], POWER_COLORS[id], true);
    if (id === 'wide') { S.fx.wide = 12; }
    else if (id === 'multi') {
      var add = [];
      S.balls.forEach(function (b) {
        var sp = Math.hypot(b.vx, b.vy) || S.speed;
        [-0.5, 0.5].forEach(function (da) { var a = Math.atan2(b.vy, b.vx) + da; add.push(newBall(b.x, b.y, Math.cos(a) * sp, Math.sin(a) * sp)); });
      });
      S.balls = S.balls.concat(add).slice(0, 12); S.launched = true;
    }
    else if (id === 'slow') { S.fx.slow = 8; }
    else if (id === 'laser') { S.fx.laser = 10; }
    else if (id === 'life') { S.lives = Math.min(S.lives + 1, 6); hud(); }
    else if (id === 'smash') { S.fx.smash = 7; }
  }
  function fireLaser() {
    if (S.fx.laser <= 0 || S.laserCd > 0) return;
    S.laserCd = 0.28; var p = S.paddle;
    S.lasers.push({ x: p.x + 6, y: H - 24 }, { x: p.x + p.w - 6, y: H - 24 }); A.sfx('shoot');
  }

  /* ---- bricks ---- */
  function damageBrick(k, i, x, y, force) {
    var sk = skin();
    if (k.hp === 9 && !force) { A.sfx('bounce'); A.burst(x, y, sk.steel, 4, { speed: 80, life: 0.3 }); return false; }
    k.hp--;
    if (k.hp <= 0) {
      S.bricks.splice(i, 1); S.combo++; S.comboBest = Math.max(S.comboBest, S.combo);
      var gain = 10 * S.level * Math.min(S.combo, 8); S.score += gain;
      A.burst(k.x + k.w / 2, k.y + k.h / 2, [k.color, sk.ball, '#ffffff'], 14, { speed: 160, life: 0.5, gravity: 240, glyphs: sk.glyphs ? sk.glyphs.split('') : null });
      if (S.combo >= 2) A.floater(k.x + k.w / 2, k.y, '×' + Math.min(S.combo, 8) + '  +' + gain, sk.ball);
      if (Math.random() < 0.17) dropPower(k.x + k.w / 2, k.y + k.h / 2);
      A.sfx('brick'); A.emit('hit'); hud();
      return true;
    }
    S.score += 5; A.sfx('hit'); A.burst(x, y, k.color, 5, { speed: 100, life: 0.35 }); hud();
    return false;
  }

  /* ---- step ---- */
  function loseBall() {
    S.lives--; A.sfx('lose'); A.shake(6); A.flash('#ff3b3b', 0.35); S.combo = 0; hud();
    if (S.lives <= 0) { S.over = true; S.won = false; S.newBest = A.record(ID, S.score); A.sfx('over'); A.emit('over'); return; }
    S.launched = false; S.balls = [newBall(S.paddle.x + S.paddle.w / 2, H - 30)]; S.fx.laser = 0; S.fx.smash = 0; A.emit('lost');
  }
  function stepBoss(dt) {
    var B = S.boss; if (!B) return;
    var speed = B.hp < B.max / 2 ? 1.7 : 1;
    B.x += B.vx * speed * dt; if (B.x < 4 || B.x + B.w > W - 4) { B.vx = -B.vx; B.x = Math.max(4, Math.min(W - 4 - B.w, B.x)); }
    B.hurt = Math.max(0, B.hurt - dt);
    B.rebuild -= dt;
    if (B.rebuild <= 0 && S.bricks.length < 14) {
      B.rebuild = (B.hp < B.max / 2 ? 1.4 : 2.4);
      var slots = []; for (var c = 0; c < COLS; c++) for (var r = 3; r < 5; r++) if (!S.bricks.some(function (k) { return k.r === r && k.c === c; })) slots.push([r, c]);
      if (slots.length) { var s = A.pick(slots), nb = brick(s[0], s[1], 1); S.bricks.push(nb); A.burst(nb.x + nb.w / 2, nb.y + nb.h / 2, skin().boss, 6, { speed: 60, life: 0.3 }); }
    }
  }
  function step(dt) {
    if (S.over) return;
    var p = S.paddle, sk = skin();
    S.t += dt;
    for (var f in S.fx) if (S.fx[f] > 0) S.fx[f] -= dt;
    p.w = S.fx.wide > 0 ? 110 : 70;
    S.laserCd -= dt;
    var ax = A.axis(); if (ax) p.x += ax * 340 * dt;
    p.x = Math.max(0, Math.min(W - p.w, p.x));
    if (!S.launched) { S.balls[0].x = p.x + p.w / 2; S.balls[0].y = H - 30; return; }
    var slow = S.fx.slow > 0 ? 0.6 : 1, ramp = 1 + Math.min(0.3, S.t / 150);

    for (var bi = S.balls.length - 1; bi >= 0; bi--) {
      var b = S.balls[bi];
      if (b.vx === 0 && b.vy === 0) { var a0 = -Math.PI / 3 - Math.random() * Math.PI / 3; b.vx = Math.cos(a0) * S.speed; b.vy = Math.sin(a0) * S.speed; }
      b.trail.unshift([b.x, b.y]); if (b.trail.length > 7) b.trail.pop();
      b.x += b.vx * dt * slow * ramp; b.y += b.vy * dt * slow * ramp;
      if (b.x < b.r) { b.x = b.r; b.vx = -b.vx; A.sfx('bounce'); } if (b.x > W - b.r) { b.x = W - b.r; b.vx = -b.vx; A.sfx('bounce'); }
      if (b.y < b.r) { b.y = b.r; b.vy = -b.vy; A.sfx('bounce'); }
      /* paddle */
      if (b.vy > 0 && b.y + b.r >= H - 20 && b.y + b.r <= H - 20 + p.h + 8 && b.x >= p.x - b.r && b.x <= p.x + p.w + b.r) {
        var rel = (b.x - (p.x + p.w / 2)) / (p.w / 2), ang = rel * (Math.PI / 3), sp = Math.hypot(b.vx, b.vy) * 1.015;
        b.vx = Math.sin(ang) * sp; b.vy = -Math.cos(ang) * sp; b.y = H - 20 - b.r; S.combo = 0; A.sfx('paddle');
        A.burst(b.x, H - 20, sk.paddle, 4, { speed: 60, life: 0.25, up: 40 });
      }
      /* bricks */
      for (var i = 0; i < S.bricks.length; i++) {
        var k = S.bricks[i];
        if (b.x + b.r > k.x && b.x - b.r < k.x + k.w && b.y + b.r > k.y && b.y - b.r < k.y + k.h) {
          var smash = S.fx.smash > 0 && k.hp !== 9;
          if (!smash) { var ox = Math.min(b.x + b.r - k.x, k.x + k.w - (b.x - b.r)), oy = Math.min(b.y + b.r - k.y, k.y + k.h - (b.y - b.r)); if (ox < oy) b.vx = -b.vx; else b.vy = -b.vy; }
          if (smash) k.hp = 1;
          damageBrick(k, i, b.x, b.y, false); break;
        }
      }
      /* boss */
      var B = S.boss;
      if (B && b.x + b.r > B.x && b.x - b.r < B.x + B.w && b.y + b.r > B.y && b.y - b.r < B.y + B.h) {
        b.vy = Math.abs(b.vy); b.y = B.y + B.h + b.r; B.hp -= S.fx.smash > 0 ? 3 : 1; B.hurt = 0.2; S.score += 25; S.combo++;
        A.sfx('explode'); A.shake(3); A.burst(b.x, b.y, [sk.boss, '#ffffff'], 10, { speed: 140, life: 0.4 }); A.emit('hit'); hud();
        if (B.hp <= 0) {
          A.burst(B.x + B.w / 2, B.y + B.h / 2, [sk.boss, sk.ball, '#ffffff', sk.paddle], 120, { speed: 320, life: 1.2, gravity: 120 });
          A.shake(14); A.flash('#ffffff', 0.8); A.sfx('big'); S.boss = null; S.score += 1000; S.bricks = [];
        }
      }
      if (b.y > H + b.r) { S.balls.splice(bi, 1); if (!S.balls.length) { loseBall(); return; } }
      if (b.x > W - 40 && b.vx > 0) A.emit('near');
    }
    /* lasers */
    for (var li = S.lasers.length - 1; li >= 0; li--) {
      var L = S.lasers[li]; L.y -= 520 * dt; var gone = L.y < -10;
      for (var j = 0; j < S.bricks.length && !gone; j++) { var kb = S.bricks[j]; if (L.x > kb.x && L.x < kb.x + kb.w && L.y > kb.y && L.y < kb.y + kb.h) { damageBrick(kb, j, L.x, L.y, false); gone = true; } }
      if (!gone && S.boss && L.x > S.boss.x && L.x < S.boss.x + S.boss.w && L.y > S.boss.y && L.y < S.boss.y + S.boss.h) { S.boss.hp--; S.boss.hurt = 0.15; S.score += 10; A.sfx('hit'); gone = true; if (S.boss.hp <= 0) { A.burst(S.boss.x + S.boss.w / 2, S.boss.y + 13, [sk.boss, '#ffffff'], 120, { speed: 320, life: 1.2 }); A.shake(14); A.flash('#ffffff', 0.8); A.sfx('big'); S.boss = null; S.score += 1000; S.bricks = []; hud(); } }
      if (gone) S.lasers.splice(li, 1);
    }
    /* drops */
    for (var di = S.drops.length - 1; di >= 0; di--) {
      var d = S.drops[di]; d.y += d.vy * dt; d.spin += dt * 4;
      if (d.y > H - 24 && d.y < H - 8 && d.x > p.x - 12 && d.x < p.x + p.w + 12) { applyPower(d.id); S.drops.splice(di, 1); }
      else if (d.y > H + 10) S.drops.splice(di, 1);
    }
    stepBoss(dt);
    /* level clear */
    var left = S.bricks.filter(function (k) { return k.hp !== 9; }).length;
    if (!left && !S.boss) {
      if (S.level >= 8) { S.over = true; S.won = true; S.newBest = A.record(ID, S.score); A.sfx('win'); A.flash(sk.ball, 0.6); A.emit('win'); return; }
      S.score += 100 * S.level; A.sfx('level'); A.flash(sk.paddle, 0.4); A.emit('level');
      var keep = S.lives; reset(S.level + 1, S.score, keep);
    }
  }

  /* ---- draw ---- */
  function drawBrick(k, r) {
    var frac = r.max === 9 ? 1 : r.hp / r.max;
    if (r.max === 9) {
      ctx.fillStyle = r.color; ctx.fillRect(r.x, r.y, r.w, r.h);
      ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
      for (var s = -r.h; s < r.w; s += 8) { ctx.beginPath(); ctx.moveTo(r.x + s, r.y + r.h); ctx.lineTo(r.x + s + r.h, r.y); ctx.stroke(); }
      return;
    }
    if (k.hollow) { ctx.strokeStyle = r.color; ctx.lineWidth = 1 + r.hp; ctx.globalAlpha = 0.5 + frac * 0.5; ctx.strokeRect(r.x + 1, r.y + 1, r.w - 2, r.h - 2); ctx.globalAlpha = 1; }
    else {
      if (k.metal) { var g = ctx.createLinearGradient(0, r.y, 0, r.y + r.h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, r.color); g.addColorStop(1, r.color); ctx.fillStyle = g; }
      else ctx.fillStyle = r.color;
      ctx.globalAlpha = 0.55 + frac * 0.45; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.globalAlpha = 1;
      if (r.glyph) { ctx.fillStyle = A.skin().bg; ctx.font = '10px ' + A.skin().font; ctx.textAlign = 'center'; ctx.fillText(r.glyph, r.x + r.w / 2, r.y + 11); }
    }
    if (r.hp < r.max) {      /* cracks */
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.beginPath();
      ctx.moveTo(r.x + r.w * 0.3, r.y); ctx.lineTo(r.x + r.w * 0.45, r.y + r.h * 0.5); ctx.lineTo(r.x + r.w * 0.35, r.y + r.h);
      if (r.max - r.hp > 1) { ctx.moveTo(r.x + r.w * 0.7, r.y + r.h); ctx.lineTo(r.x + r.w * 0.6, r.y + r.h * 0.4); ctx.lineTo(r.x + r.w * 0.8, r.y); }
      ctx.stroke();
    }
  }
  function drawBoss(k, B) {
    var t = A.theme(), cx = B.x + B.w / 2, cy = B.y + B.h / 2, hurt = B.hurt > 0;
    ctx.save();
    if (t === 'star-wars') {
      ctx.fillStyle = hurt ? '#ffffff' : '#8a8f99'; ctx.beginPath(); ctx.arc(cx, cy, 30, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#5c616b'; ctx.beginPath(); ctx.arc(cx - 12, cy - 8, 8, 0, 6.28); ctx.fill();
      ctx.strokeStyle = '#3b3f47'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 30, cy + 4); ctx.lineTo(cx + 30, cy + 4); ctx.stroke();
      if (Math.sin(S.t * 6) > 0.9) { ctx.strokeStyle = '#7dff7d'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - 12, cy - 8); ctx.lineTo(cx - 12, H); ctx.stroke(); }
    } else if (t === 'avengers') {
      ctx.fillStyle = hurt ? '#ffffff' : '#4a3f6b'; ctx.beginPath(); ctx.ellipse(cx, cy, B.w / 2, B.h / 2 + 4, 0, 0, 6.28); ctx.fill();
      ctx.fillStyle = '#a78bfa'; for (var i = -3; i <= 3; i++) ctx.fillRect(cx + i * 18 - 2, cy - 14 + Math.sin(S.t * 5 + i) * 3, 4, 8);
      ctx.fillStyle = '#e0b33a'; ctx.fillRect(cx - 26 + (B.vx > 0 ? 40 : -40), cy - 3, 6, 6);
    } else {
      ctx.fillStyle = hurt ? '#ffffff' : '#0a0a0a'; ctx.fillRect(B.x, B.y, B.w, B.h); ctx.strokeStyle = k.boss; ctx.lineWidth = 2; ctx.strokeRect(B.x, B.y, B.w, B.h);
      ctx.fillStyle = k.boss; ctx.font = 'bold 13px ' + A.skin().font; ctx.textAlign = 'center'; ctx.fillText(hurt ? 'MR. ANDERSON' : 'AGENT SMITH', cx, cy + 5);
      for (var j = 0; j < 4; j++) { ctx.fillStyle = '#e8c4a0'; ctx.fillRect(B.x + 8 + j * 34, B.y - 10, 10, 10); ctx.fillStyle = '#000'; ctx.fillRect(B.x + 9 + j * 34, B.y - 7, 8, 3); }
    }
    ctx.restore();
    A.bar(W / 2 - 80, 8, 160, 5, B.hp / B.max, hurt ? '#ffffff' : k.boss);
    ctx.fillStyle = k.boss; ctx.font = '10px ' + A.skin().font; ctx.textAlign = 'center'; ctx.fillText(k.bossName, W / 2, 24);
  }
  function drawPaddle(k, p) {
    var y = H - 20, glow = S.fx.laser > 0 ? '#ff3b3b' : k.paddle;
    if (k.saber) {
      ctx.fillStyle = '#9a9a9a'; ctx.fillRect(p.x - 12, y - 1, 12, 10);
      ctx.fillStyle = k.paddle; ctx.shadowColor = glow; ctx.shadowBlur = 18; ctx.fillRect(p.x, y, p.w, p.h);
      ctx.fillStyle = '#ffffff'; ctx.shadowBlur = 0; ctx.fillRect(p.x, y + 2, p.w, 3);
    } else if (k.shield) {
      ctx.fillStyle = '#e2231a'; ctx.fillRect(p.x, y, p.w, p.h);
      ctx.fillStyle = '#f2f2f2'; ctx.fillRect(p.x + 8, y, p.w - 16, p.h);
      ctx.fillStyle = '#2b5fd9'; ctx.fillRect(p.x + p.w / 2 - 8, y, 16, p.h);
      ctx.fillStyle = k.paddle; ctx.fillRect(p.x + p.w / 2 - 3, y, 6, p.h);
      if (S.fx.laser > 0) { ctx.fillStyle = '#9be7ff'; ctx.shadowColor = '#9be7ff'; ctx.shadowBlur = 10; ctx.fillRect(p.x + 3, y - 3, 6, 6); ctx.fillRect(p.x + p.w - 9, y - 3, 6, 6); ctx.shadowBlur = 0; }
    } else {
      ctx.fillStyle = k.paddle; ctx.shadowColor = glow; ctx.shadowBlur = 12; ctx.fillRect(p.x, y, p.w, p.h); ctx.shadowBlur = 0;
      ctx.fillStyle = A.skin().bg; ctx.font = '9px ' + A.skin().font; ctx.textAlign = 'center'; ctx.fillText(S.fx.laser > 0 ? 'GUNS' : S.fx.wide > 0 ? 'OPERATOR' : '', p.x + p.w / 2, y + 7);
    }
    if (S.fx.smash > 0) { ctx.strokeStyle = '#7dff9a'; ctx.lineWidth = 1; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(S.t * 12); ctx.strokeRect(p.x - 3, y - 3, p.w + 6, p.h + 6); ctx.globalAlpha = 1; }
  }
  function drawBall(k, b) {
    var col = S.fx.smash > 0 ? '#7dff9a' : k.ball;
    b.trail.forEach(function (t, i) { ctx.globalAlpha = 0.35 * (1 - i / b.trail.length); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(t[0], t[1], b.r * (1 - i / 9), 0, 6.28); ctx.fill(); });
    ctx.globalAlpha = 1; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 14;
    if (k.ring) { ctx.beginPath(); ctx.arc(b.x, b.y, b.r + 2, 0, 6.28); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.stroke(); ctx.beginPath(); ctx.arc(b.x, b.y, 2, 0, 6.28); ctx.fill(); }
    else if (k.bolt && (b.vx || b.vy)) { var L = 14, n = Math.hypot(b.vx, b.vy) || 1; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.x - b.vx / n * L, b.y - b.vy / n * L); ctx.lineTo(b.x + b.vx / n * L / 2, b.y + b.vy / n * L / 2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.28); ctx.fill(); }
    ctx.shadowBlur = 0;
  }
  function draw(dt) {
    var k = skin(), base = A.skin(), p = S.paddle;
    A.backdrop(dt, S.fx.slow > 0 ? 0.3 : false);
    if (S.fx.slow > 0) { ctx.fillStyle = 'rgba(167,139,250,0.08)'; ctx.fillRect(0, 0, W, H); }
    S.bricks.forEach(function (r) { drawBrick(k, r); });
    if (S.boss) drawBoss(k, S.boss);
    S.drops.forEach(function (d) { A.pill(d.x, d.y, k.powers[d.id], POWER_COLORS[d.id]); });
    ctx.fillStyle = '#ff3b3b'; ctx.shadowColor = '#ff3b3b'; ctx.shadowBlur = 8; S.lasers.forEach(function (L) { ctx.fillRect(L.x - 1.5, L.y - 8, 3, 12); }); ctx.shadowBlur = 0;
    drawPaddle(k, p);
    S.balls.forEach(function (b) { drawBall(k, b); });
    /* active power timers, bottom-left */
    var y = H - 4, shown = 0;
    ['wide', 'slow', 'laser', 'smash'].forEach(function (id) { if (S.fx[id] > 0) { A.bar(6, y - 8 - shown * 9, 60, 3, S.fx[id] / { wide: 12, slow: 8, laser: 10, smash: 7 }[id], POWER_COLORS[id]); ctx.fillStyle = POWER_COLORS[id]; ctx.font = '8px ' + base.font; ctx.textAlign = 'left'; ctx.fillText(k.powers[id], 70, y - 5 - shown * 9); shown++; } });
    if (S.combo >= 3) { ctx.fillStyle = k.ball; ctx.font = 'bold 12px ' + base.font; ctx.textAlign = 'right'; ctx.fillText('COMBO ×' + Math.min(S.combo, 8), W - 6, H - 6); }
    if (!S.launched && !S.over) A.banner(S.fx.laser > 0 ? 'SPACE TO LAUNCH · SPACE AGAIN TO FIRE' : k.launch, H / 2 + 60);
    if (S.over) A.endScreen(S.won, k.win, k.over, S.score, S.newBest);
  }

  A.register(ID, {
    menu: function (t) { return (SKINS[t] || SKINS['matrix']).menu; },
    title: function (t) { return (SKINS[t] || SKINS['matrix']).title; },
    help: '← → or mouse · space launches and fires · p pauses · catch the power-ups',
    start: newGame, step: step, draw: draw,
    primary: function () { if (!S) return; if (S.over) newGame(); else if (!S.launched) S.launched = true; else fireLaser(); },
    secondary: function () { if (S && S.launched) fireLaser(); },
    pointer: function (x) { if (S) S.paddle.x = Math.max(0, Math.min(W - S.paddle.w, x - S.paddle.w / 2)); },
    state: function () { return S; }
  });
})();
