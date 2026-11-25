/* Page shell (UI/UX): skip link, header, nav, footer and reading-progress bar on every page. */
(function () {
  'use strict';
  var me = document.currentScript || document.querySelector('script[src$="js/nav.js"]');
  var src = me ? me.getAttribute('src') : 'js/nav.js';
  var base = src.replace(/js\/nav\.js.*$/, ''); // '', '../' or '../../'
  var path = location.pathname.replace(/\/index\.html$/, '/');
  var NAV = [
    { label: 'Pakete', href: base + 'pages/services.html#packages', match: /services\.html$/ },
    { label: 'Reiseguthaben', href: base + 'pages/gift-cards.html', match: /gift(-cards)?\.html$/ },
    { label: 'Ratgeber', href: base + 'pages/services.html#guides', match: /guides\// },
    { label: 'Meine Käufe', href: base + 'pages/account.html', match: /(account|order)\.html$/ }
  ];
  function current(item) { return item.match.test(path) || (item.label === 'Start' && path === '/'); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    var body = document.body;
    if (!body || body.dataset.shell) return;
    body.dataset.shell = '1';
    var main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');

    var skip = document.createElement('a');
    skip.className = 'skip-link'; skip.href = '#main'; skip.textContent = 'Zum Inhalt springen';
    body.insertBefore(skip, body.firstChild);

    var prog = document.createElement('div');
    prog.className = 'read-progress'; prog.setAttribute('aria-hidden', 'true');
    prog.innerHTML = '<span></span>';
    body.insertBefore(prog, skip.nextSibling);

    var links = NAV.map(function (n) {
      return '<li><a href="' + esc(n.href) + '"' + (current(n) ? ' aria-current="page"' : '') + '>' + esc(n.label) + '</a></li>';
    }).join('');
    var header = document.createElement('header');
    header.className = 'site-header';
    header.innerHTML =
      '<div class="site-header__inner">' +
      '<a class="site-brand" href="' + esc(base) + 'index.html" aria-label="Ghana Vorab, Startseite"><span class="site-brand__mark" aria-hidden="true">G</span><span class="site-brand__name">Ghana Vorab</span></a>' +
      '<nav class="site-nav" id="site-nav" aria-label="Hauptmenü"><ul>' + links + '</ul></nav>' +
      '<div class="site-header__actions" id="site-actions"></div>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nav-toggle__bars" aria-hidden="true"></span><span class="visually-hidden">Menü</span></button>' +
      '</div>';
    body.insertBefore(header, prog.nextSibling);

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="site-footer__inner">' +
      '<div class="site-footer__brand"><strong>Ghana Vorab</strong><p>Zahl jetzt. Flieg später. Eine erfundene Reiseagentur für Reisen nach Ghana. Agentur, Pakete und Preise sind fiktiv.</p></div>' +
      '<nav aria-label="Fußbereich"><ul>' + links + '</ul></nav>' +
      '<p class="site-footer__test">Demo-Shop: nur Testzahlungen, es bewegt sich kein echtes Geld.</p>' +
      '<p class="site-footer__small">Allgemeine Informationen, keine Rechts- oder Einreiseberatung. Regeln bitte vor der Reise bei den offiziellen Stellen prüfen.</p>' +
      '<p class="site-footer__small">Ein fiktives Unternehmen in einer Orchestrate-Solutions-Demonstration.</p>' +
      '</div>';
    body.appendChild(footer);

    var btn = header.querySelector('.nav-toggle');
    function setOpen(o) { btn.setAttribute('aria-expanded', o ? 'true' : 'false'); header.classList.toggle('is-open', o); }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('is-open')) { setOpen(false); btn.focus(); } });
    header.querySelectorAll('.site-nav a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });

    var bar = prog.firstChild, ticking = false;
    function upd() {
      ticking = false;
      var h = document.documentElement, max = h.scrollHeight - h.clientHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, h.scrollTop / max) : 0) + ')';
      header.classList.toggle('is-scrolled', h.scrollTop > 8);
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(upd); } }, { passive: true });
    window.addEventListener('resize', upd);
    upd();
    window.dispatchEvent(new Event('shell:ready'));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
