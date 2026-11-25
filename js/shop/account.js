/* My purchases (Senior Developer 4, Ghana Vorab): pages/account.html. German, English, French via Shop.t.
   Demo gate in the browser, not real protection. */
(function () {
  'use strict';
  var root = document.getElementById('account-root');
  var esc = Shop.esc, T = Shop.t, cat = null;
  var LOCALE = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR' }[Shop.LANG] || 'de-DE';
  function itemOf(id) { return ((cat && cat.items) || []).filter(function (i) { return i.id === id; })[0] || {}; }
  function guideLink(it) {
    var l = it.guide || it.unlock || it.link || '';
    if (!l && /^(guides?|leitf|anleitung|walkthrough)/i.test(String(it.category || ''))) l = 'pages/guides/' + it.id + '.html';
    return l;
  }
  function paid(o) { return o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }
  function day(iso) { try { return new Date(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' }); } catch (e) { return ''; } }
  function lname(l) { return Shop.itemName(l.item, l.name); }
  var LOADING = '<p class="ord__muted">' + T({ de: 'Wir laden deine Käufe …', en: 'Loading your purchases …', fr: 'Chargement de vos achats …' }) + '</p>';

  function credits() {
    var codes = (Shop.get('wallet', []) || []).slice(0, 10);
    var box = document.getElementById('acc-credit');
    if (!box || !codes.length) return;
    Promise.all(codes.map(function (c) { return Shop.api('giftcards/' + encodeURIComponent(c)).catch(function () { return null; }); })).then(function (cards) {
      cards = cards.filter(Boolean);
      if (!cards.length) return;
      box.innerHTML = '<section class="ord__card" aria-labelledby="acc-c"><h2 id="acc-c">' + T({ de: 'Dein Reiseguthaben', en: 'Your travel credit', fr: 'Votre crédit voyage' }) + '</h2><ul class="ord__list">' + cards.map(function (g) {
        return '<li><span><strong>Code ' + esc(g.code) + '</strong><br><span class="ord__muted">' + T({ de: 'Demo-Guthaben, gilt nur in dieser Demo', en: 'Demo credit, valid in this demo only', fr: 'Crédit de démonstration, valable uniquement dans cette démo' }) + '</span></span><span>' +
          Shop.money(g.balance, g.currency) + ' ' + T({ de: 'übrig', en: 'left', fr: 'restant' }) + '</span></li>';
      }).join('') + '</ul><p class="ord__muted">' + T({
        de: 'Regeln bitte vor der Reise erneut prüfen: Prepaid sichert keine Einreise.',
        en: 'Please check the rules again before you travel: prepaid credit does not secure entry.',
        fr: 'Vérifiez à nouveau les règles avant le voyage : un crédit prépayé ne garantit pas l’entrée.'
      }) + '</p></section>';
    });
  }
  function render(orders) {
    var good = orders.filter(paid);
    if (!good.length) {
      root.innerHTML = '<div id="acc-credit"></div><div class="ord__card ord__empty"><h2>' + T({ de: 'Noch nichts hier', en: 'Nothing here yet', fr: 'Rien ici pour l’instant' }) + '</h2><p class="ord__muted" style="margin-inline:auto">' +
        T({ de: 'Was du in diesem Browser bezahlst, erscheint hier, samt allen freigeschalteten Guides und Anleitungen.', en: 'What you pay for in this browser appears here, together with every unlocked guide and walkthrough.', fr: 'Ce que vous payez dans ce navigateur apparaît ici, avec tous les guides et tutoriels débloqués.' }) + '</p>' +
        '<div class="ord__actions" style="justify-content:center"><a class="ord__btn" href="services.html">' + T({ de: 'Angebote ansehen', en: 'Browse offers', fr: 'Voir les offres' }) + '</a></div></div>';
      credits();
      return;
    }
    var seen = {}, order = [];
    good.forEach(function (o) { (o.lines || []).forEach(function (l) {
      var link = guideLink(itemOf(l.item));
      if (link && !seen[l.item]) { seen[l.item] = { name: lname(l), link: link }; order.push(l.item); }
    }); });
    var h = '<div id="acc-credit"></div><section class="ord__card" aria-labelledby="acc-g"><h2 id="acc-g">' + T({ de: 'Freigeschaltete Guides und Anleitungen', en: 'Unlocked guides and walkthroughs', fr: 'Guides et tutoriels débloqués' }) + '</h2>';
    h += order.length ? '<ul class="ord__list">' + order.map(function (id) {
      var u = seen[id];
      return '<li><span><span class="ord__badge">' + T({ de: 'Freigeschaltet', en: 'Unlocked', fr: 'Débloqué' }) + '</span> ' + esc(u.name) + '</span><a class="ord__btn" href="' + esc(Shop.url(u.link)) + '">' + T({ de: 'Öffnen', en: 'Open', fr: 'Ouvrir' }) + '</a></li>';
    }).join('') + '</ul>' : '<p class="ord__muted">' + T({ de: 'Deine bisherigen Käufe sind Angebote, keine Guides. Gekaufte Guides schalten sich hier frei.', en: 'So far you have bought offers, not guides. Guides you buy unlock here.', fr: 'Jusqu’ici, vous avez acheté des offres, pas de guides. Les guides achetés se débloquent ici.' }) +
      '</p><div class="ord__actions"><a class="ord__btn ord__btn--ghost" href="services.html">' + T({ de: 'Guides ansehen', en: 'Browse guides', fr: 'Voir les guides' }) + '</a></div>';
    h += '</section><section class="ord__card" aria-labelledby="acc-o"><h2 id="acc-o">' + T({ de: 'Deine Bestellungen', en: 'Your orders', fr: 'Vos commandes' }) + '</h2><ul class="ord__list">' + good.map(function (o) {
      return '<li><span><strong>' + T({ de: 'Bestellung ', en: 'Order ', fr: 'Commande ' }) + esc(o.number) + '</strong> · ' + esc(day(o.placedAt)) + '<br><span class="ord__muted">' +
        (o.lines || []).map(function (l) { return esc(l.qty + ' × ' + lname(l)); }).join(', ') + '</span></span>' +
        '<span>' + Shop.money(o.total, o.currency) + ' · <a href="order.html?o=' + encodeURIComponent(o.token) + '">' + T({ de: 'Bestellung ansehen', en: 'View order', fr: 'Voir la commande' }) + '</a></span></li>';
    }).join('') + '</ul></section>';
    root.innerHTML = h;
    credits();
  }
  function fail(msg) {
    root.innerHTML = '<div class="ord__error" role="alert">' + esc(msg || T({ de: 'Deine Käufe konnten nicht geladen werden.', en: 'Your purchases could not be loaded.', fr: 'Vos achats n’ont pas pu être chargés.' })) + '</div>' +
      '<div class="ord__actions acc-retry"><button class="ord__btn" type="button" id="acc-retry">' + T({ de: 'Nochmal versuchen', en: 'Try again', fr: 'Réessayer' }) + '</button></div>';
    document.getElementById('acc-retry').addEventListener('click', function () { root.innerHTML = LOADING; load(); });
  }
  var tokens = Shop.orders();
  function load() {
    return Shop.catalog().then(function (c) { cat = c; }, function () {}).then(function () {
      if (!tokens.length) return render([]);
      return Shop.api('orders/lookup', { tokens: tokens.slice(0, 30) }).then(function (r) { render(r.orders || []); }, function (e) { fail(e.message); });
    });
  }
  load();
})();
