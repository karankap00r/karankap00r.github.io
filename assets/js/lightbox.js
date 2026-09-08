/* Expand any image in page content: click or Enter opens it full-size with
   its caption; click outside, the × or Esc closes it. Focus returns to the
   image afterwards. */
(function () {
  var lb = document.getElementById('lightbox');
  var img = document.getElementById('lightbox-img');
  var cap = document.getElementById('lightbox-cap');
  if (!lb || !img || !cap) return;
  var closeBtn = lb.querySelector('.lightbox-close'), last = null;

  function open(src, alt, caption) {
    img.src = src; img.alt = alt || '';
    cap.textContent = caption || ''; cap.hidden = !caption;
    lb.hidden = false; document.body.classList.add('lightbox-open');
    closeBtn.focus();
  }
  function close() {
    lb.hidden = true; img.removeAttribute('src');
    document.body.classList.remove('lightbox-open');
    if (last) last.focus();
  }

  Array.prototype.forEach.call(document.querySelectorAll('.page-body img'), function (im) {
    im.classList.add('zoomable'); im.tabIndex = 0; im.setAttribute('role', 'button'); im.title = 'Expand';
    function go() {
      last = im;
      var fig = im.closest('figure'), fc = fig && fig.querySelector('figcaption');
      open(im.currentSrc || im.src, im.alt, fc ? fc.textContent.trim() : '');
    }
    im.addEventListener('click', go);
    im.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });
  lb.addEventListener('click', function (e) { if (e.target !== img) close(); });
  closeBtn.addEventListener('click', close);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !lb.hidden) { close(); e.stopPropagation(); }
  }, true);
})();
