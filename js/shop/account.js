/* Meine Käufe (Senior Developer 4, Papa Travel): pages/account.html. Demo-Sperre im Browser, kein echter Schutz. */
(function () {
  'use strict';
  var root = document.getElementById('account-root');
  var esc = Shop.esc, cat = null;
  function itemOf(id) { return ((cat && cat.items) || []).filter(function (i) { return i.id === id; })[0] || {}; }
  function guideLink(it) {
    var l = it.guide || it.unlock || it.link || '';
    if (!l && /^(guides?|leitf|anleitung|walkthrough)/i.test(String(it.category || ''))) l = 'pages/guides/' + it.id + '.html';
    return l;
  }
  function paid(o) { return o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }
  function day(iso) { try { return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return ''; } }

  function credits() {
    var codes = (Shop.get('wallet', []) || []).slice(0, 10);
    var box = document.getElementById('acc-credit');
    if (!box || !codes.length) return;
    Promise.all(codes.map(function (c) { return Shop.api('giftcards/' + encodeURIComponent(c)).catch(function () { return null; }); })).then(function (cards) {
      cards = cards.filter(Boolean);
      if (!cards.length) return;
      box.innerHTML = '<section class="ord__card" aria-labelledby="acc-c"><h2 id="acc-c">Dein Reiseguthaben</h2><ul class="ord__list">' + cards.map(function (g) {
        return '<li><span><strong>Code ' + esc(g.code) + '</strong><br><span class="ord__muted">Demo-Guthaben, gilt nur in dieser Demo</span></span><span>' + Shop.money(g.balance, g.currency) + ' übrig</span></li>';
      }).join('') + '</ul><p class="ord__muted">Regeln bitte vor der Reise erneut prüfen: Prepaid sichert keine Einreise.</p></section>';
    });
  }
  function render(orders) {
    var good = orders.filter(paid);
    if (!good.length) {
      root.innerHTML = '<div id="acc-credit"></div><div class="ord__card ord__empty"><h2>Noch nichts hier</h2><p class="ord__muted" style="margin-inline:auto">Was du in diesem Browser bezahlst, erscheint hier, samt allen freigeschalteten Guides und Anleitungen.</p>' +
        '<div class="ord__actions" style="justify-content:center"><a class="ord__btn" href="services.html">Angebote ansehen</a></div></div>';
      credits();
      return;
    }
    var seen = {}, order = [];
    good.forEach(function (o) { (o.lines || []).forEach(function (l) {
      var link = guideLink(itemOf(l.item));
      if (link && !seen[l.item]) { seen[l.item] = { name: l.name, link: link }; order.push(l.item); }
    }); });
    var h = '<div id="acc-credit"></div><section class="ord__card" aria-labelledby="acc-g"><h2 id="acc-g">Freigeschaltete Guides und Anleitungen</h2>';
    h += order.length ? '<ul class="ord__list">' + order.map(function (id) {
      var u = seen[id];
      return '<li><span><span class="ord__badge">Freigeschaltet</span> ' + esc(u.name) + '</span><a class="ord__btn" href="' + esc(Shop.url(u.link)) + '">Öffnen</a></li>';
    }).join('') + '</ul>' : '<p class="ord__muted">Deine bisherigen Käufe sind Angebote, keine Guides. Gekaufte Guides schalten sich hier frei.</p><div class="ord__actions"><a class="ord__btn ord__btn--ghost" href="services.html">Guides ansehen</a></div>';
    h += '</section><section class="ord__card" aria-labelledby="acc-o"><h2 id="acc-o">Deine Bestellungen</h2><ul class="ord__list">' + good.map(function (o) {
      return '<li><span><strong>Bestellung ' + esc(o.number) + '</strong> · ' + esc(day(o.placedAt)) + '<br><span class="ord__muted">' +
        (o.lines || []).map(function (l) { return esc(l.qty + ' × ' + l.name); }).join(', ') + '</span></span>' +
        '<span>' + Shop.money(o.total, o.currency) + ' · <a href="order.html?o=' + encodeURIComponent(o.token) + '">Bestellung ansehen</a></span></li>';
    }).join('') + '</ul></section>';
    root.innerHTML = h;
    credits();
  }
  function fail(msg) {
    root.innerHTML = '<div class="ord__error" role="alert">' + esc(msg || 'Deine Käufe konnten nicht geladen werden.') + '</div><div class="ord__actions acc-retry"><button class="ord__btn" type="button" id="acc-retry">Nochmal versuchen</button></div>';
    document.getElementById('acc-retry').addEventListener('click', function () { root.innerHTML = '<p class="ord__muted">Wir laden deine Käufe …</p>'; load(); });
  }
  var tokens = Shop.orders();
  function load() {
  return Shop.catalog().then(function (c) { cat = c; }, function () {}).then(function () {
    if (!tokens.length) return render([]);
    return Shop.api('orders/lookup', { tokens: tokens.slice(0, 30) }).then(function (r) { render(r.orders || []); },
      function (e) { fail(e.message); });
  });
  }
  load();
})();
