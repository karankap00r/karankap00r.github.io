/* Soundscapes, synthesised with the Web Audio API (no audio files). Off by
   default; the header button or "m" turns it on, and the choice is
   remembered. Only themes listed in SCAPES have sound; the button hides
   for the rest. Browsers gate audio behind a user gesture, so the graph is
   built on the first click/keypress after enabling. */
(function () {
  var AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  var root = document.documentElement, KEY = 'kk.sound';
  var ctx = null, master = null, current = null, scape = null, timers = [];
  function theme() { return root.getAttribute('data-theme') || 'system'; }
  function enabled() { try { return localStorage.getItem(KEY) === 'on'; } catch (e) { return false; } }
  function setEnabled(v) { try { if (v) localStorage.setItem(KEY, 'on'); else localStorage.removeItem(KEY); } catch (e) {} }

  function ensure() {
    if (ctx) return ctx;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    return ctx;
  }
  function later(fn, ms) { var t = setTimeout(function () { timers = timers.filter(function (x) { return x !== t; }); fn(); }, ms); timers.push(t); return t; }
  function every(fn, minMs, maxMs) { (function tick() { later(function () { if (scape) { fn(); tick(); } }, minMs + Math.random() * (maxMs - minMs)); })(); }
  function noiseBuffer(seconds, brown) {
    var n = ctx.sampleRate * seconds, b = ctx.createBuffer(1, n, ctx.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < n; i++) { var w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
    return b;
  }
  function noise(opts) {  /* looping noise → filter → gain */
    var src = ctx.createBufferSource(); src.buffer = noiseBuffer(3, opts.brown); src.loop = true;
    var f = ctx.createBiquadFilter(); f.type = opts.type || 'lowpass'; f.frequency.value = opts.freq || 1000; f.Q.value = opts.q || 0.7;
    var g = ctx.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(master); src.start();
    g.gain.linearRampToValueAtTime(opts.gain, ctx.currentTime + 1.2);
    return { src: src, filter: f, gain: g };
  }
  function tone(opts) {  /* one-shot oscillator with an envelope */
    var o = ctx.createOscillator(), g = ctx.createGain(), t = ctx.currentTime;
    o.type = opts.type || 'sine'; o.frequency.setValueAtTime(opts.from, t);
    if (opts.to) o.frequency.exponentialRampToValueAtTime(opts.to, t + (opts.dur || 0.15));
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(opts.gain || 0.2, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + (opts.dur || 0.15));
    var out = g; if (opts.filter) { var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.filter; g.connect(f); out = f; }
    o.connect(g); out.connect(master); o.start(t); o.stop(t + (opts.dur || 0.15) + 0.05);
  }
  function burst(opts) {  /* one-shot noise burst */
    var src = ctx.createBufferSource(); src.buffer = noiseBuffer(opts.dur || 1, opts.brown);
    var f = ctx.createBiquadFilter(); f.type = opts.type || 'lowpass'; f.frequency.value = opts.freq || 200;
    var g = ctx.createGain(), t = ctx.currentTime;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(opts.gain || 0.3, t + (opts.attack || 0.02));
    g.gain.exponentialRampToValueAtTime(0.0001, t + (opts.dur || 1));
    src.connect(f); f.connect(g); g.connect(master); src.start(t); src.stop(t + (opts.dur || 1) + 0.05);
  }
  function drone(freqs, opts) {  /* sustained detuned oscillators → lowpass → gain */
    var g = ctx.createGain(); g.gain.value = 0; var f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = opts.cutoff || 300;
    var oscs = freqs.map(function (fr) { var o = ctx.createOscillator(); o.type = opts.type || 'sawtooth'; o.frequency.value = fr; o.connect(f); o.start(); return o; });
    f.connect(g); g.connect(master); g.gain.linearRampToValueAtTime(opts.gain, ctx.currentTime + 2);
    var lfo = null;
    if (opts.lfo) { lfo = ctx.createOscillator(); var lg = ctx.createGain(); lfo.frequency.value = opts.lfo; lg.gain.value = opts.lfoDepth || 80; lfo.connect(lg); lg.connect(f.frequency); lfo.start(); }
    return { gain: g, stop: function () { oscs.forEach(function (o) { try { o.stop(); } catch (e) {} }); if (lfo) lfo.stop(); } };
  }

  var SCAPES = {
    'rain': function () {
      var n = noise({ freq: 1400, gain: 0.14 });
      every(function () { tone({ from: 2200 + Math.random() * 2000, to: 900, dur: 0.06, gain: 0.03 }); }, 250, 900);
      return { stop: function () { n.src.stop(); }, on: {} };
    },
    'storm': function () {
      var n = noise({ freq: 1000, gain: 0.16 });
      function thunder() { burst({ brown: true, freq: 140, dur: 2.6, gain: 0.5, attack: 0.05 }); later(function () { burst({ brown: true, freq: 90, dur: 3.5, gain: 0.35, attack: 0.3 }); }, 400); }
      every(thunder, 9000, 22000);
      return { stop: function () { n.src.stop(); }, on: { thunder: thunder } };
    },
    'snow': function () {
      var n = noise({ type: 'bandpass', freq: 420, q: 0.5, gain: 0.09 });
      var lfo = ctx.createOscillator(), lg = ctx.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 260; lfo.connect(lg); lg.connect(n.filter.frequency); lfo.start();
      return { stop: function () { n.src.stop(); lfo.stop(); }, on: {} };
    },
    'star-wars': function () {
      var d = drone([55, 110.5, 165], { cutoff: 220, gain: 0.05, lfo: 0.15, lfoDepth: 60 });
      return { stop: d.stop, on: {
        click: function () { tone({ type: 'sawtooth', from: 1400, to: 320, dur: 0.16, gain: 0.12, filter: 2400 }); },
        jump: function () { burst({ type: 'bandpass', freq: 900, dur: 1.6, gain: 0.35, attack: 0.9 }); tone({ from: 120, to: 1800, dur: 1.5, gain: 0.05 }); }
      } };
    },
    'avengers': function () {
      var d = drone([65.4, 65.9, 98], { cutoff: 260, gain: 0.06, lfo: 0.06, lfoDepth: 120 });
      return { stop: d.stop, on: {
        click: function () { tone({ type: 'square', from: 2100, to: 1900, dur: 0.09, gain: 0.05, filter: 3000 }); burst({ type: 'bandpass', freq: 2600, dur: 0.18, gain: 0.12, attack: 0.005 }); }
      } };
    },
    'matrix': function () {
      var d = drone([48], { type: 'triangle', cutoff: 200, gain: 0.035 });
      every(function () { tone({ from: 700 + Math.random() * 1100, dur: 0.05, gain: 0.04 }); }, 120, 700);
      return { stop: d.stop, on: { click: function () { tone({ type: 'square', from: 1600, to: 400, dur: 0.08, gain: 0.05, filter: 2500 }); } } };
    },
    'cyberpunk': function () {
      var d = drone([110, 110.7, 164.8, 220.3], { cutoff: 380, gain: 0.045, lfo: 0.22, lfoDepth: 220 });
      return { stop: d.stop, on: { click: function () { tone({ type: 'square', from: 300 + Math.random() * 900, to: 80, dur: 0.07, gain: 0.06, filter: 3000 }); } } };
    },
    'crt': function () {
      var d = drone([60, 120, 180], { type: 'sine', cutoff: 400, gain: 0.035 });
      var n = noise({ type: 'highpass', freq: 6000, gain: 0.015 });
      return { stop: function () { d.stop(); n.src.stop(); }, on: { click: function () { tone({ type: 'square', from: 1200, dur: 0.03, gain: 0.04 }); } } };
    },
    '90s-vibes': function () {  /* a modem handshake, once */
      var seq = [[1200, 0.25], [2100, 0.25], [1650, 0.2], [2250, 0.2], [980, 0.15], [1650, 0.15]], t = 0;
      seq.forEach(function (s) { later(function () { tone({ type: 'square', from: s[0], dur: s[1], gain: 0.05, filter: 2600 }); }, t * 1000); t += s[1] + 0.05; });
      later(function () { burst({ type: 'bandpass', freq: 1800, dur: 1.4, gain: 0.08, attack: 0.1 }); }, t * 1000);
      return { stop: function () {}, on: {} };
    }
  };
  function scapeFor(t) { return SCAPES[t] ? t : (/^crt-/.test(t) ? 'crt' : null); }
  function has(t) { return !!scapeFor(t || theme()); }

  function stop() {
    timers.forEach(clearTimeout); timers = [];
    if (scape) { var s = scape; scape = null; current = null;
      if (master) { master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6); }
      later(function () { try { s.stop(); } catch (e) {} if (master && enabled() && !scape) master.gain.value = 0.5; }, 700);
    }
  }
  function start() {
    var name = scapeFor(theme());
    if (!name || !enabled()) return;
    if (current === name && scape) return;
    stop();
    ensure(); if (ctx.state === 'suspended') ctx.resume();
    later(function () { if (!enabled()) return; master.gain.cancelScheduledValues(ctx.currentTime); master.gain.setValueAtTime(0.0001, ctx.currentTime); master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.8); current = name; scape = SCAPES[name](); }, scape ? 720 : 0);
  }
  function trigger(n) { if (scape && scape.on && scape.on[n] && ctx && ctx.state === 'running') scape.on[n](); }

  /* header button */
  var btn = document.querySelector('[data-sound-toggle]');
  function paint() {
    if (!btn) return;
    btn.hidden = !has();
    var on = enabled();
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.querySelector('.sound-state').textContent = on ? 'sound on' : 'sound off';
    btn.title = (on ? 'Mute' : 'Unmute') + ' (m)';
  }
  function toggle() { setEnabled(!enabled()); if (enabled()) start(); else stop(); paint(); return enabled(); }
  if (btn) btn.addEventListener('click', toggle);
  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    var t = e.target; if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'm' && has()) { toggle(); e.preventDefault(); }
  });
  /* audio can only start after a gesture: arm on the first one */
  function arm() { if (enabled() && has()) start(); }
  ['pointerdown', 'keydown'].forEach(function (ev) { document.addEventListener(ev, arm, { once: false, passive: true }); });
  document.addEventListener('themechange', function () { paint(); if (enabled()) { if (has()) start(); else stop(); } });
  document.addEventListener('visibilitychange', function () { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (enabled() && scape) ctx.resume(); });
  paint();

  window.site = window.site || {};
  window.site.sound = { enabled: enabled, has: has, toggle: toggle, on: function () { setEnabled(true); start(); paint(); }, off: function () { setEnabled(false); stop(); paint(); }, trigger: trigger,
    beep: function (f, d) { if (!enabled()) return; ensure(); if (ctx.state === 'suspended') ctx.resume(); tone({ type: 'square', from: f, dur: d || 0.06, gain: 0.06, filter: 3000 }); },
    themes: Object.keys(SCAPES).map(function (k) { return k === 'crt' ? 'crt-*' : k; }) };
})();
