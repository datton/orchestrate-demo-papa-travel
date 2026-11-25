(function () {
  'use strict';
  var S, mode, cat, state = { amount: 0, design: '' };
  function $(id) { return document.getElementById(id); }
  function esc(s) { return S.esc(s); }
  function money(c) { return S.money(c, cat && cat.currency); }
  function say(t) { var s = $('gf-status'); if (s) s.textContent = t || ''; }
  function err(t) { var e = $('gf-error'); if (!e) return; e.textContent = t || ''; e.hidden = !t; }

  function cardHtml(g, opts) {
    opts = opts || {};
    var d = designOf(g.design);
    return '<div class="gf-face gf-face--' + esc(g.design || 'x') + '"><p class="gf-face__brand">Ghana Vorab <span>Demo</span></p>' +
      '<p class="gf-face__amount">' + (opts.amountText || money(g.amount || 0)) + '</p>' +
      '<p class="gf-face__design">' + esc(d ? d.name : '') + (d && d.line ? ': ' + esc(d.line) : '') + '</p>' +
      '<p class="gf-face__who">' + (g.to ? 'Für ' + esc(g.to) : '') + (g.from ? ' · von ' + esc(g.from) : '') + '</p>' +
      (g.message ? '<p class="gf-face__msg">„' + esc(g.message) + '“</p>' : '') + '</div>';
  }
  function designOf(id) { return ((cat && cat.giftCards && cat.giftCards.designs) || []).filter(function (d) { return d.id === id; })[0]; }

  /* ---------- buy ---------- */
  function initBuy() {
    var u = new URLSearchParams(location.search);
    if (u.get('p')) return finish(u.get('p'));
    if (u.get('cancelled')) { say('Die Zahlung wurde abgebrochen. Es wurde nichts abgebucht, du kannst es neu versuchen.'); }
    load();
  }
  function load() {
    $('gf-load').hidden = false; $('gf-load').innerHTML = 'Das Angebot wird geladen …';
    S.catalog().then(function (c) {
      cat = c;
      var g = c.giftCards;
      if (!g) { $('gf-load').textContent = 'Reiseguthaben gibt es hier gerade nicht.'; return; }
      $('gf-load').hidden = true; $('gf-form').hidden = false; $('gf-preview').hidden = false;
      var amounts = g.amounts || [];
      state.amount = amounts.length ? amounts[Math.min(1, amounts.length - 1)] : (g.min || 0);
      state.design = ((g.designs || [])[0] || {}).id || '';
      $('gf-amounts').innerHTML = amounts.map(function (a) {
        return '<label class="gf-chip"><input type="radio" name="amount" value="' + a + '"' + (a === state.amount ? ' checked' : '') + '><span>' + money(a) + '</span></label>';
      }).join('');
      $('gf-designs').innerHTML = (g.designs || []).map(function (d, i) {
        return '<label class="gf-chip gf-chip--design"><input type="radio" name="design" value="' + esc(d.id) + '"' + (i === 0 ? ' checked' : '') + '><span><strong>' + esc(d.name) + '</strong>' + (d.line ? '<small>' + esc(d.line) + '</small>' : '') + '</span></label>';
      }).join('');
      $('gf-range').textContent = '(' + money(g.min) + ' bis ' + money(g.max) + ')';
      $('gf-form').addEventListener('input', onInput);
      $('gf-form').addEventListener('submit', submit);
      preview();
    }).catch(function () {
      $('gf-load').innerHTML = 'Das Angebot lässt sich gerade nicht laden. <button type="button" class="gf-btn" id="gf-retry">Erneut versuchen</button>';
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
    $('gf-preview').innerHTML = '<h3>So sieht es aus</h3>' + cardHtml({ amount: state.amount, design: state.design, to: $('gf-to').value.trim(), from: $('gf-from').value.trim(), message: $('gf-msg').value.trim() }) +
      '<p class="gf-note">Das Guthaben deckt jedes Paket und jede Leistung. Bleibt etwas übrig, bleibt es auf dem Code.</p>';
  }
  function submit(e) {
    e.preventDefault(); err('');
    var g = cat.giftCards, cc = customCents();
    if (cc !== null) state.amount = cc;
    if (!state.amount || isNaN(state.amount) || state.amount < g.min || state.amount > g.max) return err('Bitte wähle einen Betrag zwischen ' + money(g.min) + ' und ' + money(g.max) + '.');
    if (state.amount % 100) return err('Bitte gib einen ganzen Eurobetrag ein.');
    var to = $('gf-to').value.trim(), from = $('gf-from').value.trim();
    if (!to) { $('gf-to').focus(); return err('Bitte sag uns, für wen das Guthaben ist.'); }
    if (!from) { $('gf-from').focus(); return err('Bitte trag ein, von wem es kommt.'); }
    var b = $('gf-pay'); b.disabled = true; b.textContent = 'Einen Moment …';
    S.api('giftcards', { amount: state.amount, design: state.design, to: to, from: from, message: $('gf-msg').value.trim() }).then(function (d) {
      if (!d.pay || !d.pay.url) throw new Error('Die Zahlung konnte nicht gestartet werden. Bitte versuche es noch einmal.');
      location.href = /^https?:/.test(d.pay.url) ? d.pay.url : S.url(d.pay.url);
    }).catch(function (x) { b.disabled = false; b.textContent = 'Weiter zur Testzahlung'; err(x.message); });
  }

  /* ---------- after payment ---------- */
  function finish(token) {
    $('gf-buy').hidden = true; $('gf-load').hidden = true;
    say('Wir prüfen deine Zahlung …');
    var tries = 0;
    (function poll() {
      S.api('giftcards/purchase/' + encodeURIComponent(token)).then(function (p) {
        var g = p.giftCard || null, code = p.code || (g && g.code);
        if (code) return S.catalog().catch(function () { return null; }).then(function (c) { cat = c; return (g && g.balance != null ? Promise.resolve(g) : S.api('giftcards/' + encodeURIComponent(code))).then(function (gc) { show(code, gc); }); });
        if ((p.state || p.status) === 'cancelled' || (p.state || p.status) === 'expired') { say('Die Zahlung wurde nicht abgeschlossen. Es wurde nichts abgebucht.'); $('gf-buy').hidden = false; load(); return; }
        if (++tries > 20) { say('Die Zahlung ist noch nicht bestätigt. Lade die Seite in einer Minute neu.'); return; }
        setTimeout(poll, 1500);
      }).catch(function (x) {
        say(x.message + ' ');
        var b = document.createElement('button'); b.type = 'button'; b.className = 'gf-btn'; b.textContent = 'Erneut versuchen';
        b.addEventListener('click', function () { say('Wir prüfen deine Zahlung …'); poll(); }); $('gf-status').appendChild(b);
      });
    })();
  }
  function show(code, g) {
    say('');
    var w = S.get('wallet', []) || []; if (w.indexOf(code) < 0) { w.unshift(code); S.set('wallet', w); }
    var link = S.url('pages/gift.html?c=' + encodeURIComponent(code));
    var r = $('gf-result'); r.hidden = false;
    r.innerHTML = '<h3>Dein Reiseguthaben ist da.</h3><div class="gf-wrap"><div class="gf-card">' + cardHtml(g) + '</div><div class="gf-card gf-use">' +
      '<p class="gf-codelabel">Dein Code</p><p class="gf-code" id="gf-codeout">' + esc(code) + '</p>' +
      '<p>Guthaben: <strong>' + money(g.balance != null ? g.balance : g.amount) + '</strong></p>' +
      '<p>So löst du es ein: Wähle ein Angebot, gib den Code an der Kasse unter Geschenkkarte ein. Der Code ist in diesem Browser schon gemerkt. Ist die Buchung günstiger, bleibt der Rest auf dem Code.</p>' +
      '<div class="gf-actions"><button type="button" class="gf-btn gf-btn--solid" id="gf-dl">Karte als Textdatei laden</button><button type="button" class="gf-btn" id="gf-copy">Link zum Verschenken kopieren</button><button type="button" class="gf-btn" onclick="window.print()">Drucken</button><a class="gf-btn" href="services.html">Zu den Angeboten</a></div>' +
      '<p class="gf-test">Demo-Shop: nur Testzahlungen, es bewegt sich kein echtes Geld. Das Guthaben hat keinen echten Wert.</p></div></div>';
    $('gf-dl').addEventListener('click', function () { S.download('reiseguthaben-' + code + '.txt', cardText(code, g, link)); });
    $('gf-copy').addEventListener('click', function () {
      var done = function () { S.toast('Link kopiert.'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(link).then(done, function () { S.toast('Kopieren geht hier nicht. Der Link: ' + link); }); else S.toast('Der Link: ' + link);
    });
  }
  function cardText(code, g, link) {
    return ['Ghana Vorab: Reiseguthaben (Demo, fiktive Agentur)', '', 'Code: ' + code, 'Guthaben: ' + money(g.balance != null ? g.balance : g.amount),
      g.to ? 'Für: ' + g.to : '', g.from ? 'Von: ' + g.from : '', g.message ? 'Nachricht: ' + g.message : '', '', 'Einlösen: Code an der Kasse eingeben. Was nicht gebraucht wird, bleibt auf dem Code.',
      'Prüfen: ' + link, '', S.TEST_LABEL].filter(function (x, i) { return x !== '' || i; }).join('\n');
  }

  /* ---------- view ---------- */
  function initView() {
    $('gf-lookup').addEventListener('submit', function (e) { e.preventDefault(); lookup($('gf-code').value); });
    var c = S.param('c'); if (c) { $('gf-code').value = c; lookup(c); }
  }
  function lookup(raw) {
    var code = String(raw || '').trim().toUpperCase().replace(/\s+/g, '');
    err(''); $('gf-result').hidden = true;
    if (!code) return err('Bitte gib den Code deines Reiseguthabens ein.');
    say('Einen Moment …');
    S.catalog().catch(function () { return null; }).then(function (c) { cat = c; return S.api('giftcards/' + encodeURIComponent(code)); }).then(function (g) {
      say('');
      var r = $('gf-result'); r.hidden = false;
      var bal = g.balance != null ? g.balance : g.amount;
      r.innerHTML = '<div class="gf-wrap"><div class="gf-card">' + cardHtml(g) + '</div><div class="gf-card gf-use"><p class="gf-codelabel">Restguthaben</p><p class="gf-code">' + money(bal) + '</p>' +
        '<p>Code ' + esc(g.code || code) + (g.issued ? ', ausgestellt am ' + esc(new Date(g.issued).toLocaleDateString('de-DE')) : '') + '.</p>' +
        (bal > 0 ? '<p>So nutzt du es: Wähle ein Angebot und gib den Code an der Kasse ein. Der Rest bleibt auf dem Code.</p><div class="gf-actions"><button type="button" class="gf-btn gf-btn--solid" id="gf-save">Im Browser merken</button><a class="gf-btn" href="services.html">Jetzt einlösen</a></div>' : '<p>Dieses Guthaben ist aufgebraucht.</p>') +
        '<p class="gf-test">Demo-Shop: nur Testzahlungen, es bewegt sich kein echtes Geld.</p></div></div>';
      var sv = $('gf-save'); if (sv) sv.addEventListener('click', function () { var w = S.get('wallet', []) || []; var k = g.code || code; if (w.indexOf(k) < 0) w.unshift(k); S.set('wallet', w); S.toast('Der Code ist gemerkt und an der Kasse wählbar.'); });
    }).catch(function (x) { say(''); err(/gift ?card|not found|unknown/i.test(x.message) ? 'Diesen Code kennen wir nicht. Bitte prüfe die Schreibweise.' : x.message); });
  }

  function init() {
    S = window.Shop; mode = document.body.getAttribute('data-gifts');
    if (!S) return;
    if (mode === 'buy') initBuy(); else if (mode === 'view') initView();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
