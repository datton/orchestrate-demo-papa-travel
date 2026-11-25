/* Order confirmation (Senior Developer 4, Ghana Vorab): pages/order.html?o=<token>. German, English, French via Shop.t. */
(function () {
  'use strict';
  var root = document.getElementById('order-root');
  var token = Shop.param('o');
  var cat = null, timer = null, last = null, cleared = false, tries = 0;
  var esc = Shop.esc, T = Shop.t;
  var LOCALE = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR' }[Shop.LANG] || 'de-DE';

  function listOf(v) { return v == null ? [] : (Array.isArray(v) ? v : [v]); }
  function itemOf(id) { return ((cat && cat.items) || []).filter(function (i) { return i.id === id; })[0] || {}; }
  function guideLink(it) {
    var l = it.guide || it.unlock || it.link || '';
    if (!l && /^(guides?|leitf|anleitung|walkthrough)/i.test(String(it.category || ''))) l = 'pages/guides/' + it.id + '.html';
    return l;
  }
  function when(iso) {
    try { return new Date(iso).toLocaleString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }); } catch (e) { return iso || ''; }
  }
  var STEP = {
    paid: { de: 'Zahlung eingegangen', en: 'Payment received', fr: 'Paiement reçu' },
    making: { de: 'Wird vorbereitet', en: 'Being prepared', fr: 'En préparation' },
    ready: { de: 'Bereit', en: 'Ready', fr: 'Prêt' },
    collected: { de: 'Zugestellt', en: 'Delivered', fr: 'Livré' }
  };
  function stepLabel(s) { return STEP[s.id] ? T(STEP[s.id]) : s.label; }
  function payLabel(c) {
    return /^gift ?card/i.test(c)
      ? T({ de: 'Reiseguthaben (Demo)', en: 'Travel credit (demo)', fr: 'Crédit voyage (démo)' })
      : c + ' ' + T({ de: '(Testkarte)', en: '(test card)', fr: '(carte de test)' });
  }
  function paid(o) { return o && o.status && o.status !== 'pending' && o.status !== 'cancelled' && o.status !== 'refunded'; }
  function brand() { return (cat && cat.brand && cat.brand.name) || 'Ghana Vorab'; }
  function lname(l) { return Shop.itemName(l.item, l.name); }
  function lsum(l) {
    // The service answers with options as a list and a German summary: translate that text; a {group: id} map goes through the catalog.
    var plain = l.options && !Array.isArray(l.options) ? Shop.lineSummary(l, null) : null;
    return plain || Shop.localizeSummary(l.summary);
  }
  function money(c, o) { return Shop.money(c, o.currency); }
  function eyebrow() { return '<p class="ord__eyebrow">' + T({ de: 'Bestätigung', en: 'Confirmation', fr: 'Confirmation' }) + ' <span class="ord__badge">Demo</span></p>'; }

  function receipt(o) {
    var t = [T({ de: 'QUITTUNG (Demo: nur Testzahlung, es bewegt sich kein echtes Geld)', en: 'RECEIPT (Demo: test payment only, no real money moved)', fr: 'REÇU (démo : paiement de test, aucun argent réel débité)' }), '',
      brand() + ' ' + T({ de: '(fiktive Demo-Agentur)', en: '(fictional demo agency)', fr: '(agence de démonstration fictive)' }),
      T({ de: 'Bestellnummer: ', en: 'Order number: ', fr: 'Numéro de commande : ' }) + o.number,
      T({ de: 'Datum: ', en: 'Date: ', fr: 'Date : ' }) + when(o.placedAt),
      T({ de: 'Name: ', en: 'Name: ', fr: 'Nom : ' }) + (o.name || ''), ''];
    (o.lines || []).forEach(function (l) { var s = lsum(l); t.push(l.qty + ' x ' + lname(l) + (s ? ' (' + s + ')' : '') + '  ' + money(l.total, o)); });
    t.push('', T({ de: 'Zwischensumme: ', en: 'Subtotal: ', fr: 'Sous-total : ' }) + money(o.subtotal, o));
    if (o.discount) t.push(T({ de: 'Rabatt ', en: 'Discount ', fr: 'Réduction ' }) + o.discount.code + ': -' + money(o.discount.amount, o));
    if (o.giftCard) t.push(T({ de: 'Reiseguthaben: -', en: 'Travel credit: -', fr: 'Crédit voyage : -' }) + money(o.giftCard.applied, o));
    t.push(T({ de: 'Bezahlt: ', en: 'Paid: ', fr: 'Payé : ' }) + money(o.total, o));
    if (o.payment && o.payment.card) t.push(T({ de: 'Zahlung: ', en: 'Payment: ', fr: 'Paiement : ' }) + payLabel(o.payment.card));
    t.push('', T({ de: 'Dies ist eine Demo. Es wurde kein echtes Geld bewegt.', en: 'This is a demo. No real money moved.', fr: 'Ceci est une démonstration. Aucun argent réel n’a été débité.' }));
    return t.join('\n');
  }

  function render(o) {
    last = o;
    var ok = paid(o), h = eyebrow();
    if (ok && !cleared) { cleared = true; Shop.saveCart([]); }
    var A = function (href, label, ghost) { return '<a class="ord__btn' + (ghost ? ' ord__btn--ghost' : '') + '" href="' + href + '">' + label + '</a>'; };
    var lblAccount = T({ de: 'Meine Käufe', en: 'My purchases', fr: 'Mes achats' });
    if (o.status === 'cancelled' || o.status === 'refunded') {
      var refunded = o.status === 'refunded';
      h += '<h1 class="ord__title">' + (refunded ? T({ de: 'Bestellung erstattet', en: 'Order refunded', fr: 'Commande remboursée' }) : T({ de: 'Bestellung abgebrochen', en: 'Order cancelled', fr: 'Commande annulée' })) + '</h1>' +
        '<p class="ord__muted">' + T({ de: 'Es ist nichts offen. Du kannst jederzeit neu buchen.', en: 'Nothing is outstanding. You can book again at any time.', fr: 'Rien n’est en attente. Vous pouvez réserver à nouveau à tout moment.' }) + '</p>' +
        '<div class="ord__actions">' + A('services.html', T({ de: 'Zu den Angeboten', en: 'Browse offers', fr: 'Voir les offres' })) + '</div>';
    } else if (!ok) {
      h += '<h1 class="ord__title">' + T({ de: 'Wir warten auf deine Zahlung …', en: 'Waiting for your payment …', fr: 'Nous attendons votre paiement …' }) + '</h1>' +
        '<p class="ord__muted"><span class="ord__spin" aria-hidden="true"></span>' + T({ de: 'Diese Seite aktualisiert sich von selbst.', en: 'This page updates by itself.', fr: 'Cette page se met à jour toute seule.' }) + '</p>';
    } else {
      h += '<h1 class="ord__title">' + T({ de: 'Danke', en: 'Thank you', fr: 'Merci' }) + (o.firstName ? ', ' + esc(o.firstName) : '') + (Shop.LANG === 'fr' ? '\u00a0! ' : '! ') +
        T({ de: 'Deine Zahlung ist angekommen.', en: 'Your payment has arrived.', fr: 'Votre paiement est bien arrivé.' }) + '</h1>' +
        '<div class="ord__number"><small>' + T({ de: 'Bestellnummer', en: 'Order number', fr: 'Numéro de commande' }) + '</small><strong>' + esc(o.number) + '</strong></div><br>';
    }
    h += '<span class="ord__test">' + esc(Shop.TEST_LABEL) + '</span>';
    if (ok) {
      var steps = (o.steps || []).map(function (s) { return '<li class="' + (s.at ? 'is-done' : '') + '">' + esc(stepLabel(s)) + (s.at ? ' &#10003;' : '') + '</li>'; }).join('');
      h += '<section class="ord__card" aria-labelledby="ord-b"><h2 id="ord-b">' + T({ de: 'Was du gebucht hast', en: 'What you booked', fr: 'Ce que vous avez réservé' }) + '</h2><ul class="ord__lines">' +
        (o.lines || []).map(function (l) { var s = lsum(l); return '<li><span>' + esc(l.qty) + ' × ' + esc(lname(l)) + (s ? '<small>' + esc(s) + '</small>' : '') + '</span><span>' + money(l.total, o) + '</span></li>'; }).join('') + '</ul>' +
        '<div class="ord__sub"><span>' + T({ de: 'Zwischensumme', en: 'Subtotal', fr: 'Sous-total' }) + '</span><span>' + money(o.subtotal, o) + '</span></div>' +
        (o.discount ? '<div class="ord__sub"><span>' + esc(Shop.couponName(o.discount.code, o.discount.name || o.discount.code)) + '</span><span>−' + money(o.discount.amount, o) + '</span></div>' : '') +
        (o.giftCard ? '<div class="ord__sub"><span>' + T({ de: 'Reiseguthaben', en: 'Travel credit', fr: 'Crédit voyage' }) + '</span><span>−' + money(o.giftCard.applied, o) + '</span></div>' : '') +
        '<div class="ord__sum"><span>' + T({ de: 'Bezahlt', en: 'Paid', fr: 'Payé' }) + '</span><span>' + money(o.total, o) + '</span></div>' +
        (o.giftCard && o.giftCard.balanceAfter != null ? '<p class="ord__muted">' + T({ de: 'Auf deinem Reiseguthaben bleiben ', en: 'Left on your travel credit: ', fr: 'Il reste sur votre crédit voyage : ' }) + money(o.giftCard.balanceAfter, o) + T({ de: ' (Demo).', en: ' (demo).', fr: ' (démo).' }) + '</p>' : '') +
        (o.payment && o.payment.card ? '<p class="ord__muted">' + T({ de: 'Bezahlt mit ', en: 'Paid with ', fr: 'Payé avec ' }) + esc(payLabel(o.payment.card)) + '</p>' : '') + '</section>';

      h += '<section class="ord__card" aria-labelledby="ord-n"><h2 id="ord-n">' + T({ de: 'Wie es weitergeht', en: 'What happens next', fr: 'Et ensuite' }) + '</h2>' + (steps ? '<ol class="ord__steps">' + steps + '</ol>' : '') +
        (o.lines || []).map(function (l) {
          var it = itemOf(l.item), link = guideLink(it), b = '<div class="ord__next"><h3>' + esc(lname(l)) + '</h3>';
          if (link) b += '<p>' + T({ de: 'Freigeschaltet. Du findest ihn jederzeit unter ', en: 'Unlocked. You can always find it under ', fr: 'Débloqué. Vous le retrouvez à tout moment sous ' }) + '<a href="account.html">' + lblAccount + '</a>' +
            T({ de: ' oder gleich hier: ', en: ', or open it right here: ', fr: ', ou l’ouvrir tout de suite : ' }) + '<a href="' + esc(Shop.url(link)) + '">' + T({ de: 'öffnen', en: 'open', fr: 'ouvrir' }) + '</a>.</p>';
          else b += '<p>' + T({
            de: 'Das ist ein Angebot der fiktiven Demo-Agentur Ghana Vorab. Diese Demo verschickt nichts; in der echten Welt würde sich das Team bei dir melden und alles mit dir durchgehen. Nenne dann einfach deine Bestellnummer ',
            en: 'This is an offer from the fictional demo agency Ghana Vorab. This demo sends nothing; in real life the team would get in touch and go through everything with you. Just quote your order number ',
            fr: 'Ceci est une offre de l’agence de démonstration fictive Ghana Vorab. Cette démo n’envoie rien ; en vrai, l’équipe vous contacterait pour tout voir avec vous. Indiquez simplement votre numéro de commande '
          }) + esc(o.number) + '.</p>';
          listOf(Shop.tx(it, 'next') || Shop.tx(it, 'afterBuying') || Shop.tx(it, 'whatNext')).forEach(function (n) { b += '<p>' + esc(n) + '</p>'; });
          var prep = listOf(Shop.tx(it, 'prepare') || Shop.tx(it, 'bring'));
          if (prep.length) b += '<p><strong>' + T({ de: 'Halte bereit:', en: 'Have ready:', fr: 'À préparer :' }) + '</strong> ' + prep.map(esc).join(', ') + '.</p>';
          return b + '</div>';
        }).join('') + '</section>';
      h += '<div class="ord__actions"><button class="ord__btn" type="button" id="ord-r">' + T({ de: 'Quittung herunterladen', en: 'Download receipt', fr: 'Télécharger le reçu' }) + '</button>' +
        A('account.html', lblAccount, true) + A('services.html', T({ de: 'Weitere Angebote', en: 'More offers', fr: 'Autres offres' }), true) + '</div>';
    }
    root.innerHTML = h;
    var r = document.getElementById('ord-r');
    if (r) r.addEventListener('click', function () { Shop.download(T({ de: 'quittung-', en: 'receipt-', fr: 'recu-' }) + o.number + '.txt', receipt(o)); });
  }

  function fail(msg) {
    root.innerHTML = eyebrow() + '<h1 class="ord__title">' + T({ de: 'Diese Bestellung finden wir nicht', en: 'We cannot find this order', fr: 'Nous ne trouvons pas cette commande' }) + '</h1><div class="ord__error" role="alert">' + esc(msg) + '</div>' +
      '<span class="ord__test">' + esc(Shop.TEST_LABEL) + '</span><div class="ord__actions">' +
      (token ? '<button class="ord__btn" type="button" id="ord-retry">' + T({ de: 'Nochmal versuchen', en: 'Try again', fr: 'Réessayer' }) + '</button>' : '') +
      '<a class="ord__btn ord__btn--ghost" href="account.html">' + T({ de: 'Meine Käufe', en: 'My purchases', fr: 'Mes achats' }) + '</a>' +
      '<a class="ord__btn ord__btn--ghost" href="services.html">' + T({ de: 'Angebote', en: 'Offers', fr: 'Offres' }) + '</a></div>';
    var rt = document.getElementById('ord-retry');
    if (rt) rt.addEventListener('click', function () { tries = 0; poll(); });
  }
  function poll() {
    tries++;
    Shop.api('orders/' + encodeURIComponent(token)).then(function (res) {
      var o = res.order || res;
      if (!last || JSON.stringify(last) !== JSON.stringify(o)) render(o);
      var done = o.status === 'collected' || o.status === 'cancelled' || o.status === 'refunded' || (paid(o) && (o.status === 'ready'));
      if (!done && tries < 40) timer = setTimeout(poll, 3000);
    }, function (e) { if (!last) fail(e.message); else timer = setTimeout(poll, 5000); });
  }
  if (!token) { fail(T({ de: 'In diesem Link fehlt die Bestellnummer. Öffne die Bestellung unter Meine Käufe.', en: 'This link has no order number. Open your order under My purchases.', fr: 'Ce lien ne contient pas de numéro de commande. Ouvrez la commande sous Mes achats.' })); return; }
  Shop.addOrder(token);
  Shop.catalog().then(function (c) { cat = c; }, function () {}).then(poll);
})();
