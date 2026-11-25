/* Startseite (Full-Stack): Angebote aus shop/catalog.json, Guthaben-Rechner, Paketvorschlag. Preise nur aus dem Katalog. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var sc = $('service-cards'), gc = $('guide-cards'), items = [], cat = {};
  function reveal(box) { box.querySelectorAll('[data-reveal]').forEach(function (e) { e.classList.add('is-in'); }); }
  function byId(id) { return items.filter(function (i) { return i.id === id; })[0]; }
  function card(i) {
    var from = (i.options && i.options.length) || i.perPerson;
    return '<li class="h-card" data-reveal><h3>' + esc(i.name) + '</h3><p>' + esc(String(i.desc || '').split('. ')[0].replace(/\.?$/, '.')) + '</p>' +
      '<div class="h-price">' + (from ? '<small>ab </small>' : '') + esc(Shop.money(i.price)) + (i.perPerson ? ' <small>pro Person</small>' : '') + '</div>' +
      '<a class="more" href="pages/services.html#' + encodeURIComponent(i.id) + '">Details ansehen<span class="visually-hidden">: ' + esc(i.name) + '</span></a></li>';
  }

  // Guthaben-Rechner: Betrag -> wie viel eines Pakets er deckt (Katalogpreise, pro Person, ohne Optionen)
  var cf = $('credit');
  function credit() {
    if (!cf || !items.length) return;
    var g = cat.giftCards || {}, cents = Math.round(+cf.amt.value) * 100, out = $('c-out');
    $('c-amount').textContent = Shop.money(cents);
    $('c-sub').textContent = 'Jetzt zahlen, später einlösen';
    var pk = items.filter(function (i) { return i.category === 'packages'; });
    out.innerHTML = '<ul>' + pk.map(function (p) {
      var pct = Math.min(100, Math.floor(cents / p.price * 100));
      return '<li>' + esc(p.name) + ': ' + (pct >= 100 ? 'ganz abgedeckt, pro Person' : pct + ' % pro Person') + '</li>';
    }).join('') + '</ul>';
    var sv = items.filter(function (i) { return i.category === 'services' && i.price <= cents; });
    if (sv.length) out.innerHTML += '<p>Einzeln buchbar davon: ' + sv.map(function (s) { return esc(s.name); }).join(', ') + '.</p>';
  }
  function setupCredit() {
    if (!cf) return;
    var g = cat.giftCards || {}, r = $('c-range');
    if (g.min) r.min = Math.round(g.min / 100);
    if (g.max) r.max = Math.round(g.max / 100);
    r.step = 10;
    r.value = Math.min(r.max, Math.max(r.min, 250));
    $('c-limits').textContent = 'Von ' + Shop.money(g.min || r.min * 100) + ' bis ' + Shop.money(g.max || r.max * 100) + '. Demo: nur Testzahlung. Ein Rest bleibt auf dem Code.';
    cf.addEventListener('input', credit); cf.addEventListener('submit', function (e) { e.preventDefault(); });
    credit();
  }

  // Paketvorschlag
  var pf = $('pkg');
  if (pf) pf.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = pf.how.value === 'tour' ? 'ghana-rundreise' : pf.who.value === 'two' ? 'ghana-gemeinsam' : 'ghana-start';
    var it = byId(id), o = $('pkg-out');
    if (!it) { o.innerHTML = 'Alle Pakete findest du <a href="pages/services.html#packages">hier</a>.'; return; }
    o.innerHTML = 'Das passt zu dir: <a href="pages/services.html#' + encodeURIComponent(it.id) + '">' + esc(it.name) + '</a>, ' + esc(Shop.money(it.price)) + ' pro Person. ' + esc(String(it.desc).split('. ')[0]) + '.';
  });

  function load() {
    if (!window.Shop || !Shop.catalog) return;
    Shop.catalog().then(function (c) {
      cat = c; items = c.items || [];
      var offers = items.filter(function (i) { return i.category !== 'guides'; });
      var guides = items.filter(function (i) { return i.category === 'guides'; });
      setupCredit();
      if (sc && offers.length) { sc.innerHTML = offers.map(card).join(''); reveal(sc); }
      if (gc && guides.length) { gc.innerHTML = guides.map(card).join(''); reveal(gc); }
    }).catch(function () {
      if (sc) sc.innerHTML = '<li class="h-card"><h3>Unsere Angebote</h3><p>Alle Pakete, Services und Ratgeber findest du auf der Angebotsseite.</p><a class="more" href="pages/services.html">Zu den Angeboten</a></li>';
    });
  }
  if (window.Shop) load(); else window.addEventListener('load', load);
})();
