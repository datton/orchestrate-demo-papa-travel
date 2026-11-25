/* Packliste: Haken gespeichert über Shop.get/set('packliste'), Fortschritt, Zurücksetzen. Inhalt aus content/facts.md. */
(function () {
  var GROUPS = [
    { t: 'Papiere und Geld', i: [
      ['pass', 'Reisepass: mindestens sechs Monate gültig ab Einreise (kein Personalausweis)'],
      ['visum', 'Visum, vorab über das offizielle Portal oder die Botschaft von Ghana in Berlin beantragt'],
      ['impfpass', 'Impfnachweis zur Gelbfieber-Impfung'],
      ['qr', 'QR-Code der Gesundheitserklärung (online vor Reisebeginn ausgefüllt)'],
      ['kopie', 'Kopie des Passes'],
      ['bargeld', 'Etwas Bargeld in Cedi und eine Visa-Karte'],
      ['police', 'Unterlagen der Auslandskranken- und Rücktransportversicherung']
    ] },
    { t: 'Gesundheit', i: [
      ['medis', 'Eigene Medikamente: rechtlichen Status in Ghana vorher prüfen'],
      ['malaria', 'Malaria-Vorsorge mit Reise- oder Tropenmedizin besprochen'],
      ['impf', 'Weitere Impfungen mit der Ärztin oder dem Arzt besprochen']
    ] },
    { t: 'Technik und Kleidung', i: [
      ['adapter', 'Steckdosenadapter für Typ G und D (230 V, 50 Hz)'],
      ['power', 'Powerbank, falls der Strom ausfällt'],
      ['kleidung', 'Eher zurückhaltende Kleidung; keine Tarn- oder Militärkleidung'],
      ['notruf', 'Notrufnummern gespeichert: 112, Polizei 191, Rettung 193']
    ] }
  ];
  var KEY = 'packliste';
  function load() { try { return (window.Shop && Shop.get(KEY, {})) || {}; } catch (e) { return {}; } }
  function persist(o) { try { if (window.Shop) Shop.set(KEY, o); } catch (e) {} }
  function init() {
    var host = document.getElementById('packliste');
    if (!host) return;
    var saved = load(), total = 0, html = '';
    GROUPS.forEach(function (g) {
      html += '<div class="pk-group"><h3>' + g.t + '</h3><ul class="pk-list">';
      g.i.forEach(function (it) {
        total++;
        html += '<li><label><input type="checkbox" data-pk="' + it[0] + '"' + (saved[it[0]] ? ' checked' : '') + '><span>' + it[1] + '</span></label></li>';
      });
      html += '</ul></div>';
    });
    host.innerHTML = '<p class="gd-progress" id="pk-text" role="status" aria-live="polite"></p><div class="pk-bar" aria-hidden="true"><span id="pk-fill"></span></div>' + html +
      '<p class="gd-actions"><button type="button" class="gd-reset" id="pk-reset">Zurücksetzen</button></p>';
    var boxes = [].slice.call(host.querySelectorAll('input[data-pk]'));
    function upd() {
      var n = boxes.filter(function (b) { return b.checked; }).length;
      document.getElementById('pk-text').textContent = n + ' von ' + total + ' eingepackt';
      document.getElementById('pk-fill').style.width = (100 * n / total) + '%';
    }
    function save() { var o = {}; boxes.forEach(function (b) { if (b.checked) o[b.getAttribute('data-pk')] = 1; }); persist(o); upd(); }
    boxes.forEach(function (b) { b.addEventListener('change', save); });
    document.getElementById('pk-reset').addEventListener('click', function () { boxes.forEach(function (b) { b.checked = false; }); save(); });
    upd();
  }
  function buy() {
    [].forEach.call(document.querySelectorAll('[data-buy]'), function (b) {
      b.addEventListener('click', function () {
        if (!window.Shop) { location.href = '../services.html#guides'; return; }
        Shop.addToCart({ item: b.getAttribute('data-buy') });
        Shop.toast('Im Warenkorb. Demo-Shop: nur Testzahlungen.');
      });
    });
  }
  function start() { init(); buy(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
