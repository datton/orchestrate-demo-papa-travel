/* Angebotsseite (Senior Developer 1). Zeigt shop/catalog.json; der Shop-Service berechnet jede echte Bestellung. */
(function () {
  'use strict';
  var root = document.getElementById('svc-root'), tabs = document.getElementById('svc-tabs');
  if (!root) return;
  var LANG = (document.documentElement.lang || 'de').slice(0, 2);
  function T(de, en, fr) { return LANG === 'en' ? en : LANG === 'fr' ? fr : de; }
  function X(o, f) { return window.Shop ? Shop.tx(o, f) : o[f]; }
  function XI(o) { var l = o.i18n && o.i18n[LANG]; return (l && l.includes) || o.includes || []; }
  var esc = function (s) { return window.Shop ? Shop.esc(s) : String(s); };

  function fail() {
    root.innerHTML = '<div class="svc-fail" role="alert"><p>' + T('Die Angebote konnten nicht geladen werden.', 'The offers could not be loaded.', 'Les offres n’ont pas pu être chargées.') + '</p><button type="button" class="btn svc-retry">' + T('Erneut versuchen', 'Try again', 'Réessayer') + '</button></div>';
    root.querySelector('.svc-retry').addEventListener('click', function () { root.innerHTML = '<p class="svc-loading">' + loading() + '</p>'; start(); });
  }
  function loading() { return T('Angebote werden geladen …', 'Loading offers …', 'Chargement des offres …'); }
  function ready(fn) {
    if (window.Shop) return fn();
    window.addEventListener('load', function () { window.Shop ? fn() : fail(); });
  }

  function defaults(item, cat) {
    var o = {};
    (item.options || []).forEach(function (g) {
      var grp = cat.options[g]; if (!grp) return;
      var ch = allowed(item, g, grp);
      if (grp.type === 'one') { var d = ch.filter(function (c) { return c.default; })[0] || ch[0]; if (d) o[g] = d.id; }
      else o[g] = [];
    });
    return o;
  }
  function allowed(item, g, grp) {
    var ids = item.choices && item.choices[g];
    return grp.choices.filter(function (c) { return !c.soldOut && (!ids || ids.indexOf(c.id) > -1); });
  }
  function estimate(item, cat, opts, qty) {
    var t = item.price;
    (item.options || []).forEach(function (g) {
      var grp = cat.options[g], v = opts[g]; if (!grp) return;
      grp.choices.forEach(function (c) { if (grp.type === 'one' ? v === c.id : (v || []).indexOf(c.id) > -1) t += c.price; });
    });
    return t * qty;
  }
  function optLabel(p) { return p === 0 ? '' : ' (' + (p > 0 ? '+' : '−') + Shop.money(Math.abs(p)) + ')'; }

  function card(item, cat) {
    var el = document.createElement('article');
    el.className = 'svc-card'; el.id = item.id;
    var opts = defaults(item, cat), qty = 1;
    var inc = XI(item).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
    var groups = (item.options || []).map(function (g) {
      var grp = cat.options[g]; if (!grp) return '';
      var type = grp.type === 'one' ? 'radio' : 'checkbox';
      var rows = allowed(item, g, grp).map(function (c) {
        var checked = grp.type === 'one' ? opts[g] === c.id : false;
        return '<label class="svc-opt"><input type="' + type + '" name="' + item.id + '-' + g + '" value="' + esc(c.id) + '"' + (checked ? ' checked' : '') + '><span>' + esc(X(c, 'name')) + esc(optLabel(c.price)) + '</span></label>';
      }).join('');
      return '<fieldset class="svc-group" data-g="' + g + '"><legend>' + esc(X(grp, 'name')) + '</legend>' + rows + '</fieldset>';
    }).join('');
    el.innerHTML =
      '<div class="svc-card__head"><h3>' + esc(X(item, 'name')) + '</h3>' + (item.badge ? '<span class="shop-chip shop-chip--accent">' + esc(X(item, 'badge')) + '</span>' : '') + '</div>' +
      '<p class="svc-price"><span class="svc-from">' + (groups ? T('ab ', 'from ', 'dès ') : '') + '</span>' + Shop.money(item.price) + (item.perPerson ? '<span class="svc-from"> ' + T('pro Person', 'per person', 'par personne') + '</span>' : '') + '</p>' +
      '<p class="svc-desc">' + esc(X(item, 'desc')) + '</p>' +
      (inc ? '<h4 class="svc-sub">' + T('Das ist enthalten', 'What is included', 'Ce qui est inclus') + '</h4><ul class="svc-inc">' + inc + '</ul>' : '') +
      '<form class="svc-form">' + groups +
      '<div class="svc-buy">' + (item.perPerson ? '<div class="svc-qty" role="group" aria-label="' + T('Anzahl Personen', 'Number of people', 'Nombre de personnes') + '"><button type="button" data-d="-1" aria-label="' + T('Weniger', 'Fewer', 'Moins') + '">−</button><output aria-live="polite">1</output><button type="button" data-d="1" aria-label="' + T('Mehr', 'More', 'Plus') + '">+</button></div>' : '') +
      '<p class="svc-total">' + '' + T('Gesamt (Schätzung)', 'Total (estimate)', 'Total (estimation)') + ' <strong></strong></p><button class="btn" type="submit">' + T('In den Warenkorb', 'Add to cart', 'Ajouter au panier') + '</button></div></form>';
    var form = el.querySelector('form'), out = el.querySelector('output'), tot = el.querySelector('.svc-total strong');
    function read() {
      (item.options || []).forEach(function (g) {
        var grp = cat.options[g]; if (!grp) return;
        var inputs = form.querySelectorAll('[name="' + item.id + '-' + g + '"]');
        if (grp.type === 'one') { inputs.forEach(function (i) { if (i.checked) opts[g] = i.value; }); }
        else {
          var sel = []; inputs.forEach(function (i) { if (i.checked) sel.push(i.value); });
          if (grp.max && sel.length > grp.max) { var last = document.activeElement; if (last && last.checked) last.checked = false; sel = sel.slice(0, grp.max); Shop.toast(T('Du kannst bis zu ' + grp.max + ' Extras wählen.', 'You can choose up to ' + grp.max + ' extras.', 'Vous pouvez choisir jusqu’à ' + grp.max + ' extras.')); }
          opts[g] = sel;
        }
      });
      tot.textContent = Shop.money(estimate(item, cat, opts, qty));
    }
    form.addEventListener('change', read);
    (el.querySelectorAll('.svc-qty button') || []).forEach(function (b) {
      b.addEventListener('click', function () { qty = Math.min(8, Math.max(1, qty + Number(b.dataset.d))); out.textContent = qty; read(); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault(); read();
      Shop.addToCart({ item: item.id, qty: qty, options: JSON.parse(JSON.stringify(opts)) });
      Shop.toast(T(X(item, 'name') + ' liegt im Warenkorb.', X(item, 'name') + ' is in your cart.', X(item, 'name') + ' est dans votre panier.'));
      Shop.openCart();
    });
    read();
    return el;
  }

  function start() { ready(function () {
    Shop.catalog().then(function (cat) {
      root.innerHTML = '';
      var links = [];
      cat.categories.forEach(function (c) {
        var items = cat.items.filter(function (i) { return i.category === c.id && !i.soldOut; });
        if (!items.length) return;
        if (c.id === 'guides' && cat.giftCards) {
          var gc = document.createElement('div'); gc.className = 'svc-cat'; gc.id = 'reiseguthaben';
          var gu = Shop.url('pages/gift-cards.html'), gt = T('Reiseguthaben', 'Travel credit', 'Crédit voyage');
          gc.innerHTML = '<h2>' + gt + '</h2><p class="svc-blurb">' + T('Jetzt zahlen, später reisen.', 'Pay now, travel later.', 'Payez maintenant, voyagez plus tard.') + '</p><article class="svc-card svc-card--wide"><h3>' + T('Reiseguthaben Ghana', 'Travel credit Ghana', 'Crédit voyage Ghana') + '</h3><p class="svc-price"><span class="svc-from">' + T('ab ', 'from ', 'dès ') + '</span>' + Shop.money(cat.giftCards.amounts[0]) + '</p><p class="svc-desc">' + T('Du zahlst heute und löst das Guthaben später beim Bezahlen ein, für ein Paket, einen Service oder einen Ratgeber. Du kannst es auch verschenken. Fiktives Demo-Angebot, nur Testzahlung.', 'You pay today and redeem the credit at checkout later, for a package, a service or a guide. You can also give it as a gift. Fictional demo offer, test payment only.', 'Vous payez aujourd’hui et utilisez le crédit plus tard au moment de payer, pour un forfait, un service ou un guide. Vous pouvez aussi l’offrir. Offre de démonstration fictive, paiement de test uniquement.') + '</p><div class="svc-buy"><a class="btn" href="' + esc(gu) + '">' + T('Reiseguthaben kaufen', 'Buy travel credit', 'Acheter un crédit voyage') + '</a></div></article>';
          root.appendChild(gc); links.push('<a href="#reiseguthaben" class="shop-chip">' + gt + '</a>');
        }
        var sec = document.createElement('div'); sec.className = 'svc-cat'; sec.id = c.id;
        sec.innerHTML = '<h2>' + esc(X(c, 'name')) + '</h2><p class="svc-blurb">' + esc(X(c, 'blurb') || '') + '</p>';
        var grid = document.createElement('div'); grid.className = 'svc-grid';
        items.forEach(function (i) { grid.appendChild(card(i, cat)); });
        sec.appendChild(grid); root.appendChild(sec);
        links.push('<a href="#' + c.id + '" class="shop-chip">' + esc(X(c, 'name')) + '</a>');
      });
      if (tabs) tabs.innerHTML = links.join('');
      if (location.hash) { var t = document.getElementById(location.hash.slice(1)); if (t) t.scrollIntoView(); }
    }).catch(fail);
  }); }
  start();
})();
