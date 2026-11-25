/* Checkout and payment (Senior Developer 3). */
(function () {
  'use strict';
  var S = window.Shop;
  var $ = function (id) { return document.getElementById(id); };
  var state = { coupon: 'best', gift: '', quote: null, busy: false };
  var quoteSeq = 0;

  var T = S.t;
  var GENERIC = { de: 'Das hat leider nicht geklappt. Bitte versuche es noch einmal.', en: 'That did not work. Please try again.', fr: 'Cela n’a pas fonctionné. Veuillez réessayer.' };
  // The service answers in English or German for errors: show the visitor's language.
  function de(msg) {
    msg = String(msg || '');
    if (/gift ?card|guthaben/i.test(msg)) return T({ de: 'Diesen Code des Reiseguthabens kennen wir nicht, oder er hat kein Guthaben mehr.', en: 'We do not recognise this travel credit code, or it has no credit left.', fr: 'Nous ne reconnaissons pas ce code de crédit voyage, ou il n’a plus de solde.' });
    if (/coupon|promo|gutschein/i.test(msg)) return T({ de: 'Dieser Gutschein kann für diese Buchung nicht verwendet werden.', en: 'This coupon cannot be used for this booking.', fr: 'Ce code promo ne peut pas être utilisé pour cette réservation.' });
    if (/too many|slow down|rate|zu viele/i.test(msg)) return T({ de: 'Gerade sind zu viele Anfragen unterwegs. Bitte warte einen Moment.', en: 'Too many requests right now. Please wait a moment.', fr: 'Trop de demandes en ce moment. Veuillez patienter un instant.' });
    if (/empty|no items|nothing in|leer/i.test(msg)) return T({ de: 'Dein Warenkorb ist leer.', en: 'Your cart is empty.', fr: 'Votre panier est vide.' });
    if (/unavailable|sold out|not available|nicht verfügbar/i.test(msg)) return T({ de: 'Eines der Angebote ist gerade nicht verfügbar.', en: 'One of the offers is not available right now.', fr: 'L’une des offres n’est pas disponible pour le moment.' });
    return T(GENERIC);
  }

  function init() {
    var p = S.get('profile', {}) || {};
    $('co-name').value = p.name || '';
    $('co-email').value = p.email || '';
    $('co-coupon').addEventListener('change', function () { state.coupon = this.value; refresh(); });
    $('co-gift-apply').addEventListener('click', function () { applyGift($('co-gift').value); });
    $('co-gift').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); applyGift(this.value); } });
    $('co-form').addEventListener('submit', submit);
    $('co-retry').addEventListener('click', function () { $('co-retry').hidden = true; refresh(); });
    renderWallet();
    // Gift cards only when this shop sells them and the customer has one saved: nothing else could ever work.
    // This shop sells travel credit, so the code field is always there.

    // An unpaid order whose cart was emptied (cancelled, or back button): put the cart back.
    var pend = S.get('pending-cart', null);
    if (pend && pend.token) {
      S.set('pending-cart', null);
      if (!S.cart().length && pend.lines && pend.lines.length) {
        var restore = function () { S.saveCart(pend.lines); refresh(); };
        if (S.param('cancelled') === pend.token) restore();
        else S.api('orders/' + encodeURIComponent(pend.token)).then(function (o) { if (o.status === 'pending' || (o.payment && o.payment.state !== 'paid')) restore(); }).catch(function () {});
      }
    }
    var cancelled = S.param('cancelled');
    if (cancelled) {
      $('co-banner').textContent = T({ de: 'Die Zahlung wurde abgebrochen. Es wurde nichts abgebucht, dein Warenkorb ist noch da.', en: 'The payment was cancelled. Nothing was charged and your cart is still here.', fr: 'Le paiement a été annulé. Rien n’a été débité et votre panier est toujours là.' });
      S.api('orders/' + encodeURIComponent(cancelled) + '/cancel', {}).catch(function () {});
      history.replaceState(null, '', location.pathname);
    }
    refresh();
  }

  function renderWallet() {
    var codes = S.get('wallet', []) || [], host = $('co-wallet');
    host.innerHTML = '';
    codes.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'shop-chip';
      b.textContent = (c === state.gift ? '✓ ' : '') + T({ de: 'Guthaben ', en: 'Credit ', fr: 'Crédit ' }) + String(c).slice(-4);
      b.setAttribute('aria-pressed', c === state.gift ? 'true' : 'false');
      b.addEventListener('click', function () { applyGift(c === state.gift ? '' : c); });
      host.appendChild(b);
    });
  }

  function applyGift(code) {
    code = String(code || '').trim();
    $('co-gift-err').textContent = '';
    var prev = state.gift;
    state.gift = code;
    refresh().then(function (ok) {
      var g = ok && state.quote && state.quote.giftCard;
      if (code && g && !g.applied && !g.balanceAfter) { ok = false; state.lastError = T({ de: 'Auf diesem Reiseguthaben ist nichts mehr übrig.', en: 'There is nothing left on this travel credit.', fr: 'Il ne reste rien sur ce crédit voyage.' }); }
      if (!ok) { state.gift = prev; $('co-gift-err').textContent = state.lastError || T({ de: 'Dieses Reiseguthaben kann nicht verwendet werden.', en: 'This travel credit cannot be used.', fr: 'Ce crédit voyage ne peut pas être utilisé.' }); refresh(); }
      else { if (code) $('co-gift').value = ''; renderWallet(); }
    });
  }

  function body() {
    var b = { items: S.cart(), customer: S.customerId() };
    if (state.coupon) b.coupon = state.coupon;
    if (state.gift) b.giftCard = state.gift;
    return b;
  }

  function refresh() {
    var cart = S.cart(), seq = ++quoteSeq;
    $('co-empty').hidden = cart.length > 0;
    $('co-grid').hidden = cart.length === 0;
    if (!cart.length) return Promise.resolve(true);
    $('co-pay').disabled = true;
    // Wait for the catalog too: item, option and coupon names come from it in the visitor's language.
    return Promise.all([S.api('quote', body()), S.catalog().catch(function () { return null; })]).then(function (r) {
      var q = r[0];
      if (seq !== quoteSeq) return true;
      state.quote = q; $('co-error').textContent = ''; state.lastError = ''; $('co-retry').hidden = true;
      render(q); return true;
    }).catch(function (e) {
      if (seq !== quoteSeq) return false;
      state.lastError = de(e.message); $('co-error').textContent = state.lastError; $('co-retry').hidden = false; return false;
    });
  }

  function render(q) {
    var cur = q.currency, m = function (c) { return S.money(c, cur); };
    $('co-lines').innerHTML = q.lines.map(function (l, i) {
      var nm = S.itemName(l.item, l.name), sm = l.summary;
      // The service names the chosen options (also the defaults): show them in the visitor's language.
      if (l.options && l.options.length) sm = l.options.map(function (o) { return S.choiceName(o.group, o.choice, o.name); }).join(', ');
      return '<li><span>' + S.esc(nm) + ' × ' + l.qty + (sm ? '<small>' + S.esc(sm) + '</small>' : '') + '</span><span>' + m(l.total) + '</span></li>';
    }).join('');
    var rows = ['<div><dt>' + T({ de: 'Zwischensumme', en: 'Subtotal', fr: 'Sous-total' }) + '</dt><dd>' + m(q.subtotal) + '</dd></div>'];
    if (q.discount) rows.push('<div class="is-saving"><dt>' + T({ de: 'Gutschein ', en: 'Coupon ', fr: 'Code promo ' }) + S.esc(q.discount.code) + '</dt><dd>−' + m(q.discount.amount) + '</dd></div>');
    if (q.giftCard) rows.push('<div class="is-saving"><dt>' + T({ de: 'Reiseguthaben ', en: 'Travel credit ', fr: 'Crédit voyage ' }) + S.esc(q.giftCard.last4) + '</dt><dd>−' + m(q.giftCard.applied) + '</dd></div>');
    if (q.giftCard) rows.push('<div><dt>' + T({ de: 'Restguthaben danach', en: 'Credit left afterwards', fr: 'Solde restant après' }) + '</dt><dd>' + m(q.giftCard.balanceAfter) + '</dd></div>');
    rows.push('<div class="is-total"><dt>' + T({ de: 'Gesamt', en: 'Total', fr: 'Total' }) + '</dt><dd>' + m(q.total) + '</dd></div>');
    $('co-totals').innerHTML = rows.join('');
    var sel = $('co-coupon'), usable = q.usable || [];
    sel.innerHTML = '<option value="best">' + T({ de: 'Bester Gutschein (automatisch)', en: 'Best coupon (automatic)', fr: 'Meilleur code promo (automatique)' }) + '</option><option value="">' + T({ de: 'Kein Gutschein', en: 'No coupon', fr: 'Aucun code promo' }) + '</option>' +
      usable.map(function (u) { return '<option value="' + S.esc(u.code) + '"' + (u.amount ? '' : ' disabled') + '>' + S.esc(u.code) + ' · ' + S.esc(S.couponName(u.code, u.name)) + (u.amount ? ' (−' + m(u.amount) + ')' : '') + '</option>'; }).join('');
    sel.value = state.coupon;
    var hint = '';
    if (state.coupon === 'best') hint = q.discount ? T({ de: 'Der beste Gutschein ist angewendet: ', en: 'The best coupon is applied: ', fr: 'Le meilleur code promo est appliqué : ' }) + S.couponName(q.discount.code, q.discount.name) + '.' : T({ de: 'Für diese Buchung gilt kein Gutschein.', en: 'No coupon applies to this booking.', fr: 'Aucun code promo ne s’applique à cette réservation.' });
    else if (state.coupon) { var u = usable.filter(function (x) { return x.code === state.coupon; })[0]; hint = u && u.why ? (S.LANG === 'de' ? u.why : '') : ''; }
    $('co-coupon-hint').textContent = hint;
    $('co-pay').textContent = q.total > 0 ? T({ de: 'Bezahlen: ', en: 'Pay ', fr: 'Payer ' }) + m(q.total) : T({ de: 'Buchung abschließen', en: 'Complete booking', fr: 'Finaliser la réservation' });
    $('co-pay').disabled = false;
  }

  function validate() {
    var ok = true, name = $('co-name').value.trim(), email = $('co-email').value.trim();
    $('co-name-err').textContent = name ? '' : T({ de: 'Bitte gib deinen Namen ein.', en: 'Please enter your name.', fr: 'Veuillez saisir votre nom.' });
    var emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    $('co-email-err').textContent = emailOk ? '' : T({ de: 'Bitte gib eine gültige E-Mail-Adresse ein.', en: 'Please enter a valid email address.', fr: 'Veuillez saisir une adresse e-mail valide.' });
    if (!name) { $('co-name').focus(); ok = false; }
    else if (!emailOk) { $('co-email').focus(); ok = false; }
    return ok;
  }

  function submit(e) {
    e.preventDefault();
    if (state.busy || !validate()) return;
    var name = $('co-name').value.trim(), email = $('co-email').value.trim(), note = $('co-note').value.trim();
    S.set('profile', Object.assign({}, S.get('profile', {}), { name: name, email: email }));
    var b = body();
    b.name = name;
    b.note = note.slice(0, 300);   // the email stays in this browser (profile); the service gets name and note only
    S.catalog().then(function (c) {
      var st = S.get('store', null) || (c.stores && c.stores[0] && c.stores[0].id);
      if (st) b.store = st;
    }).catch(function () {}).then(function () {
      state.busy = true; $('co-pay').disabled = true; $('co-pay').textContent = T({ de: 'Einen Moment …', en: 'One moment …', fr: 'Un instant …' });
      return S.api('orders', b);
    }).then(function (r) {
      S.addOrder(r.order.token);
      // The order exists: empty the cart, but keep a copy until the payment is done, so cancelling brings it back.
      S.set('pending-cart', { token: r.order.token, lines: S.cart() });
      S.saveCart([]);
      if (r.pay && r.pay.url) { location.href = r.pay.url; }
      else { S.set('pending-cart', null); location.href = S.url('pages/order.html?o=' + encodeURIComponent(r.order.token)); }
    }).catch(function (err) {
      state.busy = false; var m = de(err.message); $('co-error').textContent = m; S.toast(m, 'error');
      if (state.quote) render(state.quote);
    });
  }

  window.addEventListener('shop:cart', function () { refresh(); });
  if (S) { document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init(); }
})();
