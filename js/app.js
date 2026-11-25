/* Startseite (Full-Stack): Angebote aus shop/catalog.json, Guthaben-Rechner, Paketvorschlag. Preise nur aus dem Katalog. */
(function () {
  'use strict';
  function $(id) { return document.getElementById(id); }
  var T = function (de, en, fr) { return (window.Shop && Shop.t) ? Shop.t({ de: de, en: en, fr: fr }) : de; };
  function tx(o, f) { return (window.Shop && Shop.tx) ? Shop.tx(o, f) : o[f]; }
  function U(p) { return (window.Shop && Shop.url) ? Shop.url(p) : p; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var sc = $('service-cards'), gc = $('guide-cards'), items = [], cat = {};
  function reveal(box) { box.querySelectorAll('[data-reveal]').forEach(function (e) { e.classList.add('is-in'); }); }
  function byId(id) { return items.filter(function (i) { return i.id === id; })[0]; }
  function card(i) {
    var from = (i.options && i.options.length) || i.perPerson;
    return '<li class="h-card" data-reveal><h3>' + esc(tx(i, 'name')) + '</h3><p>' + esc(String(tx(i, 'desc') || '').split('. ')[0].replace(/\.?$/, '.')) + '</p>' +
      '<div class="h-price">' + (from ? '<small>' + T('ab ', 'from ', 'dès ') + '</small>' : '') + esc(Shop.money(i.price)) + (i.perPerson ? ' <small>' + T('pro Person', 'per person', 'par personne') + '</small>' : '') + '</div>' +
      '<a class="more" href="' + U('pages/services.html') + '#' + encodeURIComponent(i.id) + '">' + T('Details ansehen', 'See details', 'Voir les détails') + '<span class="visually-hidden">: ' + esc(tx(i, 'name')) + '</span></a></li>';
  }

  // Guthaben-Rechner: Betrag -> wie viel eines Pakets er deckt (Katalogpreise, pro Person, ohne Optionen)
  var cf = $('credit');
  function credit() {
    if (!cf || !items.length) return;
    var g = cat.giftCards || {}, cents = Math.round(+cf.amt.value) * 100, out = $('c-out');
    $('c-amount').textContent = Shop.money(cents);
    $('c-sub').textContent = T('Jetzt zahlen, später einlösen', 'Pay now, redeem later', 'Payez maintenant, utilisez plus tard');
    var pk = items.filter(function (i) { return i.category === 'packages'; });
    out.innerHTML = '<ul>' + pk.map(function (p) {
      var pct = Math.min(100, Math.floor(cents / p.price * 100));
      return '<li>' + esc(tx(p, 'name')) + ': ' + (pct >= 100 ? T('ganz abgedeckt, pro Person', 'fully covered, per person', 'entièrement couvert, par personne') : pct + T(' % pro Person', '% per person', ' % par personne')) + '</li>';
    }).join('') + '</ul>';
    var sv = items.filter(function (i) { return i.category === 'services' && i.price <= cents; });
    if (sv.length) out.innerHTML += '<p>' + T('Einzeln buchbar davon: ', 'Of these, bookable on their own: ', 'Réservables séparément : ') + sv.map(function (s) { return esc(tx(s, 'name')); }).join(', ') + '.</p>';
  }
  function setupCredit() {
    if (!cf) return;
    var g = cat.giftCards || {}, r = $('c-range');
    if (g.min) r.min = Math.round(g.min / 100);
    if (g.max) r.max = Math.round(g.max / 100);
    r.step = 10;
    r.value = Math.min(r.max, Math.max(r.min, 250));
    $('c-limits').textContent = T('Von ', 'From ', 'De ') + Shop.money(g.min || r.min * 100) + T(' bis ', ' to ', ' à ') + Shop.money(g.max || r.max * 100) + T('. Demo: nur Testzahlung. Ein Rest bleibt auf dem Code.', '. Demo: test payment only. Any remainder stays on the code.', '. Démo : paiement test uniquement. Le solde reste sur le code.');
    cf.addEventListener('input', credit); cf.addEventListener('submit', function (e) { e.preventDefault(); });
    credit();
  }

  // Paketvorschlag
  var pf = $('pkg');
  if (pf) pf.addEventListener('submit', function (e) {
    e.preventDefault();
    var id = pf.how.value === 'tour' ? 'ghana-rundreise' : pf.who.value === 'two' ? 'ghana-gemeinsam' : 'ghana-start';
    var it = byId(id), o = $('pkg-out');
    if (!it) { o.innerHTML = T('Alle Pakete findest du <a href="' + U('pages/services.html') + '#packages">hier</a>.', 'You can find all packages <a href="' + U('pages/services.html') + '#packages">here</a>.', 'Retrouvez tous les forfaits <a href="' + U('pages/services.html') + '#packages">ici</a>.'); return; }
    o.innerHTML = T('Das passt zu dir: ', 'This suits you: ', 'Voici ce qui vous convient : ') + '<a href="' + U('pages/services.html') + '#' + encodeURIComponent(it.id) + '">' + esc(tx(it, 'name')) + '</a>, ' + esc(Shop.money(it.price)) + T(' pro Person. ', ' per person. ', ' par personne. ') + esc(String(tx(it, 'desc')).split('. ')[0].replace(/\.$/, '')) + '.';
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
      if (sc) sc.innerHTML = '<li class="h-card"><h3>' + T('Unsere Angebote', 'Our offers', 'Nos offres') + '</h3><p>' + T('Alle Pakete, Services und Ratgeber findest du auf der Angebotsseite.', 'All packages, services and guides are on the offers page.', 'Tous les forfaits, services et guides se trouvent sur la page des offres.') + '</p><a class="more" href="' + U('pages/services.html') + '">' + T('Zu den Angeboten', 'See the offers', 'Voir les offres') + '</a></li>';
    });
  }
  if (window.Shop) load(); else window.addEventListener('load', load);
})();
