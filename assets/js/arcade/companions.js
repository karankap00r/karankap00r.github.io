/* Hidden arcade — the partner. A figure beside the board, drawn from
   primitives, who reacts to play with poses and speech bubbles. One entry
   per theme in COMPANIONS: `lines` by event, and `draw(ctx, pose, t)` in a
   140×220 logical space. Games talk to it through core's A.emit(event):
   hello · hit · lost · level · over · win · near. */
(function () {
  var api = window.site && window.site.arcade, A = api && api._core;
  if (!A || !A.bctx) return;
  var bubble = document.getElementById('arcade-bubble');
  var BW = A.BW, BH = A.BH;
  var buddy = fresh();
  function fresh() { return { pose: 'idle', until: 0, t: 0, nextIdle: 6000, bubbleTimer: null }; }

  var COMPANIONS = {
    'matrix': {
      lines: { hello: ['Wake up.', 'Free your mind.'], hit: ['Whoa.', 'Nice.', 'I know kung fu.'], lost: ['Dodge this.', 'Not yet.'], level: ['Deeper.', 'Follow the rabbit.'], over: ['System failure.', 'Guns. Lots of guns.'], win: ['There is no spoon.', 'He is the One.'], idle: ['…', 'Déjà vu.', 'Blue pill?'], power: ['Red pill.', 'Take it.', 'Upgrades.'], boss: ['Smith.', 'Run, Neo.', 'He is not like the others.'] },
      draw: function (c, pose, t) {
        var lean = pose === 'dodge' ? -0.5 : 0, bob = Math.sin(t / 500) * 2, down = pose === 'sad' ? 6 : 0;
        c.save(); c.translate(BW / 2, BH - 20); c.rotate(lean); c.translate(0, bob);
        c.fillStyle = '#0a0a0a'; c.fillRect(-16, -70, 12, 60); c.fillRect(4, -70, 12, 60);                     /* legs */
        c.fillStyle = '#111'; c.beginPath(); c.moveTo(-26, -150); c.lineTo(26, -150); c.lineTo(34, -60); c.lineTo(-34, -60); c.closePath(); c.fill(); /* coat */
        c.strokeStyle = 'rgba(0,255,65,0.45)'; c.lineWidth = 1.5; c.stroke();                                    /* rim light */
        c.fillStyle = '#111'; c.fillRect(-42, -148, 14, pose === 'cheer' ? 30 : 70); c.fillRect(28, -148, 14, 70);   /* arms */
        if (pose === 'cheer') c.fillRect(-42, -190, 14, 46);                                                     /* arm up */
        c.fillStyle = '#e8c4a0'; c.beginPath(); c.arc(0, -168 + down, 17, 0, 6.28); c.fill();                    /* head */
        c.fillStyle = '#000'; c.fillRect(-15, -174 + down, 12, 7); c.fillRect(3, -174 + down, 12, 7); c.fillRect(-3, -172 + down, 6, 2); /* shades */
        c.fillStyle = '#111'; c.beginPath(); c.arc(0, -180 + down, 17, Math.PI, 0); c.fill();                    /* hair */
        c.restore();
      }
    },
    'star-wars': {
      lines: { hello: ['Use the Force.', 'Trust your feelings.'], hit: ['Great shot!', 'The Force is strong.'], lost: ['I have a bad feeling…', 'Patience.'], level: ['Punch it.', 'Stay on target.'], over: ['Do. Or do not.', 'This is not the way.'], win: ['The Force is with you.', 'Never tell me the odds!'], idle: ['Hmm.', 'Feel the Force.', '…'], power: ['The Force is with you.', 'Good. Good.'], boss: ["That's no moon.", 'I sense a disturbance.', 'Stay on target.'] },
      draw: function (c, pose, t) {
        var bob = Math.sin(t / 700) * 2, raise = pose === 'cheer' ? -1.1 : pose === 'sad' ? 0.4 : Math.sin(t / 900) * 0.08, bow = pose === 'win' ? 0.35 : 0;
        c.save(); c.translate(BW / 2, BH - 20 + bob); c.rotate(bow);
        c.fillStyle = '#6b4e2e'; c.beginPath(); c.moveTo(-22, -150); c.lineTo(22, -150); c.lineTo(36, 0); c.lineTo(-36, 0); c.closePath(); c.fill(); /* robe */
        c.fillStyle = '#5a4026'; c.beginPath(); c.moveTo(-26, -150); c.lineTo(26, -150); c.lineTo(20, -190); c.lineTo(-20, -190); c.closePath(); c.fill(); /* hood */
        c.fillStyle = pose === 'sad' ? '#2a1d10' : '#e8c4a0'; c.beginPath(); c.arc(0, -165, 12, 0, 6.28); c.fill();     /* face, in shadow when sad */
        c.save(); c.translate(22, -110); c.rotate(raise);                                                            /* saber arm */
        c.fillStyle = '#6b4e2e'; c.fillRect(-6, 0, 12, 34); c.fillStyle = '#9a9a9a'; c.fillRect(-4, 30, 8, 16);
        c.strokeStyle = '#7dff7d'; c.lineWidth = 5; c.lineCap = 'round'; c.shadowColor = '#7dff7d'; c.shadowBlur = 14;
        c.beginPath(); c.moveTo(0, 30); c.lineTo(0, -60); c.stroke(); c.strokeStyle = '#ffffff'; c.lineWidth = 2; c.shadowBlur = 0; c.beginPath(); c.moveTo(0, 30); c.lineTo(0, -60); c.stroke();
        c.restore(); c.restore();
      }
    },
    'avengers': {
      lines: { hello: ['I am Iron Man.', 'Suit up.'], hit: ['Nice shot.', 'Boom.', "That's my line."], lost: ['Ouch.', 'Regroup.'], level: ['Assemble!', 'Bigger.'], over: ['Whatever it takes.', 'We lost.'], win: ['I am Iron Man.', 'Part of the journey is the end.'], idle: ['Jarvis?', 'Genius, billionaire…', '…'], power: ['Upgrade.', 'Jarvis, deploy.', 'Nice.'], boss: ['Big one.', 'Bring it.', 'Jarvis, give me a target.'] },
      draw: function (c, pose, t) {
        var bob = Math.sin(t / 400) * 4, fist = pose === 'cheer' ? -1.4 : pose === 'sad' ? 0.6 : 0.2, pulse = 0.6 + 0.4 * Math.sin(t / 300);
        c.save(); c.translate(BW / 2, BH - 40 + bob);
        c.fillStyle = '#ff8a2a'; c.globalAlpha = 0.85; c.beginPath(); c.moveTo(-14, -2); c.lineTo(-8, 26 + Math.random() * 8); c.lineTo(-2, -2); c.fill(); c.beginPath(); c.moveTo(2, -2); c.lineTo(8, 26 + Math.random() * 8); c.lineTo(14, -2); c.fill(); c.globalAlpha = 1; /* jets */
        c.fillStyle = '#b11313'; c.fillRect(-16, -70, 12, 68); c.fillRect(4, -70, 12, 68);                      /* legs */
        c.fillStyle = '#e0b33a'; c.fillRect(-16, -14, 12, 12); c.fillRect(4, -14, 12, 12);                       /* boots */
        c.fillStyle = '#b11313'; c.beginPath(); c.moveTo(-26, -150); c.lineTo(26, -150); c.lineTo(30, -66); c.lineTo(-30, -66); c.closePath(); c.fill(); /* torso */
        c.fillStyle = '#e0b33a'; c.fillRect(-26, -150, 52, 10); c.fillRect(-8, -120, 16, 44);                  /* gold trim */
        c.fillStyle = '#9be7ff'; c.shadowColor = '#9be7ff'; c.shadowBlur = 16 * pulse; c.beginPath(); c.arc(0, -128, 7, 0, 6.28); c.fill(); c.shadowBlur = 0; /* reactor */
        c.save(); c.translate(-30, -140); c.rotate(fist); c.fillStyle = '#b11313'; c.fillRect(-6, 0, 12, 60); c.fillStyle = '#e0b33a'; c.fillRect(-7, 56, 14, 14); c.restore(); /* left arm */
        c.save(); c.translate(30, -140); c.rotate(-0.2); c.fillStyle = '#b11313'; c.fillRect(-6, 0, 12, 60); c.fillStyle = '#e0b33a'; c.fillRect(-7, 56, 14, 14); c.restore();  /* right arm */
        c.fillStyle = '#b11313'; c.beginPath(); c.arc(0, -170, 18, 0, 6.28); c.fill();                          /* helmet */
        c.fillStyle = '#e0b33a'; c.beginPath(); c.moveTo(-12, -180); c.lineTo(12, -180); c.lineTo(10, -156); c.lineTo(-10, -156); c.closePath(); c.fill(); /* faceplate */
        c.fillStyle = '#dffcff'; c.shadowColor = '#9be7ff'; c.shadowBlur = 8; c.fillRect(-9, -172, 6, 3); c.fillRect(3, -172, 6, 3); c.shadowBlur = 0; /* eyes */
        c.restore();
      }
    }
  };
  function companion() { return COMPANIONS[A.theme()] || COMPANIONS['matrix']; }
  function say(kind) {
    var L = companion().lines[kind]; if (!L || !bubble) return;
    bubble.textContent = L[Math.floor(Math.random() * L.length)]; bubble.hidden = false;
    bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
    clearTimeout(buddy.bubbleTimer); buddy.bubbleTimer = setTimeout(function () { bubble.hidden = true; }, 2400);
  }
  function pose(p, ms) { buddy.pose = p; buddy.until = buddy.t + (ms || 900); }

  A.emit = function (ev) {
    if (ev === 'hello') { pose('cheer', 1200); say('hello'); }
    else if (ev === 'hit') { if (Math.random() < 0.35) { pose('cheer', 500); if (Math.random() < 0.5) say('hit'); } }
    else if (ev === 'lost') { pose('sad', 1500); say('lost'); }
    else if (ev === 'level') { pose('cheer', 1200); say('level'); }
    else if (ev === 'over') { pose('sad', 99999); say('over'); }
    else if (ev === 'win') { pose('win', 99999); say('win'); }
    else if (ev === 'near') { if (buddy.pose === 'idle') pose('dodge', 400); }
    else if (ev === 'power') { pose('cheer', 700); if (Math.random() < 0.6) say('power'); }
    else if (ev === 'boss') { pose('dodge', 1200); say('boss'); }
  };
  A.resetBuddy = function () { buddy = fresh(); };
  A.drawBuddy = function (dt) {
    buddy.t += dt * 1000;
    if (buddy.t > buddy.until && buddy.pose !== 'idle' && buddy.until < 99990) buddy.pose = 'idle';
    buddy.nextIdle -= dt * 1000; if (buddy.nextIdle <= 0) { buddy.nextIdle = 7000 + Math.random() * 8000; if (buddy.pose === 'idle') say('idle'); }
    A.bctx.clearRect(0, 0, BW, BH); companion().draw(A.bctx, buddy.pose, buddy.t);
  };
  api.buddy = function () { return buddy; };
  api.say = say;
})();
