(function () {
  'use strict';
  var S, mode, cat, state = { amount: 0, design: '' };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return S.esc(s); }
  function T(de, en, fr) { return S.t({ de: de, en: en, fr: fr }); }
  var LOCALE = { de: 'de-DE', en: 'en-GB', fr: 'fr-FR' };
  function money(c) { return S.money(c, cat && cat.currency); }
  function say(t) { var s = $('gf-status'); if (s) s.textContent = t || ''; }
  function err(t) { var e = $('gf-error'); if (!e) return; e.textContent = t || ''; e.hidden = !t; }
  function generic() { return T('Etwas ist schiefgelaufen. Bitte versuche es noch einmal.', 'Something went wrong. Please try again.', 'Un problème est survenu. Veuillez réessayer.'); }
  function errText(x) { return S.LANG === 'de' && x && x.message ? x.message : generic(); }
  function retry(label) { return '<button type="button" class="gf-btn" id="gf-retry">' + esc(label) + '</button>'; }
  var RETRY = function () { return T('Erneut versuchen', 'Try again', 'Réessayer'); };

  function designOf(id) { return ((cat && cat.giftCards && cat.giftCards.designs) || []).filter(function (d) { return d.id === id; })[0]; }
  function cardHtml(g) {
    var d = designOf(g.design);
    return '<div class="gf-face gf-face--' + esc(g.design || 'x') + '"><p class="gf-face__brand">Ghana Vorab <span>Demo</span></p>' +
      '<p class="gf-face__amount">' + money(g.amount || 0) + '</p>' +
      '<p class="gf-face__design">' + esc(d ? S.tx(d, 'name') : '') + (d && d.line ? (S.LANG === 'fr' ? '\u00a0' : '') + ': ' + esc(S.tx(d, 'line')) : '') + '</p>' +
      '<p class="gf-face__who">' + (g.to ? T('Für ', 'For ', 'Pour ') + esc(g.to) : '') + (g.from ? T(' · von ', ' · from ', ' · de la part de ') + esc(g.from) : '') + '</p>' +
      (g.message ? '<p class="gf-face__msg">„' + esc(g.message) + '“</p>' : '') + '</div>';
  }

  /* ---------- buy ---------- */
  function initBuy() {
    var u = new URLSearchParams(location.search);
    if (u.get('p')) return finish(u.get('p'));
    if (u.get('cancelled')) say(T('Die Zahlung wurde abgebrochen. Es wurde nichts abgebucht, du kannst es neu versuchen.', 'The payment was cancelled. Nothing was charged, you can try again.', 'Le paiement a été annulé. Rien n’a été débité, vous pouvez réessayer.'));
    load();
  }
  function load() {
    $('gf-load').hidden = false; $('gf-load').textContent = T('Das Angebot wird geladen …', 'Loading the offer …', 'Chargement de l’offre …');
    S.catalog().then(function (c) {
      cat = c;
      var g = c.giftCards;
      if (!g) { $('gf-load').textContent = T('Reiseguthaben gibt es hier gerade nicht.', 'Travel credit is not available here right now.', 'Le crédit voyage n’est pas disponible ici pour le moment.'); return; }
      $('gf-load').hidden = true; $('gf-form').hidden = false; $('gf-preview').hidden = false;
      var amounts = g.amounts || [];
      state.amount = amounts.length ? amounts[Math.min(1, amounts.length - 1)] : (g.min || 0);
      state.design = ((g.designs || [])[0] || {}).id || '';
      $('gf-amounts').innerHTML = amounts.map(function (a) {
        return '<label class="gf-chip"><input type="radio" name="amount" value="' + a + '"' + (a === state.amount ? ' checked' : '') + '><span>' + money(a) + '</span></label>';
      }).join('');
      $('gf-designs').innerHTML = (g.designs || []).map(function (d, i) {
        return '<label class="gf-chip gf-chip--design"><input type="radio" name="design" value="' + esc(d.id) + '"' + (i === 0 ? ' checked' : '') + '><span><strong>' + esc(S.tx(d, 'name')) + '</strong>' + (d.line ? '<small>' + esc(S.tx(d, 'line')) + '</small>' : '') + '</span></label>';
      }).join('');
      $('gf-range').textContent = '(' + money(g.min) + T(' bis ', ' to ', ' à ') + money(g.max) + ')';
      $('gf-form').addEventListener('input', onInput);
      $('gf-form').addEventListener('submit', submit);
      preview();
    }).catch(function () {
      $('gf-load').innerHTML = esc(T('Das Angebot lässt sich gerade nicht laden.', 'The offer cannot be loaded right now.', 'Impossible de charger l’offre pour le moment.')) + ' ' + retry(RETRY());
      $('gf-retry').addEventListener('click', load);
    });
  }
  function customCents() {
    var v = $('gf-custom').value.trim().replace(',', '.');
    if (!v) return null;
    var n = Number(v);
    return isFinite(n) ? Math.round(n * 100) : NaN;
  }
  function onInput(e) {
    var t = e.target;
    if (t.name === 'amount') { state.amount = Number(t.value); $('gf-custom').value = ''; }
    else if (t.name === 'design') state.design = t.value;
    else if (t.id === 'gf-custom') {
      var c = customCents();
      if (c !== null && !isNaN(c)) { state.amount = c; [].forEach.call(document.querySelectorAll('input[name=amount]'), function (r) { r.checked = false; }); }
    }
    preview();
  }
  function preview() {
    $('gf-preview').innerHTML = '<h3>' + esc(T('So sieht es aus', 'This is how it looks', 'Voici l’aperçu')) + '</h3>' +
      cardHtml({ amount: state.amount, design: state.design, to: $('gf-to').value.trim(), from: $('gf-from').value.trim(), message: $('gf-msg').value.trim() }) +
      '<p class="gf-note">' + esc(T('Das Guthaben deckt jedes Paket und jede Leistung. Bleibt etwas übrig, bleibt es auf dem Code.', 'The credit covers any package or service. Whatever is left stays on the code.', 'Le crédit couvre tout forfait et tout service. Le solde reste sur le code.')) + '</p>';
  }
  function submit(e) {
    e.preventDefault(); err('');
    var g = cat.giftCards, cc = customCents();
    if (cc !== null) state.amount = cc;
    if (!state.amount || isNaN(state.amount) || state.amount < g.min || state.amount > g.max)
      return err(T('Bitte wähle einen Betrag zwischen ' + money(g.min) + ' und ' + money(g.max) + '.', 'Please choose an amount between ' + money(g.min) + ' and ' + money(g.max) + '.', 'Veuillez choisir un montant entre ' + money(g.min) + ' et ' + money(g.max) + '.'));
    if (state.amount % 100) return err(T('Bitte gib einen ganzen Eurobetrag ein.', 'Please enter a whole euro amount.', 'Veuillez saisir un montant en euros entiers.'));
    var to = $('gf-to').value.trim(), from = $('gf-from').value.trim();
    if (!to) { $('gf-to').focus(); return err(T('Bitte sag uns, für wen das Guthaben ist.', 'Please tell us who the credit is for.', 'Veuillez indiquer pour qui est le crédit.')); }
    if (!from) { $('gf-from').focus(); return err(T('Bitte trag ein, von wem es kommt.', 'Please enter who it is from.', 'Veuillez indiquer de la part de qui il est offert.')); }
    var b = $('gf-pay'), label = b.textContent; b.disabled = true; b.textContent = T('Einen Moment …', 'One moment …', 'Un instant …');
    S.api('giftcards', { amount: state.amount, design: state.design, to: to, from: from, message: $('gf-msg').value.trim() }).then(function (d) {
      if (!d.pay || !d.pay.url) throw new Error(T('Die Zahlung konnte nicht gestartet werden. Bitte versuche es noch einmal.', '', ''));
      location.href = /^https?:/.test(d.pay.url) ? d.pay.url : S.url(d.pay.url);
    }).catch(function (x) { b.disabled = false; b.textContent = label; err(errText(x)); });
  }

  /* ---------- after payment ---------- */
  function finish(token) {
    $('gf-buy').hidden = true; $('gf-load').hidden = true;
    var checking = T('Wir prüfen deine Zahlung …', 'We are checking your payment …', 'Nous vérifions votre paiement …');
    say(checking);
    var tries = 0;
    (function poll() {
      S.api('giftcards/purchase/' + encodeURIComponent(token)).then(function (p) {
        var g = p.giftCard || null, code = p.code || (g && g.code), st = p.state || p.status;
        if (code) return S.catalog().catch(function () { return null; }).then(function (c) { cat = c; return (g && g.balance != null ? Promise.resolve(g) : S.api('giftcards/' + encodeURIComponent(code))).then(function (gc) { show(code, gc); }); });
        if (st === 'cancelled' || st === 'expired') { say(T('Die Zahlung wurde nicht abgeschlossen. Es wurde nichts abgebucht.', 'The payment was not completed. Nothing was charged.', 'Le paiement n’a pas abouti. Rien n’a été débité.')); $('gf-buy').hidden = false; load(); return; }
        if (++tries > 20) { say(T('Die Zahlung ist noch nicht bestätigt. Lade die Seite in einer Minute neu.', 'The payment is not confirmed yet. Reload the page in a minute.', 'Le paiement n’est pas encore confirmé. Rechargez la page dans une minute.')); return; }
        setTimeout(poll, 1500);
      }).catch(function (x) {
        say(errText(x) + ' ');
        var b = document.createElement('button'); b.type = 'button'; b.className = 'gf-btn'; b.textContent = RETRY();
        b.addEventListener('click', function () { say(checking); poll(); }); $('gf-status').appendChild(b);
      });
    })();
  }
  function show(code, g) {
    say('');
    var w = S.get('wallet', []) || []; if (w.indexOf(code) < 0) { w.unshift(code); S.set('wallet', w); }
    var link = S.url('pages/gift.html?c=' + encodeURIComponent(code));
    var r = $('gf-result'); r.hidden = false;
    r.innerHTML = '<h3>' + esc(T('Dein Reiseguthaben ist da.', 'Your travel credit is ready.', 'Votre crédit voyage est prêt.')) + '</h3><div class="gf-wrap"><div class="gf-card">' + cardHtml(g) + '</div><div class="gf-card gf-use">' +
      '<p class="gf-codelabel">' + esc(T('Dein Code', 'Your code', 'Votre code')) + '</p><p class="gf-code" id="gf-codeout">' + esc(code) + '</p>' +
      '<p>' + esc(T('Guthaben', 'Balance', 'Solde')) + (S.LANG === 'fr' ? '\u00a0' : '') + ': <strong>' + money(g.balance != null ? g.balance : g.amount) + '</strong></p>' +
      '<p>' + esc(T('So löst du es ein: Wähle ein Angebot, gib den Code an der Kasse unter Geschenkkarte ein. Der Code ist in diesem Browser schon gemerkt. Ist die Buchung günstiger, bleibt der Rest auf dem Code.',
        'How to use it: pick an offer and enter the code at checkout, in the gift card field. The code is already saved in this browser. If the booking costs less, the rest stays on the code.',
        'Comment l’utiliser : choisissez une offre et saisissez le code à la caisse, dans le champ carte cadeau. Le code est déjà enregistré dans ce navigateur. Si la réservation coûte moins, le solde reste sur le code.')) + '</p>' +
      '<div class="gf-actions"><button type="button" class="gf-btn gf-btn--solid" id="gf-dl">' + esc(T('Karte als Textdatei laden', 'Download the card as a text file', 'Télécharger la carte en fichier texte')) + '</button>' +
      '<button type="button" class="gf-btn" id="gf-copy">' + esc(T('Link zum Verschenken kopieren', 'Copy the link to share', 'Copier le lien à partager')) + '</button>' +
      '<button type="button" class="gf-btn" id="gf-print">' + esc(T('Drucken', 'Print', 'Imprimer')) + '</button>' +
      '<a class="gf-btn" href="' + esc(S.url('pages/services.html')) + '">' + esc(T('Zu den Angeboten', 'See the offers', 'Voir les offres')) + '</a></div>' +
      '<p class="gf-test">' + esc(S.TEST_LABEL) + ' ' + esc(T('Das Guthaben hat keinen echten Wert.', 'The credit has no real value.', 'Le crédit n’a aucune valeur réelle.')) + '</p></div></div>';
    $('gf-dl').addEventListener('click', function () { S.download(T('reiseguthaben-', 'travel-credit-', 'credit-voyage-') + code + '.txt', cardText(code, g, link)); });
    $('gf-print').addEventListener('click', function () { window.print(); });
    $('gf-copy').addEventListener('click', function () {
      var done = function () { S.toast(T('Link kopiert.', 'Link copied.', 'Lien copié.')); };
      var fallback = function () { S.toast(T('Kopieren geht hier nicht. Der Link: ', 'Copying is not possible here. The link: ', 'La copie n’est pas possible ici. Le lien : ') + link); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, fallback); else fallback();
    });
  }
  function cardText(code, g, link) {
    return [
      T('Ghana Vorab: Reiseguthaben (Demo, fiktive Agentur)', 'Ghana Vorab: travel credit (demo, fictional agency)', 'Ghana Vorab : crédit voyage (démo, agence fictive)'), '',
      'Code: ' + code,
      T('Guthaben: ', 'Balance: ', 'Solde : ') + money(g.balance != null ? g.balance : g.amount),
      g.to ? T('Für: ', 'For: ', 'Pour : ') + g.to : null,
      g.from ? T('Von: ', 'From: ', 'De la part de : ') + g.from : null,
      g.message ? T('Nachricht: ', 'Message: ', 'Message : ') + g.message : null, '',
      T('Einlösen: Code an der Kasse eingeben. Was nicht gebraucht wird, bleibt auf dem Code.', 'To use it: enter the code at checkout. Whatever is not used stays on the code.', 'Utilisation : saisissez le code à la caisse. Le solde non utilisé reste sur le code.'),
      T('Prüfen: ', 'Check: ', 'Vérifier : ') + link, '', S.TEST_LABEL
    ].filter(function (x) { return x !== null; }).join('\n');
  }

  /* ---------- view ---------- */
  function initView() {
    $('gf-lookup').addEventListener('submit', function (e) { e.preventDefault(); lookup($('gf-code').value); });
    var c = S.param('c'); if (c) { $('gf-code').value = c; lookup(c); }
  }
  function lookup(raw) {
    var code = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
    err(''); $('gf-result').hidden = true;
    if (!code) return err(T('Bitte gib den Code deines Reiseguthabens ein.', 'Please enter the code of your travel credit.', 'Veuillez saisir le code de votre crédit voyage.'));
    say(T('Einen Moment …', 'One moment …', 'Un instant …'));
    S.catalog().catch(function () { return null; }).then(function (c) { cat = c; return S.api('giftcards/' + encodeURIComponent(code)); }).then(function (g) {
      say('');
      var r = $('gf-result'); r.hidden = false;
      var bal = g.balance != null ? g.balance : g.amount;
      r.innerHTML = '<div class="gf-wrap"><div class="gf-card">' + cardHtml(g) + '</div><div class="gf-card gf-use"><p class="gf-codelabel">' + esc(T('Restguthaben', 'Remaining balance', 'Solde restant')) + '</p><p class="gf-code">' + money(bal) + '</p>' +
        '<p>Code ' + esc(g.code || code) + (g.issued ? esc(T(', ausgestellt am ', ', issued on ', ', émis le ')) + esc(new Date(g.issued).toLocaleDateString(LOCALE[S.LANG] || 'de-DE')) : '') + '.</p>' +
        (bal > 0 ? '<p>' + esc(T('So nutzt du es: Wähle ein Angebot und gib den Code an der Kasse ein. Der Rest bleibt auf dem Code.', 'How to use it: pick an offer and enter the code at checkout. The rest stays on the code.', 'Comment l’utiliser : choisissez une offre et saisissez le code à la caisse. Le solde reste sur le code.')) + '</p><div class="gf-actions"><button type="button" class="gf-btn gf-btn--solid" id="gf-save">' + esc(T('Im Browser merken', 'Save in this browser', 'Enregistrer dans ce navigateur')) + '</button><a class="gf-btn" href="' + esc(S.url('pages/services.html')) + '">' + esc(T('Jetzt einlösen', 'Use it now', 'Utiliser maintenant')) + '</a></div>'
               : '<p>' + esc(T('Dieses Guthaben ist aufgebraucht.', 'This credit has been used up.', 'Ce crédit est épuisé.')) + '</p>') +
        '<p class="gf-test">' + esc(S.TEST_LABEL) + '</p></div></div>';
      var sv = $('gf-save'); if (sv) sv.addEventListener('click', function () { var w = S.get('wallet', []) || []; var k = g.code || code; if (w.indexOf(k) < 0) w.unshift(k); S.set('wallet', w); S.toast(T('Der Code ist gemerkt und an der Kasse wählbar.', 'The code is saved and can be chosen at checkout.', 'Le code est enregistré et sélectionnable à la caisse.')); });
    }).catch(function (x) {
      say('');
      err(/gift ?card|not found|unknown|kennen|Geschenk|nicht gefunden/i.test(x.message || '') ? T('Diesen Code kennen wir nicht. Bitte prüfe die Schreibweise.', 'We do not know this code. Please check the spelling.', 'Ce code est inconnu. Veuillez vérifier l’orthographe.') : errText(x));
    });
  }

  function init() {
    S = window.Shop; mode = document.body.getAttribute('data-gifts');
    if (!S) return;
    if (mode === 'buy') initBuy(); else if (mode === 'view') initView();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
