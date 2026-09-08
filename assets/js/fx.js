/* Theme flourishes that need a little JS: click sparks in each theme's
   glyph and colour, and a decode/glitch reveal for page titles. Everything
   here is off under reduced motion. The CSS side (entrances, hovers,
   heading effects, overlays) lives in style.css under "Theme FX". */
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var root = document.documentElement, layer = document.getElementById('sparks');
  if (!layer) return;

  var SPARKS = {
    'valentines-day':   { g: ['♥', '♡'], c: ['#ff1f7a', '#e8517f', '#ff8fb1'] },
    'st-patricks-day':  { g: ['☘'], c: ['#1e7a3c', '#2e8b57', '#59996a'] },
    'snow':             { g: ['❄', '✻', '•'], c: ['#9cc3e5', '#3b82c4', '#ffffff'] },
    'rain':             { ripple: true, c: ['#2e6f95', '#5a8fb0'] },
    'storm':            { g: ['⚡'], c: ['#b8c9ff', '#ffffff'] },
    'sunshine':         { g: ['✦', '✧', '•'], c: ['#ff9f1c', '#ffd23f', '#ffcf5c'] },
    'star-wars':        { bolt: true, c: ['#ffe81f', '#4bd5ff', '#ff3b3b'] },
    'avengers':         { g: ['✦', '•'], c: ['#e2231a', '#e0b33a', '#9be7ff'] },
    'matrix':           { g: 'ｱｲｳｴｵｶｷ0123456789'.split(''), c: ['#00ff41', '#00b32d', '#7dff9a'] },
    'cyberpunk':        { g: ['▮', '▬', '▪'], c: ['#ff2a6d', '#00e5ff', '#f2f2ff'] },
    '90s-vibes':        { g: ['★', '✩', '✦'], c: ['#ffff00', '#ff2fd6', '#ffffff', '#00ffff'] },
    'web-rings':        { g: ['★'], c: ['#0000ee', '#551a8b', '#ff0000'] },
    'crt-red':          { g: ['▪'], c: ['#ff3b1f'] },
    'crt-amber':        { g: ['▪'], c: ['#ffb000'] },
    'crt-green':        { g: ['▪'], c: ['#7dff9a'] },
    'crt-mono':         { g: ['▪'], c: ['#e6e6e6'] }
  };
  function theme() { return root.getAttribute('data-theme') || 'system'; }

  document.addEventListener('click', function (e) {
    var cfg = SPARKS[theme()];
    if (!cfg || e.target.closest('.console, .lightbox, .arcade, button, input, select, textarea')) return;
    if (window.site && window.site.sound) window.site.sound.trigger('click');
    var n = (cfg.ripple || cfg.bolt) ? 1 : 8 + Math.floor(Math.random() * 5);
    for (var i = 0; i < n; i++) {
      var s = document.createElement('span');
      s.className = 'spark' + (cfg.ripple ? ' spark-ripple' : cfg.bolt ? ' spark-bolt' : '');
      if (!cfg.ripple && !cfg.bolt) s.textContent = cfg.g[Math.floor(Math.random() * cfg.g.length)];
      var col = cfg.c[Math.floor(Math.random() * cfg.c.length)];
      s.style.color = col; s.style.borderColor = col; if (cfg.bolt) s.style.background = col;
      var a = Math.random() * Math.PI * 2, d = 40 + Math.random() * 70;
      s.style.left = e.clientX + 'px'; s.style.top = e.clientY + 'px';
      s.style.setProperty('--dx', (Math.cos(a) * d) + 'px');
      s.style.setProperty('--dy', (Math.sin(a) * d - 30) + 'px');
      s.style.setProperty('--r', (cfg.bolt ? Math.atan2(Math.sin(a), Math.cos(a)) * 180 / Math.PI : Math.random() * 360) + 'deg');
      s.style.fontSize = (12 + Math.random() * 12) + 'px';
      layer.appendChild(s);
      s.addEventListener('animationend', function (ev) { ev.target.remove(); });
    }
  });

  /* Title reveal: matrix decodes, cyberpunk glitches. */
  var CHARS = { 'matrix': 'ｱｲｳｴｵｶｷｸｹｺ0123456789', 'cyberpunk': '█▓▒░<>/\\|#@%&' };
  var running = null;
  function decode(el, chars) {
    if (running) clearInterval(running);
    var final = el.dataset.fxFinal || el.textContent; el.dataset.fxFinal = final;
    var t0 = Date.now();
    /* progress by elapsed time, so a throttled or hidden tab never leaves the title scrambled */
    running = setInterval(function () {
      var i = document.hidden ? final.length + 1 : Math.floor((Date.now() - t0) / 70);
      var out = '';
      for (var k = 0; k < final.length; k++) out += (k < i || final[k] === ' ') ? final[k] : chars[Math.floor(Math.random() * chars.length)];
      el.textContent = out;
      if (i > final.length) { clearInterval(running); running = null; el.textContent = final; }
    }, 38);
  }
  function reveal() {
    var t = theme(), el = document.querySelector('.hero-name, .page-title');
    if (el && CHARS[t]) decode(el, CHARS[t]);
  }
  reveal();
  document.addEventListener('themechange', reveal);
})();
