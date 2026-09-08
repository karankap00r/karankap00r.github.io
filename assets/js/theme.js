/* Theme switching and site-wide keyboard shortcuts.
   - "t" toggles light/dark inside the current theme (twin themes swap,
     others flip their luminance in place); "0" follows the OS.
   - Single letters jump to pages (the keys come from _config.yml nav).
   - The Konami code switches to 90s-vibes.
   Exposes window.site.{themes,getTheme,setTheme,toggleTheme,flipped,setFlip,pairs,isDarkTheme}
   and dispatches a "themechange" event on document whenever the theme changes. */
(function () {
  var C = window.SITE || {};
  var root = document.documentElement;

  // "default" and "system" both mean: follow the OS. The rest are listed in
  // _config.yml and each has a palette block in style.css.
  var THEMES = ['default', 'system'].concat(C.themesLight || [], C.themesDark || []);
  var DARK = new RegExp('^(' + (C.themesDark || []).join('|') + ')$');
  var PAGES = {};
  (C.nav || []).forEach(function (n) { if (n.key) PAGES[n.key] = n.url; });

  // Themes that come as a light/dark pair. Toggling swaps within the pair.
  var PAIRS = {
    'light': 'dark', 'dark': 'light',
    'solarized-light': 'solarized-dark', 'solarized-dark': 'solarized-light',
    'gruvbox-light': 'gruvbox-dark', 'gruvbox-dark': 'gruvbox-light',
    'catppuccin-latte': 'catppuccin-mocha', 'catppuccin-mocha': 'catppuccin-latte',
    'jetbrains-light': 'jetbrains-dark', 'jetbrains-dark': 'jetbrains-light'
  };

  function getTheme() { return root.getAttribute('data-theme') || 'system'; }
  function flipped() { return root.hasAttribute('data-flip'); }
  function baseDark() {
    var t = getTheme();
    if (t !== 'system') return DARK.test(t);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  function isDark() { return flipped() ? !baseDark() : baseDark(); }
  function applyScheme() {
    var dark = isDark();
    root.setAttribute('data-scheme', dark ? 'dark' : 'light');
    root.style.colorScheme = dark ? 'dark' : 'light';
    if (window.site && window.site.ambient) window.site.ambient.apply(getTheme());
  }
  function setFlip(on) {
    if (on) root.setAttribute('data-flip', '1'); else root.removeAttribute('data-flip');
    try { if (on) localStorage.setItem('theme.flip', '1'); else localStorage.removeItem('theme.flip'); } catch (e) {}
    applyScheme();
  }
  function setTheme(next) {
    root.removeAttribute('data-flip');
    try { localStorage.removeItem('theme.flip'); } catch (e) {}
    if (!next || next === 'system' || next === 'default') {
      root.removeAttribute('data-theme');
      try { localStorage.removeItem('theme'); } catch (e) {}
    } else {
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) {}
      if (window.__ensureFont) window.__ensureFont(next);
    }
    applyScheme();
    document.dispatchEvent(new CustomEvent('themechange', { detail: getTheme() }));
  }
  // Light/dark stays inside the current theme: swap to its twin if it has
  // one, otherwise flip its luminance in place. The site default toggles
  // between light and dark as before.
  function toggle() {
    var t = getTheme();
    if (t === 'system') { setTheme(baseDark() ? 'light' : 'dark'); return; }
    if (PAIRS[t]) { setTheme(PAIRS[t]); return; }
    setFlip(!flipped());
  }
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyScheme);

  window.site = Object.assign(window.site || {}, {
    themes: THEMES, getTheme: getTheme, setTheme: setTheme, toggleTheme: toggle,
    flipped: flipped, setFlip: setFlip, pairs: PAIRS,
    isDarkTheme: function (t) { return DARK.test(t); }
  });

  var btn = document.querySelector('.theme-toggle');
  if (btn) btn.addEventListener('click', toggle);

  // ↑↑↓↓←→←→BA
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var kpos = 0;

  document.addEventListener('keydown', function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
    var t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;

    kpos = (k === KONAMI[kpos]) ? kpos + 1 : (k === KONAMI[0] ? 1 : 0);
    if (kpos === KONAMI.length) {
      kpos = 0; e.preventDefault();
      setTheme('90s-vibes');
      if (window.site.console) {
        window.site.console.open();
        window.site.console.print('↑↑↓↓←→←→BA — 30 lives. theme: 90s-vibes', 'dim');
      }
      return;
    }
    if (kpos > 0 && KONAMI[kpos - 1].length === 1) return; // mid-sequence "b"/"a": don't navigate

    if (k === 't') { toggle(); e.preventDefault(); }
    else if (k === '0') { setTheme('system'); e.preventDefault(); }
    else if (PAGES[k]) { location.href = PAGES[k]; e.preventDefault(); }
  });
})();
