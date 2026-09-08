/* Hidden arcade — game two: a shooter in the theme's own world.
   matrix: Agent Purge — agents come down the columns of the code.
   star-wars: Trench Run — fighters incoming; stay on target.
   avengers: Save New York — they are coming through the portal.

   Ten waves of scripted formations (grunts, divers, V wings, zigzags, tanks),
   enemies that shoot back, a shield, bombs, five power-ups named for the
   theme, combos, bosses on waves 5 and 10 with their own attack patterns,
   parallax backgrounds. Per-theme look and words live in SKINS. */
(function () {
  var api = window.site && window.site.arcade, A = api && api._core;
  if (!A) return;
  var W = A.W, H = A.H, ctx = A.ctx, ID = 'shooter';

  var SKINS = {
    'matrix': {
      menu: ['AGENT PURGE', 'the agents are coming down the columns · 10 waves'], title: 'AGENT PURGE',
      launch: 'THEY ARE COMING · SPACE TO FIRE', over: 'THE AGENTS HAVE YOU', win: 'HE IS THE ONE',
      player: 'chevron', playerColor: '#00ff41', enemy: 'agent', enemyColor: '#0a0a0a', enemyTrim: '#00ff41', bullet: 'glyph', bulletColor: '#7dff9a', ebullet: '#ff3b3b',
      boss: ['AGENT SMITH', 'THE ARCHITECT'], bossIntro: ['MR. ANDERSON.', 'ERGO, CONCORDANTLY.'],
      waves: ['THE CONSTRUCT', 'THE LOBBY', 'THE ROOFTOP', 'THE SUBWAY', 'SMITH', 'THE BURLY BRAWL', 'THE FREEWAY', 'THE MACHINE CITY', 'THE SENTINELS', 'THE SOURCE'],
      powers: { spread: 'TRINITY', rapid: 'BULLET TIME', shield: 'OPERATOR', bomb: 'EMP', life: 'REBOOT' }
    },
    'star-wars': {
      menu: ['TRENCH RUN', 'fighters incoming — stay on target · 10 waves'], title: 'TRENCH RUN',
      launch: 'STAY ON TARGET · SPACE TO FIRE', over: 'THE EMPIRE STRIKES BACK', win: 'GREAT SHOT, KID',
      player: 'xwing', enemy: 'tie', enemyColor: '#8a8f99', enemyTrim: '#3b3f47', bullet: 'bolt', bulletColor: '#ff3b3b', ebullet: '#7dff7d',
      boss: ['STAR DESTROYER', 'DEATH STAR'], bossIntro: ['THE EMPIRE HAS FOUND US.', "THAT'S NO MOON."],
      waves: ['YAVIN', 'THE ESCORT', 'TIE SQUADRON', 'THE BLOCKADE', 'THE DESTROYER', 'HOTH', 'THE ASTEROIDS', 'ENDOR', 'THE TRENCH', 'THE EXHAUST PORT'],
      powers: { spread: 'WEDGE', rapid: 'QUAD LASERS', shield: 'DEFLECTOR', bomb: 'PROTON TORPEDO', life: 'R2-D2' }
    },
    'avengers': {
      menu: ['SAVE NEW YORK', 'they are coming through the portal · 10 waves'], title: 'SAVE NEW YORK',
      launch: 'HOLD THE LINE · SPACE TO FIRE', over: 'NEW YORK HAS FALLEN', win: 'NEW YORK IS SAFE',
      player: 'armor', enemy: 'pod', enemyColor: '#4a3f6b', enemyTrim: '#a78bfa', bullet: 'repulsor', bulletColor: '#9be7ff', ebullet: '#c084fc', skyline: true, portal: true,
      boss: ['LEVIATHAN', 'THANOS'], bossIntro: ['THROUGH THE PORTAL.', 'I AM INEVITABLE.'],
      waves: ['THE PORTAL', 'PARK AVENUE', 'GRAND CENTRAL', 'THE BRIDGE', 'LEVIATHAN', 'MIDTOWN', 'THE HELICARRIER', 'THE TOWER', 'THE LAST STAND', 'ENDGAME'],
      powers: { spread: 'HAWKEYE', rapid: 'STARK TECH', shield: 'CAP', bomb: 'HULK', life: 'SERUM' }
    }
  };
  var POWER_COLORS = { spread: '#e0b33a', rapid: '#ff3b3b', shield: '#4bd5ff', bomb: '#7dff9a', life: '#ff6bcb' };
  function skin() { return SKINS[A.theme()] || SKINS['matrix']; }

  /* ---- waves: groups of {type, n, gap} spawned in order; a boss on 5 and 10 ---- */
  function planWave(n) {
    var g = [];
    if (n === 5 || n === 10) return { boss: n === 5 ? 1 : 2, groups: [] };
    g.push({ type: 'grunt', n: 4 + n, gap: 0.7 });
    if (n >= 2) g.push({ type: 'v', n: 5, gap: 0.25 });
    if (n >= 3) g.push({ type: 'zig', n: 3 + n, gap: 0.5 });
    if (n >= 4) g.push({ type: 'diver', n: 2 + Math.floor(n / 2), gap: 0.9 });
    if (n >= 6) g.push({ type: 'tank', n: 1 + Math.floor((n - 5) / 2), gap: 1.6 });
    if (n >= 7) g.push({ type: 'v', n: 7, gap: 0.2 }, { type: 'grunt', n: n + 2, gap: 0.4 });
    if (n >= 9) g.push({ type: 'diver', n: 5, gap: 0.5 }, { type: 'tank', n: 2, gap: 1.2 });
    return { boss: 0, groups: g };
  }
  function spawn(type, i, wave) {
    var sk = skin(), fromPortal = sk.portal, x0 = fromPortal ? W / 2 + A.rand(-50, 50) : A.rand(30, W - 30), en;
    var base = { type: type, x: x0, y: -16, t: 0, hp: 1, ph: Math.random() * 6.28, fire: A.rand(2, 5), size: 12 };
    if (type === 'grunt') en = Object.assign(base, { vy: 45 + wave * 6, sway: 50 });
    else if (type === 'v') en = Object.assign(base, { x: (i % 2 ? -20 : W + 20) - 0, y: 30 + Math.abs(i - 2) * 22, vx: (i % 2 ? 1 : -1) * (120 + wave * 8), vy: 8, fire: A.rand(1, 3) });
    else if (type === 'zig') en = Object.assign(base, { vy: 80 + wave * 8, vx: A.pick([-1, 1]) * 140, zig: 0.7 });
    else if (type === 'diver') en = Object.assign(base, { vy: 30, dive: 1.2 + Math.random(), hp: 1, size: 11 });
    else en = Object.assign(base, { vy: 22, hp: 4, size: 18, fire: 1.2, sway: 20 });
    return en;
  }

  /* ---- state ---- */
  var G = null;
  function hud() { A.hud('SCORE ' + G.score + '  WAVE ' + G.wave + '/10  BEST ' + Math.max(G.score, A.best(ID)), G.lives); }
  function reset() {
    A.clearFx();
    G = { score: 0, lives: 3, wave: 0, over: false, won: false, newBest: false, t: 0, started: false, cooldown: 0, combo: 0, comboT: 0, bombs: 2, bombFlash: 0,
          player: { x: W / 2, y: H - 30, w: 30, h: 18, inv: 0, shield: 0, spread: 0, rapid: 0 },
          bullets: [], ebullets: [], enemies: [], drops: [], boss: null, plan: null, groupIdx: 0, spawned: 0, spawnT: 0, waveDone: false, waveGap: 0, scroll: 0, portalT: 0 };
    hud();
  }
  function nextWave() {
    G.wave++; G.plan = planWave(G.wave); G.groupIdx = 0; G.spawned = 0; G.spawnT = 1.6; G.waveDone = false; hud();
    var sk = skin();
    if (G.plan.boss) {
      var b = G.plan.boss, hp = b === 1 ? 50 : 90;
      G.boss = { n: b, x: W / 2, y: -50, w: b === 1 ? 150 : 110, h: b === 1 ? 34 : 70, hp: hp, max: hp, vx: 70, t: 0, fire: 2, hurt: 0, phase: 0 };
      A.toast(sk.boss[b - 1], sk.bossIntro[b - 1], 2.4); A.sfx('boss'); A.emit('boss');
    } else A.toast('WAVE ' + G.wave, sk.waves[G.wave - 1]);
    if (G.wave > 1) A.emit('level');
  }
  function fire() {
    if (!G.started) { G.started = true; nextWave(); return; }
    if (G.cooldown > 0) return;
    var p = G.player; G.cooldown = p.rapid > 0 ? 0.09 : 0.2;
    var shots = p.spread > 0 ? [[-0.28, -6], [0, 0], [0.28, 6]] : [[0, 0]];
    shots.forEach(function (s) { G.bullets.push({ x: p.x + s[1], y: p.y - 10, vx: Math.sin(s[0]) * 460, vy: -Math.cos(s[0]) * 460 }); });
    A.sfx('shoot');
  }
  function bomb() {
    if (!G.started || G.over || G.bombs <= 0) return;
    G.bombs--; var sk = skin();
    A.flash('#ffffff', 0.9); A.shake(12); A.sfx('bomb'); G.bombFlash = 0.5;
    G.ebullets = [];
    G.enemies.forEach(function (en) { en.hp -= 3; });
    if (G.boss) { G.boss.hp -= 6; G.boss.hurt = 0.3; }
    A.floater(G.player.x, G.player.y - 30, sk.powers.bomb + '!', POWER_COLORS.bomb, true);
  }
  function applyPower(id) {
    var sk = skin(), p = G.player;
    A.sfx('power'); A.emit('power'); A.floater(p.x, p.y - 26, sk.powers[id], POWER_COLORS[id], true);
    if (id === 'spread') p.spread = 10; else if (id === 'rapid') p.rapid = 8;
    else if (id === 'shield') p.shield = Math.min(3, p.shield + 1); else if (id === 'bomb') G.bombs = Math.min(5, G.bombs + 1);
    else if (id === 'life') { G.lives = Math.min(6, G.lives + 1); hud(); }
  }
  function hurtPlayer() {
    var p = G.player, sk = skin();
    if (p.inv > 0) return;
    if (p.shield > 0) { p.shield--; p.inv = 0.8; A.sfx('shield'); A.burst(p.x, p.y, '#4bd5ff', 16, { speed: 140, life: 0.4 }); return; }
    G.lives--; G.combo = 0; p.inv = 2.2; p.spread = 0; p.rapid = 0;
    A.sfx('hurt'); A.shake(8); A.flash('#ff3b3b', 0.4); A.burst(p.x, p.y, [sk.bulletColor, '#ff8a2a', '#ffffff'], 30, { speed: 200, life: 0.6 }); hud();
    if (G.lives <= 0) { G.over = true; G.won = false; G.newBest = A.record(ID, G.score); A.sfx('over'); A.emit('over'); } else A.emit('lost');
  }
  function kill(en, i) {
    var sk = skin();
    G.enemies.splice(i, 1);
    G.combo = G.comboT > 0 ? G.combo + 1 : 1; G.comboT = 1.3;
    var gain = 10 * G.wave * Math.min(G.combo, 8); G.score += gain; hud();
    A.burst(en.x, en.y, [sk.enemyTrim, sk.enemyColor, '#ffffff', '#ff8a2a'], en.type === 'tank' ? 40 : 16, { speed: en.type === 'tank' ? 220 : 150, life: 0.5, glyphs: A.skin().glyphs ? A.skin().glyphs.split('') : null });
    if (G.combo >= 2) A.floater(en.x, en.y - 10, '×' + Math.min(G.combo, 8) + ' +' + gain, sk.bulletColor);
    A.sfx('explode'); if (en.type === 'tank') A.shake(4); A.emit('hit');
    var chance = en.type === 'tank' ? 0.6 : 0.09;
    if (Math.random() < chance) G.drops.push({ x: en.x, y: en.y, id: A.pick(['spread', 'rapid', 'shield', 'bomb', 'spread', 'rapid', 'shield', 'life']), vy: 55, spin: 0 });
  }

  /* ---- step ---- */
  function stepEnemies(dt) {
    var p = G.player, sk = skin();
    for (var i = G.enemies.length - 1; i >= 0; i--) {
      var en = G.enemies[i]; en.t += dt;
      if (en.type === 'grunt' || en.type === 'tank') { en.y += en.vy * dt; en.x += Math.sin(G.t * 2 + en.ph) * en.sway * dt; }
      else if (en.type === 'v') { en.x += en.vx * dt; en.y += en.vy * dt; if (en.x < -40 || en.x > W + 40) { G.enemies.splice(i, 1); continue; } }
      else if (en.type === 'zig') { en.y += en.vy * dt; en.x += en.vx * dt; if (en.x < 16 || en.x > W - 16) en.vx = -en.vx; }
      else if (en.type === 'diver') {
        if (en.y < 70 && !en.diving) en.y += 90 * dt; else { en.diving = true; var dx = p.x - en.x; en.x += Math.sign(dx) * Math.min(Math.abs(dx), 160 * en.dive) * dt; en.y += 150 * en.dive * dt; }
      }
      en.x = Math.max(12, Math.min(W - 12, en.x));
      /* they shoot back */
      en.fire -= dt;
      if (en.fire <= 0 && en.y > 10 && en.y < H - 80) {
        en.fire = en.type === 'tank' ? 1.4 : A.rand(2.5, 5);
        var ang = en.type === 'tank' ? Math.atan2(p.y - en.y, p.x - en.x) : Math.PI / 2, sp = 150 + G.wave * 8;
        G.ebullets.push({ x: en.x, y: en.y + 8, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp });
      }
      /* our shots */
      for (var j = G.bullets.length - 1; j >= 0; j--) {
        var b = G.bullets[j];
        if (Math.abs(b.x - en.x) < en.size + 2 && Math.abs(b.y - en.y) < en.size) { G.bullets.splice(j, 1); en.hp--; A.burst(b.x, b.y, sk.bulletColor, 3, { speed: 80, life: 0.2 }); if (en.hp > 0) A.sfx('hit'); break; }
      }
      if (en.hp <= 0) { kill(en, i); continue; }
      /* collision with us, and getting past us */
      if (Math.abs(en.x - p.x) < en.size + 8 && Math.abs(en.y - p.y) < en.size + 6) { hurtPlayer(); en.hp = 0; kill(en, i); continue; }
      if (en.y > H + 16) { G.enemies.splice(i, 1); G.combo = 0; A.floater(en.x, H - 20, 'THROUGH!', sk.ebullet); hurtPlayer(); continue; }
      if (Math.abs(en.x - p.x) < 24 && en.y > p.y - 50) A.emit('near');
    }
  }
  function stepBoss(dt) {
    var B = G.boss, p = G.player, sk = skin(); if (!B) return;
    B.t += dt; B.hurt = Math.max(0, B.hurt - dt);
    if (B.y < 60) { B.y += 40 * dt; return; }
    var enraged = B.hp < B.max / 2;
    B.x += B.vx * (enraged ? 1.8 : 1) * dt; if (B.x < B.w / 2 + 6 || B.x > W - B.w / 2 - 6) B.vx = -B.vx;
    B.fire -= dt;
    if (B.fire <= 0) {
      B.phase = (B.phase + 1) % 3; B.fire = enraged ? 1.1 : 1.7;
      var sp = 170 + G.wave * 6;
      if (B.phase === 0) for (var k = -2; k <= 2; k++) { var a = Math.PI / 2 + k * 0.28; G.ebullets.push({ x: B.x, y: B.y + B.h / 2, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp }); }
      else if (B.phase === 1) { var aim = Math.atan2(p.y - B.y, p.x - B.x); [0, 0.12, 0.24].forEach(function (d, i) { setTimeout(function () { if (G && G.boss) G.ebullets.push({ x: B.x, y: B.y + B.h / 2, vx: Math.cos(aim) * (sp + 60), vy: Math.sin(aim) * (sp + 60) }); }, i * 120); }); }
      else if (B.n === 2 || enraged) { for (var m = 0; m < 2; m++) G.enemies.push(Object.assign(spawn('grunt', m, G.wave), { x: B.x + (m ? 40 : -40), y: B.y + 20 })); }
    }
    for (var j = G.bullets.length - 1; j >= 0; j--) {
      var b = G.bullets[j];
      if (Math.abs(b.x - B.x) < B.w / 2 && Math.abs(b.y - B.y) < B.h / 2) { G.bullets.splice(j, 1); B.hp--; B.hurt = 0.12; G.score += 5; A.burst(b.x, b.y, [sk.enemyTrim, '#ffffff'], 4, { speed: 90, life: 0.25 }); A.sfx('hit'); }
    }
    if (Math.abs(p.x - B.x) < B.w / 2 + 10 && Math.abs(p.y - B.y) < B.h / 2 + 10) hurtPlayer();
    if (B.hp <= 0) {
      A.burst(B.x, B.y, [sk.enemyTrim, sk.enemyColor, '#ffffff', '#ff8a2a', sk.bulletColor], 160, { speed: 340, life: 1.4, gravity: 60 });
      A.shake(16); A.flash('#ffffff', 0.9); A.sfx('big'); G.score += 500 * B.n; G.boss = null; G.ebullets = []; hud();
      G.drops.push({ x: B.x, y: B.y, id: 'life', vy: 55, spin: 0 });
      A.floater(B.x, B.y, '+' + 500 * B.n, sk.bulletColor, true);
    }
  }
  function step(dt) {
    if (G.over) return;
    var p = G.player, sk = skin();
    var ax = A.axis(), ay = A.axisY();
    if (ax) p.x += ax * 320 * dt; if (ay) p.y += ay * 240 * dt;
    p.x = Math.max(p.w / 2, Math.min(W - p.w / 2, p.x)); p.y = Math.max(H - 110, Math.min(H - 16, p.y));
    G.scroll += dt * 30; G.portalT += dt;
    if (!G.started) return;
    G.t += dt; G.cooldown -= dt; p.inv = Math.max(0, p.inv - dt); p.spread = Math.max(0, p.spread - dt); p.rapid = Math.max(0, p.rapid - dt);
    G.comboT -= dt; if (G.comboT <= 0) G.combo = 0; G.bombFlash = Math.max(0, G.bombFlash - dt);
    /* spawning per the plan */
    var plan = G.plan;
    if (!plan.boss && G.groupIdx < plan.groups.length) {
      G.spawnT -= dt;
      if (G.spawnT <= 0) {
        var grp = plan.groups[G.groupIdx]; G.enemies.push(spawn(grp.type, G.spawned, G.wave)); G.spawned++; G.spawnT = grp.gap;
        if (G.spawned >= grp.n) { G.groupIdx++; G.spawned = 0; G.spawnT = 1.4; }
      }
    }
    G.bullets.forEach(function (b) { b.x += b.vx * dt; b.y += b.vy * dt; });
    G.bullets = G.bullets.filter(function (b) { return b.y > -10 && b.x > -10 && b.x < W + 10; });
    stepEnemies(dt); if (G.over) return;
    stepBoss(dt); if (G.over) return;
    for (var i = G.ebullets.length - 1; i >= 0; i--) {
      var e = G.ebullets[i]; e.x += e.vx * dt; e.y += e.vy * dt;
      if (e.y > H + 10 || e.x < -10 || e.x > W + 10) { G.ebullets.splice(i, 1); continue; }
      if (Math.abs(e.x - p.x) < 9 && Math.abs(e.y - p.y) < 10) { G.ebullets.splice(i, 1); hurtPlayer(); if (G.over) return; }
    }
    for (var di = G.drops.length - 1; di >= 0; di--) {
      var d = G.drops[di]; d.y += d.vy * dt; d.spin += dt * 4;
      if (Math.abs(d.x - p.x) < 22 && Math.abs(d.y - p.y) < 16) { applyPower(d.id); G.drops.splice(di, 1); } else if (d.y > H + 10) G.drops.splice(di, 1);
    }
    /* wave over? */
    var exhausted = plan.boss ? !G.boss : G.groupIdx >= plan.groups.length;
    if (exhausted && !G.enemies.length && !G.waveDone) {
      G.waveDone = true; G.waveGap = 1.6; G.score += 50 * G.wave; hud(); A.sfx('level');
      if (G.wave >= 10) { G.over = true; G.won = true; G.newBest = A.record(ID, G.score); A.sfx('win'); A.flash(sk.bulletColor, 0.6); A.emit('win'); return; }
      A.toast('WAVE ' + G.wave + ' CLEAR', '+' + 50 * G.wave, 1.4);
    }
    if (G.waveDone) { G.waveGap -= dt; if (G.waveGap <= 0) nextWave(); }
  }

  /* ---- draw ---- */
  function drawSkyline() {   /* the city to save, drifting slowly under us */
    var off = (G.scroll * 0.4) % 30;
    [['#0f1424', 0.5, 90], ['#141a2b', 1, 60]].forEach(function (layer, li) {
      var x = -off * layer[1] - 30, seed = 11 + li * 7; ctx.fillStyle = layer[0];
      while (x < W + 30) { var w = 14 + ((seed * 9301 + 49297) % 233) % 22, h = 30 + ((seed * 233 + 17) % 1000) % layer[2]; seed++; ctx.fillRect(x, H - h, w, h); if (li) { ctx.fillStyle = 'rgba(224,179,58,0.55)'; for (var wy = H - h + 6; wy < H - 6; wy += 9) for (var wx = x + 3; wx < x + w - 3; wx += 7) if (((Math.round(wx) * 7 + wy) % 5) === 0) ctx.fillRect(wx, wy, 2, 3); ctx.fillStyle = layer[0]; } x += w + 3; }
    });
  }
  function drawPortal() {
    ctx.save(); ctx.translate(W / 2, -10);
    for (var i = 0; i < 3; i++) { ctx.strokeStyle = i ? '#a78bfa' : '#4bd5ff'; ctx.globalAlpha = 0.6 - i * 0.15; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 90 - i * 20, 26 - i * 6, Math.sin(G.portalT + i) * 0.1, 0, 6.28); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.restore();
  }
  function drawEnemy(sk, en) {
    ctx.save(); ctx.translate(en.x, en.y);
    var big = en.type === 'tank' ? 1.6 : 1; ctx.scale(big, big);
    if (sk.enemy === 'agent') { ctx.fillStyle = sk.enemyColor; ctx.fillRect(-9, -12, 18, 24); ctx.fillStyle = '#e8c4a0'; ctx.fillRect(-6, -12, 12, 9); ctx.fillStyle = '#000'; ctx.fillRect(-6, -9, 5, 3); ctx.fillRect(1, -9, 5, 3); ctx.strokeStyle = sk.enemyTrim; ctx.lineWidth = 1; ctx.strokeRect(-9, -12, 18, 24); if (en.type === 'diver') { ctx.fillStyle = sk.enemyTrim; ctx.fillRect(-3, -2, 6, 6); } }
    else if (sk.enemy === 'tie') { ctx.fillStyle = sk.enemyTrim; ctx.fillRect(-14, -12, 4, 24); ctx.fillRect(10, -12, 4, 24); ctx.fillStyle = sk.enemyColor; ctx.beginPath(); ctx.arc(0, 0, 7, 0, 6.28); ctx.fill(); ctx.fillRect(-10, -2, 20, 4); if (en.type === 'diver') { ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-2, -2, 4, 4); } }
    else { ctx.fillStyle = sk.enemyColor; ctx.beginPath(); ctx.ellipse(0, 0, 13, 8, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = sk.enemyTrim; ctx.shadowColor = sk.enemyTrim; ctx.shadowBlur = 8; ctx.beginPath(); ctx.arc(0, 0, 3, 0, 6.28); ctx.fill(); ctx.shadowBlur = 0; if (en.type === 'diver') { ctx.fillStyle = '#ff8a2a'; ctx.fillRect(-8, 6, 16, 3); } }
    ctx.restore();
    if (en.hp > 1) A.bar(en.x - 14, en.y - en.size - 6, 28, 3, en.hp / 4, sk.enemyTrim);
  }
  function drawBoss(sk, B) {
    var t = A.theme(), hurt = B.hurt > 0, col = function (c) { return hurt ? '#ffffff' : c; };
    ctx.save(); ctx.translate(B.x, B.y);
    if (t === 'star-wars') {
      if (B.n === 1) { ctx.fillStyle = col('#8a8f99'); ctx.beginPath(); ctx.moveTo(0, -B.h / 2); ctx.lineTo(B.w / 2, B.h / 2); ctx.lineTo(-B.w / 2, B.h / 2); ctx.closePath(); ctx.fill(); ctx.fillStyle = '#5c616b'; ctx.fillRect(-14, -B.h / 2 - 8, 28, 14); ctx.fillStyle = '#4bd5ff'; ctx.fillRect(-5, -B.h / 2 - 12, 4, 4); ctx.fillRect(1, -B.h / 2 - 12, 4, 4); }
      else { ctx.fillStyle = col('#8a8f99'); ctx.beginPath(); ctx.arc(0, 0, B.h / 2, 0, 6.28); ctx.fill(); ctx.fillStyle = '#5c616b'; ctx.beginPath(); ctx.arc(-12, -10, 9, 0, 6.28); ctx.fill(); ctx.strokeStyle = '#3b3f47'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-B.h / 2, 6); ctx.lineTo(B.h / 2, 6); ctx.stroke(); if (Math.sin(B.t * 5) > 0.92) { ctx.strokeStyle = '#7dff7d'; ctx.shadowColor = '#7dff7d'; ctx.shadowBlur = 10; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-12, -10); ctx.lineTo(-12, H); ctx.stroke(); ctx.shadowBlur = 0; } }
    } else if (t === 'avengers') {
      if (B.n === 1) { ctx.fillStyle = col('#4a3f6b'); ctx.beginPath(); ctx.ellipse(0, 0, B.w / 2, B.h / 2, 0, 0, 6.28); ctx.fill(); ctx.fillStyle = '#a78bfa'; for (var i = -3; i <= 3; i++) ctx.fillRect(i * 20 - 2, -B.h / 2 - 4 + Math.sin(B.t * 6 + i) * 4, 4, 10); ctx.fillStyle = '#e0b33a'; ctx.fillRect((B.vx > 0 ? 1 : -1) * (B.w / 2 - 16), -4, 8, 8); }
      else { ctx.fillStyle = col('#6b4c9a'); ctx.fillRect(-26, -35, 52, 70); ctx.fillStyle = col('#8b6cc0'); ctx.beginPath(); ctx.arc(0, -42, 16, 0, 6.28); ctx.fill(); ctx.fillStyle = '#e0b33a'; ctx.fillRect(-40, -20, 14, 40); ['#a78bfa', '#ff3b3b', '#4bd5ff', '#7dff9a', '#e0b33a', '#ff8a2a'].forEach(function (c, i) { ctx.fillStyle = c; ctx.shadowColor = c; ctx.shadowBlur = 8 + 4 * Math.sin(B.t * 4 + i); ctx.fillRect(-38 + (i % 3) * 5, -14 + Math.floor(i / 3) * 24, 3, 3); }); ctx.shadowBlur = 0; ctx.fillStyle = '#000'; ctx.fillRect(-10, -46, 6, 3); ctx.fillRect(4, -46, 6, 3); }
    } else {
      if (B.n === 1) { ctx.fillStyle = col('#0a0a0a'); ctx.fillRect(-B.w / 2, -B.h / 2, B.w, B.h); ctx.strokeStyle = '#00ff41'; ctx.lineWidth = 2; ctx.strokeRect(-B.w / 2, -B.h / 2, B.w, B.h); for (var j = 0; j < 5; j++) { ctx.fillStyle = '#e8c4a0'; ctx.fillRect(-B.w / 2 + 10 + j * 28, -B.h / 2 - 12, 12, 12); ctx.fillStyle = '#000'; ctx.fillRect(-B.w / 2 + 11 + j * 28, -B.h / 2 - 9, 10, 3); } ctx.fillStyle = '#00ff41'; ctx.font = 'bold 12px ' + A.skin().font; ctx.textAlign = 'center'; ctx.fillText(hurt ? 'MR. ANDERSON' : 'ME. ME. ME. ME. ME.', 0, 5); }
      else { ctx.fillStyle = col('#f2f2f2'); ctx.beginPath(); ctx.arc(0, -8, 26, 0, 6.28); ctx.fill(); ctx.fillStyle = '#0a0a0a'; ctx.fillRect(-30, 18, 60, 18); ctx.fillStyle = '#c9ccd3'; ctx.fillRect(-26, -30, 52, 10); ctx.fillStyle = '#00ff41'; ctx.font = '9px ' + A.skin().font; ctx.textAlign = 'center'; for (var r = 0; r < 3; r++) ctx.fillText('01' + (Math.floor(B.t * 3) + r) % 2 + '1', -20 + r * 20, -6); }
    }
    ctx.restore();
    A.bar(W / 2 - 90, 8, 180, 5, B.hp / B.max, hurt ? '#ffffff' : sk.enemyTrim);
    ctx.fillStyle = sk.enemyTrim; ctx.font = '10px ' + A.skin().font; ctx.textAlign = 'center'; ctx.fillText(sk.boss[B.n - 1], W / 2, 24);
  }
  function drawPlayer(sk, p) {
    if (p.inv > 0 && Math.floor(p.inv * 12) % 2) return;
    ctx.save(); ctx.translate(p.x, p.y);
    var thrust = 6 + Math.random() * 6;
    if (sk.player === 'chevron') { ctx.fillStyle = sk.playerColor; ctx.shadowColor = sk.playerColor; ctx.shadowBlur = 12; ctx.beginPath(); ctx.moveTo(0, -14); ctx.lineTo(15, 8); ctx.lineTo(0, 2); ctx.lineTo(-15, 8); ctx.closePath(); ctx.fill(); ctx.globalAlpha = 0.6; ctx.fillRect(-2, 6, 4, thrust); }
    else if (sk.player === 'xwing') { ctx.fillStyle = '#ff8a2a'; ctx.globalAlpha = 0.8; ctx.fillRect(-2, 12, 4, thrust); ctx.globalAlpha = 1; ctx.fillStyle = '#c9ccd3'; ctx.fillRect(-3, -14, 6, 26); ctx.fillStyle = '#b11313'; ctx.fillRect(-16, -4, 13, 4); ctx.fillRect(3, -4, 13, 4); ctx.fillStyle = '#c9ccd3'; ctx.fillRect(-16, 4, 13, 4); ctx.fillRect(3, 4, 13, 4); ctx.fillStyle = '#ff3b3b'; ctx.fillRect(-17, -6, 2, 3); ctx.fillRect(15, -6, 2, 3); }
    else { ctx.fillStyle = '#ff8a2a'; ctx.globalAlpha = 0.8; ctx.fillRect(-6, 12, 4, thrust); ctx.fillRect(2, 12, 4, thrust); ctx.globalAlpha = 1; ctx.fillStyle = '#b11313'; ctx.fillRect(-7, -10, 14, 22); ctx.fillStyle = '#e0b33a'; ctx.fillRect(-7, -10, 14, 4); ctx.fillRect(-2, -2, 4, 10); ctx.beginPath(); ctx.arc(0, -16, 6, 0, 6.28); ctx.fill(); ctx.fillStyle = '#9be7ff'; ctx.shadowColor = '#9be7ff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(0, -4, 2.5, 0, 6.28); ctx.fill(); }
    ctx.restore(); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
    if (p.shield > 0) { ctx.strokeStyle = '#4bd5ff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.5 + 0.3 * Math.sin(G.t * 8); ctx.beginPath(); ctx.arc(p.x, p.y, 20 + p.shield * 2, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1; }
  }
  function draw(dt) {
    var sk = skin(), base = A.skin(), p = G.player;
    A.backdrop(dt, G.started ? 1 : 0.3);
    if (sk.portal) drawPortal();
    if (sk.skyline) drawSkyline();
    if (G.bombFlash > 0) { ctx.strokeStyle = POWER_COLORS.bomb; ctx.lineWidth = 3; ctx.globalAlpha = G.bombFlash * 2; ctx.beginPath(); ctx.arc(p.x, p.y, (0.5 - G.bombFlash) * 1400, 0, 6.28); ctx.stroke(); ctx.globalAlpha = 1; }
    G.drops.forEach(function (d) { A.pill(d.x, d.y, sk.powers[d.id], POWER_COLORS[d.id]); });
    G.enemies.forEach(function (en) { drawEnemy(sk, en); });
    if (G.boss) drawBoss(sk, G.boss);
    ctx.fillStyle = sk.bulletColor; ctx.strokeStyle = sk.bulletColor; ctx.shadowColor = sk.bulletColor; ctx.shadowBlur = 8;
    G.bullets.forEach(function (b) {
      if (sk.bullet === 'glyph') { ctx.font = '12px ' + base.font; ctx.textAlign = 'center'; ctx.fillText('|', b.x, b.y); }
      else if (sk.bullet === 'bolt') { ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(b.x, b.y); ctx.lineTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03); ctx.stroke(); }
      else { ctx.beginPath(); ctx.arc(b.x, b.y, 3.5, 0, 6.28); ctx.fill(); }
    });
    ctx.fillStyle = sk.ebullet; ctx.shadowColor = sk.ebullet;
    G.ebullets.forEach(function (e) { ctx.beginPath(); ctx.arc(e.x, e.y, 3, 0, 6.28); ctx.fill(); });
    ctx.shadowBlur = 0;
    drawPlayer(sk, p);
    /* bottom strip: bombs, power timers, combo */
    ctx.fillStyle = POWER_COLORS.bomb; ctx.font = '10px ' + base.font; ctx.textAlign = 'left'; ctx.fillText(sk.powers.bomb + ' ×' + G.bombs + '  [x]', 6, H - 6);
    var shown = 0;
    [['spread', 10], ['rapid', 8]].forEach(function (pw) { if (p[pw[0]] > 0) { A.bar(6, H - 22 - shown * 9, 60, 3, p[pw[0]] / pw[1], POWER_COLORS[pw[0]]); ctx.fillStyle = POWER_COLORS[pw[0]]; ctx.font = '8px ' + base.font; ctx.fillText(sk.powers[pw[0]], 70, H - 19 - shown * 9); shown++; } });
    if (G.combo >= 3) { ctx.fillStyle = sk.bulletColor; ctx.font = 'bold 12px ' + base.font; ctx.textAlign = 'right'; ctx.fillText('COMBO ×' + Math.min(G.combo, 8), W - 6, H - 6); }
    if (!G.started && !G.over) A.banner(sk.launch, H / 2 + 60);
    if (G.over) A.endScreen(G.won, sk.win, sk.over, G.score, G.newBest);
  }

  A.register(ID, {
    menu: function (t) { return (SKINS[t] || SKINS['matrix']).menu; },
    title: function (t) { return (SKINS[t] || SKINS['matrix']).title; },
    help: '← → ↑ ↓ or mouse · space / click fires · x drops a bomb · p pauses',
    start: reset, step: step, draw: draw,
    primary: function () { if (!G) return; if (G.over) reset(); else fire(); },
    secondary: bomb,
    pointer: function (x, y) { if (!G) return; G.player.x = Math.max(G.player.w / 2, Math.min(W - G.player.w / 2, x)); if (y != null) G.player.y = Math.max(H - 110, Math.min(H - 16, y)); },
    state: function () { return G; }
  });
})();
