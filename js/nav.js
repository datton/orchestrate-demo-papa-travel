/* Page shell (UI/UX): skip link, header, nav, footer and reading-progress bar on every page. */
(function () {
  'use strict';
  var me = document.currentScript || document.querySelector('script[src$="js/nav.js"]');
  var src = me ? me.getAttribute('src') : 'js/nav.js';
  var base = src.replace(/js\/nav\.js.*$/, ''); // path to the site root: '', '../', '../../' ...
  var LANG = (document.documentElement.lang || 'de').slice(0, 2).toLowerCase();
  if (LANG !== 'en' && LANG !== 'fr') LANG = 'de';
  var lbase = base + (LANG === 'de' ? '' : LANG + '/'); // pages in the visitor's language; css/js stay at the root
  var path = location.pathname.replace(/\/index\.html$/, '/');
  var T = {
    de: { skip: 'Zum Inhalt springen', home: 'Ghana Vorab, Startseite', main: 'Hauptmenü', foot: 'Fußbereich', menu: 'Menü', langs: 'Sprache',
      tag: 'Zahl jetzt. Flieg später. Eine erfundene Reiseagentur für Reisen nach Ghana. Agentur, Pakete und Preise sind fiktiv.',
      test: 'Demo-Shop: nur Testzahlungen, es bewegt sich kein echtes Geld.',
      advice: 'Allgemeine Informationen, keine Rechts- oder Einreiseberatung. Regeln bitte vor der Reise bei den offiziellen Stellen prüfen.',
      fict: 'Ein fiktives Unternehmen in einer Orchestrate-Solutions-Demonstration.',
      nav: ['Pakete', 'Reiseguthaben', 'Ratgeber', 'Meine Käufe'] },
    en: { skip: 'Skip to content', home: 'Ghana Vorab, home', main: 'Main menu', foot: 'Footer', menu: 'Menu', langs: 'Language',
      tag: 'Pay now. Fly later. A fictional travel agency for trips to Ghana. The agency, packages and prices are fictional.',
      test: 'Demo shop: test payments only. No real money moves.',
      advice: 'General information, not legal or immigration advice. Please check the rules with the official authorities before you travel.',
      fict: 'A fictional business in an Orchestrate Solutions demonstration.',
      nav: ['Packages', 'Travel credit', 'Guides', 'My purchases'] },
    fr: { skip: 'Aller au contenu', home: 'Ghana Vorab, accueil', main: 'Menu principal', foot: 'Pied de page', menu: 'Menu', langs: 'Langue',
      tag: 'Payez maintenant. Partez plus tard. Une agence de voyages fictive pour le Ghana. L’agence, les forfaits et les prix sont fictifs.',
      test: 'Boutique de démonstration : paiements de test uniquement, aucun argent réel n’est débité.',
      advice: 'Informations générales, pas de conseil juridique ni en matière d’immigration. Vérifiez les règles auprès des autorités officielles avant le voyage.',
      fict: 'Une entreprise fictive dans une démonstration d’Orchestrate Solutions.',
      nav: ['Forfaits', 'Crédit voyage', 'Guides', 'Mes achats'] }
  }[LANG];
  var NAV = [
    { label: T.nav[0], href: lbase + 'pages/services.html#packages', match: /services\.html$/ },
    { label: T.nav[1], href: lbase + 'pages/gift-cards.html', match: /gift(-cards)?\.html$/ },
    { label: T.nav[2], href: lbase + 'pages/services.html#guides', match: /guides\// },
    { label: T.nav[3], href: lbase + 'pages/account.html', match: /(account|order)\.html$/ }
  ];
  function current(item) { return item.match.test(path); }
  // The language switcher: DE EN FR as links. SiteLang (js/lang.js) knows the same page in each language; without it, plain links to the three home pages.
  function langUrl(l) {
    if (window.SiteLang && SiteLang.urlFor) return SiteLang.urlFor(l);
    return base + (l === 'de' ? '' : l + '/') + 'index.html';
  }
  var NAMES = { de: 'Deutsch', en: 'English', fr: 'Français' };
  function langSwitch() {
    return '<div class="lang-switch" role="group" aria-label="' + esc(T.langs) + '">' + ['de', 'en', 'fr'].map(function (l) {
      return '<a href="' + esc(langUrl(l)) + '" lang="' + l + '" hreflang="' + l + '" data-lang="' + l + '" title="' + NAMES[l] + '"' + (l === LANG ? ' aria-current="true"' : '') + '><span aria-hidden="true">' + l.toUpperCase() + '</span><span class="visually-hidden">' + NAMES[l] + '</span></a>';
    }).join('') + '</div>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function build() {
    var body = document.body;
    if (!body || body.dataset.shell) return;
    body.dataset.shell = '1';
    var main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');

    var skip = document.createElement('a');
    skip.className = 'skip-link'; skip.href = '#main'; skip.textContent = T.skip;
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
      '<a class="site-brand" href="' + esc(lbase) + 'index.html" aria-label="' + esc(T.home) + '"><span class="site-brand__mark" aria-hidden="true">G</span><span class="site-brand__name">Ghana Vorab</span></a>' +
      '<nav class="site-nav" id="site-nav" aria-label="' + esc(T.main) + '"><ul>' + links + '</ul></nav>' +
      langSwitch() +
      '<div class="site-header__actions" id="site-actions"></div>' +
      '<button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span class="nav-toggle__bars" aria-hidden="true"></span><span class="visually-hidden">' + esc(T.menu) + '</span></button>' +
      '</div>';
    body.insertBefore(header, prog.nextSibling);

    var footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.innerHTML =
      '<div class="site-footer__inner">' +
      '<div class="site-footer__brand"><strong>Ghana Vorab</strong><p>' + esc(T.tag) + '</p></div>' +
      '<nav aria-label="' + esc(T.foot) + '"><ul>' + links + '</ul></nav>' +
      '<p class="site-footer__test">' + esc(T.test) + '</p>' +
      '<p class="site-footer__small">' + esc(T.advice) + '</p>' +
      '<p class="site-footer__small">' + esc(T.fict) + '</p>' +
      '</div>';
    body.appendChild(footer);

    var btn = header.querySelector('.nav-toggle');
    function setOpen(o) { btn.setAttribute('aria-expanded', o ? 'true' : 'false'); header.classList.toggle('is-open', o); }
    btn.addEventListener('click', function () { setOpen(btn.getAttribute('aria-expanded') !== 'true'); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && header.classList.contains('is-open')) { setOpen(false); btn.focus(); } });
    header.querySelectorAll('.site-nav a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });

    header.querySelectorAll('.lang-switch a').forEach(function (a) {
      a.addEventListener('click', function (e) {
        if (!(window.SiteLang && SiteLang.set)) return; // plain link
        e.preventDefault();
        var l = a.getAttribute('data-lang');
        SiteLang.set(l);
        location.href = SiteLang.urlFor(l);
      });
    });

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
